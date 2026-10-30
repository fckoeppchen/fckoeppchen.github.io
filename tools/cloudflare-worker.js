// Cloudflare Worker „fckoeppchen“: Live-Stand eines FuPa-Spiels für die App (index.html), fast ohne
// Verzögerung. Die App fragt hier statt über GitHub (dort bis zu 7 min: 2 min Takt + 5 min Cache).
// FuPa schickt keine CORS-Freigabe, darum der Umweg.
//
// Einrichten (einmal, im Cloudflare-Dashboard): Workers & Pages → Create → Worker → Name
// „fckoeppchen“ → Deploy → Edit code → diesen Inhalt ganz einfügen → Deploy. Die Adresse
// (https://fckoeppchen.<name>.workers.dev) kommt in index.html als WORKER_URL.
//
// Aufruf: GET /?slug=<FuPa-Spiel-Slug> oder GET /?anstoss=<ISO-Zeit aus dem FLF-Spielplan> —
// dann sucht der Worker das Spiel der Seniors 1 selbst bei FuPa (gleiche Zeit, sonst am selben
// Tag ±3 h). So hängt der Live-Kasten nicht daran, dass der GitHub-Lauf pünktlich startet.
// Nur Koeppchen-Spiele und Länderspiele Luxemburgs (kein offener Vermittler). Je Spiel höchstens eine FuPa-Abfrage alle 20 s.
// Zurück kommen nur die Felder, die die App braucht — Tore und Karten als Ereignislisten.
//
// Zeitplan (Plan B, 19.10.2026): GitHub startet seine geplanten Läufe unzuverlässig (am 18.10. fast
// alle ausgelassen). Darum stößt der Worker den FLF-Abruf selbst an — er holt nichts von der FLF, er
// drückt nur bei GitHub auf „Abruf starten“ (wie ein Handstart). GitHubs eigener Zeitplan bleibt als
// Reserve. Einrichten: Settings → Variables and Secrets → Secret GITHUB_TOKEN (Fine-grained Token,
// nur dieses Repo, Actions: Read and write); Settings → Triggers → Cron Triggers → „* * * * *“ (jede Minute; bis 21.10.2026 „*/15 * * * *“).
//
// Coach (seit 27.10.2026): ?coach=… — Trainer tragen eigene Spiele ein, siehe Abschnitt „Coach“ unten. Braucht D1 (Binding DB).

const API = "https://api.fupa.net/v1/matches/";
// Eine FuPa-Antwort gilt 60 s, für Handys und Mitteilungen gemeinsam (vom Nutzer, 24.10.2026; bis dahin 20 s
// und die Mitteilungen extra) — so fragt der Worker je Spiel höchstens einmal pro Minute bei FuPa.
const MERKEN_MS = 60e3;
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};
const gemerkt = new Map(); // slug → { t, roh } (je Worker-Instanz; geteilt wird über D1, fupa_spiel)

// Ein FuPa-Spiel, höchstens einmal pro MERKEN_MS: erst der Speicher dieser Instanz, dann D1 (Handy-Anfragen und
// der Minuten-Lauf laufen oft in verschiedenen Instanzen), dann FuPa. Gibt { t, f } (Abrufzeit, FuPa-JSON) oder null.
// FuPa nicht erreichbar → der letzte Stand, egal wie alt.
export async function fupaSpiel(slug, db, now = Date.now()) {
  let g = gemerkt.get(slug);
  if (g && now - g.t < MERKEN_MS) return { t: g.t, f: JSON.parse(g.roh) };
  if (db) try {
    await db.prepare("CREATE TABLE IF NOT EXISTS fupa_spiel (slug TEXT PRIMARY KEY, t INTEGER NOT NULL, roh TEXT NOT NULL)").run();
    const z = await db.prepare("SELECT t, roh FROM fupa_spiel WHERE slug = ?1").bind(slug).first();
    if (z && (!g || z.t > g.t)) { g = { t: z.t, roh: z.roh }; gemerkt.set(slug, g); }
    if (g && now - g.t < MERKEN_MS) return { t: g.t, f: JSON.parse(g.roh) };
  } catch (e) { console.log("fupa_spiel lesen:", e.message); }
  try {
    const r = await fetch(API + slug, { headers: { accept: "application/json" } });
    if (r.ok) {
      const roh = await r.text();
      JSON.parse(roh);
      g = { t: now, roh };
      gemerkt.set(slug, g);
      if (db) try {
        await db.prepare("INSERT OR REPLACE INTO fupa_spiel (slug, t, roh) VALUES (?1, ?2, ?3)").bind(slug, now, roh).run();
        await db.prepare("DELETE FROM fupa_spiel WHERE t < ?1").bind(now - 7 * 86400e3).run();
      } catch (e) { console.log("fupa_spiel schreiben:", e.message); }
    } else console.log("FuPa", slug, r.status);
  } catch (e) { console.log("FuPa", slug, e.message); }
  return g ? { t: g.t, f: JSON.parse(g.roh) } : null;
}
const gefunden = new Map(); // anstoss → { t, slug } — die Suche kostet zwei Seitenabrufe, 6 h merken

// FuPa-Spiel zum FLF-Anstoß. Kopie von passendesSpiel() in tools/fussball-live.mjs (Test prüft).
const tagLux = ms => new Date(ms).toLocaleDateString("sv-SE", { timeZone: "Europe/Luxembourg" });
export function passendesSpiel(fupaSpiele, anstoss) {
  const a = Date.parse(anstoss);
  const genau = fupaSpiele.find(x => Date.parse(x.kickoff) === a);
  if (genau) return genau;
  return fupaSpiele
    .filter(x => tagLux(Date.parse(x.kickoff)) === tagLux(a) && Math.abs(Date.parse(x.kickoff) - a) <= 3 * 3600e3)
    .sort((x, y) => Math.abs(Date.parse(x.kickoff) - a) - Math.abs(Date.parse(y.kickoff) - a))[0] || null;
}

// Saison aus dem Anstoß (ab Juli neue Saison) → „2026-27“ für den Teamslug „fc-koeppchen-m1-2026-27“.
export function saisonVon(anstoss) {
  const [j, m] = tagLux(Date.parse(anstoss)).split("-").map(Number);
  const y = m >= 7 ? j : j - 1;
  return y + "-" + String((y + 1) % 100).padStart(2, "0");
}

// Spielliste der Mannschaft über die Schnittstelle (`flavor=current`: die Spiele um jetzt herum,
// `past` als Rückfall). Erst lief das über die Webseite — die gab dem Worker bei Cloudflare aber
// nicht dasselbe wie einem normalen Abruf (18.10.2026: „spiel nicht gefunden“).
// `kurz`: FuPa-Mannschaft (m1 = Seniors 1, mr1/mr2 = Réserves I/II; seit 30.10.2026 auch die Reserven, für „📡 Live von FuPa“).
async function slugZu(anstoss, kurz = "m1") {
  const schl = kurz === "m1" ? anstoss : kurz + "|" + anstoss;
  const g = gefunden.get(schl);
  if (g && Date.now() - g.t < 6 * 3600e3) return g.slug;
  const team = `fc-koeppchen-${kurz}-` + saisonVon(anstoss);
  let slug = null;
  for (const flavor of ["current", "past"]) {
    const r = await fetch(`https://api.fupa.net/v1/teams/${team}/matches?flavor=${flavor}`, { headers: { accept: "application/json" } });
    if (!r.ok) continue;
    const spiele = await r.json();
    slug = Array.isArray(spiele) ? passendesSpiel(spiele, anstoss)?.slug || null : null;
    if (slug) break;
  }
  if (slug) gefunden.set(schl, { t: Date.now(), slug });
  return slug;
}

// Tore oder Karten aus FuPas `highlights` (type goal | card, subtype z. B. goal_headed,
// penalty_foul, card_red). Gleiches Format für beide, nach Minute sortiert.
function ereignisse(f, typ) {
  const heim = f.homeTeam?.slug;
  return (f.highlights || []).filter(x => x.type === typ).map(x => ({
    min: x.minute, plus: x.additionalMinute || 0,
    heim: x.team?.teamSlug === heim,
    name: [x.primaryRole?.firstName, x.primaryRole?.lastName].filter(Boolean).join(" ") || null,
    art: x.subtype || "",
  })).sort((a, b) => a.min - b.min || a.plus - b.plus);
}

export function kuerzen(f) {
  return {
    slug: f.slug,
    hs: f.homeGoal ?? null,
    as: f.awayGoal ?? null,
    section: f.section || "",
    period: f.live?.period || "",
    running: !!f.live?.running,
    minute: f.live?.minute ?? null,
    minuteAt: f.live?.lastTimestamp || null,
    tore: ereignisse(f, "goal"),
    karten: ereignisse(f, "card"),
    fehl: ereignisse(f, "penaltyfail"),   // verschossene Elfmeter (vom Nutzer, 23.10.2026), nur im Kasten, keine Mitteilung
    ticker: f.tickerAuthor?.name || null,
  };
}

function antwort(body, status = 200) {
  return new Response(body, {
    status,
    headers: { ...CORS, "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

const REPO = "fckoeppchen/fckoeppchen.github.io", WORKFLOW = "fussball.yml";

// Soll der Takt (alle 15 min, UTC) jetzt einen Abruf anstoßen? Wochenende: 8–22 Uhr Luxemburger Zeit,
// jede Viertelstunde (eigene Uhr, damit Sommer/Winter stimmt). Mo–Fr: 22:15 Luxemburger Zeit, nach
// GitHubs eigenem Abend-Lauf (19:17 UTC) — Reserve, falls der ausfällt. Dazu jeden Tag 23:30 und 7:00.
export function abrufFaellig(ms) {
  const teile = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Luxembourg", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(ms)).map(p => [p.type, p.value]));
  const h = +teile.hour, m = +teile.minute;
  if (m % 15) return false;
  // Jeden Abend 23:30: späte Länderspiele (20:45) und Abendspiele sind dann vorbei (vom Nutzer).
  if (h === 23 && m === 30) return true;
  // Jeden Morgen 7:00: was die FLF erst nach Mitternacht einträgt (19.10.: Seniors 2 nach 23:31), ist
  // dann da, wenn man aufsteht (vom Nutzer).
  if (h === 7 && m === 0) return true;
  // Jeden Mittag 12:00 (vom Nutzer, 27.10.2026): was die FLF vormittags einträgt (z. B. neue Pokalspiele), ist dann
  // nicht erst abends da. Am Wochenende liegt 12:00 ohnehin im Viertelstunden-Fenster.
  if (h === 12 && m === 0) return true;
  if (teile.weekday === "Sat" || teile.weekday === "Sun") return h >= 8 && (h < 22 || (h === 22 && m === 0));
  // Mo–Fr 22:15 Luxemburger Zeit (bis 20.10.2026: 20:15 UTC, das wäre im Winter 21:15 gewesen).
  return h === 22 && m === 15;
}

async function anstossen(env) {
  const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`, {
    method: "POST",
    headers: {
      authorization: "Bearer " + env.GITHUB_TOKEN,
      accept: "application/vnd.github+json",
      "user-agent": "fckoeppchen",
      "content-type": "application/json",
    },
    body: JSON.stringify({ ref: "main" }),
  });
  // 204 = gestartet. 401/403: Token abgelaufen oder falsch — dann läuft nur noch GitHubs Reserve.
  if (r.status !== 204) console.log("GitHub-Anstoß fehlgeschlagen:", r.status, await r.text());
  return r.status;
}

// ---- Anonymer Zähler (vom Nutzer, 20.10.2026) ----
// Die App meldet sich beim Öffnen: ?zaehle=1, dazu neu=1 beim ersten Mal am Tag (merkt sich das
// Handy selbst), reiter=<gewählter Reiter> und art=app|web (Home-Bildschirm oder Browser — die
// beiden haben getrennte Speicher, ein Handy mit beiden zählt also zweimal). Die Stunde nimmt der
// Worker selbst (Luxemburger Zeit). Gespeichert werden nur Zahlen je Tag, keine Kennung, keine
// Adresse. Speicher: Cloudflare D1, im Worker als Binding „DB“ (Settings → Bindings → D1).
// Dazu ?angesehen=1&reiter=… bei jedem Umschalten auf einen anderen Reiter; der Reiter beim
// Öffnen zählt dort mit, die Liste zeigt also alles, was angeschaut wurde.
// Ohne Binding tut der Zähler nichts. Ansehen: ?zahlen (die letzten 30 Tage).
const REITER_OK = /^[A-Za-zÀ-ÿ0-9 ]{1,20}$/;
// Namen in der Mitteilungs-Auswahl: wie Reiter, dazu „Seniors 1 · live“ (📡 Live von FuPa, 30.10.2026 — der Punkt fehlte erst, die Auswahl fiel still weg).
export const WAHL_OK = /^[A-Za-zÀ-ÿ0-9 ·]{1,24}$/;
const ARTEN = ["app", "web"];
export const stundeLux = ms => +new Date(ms).toLocaleString("en-GB", { timeZone: "Europe/Luxembourg", hour: "2-digit", hourCycle: "h23" });
export async function zaehlen(db, tag, neu, reiter, art = "", stunde = null, erst = false) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS tage (tag TEXT PRIMARY KEY, handys INTEGER NOT NULL DEFAULT 0, oeffnungen INTEGER NOT NULL DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS reiter (tag TEXT NOT NULL, reiter TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, reiter))"),
    db.prepare("CREATE TABLE IF NOT EXISTS arten (tag TEXT NOT NULL, art TEXT NOT NULL, handys INTEGER NOT NULL DEFAULT 0, oeffnungen INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, art))"),
    db.prepare("CREATE TABLE IF NOT EXISTS stunden (tag TEXT NOT NULL, stunde INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, stunde))"),
    db.prepare(TAB_ANGESEHEN),
    db.prepare("CREATE TABLE IF NOT EXISTS erste (tag TEXT NOT NULL, art TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, art))"),
  ]);
  const s = [db.prepare("INSERT INTO tage (tag, handys, oeffnungen) VALUES (?1, ?2, 1) ON CONFLICT(tag) DO UPDATE SET handys = handys + ?2, oeffnungen = oeffnungen + 1").bind(tag, neu ? 1 : 0)];
  if (reiter && REITER_OK.test(reiter))
    s.push(db.prepare("INSERT INTO reiter (tag, reiter, n) VALUES (?1, ?2, 1) ON CONFLICT(tag, reiter) DO UPDATE SET n = n + 1").bind(tag, reiter),
           db.prepare(PLUS_ANGESEHEN).bind(tag, reiter));
  if (ARTEN.includes(art))
    s.push(db.prepare("INSERT INTO arten (tag, art, handys, oeffnungen) VALUES (?1, ?2, ?3, 1) ON CONFLICT(tag, art) DO UPDATE SET handys = handys + ?3, oeffnungen = oeffnungen + 1").bind(tag, art, neu ? 1 : 0));
  // Erstes Öffnen auf diesem Gerät (je Speicher: Safari und Home-Bildschirm getrennt).
  if (erst) s.push(db.prepare("INSERT INTO erste (tag, art, n) VALUES (?1, ?2, 1) ON CONFLICT(tag, art) DO UPDATE SET n = n + 1").bind(tag, ARTEN.includes(art) ? art : "?"));
  if (Number.isInteger(stunde) && stunde >= 0 && stunde < 24)
    s.push(db.prepare("INSERT INTO stunden (tag, stunde, n) VALUES (?1, ?2, 1) ON CONFLICT(tag, stunde) DO UPDATE SET n = n + 1").bind(tag, stunde));
  await db.batch(s);
}
const TAB_ANGESEHEN = "CREATE TABLE IF NOT EXISTS angesehen (tag TEXT NOT NULL, reiter TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, reiter))";
const PLUS_ANGESEHEN = "INSERT INTO angesehen (tag, reiter, n) VALUES (?1, ?2, 1) ON CONFLICT(tag, reiter) DO UPDATE SET n = n + 1";
export async function ansehen(db, tag, reiter) {
  if (!reiter || !REITER_OK.test(reiter)) return;
  await db.batch([db.prepare(TAB_ANGESEHEN), db.prepare(PLUS_ANGESEHEN).bind(tag, reiter)]);
}
// Eigene Geräte (vom Nutzer, 21.10.2026): ein Handy, das in der App als „meins“ markiert ist, schickt
// ich=1 mit und landet nur hier, getrennt von allen anderen Zahlen.
const TAB_ICH = "CREATE TABLE IF NOT EXISTS ich (tag TEXT NOT NULL, was TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, was))";
// Nur die letzten 5 Tage (vom Nutzer, 30.10.2026): ältere Zeilen löscht jedes neue Zählen.
export const ICH_TAGE = 5;
export async function ichZaehlen(db, tag, was) {
  const ab = new Date(Date.parse(tag + "T12:00:00Z") - (ICH_TAGE - 1) * 864e5).toISOString().slice(0, 10);
  await db.batch([db.prepare(TAB_ICH), db.prepare("INSERT INTO ich (tag, was, n) VALUES (?1, ?2, 1) ON CONFLICT(tag, was) DO UPDATE SET n = n + 1").bind(tag, was),
    db.prepare("DELETE FROM ich WHERE tag < ?1").bind(ab)]);
}
// Andere Länder und Roboter (vom Nutzer, 22.10.2026): Kaum war die neue Adresse online, öffneten 8
// Scanner die App (Amazon, Google, Palo Alto, Singapur, Toronto, Amsterdam; teils „HeadlessChrome“),
// einige direkt nach dem Öffnen am Arbeitsplatz — Firmennetze prüfen neue Adressen selbst. Gezählt wird
// darum nur aus Luxemburg und den Nachbarländern; alles andere steht getrennt („fremd“), nichts geht verloren.
const NAH = new Set(["LU", "DE", "FR", "BE"]);
export function fremdGrund(req) {
  const ua = `${req.headers.get("user-agent") || ""} ${req.headers.get("sec-ch-ua") || ""}`;
  if (/HeadlessChrome|\bbot\b|bot\/|crawler|spider/i.test(ua) || req.cf?.verifiedBotCategory) return "Roboter";
  const land = req.cf?.country;
  return land && !NAH.has(land) ? land : "";   // ohne Land (Test, lokal) zählt normal
}
const TAB_FREMD = "CREATE TABLE IF NOT EXISTS fremd (tag TEXT NOT NULL, wer TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (tag, wer))";
export async function fremdZaehlen(db, tag, wer) {
  await db.batch([db.prepare(TAB_FREMD), db.prepare("INSERT INTO fremd (tag, wer, n) VALUES (?1, ?2, 1) ON CONFLICT(tag, wer) DO UPDATE SET n = n + 1").bind(tag, wer)]);
}
export async function zahlenSeite(db, zusatz = "") {
  const tage = (await db.prepare("SELECT tag, handys, oeffnungen FROM tage ORDER BY tag DESC LIMIT 30").all()).results || [];
  const ab = tage.at(-1)?.tag || "";
  // Ältere Datenbanken haben die Tabellen arten/stunden/angesehen erst nach dem ersten neuen Zählen.
  const alle = async (sql) => { try { return (await db.prepare(sql).bind(ab).all()).results || []; } catch (e) { return []; } };
  // Je Tag gespeichert; zusammengezählt wird hier — so gibt es dieselben Listen für 30 Tage und je Tag.
  const r = await alle("SELECT tag, reiter AS k, n FROM reiter WHERE tag >= ?1");
  const a = await alle("SELECT tag, art, handys, oeffnungen FROM arten WHERE tag >= ?1");
  const g = await alle("SELECT tag, reiter AS k, n FROM angesehen WHERE tag >= ?1");
  const h = await alle("SELECT tag, stunde AS k, n FROM stunden WHERE tag >= ?1");
  const e = await alle("SELECT tag, art, n FROM erste WHERE tag >= ?1");
  const ich = await alle("SELECT tag, was, n FROM ich WHERE tag >= ?1");
  const ichTage = [...new Set(ich.map(z => z.tag))].sort().reverse().slice(0, ICH_TAGE);
  const ichN = (tag, was) => ich.find(z => z.tag === tag && z.was === was)?.n || 0;
  const fremd = await alle("SELECT tag, wer, n FROM fremd WHERE tag >= ?1");
  const fremdTage = [...new Set(fremd.map(z => z.tag))].sort().reverse();
  const fremdZeile = t => { const l = fremd.filter(z => z.tag === t).sort((x, y) => y.n - x.n);
    return `<tr><td>${kurz(t)}</td><td>${l.reduce((n, z) => n + z.n, 0)}</td><td style="white-space:normal;text-align:left">${l.map(z => `${z.wer} ${z.n}`).join(", ")}</td></tr>`; };
  const neuAm = (tag, x) => e.filter(z => z.tag === tag && (!x || z.art === x)).reduce((s, z) => s + z.n, 0);
  // Am Handy passt die Haupttabelle sonst nicht in die Breite (vom Nutzer, 21.10.): Tag kurz, Neu nur
  // als Zahl — die Aufteilung App/Browser steht im aufklappbaren Tag.
  const neuText = tag => tag < "2026-10-21" ? "–" : String(neuAm(tag));   // gezählt ab 21.10.
  const neuTeil = tag => neuAm(tag) ? `, ${neuAm(tag)} neu (App ${neuAm(tag, "app")}, Browser ${neuAm(tag, "web")})` : "";
  const kurz = tag => { const [, m, d] = tag.split("-"); return `${new Date(tag + "T12:00:00Z").toLocaleDateString("de-DE", { weekday: "short", timeZone: "UTC" })} ${+d}.${+m}.`; };
  const summe = (zeilen, tag) => { const m = new Map(); for (const z of zeilen) if (!tag || z.tag === tag) m.set(z.k, (m.get(z.k) || 0) + z.n); return [...m]; };
  const liste = l => l.sort((x, y) => y[1] - x[1]).map(([k, n]) => `<tr><td>${k}</td><td>${n}</td></tr>`).join("") || "<tr><td>—</td></tr>";
  const uhr = l => { const max = Math.max(1, ...l.map(x => x[1]));
    return l.sort((x, y) => x[0] - y[0]).map(([k, n]) => `<tr><td>${String(k).padStart(2, "0")} Uhr</td><td>${n}</td><td class="bar"><span style="width:${Math.round(100 * n / max)}%"></span></td></tr>`).join("") || "<tr><td>—</td></tr>"; };
  const teile = (tag, was) => `<h3>Uhrzeit der Öffnungen${was}</h3><table>${uhr(summe(h, tag))}</table>
<h3>Reiter angesehen (Öffnen und Umschalten${was})</h3><table>${liste(summe(g, tag))}</table>
<h3>Reiter beim Öffnen${was}</h3><table>${liste(summe(r, tag))}</table>`;
  const art = (tag, x) => { const z = a.find(y => y.tag === tag && y.art === x); return z ? `${z.handys} / ${z.oeffnungen}` : "–"; };
  const zeile = t => `<tr><td>${kurz(t.tag)}</td><td>${t.handys}</td><td>${t.oeffnungen}</td><td>${art(t.tag, "app")}</td><td>${art(t.tag, "web")}</td><td>${neuText(t.tag)}</td></tr>`;
  const jeTag = tage.map((t, i) => `<details${i ? "" : " open"}><summary>${kurz(t.tag)} · ${t.handys} Handys, ${t.oeffnungen} Öffnungen${neuTeil(t.tag)}</summary>${teile(t.tag, "")}</details>`).join("");
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FC Koeppchen · Zahlen</title><style>body{font-family:system-ui,sans-serif;margin:16px;color:#111}table{border-collapse:collapse;width:100%;max-width:520px}
td,th{padding:6px 6px;border-bottom:1px solid #ddd;text-align:right;white-space:nowrap}td:first-child,th:first-child{text-align:left}h2{margin-top:28px}h3{font-size:15px;margin:16px 0 4px}
td.ok2{color:#0f7a65;font-weight:600}td.warn{color:#c0392b}table.haupt{font-size:14px}table.haupt td,table.haupt th{padding:6px 3px}.breit{overflow-x:auto}
td.bar{width:50%;text-align:left}td.bar span{display:inline-block;height:10px;background:#1aa39a;border-radius:2px}
table.mitt td,table.mitt th{white-space:normal;vertical-align:top;font-size:13px;text-align:left}table.mitt small{color:#666}
details{max-width:520px;border:1px solid #ddd;border-radius:10px;padding:8px 12px;margin:8px 0}summary{cursor:pointer;font-weight:700;color:#0f7a65}summary.tagmitt{color:#111}summary.tagmitt.ok2{color:#0f7a65}summary.tagmitt.warn{color:#c0392b}</style>
<h1>FC Koeppchen · Zahlen</h1><p>Handys = verschiedene Handys am Tag, Öffn. = Öffnungen, also Starts (oder zurück nach ≥ 30 min).
App = vom Home-Bildschirm, Browser = in Safari o. Ä., je „Handys / Öffnungen“. Wer beides benutzt, zählt bei den Handys zweimal.
Neu = zum allerersten Mal geöffnet (gezählt ab 21.10.2026); wer die App aus Safari auf den Home-Bildschirm legt, ist dort noch einmal neu.</p>
<div class="breit"><table class="haupt"><tr><th>Tag</th><th>Handys</th><th>Öffn.</th><th>App</th><th>Browser</th><th>Neu</th></tr>${tage.map(zeile).join("") || "<tr><td colspan=6>noch nichts gezählt</td></tr>"}</table></div>
<h2>Je Tag</h2>${jeTag || "<p>—</p>"}
<h2>Alle 30 Tage zusammen</h2>${teile("", ", dieselben Tage")}
<h2>Eigene Geräte (nicht mitgezählt)</h2><p>Geräte, die in der App als eigenes markiert sind (5× auf „Gemacht von …“ tippen). Sie stehen nur hier, die letzten ${ICH_TAGE} Tage.</p>
<table><tr><th>Tag</th><th>Öffnungen</th><th>Umschalten</th></tr>${ichTage.map(t => `<tr><td>${kurz(t)}</td><td>${ichN(t, "oeffnung")}</td><td>${ichN(t, "umschalten")}</td></tr>`).join("") || "<tr><td colspan=3>—</td></tr>"}</table>
<h2>Andere Länder und Roboter (nicht mitgezählt)</h2><p>Öffnen und Umschalten von außerhalb Luxemburgs und der Nachbarländer (DE, FR, BE) und von erkannten Robotern. Meist Scanner, die neue Seiten prüfen; ein Vereinsmitglied im Urlaub stünde auch hier.</p>
<table><tr><th>Tag</th><th>Abrufe</th><th style="text-align:left">woher</th></tr>${fremdTage.map(fremdZeile).join("") || "<tr><td colspan=3>—</td></tr>"}</table>
${zusatz}`;
}

// ---- Mitteilungen (Web Push), Stufe 1: nur Erlauben und Test-Mitteilung (vom Nutzer, 21.10.2026) ----
// Die App meldet ein Abo an (?push=anmelden, POST mit dem Abo als Text), der Worker merkt es sich in
// D1 (Tabelle abos) und schickt auf ?push=test genau diesem Abo eine Test-Mitteilung. Schlüssel
// (VAPID) erzeugt der Worker beim ersten Mal selbst und legt sie in D1 ab — nichts einzufügen.
// Verschlüsselung nach RFC 8291 (aes128gcm), Anmeldung beim Push-Dienst nach RFC 8292 (VAPID).
const PUSH_DIENST = /^https:\/\/([a-z0-9-]+\.)*(push\.apple\.com|fcm\.googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com)\//;
const PUSH_ABSENDER = "https://fckoeppchen.github.io/";
const b64u = b => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4)), c => c.charCodeAt(0));
const verbinden = (...t) => { const r = new Uint8Array(t.reduce((n, x) => n + x.length, 0)); let o = 0; for (const x of t) { r.set(x, o); o += x.length; } return r; };
async function hmac(schl, daten) {
  const k = await crypto.subtle.importKey("raw", schl, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, daten));
}
const TAB_ABOS = "CREATE TABLE IF NOT EXISTS abos (endpoint TEXT PRIMARY KEY, abo TEXT NOT NULL, test INTEGER NOT NULL DEFAULT 1, seit TEXT NOT NULL)";
// Schlüssel und VAPID-Kopf je Push-Dienst bleiben im Speicher, solange der Worker wach ist: spart je
// Mitteilung eine Datenbankabfrage und eine Unterschrift (Rechenzeit, vom Nutzer: Pakete klein, sicher).
let SCHLUESSEL = null;
const KOEPFE = new Map(); // Herkunft des Push-Dienstes → { kopf, bis }
export async function vapid(db) {
  if (SCHLUESSEL) return SCHLUESSEL;
  await db.prepare("CREATE TABLE IF NOT EXISTS push_schluessel (id INTEGER PRIMARY KEY, privat TEXT NOT NULL, oeffentlich TEXT NOT NULL)").run();
  const lesen = () => db.prepare("SELECT privat, oeffentlich FROM push_schluessel WHERE id = 1").first();
  let z = await lesen();
  if (!z) {
    const k = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    // OR IGNORE: kommen zwei erste Aufrufe gleichzeitig, gewinnt einer, beide lesen danach denselben.
    await db.prepare("INSERT OR IGNORE INTO push_schluessel (id, privat, oeffentlich) VALUES (1, ?1, ?2)")
      .bind(JSON.stringify(await crypto.subtle.exportKey("jwk", k.privateKey)), b64u(await crypto.subtle.exportKey("raw", k.publicKey))).run();
    z = await lesen();
  }
  return (SCHLUESSEL = z);
}
export async function vapidKopf(z, endpoint, jetzt = Date.now()) {
  const te = new TextEncoder(), teil = o => b64u(te.encode(JSON.stringify(o)));
  const ohne = teil({ typ: "JWT", alg: "ES256" }) + "." + teil({ aud: new URL(endpoint).origin, exp: Math.floor(jetzt / 1000) + 12 * 3600, sub: PUSH_ABSENDER });
  const k = await crypto.subtle.importKey("jwk", JSON.parse(z.privat), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, k, te.encode(ohne));
  return `vapid t=${ohne}.${b64u(sig)}, k=${z.oeffentlich}`;
}
export async function verschluesseln(abo, text) {
  const te = new TextEncoder(), eins = new Uint8Array([1]);
  const uaPub = unb64u(abo.keys.p256dh), auth = unb64u(abo.keys.auth);
  const as = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const asPub = new Uint8Array(await crypto.subtle.exportKey("raw", as.publicKey));
  const ua = await crypto.subtle.importKey("raw", uaPub, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const geheim = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: ua }, as.privateKey, 256));
  const ikm = await hmac(await hmac(auth, geheim), verbinden(te.encode("WebPush: info\0"), uaPub, asPub, eins));
  const salz = crypto.getRandomValues(new Uint8Array(16));
  const prk = await hmac(salz, ikm);
  const cek = (await hmac(prk, verbinden(te.encode("Content-Encoding: aes128gcm\0"), eins))).slice(0, 16);
  const nonce = (await hmac(prk, verbinden(te.encode("Content-Encoding: nonce\0"), eins))).slice(0, 12);
  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const inhalt = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, verbinden(te.encode(text), new Uint8Array([2]))));
  const kopf = new Uint8Array(21);
  kopf.set(salz); new DataView(kopf.buffer).setUint32(16, 4096); kopf[20] = 65;
  return verbinden(kopf, asPub, inhalt);
}
// Die Unterschrift gilt 12 h; nach 6 h kommt eine neue (genug Abstand zum Ablauf).
async function kopfFuer(z, endpoint, jetzt = Date.now()) {
  const her = new URL(endpoint).origin, k = KOEPFE.get(her);
  if (k && k.oeff === z.oeffentlich && k.bis > jetzt) return k.kopf;
  const kopf = await vapidKopf(z, endpoint, jetzt);
  KOEPFE.set(her, { kopf, oeff: z.oeffentlich, bis: jetzt + 6 * 3600e3 });
  return kopf;
}
export async function pushSenden(db, abo, nachricht, ttl = 3600) {
  const z = await vapid(db);
  return fetch(abo.endpoint, {
    method: "POST",
    headers: { authorization: await kopfFuer(z, abo.endpoint), "content-encoding": "aes128gcm", "content-type": "application/octet-stream", ttl: String(ttl), urgency: "normal" },
    body: await verschluesseln(abo, JSON.stringify(nachricht)),
  });
}
const aboOk = a => a && typeof a.endpoint === "string" && a.endpoint.length < 1000 && PUSH_DIENST.test(a.endpoint)
  && typeof a.keys?.p256dh === "string" && a.keys.p256dh.length < 200 && typeof a.keys?.auth === "string" && a.keys.auth.length < 100;
const zuletztGetestet = new Map(); // endpoint → Zeit, höchstens ein Test je 20 s
// Höchstzahl der angemeldeten Handys (vom Nutzer, 23.10.2026: schrittweise freigeben). Ändern ohne neuen Code:
// bei Cloudflare unter Settings → Variables eine Variable MAX_ABOS anlegen (z. B. 100). Ohne sie gilt 50.
export const MAX_ABOS = 50;
export async function pushAnfrage(req, db, was, env = {}) {
  if (was === "schluessel") return antwort(JSON.stringify({ schluessel: (await vapid(db)).oeffentlich }));
  // Empfangsbestätigung (vom Nutzer, 23.10.2026): der Service Worker meldet „angekommen“, ohne Kennung des
  // Handys. Gezählt wird nur bei Mitteilungen, die es wirklich gab.
  if (was === "angekommen") {
    const id = new URL(req.url).searchParams.get("id") || "";
    if (id && id.length < 200) try { await gemeldetSpalten(db); await db.prepare("UPDATE gemeldet SET angekommen = COALESCE(angekommen, 0) + 1 WHERE id = ?1").bind(id).run(); } catch (e) {}
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") return antwort('{"fehler":"post"}', 405);
  let x; try { x = JSON.parse(await req.text()); } catch (e) { return antwort('{"fehler":"json"}', 400); }
  await db.prepare(TAB_ABOS).run();
  if (was === "anmelden") {
    if (!aboOk(x)) return antwort('{"fehler":"abo"}', 400);
    const abo = { endpoint: x.endpoint, keys: { p256dh: x.keys.p256dh, auth: x.keys.auth } };
    const schon = await db.prepare("SELECT endpoint FROM abos WHERE endpoint = ?1").bind(abo.endpoint).first();
    const max = Number(env.MAX_ABOS) > 0 ? Number(env.MAX_ABOS) : MAX_ABOS;
    if (!schon && ((await db.prepare("SELECT COUNT(*) AS n FROM abos").first())?.n || 0) >= max) return antwort('{"fehler":"voll"}', 409);
    await db.prepare("INSERT OR REPLACE INTO abos (endpoint, abo, test, seit) VALUES (?1, ?2, 1, ?3)").bind(abo.endpoint, JSON.stringify(abo), new Date().toISOString()).run();
    return antwort('{"ok":true}');
  }
  const z = typeof x.endpoint === "string" ? await db.prepare("SELECT abo FROM abos WHERE endpoint = ?1").bind(x.endpoint).first() : null;
  if (was === "abmelden") {
    if (z) await db.prepare("DELETE FROM abos WHERE endpoint = ?1").bind(x.endpoint).run();
    return antwort('{"ok":true}');
  }
  if (was === "test") {
    if (!z) return antwort('{"fehler":"nicht angemeldet"}', 404);
    if (Date.now() - (zuletztGetestet.get(x.endpoint) || 0) < 20e3) return antwort('{"fehler":"zu schnell"}', 429);
    zuletztGetestet.set(x.endpoint, Date.now());
    const r = await pushSenden(db, JSON.parse(z.abo), { titel: "Test-Mitteilung ✓", text: "So sehen Mitteilungen der App aus.", url: "./" });
    // 404/410: Abo gibt es beim Push-Dienst nicht mehr (abgemeldet, App gelöscht) → vergessen.
    if (r.status === 404 || r.status === 410) await db.prepare("DELETE FROM abos WHERE endpoint = ?1").bind(x.endpoint).run();
    if (r.status >= 300) console.log("Push:", r.status, await r.text());
    return antwort(JSON.stringify({ ok: r.status < 300, status: r.status }), r.status < 300 ? 200 : 502);
  }
  if (was === "wahl") {
    if (!z) return antwort('{"fehler":"nicht angemeldet"}', 404);
    // Je Mannschaft ihre Arten (vom Nutzer, 21.10.2026): { je: { "U13 2": ["tabelle"] } }.
    const je = {};
    for (const [t, a] of Object.entries(x.je && typeof x.je === "object" ? x.je : {}).slice(0, 30))
      if (WAHL_OK.test(t) && Array.isArray(a)) je[t] = a.filter(k => MITT_ARTEN.includes(k));
    await abosSpalte(db);
    await db.prepare("UPDATE abos SET wahl = ?2 WHERE endpoint = ?1").bind(x.endpoint, JSON.stringify({ je })).run();
    return antwort('{"ok":true}');
  }
  return antwort('{"fehler":"push"}', 400);
}

// ---- Mitteilungen, Stufe 2 (vom Nutzer, 21.10.2026): echte Meldungen ----
// Jede Minute (Cron): data/mitteilungen.json lesen (schreibt der FLF-Abruf, tools/mitteilungen.mjs),
// dazu für die Spiele des Tages mit Ticker selbst bei FuPa nachsehen (Liveticker läuft, Endstand).
// Gesendet wird nur 7–23 Uhr Luxemburger Zeit (bis 23 seit 23.10.2026, vom Nutzer: Endstände der Abendspiele
// noch am selben Abend); was nachts fällig wird, wartet bis 7 Uhr (solange
// `bis` nicht vorbei ist). Jede id geht nur einmal raus (Tabelle gemeldet).
const MITT_URL = "https://raw.githubusercontent.com/fckoeppchen/fckoeppchen.github.io/main/data/mitteilungen.json";
const MITT_ARTEN = ["heute", "spieltag", "tabelle", "uhrzeit", "neu", "ticker", "halbzeit", "ende", "woche", "tor", "trainer"];
// Tore als Mitteilung (vom Nutzer, 23.10.2026; in der App vorerst nur mit eigenem Code wählbar): FuPas Tore mit eigener
// id und Stand nach dem Tor. Nur Tore der letzten 20 min — sonst kämen nach einem Neustart oder spät gefundenem Spiel alle alten.
export const toreRoh = f => (f.highlights || []).filter(x => x.type === "goal" && x.id != null)
  .map(x => ({ id: x.id, min: x.minute, plus: x.additionalMinute || 0, hs: x.homeGoal, as: x.awayGoal, zeit: Date.parse(x.date) || 0,
               name: [x.primaryRole?.firstName, x.primaryRole?.lastName].filter(Boolean).join(" ") || null }));
async function abosSpalte(db) {
  await db.prepare(TAB_ABOS).run();
  try { await db.prepare("ALTER TABLE abos ADD COLUMN wahl TEXT").run(); } catch (e) { /* gibt es schon */ }
}
// Wer bekommt ein Ereignis? Bei einer seiner Mannschaften ist genau diese Art angehakt.
// Die alte Form (eine Mannschaftsliste, eine Artenliste für alle) gilt weiter, bis die App neu speichert.
export function passtZu(wahl, e) {
  if (!wahl) return false;
  if (wahl.je) return e.reiter.some(r => (wahl.je[r] || []).includes(e.art));
  if (!Array.isArray(wahl.teams) || !e.reiter.some(r => wahl.teams.includes(r))) return false;
  return e.art === "woche" || (wahl.arten || []).includes(e.art);
}
// Will ein Abo von diesem Live-Spiel überhaupt etwas (Ticker, Halbzeit, Tor, Endstand)?
export function liveGewollt(abos, c) {
  return abos.some(a => { let w = null; try { w = JSON.parse(a.wahl); } catch (e) {}
    return LIVE_ARTEN.some(art => passtZu(w, { reiter: c.reiter, art })); });
}
export const tagzeit = ms => { const h = stundeLux(ms); return h >= 7 && h < 23; };
// Liveticker und Endstand für ein Spiel des Tages (Kandidat aus mitteilungen.json → live).
export function liveEreignisse(c, k, now) {
  const aus = [], d = Date.parse(c.d);
  if (k.section === "LIVE" && (k.hs != null || k.ticker || k.tore.length))
    aus.push({ id: c.ticker, reiter: c.reiter, art: "ticker", titel: `${c.titel} · Liveticker`,
               text: `Heute tickert FuPa das Spiel gegen ${c.gegner} – live in der App.`, ab: now, bis: d + 180 * 60e3 });
  // FuPa führt Heim/Gast manchmal andersherum als die FLF (Beggen–Koeppchen II): Zahlen nach FLF drehen.
  const gleich = (k.slug || "").startsWith(c.fupaWir) === c.wirHeim;
  const stand = (hs = k.hs, as = k.as) => { const [h, a] = gleich ? [hs, as] : [as, hs]; return `${c.h} ${h}:${a} ${c.a}`; };
  if (k.section === "LIVE" || k.section === "POST")
    for (const t of k.toreRoh || []) if (t.hs != null && t.as != null && t.zeit > now - 20 * 60e3)
      aus.push({ id: `tor:${c.id}:${t.id}`, reiter: c.reiter, art: "tor", titel: `${c.titel} · Tor ⚽`,
                 text: stand(t.hs, t.as) + ` · ${t.min}.${t.plus ? "+" + t.plus : ""}` + (t.name ? ` ${t.name}` : ""), ab: now, bis: d + 180 * 60e3 });
  // Halbzeit (vom Nutzer, 21.10.2026): nur mit Stand, also nur wenn wirklich getickert wird.
  if (k.section === "LIVE" && k.period === "halftime" && k.hs != null && k.as != null)
    aus.push({ id: c.halbzeit || "halbzeit:" + c.id, reiter: c.reiter, art: "halbzeit", titel: `${c.titel} · Halbzeit`, text: stand(), ab: now, bis: d + 180 * 60e3 });
  if (k.section === "POST" && k.hs != null && k.as != null)
    aus.push({ id: c.ende, reiter: c.reiter, art: "ende", titel: `${c.titel} · Endstand`, text: stand(), ab: now, bis: now + 18 * 3600e3 });
  return aus;
}
async function gemeldetSpalten(db) {
  for (const sp of ["titel TEXT", "ab INTEGER", "an INTEGER", "passend INTEGER", "fehler TEXT", "verpasst INTEGER", "angekommen INTEGER", "text TEXT"])
    try { await db.prepare("ALTER TABLE gemeldet ADD COLUMN " + sp).run(); } catch (e) { /* gibt es schon */ }
}
// Übersicht auf der Zahlen-Seite (vom Nutzer, 21.10.2026): was geplant war, was rausging, an wie viele
// Handys, was schiefging — nicht nur „was ging raus“, sonst sähe man Lücken nicht.
const zeitLux = ms => new Date(ms).toLocaleString("de-DE", { timeZone: "Europe/Luxembourg", weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" });
export function mittStatus(e, g, now, wartend = 0) {
  if (g?.verpasst) return "✗ nicht verschickt (abgelaufen" + (g.ab && !tagzeit(g.ab) ? ", war nachts fällig" : "") + ")";
  const fehler = g?.fehler ? ` · Fehler: ${g.fehler}` : "";
  if (g && wartend) return `⏳ wird verschickt: ${g.an || 0} von ${g.passend ?? "?"} Handys, ${wartend} warten` + fehler;
  // Haken wie beim Messenger (vom Nutzer, 31.10.2026): ✓ = an alle verschickt, ✓✓ = auch überall angekommen (Quittung von sw.js),
  // ⚠️ = nicht an alle verschickt (Fehler). So sieht man auf einen Blick, wo man genauer hinschauen muss.
  if (g) {
    const alle = g.passend > 0 && (g.an || 0) >= g.passend, da = alle && (g.angekommen || 0) >= g.passend;
    const zeichen = !g.passend ? "–" : da ? "✓✓" : alle ? "✓" : "⚠️";
    return `${zeichen} ${zeitLux(g.zeit)} an ${g.an ?? "?"} von ${g.passend ?? "?"} Handys` + (g.passend === 0 ? " (niemand hat es angehakt)" : "")
      + (g.angekommen ? ` · angekommen auf ${g.angekommen}` : "") + fehler;
  }
  if (e.ab > now) return "⏳ wartet";
  if (!tagzeit(now)) return "🌙 wartet bis 7 Uhr";
  return "⏳ geht in der nächsten Minute raus";
}
export async function mitteilungenStand(db, datei, now = Date.now()) {
  const alle = async sql => { try { return (await db.prepare(sql).all()).results || []; } catch (e) { return []; } };
  const abos = await alle("SELECT wahl FROM abos");
  const offen = (await alle("SELECT ereignis FROM offen")).map(z => JSON.parse(z.ereignis));
  const gem = new Map((await alle("SELECT * FROM gemeldet")).filter(g => g.zeit > now - 7 * 24 * 3600e3).map(g => [g.id, g]));
  const wartend = new Map((await alle("SELECT id, COUNT(*) AS n FROM postausgang GROUP BY id")).map(z => [z.id, z.n]));
  const ev = new Map();
  for (const e of [...(datei?.ereignisse || []), ...offen]) ev.set(e.id, e);
  for (const [id, g] of gem) if (!ev.has(id)) ev.set(id, { id, titel: g.titel || id, text: g.text || "", ab: g.ab || g.zeit });   // Text seit 23.10. mit gespeichert
  // Je Tag aufklappbar (vom Nutzer, 30.10.2026), heute offen. Tag grün = alles ✓✓ (oder niemand angehakt),
  // rot nur bei einem Fehler (⚠️, ✗) — „solange keine Fehlermeldung dasteht, ist alles ok“; sonst ohne Farbe.
  const tage = new Map();
  for (const e of [...ev.values()].sort((a, b) => b.ab - a.ab).slice(0, 300)) {
    const st = mittStatus(e, gem.get(e.id), now, wartend.get(e.id) || 0), t = tagLux(e.ab);
    (tage.get(t) || tage.set(t, []).get(t)).push({ e, st });
  }
  const heute = tagLux(now);
  const zeilen = [...tage].map(([t, l]) => {
    const farbe = l.some(z => /^(⚠|✗)/.test(z.st)) ? " warn" : l.every(z => /^(✓✓|–)/.test(z.st)) ? " ok2" : "";
    const name = new Date(t + "T12:00:00Z").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" });
    return `<details${t >= heute ? " open" : ""}><summary class="tagmitt${farbe}">${name} · ${l.length} ${l.length === 1 ? "Mitteilung" : "Mitteilungen"}</summary><table class="mitt"><tr><th>Mitteilung</th><th>fällig ab</th><th>Stand</th></tr>`
      + l.map(({ e, st }) => `<tr><td>${esc(e.titel)}${e.text ? `<br><small>${esc(e.text)}</small>` : ""}</td><td>${zeitLux(e.ab)}</td><td class="st${st.startsWith("✓✓") ? " ok2" : st.startsWith("⚠") || st.startsWith("✗") ? " warn" : ""}">${esc(st)}</td></tr>`).join("") + "</table></details>";
  }).join("");
  // Gewählt je Mannschaft und Art, als Anzahl Handys (wer was gewählt hat, steht nirgends).
  const ART_KURZ = { heute: "Spiel steht an", neu: "Neue Phase/Spiel", spieltag: "Spieltag", tabelle: "Tabelle", uhrzeit: "Uhrzeit",
    ticker: "Ticker", halbzeit: "Halbzeit", ende: "Endstand", woche: "Woche", tor: "Tore", trainer: "Trainer" };
  const zahl = new Map();
  for (const a of abos) {
    let w = null; try { w = JSON.parse(a.wahl); } catch (e) {}
    const je = w?.je || Object.fromEntries((w?.teams || []).map(t => [t, w.arten || []]));
    for (const [t, l] of Object.entries(je)) { const m = zahl.get(t) || zahl.set(t, new Map()).get(t); for (const k of l) m.set(k, (m.get(k) || 0) + 1); }
  }
  const gewaehlt = [...zahl].map(([t, m]) => `<tr><td>${esc(t)}</td><td class="st">${[...m].map(([k, n]) => esc(ART_KURZ[k] || k) + (abos.length > 1 ? ` ${n}` : "")).join(" · ") || "—"}</td></tr>`).join("");
  const live = (datei?.live || []).map(c => `<li>${esc(c.titel)}: ${zeitLux(Date.parse(c.d))} gegen ${esc(c.gegner)} — FuPa wird vom Anpfiff bis 3 h danach jede Minute geprüft, ${liveGewollt(abos, c) ? "ein Handy hat es gewählt" : "aber nur, wenn ein Handy es wählt (gerade keins)"}${c.slug || c.anstoss ? "" : " (noch ohne FuPa-Spiel)"}</li>`).join("");
  return `<h2>Mitteilungen</h2><p>${abos.length} ${abos.length === 1 ? "Handy" : "Handys"} angemeldet, davon ${abos.filter(a => a.wahl).length} mit Auswahl. Gesendet wird 7–23 Uhr.</p>
<h3>Gewählt${abos.length > 1 ? " (Zahl = so viele Handys)" : ""}</h3><table class="mitt">${gewaehlt || "<tr><td>noch nichts</td></tr>"}</table>
${live ? `<h3>Heute mit Liveticker</h3><ul>${live}</ul>` : ""}
<h3>Geplant und verschickt (7 Tage)</h3>${zeilen || "<p>noch nichts geplant</p>"}`;
}
const esc = t => String(t ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Handys je Minute (vom Nutzer: lieber klein und sicher). Erst nach Messung im Cloudflare-Dashboard erhöhen.
export const PAKET = 10;
const LIVE_ARTEN = ["ticker", "halbzeit", "ende", "tor"];
export async function mitteilungenSenden(db, now = Date.now()) {
  await abosSpalte(db);
  const abos = (await db.prepare("SELECT endpoint, abo, wahl FROM abos WHERE wahl IS NOT NULL").all()).results || [];
  if (!abos.length) return { gesendet: 0 };
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS gemeldet (id TEXT PRIMARY KEY, zeit INTEGER NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS offen (id TEXT PRIMARY KEY, ereignis TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS postausgang (id TEXT NOT NULL, endpoint TEXT NOT NULL, nachricht TEXT NOT NULL, bis INTEGER NOT NULL, prio INTEGER NOT NULL, zeit INTEGER NOT NULL, PRIMARY KEY (id, endpoint))"),
  ]);
  await gemeldetSpalten(db);
  let datei = { ereignisse: [], live: [] };
  try { const r = await fetch(MITT_URL, { headers: { "cache-control": "no-cache" } }); if (r.ok) datei = await r.json(); } catch (e) { console.log("Mitteilungen lesen:", e.message); }
  const schon = async id => !!(await db.prepare("SELECT id FROM gemeldet WHERE id = ?1").bind(id).first());
  // Live: Spiele vom Anpfiff bis 3 h danach, eine FuPa-Abfrage je Spiel und Takt (jede Minute, vom
  // Nutzer: „Ticker läuft“ soll gleich kommen, nicht erst nach 15 min). Den Slug der Seniors 1 sucht
  // der Worker einmal und merkt ihn in D1 (live_slug), sonst kostete jede Minute zwei Abrufe mehr.
  await db.prepare("CREATE TABLE IF NOT EXISTS live_slug (anstoss TEXT PRIMARY KEY, slug TEXT NOT NULL)").run();
  for (const c of datei.live || []) {
    const d = Date.parse(c.d);
    if (now < d || now > d + 180 * 60e3) continue;
    if ((await schon(c.ende))) continue;
    // FuPa nur fragen, wenn ein Handy für dieses Spiel Live-Mitteilungen gewählt hat (30.10.2026: „📡 Live von FuPa“ hat nur,
    // wer den eigenen oder den Familien-Code hat) — sonst keine einzige Anfrage.
    if (!liveGewollt(abos, c)) continue;
    try {
      let slug = c.slug;
      if (!slug && c.anstoss) {
        const schl = !c.fupaTeam || c.fupaTeam === "m1" ? c.anstoss : c.fupaTeam + "|" + c.anstoss;
        slug = (await db.prepare("SELECT slug FROM live_slug WHERE anstoss = ?1").bind(schl).first())?.slug;
        if (!slug && (slug = await slugZu(c.anstoss, c.fupaTeam || "m1"))) await db.prepare("INSERT OR REPLACE INTO live_slug (anstoss, slug) VALUES (?1, ?2)").bind(schl, slug).run();
      }
      if (!slug) continue;
      const sp = await fupaSpiel(slug, db, now);
      if (!sp) continue;
      const f = sp.f;
      // Schon Verschicktes nicht jede Minute neu in die Warteschlange legen (sparte nur Schreibzugriffe).
      for (const e of liveEreignisse(c, { ...kuerzen(f), toreRoh: toreRoh(f) }, now))
        if (!(await schon(e.id))) await db.prepare("INSERT OR IGNORE INTO offen (id, ereignis) VALUES (?1, ?2)").bind(e.id, JSON.stringify(e)).run();
    } catch (e) { console.log("Live", c.id, e.message); }
  }
  const offen = ((await db.prepare("SELECT ereignis FROM offen").all()).results || []).map(z => JSON.parse(z.ereignis));
  let gesendet = 0;
  for (const e of [...(datei.ereignisse || []), ...offen]) {
    if (e.bis <= now) {
      // Abgelaufen, ohne rauszugehen (z. B. nachts fällig und vor 7 Uhr vorbei): für die Übersicht festhalten.
      if (!(await schon(e.id))) await db.prepare("INSERT OR IGNORE INTO gemeldet (id, zeit, titel, ab, verpasst) VALUES (?1, ?2, ?3, ?4, 1)").bind(e.id, now, e.titel, e.ab).run();
      await db.prepare("DELETE FROM offen WHERE id = ?1").bind(e.id).run();
      continue;
    }
    if (e.ab > now || !tagzeit(now) || await schon(e.id)) continue;
    // Fällig: als gemeldet eintragen und je passendem Handy eine Zeile in den Postausgang. Verschickt wird
    // unten in kleinen Paketen (vom Nutzer, 23.10.2026: „brauchen nicht gleichzeitig anzukommen“).
    // Erst eintragen, dann senden: lieber eine Mitteilung verpasst als zehnmal dieselbe.
    const nachricht = JSON.stringify({ titel: e.titel, text: e.text, tag: e.id, url: "./", q: e.id });
    const zeilen = [];
    for (const a of abos) {
      let wahl = null; try { wahl = JSON.parse(a.wahl); } catch (x) {}
      if (passtZu(wahl, e)) zeilen.push(db.prepare("INSERT OR IGNORE INTO postausgang (id, endpoint, nachricht, bis, prio, zeit) VALUES (?1, ?2, ?3, ?4, ?5, ?6)")
        .bind(e.id, a.endpoint, nachricht, e.bis, LIVE_ARTEN.includes(e.art) ? 0 : 1, now));
    }
    await db.batch([db.prepare("INSERT OR IGNORE INTO gemeldet (id, zeit, titel, ab, an, passend, text) VALUES (?1, ?2, ?3, ?4, 0, ?5, ?6)").bind(e.id, now, e.titel, e.ab, zeilen.length, e.text || null),
                    db.prepare("DELETE FROM offen WHERE id = ?1").bind(e.id), ...zeilen]);
  }
  // Postausgang: je Takt höchstens PAKET Handys, Live (Ticker, Halbzeit, Endstand) zuerst, sonst der Reihe nach.
  if (tagzeit(now)) {
    const paket = ((await db.prepare("SELECT id, endpoint, nachricht, bis FROM postausgang ORDER BY prio, zeit LIMIT ?1").bind(PAKET).all()).results || []);
    const aboVon = new Map(abos.map(a => [a.endpoint, a.abo]));
    for (const p of paket) {
      await db.prepare("DELETE FROM postausgang WHERE id = ?1 AND endpoint = ?2").bind(p.id, p.endpoint).run();
      let fehler = "";
      const abo = aboVon.get(p.endpoint);
      if (!abo) fehler = "Handy abgemeldet";
      else if (p.bis <= now) fehler = "abgelaufen";
      else try {
        const r = await pushSenden(db, JSON.parse(abo), JSON.parse(p.nachricht), Math.max(60, Math.round((p.bis - now) / 1000)));
        if (r.status === 404 || r.status === 410) {
          fehler = "Handy abgemeldet (" + r.status + ")";
          await db.prepare("DELETE FROM abos WHERE endpoint = ?1").bind(p.endpoint).run();
          aboVon.delete(p.endpoint);   // seine übrigen Zeilen laufen als „Handy abgemeldet“ durch und stehen so in der Übersicht
        } else if (r.status >= 300) { fehler = "Push-Dienst " + r.status; console.log("Push", p.id, r.status); }
      } catch (x) { fehler = x.message.slice(0, 80); }
      if (!fehler) { gesendet++; await db.prepare("UPDATE gemeldet SET an = COALESCE(an, 0) + 1 WHERE id = ?1").bind(p.id).run(); }
      else await db.prepare("UPDATE gemeldet SET fehler = CASE WHEN fehler IS NULL THEN ?2 WHEN instr(fehler, ?2) > 0 THEN fehler ELSE fehler || ', ' || ?2 END WHERE id = ?1").bind(p.id, fehler).run();
    }
  }
  await db.batch([db.prepare("DELETE FROM gemeldet WHERE zeit < ?1").bind(now - 30 * 24 * 3600e3),
                  db.prepare("DELETE FROM postausgang WHERE bis < ?1").bind(now - 24 * 3600e3)]);   // Reste, falls niemand mehr angemeldet ist
  return { gesendet };
}

// ---- Coach (vom Nutzer, 27.10.2026; Plan in IDEEN.md „COACH-Reiter“) ----
// Trainer tragen Freundschaftsspiele und Turniere ein, die nicht im Extranet stehen. Drei Rollen (Stufe 2, vom Nutzer):
//  - Chef (Laurent): Gerät mit person 0, angemeldet mit dem Code, dessen SHA-256 ADMIN_HASH ist (= CODE_HASH in index.html,
//    der Code selbst steht nirgends). Darf alles, auch Verwalter anlegen und entfernen.
//  - Verwalter (z. B. Präsident der Jugendkommission, Jugendkoordinator): alle Spiele, Trainer anlegen/ändern/entfernen,
//    aber keine Verwalter.
//  - Trainer: nur eigene Spiele, nur eigene Mannschaften.
// Jede Person kann mehrere Codes bekommen (je Gerät einer, z. B. Handy und Computer). Ein Code gilt EINMAL; beim Einlösen
// bekommt das Gerät einen eigenen geheimen Schlüssel und bleibt damit angemeldet. Von Codes und Schlüsseln wird nur der
// SHA-256 gespeichert. Jede Änderung steht im Verlauf (Chef und Verwalter sehen ihn).
// Die Spiele holt der FLF-Abruf öffentlich über ?coach=spiele (ohne Namen) und baut sie in die Daten ein — gespeichert wird
// hier, angestoßen wird der Abruf sofort (höchstens einmal je Minute, sonst im nächsten Takt).
// Aufrufe: POST ?coach=einloesen|ich|liste|speichern|loeschen|abmelden|person_neu|person_aendern|code_neu|code_weg|
// geraete_weg|person_weg (Text mit JSON).
const ADMIN_HASH = "452407a9a9f0b6c22b1ea097c91cb140e13a3e35edac52e98785732c19379e9c";
// „Nachholspiel“ (vom Nutzer, 28.10.2026): ein Ligaspiel, das die FLF noch nicht neu angesetzt hat. Wie Freundschaftsspiel „gegen …“.
export const COACH_ARTEN = ["Freundschaftsspiel", "Nachholspiel", "Turnier", "Hallenturnier", "Sonstiges"];
const mitGegner = art => art === "Freundschaftsspiel" || art === "Nachholspiel";
const COACH_TABELLEN = [
  "CREATE TABLE IF NOT EXISTS coach_trainer (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, teams TEXT NOT NULL, rolle TEXT NOT NULL DEFAULT 'trainer', code_hash TEXT, eingeloest TEXT, gesperrt INTEGER NOT NULL DEFAULT 0, seit TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS coach_code (id INTEGER PRIMARY KEY AUTOINCREMENT, trainer_id INTEGER NOT NULL, code_hash TEXT NOT NULL, eingeloest TEXT, seit TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS coach_geraet (schluessel_hash TEXT PRIMARY KEY, trainer_id INTEGER NOT NULL, seit TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS coach_spiel (id INTEGER PRIMARY KEY AUTOINCREMENT, trainer_id INTEGER NOT NULL, von TEXT NOT NULL, reiter TEXT NOT NULL, art TEXT NOT NULL, datum TEXT NOT NULL, zeit TEXT, ende TEXT, gegner TEXT NOT NULL, heim INTEGER NOT NULL, ort TEXT, bem TEXT, abgesagt INTEGER NOT NULL DEFAULT 0, geaendert TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS coach_stand (k TEXT PRIMARY KEY, v TEXT)",
  "CREATE TABLE IF NOT EXISTS coach_verlauf (id INTEGER PRIMARY KEY AUTOINCREMENT, zeit TEXT NOT NULL, wer TEXT NOT NULL, was TEXT NOT NULL)",
  // Stufe 1 hatte den Code in coach_trainer (ein Code je Trainer) — einmal in coach_code umziehen.
  "INSERT INTO coach_code (trainer_id, code_hash, eingeloest, seit) SELECT id, code_hash, eingeloest, seit FROM coach_trainer WHERE code_hash IS NOT NULL",
  "UPDATE coach_trainer SET code_hash = NULL WHERE code_hash IS NOT NULL",
];
let COACH_BEREIT = false;
async function coachTabellen(db) {
  if (COACH_BEREIT) return;
  for (const t of COACH_TABELLEN) await db.prepare(t).run();
  COACH_BEREIT = true;
}
export const coachTabellenNeu = () => { COACH_BEREIT = false; };   // für die Tests (neue Datenbank)
const sha = async t => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, "0")).join("");
// Codes ohne verwechselbare Zeichen (0/O, 1/I/L), „ABCD-2345“. Beim Eingeben zählen Groß/klein, Leerzeichen und Strich nicht.
const CODE_ZEICHEN = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function neuerCode() {
  const z = crypto.getRandomValues(new Uint8Array(8));
  const s = [...z].map(b => CODE_ZEICHEN[b % CODE_ZEICHEN.length]).join("");
  return s.slice(0, 4) + "-" + s.slice(4);
}
export const codeNorm = c => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
// Falsche Codes: höchstens 10 je 10 min und Adresse (gegen Durchprobieren).
const FEHLVERSUCHE = new Map();
function zuVieleVersuche(ip, now) {
  const l = (FEHLVERSUCHE.get(ip) || []).filter(t => now - t < 10 * 60e3);
  FEHLVERSUCHE.set(ip, l);
  return l.length >= 10;
}
const text = (s, max) => String(s ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const tagLuxNow = ms => new Date(ms).toLocaleDateString("sv-SE", { timeZone: "Europe/Luxembourg" });
// Ein Spiel aus der App prüfen. Gibt das bereinigte Spiel oder einen Fehlertext.
export function coachSpielPruefen(s, now = Date.now()) {
  if (!s || typeof s !== "object") return "spiel";
  const x = {
    reiter: text(s.reiter, 50), art: COACH_ARTEN.includes(s.art) ? s.art : "", datum: String(s.datum || ""),
    zeit: s.zeit ? String(s.zeit) : null, ende: s.ende ? String(s.ende) : null, gegner: text(s.gegner, 60),
    heim: s.heim ? 1 : 0, ort: text(s.ort, 80) || null, bem: text(s.bem, 200) || null, abgesagt: s.abgesagt ? 1 : 0,
  };
  // Mehrere Mannschaften mit „+“ (vom Nutzer, 27.10.2026: „MIN 1+MIN 2“ = ein Spiel für beide).
  const teile = x.reiter.split("+").map(t => t.trim());
  if (!teile.length || teile.length > 4 || !teile.every(t => REITER_OK.test(t)) || new Set(teile).size !== teile.length) return "Mannschaft fehlt";
  x.reiter = teile.join("+");
  if (!x.art) return "Art fehlt";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(x.datum) || isNaN(Date.parse(x.datum + "T12:00:00Z"))) return "Datum fehlt";
  const tage = (Date.parse(x.datum + "T12:00:00Z") - Date.parse(tagLuxNow(now) + "T12:00:00Z")) / 864e5;
  if (tage < -60 || tage > 400) return "Datum zu weit weg";
  for (const f of ["zeit", "ende"]) if (x[f] && !/^([01]\d|2[0-3]):[0-5]\d$/.test(x[f])) return "Uhrzeit ungültig";
  if (x.zeit === "00:00") x.zeit = null;   // 00:00 heißt in der App „Uhrzeit offen“
  if (!x.gegner) return mitGegner(x.art) ? "Gegner fehlt" : "Veranstalter fehlt";
  return x;
}
// Wer ist das? Schlüssel → { id, name, rolle, teams } oder null (unbekannt, entfernt oder abgemeldet).
async function coachWer(db, schluessel) {
  if (typeof schluessel !== "string" || schluessel.length < 20 || schluessel.length > 100) return null;
  const g = await db.prepare("SELECT trainer_id FROM coach_geraet WHERE schluessel_hash = ?1").bind(await sha(schluessel)).first();
  if (!g) return null;
  if (g.trainer_id === 0) return { id: 0, name: "Laurent", rolle: "chef", teams: [] };
  const t = await db.prepare("SELECT * FROM coach_trainer WHERE id = ?1").bind(g.trainer_id).first();
  if (!t || t.gesperrt) return null;
  return { id: t.id, name: t.name, rolle: t.rolle, teams: JSON.parse(t.teams) };
}
const coachIch = w => ({ name: w.name, rolle: w.rolle, teams: w.teams });
async function geraetNeu(db, trainerId, now) {
  const s = b64u(crypto.getRandomValues(new Uint8Array(32)));
  await db.prepare("INSERT INTO coach_geraet (schluessel_hash, trainer_id, seit) VALUES (?1, ?2, ?3)").bind(await sha(s), trainerId, new Date(now).toISOString()).run();
  return s;
}
async function verlauf(db, wer, was, now) {
  await db.prepare("INSERT INTO coach_verlauf (zeit, wer, was) VALUES (?1, ?2, ?3)").bind(new Date(now).toISOString(), wer, was).run();
  // Ein Jahr reicht.
  await db.prepare("DELETE FROM coach_verlauf WHERE zeit < ?1").bind(new Date(now - 365 * 864e5).toISOString()).run();
}
const spielKurz = s => `${s.reiter} ${s.datum.slice(8, 10)}.${s.datum.slice(5, 7)}. ${s.zeit || "Uhrzeit offen"} · ${mitGegner(s.art) ? "gegen " : s.art + ": "}${s.gegner}`;
// Abruf anstoßen: sofort, höchstens einmal je Minute; sonst merkt sich der Worker es für den nächsten Takt (scheduled).
async function coachAnstossen(db, env, now) {
  const z = await db.prepare("SELECT v FROM coach_stand WHERE k = 'anstoss'").first();
  if (env.GITHUB_TOKEN && now - (Number(z?.v) || 0) >= 60e3) {
    await db.prepare("INSERT OR REPLACE INTO coach_stand (k, v) VALUES ('anstoss', ?1)").bind(String(now)).run();
    await db.prepare("DELETE FROM coach_stand WHERE k = 'nachholen'").run();
    await anstossen(env);
  } else await db.prepare("INSERT OR REPLACE INTO coach_stand (k, v) VALUES ('nachholen', '1')").run();
}
// Im Minuten-Takt: ein Anstoß, der warten musste. (Die Mitteilungen „neu, geändert, abgesagt“ stehen schon nach dem
// sofortigen Abruf mit `ab` = Änderung + 10 min in mitteilungen.json — der Worker schickt sie dann von selbst.)
export async function coachNachholen(db, env, now) {
  await coachTabellen(db);
  if (await db.prepare("SELECT v FROM coach_stand WHERE k = 'nachholen'").first()) await coachAnstossen(db, env, now);
}
const spielAus = (r, mitVon) => ({ id: r.id, reiter: r.reiter, art: r.art, datum: r.datum, zeit: r.zeit, ende: r.ende, gegner: r.gegner,
  heim: !!r.heim, ort: r.ort, bem: r.bem, abgesagt: !!r.abgesagt, geaendert: r.geaendert, ...(mitVon ? { von: r.von } : {}) });
// Öffentlich (für den FLF-Abruf): alle Spiele ab 60 Tagen zurück, ohne Namen. `geaendert` braucht der Abruf für die Mitteilungen.
export async function coachOeffentlich(db, now = Date.now()) {
  await coachTabellen(db);
  const ab = tagLuxNow(now - 60 * 864e5);
  const { results } = await db.prepare("SELECT * FROM coach_spiel WHERE datum >= ?1 ORDER BY datum, zeit, id").bind(ab).all();
  return results.map(r => spielAus(r, false));
}
export const coachTeile = reiter => String(reiter || "").split("+").filter(Boolean);
const istVerwalter = w => w.rolle === "chef" || w.rolle === "admin";
// Wer darf diese Person verwalten? Chef alle, Verwalter nur Trainer, sich selbst nie (Chef ist keine Person in der Tabelle).
const darfPerson = (w, t) => !!t && (w.rolle === "chef" || (w.rolle === "admin" && t.rolle === "trainer"));
export async function coachAnfrage(req, db, was, env = {}, now = Date.now()) {
  if (req.method !== "POST") return antwort('{"fehler":"post"}', 405);
  let x; try { x = JSON.parse(await req.text()); } catch (e) { return antwort('{"fehler":"json"}', 400); }
  await coachTabellen(db);
  const zeitIso = new Date(now).toISOString();
  if (was === "einloesen") {
    const ip = req.headers.get("cf-connecting-ip") || "?";
    if (zuVieleVersuche(ip, now)) return antwort('{"fehler":"Zu viele Versuche, bitte in 10 Minuten nochmal."}', 429);
    const roh = String(x.code || "").trim();
    if (roh && await sha(roh.toUpperCase()) === ADMIN_HASH)
      return antwort(JSON.stringify({ schluessel: await geraetNeu(db, 0, now), name: "Laurent", rolle: "chef", teams: [] }));
    const h = codeNorm(roh).length >= 8 ? await sha(codeNorm(roh)) : "";
    const c = h && await db.prepare("SELECT * FROM coach_code WHERE code_hash = ?1").bind(h).first();
    const t = c && await db.prepare("SELECT * FROM coach_trainer WHERE id = ?1").bind(c.trainer_id).first();
    if (!t || t.gesperrt || c.eingeloest) {
      FEHLVERSUCHE.get(ip).push(now);
      return antwort(JSON.stringify({ fehler: t && c.eingeloest ? "Dieser Code wurde schon benutzt." : "Diesen Code gibt es nicht." }), 404);
    }
    // Einmal-Code: verbraucht. Andere Geräte derselben Person bleiben angemeldet (Handy und Computer).
    await db.prepare("UPDATE coach_code SET eingeloest = ?2 WHERE id = ?1").bind(c.id, zeitIso).run();
    await verlauf(db, t.name, "Code eingelöst (neues Gerät)", now);
    return antwort(JSON.stringify({ schluessel: await geraetNeu(db, t.id, now), name: t.name, rolle: t.rolle, teams: JSON.parse(t.teams) }));
  }
  const w = await coachWer(db, x.schluessel);
  if (!w) return antwort('{"fehler":"abgemeldet"}', 401);
  const verw = istVerwalter(w);
  if (was === "ich") return antwort(JSON.stringify(coachIch(w)));
  if (was === "abmelden") {
    await db.prepare("DELETE FROM coach_geraet WHERE schluessel_hash = ?1").bind(await sha(x.schluessel)).run();
    return antwort('{"ok":true}');
  }
  if (was === "liste") {
    const ab = tagLuxNow(now - 60 * 864e5);
    // Trainer sehen alle Spiele ihrer Mannschaften, egal wer sie eingetragen hat (vom Nutzer, 27.10.2026: sonst doppelt).
    const { results } = await db.prepare("SELECT * FROM coach_spiel WHERE datum >= ?1 ORDER BY datum, zeit, id").bind(ab).all();
    const aus = { ...coachIch(w), spiele: results.filter(r => verw || coachTeile(r.reiter).some(t => w.teams.includes(t))).map(r => spielAus(r, true)) };
    if (verw) {
      const codes = (await db.prepare("SELECT id, trainer_id, eingeloest, seit FROM coach_code ORDER BY id").all()).results;
      const geraete = (await db.prepare("SELECT trainer_id, COUNT(*) AS n FROM coach_geraet GROUP BY trainer_id").all()).results;
      aus.personen = (await db.prepare("SELECT id, name, teams, rolle, seit FROM coach_trainer WHERE gesperrt = 0 ORDER BY rolle, name").all()).results
        .map(t => ({ ...t, teams: JSON.parse(t.teams), darf: darfPerson(w, t), geraete: geraete.find(g => g.trainer_id === t.id)?.n || 0,
          codes: codes.filter(c => c.trainer_id === t.id).map(c => ({ id: c.id, eingeloest: c.eingeloest, seit: c.seit })) }));
      if (w.rolle === "chef") aus.chefGeraete = geraete.find(g => g.trainer_id === 0)?.n || 0;
      aus.verlauf = (await db.prepare("SELECT zeit, wer, was FROM coach_verlauf ORDER BY id DESC LIMIT 60").all()).results;
    }
    return antwort(JSON.stringify(aus));
  }
  // Trainer: alle Spiele seiner Mannschaften (auch von anderen eingetragene, vom Nutzer); Chef und Verwalter alles.
  const darf = async id => {
    const r = await db.prepare("SELECT * FROM coach_spiel WHERE id = ?1").bind(Number(id) || 0).first();
    return r && (verw || coachTeile(r.reiter).some(t => w.teams.includes(t))) ? r : null;
  };
  if (was === "speichern") {
    const s = coachSpielPruefen(x.spiel, now);
    if (typeof s === "string") return antwort(JSON.stringify({ fehler: s }), 400);
    let id;
    // Neue Mannschaften nur eigene; was schon dabei war (z. B. MIN 2 bei einem Spiel MIN 1+2 vom Koordinator), darf bleiben.
    const alt0 = x.spiel.id ? await darf(x.spiel.id) : null;
    const erlaubt = new Set([...w.teams, ...coachTeile(alt0?.reiter)]);
    if (!verw && !coachTeile(s.reiter).every(t => erlaubt.has(t))) return antwort('{"fehler":"nicht deine Mannschaft"}', 403);
    if (x.spiel.id) {
      const alt = alt0;
      if (!alt) return antwort('{"fehler":"nicht dein Spiel"}', 403);
      await db.prepare("UPDATE coach_spiel SET reiter=?2, art=?3, datum=?4, zeit=?5, ende=?6, gegner=?7, heim=?8, ort=?9, bem=?10, abgesagt=?11, geaendert=?12 WHERE id = ?1")
        .bind(alt.id, s.reiter, s.art, s.datum, s.zeit, s.ende, s.gegner, s.heim, s.ort, s.bem, s.abgesagt, zeitIso).run();
      id = alt.id;
      await verlauf(db, w.name, (s.abgesagt && !alt.abgesagt ? "abgesagt: " : !s.abgesagt && alt.abgesagt ? "wieder angesetzt: " : "geändert: ") + spielKurz(s), now);
    } else {
      const n = await db.prepare("SELECT COUNT(*) AS n FROM coach_spiel WHERE trainer_id = ?1 AND datum >= ?2").bind(w.id, tagLuxNow(now)).first();
      if (!verw && (n?.n || 0) >= 50) return antwort('{"fehler":"zu viele Spiele"}', 429);
      const r = await db.prepare("INSERT INTO coach_spiel (trainer_id, von, reiter, art, datum, zeit, ende, gegner, heim, ort, bem, abgesagt, geaendert) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13) RETURNING id")
        .bind(w.id, w.name, s.reiter, s.art, s.datum, s.zeit, s.ende, s.gegner, s.heim, s.ort, s.bem, s.abgesagt, zeitIso).first();
      id = r.id;
      await verlauf(db, w.name, "neu: " + spielKurz(s), now);
    }
    await coachAnstossen(db, env, now);
    return antwort(JSON.stringify({ ok: true, id }));
  }
  if (was === "loeschen") {
    const alt = await darf(x.id);
    if (!alt) return antwort('{"fehler":"nicht dein Spiel"}', 403);
    await db.prepare("DELETE FROM coach_spiel WHERE id = ?1").bind(alt.id).run();
    await verlauf(db, w.name, "gelöscht: " + spielKurz(alt), now);
    await coachAnstossen(db, env, now);
    return antwort('{"ok":true}');
  }
  if (!verw) return antwort('{"fehler":"nur Verwalter"}', 403);
  const neuerCodeFuer = async t => {
    const code = neuerCode();
    await db.prepare("INSERT INTO coach_code (trainer_id, code_hash, seit) VALUES (?1, ?2, ?3)").bind(t.id, await sha(codeNorm(code)), zeitIso).run();
    return code;
  };
  const teamsAus = l => (Array.isArray(l) ? l : []).map(t => text(t, 20)).filter(t => REITER_OK.test(t)).slice(0, 15);
  if (was === "person_neu") {
    const rolle = x.rolle === "admin" ? "admin" : "trainer";
    if (rolle === "admin" && w.rolle !== "chef") return antwort('{"fehler":"Verwalter legt nur Laurent an"}', 403);
    const name = text(x.name, 40), teams = rolle === "admin" ? [] : teamsAus(x.teams);
    if (!name || (rolle === "trainer" && !teams.length)) return antwort(JSON.stringify({ fehler: rolle === "trainer" ? "Name und Mannschaft fehlen" : "Name fehlt" }), 400);
    const r = await db.prepare("INSERT INTO coach_trainer (name, teams, rolle, seit) VALUES (?1, ?2, ?3, ?4) RETURNING id").bind(name, JSON.stringify(teams), rolle, zeitIso).first();
    const t = { id: r.id, name, rolle };
    const code = await neuerCodeFuer(t);
    await verlauf(db, w.name, `${rolle === "admin" ? "Verwalter" : "Trainer"} ${name} angelegt${teams.length ? " (" + teams.join(", ") + ")" : ""}`, now);
    return antwort(JSON.stringify({ ok: true, id: r.id, name, code }));
  }
  const t = await db.prepare("SELECT * FROM coach_trainer WHERE id = ?1 AND gesperrt = 0").bind(Number(x.id) || 0).first();
  if (was === "code_weg") {
    // Einen noch nicht eingelösten Code zurückziehen.
    const c = await db.prepare("SELECT * FROM coach_code WHERE id = ?1").bind(Number(x.code) || 0).first();
    const p = c && await db.prepare("SELECT * FROM coach_trainer WHERE id = ?1").bind(c.trainer_id).first();
    if (!c || !darfPerson(w, p)) return antwort('{"fehler":"nicht erlaubt"}', 403);
    if (c.eingeloest) return antwort('{"fehler":"schon eingelöst"}', 400);
    await db.prepare("DELETE FROM coach_code WHERE id = ?1").bind(c.id).run();
    await verlauf(db, w.name, `offenen Code von ${p.name} zurückgezogen`, now);
    return antwort('{"ok":true}');
  }
  if (!darfPerson(w, t)) return antwort('{"fehler":"nicht erlaubt"}', 403);
  if (was === "person_aendern") {
    const name = text(x.name, 40) || t.name, teams = t.rolle === "admin" ? [] : teamsAus(x.teams);
    if (t.rolle === "trainer" && !teams.length) return antwort('{"fehler":"mindestens eine Mannschaft"}', 400);
    await db.prepare("UPDATE coach_trainer SET name = ?2, teams = ?3 WHERE id = ?1").bind(t.id, name, JSON.stringify(teams)).run();
    await verlauf(db, w.name, `${t.name} geändert${name !== t.name ? " → " + name : ""}${teams.length ? " (" + teams.join(", ") + ")" : ""}`, now);
    return antwort('{"ok":true}');
  }
  if (was === "code_neu") {
    // Weiterer Code (z. B. für den Computer): die angemeldeten Geräte bleiben.
    const code = await neuerCodeFuer(t);
    await verlauf(db, w.name, `weiteren Code für ${t.name} gemacht`, now);
    return antwort(JSON.stringify({ ok: true, id: t.id, name: t.name, code }));
  }
  if (was === "geraete_weg") {
    // Handy verloren o. Ä.: alle Geräte der Person abmelden, offene Codes gelten nicht mehr.
    await db.prepare("DELETE FROM coach_geraet WHERE trainer_id = ?1").bind(t.id).run();
    await db.prepare("DELETE FROM coach_code WHERE trainer_id = ?1 AND eingeloest IS NULL").bind(t.id).run();
    await verlauf(db, w.name, `alle Geräte von ${t.name} abgemeldet`, now);
    return antwort('{"ok":true}');
  }
  if (was === "person_weg") {
    // Entfernen: Person, Codes und Geräte weg. Ihre Spiele bleiben stehen (Chef/Verwalter können sie ändern oder löschen).
    await db.prepare("DELETE FROM coach_geraet WHERE trainer_id = ?1").bind(t.id).run();
    await db.prepare("DELETE FROM coach_code WHERE trainer_id = ?1").bind(t.id).run();
    await db.prepare("DELETE FROM coach_trainer WHERE id = ?1").bind(t.id).run();
    await verlauf(db, w.name, `${t.rolle === "admin" ? "Verwalter" : "Trainer"} ${t.name} entfernt`, now);
    return antwort('{"ok":true}');
  }
  return antwort('{"fehler":"coach"}', 400);
}

export default {
  async scheduled(event, env, ctx) {
    // Takt jede Minute (Cron „* * * * *“, seit 21.10.2026 für die Mitteilungen). Auf die volle Minute
    // runden: Cloudflare startet manchmal ein paar Sekunden später. Den FLF-Abruf stößt abrufFaellig()
    // trotzdem nur zu den Viertelstunden an, die es nennt.
    const t = Math.round(event.scheduledTime / 60e3) * 60e3;
    if (env.DB) ctx.waitUntil(mitteilungenSenden(env.DB, t).catch(e => console.log("Mitteilungen:", e.message)));
    // Coach: ein Anstoß, der wegen „höchstens einmal je Minute“ warten musste.
    if (env.DB) ctx.waitUntil(coachNachholen(env.DB, env, t).catch(e => console.log("Coach:", e.message)));
    if (!env.GITHUB_TOKEN || !abrufFaellig(t)) return;
    ctx.waitUntil(anstossen(env));
  },

  async fetch(req, env = {}) {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const q = new URL(req.url).searchParams;
    if (q.has("push")) {
      if (!env.DB) return antwort('{"fehler":"kein D1"}', 503);
      try { return await pushAnfrage(req, env.DB, q.get("push"), env); } catch (e) { console.log("Push:", e.message); return antwort('{"fehler":"intern"}', 500); }
    }
    if (q.has("coach")) {
      if (!env.DB) return antwort('{"fehler":"kein D1"}', 503);
      try {
        if (q.get("coach") === "spiele") return antwort(JSON.stringify({ spiele: await coachOeffentlich(env.DB) }));
        return await coachAnfrage(req, env.DB, q.get("coach"), env);
      } catch (e) { console.log("Coach:", e.message); return antwort('{"fehler":"intern"}', 500); }
    }
    if (q.get("ich") === "1" && (q.has("zaehle") || q.has("angesehen"))) {
      if (env.DB) try { await ichZaehlen(env.DB, tagLux(Date.now()), q.has("zaehle") ? "oeffnung" : "umschalten"); } catch (e) { console.log("Zähler:", e.message); }
      return new Response(null, { status: 204, headers: CORS });
    }
    const fremdWer = (q.has("zaehle") || q.has("angesehen")) ? fremdGrund(req) : "";
    if (fremdWer) {
      if (env.DB) try { await fremdZaehlen(env.DB, tagLux(Date.now()), fremdWer); } catch (e) { console.log("Zähler:", e.message); }
      return new Response(null, { status: 204, headers: CORS });
    }
    if (q.has("zaehle")) {
      if (env.DB) try { { const t = Date.now(); await zaehlen(env.DB, tagLux(t), q.get("neu") === "1", q.get("reiter") || "", q.get("art") || "", stundeLux(t), q.get("erst") === "1"); } } catch (e) { console.log("Zähler:", e.message); }
      return new Response(null, { status: 204, headers: CORS });
    }
    if (q.has("angesehen")) {
      if (env.DB) try { await ansehen(env.DB, tagLux(Date.now()), q.get("reiter") || ""); } catch (e) { console.log("Zähler:", e.message); }
      return new Response(null, { status: 204, headers: CORS });
    }
    if (q.has("zahlen")) {
      if (!env.DB) return new Response("Zähler nicht eingerichtet (D1-Binding „DB“ fehlt).", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
      let zusatz = "";
      try {
        let datei = null;
        try { const r = await fetch(MITT_URL, { headers: { "cache-control": "no-cache" } }); if (r.ok) datei = await r.json(); } catch (e) {}
        zusatz = await mitteilungenStand(env.DB, datei);
      } catch (e) { zusatz = "<p>Mitteilungen: " + esc(e.message) + "</p>"; }
      return new Response(await zahlenSeite(env.DB, zusatz), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
    let slug = q.get("slug") || "";
    const anstoss = q.get("anstoss") || "";
    if (!slug && anstoss) {
      // Nur Spiele um jetzt herum (±36 h) — sonst könnte jeder beliebig FuPa-Seiten abrufen lassen.
      const a = Date.parse(anstoss);
      if (!a || Math.abs(a - Date.now()) > 36 * 3600e3) return antwort('{"fehler":"anstoss"}', 400);
      slug = (await slugZu(anstoss)) || "";
      if (!slug) return antwort('{"fehler":"spiel nicht gefunden"}', 404);
    }
    // Koeppchen-Spiele und Länderspiele Luxemburgs (Reiter „Roude Léiw“, seit 19.10.2026).
    if (!/^[a-z0-9-_]{5,160}$/.test(slug) || !(slug.includes("fc-koeppchen") || slug.includes("luxemburg-m1"))) return antwort('{"fehler":"slug"}', 400);

    const sp = await fupaSpiel(slug, env.DB);
    if (!sp) return antwort('{"fehler":"fupa"}', 502);
    return antwort(JSON.stringify({ ...kuerzen(sp.f), abgerufen: new Date(sp.t).toISOString() }));
  },
};
