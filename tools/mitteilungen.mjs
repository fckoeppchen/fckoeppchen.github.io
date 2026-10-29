// Mitteilungen, Stufe 2 (vom Nutzer, 21.10.2026; Plan in IDEEN-fussball.md).
// Der FLF-Abruf vergleicht alten und neuen Stand und legt die Ereignisse in data/mitteilungen.json
// ab. Der Cloudflare-Worker liest die Datei alle 15 min und schickt, was fällig ist (`ab` ≤ jetzt <
// `bis`, nur 7–23 Uhr), an die Handys, die Mannschaft und Art gewählt haben. Jedes Ereignis hat eine
// feste `id` — der Worker merkt sich, was er geschickt hat, ein Ereignis kommt also nie doppelt,
// auch wenn es mehrere Läufe lang in der Datei steht. Was nur live zu sehen ist (FuPa tickert,
// Endstand vom Ticker), prüft der Worker selbst; dafür stehen die Spiele des Tages unter `live`.
import { eigeneSpiele, VEREIN, coachTeile, coachName, coachMitGegner } from "./fussball.mjs";
import { FUPA } from "./fupa-modus.mjs";

const TZ = "Europe/Luxembourg";
export const tagLux = ms => new Date(ms).toLocaleDateString("sv-SE", { timeZone: TZ });
const uhr = iso => new Date(iso).toLocaleTimeString("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const datum = iso => new Date(iso).toLocaleDateString("de-DE", { timeZone: TZ, weekday: "short", day: "numeric", month: "numeric" });
const ohneUhrzeit = iso => uhr(iso) === "00:00";   // FLF: Uhrzeit noch nicht festgelegt
// Zeitpunkt „Tag, hh:mm Luxemburger Zeit“ in ms (Sommer- und Winterzeit).
export function umLux(tag, hh, mm = 0) {
  const g = Date.parse(`${tag}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00Z`);
  const dort = Date.parse(new Date(g).toLocaleString("sv-SE", { timeZone: TZ }).replace(" ", "T") + "Z");
  return g - (dort - g);
}
const H = 3600e3;
const kurz = n => String(n).replace(VEREIN, "Koeppchen");
const hatErgebnis = sp => sp.hs != null && sp.as != null;

// Welche Arten es für welchen Reiter gibt (Tabelle im Plan). Woche hat nur „woche“.
export const ARTEN = {
  heute: "Heute Spiel", spieltag: "Spieltag komplett", tabelle: "Tabelle aktualisiert",
  uhrzeit: "Uhrzeit steht fest", neu: "Neue Phase / neues Spiel", trainer: "Trainer: neu, geändert, abgesagt", ticker: "Liveticker läuft", halbzeit: "Halbzeit", ende: "Endstand", woche: "Neue Woche",
};

// Tabelle fertig = jede Mannschaft hat in der FLF-Tabelle so viele Spiele wie Ergebnisse in der Klasse (vom Nutzer,
// 25.10.2026: die Mitteilung kam, als nur unsere Zeile nachgezogen war, die anderen noch nicht — Platz konnte falsch sein).
// Nur Spiele bis jetzt: ein im Voraus gewertetes Forfait (Larochette, Termin in der Zukunft) hat schon ein Ergebnis,
// die FLF zählt es in der Tabelle aber erst ab seinem Datum — sonst wäre die Tabelle nie „fertig“.
export const tabelleFertig = (k, now) => {
  const n = new Map();
  for (const sp of k.spiele || []) if (hatErgebnis(sp) && Date.parse(sp.d) <= now) for (const id of [sp.h.id, sp.a.id]) n.set(id, (n.get(id) || 0) + 1);
  return !!k.tabelle?.length && k.tabelle.every(x => x.sp === (n.get(x.id) || 0));
};
// Spieltag komplett = alle Spiele um den Termin des Spieltags haben ein Ergebnis (vom Nutzer, 25.10.2026). Haupttermin =
// mittlerer Termin. Verlegt (hält nichts auf): mehr als 7 Tage vom Haupttermin weg, oder Termin seit 3 Tagen vorbei und noch
// ohne Ergebnis — die FLF lässt beim Verlegen oft das alte Datum stehen (Koeppchen II – Syra, 3.10.). Ein Spiel am Dienstag
// nach einem Freitag-Spieltag (Syra spielt zu Hause dienstags) gehört dazu und wird abgewartet.
const TAG_MS = 24 * H;
const verlegtText = sn => sn.verlegt ? ` (${sn.verlegt} ${sn.verlegt === 1 ? "Spiel" : "Spiele"} verlegt)` : "";
export function spieltagStand(spiele, tag, now) {
  const s = spiele.filter(sp => sp.tag === tag);
  if (!s.length) return null;
  const ds = s.map(sp => Date.parse(sp.d)).sort((a, b) => a - b), haupt = ds[Math.floor((ds.length - 1) / 2)];
  const verlegt = s.filter(sp => !hatErgebnis(sp) && (Math.abs(Date.parse(sp.d) - haupt) > 7 * TAG_MS || Date.parse(sp.d) < now - 3 * TAG_MS));
  const fehlt = s.filter(sp => !hatErgebnis(sp) && !verlegt.includes(sp));
  return { haupt, komplett: !fehlt.length && s.some(hatErgebnis), verlegt: verlegt.length };
}

export function ereignisse(alt, neu, vorher, now) {
  const aus = new Map((vorher?.ereignisse || []).filter(e => e.bis > now).map(e => [e.id, e]));
  const heute = tagLux(now), morgen = tagLux(now + 24 * H);
  const teams = neu.teams.filter(t => t.reiter);
  // Kinder wählt man als Altersklasse („Minimes U13“, vom Nutzer 23.10.2026: die Kinder werden jede Woche
  // neu auf 1/2 verteilt). Jedes Ereignis trägt darum neben dem Reiter auch den Namen der Gruppe.
  const gruppeVon = new Map(teams.filter(t => t.gruppe).map(t => [t.reiter, t.gruppe.name]));
  const mitGruppe = rs => [...new Set([...rs, ...rs.map(r => gruppeVon.get(r)).filter(Boolean)])];
  const dazu = e => { if (e.bis > now && !aus.has(e.id)) aus.set(e.id, { ...e, reiter: mitGruppe(e.reiter) }); };
  // Kinder: je Spiel eine eigene Mitteilung, gewählt wird aber die Altersklasse (vom Nutzer, 23.10.2026 abends;
  // die Zusammenfassung „Pupilles U9 · Morgen 2 Spiele“ vom Nachmittag war auf dem Sperrbildschirm zu lang).
  // Spiele, die eine schon fällige Zusammenfassung (id heute:<a>+<b>) abdeckt, kommen nicht noch einmal;
  // noch nicht fällige Zusammenfassungen fallen weg und werden zu Einzelmitteilungen.
  const spieleVon = e => e.spiele || e.id.slice(6).split("+").map(Number);
  const gedeckt = new Set();
  for (const e of [...aus.values()])
    if (e.art === "heute" && e.id.includes("+")) { if (e.ab <= now) spieleVon(e).forEach(id => gedeckt.add(id)); else aus.delete(e.id); }
  // Noch nicht fällige „Morgen/Heute Spiel“ jedes Mal neu aus den aktuellen Daten bauen (27.10.2026: ein Trainer-Spiel für
  // morgen wurde mittags eingetragen und gleich wieder gelöscht — die um 19 Uhr geplante Mitteilung blieb stehen und ging raus).
  // So fallen gelöschte, abgesagte und verlegte Spiele weg, und eine geänderte Uhrzeit steht richtig im Text.
  for (const e of [...aus.values()]) if (e.art === "heute" && e.ab > now && !e.id.includes("+")) aus.delete(e.id);
  const unsere = new Set(neu.teams.flatMap(t => t.ids || [t.id]));

  // Jedes Spiel einmal, mit allen Reitern, zu denen es gehört (Pokal ohne I/II: U13 1 und U13 2).
  const jeSpiel = new Map();
  for (const t of teams) for (const sp of eigeneSpiele(neu, t)) {
    const x = jeSpiel.get(sp.id) || { sp, reiter: [], kat: t.kat, kurz: t.kurz || t.kat };
    x.reiter.push(t.reiter);
    jeSpiel.set(sp.id, x);
  }
  const altSp = new Map();
  for (const k of Object.values(alt?.klassen || {})) for (const sp of k.spiele) altSp.set(sp.id, sp);
  const live = [];

  for (const { sp, reiter, kat, kurz: kz } of jeSpiel.values()) {
    // Pokal ohne I/II: „MIN“. Trainer-Spiel für beide Mannschaften: „MIN 1+2“ wie überall sonst (vom Nutzer, 27.10.2026).
    const name = sp.coach?.mannschaften || (reiter.length > 1 ? kz : reiter[0]);
    const wirH = unsere.has(sp.h.id), gegner = kurz(wirH ? sp.a.n : sp.h.n), d = Date.parse(sp.d), tag = tagLux(d);
    const wo = sp.ort ? ` · 📍 ${sp.ort}` : "";
    const offen = ohneUhrzeit(sp.d);
    const basis = { reiter };
    // Heute Spiel (vom Nutzer, 21.10.2026): Kinder am Vorabend um 19 Uhr („Morgen Spiel“), Seniors am
    // Spieltag um 10 Uhr (Anstoß vor 11 Uhr: 7:30). Kam das Spiel erst am Spieltag in die Daten, gilt
    // für Kinder „Heute Spiel“ ab 7:30 bzw. sofort — gleiche id, also nie beides.
    // Abgesagte Trainer-Spiele (Coach) melden nichts mehr; die Absage selbst kommt mit Stufe 2.
    if (!hatErgebnis(sp) && !sp.forfait && !sp.abgesagt) {
      // BAM: kein Gegner, sondern ein Mini-Spieltag mit mehreren Mannschaften (Uhrzeit sicher erst mit dem Wochenprogramm).
      // Coach-Turniere: „10:00 · Turnier: FC Mondercange“ statt „gegen“.
      const turnier = sp.coach && !coachMitGegner(sp.coach.art);
      const was = sp.bam ? `${uhr(sp.d)}${sp.bam.zeitSicher ? "" : " (sauf changement)"} · Mini-Spieltag${wo}`
        : turnier ? `${offen ? "Uhrzeit noch offen" : uhr(sp.d)} · ${sp.coach.art}: ${sp.coach.gegner}${wo}`
        : (offen ? `Uhrzeit noch offen · gegen ${gegner}` : `${uhr(sp.d)} gegen ${gegner}`) + wo;
      const ende = t => offen ? umLux(t, 22) : d;
      if (kat !== "Seniors" && (tag === morgen || tag === heute)) {
        if (!gedeckt.has(sp.id))
          dazu({ ...basis, id: "heute:" + sp.id, art: "heute", titel: `${name} · ${tag === morgen ? "Morgen" : "Heute"} Spiel`, text: was,
                 ab: tag === morgen ? umLux(heute, 19) : Math.min(now, umLux(heute, 7, 30)), bis: ende(tag) });
      } else if (tag === heute)
        dazu({ ...basis, id: "heute:" + sp.id, art: "heute", titel: `${name} · Heute Spiel`, text: was,
               ab: kat === "Seniors" && (offen || +uhr(sp.d).slice(0, 2) >= 11) ? umLux(heute, 10) : Math.min(now, umLux(heute, 7, 30)), bis: ende(tag) });
    }
    const a = altSp.get(sp.id);
    // Uhrzeit steht fest — nur U9/U11 und nur, wenn vorher gar keine Zeit da war (00:00). Eine geänderte
    // Uhrzeit meldet die App nie: die gibt der Trainer durch, der kann intern umgestellt haben (vom Nutzer).
    if (["U9", "U11"].includes(kat) && a && ohneUhrzeit(a.d) && !offen && d > now)
      dazu({ ...basis, id: `zeit:${sp.id}:${sp.d}`, art: "uhrzeit", titel: `${name} · Uhrzeit`,
             text: `Uhrzeit steht fest: ${datum(sp.d)} um ${uhr(sp.d)} gegen ${gegner}${wo}`, ab: now, bis: d });
    // BAM: Uhrzeit steht fest, sobald das Wochenprogramm da ist (vorher nur „meist 10:30“), auch wenn es 10:30 bleibt.
    if (sp.bam?.zeitSicher && a?.bam && !a.bam.zeitSicher && d > now)
      dazu({ ...basis, id: `zeit:${sp.id}:${sp.d}`, art: "uhrzeit", titel: `${name} · Uhrzeit`,
             text: `Uhrzeit steht fest: ${datum(sp.d)} um ${uhr(sp.d)} · Mini-Spieltag${wo}`, ab: now, bis: d });
    if (kat === "Seniors" && !sp.coach) {   // Coach-Spiele: kein Ergebnis, kein Ticker
      // Endstand von der FLF (wenn niemand getickert hat; vom Ticker kommt er über den Worker, gleiche id).
      if (a && !hatErgebnis(a) && hatErgebnis(sp) && d > now - 48 * H)
        dazu({ ...basis, id: "ende:" + sp.id, art: "ende", titel: `${name} · Endstand`,
               text: `${kurz(sp.h.n)} ${sp.hs}:${sp.as} ${kurz(sp.a.n)}`, ab: now, bis: now + 18 * H });
      // Ohne FuPa-Schnittstelle (tools/fupa-modus.mjs) keine Live-Spiele für den Worker: kein Ticker/Halbzeit/Tor/Endstand von FuPa,
      // der Endstand kommt dann oben aus den FLF-Daten.
      if (FUPA.api && tag === heute && !hatErgebnis(sp))
        live.push({ id: sp.id, reiter, titel: name, d: sp.d, h: kurz(sp.h.n), a: kurz(sp.a.n), wirHeim: wirH, gegner,
                    slug: neu.fupa?.[sp.id] || undefined, anstoss: reiter.includes("Seniors 1") ? sp.d : undefined,
                    fupaWir: "fc-koeppchen", ticker: "ticker:" + sp.id, halbzeit: "halbzeit:" + sp.id, ende: "ende:" + sp.id });
    }
  }

  // Spieltag komplett (U13, U15, seit 25.10.2026 auch Seniors, vom Nutzer) und Tabelle (U13, U15, Seniors) je Mannschaft in ihrer aktuellen Klasse.
  // Alle Ligaklassen der Mannschaft, nicht nur die neueste: beim Phasenwechsel steht die neue Klasse
  // schon da, während in der alten noch die letzten Ergebnisse kommen.
  // Der alte Stand wird zu seiner eigenen Zeit beurteilt: so wird ein Spieltag auch dann „komplett“, wenn nur die Zeit
  // ein liegengebliebenes Spiel zu „verlegt“ macht.
  const altZeit = Date.parse(alt?.stand) || now;
  for (const t of teams) for (const k of t.klassen.map(id => neu.klassen[id]).filter(k => k && k.typ === "CC")) {
    const ka = alt?.klassen?.[k.id];
    if (!ka || !k.ergebnisse) continue;
    if (!["U13", "U15", "Seniors"].includes(t.kat)) continue;
    const ist = sp => unsere.has(sp.h.id) || unsere.has(sp.a.id);
    for (const tag of new Set(k.spiele.map(sp => sp.tag))) {
      const sn = spieltagStand(k.spiele, tag, now), sa = spieltagStand(ka.spiele, tag, altZeit);
      if (!sn?.komplett || sa?.komplett || sn.haupt < now - 10 * TAG_MS) continue;
      const unser = k.spiele.find(sp => sp.tag === tag && ist(sp));
      // Titel kurz (iOS schneidet ihn nach ~20 Zeichen ab, vom Nutzer 25.10.2026: „Seniors 1 · Spieltag 1…“), „komplett“ in den Text.
      dazu({ reiter: [t.reiter], id: `spieltag:${k.id}:${tag}`, art: "spieltag", titel: `${t.reiter} · Spieltag`,
             text: `Spieltag ${tag} komplett${verlegtText(sn)}: ` + (unser ? (hatErgebnis(unser) ? `${kurz(unser.h.n)} ${unser.hs}:${unser.as} ${kurz(unser.a.n)} · ` : "unser Spiel noch offen · ") : "") + "alle Ergebnisse in der App",
             ab: now, bis: now + 24 * H });
    }
    if (k.tabelle && ka.tabelle) {
      const ich = new Set(t.ids || [t.id]);
      const r = k.tabelle.find(x => ich.has(x.id)), ra = ka.tabelle.find(x => ich.has(x.id));
      // Tabelle erst, wenn der Spieltag unseres letzten Spiels komplett ist UND die FLF die Tabelle damit nachgezogen hat
      // (vom Nutzer, 25.10.2026). Eine Meldung je Spiel von uns (id mit Spielzahl, der Worker schickt jede id nur einmal).
      const g = k.spiele.filter(sp => ist(sp) && hatErgebnis(sp) && Date.parse(sp.d) <= now).sort((a, b) => Date.parse(b.d) - Date.parse(a.d))[0];
      const bereit = (kk, zeit) => tabelleFertig(kk, zeit) && !!spieltagStand(kk.spiele, g.tag, zeit)?.komplett;
      const neuFertig = g && r && ra && Date.parse(g.d) > now - 10 * TAG_MS && bereit(k, now) && !bereit(ka, altZeit);
      // id mit Spieltag (28.10.2026): Seniors 2/3 bekamen keine Tabelle, weil ihre alte id (Spielzahl) schon vor der
      // Spieltag-Regel einmal verschickt war — der Worker schickt jede id nur einmal.
      if (neuFertig)
        dazu({ reiter: [t.reiter], id: `tabelle:${k.id}:${r.id}:${r.sp}:${g.tag}`, art: "tabelle", titel: `${t.reiter} · Tabelle`,
               text: `${kurz(r.n)} jetzt ${r.pl}. Platz` + (r.sp > ra.sp ? (ra.pl !== r.pl ? ` (vorher ${ra.pl}.)` : " (wie vorher)") : "") + ` · ${r.pkt} Punkte`,
               ab: now, bis: now + 24 * H });
    }
  }

  // U13, U15: neue Phase (neue Ligaklasse mit Spielplan → eine Mitteilung) und neues Spiel (z. B. nächste
  // Pokalrunde). Vom Nutzer, 21.10.2026. Nur mit altem Stand — beim allerersten Lauf wäre sonst alles „neu“.
  if (alt?.klassen && Object.keys(alt.klassen).length)
    for (const t of teams.filter(t => ["U13", "U15"].includes(t.kat))) {
      const altT = (alt.teams || []).find(o => o.id === t.id), altKl = new Set(altT?.klassen || []);
      if (!altT) continue;
      // Coach-Spiele nicht: die bekommen mit Stufe 2 einen eigenen Haken („Trainer: neu, geändert, abgesagt“).
      const neue = eigeneSpiele(neu, t).filter(sp => !altSp.has(sp.id) && Date.parse(sp.d) > now && !sp.forfait && !sp.coach);
      const phasen = new Map(), einzeln = [];
      for (const sp of neue) {
        const k = t.klassen.map(id => neu.klassen[id]).find(k => k && k.spiele.some(x => x.id === sp.id));
        if (k && k.typ === "CC" && !altKl.has(k.id)) (phasen.get(k) || phasen.set(k, []).get(k)).push(sp);
        else einzeln.push(sp);
      }
      const wann = sp => datum(sp.d) + (ohneUhrzeit(sp.d) ? "" : ` um ${uhr(sp.d)}`);
      const gegen = sp => kurz(unsere.has(sp.h.id) ? sp.a.n : sp.h.n);
      for (const [k, l] of phasen)
        dazu({ reiter: [t.reiter], id: `phase:${k.id}:${t.id}`, art: "neu", titel: `${t.reiter} · Neue Phase`,
               text: `Spielplan ${k.n.replace(t.alter || "", "").trim() || k.n} ist da: ${l.length} ${l.length === 1 ? "Spiel" : "Spiele"}, erstes ${wann(l[0])} gegen ${gegen(l[0])}`,
               ab: now, bis: now + 48 * H });
      if (einzeln.length > 3)
        dazu({ reiter: [t.reiter], id: `neu:${t.id}:${einzeln.map(sp => sp.id).join(",")}`, art: "neu", titel: `${t.reiter} · ${einzeln.length} neue Spiele`,
               text: `Erstes ${wann(einzeln[0])} gegen ${gegen(einzeln[0])} · alle in der App`, ab: now, bis: now + 48 * H });
      else for (const sp of einzeln) {
        // Pokal ohne I/II gehört zu beiden Reitern: Titel „MIN“, beide Reiter (wie bei „Morgen Spiel“).
        const x = jeSpiel.get(sp.id), beide = x && x.reiter.length > 1;
        dazu({ reiter: beide ? x.reiter : [t.reiter], id: `neu:${sp.id}`, art: "neu", titel: `${beide ? x.kurz : t.reiter} · Neues Spiel`,
               text: `${wann(sp)} gegen ${gegen(sp)}` + (sp.ort ? ` · 📍 ${sp.ort}` : ""), ab: now, bis: Math.min(now + 48 * H, Date.parse(sp.d)) });
      }
    }

  // BGL: Spieltag komplett.
  if (neu.bgl?.spiele && alt?.bgl?.spiele)
    for (const tag of new Set(neu.bgl.spiele.map(sp => sp.tag))) {
      const sn = spieltagStand(neu.bgl.spiele, tag, now), sa = spieltagStand(alt.bgl.spiele, tag, Date.parse(alt.stand) || now);
      if (sn?.komplett && !sa?.komplett && sn.haupt > now - 10 * TAG_MS)
        dazu({ reiter: ["BGL"], id: `bgl:${neu.saison?.id}:${tag}`, art: "spieltag", titel: "BGL · Spieltag",
               text: `Spieltag ${tag} komplett${verlegtText(sn)}: alle Ergebnisse in der App`, ab: now, bis: now + 24 * H });
    }

  // Roude Léiw: Heute Spiel, Endstand (von FuPa), Liveticker über den Worker.
  const altNati = new Map((alt?.nati?.spiele || []).map(sp => [sp.id, sp]));
  for (const sp of neu.nati?.spiele || []) {
    const d = Date.parse(sp.d), lux = sp.h.n === "Luxemburg", gegner = lux ? sp.a.n : sp.h.n, basis = { reiter: ["Roude Léiw"] };
    if (tagLux(d) === heute && !hatErgebnis(sp)) {
      dazu({ ...basis, id: "nheute:" + sp.id, art: "heute", titel: "Roude Léiw · Heute",
             text: `Länderspiel um ${uhr(sp.d)} gegen ${gegner}` + (sp.wett ? ` · ${sp.wett}` : ""), ab: umLux(heute, 10), bis: d });
      if (FUPA.api && sp.slug) live.push({ id: sp.id, reiter: ["Roude Léiw"], titel: "Roude Léiw", d: sp.d, h: sp.h.n, a: sp.a.n, wirHeim: lux,
                               gegner, slug: sp.slug, fupaWir: "luxemburg-m1", ticker: "nticker:" + sp.id, halbzeit: "nhalbzeit:" + sp.id, ende: "nende:" + sp.id });
    }
    const a = altNati.get(sp.id);
    if (a && !hatErgebnis(a) && hatErgebnis(sp) && d > now - 48 * H)
      dazu({ ...basis, id: "nende:" + sp.id, art: "ende", titel: "Roude Léiw · Endstand",
             text: `${sp.h.n} ${sp.hs}:${sp.as} ${sp.a.n}`, ab: now, bis: now + 18 * H });
  }

  // Trainer-Spiele (Coach, Stufe 2, vom Nutzer 27.10.2026): Neues Spiel, Geändert, Abgesagt (auch gelöscht = Abgesagt) — eigener
  // Haken „trainer“. Erst 10 min nach der letzten Änderung (vertippt und gleich korrigiert = eine Mitteilung; zurückgeändert =
  // keine). Verglichen wird mit dem Stand, den die Eltern zuletzt hatten: `basis` im noch wartenden Ereignis, sonst der alte Abruf.
  // Neue Spiele für heute/morgen melden sich nicht extra — dafür kommt „Morgen/Heute Spiel“. Nur ab heute, nur bekannte Mannschaften.
  if (Array.isArray(alt?.coach) && Array.isArray(neu.coach)) {
    const altC = new Map(alt.coach.map(x => [x.id, x])), neuC = new Map(neu.coach.map(x => [x.id, x]));
    const FELDER = ["reiter", "art", "datum", "zeit", "gegner", "heim", "ort", "abgesagt"];
    const kern = x => x && Object.fromEntries(FELDER.map(k => [k, x[k] ?? null]));
    const platz = x => x.ort || (x.heim ? "Am Ga (Wormeldange, synth.)" : "");
    const wann = x => datum(x.datum + "T12:00:00Z") + (x.zeit ? " um " + x.zeit : "");
    const was = x => coachMitGegner(x.art) ? "gegen " + x.gegner : x.art + ": " + x.gegner;
    const voll = x => `${wann(x)} · ${was(x)}` + (platz(x) ? ` · 📍 ${platz(x)}` : "");
    for (const id of new Set([...altC.keys(), ...neuC.keys()])) {
      const a = altC.get(id), n = neuC.get(id), x = n || a;
      if (a && n && a.geaendert === n.geaendert) continue;
      const rs = coachTeile(x.reiter).filter(r => teams.some(t => t.reiter === r)), nm = coachName(rs.join("+"));
      if (x.datum < heute || !rs.length) continue;
      const w = [...aus.values()].find(e => e.art === "trainer" && e.spiel === id && e.ab > now);
      const basis = w ? w.basis : kern(a);   // null: die Eltern kennen das Spiel noch nicht
      if (w) aus.delete(w.id);
      const [hh, mm] = (x.zeit || "22:00").split(":").map(Number), start = umLux(x.datum, hh, mm);
      let ab = n ? Date.parse(n.geaendert) + 10 * 60e3 : now + 10 * 60e3;
      if (ab >= start) ab = now;   // kurz vor dem Spiel geändert: gleich
      const e = { reiter: rs, art: "trainer", spiel: id, basis, ab, bis: Math.min(start, ab + 48 * H) };
      if (!n) {   // gelöscht
        if (basis && !basis.abgesagt) dazu({ ...e, id: `trainer:${id}:weg`, titel: `${nm} · Abgesagt`, text: `${voll(basis)} fällt aus` });
        continue;
      }
      const k = kern(n);
      if (!basis) {
        if (n.abgesagt || n.datum <= morgen) continue;
        dazu({ ...e, id: `trainer:${id}:${n.geaendert}`, titel: `${nm} · Neues Spiel`, text: voll(n) });
      } else if (!basis.abgesagt && k.abgesagt) {
        dazu({ ...e, id: `trainer:${id}:${n.geaendert}`, titel: `${nm} · Abgesagt`, text: `${voll(n)} fällt aus` });
      } else if (!basis.abgesagt && !k.abgesagt) {
        // Wieder angesetzt (vorher abgesagt) meldet sich nicht (vom Nutzer: „die Kinder sind ja da“).
        const vorher = [];
        if (basis.datum !== k.datum || basis.zeit !== k.zeit) vorher.push(wann(basis));
        if (basis.gegner !== k.gegner || basis.art !== k.art) vorher.push(was(basis));
        if (platz(basis) !== platz(k)) vorher.push(platz(basis) ? "📍 " + platz(basis) : "ohne Platz");
        if (basis.reiter !== k.reiter) vorher.push(coachName(basis.reiter));
        if (vorher.length) dazu({ ...e, id: `trainer:${id}:${n.geaendert}`, titel: `${nm} · Geändert`, text: `Jetzt ${voll(n)} (vorher ${vorher.join(", ")})` });
      }
    }
  }

  // Unsere Woche: montags 10:00 (vom Nutzer, 21.10.2026) „Diese Woche n Spiele, davon m zu Hause“ (ab So 22 Uhr vorbereitet).
  const mo = (() => { const t = tagLux(now + 2 * H); const w = (new Date(t + "T12:00:00Z").getUTCDay() + 6) % 7; return tagLux(Date.parse(t + "T12:00:00Z") - w * 24 * H); })();
  const so = tagLux(Date.parse(mo + "T12:00:00Z") + 6 * 24 * H);
  const woche = [...jeSpiel.values()].filter(({ sp }) => { const t = tagLux(Date.parse(sp.d)); return !sp.abgesagt && t >= mo && t <= so; });
  if (woche.length) {
    const heim = woche.filter(({ sp }) => unsere.has(sp.h.id)).length;
    dazu({ reiter: ["Woche"], id: "woche:" + mo, art: "woche", titel: "Unsere Woche",
           text: `Diese Woche ${woche.length} ${woche.length === 1 ? "Spiel" : "Spiele"}, davon ${heim} zu Hause`,
           ab: umLux(mo, 10), bis: umLux(mo, 22) });
  }

  return { ereignisse: [...aus.values()].sort((x, y) => x.ab - y.ab || x.id.localeCompare(y.id)), live };
}
