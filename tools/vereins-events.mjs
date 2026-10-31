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

export function seitenText(html) {
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ");
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

// [{t, url, tag|null, bild|null}]. Fehler bei einer Seite → ohne Datum/Bild, Fehler beim Menü → Ausnahme (alter Stand bleibt).
export async function eventsHolen(now = Date.now()) {
  const menue = eventMenue(await holen(HOMEPAGE));
  const aus = [];
  for (const e of menue) {
    let tag = null, bild = null;
    try {
      const html = await holen(e.url);
      tag = eventDatum(seitenText(html), now);
      try { bild = await eventBild(seitenBilder(html)); } catch (x) { console.error("Event-Bild", e.t, x.message); }
    } catch (x) { console.error("Event", e.t, x.message); }
    aus.push({ ...e, tag, bild });
  }
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
