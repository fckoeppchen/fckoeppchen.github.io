// Abruf FLF → data/fussball.json für die App (index.html).
// Läuft als GitHub Action (.github/workflows/fussball.yml), lokal: node tools/fussball.mjs
// Quelle ist die GraphQL-Schnittstelle hinter https://extranet.flf.lu/match, die ohne
// Anmeldung antwortet, aber keine CORS-Freigabe schickt — darum dieser Umweg.
// Gesucht wird nach dem Verein, nicht nach einer Klasse: Steigt eine Mannschaft auf,
// erscheint die neue Klasse mit ihrem ersten Spiel von selbst.

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from "node:fs";
import { isoLux } from "./bambini.mjs";
import { FUPA as FUPA_MODUS } from "./fupa-modus.mjs";

export const API = "https://extranet.flf.lu/api/graphql";
export const CLUB = 1003703;          // Wormeldange FC Koeppchen
// Altersklassen in der Reihenfolge der Reiter (vom Nutzer so festgelegt). id = ageCategoryId
// der FLF. Die Réserves sind bei der FLF eine eigene Kategorie („Seniors (R)“, 9999) und stehen
// am Ende als „Seniors 2“ (Réserves I) und „Seniors 3“ (Réserves II): `plus` verschiebt die
// Nummer, `ohne` ist die Nummer einer Mannschaft ohne I/II. U7 hat noch keine Spiele (18.10.2026).
// `reihe` = Platz der Reiter (vom Nutzer, 23.10.2026: U15 vor U13); der Index bleibt, die Tests hängen daran.
// `kurz` = Name der Kinder-Mannschaften in Reitern, Mitteilungen und Kalender (vom Verein, 23.10.2026: „MIN 1“
// statt „U13 1“, SCO, POU, PUP). Die Dateinamen der Einzel-Kalender bleiben beim alten Namen (u13-1.ics).
export const AGES = [
  { id: 1,  kat: "Seniors", n: "Seniors", ohne: 1, reihe: 0 },
  { id: 4,  kat: "U13", n: "U13 Minimes", reihe: 2, kurz: "MIN" },
  { id: 11, kat: "U15", n: "U15 Scolaires", reihe: 1, kurz: "SCO" },
  { id: 7,  kat: "U11", n: "U11 Poussins", reihe: 3, kurz: "POU" },
  { id: 5,  kat: "U9",  n: "U9 Pupilles", reihe: 4, kurz: "PUP" },
  { id: 9999, kat: "Seniors", n: "Seniors Réserves", plus: 1, reihe: 5 },
];
const OUT = new URL("../data/fussball.json", import.meta.url);
const MITT = new URL("../data/mitteilungen.json", import.meta.url);
const KAL = new URL("../kalender/", import.meta.url);
// Schreibweise vom Nutzer (23.10.2026).
const GRUPPEN = { U15: "Scolaires U15", U13: "Minimes U13", U11: "Poussins U11", U9: "Pupilles U9" };
export const VEREIN = "FC Koeppchen Wormeldange";

const M_FIELDS = `match{ id gameday matchDate isPlayed isForfait homeScore awayScore finalHomeScore finalAwayScore finalScoreComment }
  division{ id name showResult showRanking } matchType{ id }
  homeTeam{ id name clubId1 clubId2 clubId3 clubId4 } awayTeam{ id name clubId1 clubId2 clubId3 clubId4 }
  sportField{ name }`;

const Q_DEFAULTS = `{ defaultValues{ currentSeasonId } seasons{ id name startDate endDate } }`;
const Q_MATCHES = `query($c: MatchCriteria){ matches(criteria:$c){ ${M_FIELDS} } }`;
const Q_RANKING = `query($c: MatchCriteria){ rankings(criteria:$c){
  ranking{ rank teamId totalPlays totalWins totalDraws totalLosses totalOwnGoals totalAgainstGoals totalPoints } team{ id name } } }`;

const pause = ms => new Promise(r => setTimeout(r, ms));

async function gq(query, variables = {}) {
  // Die Seite hat beim Ausprobieren einmal die Verbindung gekappt: ein zweiter Versuch, langsam.
  for (let versuch = 1; ; versuch++) {
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, variables }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (j.errors?.length) throw new Error(j.errors.map(e => e.message).join("; "));
      return j.data;
    } catch (e) {
      if (versuch >= 3) throw e;
      await pause(5000 * versuch);
    }
  }
}

const day = iso => iso.slice(0, 10);
const istVerein = t => t && [t.clubId1, t.clubId2, t.clubId3, t.clubId4].includes(CLUB);

// Bemerkung der FLF zum Endergebnis. Sie kommt mit kaputten Umlauten („Arr\uFFFDt\uFFFD“), die bekannten werden repariert.
export function bemerkung(t) {
  if (!t) return undefined;
  if (/^arr.t.$/i.test(t.trim())) return "Arrêté";
  return t.replace(/\uFFFD/g, "?");
}

// Ein Spiel aus der Schnittstelle → schlankes Format der App.
export function spiel(m) {
  const x = m.match, final = x.finalHomeScore != null;
  // U9/U11: Die FLF veröffentlicht keine Ergebnisse (showResult false), ihre Schnittstelle liefert sie aber
  // mit. Wir speichern sie gar nicht erst (24.10.2026, Wunsch des Vereins: keine Ergebnisse bei den Kleinen).
  const ohne = m.division?.showResult === false;
  return {
    id: x.id,
    d: x.matchDate,
    tag: x.gameday,
    h: { id: m.homeTeam.id, n: m.homeTeam.name },
    a: { id: m.awayTeam.id, n: m.awayTeam.name },
    hs: ohne ? null : final ? x.finalHomeScore : x.homeScore,
    as: ohne ? null : final ? x.finalAwayScore : x.awayScore,
    // Abgebrochene Spiele („Arrêté“) führt die FLF als nicht gespielt, aber mit gewertetem Endergebnis
    // (24.10.2026, U15 gegen Oberkorn 2:0): ein Endergebnis zählt darum als gespielt.
    gespielt: !!x.isPlayed || (final && !x.isForfait),
    forfait: !!x.isForfait,
    bem: bemerkung(x.finalScoreComment),
    ort: m.sportField?.name || undefined,
  };
}

export function tabelle(rankings) {
  return rankings
    .map(r => ({
      pl: r.ranking.rank, id: r.team.id, n: r.team.name,
      sp: r.ranking.totalPlays, s: r.ranking.totalWins, u: r.ranking.totalDraws, nl: r.ranking.totalLosses,
      t: r.ranking.totalOwnGoals, g: r.ranking.totalAgainstGoals, pkt: r.ranking.totalPoints,
    }))
    .sort((a, b) => a.pl - b.pl);
}

// Reiter: „U13 1“, „U13 2“ (vom Nutzer so gewünscht, arabisch statt I/II). Réserves I/II
// heißen „Seniors 2/3“ (`plus`), die erste Mannschaft ohne I/II „Seniors 1“ (`ohne`).
const ARAB = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
export function reiter(t, lang = false) {
  const r = t.n.replace(VEREIN, "").trim();
  const nr = ARAB[r] ? ARAB[r] + (t.plus || 0) : r || t.ohne;
  return [(!lang && t.kurz) || t.kat, nr].filter(Boolean).join(" ") || t.n;
}

// Alle Spiele einer Reiter-Mannschaft (eigene + angehängte Pokalmannschaften), nach Datum.
export const nummern = t => t.ids || [t.id];
// Altersklassen ohne Ergebnisse (FLF: showResult false; auch Freundschaftsspiele, vom Nutzer 25.10.2026).
export const KEINE_ERG = ["U7", "U9", "U11"];
export function eigeneSpiele(D, t) {
  const wir = D.teams.filter(o => o.id === t.id || (t.mit || []).includes(o.id));
  const ids = new Set(wir.flatMap(nummern));
  const aus = [];
  for (const id of new Set(wir.flatMap(o => o.klassen))) {
    const k = D.klassen[id];
    for (const sp of k.spiele)
      if (ids.has(sp.h.id) || ids.has(sp.a.id)) aus.push({ ...sp, klasse: k.n, typ: k.typ, erg: k.ergebnisse && !KEINE_ERG.includes(t.kat) });
  }
  return aus.sort((a, b) => a.d.localeCompare(b.d));
}

// ---- Kalender-Abo (iCalendar, RFC 5545) ----
// Je Reiter eine Datei kalender/<reiter>.ics, abonniert über webcal:// auf GitHub Pages.
// UID = FLF-Spiel-ID: verschiebt die FLF ein Spiel, wandert der Termin im Kalender mit.
// DTSTAMP fest, sonst änderte sich die Datei bei jedem Lauf und die Action committete immer.
const icsText = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const utc = iso => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
const ortsZeit = iso => new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Luxembourg" }); // "2026-10-24 14:00:00"
// Zeilen über 75 Byte falten (Pflicht laut RFC, iOS ist da gnädig, andere nicht).
function falten(z) {
  const b = Buffer.from(z, "utf8");
  if (b.length <= 75) return z;
  const teile = []; let rest = z, erste = true;
  while (Buffer.byteLength(rest, "utf8") > (erste ? 75 : 74)) {
    let n = erste ? 75 : 74, s = "";
    for (const ch of rest) { if (Buffer.byteLength(s + ch, "utf8") > n) break; s += ch; }
    teile.push((erste ? "" : " ") + s); rest = rest.slice(s.length); erste = false;
  }
  teile.push(" " + rest);
  return teile.join("\r\n");
}

export const ics = (D, t) => icsAus(D, [t], t.reiter);
// Ein Kalender für alle Mannschaften einer Altersklasse (vom Nutzer, 23.10.2026): die Kinder werden jede
// Woche neu auf 1 und 2 verteilt, getrennte Abos würden sie auseinanderdividieren. Im Titel bleibt 1/2.
export const icsGruppe = (D, g) => icsAus(D, D.teams.filter(t => t.gruppe && t.gruppe.datei === g.datei), g.name);
function icsAus(D, liste, titel) {
  // Eigene Mannschaft wie der Reiter („Koeppchen U13 1“), nicht wie bei der FLF („… I“) — sonst
  // sind U13 1 und U11 1 im Kalender nicht zu unterscheiden (vom Nutzer gemeldet). Pokal ohne
  // I/II: „Koeppchen U13“.
  const unsere = new Map(D.teams.filter(o => liste.some(t => o.id === t.id || (t.mit || []).includes(o.id)))
    .flatMap(o => nummern(o).map(id => [id, "Koeppchen " + reiter(o)])));
  const name = s => unsere.get(s.id) || s.n;
  const kat = liste[0].kat, dauerMin = kat === "Seniors" ? 120 : KEINE_ERG.includes(kat) ? 90 : 105;
  const z = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//FC Koeppchen//fussball.html//DE", "CALSCALE:GREGORIAN",
             "METHOD:PUBLISH", `X-WR-CALNAME:${icsText("FC Koeppchen " + titel)}`, "X-WR-TIMEZONE:Europe/Luxembourg",
             "REFRESH-INTERVAL;VALUE=DURATION:PT3H", "X-PUBLISHED-TTL:PT3H"];
  const spiele = [...new Map(liste.flatMap(t => eigeneSpiele(D, t)).map(sp => [sp.id, sp])).values()].sort((a, b) => a.d.localeCompare(b.d));
  for (const sp of spiele) {
    const art = sp.typ === "CUP" ? " (Pokal)" : sp.coach?.art === "Nachholspiel" ? " (Nachholspiel)" : sp.typ === "FM" && (!sp.coach || sp.coach.art === "Freundschaftsspiel") ? " (Freundschaftsspiel)" : "";
    const erg = sp.erg && sp.gespielt && sp.hs != null ? ` ${sp.hs}:${sp.as}` : "";
    z.push("BEGIN:VEVENT", `UID:flf-${sp.id}@fc-koeppchen`, "DTSTAMP:20260701T000000Z");
    // 00:00 heißt bei der FLF „Uhrzeit noch offen“ (auch 00:00:01). Bewusst kein Ganztagstermin, sondern 00:00
    // (vom Nutzer, 25.10.2026: „dann wissen die Leute, dass es noch gesetzt werden muss“), dazu im Titel „Uhrzeit offen“.
    const offen = ortsZeit(sp.d).slice(11, 16) === "00:00";
    // Coach: Ende, wenn der Trainer eins angegeben hat (Turniere), sonst die übliche Dauer.
    const ende = sp.coach?.ende && !offen ? Date.parse(isoLux(ortsZeit(sp.d).slice(0, 10), sp.coach.ende)) : 0;
    z.push(`DTSTART:${utc(sp.d)}`, `DTEND:${utc(new Date(ende > Date.parse(sp.d) ? ende : Date.parse(sp.d) + dauerMin * 60e3).toISOString())}`);
    if (sp.abgesagt) z.push("STATUS:CANCELLED");
    // BAM: ein Mini-Spieltag mit mehreren Gegnern — Mannschaft und Ort im Titel, die Gegner in der Beschreibung.
    const bamWir = sp.bam && [sp.h, sp.a].find(x => x.id);
    // Trainer-Spiel für mehrere Mannschaften: „Koeppchen MIN 1+2“ statt nur der ersten.
    const nm = x => sp.coach?.mannschaften && x.id && unsere.has(x.id) ? "Koeppchen " + sp.coach.mannschaften : name(x);
    z.push(`SUMMARY:${icsText((sp.abgesagt ? "ABGESAGT: " : "") + (bamWir ? `⚽ ${name(bamWir)} · Mini-Spieltag${sp.ort ? " in " + ortKurz(sp.ort) : ""}` : `⚽ ${nm(sp.h)} – ${nm(sp.a)}${erg}${art}`) + (offen ? " · Uhrzeit offen" : ""))}`);
    if (sp.ort) z.push(`LOCATION:${icsText(sp.ort)}`);
    z.push(`DESCRIPTION:${icsText(sp.klasse + (sp.tag ? `, Spieltag ${sp.tag}` : "") + (sp.coach ? (sp.coach.ende ? `\nbis ca. ${sp.coach.ende}` : "") + (sp.coach.bem ? "\n" + sp.coach.bem : "") : "") + (sp.bam ? `\nMit ${sp.bam.mit.join(", ")}${sp.bam.zeitSicher ? "" : "\nUhrzeit laut FLF meist 10:30 (sauf changement)"}` : ""))}`, "END:VEVENT");
  }
  z.push("END:VCALENDAR");
  return z.map(falten).join("\r\n") + "\r\n";
}

// „Terrain 2 (Mensdorf, synth.)“ → „Mensdorf“, „Am Ga (Wormeldange, synth.)“ → „Wormeldange“.
export const ortKurz = o => (o.match(/\(([^,)]+)/)?.[1] || o).replace(/\s*synth\.?$/, "").trim();

// ---- BGL Ligue und Nationalmannschaft (zwei Reiter, vom Nutzer 19.10.2026) ----
// Ohne Kalender, ohne Ticker. BGL aus der FLF (Klasse per Name gesucht, die Nummer wechselt je
// Saison), Nationalmannschaft von FuPa — die FLF führt keine Länderspiele.
export const BGL_NAME = "BGL Ligue";
const Q_DIVS = `query($s: String){ divisions(criteria:{seasonId:$s}){ id name } }`;
const FUPA = "https://api.fupa.net/v1/";

// FuPa-Spiel der Nationalmannschaft → Format der App (Mannschaften über den Namen, FuPa schreibt
// sie deutsch: „Estland“). `wett` = Wettbewerb, `runde` = „C4“, „PlayOff-C/D-Hinspiel“ …
export function natiSpiel(m) {
  const n = t => t.name?.full || t.name || "";
  const r = m.round || {};
  return {
    id: m.id, d: m.kickoff, slug: m.slug,
    h: { id: n(m.homeTeam), n: n(m.homeTeam) }, a: { id: n(m.awayTeam), n: n(m.awayTeam) },
    hs: m.homeGoal ?? null, as: m.awayGoal ?? null, gespielt: m.section === "POST",
    wett: r.competitionSeason?.name || m.competition?.name || "", runde: r.title || null,
  };
}

// Welche Gruppe zeigt der Reiter? Die des nächsten Pflichtspiels, sonst die des letzten. Pflicht =
// Gruppenrunde (`cupgroup`) oder Liga, aber kein Testspiel (Kategorie 6) und keine K.-o.-Runde
// (keine Tabelle). Kommt die Qualifikation, wechselt die Tabelle so von selbst.
export function natiGruppe(roh, now) {
  const pflicht = roh.filter(m => m.round && m.round.slug && m.round.competitionSeason?.slug
    && (m.round.type === "cupgroup" || m.round.type === "league") && m.round.competitionSeason.category?.id !== 6)
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const m = pflicht.find(m => m.section !== "POST" && Date.parse(m.kickoff) >= now - 3 * 3600e3) || pflicht[pflicht.length - 1];
  if (!m) return null;
  const c = m.round.competitionSeason;
  return { comp: c.slug, group: m.round.slug, n: c.name + (m.round.type === "cupgroup" ? " · Gruppe " + m.round.title : "") };
}

export function natiTabelle(standings) {
  return (standings || []).map(r => ({ pl: r.rank, id: r.team.name.full, n: r.team.name.full, sp: r.matches,
    s: r.wins, u: r.draws, nl: r.defeats, t: r.ownGoals, g: r.againstGoals, pkt: r.points }));
}

async function fupa(pfad) {
  const r = await fetch(FUPA + pfad, { headers: { accept: "application/json" } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error("FuPa HTTP " + r.status + " " + pfad);
  return r.json();
}

async function natiHolen() {
  // FuPa führt Nationalteams je Kalenderjahr (luxemburg-m1-2026); um den Jahreswechsel liegen
  // Spiele in zwei Jahren — darum drei Jahre, Doppelte über die ID raus.
  const y = new Date().getFullYear(), roh = new Map();
  for (const j of [y - 1, y, y + 1])
    for (const flavor of ["past", "current"]) {
      const l = await fupa(`teams/luxemburg-m1-${j}/matches?flavor=${flavor}`);
      if (Array.isArray(l)) for (const m of l) roh.set(m.id, m);
    }
  if (!roh.size) throw new Error("FuPa: keine Spiele der Nationalmannschaft");
  const alle = [...roh.values()];
  const g = natiGruppe(alle, Date.now());
  let gruppe = null;
  if (g) {
    const st = await fupa(`standings?competition=${g.comp}&group=${g.group}`);
    if (st?.standings?.length) gruppe = { n: g.n, tabelle: natiTabelle(st.standings) };
  }
  const spiele = alle.map(natiSpiel).sort((a, b) => a.d.localeCompare(b.d));
  // Stadion steht nur im einzelnen Spiel, nicht in der Liste: für die nächsten drei nachfragen
  // („Heute Spieltag“-Kasten).
  for (const sp of spiele.filter(s => !s.gespielt && Date.parse(s.d) > Date.now() - 6 * 3600e3).slice(0, 3)) {
    try { const m = await fupa("matches/" + sp.slug); if (m?.venue?.name) sp.ort = m.venue.name; } catch (e) {}
  }
  return { spiele, gruppe };
}

// BGL-Tabelle von FuPa (Wettbewerb „nationaldivision“): Die FLF rechnet ihre erst nach der
// Freigabe der Ergebnisse (19.10.2026: nach 8 Spielen, gespielt 10), FuPa ist aktuell und führt
// Punktabzüge samt Begründung (`text`). FuPa schreibt die Vereine deutsch („Differdingen“), die
// Spieltage kommen von der FLF („Differdange“) — darum bekommt jede Zeile den FLF-Namen der
// Mannschaft mit denselben Zahlen (Spiele, S/U/N, Tore) aus den FLF-Ergebnissen. Ist eine Zeile
// nicht eindeutig zuzuordnen, bleibt der FuPa-Name. Zieht die FLF mit ihrer Tabelle irgendwann
// zeitnah nach, zurück auf die der FLF umstellen (vom Nutzer) — dann entfällt das alles. Absicherungen (vom Nutzer, 19.10.2026), damit nie ein
// falscher Name dasteht — höchstens mal ein deutscher:
//  1. Gemerkt geht vor: `gemerkt` (FuPa-`teamId` → FLF-Name, in data/fussball.json) wird nie
//     überschrieben. Umbenennungen (Fusion) trägt man von Hand in `bgl.namen` nach.
//  2. Neu zugeordnet wird nur, wenn die Zahlen auf beiden Seiten eindeutig sind und erst ab
//     `minSp` Spielen — am Saisonanfang haben viele dieselben (dreimal 1:0). Weichen FuPa und FLF
//     kurz voneinander ab (Ergebnis nur auf einer Seite), gibt es so keinen Zufallstreffer.
//  3. Kein FLF-Name zweimal: einen schon vergebenen bekommt kein zweiter Verein.
export function fupaTabelleMitFlfNamen(standings, flfSpiele, gemerkt = {}, minSp = 3) {
  const z = new Map();
  for (const sp of flfSpiele) {
    if (!sp.gespielt || sp.hs == null || sp.as == null) continue;
    for (const [t, f, g] of [[sp.h, sp.hs, sp.as], [sp.a, sp.as, sp.hs]]) {
      const r = z.get(t.id) || { id: t.id, n: t.n, sp: 0, s: 0, u: 0, nl: 0, t: 0, g: 0 };
      r.sp++; r.t += f; r.g += g; if (f > g) r.s++; else if (f === g) r.u++; else r.nl++;
      z.set(t.id, r);
    }
  }
  const sig = r => [r.sp, r.s, r.u, r.nl, r.t, r.g].join("/");
  const anzahl = (liste, f) => liste.reduce((m, x) => m.set(f(x), (m.get(f(x)) || 0) + 1), new Map());
  const flfAnz = anzahl([...z.values()], sig);
  const zeilen = standings.map(x => ({ x, zeile: { pl: x.rank, sp: x.matches, s: x.wins, u: x.draws, nl: x.defeats,
    t: x.ownGoals, g: x.againstGoals, pkt: x.points }, key: String(x.team.teamId ?? x.team.slug) }));
  const fupaAnz = anzahl(zeilen, r => sig(r.zeile));
  const namen = { ...gemerkt }, vergeben = new Set(Object.values(namen));
  for (const { zeile, key } of zeilen) {
    if (namen[key] || zeile.sp < minSp || flfAnz.get(sig(zeile)) !== 1 || fupaAnz.get(sig(zeile)) !== 1) continue;
    const flf = [...z.values()].find(r => sig(r) === sig(zeile));
    if (vergeben.has(flf.n)) continue;
    namen[key] = flf.n; vergeben.add(flf.n);
  }
  const nachName = new Map([...z.values()].map(r => [r.n, r]));
  const tabelle = zeilen.map(({ x, zeile, key }) => {
    const n = namen[key];
    return { ...zeile, id: nachName.get(n)?.id ?? n ?? x.team.slug, n: n ?? x.team.name.full };
  });
  return { tabelle, namen };
}

async function bglHolen(saison, zeit, alt) {
  const div = (await gq(Q_DIVS, { s: saison.id })).divisions.find(d => d.name.trim() === BGL_NAME);
  if (!div) throw new Error("FLF: " + BGL_NAME + " nicht gefunden");
  await pause(1000);
  const { matches } = await gq(Q_MATCHES, { c: { ...zeit, divisionId: div.id, matchTypeId: "CC" } });
  await pause(1000);
  const { rankings } = await gq(Q_RANKING, { c: { seasonId: saison.id, divisionId: div.id, matchTypeId: "CC" } });
  const spiele = matches.map(spiel).sort((a, b) => a.d.localeCompare(b.d) || a.h.n.localeCompare(b.h.n));
  let tab = tabelle(rankings), quelle = "FLF", text = null, namen = alt?.namen || {};
  if (FUPA_MODUS.bgl) try {
    const st = await fupa("standings?competition=nationaldivision");
    if (st?.standings?.length) {
      const r = fupaTabelleMitFlfNamen(st.standings, spiele, alt?.namen);
      tab = r.tabelle; namen = r.namen; quelle = "FuPa"; text = st.text || null;
    }
  } catch (e) { console.error("BGL-Tabelle von FuPa:", e.message, "— nehme die der FLF"); }
  return { n: div.name.trim(), spiele, tabelle: tab, quelle, text, namen };
}

// ---- Liveticker Seniors 2/3 (vom Nutzer 19.10.2026) ----
// FuPa tickert auch die Réserves regelmäßig (2026-27: Seniors 2 4 von 6, Seniors 3 alle 8 Pflicht-
// spiele). Der Worker sucht per Anstoßzeit nur Spiele der Seniors 1 — darum holt der Abruf hier die
// FuPa-Slugs der Reserven vorab (FuPa-Team mr1 = Réserves I, mr2 = Réserves II), und die App fragt
// den Worker direkt mit Slug. So muss der Worker nicht neu eingefügt werden. Nur Spiele von gestern
// bis in drei Wochen, damit die Datei nicht bei jeder fernen Verlegung neu geschrieben wird.
export const FUPA_RESERVE = { "Seniors 2": "mr1", "Seniors 3": "mr2" };
export function reserveSlugs(D, fupaJeReiter, passend, now) {
  const aus = {};
  for (const t of D.teams.filter(t => FUPA_RESERVE[t.reiter])) {
    const fs = fupaJeReiter[t.reiter] || [];
    for (const sp of eigeneSpiele(D, t)) {
      const a = Date.parse(sp.d);
      if (a < now - 86400e3 || a > now + 21 * 86400e3) continue;
      const f = passend(fs, sp.d);
      if (f?.slug?.includes("fc-koeppchen")) aus[sp.id] = f.slug;
    }
  }
  return aus;
}

async function reserveHolen(D, saison) {
  const { passendesSpiel } = await import("./fussball-live.mjs");   // dynamisch: die Datei importiert diese
  const s = saison.id.slice(0, 4) + "-" + saison.id.slice(6, 8), je = {};
  for (const [r, k] of Object.entries(FUPA_RESERVE)) {
    je[r] = [];
    for (const flavor of ["current", "past"]) {
      const j = await fupa(`teams/fc-koeppchen-${k}-${s}/matches?flavor=${flavor}`);
      if (Array.isArray(j)) je[r].push(...j);
    }
  }
  return reserveSlugs(D, je, passendesSpiel, Date.now());
}

// Vereinsspiele + je Klasse alle Spiele und Tabelle → das, was die App liest.
// vereinsSpiele tragen `ak` = Index in AGES (aus welcher Abfrage sie kommen).
// Eine Mannschaft ist Altersklasse + Name, nicht die FLF-Nummer: Zur Phase 3 nach der
// Winterpause vergibt die FLF neue Nummern (2025-26: U13 41766 → 43705, U15 41773 → 43706),
// sonst gäbe es ab Februar zwei Reiter „U13 1“. `id` ist die erste Nummer (bleibt, damit die
// gemerkte Auswahl gilt), `ids` alle.
export function aufbereiten({ saison, vereinsSpiele, klassen }) {
  const teams = new Map(), nachId = new Map();
  const wer = (t, ak) => ak + "|" + t.name;
  for (const m of [...vereinsSpiele].sort((a, b) => a.match.matchDate.localeCompare(b.match.matchDate)))
    for (const t of [m.homeTeam, m.awayTeam]) {
      if (!istVerein(t) || nachId.has(t.id)) continue;
      const k = wer(t, m.ak);
      if (!teams.has(k))
        teams.set(k, { id: t.id, ids: [], n: t.name, ak: m.ak, kat: AGES[m.ak].kat, alter: AGES[m.ak].n,
                       plus: AGES[m.ak].plus, ohne: AGES[m.ak].ohne, kurz: AGES[m.ak].kurz, klassen: [] });
      teams.get(k).ids.push(t.id);
      nachId.set(t.id, teams.get(k));
    }

  const div = {};
  for (const m of vereinsSpiele) {
    const k = m.division;
    div[k.id] ??= { id: k.id, n: k.name, typ: m.matchType?.id || "", ergebnisse: k.showResult !== false,
                    tabelle: null, spiele: [], start: m.match.matchDate };
    if (m.match.matchDate < div[k.id].start) div[k.id].start = m.match.matchDate;
    for (const t of [m.homeTeam, m.awayTeam])
      if (istVerein(t) && !nachId.get(t.id).klassen.includes(k.id)) nachId.get(t.id).klassen.push(k.id);
  }
  for (const [id, k] of Object.entries(klassen)) {
    if (!div[id]) continue;
    div[id].spiele = k.spiele.map(spiel).sort((a, b) => a.d.localeCompare(b.d) || a.h.n.localeCompare(b.h.n));
    div[id].tabelle = k.tabelle ? tabelle(k.tabelle) : null;
  }
  for (const t of teams.values()) t.klassen.sort((a, b) => div[a].start.localeCompare(div[b].start));
  // U9/U11: keine Ergebnisse, auch nicht in Freundschaftsspielen (deren Klasse „Amicaux“ zeigt sie bei der FLF;
  // vom Nutzer, 25.10.2026). Nur unsere Spiele — fremde gehören uns nicht.
  const ohneErg = new Set([...nachId].filter(([, t]) => KEINE_ERG.includes(t.kat)).map(([id]) => id));
  for (const k of Object.values(div)) for (const sp of k.spiele || [])
    if (ohneErg.has(sp.h.id) || ohneErg.has(sp.a.id)) sp.hs = sp.as = null;

  // Mannschaften mit Ligaspielen bekommen einen Reiter (und einen Kalender). Pokalmannschaften
  // ohne Liga hängen sich an (`mit`): ohne I/II an alle derselben Altersklasse (U13-Pokal), mit
  // I/II nur an die gleichnamige (Réserves-Pokal). Steht hier, damit App und Kalender dieselbe
  // Regel haben.
  const alle = [...teams.values()];
  const liga = t => t.klassen.some(id => div[id].typ === "CC");
  const zusatz = t => t.n.replace(VEREIN, "").trim();
  for (const t of alle.filter(liga)) {
    t.reiter = reiter(t);
    t.datei = reiter(t, true).toLowerCase().replace(/\s+/g, "-") + ".ics";   // alter Name: bestehende Abos
    t.mit = alle.filter(o => !liga(o) && o.ak === t.ak && (!zusatz(o) || zusatz(o) === zusatz(t))).map(o => o.id);
  }
  // Kalender je Kinder-Altersklasse (vom Nutzer, 23.10.2026) — auch bei nur einer Mannschaft, damit das Abo
  // gültig bleibt, wenn eine zweite dazukommt oder wegfällt.
  for (const [kat, name] of Object.entries(GRUPPEN))
    for (const t of alle.filter(liga).filter(t => t.kat === kat)) t.gruppe = { name, datei: name.toLowerCase().replace(/\s+/g, "-") + ".ics" };

  return {
    stand: new Date().toISOString(),
    saison: { id: saison.id, n: saison.name },
    verein: { id: CLUB, n: VEREIN },
    teams: [...teams.values()].sort((a, b) => AGES[a.ak].reihe - AGES[b.ak].reihe || a.n.localeCompare(b.n)),
    klassen: div,
  };
}

// BAM-Teil eines alten Stands (Rückfall, wenn die PDFs nicht lesbar sind).
export function bamAus(D) {
  if (!D?.teams) return null;
  // Ohne Coach-Klassen: die kommen bei jedem Lauf neu dazu (coachDazu), sonst stünden sie doppelt da.
  const teams = D.teams.filter(t => t.kat === "U7").map(t => ({ ...t, klassen: t.klassen.filter(id => !String(id).startsWith("coach-")) }));
  return teams.length ? { teams, klassen: Object.fromEntries(teams.flatMap(t => t.klassen).map(id => [id, D.klassen[id]]).filter(([, k]) => k)) } : null;
}
// BAM-Mannschaften hinter die U9 (vor die Réserves) und ihre Klassen dazu.
export function bamDazu(D, bam) {
  if (!bam?.teams?.length) return;
  const i = D.teams.findLastIndex(t => ["U15", "U13", "U11", "U9"].includes(t.kat));
  D.teams.splice(i + 1, 0, ...bam.teams);
  Object.assign(D.klassen, bam.klassen);
}

// ---- Coach (vom Nutzer, 27.10.2026): Spiele, die Trainer in der App eintragen ----
// Der Worker speichert sie (tools/cloudflare-worker.js, Coach) und gibt sie ohne Trainernamen unter ?coach=spiele heraus.
// Hier werden sie wie BAM ins Format von aufbereiten() gebaut: je Mannschaft eine Klasse „coach-<id>“ (typ FM, ohne
// Ergebnisse) — dann laufen Reiter, Woche, Kalender, Koeppi und „Morgen Spiel“ ohne Sonderweg.
export const COACH_URL = "https://fckoeppchen.rjtp6r9s9h.workers.dev/?coach=spiele";
export const COACH_ID = 8e9;   // FLF-Spiele haben 5–6 Stellen, BAM 9…
// Ein Spiel für mehrere Mannschaften (vom Nutzer, 27.10.2026): „MIN 1+MIN 2“. Name dafür „MIN 1+2“ (gleiche Altersklasse) bzw. „MIN 1 + SCO“.
export const coachTeile = reiter => String(reiter || "").split("+").filter(Boolean);
export function coachName(reiter) {
  const l = coachTeile(reiter), m = l.map(r => r.match(/^(.*?) (\d+)$/));
  return l.length > 1 && m.every(x => x && x[1] === m[0][1]) ? `${m[0][1]} ${m.map(x => x[2]).join("+")}` : l.join(" + ");
}
export const coachMitGegner = art => art === "Freundschaftsspiel" || art === "Nachholspiel";
// Steht dasselbe Spiel inzwischen auch bei der FLF (vom Nutzer, 28.10.2026: Nachholspiel PUP 1 gegen UMW, von der FLF noch nicht
// neu angesetzt)? Gleiche Mannschaft, gleicher Tag, und der Gegner passt (ein Wort gleich oder die Anfangsbuchstaben: „UMW“ =
// „Union Mertert-Wasserbillig“) — beim Nachholspiel reicht der Tag. Dann zeigt die App nur das FLF-Spiel.
const LEER = new Set(["fc", "us", "as", "cs", "sc", "un", "ent", "union", "jeunesse", "racing", "sporting", "koeppchen", "wormeldange", "i", "ii", "iii"]);
const woerter = n => String(n).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter(w => w && !/^\d+$/.test(w));
export function gegnerPasst(coach, flf) {
  const c = woerter(coach).filter(w => !LEER.has(w)), f = woerter(flf), fk = f.filter(w => !LEER.has(w) && w.length > 2);
  if (c.some(w => w.length > 2 && fk.includes(w))) return true;
  const kuerzel = f.filter(w => !["i", "ii", "iii"].includes(w)).map(w => w[0]).join("");
  return c.some(w => w.length >= 2 && w.length <= 5 && kuerzel.includes(w));
}
const tagLuxD = iso => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Luxembourg" });
export function coachDazu(D, liste) {
  D.coachDoppelt = [];
  for (const s of liste || []) {
    // Je Mannschaft eine Kopie mit derselben id: jeder Reiter zeigt sie, Woche/Kalender/Mitteilungen nehmen sie einmal.
    const alle = coachTeile(s.reiter).map(r => D.teams.find(t => t.reiter === r)).filter(Boolean);
    const ts = alle.filter(t => !eigeneSpiele(D, t).some(sp => !sp.coach && tagLuxD(sp.d) === s.datum
      && (s.art === "Nachholspiel" || gegnerPasst(s.gegner, (D.teams.some(o => o.id === sp.h.id || (o.ids || []).includes(sp.h.id)) ? sp.a : sp.h).n))));
    if (ts.length < alle.length) D.coachDoppelt.push(s.id);
    const mehrere = ts.length > 1 ? coachName(s.reiter) : null;
    for (const t of ts) {
      const kid = "coach-" + t.id;
      D.klassen[kid] ??= { id: kid, n: "Vom Trainer eingetragen", typ: "FM", ergebnisse: false, tabelle: null, spiele: [], start: s.datum };
      if (!t.klassen.includes(kid)) t.klassen.push(kid);
      const wir = { id: t.id, n: mehrere ? `${VEREIN} ${mehrere}` : t.n }, andere = { id: 0, n: coachMitGegner(s.art) ? s.gegner : `${s.art}: ${s.gegner}` };
      D.klassen[kid].spiele.push({ id: COACH_ID + s.id, d: isoLux(s.datum, s.zeit || "00:00"), tag: null, h: s.heim ? wir : andere, a: s.heim ? andere : wir,
        hs: null, as: null, gespielt: false, forfait: false, ort: s.ort || (s.heim ? "Am Ga (Wormeldange, synth.)" : undefined),
        coach: { art: s.art, gegner: s.gegner, ...(s.ende ? { ende: s.ende } : {}), ...(s.bem ? { bem: s.bem } : {}), ...(mehrere ? { mannschaften: mehrere } : {}) },
        ...(s.abgesagt ? { abgesagt: true } : {}) });
    }
  }
  for (const k of Object.values(D.klassen)) if (String(k.id).startsWith("coach-")) k.spiele.sort((a, b) => a.d.localeCompare(b.d));
}

async function main() {
  const d = await gq(Q_DEFAULTS);
  const saison = d.seasons.find(s => s.id === d.defaultValues.currentSeasonId);
  if (!saison) throw new Error("Saison nicht gefunden: " + d.defaultValues.currentSeasonId);
  // Ohne Zeitraum antwortet die Schnittstelle mit INTERNAL_SERVER_ERROR.
  const zeit = { seasonId: saison.id, startDate: day(saison.startDate), endDate: day(saison.endDate) };

  const vereinsSpiele = [];
  for (const [ak, a] of AGES.entries()) {
    const { matches } = await gq(Q_MATCHES, { c: { ...zeit, clubId: CLUB, ageCategoryId: a.id, matchTypeId: "ALL" } });
    for (const m of matches) if (!vereinsSpiele.some(x => x.match.id === m.match.id)) vereinsSpiele.push({ ...m, ak });
    await pause(1000);
  }
  const klassen = {};
  for (const id of new Set(vereinsSpiele.map(m => m.division.id))) {
    const m0 = vereinsSpiele.find(m => m.division.id === id);
    const typ = m0.matchType?.id || "ALL";
    // Freundschaftsspiele liegen landesweit in einer einzigen „Klasse“ (Amicaux 1, 2) —
    // davon nur die eigenen, nicht hunderte fremde.
    if (typ === "FM") { klassen[id] = { spiele: vereinsSpiele.filter(m => m.division.id === id), tabelle: null }; continue; }
    await pause(1000);
    const { matches } = await gq(Q_MATCHES, { c: { ...zeit, divisionId: id, matchTypeId: typ } });
    let tab = null;
    if (m0.division.showRanking && typ === "CC") {
      await pause(1000);
      tab = (await gq(Q_RANKING, { c: { seasonId: saison.id, divisionId: id, matchTypeId: typ } })).rankings;
    }
    klassen[id] = { spiele: matches, tabelle: tab };
  }

  const neu = aufbereiten({ saison, vereinsSpiele, klassen });
  // BGL und Nationalteam dürfen den Abruf nicht kippen: fällt eins aus, bleibt der alte Stand.
  const alt = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
  try { neu.bgl = await bglHolen(saison, zeit, alt.bgl); } catch (e) { console.error("BGL:", e.message); neu.bgl = alt.bgl || null; }
  try { neu.nati = await natiHolen(); } catch (e) { console.error("Nationalteam:", e.message); neu.nati = alt.nati || null; }
  // FuPa-Slugs der Reserven nur für den Ticker über die Schnittstelle (tools/fupa-modus.mjs).
  if (!FUPA_MODUS.api) neu.fupa = {};
  else try { neu.fupa = await reserveHolen(neu, saison); } catch (e) { console.error("FuPa Reserven:", e.message); neu.fupa = alt.fupa || {}; }
  // BAM aus den FLF-PDFs (tools/bambini.mjs). Darf den Abruf nicht kippen: Fehler → alter BAM-Stand.
  let bam = null;
  try { bam = await (await import("./bambini.mjs")).bamHolen(); console.log("BAM:", bam.quellen.join(", ")); }
  catch (e) { console.error("BAM:", e.message); bam = bamAus(alt); }
  bamDazu(neu, bam);
  // Coach-Spiele vom Worker. Fehler → die vom letzten Mal (stehen ohne Namen in der Datei, `coach`).
  try { const r = await fetch(COACH_URL); if (!r.ok) throw new Error("HTTP " + r.status); neu.coach = (await r.json()).spiele; }
  catch (e) { console.error("Coach:", e.message); neu.coach = alt.coach || []; }
  coachDazu(neu, neu.coach);
  // Events von der Vereins-Homepage (tools/vereins-events.mjs), einmal am Tag um 7 Uhr. Fehler → alter Stand.
  neu.events = alt.events || null;
  const ev = await import("./vereins-events.mjs");
  if (process.env.EVENTS || ev.eventsFaellig(alt.events)) {
    try { neu.events = { liste: await ev.eventsHolen() }; console.log("Events:", neu.events.liste.map(e => `${e.t} ${e.tag || "ohne Datum"}`).join(", ")); }
    catch (e) { console.error("Events:", e.message); }
  }
  // Mitteilungen: Ereignisse aus dem Vergleich alt/neu (tools/mitteilungen.mjs). Vor der
  // „unverändert“-Prüfung, weil „Heute Spiel“ auch ohne neue FLF-Daten fällig wird. Darf den
  // Abruf nicht kippen.
  try {
    const { ereignisse } = await import("./mitteilungen.mjs");
    const vorher = existsSync(MITT) ? JSON.parse(readFileSync(MITT, "utf8")) : null;
    const m = ereignisse(alt.teams ? alt : null, neu, vorher, Date.now());
    if (JSON.stringify(m) !== JSON.stringify(vorher)) { writeFileSync(MITT, JSON.stringify(m, null, 1) + "\n"); console.log("Mitteilungen:", m.ereignisse.map(e => e.id).join(", ") || "keine"); }
  } catch (e) { console.error("Mitteilungen:", e.message); }
  // Nur schreiben, wenn sich inhaltlich etwas geändert hat — sonst committet die Action alle 2 h
  // eine Datei, in der nur der Zeitstempel neu ist.
  if (existsSync(OUT)) {
    if (JSON.stringify({ ...alt, stand: 0 }) === JSON.stringify({ ...neu, stand: 0 })) {
      console.log("unverändert");
      return;
    }
  }
  writeFileSync(OUT, JSON.stringify(neu, null, 1) + "\n");
  console.log("geschrieben:", neu.teams.map(t => t.n).join(", "), "·", Object.keys(neu.klassen).length, "Klassen");
}

// Kalender werden immer neu geschrieben (aus dem aktuellen Stand); unveränderte Dateien
// sind Byte für Byte gleich, git sieht dann keine Änderung.
function kalender() {
  const D = JSON.parse(readFileSync(OUT, "utf8"));
  mkdirSync(KAL, { recursive: true });
  const soll = new Set();
  for (const t of D.teams.filter(t => t.datei)) {
    writeFileSync(new URL(t.datei, KAL), ics(D, t));
    soll.add(t.datei);
    if (t.gruppe && !soll.has(t.gruppe.datei)) { writeFileSync(new URL(t.gruppe.datei, KAL), icsGruppe(D, t.gruppe)); soll.add(t.gruppe.datei); }
  }
  // Mannschaft weg (neue Saison) → Datei weg; ein bestehendes Abo zeigt dann nichts mehr.
  for (const f of readdirSync(KAL)) if (f.endsWith(".ics") && !soll.has(f)) unlinkSync(new URL(f, KAL));
  console.log("Kalender:", [...soll].join(", "));
}

if (import.meta.url === `file://${process.argv[1]}`)
  main().then(kalender).catch(e => { console.error(e); process.exit(1); });
