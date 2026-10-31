// Events von der Vereins-Homepage www.fckoeppchen.lu (Clubee) für „Unsere Woche“ (vom Nutzer, 31.10.2026; der Verein hat
// die Rechte bei Clubee, der Präsident ist einverstanden). Weg A: das Menü „Events“ (freie Textseiten). Ein sauberes Datum gibt es
// dort nicht — genommen wird das späteste Datum auf der Seite (Bamverkaaf: 4.12. statt Bestellschluss 29.11.). Ohne Datum steht das
// Event ohne Datum da und wird nie ausgeblendet. Bild: das erste große Bild der Seite (kleine sind Sponsoren-Logos), verkleinert
// nach bilder/events/, sonst keins (die App nimmt dann das Vereinslogo).

import { execFileSync } from "node:child_process";
import { writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, readdirSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const HOMEPAGE = "https://www.fckoeppchen.lu/";
const BILDER = new URL("../bilder/events/", import.meta.url);
const TZ = "Europe/Luxembourg";

// Menüpunkte unter „Events“: [{t, url}] aus dem eingebetteten Menü-JSON der Startseite.
export function eventMenue(html) {
  const s = html.replace(/\\"/g, '"');
  const m = /\],"id":\d+,"name":"Events","icon":"[^"]*","position":\d+,"type":"drop-down"/.exec(s);
  if (!m) throw new Error("Menü „Events“ nicht gefunden");
  // Von der schließenden Klammer der Kinder-Liste rückwärts zur öffnenden.
  let tiefe = 0, i = m.index;
  for (; i >= 0; i--) {
    if (s[i] === "]") tiefe++;
    else if (s[i] === "[" && --tiefe === 0) break;
  }
  const kinder = JSON.parse(s.slice(i, m.index + 1));
  return kinder.filter(k => k.type === "page" && k.url && k.name).map(k => ({ t: k.name.trim(), url: HOMEPAGE + k.url }));
}

const MONATE = {
  januar: 1, jan: 1, janvier: 1, january: 1,
  februar: 2, feb: 2, février: 2, fevrier: 2, february: 2,
  märz: 3, maerz: 3, mäerz: 3, mars: 3, march: 3,
  april: 4, abrëll: 4, avril: 4,
  mai: 5, mee: 5, may: 5,
  juni: 6, juin: 6, june: 6,
  juli: 7, juillet: 7, july: 7,
  august: 8, août: 8, aout: 8,
  september: 9, septembre: 9,
  oktober: 10, octobre: 10, october: 10,
  november: 11, novembre: 11,
  dezember: 12, décembre: 12, decembre: 12, december: 12,
};

const ENT = { nbsp: " ", amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", szlig: "ß", ccedil: "ç", Ccedil: "Ç" };
const AKZENT = { uml: "\u0308", acute: "\u0301", grave: "\u0300", circ: "\u0302", tilde: "\u0303" };
export function seitenText(html) {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-zA-Z])(uml|acute|grave|circ|tilde);/g, (_, b, a) => (b + AKZENT[a]).normalize("NFC"))
    .replace(/&([a-z]+);/gi, (x, n) => ENT[n] ?? x).replace(/\s+/g, " ");
}

// Spätestes gültiges Datum im Text als „JJJJ-MM-TT“, nur bis 2 Jahre voraus (Tippfehler wie 2062) und nicht vor 2020; sonst null.
export function eventDatum(text, now = Date.now()) {
  const heute = new Date(now).toLocaleDateString("sv-SE", { timeZone: TZ });
  const grenze = (+heute.slice(0, 4) + 2) + heute.slice(4);
  const gefunden = [];
  const dazu = (t, m, j) => {
    if (!(m >= 1 && m <= 12 && t >= 1 && t <= 31 && j >= 2020)) return;
    const d = new Date(Date.UTC(j, m - 1, t));
    if (d.getUTCMonth() !== m - 1) return;   // 31.11. o. ä.
    const iso = d.toISOString().slice(0, 10);
    if (iso <= grenze) gefunden.push(iso);
  };
  for (const x of text.matchAll(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/g)) dazu(+x[1], +x[2], +x[3]);
  const namen = Object.keys(MONATE).sort((a, b) => b.length - a.length).join("|");
  for (const x of text.matchAll(new RegExp(`\\b(\\d{1,2})(?:\\.|er)?\\s+(${namen})\\.?\\s+(\\d{4})\\b`, "giu"))) dazu(+x[1], MONATE[x[2].toLowerCase()], +x[3]);
  return gefunden.sort().pop() || null;
}

// Bild-Adressen der Seite in Reihenfolge (nur hochgeladene Dateien des Vereins, keine Logos/Symbole).
export function seitenBilder(html) {
  const aus = [];
  for (const m of html.matchAll(/<img[^>]+src="(https:\/\/clubee-websites-prod\.s3\.[^"]+\/files\/image\/[^"]+)"/g))
    if (!aus.includes(m[1])) aus.push(m[1]);
  return aus;
}

// Breite eines PNG/JPEG aus den ersten Bytes, sonst 0.
export function bildBreite(b) {
  if (b[0] === 0x89 && b[1] === 0x50) return b.readUInt32BE(16);
  if (b[0] === 0xff && b[1] === 0xd8) {
    for (let i = 2; i + 9 < b.length;) {
      if (b[i] !== 0xff) return 0;
      const typ = b[i + 1], len = b.readUInt16BE(i + 2);
      if (typ >= 0xc0 && typ <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(typ)) return b.readUInt16BE(i + 7);
      i += 2 + len;
    }
  }
  return 0;
}

const name = url => url.split("/").pop().replace(/\.[a-z]+$/i, "").replace(/[^A-Za-z0-9_-]/g, "") + ".jpg";

// Erstes Bild mit mindestens 600 px Breite → bilder/events/<name>.jpg (192 × 192, Mitte). Schon da → nicht neu laden.
async function eventBild(urls) {
  for (const u of urls.slice(0, 8)) {
    const datei = name(u);
    if (existsSync(new URL(datei, BILDER))) return "bilder/events/" + datei;
    const r = await fetch(u);
    if (!r.ok) continue;
    const b = Buffer.from(await r.arrayBuffer());
    if (bildBreite(b) < 600) continue;
    const dir = mkdtempSync(join(tmpdir(), "ev-"));
    try {
      writeFileSync(join(dir, "ein"), b);
      mkdirSync(BILDER, { recursive: true });
      execFileSync("convert", [join(dir, "ein") + "[0]", "-resize", "192x192^", "-gravity", "center", "-extent", "192x192",
        "-strip", "-quality", "82", new URL(datei, BILDER).pathname]);
      return "bilder/events/" + datei;
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }
  return null;
}

const holen = async url => { const r = await fetch(url); if (!r.ok) throw new Error(url + ": HTTP " + r.status); return r.text(); };

// Kalender der Homepage (Clubee, Menüpunkt mit system_page „calendar“), Rubrik „Evenementer“ (vom Nutzer, 31.10.2026: der Präsident trägt
// Events dort ein). Clubee führt sie mit eigenen Feldern (type "event", Trainings sind "training"), also mit sicherem Datum, Uhrzeit und Ort.
export function kalenderAdresse(html) {
  const s = html.replace(/\\"/g, '"');
  const m = /"type":"calendar","system":true[^{}]*\},"url":"([^"]+)"/.exec(s);
  return HOMEPAGE + (m ? m[1] : "kalenner-57201v4");
}
// ids der Einträge vom Typ "event" auf der Kalender-Seite (jedes Objekt: "id":…,"title":…, später "club":{…},"type":"…").
export function kalenderIds(html) {
  const s = html.replace(/\\"/g, '"');
  const treffer = [...s.matchAll(/"id":(\d+),"title":"/g)];
  const ids = [];
  treffer.forEach((m, i) => {
    const stueck = s.slice(m.index, treffer[i + 1] ? treffer[i + 1].index : m.index + 4000);
    const typ = /"club":\{"id":\d+,"tags":\[\]\},"type":"([a-z_]+)"/.exec(stueck);
    if (typ && typ[1] === "event" && !ids.includes(m[1])) ids.push(m[1]);
  });
  return ids;
}
// Ein Event von /events/<id>: schema.org-Daten (sauberes JSON) + abgesagt/Bild aus Clubees Daten.
// Clubee hängt an die Uhrzeit „+00:00“, gemeint ist aber die Ortszeit (17:00 auf der Homepage = "T17:00:00+00:00") —
// darum Datum und Uhrzeit so, wie sie dastehen.
export function kalenderEvent(html, id) {
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => { try { return JSON.parse(m[1]); } catch { return null; } }).find(j => j && j["@type"] === "Event");
  if (!ld || !/^\d{4}-\d\d-\d\dT\d\d:\d\d/.test(ld.startDate || "")) return null;
  const s = html.replace(/\\"/g, '"');
  const typ = /"club":\{"id":\d+,"tags":\[\]\},"type":"([a-z_]+)","recurrent"/.exec(s);
  if (typ && typ[1] !== "event") return null;
  const tag = ld.startDate.slice(0, 10), von = ld.startDate.slice(11, 16);
  const bis = (ld.endDate || "").slice(0, 10) === tag ? ld.endDate.slice(11, 16) : null;
  const text = seitenText(ld.description || "");
  // Nur das eigene Objekt („"event":{"id":<id>…“) ansehen, nicht andere Einträge auf der Seite.
  const ab = s.indexOf(`"event":{"id":${id},`), eig = ab >= 0 ? s.slice(ab, ab + 20000) : "";
  return {
    t: seitenText(ld.name || "").trim(), url: HOMEPAGE + "events/" + id, tag, von, bis: bis && bis !== von ? bis : null,
    ort: (ld.location && ld.location.name || "").trim() || null, abgesagt: (/"cancelled":(true|false)/.exec(eig) || [])[1] === "true",
    bildUrl: (/"picture":"(https:[^"]+)"/.exec(eig) || [])[1] || null, text,
  };
}

// Dasselbe Event? Gleicher Tag UND (Text großteils gleich ODER Titel teilen ein Wortstück ab 5 Buchstaben, ohne Vereinsnamen).
// Im Zweifel nicht zusammenlegen (vom Nutzer, 31.10.2026): lieber zweimal da als eins unsichtbar.
const falten = t => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const ALLGEMEIN = /\b(fc|koeppchen|wormer|wormeldange|wormeldingen|event|evenement|fest)\b/g;
const woerter = t => new Set(falten(t).match(/[a-z]{4,}/g) || []);
export function textGleich(a, b) {
  const wa = woerter(a), wb = woerter(b);
  if (wa.size < 8) return false;
  return [...wa].filter(w => wb.has(w)).length / wa.size >= 0.6;
}
export function titelGleich(a, b) {
  const x = falten(a).replace(ALLGEMEIN, " ").replace(/[^a-z]/g, ""), y = falten(b).replace(ALLGEMEIN, " ").replace(/[^a-z]/g, "");
  for (let i = 0; i + 5 <= x.length; i++) if (y.includes(x.slice(i, i + 5))) return true;
  return false;
}
// Kalender-Events und Menü-Seiten zu einer Liste: zusammengelegt kommen Titel, Datum, Uhrzeit, Ort aus dem Kalender,
// Link und Bild von der Seite (dort stehen mehr Infos), sonst das Bild aus dem Kalender.
export function zusammenfuehren(kalender, seiten) {
  const frei = [...seiten], aus = [];
  for (const k of kalender) {
    const i = frei.findIndex(p => p.tag === k.tag && (textGleich(k.text, p.text || "") || textGleich(p.text || "", k.text) || titelGleich(k.t, p.t)));
    const p = i >= 0 ? frei.splice(i, 1)[0] : null;
    aus.push({ t: k.t, url: p ? p.url : k.url, tag: k.tag, von: k.von, bis: k.bis, ort: k.ort, ...(k.abgesagt ? { abgesagt: true } : {}),
      bild: (p && p.bild) || k.bild || null, quelle: p ? "beide" : "kalender" });
  }
  for (const p of frei) aus.push({ t: p.t, url: p.url, tag: p.tag, bild: p.bild, quelle: "seite" });
  return aus;
}

// [{t, url, tag|null, von?, bis?, ort?, abgesagt?, bild|null, quelle}]. Fehler bei einer Seite → ohne Datum/Bild,
// Fehler beim Menü → Ausnahme (alter Stand bleibt); Fehler beim Kalender → nur die Seiten.
export async function eventsHolen(now = Date.now()) {
  const start = await holen(HOMEPAGE);
  const seiten = [];
  for (const e of eventMenue(start)) {
    let tag = null, bild = null, text = "";
    try {
      const html = await holen(e.url);
      text = seitenText(html);
      tag = eventDatum(text, now);
      try { bild = await eventBild(seitenBilder(html)); } catch (x) { console.error("Event-Bild", e.t, x.message); }
    } catch (x) { console.error("Event", e.t, x.message); }
    seiten.push({ ...e, tag, bild, text });
  }
  const kalender = [];
  try {
    const heute = new Date(now).toLocaleDateString("sv-SE", { timeZone: TZ });
    for (const id of kalenderIds(await holen(kalenderAdresse(start)))) {
      try {
        const k = kalenderEvent(await holen(HOMEPAGE + "events/" + id), id);
        if (!k || k.tag < heute) continue;
        try { k.bild = k.bildUrl ? await eventBild([k.bildUrl]) : null; } catch (x) { console.error("Event-Bild", k.t, x.message); }
        kalender.push(k);
      } catch (x) { console.error("Kalender-Event", id, x.message); }
    }
  } catch (x) { console.error("Kalender", x.message); }
  const aus = zusammenfuehren(kalender, seiten);
  // Bilder, die keine Seite mehr nutzt, wieder weg (.gitkeep bleibt, sonst scheitert `git add bilder/events` in der Action).
  if (existsSync(BILDER)) {
    const genutzt = new Set(aus.map(e => e.bild && e.bild.split("/").pop()));
    for (const f of readdirSync(BILDER)) if (!f.startsWith(".") && !genutzt.has(f)) unlinkSync(new URL(f, BILDER));
  }
  return aus;
}

// Einmal am Tag reicht (vom Nutzer): im Lauf der 7-Uhr-Stunde (Worker-Anstoß 7:00), oder wenn noch nichts da ist.
export function eventsFaellig(alt, now = Date.now()) {
  if (!alt || !Array.isArray(alt.liste)) return true;
  return +new Date(now).toLocaleString("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }) === 7;
}
