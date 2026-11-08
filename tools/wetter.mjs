// Wetter zum Anpfiff (vom Nutzer, 8.11.2026): für unsere Spiele von heute und morgen das Wetter am Ort des Platzes zur
// Anstoßzeit, von Open-Meteo (frei, ohne Schlüssel; Modelle u. a. DWD, Météo-France, ECMWF). Geholt vom Abruf auf GitHub,
// nicht vom Handy. Ort = Postleitzahl + Ort aus D.adressen (FLF-Ortsliste), Koordinaten über die Ortssuche von Open-Meteo,
// gemerkt in D.wetterOrte. Ergebnis D.wetter = { Spiel-Id: { c: Wettercode, t: °C, r: Regen-%, w: Wind km/h } }.

const TZ = "Europe/Luxembourg";
const tagLux = ms => new Date(ms).toLocaleDateString("sv-SE", { timeZone: TZ });
const holen = async url => { const r = await fetch(url); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); };

// „Rue d'Athus, L-4711 Petange“ → { land: "LU", plz: "4711", name: "Petange" }
export function ortAus(adresse) {
  const m = (adresse || "").match(/\b([LDFB])-(\d{4,5})\s+(.+)$/);
  if (!m) return null;
  return { land: { L: "LU", D: "DE", F: "FR", B: "BE" }[m[1]], plz: m[2], name: m[3].trim() };
}

// Spiele, für die das Wetter gebraucht wird: heute und morgen (Luxemburger Zeit), Uhrzeit fest, Adresse bekannt, nicht abgesagt.
export function wetterSpiele(spiele, adressen, now) {
  const tage = new Set([tagLux(now), tagLux(now + 864e5)]);
  return spiele.filter(sp => tage.has(tagLux(Date.parse(sp.d))) && !/T00:00(:0[01])?/.test(sp.d)
    && !sp.abgesagt && sp.ort && ortAus((adressen || {})[sp.ort]));
}

// Aus der stündlichen Vorhersage den Wert zur Anstoßstunde (Ortszeit, auf die volle Stunde gerundet). Gerundet: Temperatur ganz,
// Regen auf 10 %, Wind auf 5 km/h — sonst gäbe fast jeder Abruf einen neuen Commit.
export function wetterZu(stunden, d) {
  const ms = Date.parse(d) + 30 * 60e3;
  const stunde = new Date(ms).toLocaleString("sv-SE", { timeZone: TZ, hourCycle: "h23" }).replace(" ", "T").slice(0, 13) + ":00";
  const i = (stunden.time || []).indexOf(stunde);
  if (i < 0) return null;
  const v = k => stunden[k]?.[i];
  if (v("temperature_2m") == null) return null;
  return { c: v("weather_code") ?? null, t: Math.round(v("temperature_2m")), r: Math.round((v("precipitation_probability") ?? 0) / 10) * 10,
           w: Math.round((v("wind_speed_10m") ?? 0) / 5) * 5 };
}

export async function wetterHolen(spiele, adressen, altOrte = {}, now = Date.now(), hol = holen) {
  const orte = { ...altOrte }, wetter = {};
  const liste = wetterSpiele(spiele, adressen, now);
  const jeOrt = new Map();
  for (const sp of liste) { const o = ortAus(adressen[sp.ort]), k = `${o.land}-${o.plz} ${o.name}`; (jeOrt.get(k) || jeOrt.set(k, { o, spiele: [] }).get(k)).spiele.push(sp); }
  for (const [k, { o, spiele: l }] of jeOrt) {
    if (!orte[k]) {
      const g = await hol(`https://geocoding-api.open-meteo.com/v1/search?count=10&language=de&countryCode=${o.land}&name=${encodeURIComponent(o.name)}`);
      const r = (g.results || []).find(x => (x.postcodes || []).includes(o.plz)) || (g.results || [])[0];
      if (!r) continue;
      orte[k] = [Math.round(r.latitude * 1000) / 1000, Math.round(r.longitude * 1000) / 1000];
    }
    const [lat, lon] = orte[k];
    const f = await hol(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m&timezone=${encodeURIComponent(TZ)}&forecast_days=3`);
    for (const sp of l) { const w = wetterZu(f.hourly || {}, sp.d); if (w) wetter[sp.id] = w; }
  }
  return { wetter, orte };
}
export { tagLux };
