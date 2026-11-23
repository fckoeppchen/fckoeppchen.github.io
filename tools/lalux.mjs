// LALUX Indoor Cup (Hallen-Meisterschaft der Jugend im Winter, vom Nutzer 23.11.2026: automatisch aus den FLF-PDFs).
// Seite www.flf.lu/lalux-indoor-84127v4: je Altersklasse ein PDF („2026-2027 LALUX MINIMES.pdf“, POUSSINS, PUPILLES).
// Aufbau je Runde („U13 MINIMES - 1er tour“, „2e tour“, „3e tour“, „Finale“): „Tournois du weekend du 02/01/2027“, dann
// Gruppen in drei Spalten — Kopf „Groupe K (6)“, darunter Halle und Termin „ROSPORT - 03/01 14.00“ (auch „DIFFERDANGE 05/12
// 09.00“ ohne Strich oder „CONSDORF - 13.12. 14.00“), darunter die Mannschaften (die erste ist der Gastgeber). Die späteren
// Runden stehen schon als leere Gerüste im selben PDF und werden von der FLF gefüllt.
//
// Wie bei den Bambinis: lieber nichts als etwas Falsches. Steht Koeppchen in einer Gruppe, deren Halle/Termin nicht ins Muster
// passt, bricht das Lesen ab und der alte Stand bleibt (Aufrufer).

import { bboxSeiten, pdfListe, isoLux } from "./bambini.mjs";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const SEITE = "https://www.flf.lu/lalux-indoor-84127v4";
export const WIR = /^FC Koeppchen Wormeldange( (I|II))?$/;
// Nur die Jungen-Kategorien: Mädchen spielen als Entente (WU11/WU13, eigene PDFs, falls es sie gibt).
export const KATEGORIEN = [[/MINIMES/i, "U13"], [/POUSSINS/i, "U11"], [/PUPILLES/i, "U9"]];
const RUNDE = { "1er": 1, "1re": 1, "2e": 2, "3e": 3, "4e": 4 };

// Zeilen: Wörter gleicher Höhe (±2 pt).
function zeilen(woerter) {
  const z = [];
  for (const w of [...woerter].sort((a, b) => a.y - b.y || a.x0 - b.x0)) {
    const r = z.find(r => Math.abs(r.y - w.y) < 2);
    r ? r.w.push(w) : z.push({ y: w.y, w: [w] });
  }
  for (const r of z) { r.w.sort((a, b) => a.x0 - b.x0); r.text = r.w.map(w => w.t).join(" "); }
  return z;
}

// „ROSPORT - 03/01 14.00“ → { halle: "Rosport", tag: 3, monat: 1, zeit: "14:00" }; Uhrzeit darf fehlen (dann null).
export function halleTermin(s) {
  const m = String(s).replace(/\s+/g, " ").trim().match(/^(.+?)\s*[-–]?\s*(\d{1,2})(?:\/(\d{1,2})|\.(\d{1,2})\.)(?:\s+(\d{1,2})[.:h](\d{2}))?$/);
  // Datum „03/01“ oder „13.12.“ (mit Punkt danach) — „14.00“ allein ist eine Uhrzeit, kein Datum.
  if (!m || !/[A-Za-zÀ-ÿ]/.test(m[1])) return null;
  const monat = +(m[3] || m[4]);
  if (monat < 1 || monat > 12 || +m[2] < 1 || +m[2] > 31) return null;
  const halle = m[1].replace(/\s*[-–]\s*$/, "").toLowerCase().replace(/(^|[\s/(-])([a-zà-ÿ])/g, (x, a, b) => a + b.toUpperCase())
    .replace(/-(La|Le|Les|Sur|Sous|Du|De)-/g, x => x.toLowerCase());   // Weiler-la-Tour, Esch-sur-Alzette
  return { halle, tag: +m[2], monat, zeit: m[5] ? m[5].padStart(2, "0") + ":" + m[6] : null };
}

// Jahr zum Tag/Monat: aus dem „weekend du …/2027“ der Runde, sonst aus der Saison im Dateinamen („2026-2027“).
function jahrZu(monat, wochenende, saison) {
  if (wochenende) {
    const { j, m } = wochenende;
    return m >= 7 && monat < 7 ? j + 1 : m < 7 && monat >= 7 ? j - 1 : j;
  }
  if (saison) return monat >= 7 ? saison : saison + 1;
  throw new Error("LALUX: Jahr unbekannt");
}

// Alle Gruppen mit Koeppchen aus einem PDF: [{runde, gruppe, datum, zeit, halle, teams[]}]. `saison` = erstes Jahr.
export function gruppen(seiten, saison = null) {
  const aus = [];
  let runde = null, wochenende = null;
  for (const woerter of seiten) {
    const z = zeilen(woerter);
    let kopf = null;          // aktuelle Reihe von Gruppen: [{gruppe, mitte, rows: [[wörter]]}]
    const fertig = () => {
      if (!kopf) return;
      for (const g of kopf) {
        const zeilenText = g.rows.map(ws => ws.map(w => w.t).join(" ").replace(/\s+/g, " ").trim()).filter(Boolean);
        if (!zeilenText.some(t => WIR.test(t))) continue;
        const ht = halleTermin(zeilenText[0] || "");
        const teams = zeilenText.slice(1);
        if (!ht || teams.length < 3 || teams.length > 10 || runde == null)
          throw new Error(`LALUX Gruppe ${g.gruppe}: nicht lesbar (${zeilenText.join(" / ")})`);
        const j = jahrZu(ht.monat, wochenende, saison);
        aus.push({ runde, gruppe: g.gruppe, datum: `${j}-${String(ht.monat).padStart(2, "0")}-${String(ht.tag).padStart(2, "0")}`,
          zeit: ht.zeit, halle: ht.halle, teams });
      }
      kopf = null;
    };
    for (const r of z) {
      const t = r.text;
      const rd = t.match(/\b(1er|1re|2e|3e|4e)\s+tour\b/i) || (/\bFinale\b/.test(t) && /équipes|equipes/i.test(t) ? ["", "finale"] : null);
      if (rd) { fertig(); runde = rd[1] === "finale" ? "Finale" : RUNDE[rd[1].toLowerCase()]; continue; }
      const we = t.match(/[Ww]eekend du .*?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (we) { fertig(); wochenende = { j: +we[3], m: +we[2] }; continue; }
      // Kopfzeile einer Gruppenreihe: „Groupe A (7) Groupe E (7) Groupe I (7)“.
      const gs = [];
      for (let i = 0; i < r.w.length - 1; i++)
        if (r.w[i].t === "Groupe" && /^[A-Z]$/.test(r.w[i + 1].t)) {
          const ende = r.w[i + 2] && /^\(\d+\)$/.test(r.w[i + 2].t) ? r.w[i + 2] : r.w[i + 1];
          gs.push({ gruppe: r.w[i + 1].t, mitte: (r.w[i].x0 + ende.x1) / 2, rows: [] });
        }
      if (gs.length) { fertig(); kopf = gs; continue; }
      if (!kopf) continue;
      // Jedes Wort zur nächstgelegenen Gruppe (nach der Mitte des Kopfs) — lange Namen laufen über die Spalte.
      const je = kopf.map(() => []);
      for (const w of r.w) {
        const m = (w.x0 + w.x1) / 2;
        let best = 0;
        kopf.forEach((g, i) => { if (Math.abs(g.mitte - m) < Math.abs(kopf[best].mitte - m)) best = i; });
        je[best].push(w);
      }
      // Wörter einer Zelle hängen eng zusammen; eine große Lücke heißt: falsche Spalte erwischt → Wort zur Nachbarspalte.
      kopf.forEach((g, i) => g.rows.push(je[i]));
    }
    fertig();
  }
  return aus;
}

// Format von aufbereiten(): je Mannschaft eine Klasse „lalux-<id>“ (typ FM, ohne Ergebnisse) bei jeder Mannschaft der
// Altersklasse (die Kinder werden jede Woche neu auf 1/2 verteilt, die FLF meldet eine Mannschaft je Klasse). Meldet die FLF
// „… I“/„… II“, nur bei dieser Mannschaft. Ein Spiel = ein Turniertag, Gegner „LALUX Indoor Cup · Gruppe K“.
export function laluxDazu(D, liste) {
  const VEREIN = "FC Koeppchen Wormeldange";
  for (const x of [...(liste || [])].sort((a, b) => a.datum.localeCompare(b.datum))) {
    const wir = x.teams.find(n => WIR.test(n));
    const nr = / II$/.test(wir) ? 2 : / I$/.test(wir) ? 1 : 0;
    const alle = D.teams.filter(t => t.kat === x.kat && !String(t.reiter).startsWith("BAM"));
    const ts = nr ? alle.filter(t => String(t.reiter).endsWith(" " + nr)) : alle;
    if (!ts.length) continue;
    const kurz = ts[0].kurz || x.kat, mehrere = ts.length > 1 ? kurz : null;
    const heim = x.teams[0] === wir;
    const runde = x.runde === "Finale" ? "Finale" : `${x.runde}. Runde`;
    const id = Number(`7${x.datum.replace(/-/g, "")}${String(x.kat).replace(/\D/g, "").padStart(2, "0")}`);
    for (const t of ts) {
      const kid = "lalux-" + t.id;
      D.klassen[kid] ??= { id: kid, n: "LALUX Indoor Cup", typ: "FM", ergebnisse: false, tabelle: null, spiele: [], start: x.datum };
      if (!t.klassen.includes(kid)) t.klassen.push(kid);
      if (D.klassen[kid].spiele.some(s => s.id === id)) continue;
      const w = { id: t.id, n: mehrere ? `${VEREIN} ${mehrere}` : t.n }, g = { id: 0, n: `LALUX Indoor Cup · Gruppe ${x.gruppe}` };
      D.klassen[kid].spiele.push({ id, d: isoLux(x.datum, x.zeit || "00:00"), tag: null, h: heim ? w : g, a: heim ? g : w,
        hs: null, as: null, gespielt: false, forfait: false, ort: x.halle,
        lalux: { runde, gruppe: x.gruppe, mit: x.teams.filter(n => n !== wir), ...(mehrere ? { mannschaften: mehrere } : {}) } });
    }
  }
  for (const k of Object.values(D.klassen)) if (String(k.id).startsWith("lalux-")) k.spiele.sort((a, b) => a.d.localeCompare(b.d));
}

function pdfWoerter(buf) {
  const dir = mkdtempSync(join(tmpdir(), "lalux-"));
  try {
    writeFileSync(join(dir, "a.pdf"), buf);
    execFileSync("pdftotext", ["-bbox", join(dir, "a.pdf"), join(dir, "a.html")]);
    return bboxSeiten(readFileSync(join(dir, "a.html"), "utf8"));
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

async function holen(url, als = "text") {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return als === "text" ? await r.text() : Buffer.from(await r.arrayBuffer());
      if (r.status < 500) throw new Error(url + " " + r.status);
    } catch (e) { if (i === 2) throw e; }
    await new Promise(r => setTimeout(r, 2000));
  }
}

// Alles zusammen: [{kat, runde, gruppe, datum, zeit, halle, teams}]. Wirft bei jedem Zweifel — der Aufrufer behält den alten Stand.
export async function laluxHolen() {
  const pdfs = pdfListe(await holen(SEITE)).filter(p => /LALUX/i.test(p.name) && !/Calendrier/i.test(p.name));
  const aus = [], quellen = [];
  for (const p of pdfs) {
    const kat = KATEGORIEN.find(([re]) => re.test(p.name) && !/\bF(ILLES)?\b|FEMININ|WU\d/i.test(p.name))?.[1];
    if (!kat) continue;
    const s = p.name.match(/(20\d\d)\s*-\s*20\d\d/);
    for (const g of gruppen(pdfWoerter(await holen(p.url, "buf")), s ? +s[1] : null)) aus.push({ kat, ...g });
    quellen.push(p.name);
  }
  if (!quellen.length) throw new Error("LALUX: keine PDFs auf " + SEITE);
  return { liste: aus, quellen };
}
