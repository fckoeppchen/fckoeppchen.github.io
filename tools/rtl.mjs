// RTL Live Arena (vom Nutzer, 31.10.2026): RTL überträgt die Spiele der Seniors 1 als Video, live und danach als ganzes Spiel.
// Die App verlinkt nur die Spielseite bei RTL (play.rtl.lu/live-arena/<id>, Player direkt — seit neu g; vorher www.rtl.lu/live-arena/match?m=<id>, dort musste man erst Play tippen) — im „Heute“-Kasten und im Kasten „Letztes Spiel“.
// Das Video selbst abzuspielen ginge technisch, braucht aber das Okay von RTL (siehe IDEEN.md).
// Hier: zu jedem Spiel der Seniors 1 die RTL-Nummer finden (gleicher Tag, Koeppchen spielt, RTL hat ein Video).

const API = "https://api-gate.rtl.lu/sport/v4/";
const TZ = "Europe/Luxembourg";
const tagLux = ms => new Date(ms).toLocaleDateString("sv-SE", { timeZone: TZ });
const WIR = /Koeppchen/i;
// Wettbewerbe der Männer, in denen Seniors 1 spielen kann (Liga je nach Auf-/Abstieg, dazu der Pokal).
const PASST = /BGL|Éierepromotioun|Ehrenpromotion|Divisioun|Coupe de Luxembourg/i;
const POKAL = /Coupe de Luxembourg/i;

const holen = async pfad => { const r = await fetch(API + pfad); if (!r.ok) throw new Error("RTL " + pfad + ": HTTP " + r.status); return r.json(); };

// Spiele mit Koeppchen und Video aus einer Ergebnisliste von RTL: [{id, tag}].
export function unsereRtlSpiele(liste) {
  return (liste?.matches || [])
    .filter(m => m.has_video && WIR.test(`${m.home_team?.name || ""} ${m.visitor_team?.name || ""}`))
    .map(m => ({ id: m.id, tag: m.date }));
}

// Spiele dieser Mannschaft (die Klassen enthalten alle Spiele der Liga), ohne Trainer-Spiele.
const unsereSpiele = (D, team) => {
  const ids = new Set(team.ids || [team.id]);
  return (team.klassen || []).flatMap(k => D.klassen?.[k]?.spiele || []).filter(sp => !sp.coach && (ids.has(sp.h.id) || ids.has(sp.a.id)));
};
// FLF-Spiele der Seniors 1 (Reiter „Seniors 1“, keine Trainer-Spiele) mit den RTL-Spielen über den Tag verbinden.
// Alte Zuordnungen bleiben (RTL führt nur die aktuelle und die letzten Runden), weg nach 30 Tagen.
export function rtlZuordnen(D, rtl, alt, now) {
  const team = (D.teams || []).find(t => t.reiter === "Seniors 1");
  const aus = {};
  const grenze = tagLux(now - 30 * 864e5);
  if (!team) return aus;
  const spiele = unsereSpiele(D, team);
  for (const sp of spiele) {
    const tag = tagLux(Date.parse(sp.d));
    if (tag < grenze) continue;
    if (alt?.[sp.id]) aus[sp.id] = alt[sp.id];
    const r = rtl.filter(x => x.tag === tag);
    if (r.length === 1) aus[sp.id] = r[0].id;   // zwei Koeppchen-Spiele am selben Tag gibt es bei den Seniors 1 nicht — sonst lieber keins
  }
  return aus;
}

// Wann fragen: beim allerersten Mal, um 7 Uhr (Tagesabruf) und an Tagen mit einem Spiel der Seniors 1 (gestern bis morgen).
export function rtlFaellig(D, alt, now) {
  if (!alt) return true;
  if (+new Date(now).toLocaleString("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }) === 7) return true;
  const team = (D.teams || []).find(t => t.reiter === "Seniors 1");
  const tage = new Set([tagLux(now - 864e5), tagLux(now), tagLux(now + 864e5)]);
  return !!team && unsereSpiele(D, team).some(sp => tage.has(tagLux(Date.parse(sp.d))));
}

// {saison, wettbewerbe: [Liga-Ids, in denen Koeppchen gefunden wurde], pokal: Id der Coupe de Luxembourg, spiele: {FLF-Spiel-Id: RTL-Spiel-Id}}.
// Gemerkte Liga zuerst (2 Abfragen je Wettbewerb: aktuelle und vorige Runde); nur ohne Treffer alle Wettbewerbe der Saison.
// Den Pokal immer dazu (7.11.2026: Rodange – Koeppchen hatte ein Video, aber die gemerkte Liga fand immer etwas, also wurde
// der Pokal nie durchsucht). Neue Saison bei RTL → alles neu suchen. `hol` nur für den Test.
export async function rtlHolen(D, alt, now = Date.now(), hol = holen) {
  const runden = async c => {
    const akt = await hol(`competitions/${c}/results/current?lang=lu`);
    const r = akt.rounds || [], i = r.findIndex(x => x.id === akt.round?.id);
    const vor = i > 0 ? await hol(`competitions/${c}/results/${r[i - 1].id}?lang=lu`) : null;
    return [...unsereRtlSpiele(akt), ...unsereRtlSpiele(vor)];
  };
  const saison = (await hol("sports/1")).current_season_id;
  const gleich = alt?.saison === saison || (alt && alt.saison === undefined);   // alter Stand ohne Saison: Liga gilt weiter
  let wettbewerbe = gleich ? (alt.wettbewerbe || []).filter(c => c !== alt.pokal) : [], pokal = alt?.saison === saison ? alt.pokal : undefined;
  let liste = null;
  const alle = async () => liste ??= (await hol(`seasons/${saison}/competitions`)).filter(c => PASST.test(c.name));
  if (pokal == null) pokal = (await alle()).find(c => POKAL.test(c.name))?.id ?? 0;
  const gefunden = [];
  for (const c of wettbewerbe) gefunden.push(...await runden(c));
  if (!gefunden.length) {
    wettbewerbe = [];
    for (const c of (await alle()).filter(c => c.id !== pokal)) {
      const s = await runden(c.id);
      if (s.length) { wettbewerbe.push(c.id); gefunden.push(...s); }
    }
  }
  if (pokal) gefunden.push(...await runden(pokal));
  return { saison, wettbewerbe, pokal, spiele: rtlZuordnen(D, gefunden, alt?.spiele, now) };
}
