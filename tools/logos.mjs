// Vereinslogos aus dem FLF-Extranet (vom Nutzer, 18.11.2026): groß im Heute-/Morgen-/Letztes-Spiel-Kasten, klein in den
// Tabellen und in der Form-Zeile. Das Extranet liefert je Verein (nicht je Mannschaft) ein SVG unter
// /api/export/clublogo/<Vereinsnummer> — manche über 1 MB. Der Abruf rechnet jedes einmal in ein PNG von höchstens
// 128×128 um (rsvg-convert, ~10–20 KB) und legt es unter bilder/logos/<Vereinsnummer>.png ab. Spielgemeinschaften (ENT)
// haben kein eigenes: dort kommt das des ersten Vereins (clubId1). Unser eigenes zeigt die App aus dem Vereinslogo.
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const LOGO_URL = "https://extranet.flf.lu/api/export/clublogo/";
const ORDNER = new URL("../bilder/logos/", import.meta.url);

// Mannschaft (FLF-Nummer) → Verein (clubId1) aus rohen FLF-Spielen.
export function vereineAus(spiele, map = {}) {
  for (const m of spiele || []) for (const t of [m.homeTeam, m.awayTeam]) if (t && t.id && t.clubId1) map[t.id] = t.clubId1;
  return map;
}

// Für jede Mannschaft mit Logo-Datei: { Mannschaft: Verein }. Fehlende Logos werden geholt; was nicht klappt, bleibt ohne.
// `holen(verein)` gibt das SVG als Buffer (oder wirft), `umrechnen(svg, ziel)` schreibt das PNG — beides austauschbar für Tests.
export async function logosHolen(vereine, { ordner = ORDNER, holen = svgHolen, umrechnen = pngAus, eigen } = {}) {
  mkdirSync(ordner, { recursive: true });
  const da = new Set(readdirSync(ordner).filter(f => f.endsWith(".png")).map(f => +f.slice(0, -4)));
  const aus = {}, fehler = [];
  let neu = 0;
  for (const c of new Set(Object.values(vereine))) {
    if (c === eigen || da.has(c)) continue;
    try { umrechnen(await holen(c), new URL(c + ".png", ordner).pathname); da.add(c); neu++; }
    catch (e) { fehler.push(c + ": " + e.message); }
  }
  for (const [t, c] of Object.entries(vereine)) if (c === eigen || da.has(c)) aus[t] = c;
  return { logos: aus, neu, fehler };
}

async function svgHolen(c) {
  await new Promise(r => setTimeout(r, 300));   // die FLF-Seite kappte beim Ausprobieren einmal die Verbindung
  const r = await fetch(LOGO_URL + c);
  if (!r.ok) throw new Error("HTTP " + r.status);
  const b = Buffer.from(await r.arrayBuffer());
  if (!/<svg[\s>]/.test(b.subarray(0, 4000).toString("utf8"))) throw new Error("kein SVG");
  // Swift Hesperange (18.11.2026): eingebettetes Bild als „data:img/png“ statt „data:image/png“ — rsvg-convert ließ es weg.
  return Buffer.from(b.toString("latin1").replace(/data:img\//g, "data:image/"), "latin1");
}

function pngAus(svg, ziel) {
  const dir = mkdtempSync(join(tmpdir(), "logo-"));
  try {
    writeFileSync(join(dir, "ein.svg"), svg);
    execFileSync("rsvg-convert", ["-w", "128", "-h", "128", "-a", "-f", "png", "-o", ziel, join(dir, "ein.svg")]);
    // Ein leeres Bild (nur durchsichtig, wenige hundert Byte) zählt nicht als Logo — lieber keins als ein Loch.
    if (!existsSync(ziel) || statSync(ziel).size < 600) { rmSync(ziel, { force: true }); throw new Error("leeres PNG"); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
