/* Prüft den Abruf (tools/fussball.mjs, Aufbereitung) und die Logik in index.html.
   Aufruf:  node test/fussball.mjs
   Kein Netz, kein Browser. Rückgabewert 1 bei Abweichung.

   Die Daten sind nachgebaut nach dem Stand 18.10.2026 (Phase 1 beendet, Koeppchen I
   Zweiter in Klasse IV, Koeppchen II Fünfter in Klasse VI, Pokal ohne I/II). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { aufbereiten, spiel, reiter, ics, eigeneSpiele, CLUB, natiSpiel, natiGruppe, natiTabelle, fupaTabelleMitFlfNamen, reserveSlugs, icsGruppe } from "../tools/fussball.mjs";
import { liveAus, gleich as liveGleich, spielJetzt, naechstesSpiel, passendesSpiel } from "../tools/fussball-live.mjs";
import worker, { kuerzen, passendesSpiel as wPassend, saisonVon, abrufFaellig, zaehlen, zahlenSeite, stundeLux, ansehen, verschluesseln, vapidKopf, mitteilungenSenden, passtZu, liveEreignisse, mittStatus, mitteilungenStand, PAKET, tagzeit, toreRoh, fupaSpiel } from "../tools/cloudflare-worker.js";
import { ereignisse as mEreignisse, umLux, spieltagStand } from "../tools/mitteilungen.mjs";
import { turniere, bamDaten, pdfListe, isoLux, zeitAusOrt } from "../tools/bambini.mjs";
import { bamAus, bamDazu } from "../tools/fussball.mjs";

const hier = path.dirname(fileURLToPath(import.meta.url));
const src = fs.readFileSync(path.join(hier, "..", "index.html"), "utf8");
const i = src.indexOf("==== Logik"), j = src.indexOf("==== Oberfläche");
if (i < 0 || j < 0) throw new Error("Abschnittsmarken Logik/Oberfläche nicht gefunden");
const M = new Function(src.slice(src.lastIndexOf("//", i), src.lastIndexOf("//", j)) + `
  return { natiLiveSpiel, extraReiter, reiterBreiten, bglSicht, bglTabelle, natiSicht, spieltagHeute, minutenBisAnpfiff, liveSpiel, liveBasis, kartenArt, ereignisListe, torArt, mitWorker, liveAnzeige, liveZeit, imLiveFenster, REGELN, klasseVon, zonen, ausgang, aufteilen, anzeige, sicht, nachSpieltag, roem, wocheTage, wocheSpiele, wocheBilanz, istKinder, spieltagMorgen, nachDemSpiel, tagNach, istVorbei };`)();

let fehler = 0, n = 0;
function ok(bed, text) { n++; if (!bed) { fehler++; console.log("✗ " + text); } }
function gleich(a, b, text) { ok(JSON.stringify(a) === JSON.stringify(b), text + " — ist " + JSON.stringify(a) + ", soll " + JSON.stringify(b)); }

// Uhrzeit offen (00:00, bei U9/U11 üblich): gilt den ganzen Spieltag als „kommt noch“, nicht nur bis 3 Uhr.
{
  const offen = { id: 7, d: "2026-11-14T00:00:01+01:00", h: { id: 1, n: "FC Koeppchen Wormeldange I" }, a: { id: 9, n: "Gegner" }, wir: 1, erg: false, gespielt: false };
  const sa8 = Date.parse("2026-11-14T08:00:00+01:00"), sa23 = Date.parse("2026-11-14T23:30:00+01:00"), so = Date.parse("2026-11-15T08:00:00+01:00");
  ok(!M.istVorbei(offen, sa8) && !M.istVorbei(offen, sa23) && M.istVorbei(offen, so), "Uhrzeit offen: am Spieltag noch nicht vorbei, am Tag danach schon");
  const vv = t => ({ team: { reiter: "U9 1" }, kommend: M.istVorbei(offen, t) ? [] : [offen], gespielt: M.istVorbei(offen, t) ? [offen] : [] });
  ok(M.spieltagHeute(vv(sa8), sa8)?.sp.id === 7 && M.nachDemSpiel(vv(sa8), sa8) === null, "Uhrzeit offen, Spieltag 8 Uhr: Heute-Kasten, noch kein Super-gemacht");
  ok(M.spieltagHeute(vv(sa8), sa8)?.begonnen === false, "Uhrzeit offen: nicht „Spiel läuft“");
  ok(M.nachDemSpiel(vv(so), so)?.spruch, "Uhrzeit offen, Tag danach: Super-gemacht-Streifen");
  const mitZeit = { ...offen, d: "2026-11-14T10:00:00+01:00" };
  ok(!M.istVorbei(mitZeit, Date.parse("2026-11-14T12:59:00+01:00")) && M.istVorbei(mitZeit, Date.parse("2026-11-14T13:01:00+01:00")), "mit Uhrzeit: 3 h nach Anpfiff vorbei");
}
// Woche in Kalendertagen: auch in der Woche der Zeitumstellung im Frühjahr 7 aufeinanderfolgende Tage.
{
  const w = M.wocheTage(Date.parse("2027-03-27T23:30:00+01:00"));
  ok(w[0] === "2027-03-22" && w[6] === "2027-03-28", "Woche der Frühjahrs-Zeitumstellung: Mo 22.3. bis So 28.3. — ist " + w.join(","));
  const h = M.wocheTage(Date.parse("2026-10-25T22:30:00+01:00"));
  ok(h[0] === "2026-10-26" && h[6] === "2026-11-01", "So nach 22 Uhr am Tag der Herbst-Zeitumstellung: nächste Woche");
}
// Koeppi (22.10.2026): nur Kinder; Vortag-Kasten; Streifen nach dem Spiel (Sieg bzw. U9/U11 immer).
{
  const sp = (id, d, hs, as, erg = true) => ({ id, d, h: { id: 1, n: "FC Koeppchen Wormeldange I" }, a: { id: 9, n: "Gegner" }, wir: 1, erg, gespielt: hs != null, hs, as });
  const sa = "2026-10-24T14:00:00+02:00", fr18 = Date.parse("2026-10-23T18:00:00+02:00");
  const v = (reiter, kommend, gespielt) => ({ team: { reiter }, kommend, gespielt });
  ok(M.istKinder(v("U9 1")) && M.istKinder(v("U13 2")) && M.istKinder(v("U15")) && !M.istKinder(v("Seniors 1")) && !M.istKinder(null), "Koeppi nur bei U9, U11, U13, U15");
  ok(M.tagNach("2026-10-24") === "2026-10-25" && M.tagNach("2026-10-31") === "2026-11-01" && M.tagNach("2026-12-31") === "2027-01-01", "Folgetag auch über Monats-/Jahresende");
  ok(M.spieltagMorgen(v("U13 1", [sp(5, sa)], []), fr18)?.sp.id === 5, "Vortag: Morgen-Kasten");
  ok(M.spieltagMorgen(v("U13 1", [sp(5, sa)], []), Date.parse("2026-10-22T18:00:00+02:00")) === null, "zwei Tage vorher: kein Morgen-Kasten");
  ok(M.spieltagMorgen(v("U13 1", [sp(5, sa)], []), Date.parse("2026-10-23T23:30:00+02:00"))?.sp.id === 5, "Vortag 23:30 (Ortszeit) noch Morgen-Kasten");
  const sieg = sp(4, "2026-10-17T14:00:00+02:00", 7, 1), nl = sp(4, "2026-10-17T14:00:00+02:00", 1, 3);
  const di = Date.parse("2026-10-20T12:00:00+02:00");
  // Vom Verein: gelobt wird das Spielen, nicht der Sieg — nach Sieg und Niederlage derselbe Streifen.
  const s1 = M.nachDemSpiel(v("U13 1", [sp(5, "2026-10-31T14:00:00+01:00")], [sieg]), di), s2 = M.nachDemSpiel(v("U13 1", [], [nl]), di);
  ok(s1 && s2 && s1.spruch && s1.spruch === s2.spruch && !("art" in s1), "nach Sieg und Niederlage: gleicher Streifen mit Spruch, ohne Ergebnis");
  // Sprüche je Woche (seit 25.10.2026): nächste Woche → nächster Spruch; am selben Wochenende nie zwei gleiche,
  // auch wenn eine Mannschaft ein Spiel mehr hat (24.10.: MIN 1 mit Pokal, MIN 2 ohne → vorher gleicher Spruch).
  const woNach = sp(4, "2026-10-24T14:00:00+02:00", 2, 0), mo = Date.parse("2026-10-26T12:00:00+01:00");
  ok(M.nachDemSpiel(v("U13 1", [], [woNach, sieg]), mo).spruch !== s1.spruch, "nächste Woche: anderer Spruch");
  const pokal = sp(6, "2026-10-24T10:00:00+02:00", 5, 2);
  ok(M.nachDemSpiel(v("MIN 1", [], [pokal, sieg]), mo).spruch !== M.nachDemSpiel(v("MIN 2", [], [woNach]), mo).spruch,
     "MIN 1 mit einem Spiel mehr und MIN 2 am selben Wochenende: verschiedene Sprüche");
  const jeReiter = new Set(["MIN 1", "MIN 2", "SCO", "POU 1", "POU 2", "PUP 1", "PUP 2"].map(r => M.nachDemSpiel(v(r, [], [sieg]), di).spruch));
  ok(jeReiter.size === 7, "jeder Jugend-Reiter fängt bei einem eigenen Spruch an (" + jeReiter.size + " von 7)");
  ok(M.nachDemSpiel(v("Seniors 1", [], [sieg]), di) === null, "Seniors: kein Streifen");
  ok(M.nachDemSpiel(v("U13 1", [sp(5, sa)], [sieg]), fr18) === null, "Vortag des nächsten Spiels: Streifen weg");
  ok(M.nachDemSpiel(v("U13 1", [], [sieg]), Date.parse("2026-10-25T15:00:00+01:00")) === null, "nach 7 Tagen: Streifen weg");
  ok(M.nachDemSpiel(v("U9 1", [], [sp(4, "2026-10-17T10:00:00+02:00", null, null, false)]), di)?.spruch, "U9: nach jedem Spiel Streifen mit Spruch");
  ok(M.nachDemSpiel(v("U9 1", [], [sp(4, "2026-10-25T10:00:00+01:00", null, null, false)]), di) === null, "Spiel in der Zukunft (z. B. Forfait im Voraus) zählt nicht");
}

/* --- Rohdaten wie aus der Schnittstelle --- */
const team = (id, name, club) => ({ id, name, clubId1: club, clubId2: null, clubId3: null, clubId4: null });
const K1 = team(45396, "FC Koeppchen Wormeldange I", CLUB), K2 = team(45397, "FC Koeppchen Wormeldange II", CLUB);
const KP = team(45398, "FC Koeppchen Wormeldange", CLUB);
const G = id => team(id, "Gegner " + id, 500000 + id);
const DIV4 = { id: 19189, name: "U13 Minimes Cl4 S2 Phase 1", showResult: true, showRanking: true };
const DIV6 = { id: 19233, name: "U13 Minimes Cl6 S5 Phase 1", showResult: true, showRanking: true };
const CUP = { id: 19615, name: "Coupe U13 Minimes - 1/32 de Finale", showResult: true, showRanking: false };
let mid = 1;
function roh(div, typ, d, h, a, hs, as, extra = {}) {
  return { ak: extra.ak ?? 1, match: { id: mid++, gameday: extra.tag ?? 1, matchDate: d, isPlayed: hs != null, isForfait: false,
                    homeScore: hs, awayScore: as, finalHomeScore: extra.fh ?? (hs ?? null), finalAwayScore: extra.fa ?? (as ?? null),
                    finalScoreComment: null },
           division: div, matchType: { id: typ }, homeTeam: h, awayTeam: a, sportField: { name: "Am Ga" } };
}
const s1 = roh(DIV4, "CC", "2026-09-19T14:30:00+02:00", G(1), K1, 2, 2, { tag: 1 });
{
  // U9/U11 (showResult false): Ergebnis wird gar nicht gespeichert, „gespielt“ bleibt.
  const u9 = spiel(roh({ id: 77, name: "U9 Pupilles", showResult: false, showRanking: false }, "CC", "2026-10-03T11:00:00+02:00", G(1), K1, 20, 1));
  ok(u9.hs === null && u9.as === null && u9.gespielt === true, "U9/U11: Ergebnis nicht gespeichert, gespielt ja");
  ok(spiel(roh(DIV4, "CC", "2026-10-03T11:00:00+02:00", G(1), K1, 2, 1)).hs === 2, "andere Klassen: Ergebnis bleibt");
  // Abgebrochen („Arrêté“): FLF sagt isPlayed false, hat aber ein gewertetes Endergebnis (24.10.2026, U15–Oberkorn 2:0).
  const ab = roh(DIV4, "CUP", "2026-10-24T16:00:00+02:00", K1, G(2), null, null, { fh: 2, fa: 0 });
  ab.match.finalScoreComment = "Arr\uFFFDt\uFFFD";
  const abS = spiel(ab);
  ok(abS.gespielt && abS.hs === 2 && abS.as === 0 && abS.bem === "Arrêté", "abgebrochenes Spiel mit Wertung zählt als gespielt, Bemerkung repariert");
  ok(!spiel(roh(DIV4, "CC", "2026-11-03T11:00:00+02:00", G(1), K1, null, null)).gespielt, "ohne Ergebnis nicht gespielt");
}
const s2 = roh(DIV4, "CC", "2026-10-17T14:30:00+02:00", K1, G(2), 9, 0, { tag: 5 });
const s3 = roh(DIV4, "CC", "2026-09-19T15:00:00+02:00", G(3), G(4), 5, 2, { tag: 1 });
const s4 = roh(DIV6, "CC", "2026-09-26T14:00:00+02:00", G(5), K2, 9, 5, { tag: 2 });
const s5 = roh(CUP, "CUP", "2026-10-24T14:00:00+02:00", KP, G(6), null, null);
// Korrigiertes Endergebnis (z. B. Forfait am grünen Tisch) gilt vor dem gespielten.
// U15-Pokal: eigene Altersklasse (ak 2), darf bei der U13 nicht auftauchen.
const P15 = team(45400, "FC Koeppchen Wormeldange", CLUB);
const CUP15 = { id: 19599, name: "Coupe U15 Scolaires - 1/32 de Finale", showResult: true, showRanking: false };
const s8 = roh(CUP15, "CUP", "2026-10-25T10:00:00+02:00", P15, G(9), null, null, { ak: 2 });
const s6 = roh(DIV6, "CC", "2026-10-03T16:00:00+02:00", K2, G(7), 3, 5, { tag: 3, fh: 0, fa: 3 });

const rank = (pl, t, p) => ({ ranking: { rank: pl, teamId: t.id, totalPlays: 5, totalWins: 0, totalDraws: 0, totalLosses: 0,
                                         totalOwnGoals: 10, totalAgainstGoals: 5, totalPoints: p }, team: { id: t.id, name: t.name } });
const D = aufbereiten({
  saison: { id: "20262027", name: "Saison 2026-2027" },
  vereinsSpiele: [s1, s2, s4, s5, s6, s8],
  klassen: {
    19189: { spiele: [s2, s1, s3], tabelle: [rank(2, K1, 11), rank(1, G(1), 11), rank(3, G(2), 8)] },
    19233: { spiele: [s4, s6], tabelle: [rank(5, K2, 0), rank(1, G(5), 12)] },
    19615: { spiele: [s5], tabelle: null },
    19599: { spiele: [s8], tabelle: null },
  },
});

/* --- Aufbereitung --- */
gleich(D.teams.map(t => t.id), [45400, 45398, 45396, 45397], "Vereinsmannschaften erkannt, nach Reiter-Reihenfolge sortiert (U15 vor U13)");
gleich(D.teams.map(t => t.alter), ["U15 Scolaires", "U13 Minimes", "U13 Minimes", "U13 Minimes"], "Altersklasse je Mannschaft");
gleich(D.teams.find(t => t.id === 45396).klassen, [19189], "Koeppchen I: Klasse IV");
gleich(D.klassen[19189].spiele.map(s => s.d.slice(0, 16)), ["2026-09-19T14:30", "2026-09-19T15:00", "2026-10-17T14:30"],
  "Spiele der Klasse nach Datum, auch die ohne Koeppchen");
gleich(D.klassen[19189].tabelle.map(r => r.pl), [1, 2, 3], "Tabelle nach Platz sortiert");
ok(D.klassen[19615].tabelle === null, "Pokal ohne Tabelle");
const sp6 = D.klassen[19233].spiele.find(s => s.tag === 3);
gleich([sp6.hs, sp6.as], [0, 3], "Endergebnis vor gespieltem Ergebnis");
const sp5 = spiel(s5);
ok(!sp5.gespielt && sp5.hs == null, "offenes Spiel ohne Ergebnis");

/* --- Auf-/Abstiegsregeln (Rundschreiben Phase 1 2026-2027) --- */
gleich(M.klasseVon("U13 Minimes Cl4 S2 Phase 1"), { nr: 4, phase: 1, kat: "U13" }, "Klasse, Phase und Altersklasse aus dem Namen");
gleich(M.zonen("20262027", "U13 Minimes Cl4 S2 Phase 1"), { auf: [1, 2], ab: [5, 6] }, "Klasse IV: 1./2. hoch, 5./6. runter");
gleich(M.zonen("20262027", "U13 Minimes Cl1 S1 Phase 1").auf, [], "Klasse I: niemand steigt auf");
ok(M.zonen("20262027", "U13 Minimes Cl6 S5 Phase 1") === null, "letzte Klasse: keine Regel");
ok(M.zonen("20262027", "U13 Minimes Cl4 S2 Phase 2") === null, "Phase 2: (noch) keine Regel");
ok(M.zonen("20272028", "U13 Minimes Cl4 S2 Phase 1") === null, "andere Saison: keine Regel");
ok(M.zonen("20262027", "Coupe U13 Minimes - 1/32 de Finale") === null, "Pokal: keine Regel");
gleich(M.zonen("20262027", "U15 Scolaires Cl4 S2 Phase 1"), { auf: [1, 2], ab: [5, 6] }, "U15: dieselben Regeln wie U13");
ok(M.zonen("20262027", "U11 Poussins S5 Tour 1") === null, "U11: keine Regel");
gleich([M.roem(3), M.roem(5)], ["III", "V"], "römische Klassen");

/* --- Sicht eines Reiters --- */
const { tabs, verein } = M.aufteilen(D);
gleich(tabs.map(t => t.id), [45396, 45397], "Reiter nur für Mannschaften mit Liga");
gleich(verein.map(t => t.id), [45400, 45398], "Pokalmannschaften ohne I/II zählen zum Verein");
ok(M.anzeige("FC Koeppchen Wormeldange II") === "Koeppchen II", "eigener Name gekürzt");
ok(M.anzeige("US Sandweiler") === "US Sandweiler", "Gegner unverändert");
gleich(D.teams.map(t => reiter(t)), ["SCO", "MIN", "MIN 1", "MIN 2"], "Reiter-Beschriftung (vom Verein: SCO, MIN 1 …) und Reihenfolge: SCO vor MIN 1 / MIN 2");
gleich(D.teams.map(t => t.reiter || null), [null, null, "MIN 1", "MIN 2"], "Reiter nur für Mannschaften mit Liga");
gleich(D.teams.filter(t => t.datei).map(t => t.datei), ["u13-1.ics", "u13-2.ics"], "Einzel-Kalender behalten den alten Dateinamen (bestehende Abos)");
gleich(D.teams.find(t => t.id === 45396).mit, [45398], "U13-Pokal hängt an U13 1, nicht der U15-Pokal");
gleich([{ n: "FC Koeppchen Wormeldange", kat: "Seniors", ohne: 1 }, { n: "FC Koeppchen Wormeldange I", kat: "Seniors", plus: 1 },
        { n: "FC Koeppchen Wormeldange II", kat: "Seniors", plus: 1 }].map(t => reiter(t)),
  ["Seniors 1", "Seniors 2", "Seniors 3"], "Seniors 1, Réserves als Seniors 2 und 3");

const jetzt = Date.parse("2026-10-18T10:00:00+02:00");
const v1 = M.sicht(D, 45396, jetzt);
gleich(v1.kommend.map(s => s.klasse), ["Coupe U13 Minimes - 1/32 de Finale"], "Koeppchen I sieht den U13-Pokal, nicht den der U15");
gleich(v1.gespielt.map(s => s.tag), [5, 1], "eigene Ergebnisse, neueste zuerst, ohne fremde Spiele");
ok(v1.status && v1.status.was.art === "up" && /Klasse III/.test(v1.status.was.txt), "Platz 2 in Klasse IV → Aufstieg in Klasse III");
ok(v1.status.neuFehlt, "neue Klasse noch nicht eingetragen");
const v2 = M.sicht(D, 45397, jetzt);
ok(v2.kommend.length === 1 && v2.kommend[0].typ === "CUP", "Pokalspiel auch bei Koeppchen II");
ok(v2.status && v2.status.was.art === "" && /Anmeldungen/.test(v2.status.was.txt), "Klasse VI: keine Behauptung über Auf-/Abstieg");
gleich([M.ausgang(v2.gespielt[0], 45397), M.ausgang(v2.gespielt[1], 45397)], ["n", "n"], "Niederlagen aus Sicht von Koeppchen II");
gleich(M.ausgang(spiel(s1), 45396), "u", "Unentschieden");
gleich(M.ausgang(spiel(s2), 45396), "s", "Sieg");

// Ein Spiel ohne Ergebnis rutscht 3 h nach Anpfiff aus „Nächste Spiele“.
const nachPokal = Date.parse("2026-10-24T17:30:00+02:00");
const v3 = M.sicht(D, 45396, nachPokal);
ok(v3.kommend.length === 0 && v3.gespielt[0].typ === "CUP", "Pokalspiel ohne Ergebnis nach 3 h bei den Ergebnissen");
ok(M.sicht(D, 45396, Date.parse("2026-10-24T16:30:00+02:00")).kommend.length === 1, "… aber nicht schon nach 2,5 h");

// Steigt eine neue Klasse dazu, ist sie die aktuelle, die alte wandert zu „früher“.
const DIV3 = { id: 20001, name: "U13 Minimes Cl3 S1 Phase 2", showResult: true, showRanking: true };
const s7 = roh(DIV3, "CC", "2026-11-07T14:00:00+01:00", K1, G(8), null, null, { tag: 1 });
const D2 = aufbereiten({ saison: { id: "20262027", name: "Saison 2026-2027" }, vereinsSpiele: [s1, s2, s7, s4],
  klassen: { 19189: { spiele: [s1, s2], tabelle: [rank(2, K1, 11)] }, 20001: { spiele: [s7], tabelle: [] }, 19233: { spiele: [s4], tabelle: null } } });
const v4 = M.sicht(D2, 45396, jetzt);
ok(v4.aktuell.id === 20001, "neue Klasse ist die aktuelle");
gleich(v4.frueher.map(k => k.id), [19189], "alte Klasse unter „früher“");
ok(v4.status === null, "laufende Phase: kein Abschlusshinweis");

// U9/U11: auch Freundschaftsspiele (Klasse „Amicaux“ mit showResult true) ohne Ergebnis, „gespielt“ statt „–“.
{
  const P1 = team(45500, "FC Koeppchen Wormeldange I", CLUB);
  const U9L = { id: 30001, name: "U9 Pupilles S6 Tour 1", showResult: false, showRanking: false };
  const AM = { id: 30002, name: "Amicaux 2", showResult: true, showRanking: true };
  const l1 = roh(U9L, "CC", "2026-10-03T11:00:00+02:00", P1, G(9), 3, 1, { ak: 4 });
  const f1 = roh(AM, "FM", "2026-09-19T14:00:00+02:00", P1, G(10), 8, 0, { ak: 4 });
  const f2 = roh(AM, "FM", "2026-09-20T14:00:00+02:00", P1, G(11), null, null, { ak: 4 });
  const fremd = roh(AM, "FM", "2026-09-19T14:00:00+02:00", G(12), G(13), 4, 4, { ak: 0 });
  const DU = aufbereiten({ saison: { id: "20262027", name: "Saison 2026-2027" }, vereinsSpiele: [l1, f1, f2],
    klassen: { 30001: { spiele: [l1], tabelle: null }, 30002: { spiele: [f1, f2, fremd], tabelle: null } } });
  const am = DU.klassen[30002].spiele;
  ok(am.find(x => x.h.id === 45500 && x.gespielt).hs === null && am.find(x => x.h.id === 12000 + 500000 || x.h.n === "Gegner 12").hs === 4,
     "U9-Freundschaftsspiel: Ergebnis nicht gespeichert, fremdes Spiel derselben Klasse unverändert");
  const vU = M.sicht(DU, 45500, Date.parse("2026-10-10T12:00:00+02:00"));
  ok(vU.gespielt.length === 3 && vU.gespielt.every(x => x.erg === false), "U9: alle eigenen Spiele ohne Ergebnis, auch Freundschaftsspiele");
}

// Réserves-Pokal: Pokalmannschaften mit I/II gehören nur zur gleichnamigen Ligamannschaft.
{
  const R1 = team(45403, "FC Koeppchen Wormeldange I", CLUB), R2 = team(45404, "FC Koeppchen Wormeldange II", CLUB);
  const RP1 = team(45405, "FC Koeppchen Wormeldange I", CLUB);
  const L1 = { id: 18918, name: "Réserves Classe 1", showResult: true, showRanking: true };
  const L3 = { id: 18936, name: "Réserves Classe 3 Série 2", showResult: true, showRanking: true };
  const RC = { id: 19511, name: "Coupe des Seniors Réserves - 1/32 de Finale", showResult: true, showRanking: false };
  const r1 = roh(L1, "CC", "2026-11-01T15:00:00+01:00", R1, G(10), null, null, { ak: 5 });
  const r2 = roh(L3, "CC", "2026-11-01T15:00:00+01:00", R2, G(11), null, null, { ak: 5 });
  const r3 = roh(RC, "CUP", "2026-11-09T20:00:00+01:00", G(12), RP1, null, null, { ak: 5 });
  const DR = aufbereiten({ saison: { id: "20262027", name: "Saison 2026-2027" }, vereinsSpiele: [r1, r2, r3],
    klassen: { 18918: { spiele: [r1], tabelle: [] }, 18936: { spiele: [r2], tabelle: [] }, 19511: { spiele: [r3], tabelle: null } } });
  ok(M.sicht(DR, 45403, jetzt).kommend.some(sp => sp.typ === "CUP"), "Réserves I sieht ihren Pokal");
  ok(!M.sicht(DR, 45404, jetzt).kommend.some(sp => sp.typ === "CUP"), "Réserves II sieht den Pokal der Réserves I nicht");
}

// Phase 3 nach der Winterpause: neue FLF-Nummer, gleicher Name (2025-26 echt so passiert).
{
  const K1neu = team(49999, "FC Koeppchen Wormeldange I", CLUB);
  const DIV3b = { id: 20500, name: "U13 Minimes Cl3 S1 Phase 3", showResult: true, showRanking: true };
  const p3 = roh(DIV3b, "CC", "2027-02-27T14:00:00+01:00", K1neu, G(14), 3, 1, { tag: 1 });
  const p3b = roh(DIV3b, "CC", "2027-03-06T14:00:00+01:00", G(15), K1neu, null, null, { tag: 2 });
  const DP = aufbereiten({ saison: { id: "20262027", name: "Saison 2026-2027" }, vereinsSpiele: [p3, s1, s2, p3b],
    klassen: { 19189: { spiele: [s1, s2], tabelle: [rank(2, K1, 11)] },
               20500: { spiele: [p3, p3b], tabelle: [rank(1, K1neu, 3), rank(2, G(14), 0)] } } });
  const t1 = DP.teams.filter(t => t.reiter === "MIN 1");
  ok(t1.length === 1, "neue FLF-Nummer in Phase 3: weiterhin ein Reiter U13 1");
  gleich(t1[0].ids, [45396, 49999], "beide Nummern an derselben Mannschaft, erste bleibt id");
  const vp = M.sicht(DP, 45396, Date.parse("2027-03-01T12:00:00+01:00"));
  ok(vp.aktuell.id === 20500 && vp.frueher[0].id === 19189, "Phase 3 aktuell, Phase 1 früher");
  ok(vp.eigen.has(49999) && vp.kommend.length === 1 && vp.gespielt[0].hs === 3, "Spiele unter der neuen Nummer zählen als eigene");
  ok(eigeneSpiele(DP, t1[0]).length === 4, "Kalender enthält beide Phasen");
}

gleich(M.nachSpieltag(D.klassen[19189].spiele).map(([t, s]) => [t, s.length]), [[1, 2], [5, 1]], "Spieltage gruppiert");

/* --- Kalender --- */
{
  const t1 = D.teams.find(t => t.id === 45396);
  ok(t1.datei === "u13-1.ics", "Dateiname aus dem Reiter");
  const k = ics(D, t1);
  ok(k.startsWith("BEGIN:VCALENDAR\r\n") && k.endsWith("END:VCALENDAR\r\n"), "Kalender mit CRLF");
  gleich((k.match(/BEGIN:VEVENT/g) || []).length, eigeneSpiele(D, t1).length, "ein Termin je eigenem Spiel samt Pokal");
  ok(k.includes("UID:flf-" + s5.match.id + "@fc-koeppchen"), "UID = FLF-Spiel-ID");
  ok(k.includes("DTSTART:20261024T120000Z") && k.includes("DTEND:20261024T134500Z"), "Pokal 14:00 Ortszeit = 12:00 UTC, 1:45 h");
  ok(k.includes("SUMMARY:⚽ Koeppchen MIN 1 – Gegner 2 9:0"), "Ergebnis im Titel, Mannschaft wie der Reiter");
  ok(k.includes("SUMMARY:⚽ Koeppchen MIN – Gegner 6 (Pokal)"), "Pokal ohne I/II: Koeppchen MIN");
  ok(k.includes("(Pokal)"), "Pokal gekennzeichnet");
  ok(k.split("\r\n").every(z => Buffer.byteLength(z, "utf8") <= 75), "Zeilen höchstens 75 Byte");
  ok(ics(D, t1) === k, "gleicher Stand → gleiche Datei (kein Commit bei jedem Lauf)");
  // Gemeinsamer Kalender U13 1 + U13 2 (vom Nutzer, 23.10.2026): beide Mannschaften, Pokal einmal, 1/2 im Titel.
  const t2 = D.teams.find(t => t.id === 45397);
  ok(t1.gruppe?.datei === "minimes-u13.ics" && t2.gruppe?.datei === "minimes-u13.ics" && t1.gruppe.name === "Minimes U13", "U13 1 und U13 2: ein Kalender „Minimes U13“");
  const g = icsGruppe(D, t1.gruppe), ids = new Set([...eigeneSpiele(D, t1), ...eigeneSpiele(D, t2)].map(s => s.id));
  ok((g.match(/BEGIN:VEVENT/g) || []).length === ids.size && ids.size > eigeneSpiele(D, t1).length, "Gruppe: jedes Spiel beider Mannschaften genau einmal");
  ok(g.includes("Koeppchen MIN 1") && g.includes("Koeppchen MIN 2") && g.includes("X-WR-CALNAME:FC Koeppchen Minimes U13"), "Gruppe: 1 und 2 im Titel, Name Minimes U13");
  ok(D.teams.filter(t => t.datei && t.kat === "Seniors").every(t => !t.gruppe), "Seniors: eigene Kalender, keine Gruppe");
  // Uhrzeit offen (00:00 Ortszeit) → ganztägig.
  const s9 = roh(DIV4, "CC", "2026-11-07T00:00:00+01:00", K1, G(13), null, null, { tag: 6 });
  const D9 = aufbereiten({ saison: { id: "20262027", name: "Saison 2026-2027" }, vereinsSpiele: [s1, s9],
    klassen: { 19189: { spiele: [s1, s9], tabelle: [] } } });
  { const k = ics(D9, D9.teams.find(t => t.id === 45396));
    ok(!k.includes("VALUE=DATE") && k.includes("DTSTART:20261106T230000Z") && k.includes("Uhrzeit offen"), "Uhrzeit offen → Termin um 00:00 mit „Uhrzeit offen“ im Titel, kein Ganztagstermin"); }
  // Die FLF schreibt „offen“ auch als 00:00:01 (25.10.2026) — ebenfalls ganztägig, nicht 0:00–1:30 nachts.
  const s9b = roh(DIV4, "CC", "2026-11-14T00:00:01+01:00", K1, G(14), null, null, { tag: 7 });
  const D9b = aufbereiten({ saison: { id: "20262027", name: "Saison 2026-2027" }, vereinsSpiele: [s1, s9b],
    klassen: { 19189: { spiele: [s1, s9b], tabelle: [] } } });
  ok(ics(D9b, D9b.teams.find(t => t.id === 45396)).includes("Uhrzeit offen"), "Uhrzeit offen als 00:00:01 → auch „Uhrzeit offen“ im Titel");
}

/* --- Live (FuPa) — Felder wie am 18.10.2026 gegen Beggen live abgefragt --- */
{
  const SEN = team(44831, "FC Koeppchen Wormeldange", CLUB), BEG = team(46000, "Avenir Beggen", 500100);
  const PH = { id: 18888, name: "Promotion d'Honneur", showResult: true, showRanking: true };
  const sp = roh(PH, "CC", "2026-10-18T16:00:00+02:00", SEN, BEG, null, null, { ak: 0, tag: 8 });
  const DS = aufbereiten({ saison: { id: "20262027", name: "Saison 2026-2027" }, vereinsSpiele: [sp],
    klassen: { 18888: { spiele: [sp], tabelle: [] } } });
  ok(DS.teams[0].reiter === "Seniors 1", "Seniors-Reiter für den Live-Test");
  const fupa = {
    slug: "fc-koeppchen-m1-fc-avenir-beggen-m1-261018", homeGoal: 1, awayGoal: 0, section: "LIVE",
    homeTeam: { slug: "fc-koeppchen-m1-2026-27" }, tickerAuthor: { name: "Paul Krier" },
    live: { minute: 71, period: "secondHalf", running: true, lastTimestamp: "2026-10-18T17:30:03+02:00" },
    highlights: [{ minute: 12, additionalMinute: 0, type: "goal", subtype: "goal_headed",
      team: { teamSlug: "fc-koeppchen-m1-2026-27" }, primaryRole: { firstName: "Pedro", lastName: "Neves Costa" } },
      { minute: 30, type: "card", team: { teamSlug: "x" } },
      { minute: 55, type: "penaltyfail", subtype: "penalty_foul", team: { teamSlug: "fc-koeppchen-m1-2026-27" }, primaryRole: { firstName: "Max", lastName: "Muster" } }],
  };
  const flf = DS.klassen[18888].spiele[0];
  const Lv = liveAus(fupa, flf);
  gleich([Lv.hs, Lv.as, Lv.minute, Lv.ticker], [1, 0, 71, "Paul Krier"], "FuPa → Stand, Minute, Tickerer");
  gleich(Lv.tore, [{ min: 12, plus: 0, heim: true, name: "Pedro Neves Costa", art: "goal_headed" }], "nur Tore, Heim erkannt");
  ok(liveGleich(Lv, { ...Lv, minute: 75, minuteAt: "2026-10-18T17:35:00+02:00" }), "nur Minute anders → kein Commit");
  ok(!liveGleich(Lv, { ...Lv, hs: 2 }), "Tor → Commit");

  const t0 = Date.parse("2026-10-18T17:30:03+02:00");
  ok(spielJetzt(DS, Date.parse("2026-10-18T15:50:00+02:00")) && !spielJetzt(DS, Date.parse("2026-10-18T15:40:00+02:00")), "Zeitfenster ab 15 min vor Anstoß");
  ok(!spielJetzt(DS, Date.parse("2026-10-18T19:05:00+02:00")), "… bis 180 min danach");
  // --wache: Starts um 11:23/14:23/17:23 — 16:00-Anstoß gehört dem Lauf um 14:23, nicht 11:23.
  ok(!naechstesSpiel(DS, Date.parse("2026-10-18T11:23:00+02:00")), "11:23-Lauf wartet nicht auf 16:00");
  ok(naechstesSpiel(DS, Date.parse("2026-10-18T14:23:00+02:00")), "14:23-Lauf übernimmt 16:00");
  ok(naechstesSpiel(DS, Date.parse("2026-10-18T16:40:00+02:00")), "verspäteter Start mitten im Spiel steigt noch ein");
  ok(naechstesSpiel(DS, Date.parse("2026-10-18T18:45:00+02:00")), "180 min: Verlängerung + Elfmeter noch drin");
  ok(!naechstesSpiel(DS, Date.parse("2026-10-18T19:01:00+02:00")), "nach dem Fenster nichts mehr");
  const fs = [{ slug: "a", kickoff: "2026-10-18T16:00:00+02:00" }, { slug: "b", kickoff: "2026-10-25T16:00:00+02:00" }];
  ok(passendesSpiel(fs, "2026-10-18T16:00:00+02:00").slug === "a", "FuPa-Spiel bei gleicher Anstoßzeit");
  ok(passendesSpiel(fs, "2026-10-18T16:30:00+02:00").slug === "a", "Verlegung um 30 min wird noch gefunden");
  ok(passendesSpiel(fs, "2026-10-19T16:00:00+02:00") === null, "anderer Tag: nicht dasselbe Spiel");
  for (const z of ["2026-10-18T16:00:00+02:00", "2026-10-18T16:30:00+02:00", "2026-10-19T16:00:00+02:00"])
    ok(wPassend(fs, z)?.slug === passendesSpiel(fs, z)?.slug, "Worker sucht wie der GitHub-Lauf: " + z);
  gleich([saisonVon("2026-10-18T16:00:00+02:00"), saisonVon("2027-03-07T16:00:00+01:00"), saisonVon("2027-07-01T12:00:00+02:00")],
    ["2026-27", "2026-27", "2027-28"], "Saison aus dem Anstoß (neue ab Juli)");
  const vS = M.sicht(DS, 44831, t0);
  const a = M.liveAnzeige(Lv, vS, t0 + 7 * 60e3);
  ok(a && a.laeuft && a.zeit === "78'", "LIVE-Kasten, Minute zählt weiter (71 + 7)");
  ok(M.liveZeit(Lv, t0 + 40 * 60e3) === "90+", "nach 90 nur noch 90+");
  ok(M.liveZeit({ ...Lv, minute: 44, period: "started" }, t0 + 5 * 60e3) === "45+", "1. Halbzeit endet bei 45+");
  ok(M.liveZeit({ ...Lv, period: "halftime", running: false }, t0) === "Halbzeit", "Halbzeit");
  ok(M.liveZeit({ ...Lv, minute: 98, period: "firstHalfOvertime" }, t0) === "Verlängerung 98'", "Verlängerung");
  ok(M.liveZeit({ ...Lv, minute: 118, period: "secondHalfOvertime" }, t0 + 9 * 60e3) === "Verlängerung 120+", "Verlängerung gedeckelt bei 120");
  ok(M.liveZeit({ ...Lv, period: "penalty", running: false }, t0) === "Elfmeterschießen", "Elfmeterschießen");
  ok(M.liveAnzeige({ ...Lv, section: "POST" }, vS, t0).zeit === "Abpfiff", "nach Abpfiff: Endstand laut FuPa");
  ok(M.liveAnzeige({ ...Lv, section: "PRE" }, vS, t0) === null, "vor Anpfiff kein Kasten");
  ok(M.liveAnzeige(Lv, M.sicht(D, 45396, t0), t0) === null, "kein Kasten bei U13 1");
  ok(M.liveAnzeige({ ...Lv, hs: null, as: null, ticker: null, tore: [], karten: [] }, vS, t0) === null, "FuPa „LIVE“ ohne Tickerer: kein Kasten");
  ok(M.liveAnzeige(Lv, vS, Date.parse("2026-10-18T20:30:00+02:00")) === null, "spätestens 4 h nach Anstoß weg");
  const spFlf = roh(PH, "CC", "2026-10-18T16:00:00+02:00", SEN, BEG, 2, 1, { ak: 0, tag: 8 });
  const DF = aufbereiten({ saison: { id: "20262027", name: "Saison 2026-2027" }, vereinsSpiele: [spFlf],
    klassen: { 18888: { spiele: [spFlf], tabelle: [] } } });
  ok(M.liveAnzeige({ ...Lv, flfId: spFlf.match.id }, M.sicht(DF, 44831, t0), t0) === null, "FLF hat Ergebnis → Kasten weg");
  // Worker und GitHub-Lauf müssen dasselbe aus FuPa machen (zwei Kopien derselben Umrechnung).
  const Wk = kuerzen({ ...fupa, homeGoal: 2 });
  ok(Lv.fehl.length === 1 && Lv.fehl[0].name === "Max Muster" && Lv.fehl[0].heim && Lv.tore.length === 1, "verschossener Elfmeter getrennt von den Toren");
  gleich(M.ereignisListe(Lv).map(e => e.typ + e.min), ["tor12", "karte30", "fehl55"], "Kasten-Liste: Tor, Karte, verschossener Elfmeter nach Minute");
  for (const k of ["hs", "as", "section", "period", "running", "minute", "minuteAt", "tore", "karten", "fehl", "ticker"])
    ok(JSON.stringify(Wk[k]) === JSON.stringify(liveAus({ ...fupa, homeGoal: 2 }, flf)[k]), "Worker = GitHub-Lauf: " + k);
  ok(M.mitWorker(Lv, Wk).hs === 2 && M.mitWorker(Lv, Wk).h === Lv.h, "Worker-Stand gilt, Namen bleiben aus live.json");
  ok(M.mitWorker(Lv, { ...Wk, slug: "anderes-spiel" }).hs === 1, "Worker zu anderem Spiel wird ignoriert");
  ok(M.mitWorker(Lv, null) === Lv, "ohne Worker gilt GitHub");
  // Ohne GitHub-Lauf: Gerüst aus dem FLF-Spielplan, Worker per Anstoßzeit gefragt.
  const spS = M.liveSpiel(vS, t0);
  ok(spS && spS.id === flf.id, "laufendes Spiel der Seniors 1 aus dem Spielplan");
  ok(M.liveSpiel(M.sicht(D, 45396, t0), t0) === null, "kein Live für U13");
  // Seniors 2/3: nur mit FuPa-Slug aus dem Abruf (der Worker sucht per Anstoß nur Seniors 1).
  const vR = { ...vS, team: { ...vS.team, reiter: "Seniors 2" } };
  ok(M.liveSpiel(vR, t0) === null, "Seniors 2 ohne Slug: kein Live");
  const spR = M.liveSpiel(vR, t0, { [flf.id]: "fc-koeppchen-mr1-x-261018" });
  ok(spR && spR.slug === "fc-koeppchen-mr1-x-261018" && M.liveBasis(null, spR).slug === spR.slug, "Seniors 2 mit Slug: Worker direkt");
  const spT = M.liveSpiel(vR, t0, { [flf.id]: vR.ids.has(flf.h.id) ? "beggen-mr1-fc-koeppchen-mr1-261018" : "fc-koeppchen-mr1-x-261018" });
  ok(spT.h.id === flf.a.id && spT.a.id === flf.h.id, "Heim/Gast bei FuPa andersherum: Seiten getauscht");
  ok(M.liveSpiel({ ...vS, team: { ...vS.team, reiter: "Seniors 4" } }, t0, { [flf.id]: "x" }) === null, "andere Reiter nicht");
  // Endstand von FuPa bleibt, bis die FLF ihr Ergebnis hat (23.10.2026: Seniors 3 um 23 Uhr weg, FLF noch leer).
  {
    const an = Date.parse(flf.d), spaet = an + 200 * 60e3;
    ok(M.liveSpiel(vS, spaet) === null, "nach 180 min ohne Nachfrage-Erlaubnis kein Live-Spiel mehr");
    ok(M.liveSpiel(vS, spaet, {}, () => true)?.id === flf.id, "nach 180 min: Spiel bleibt, wenn der Endstand bekannt ist");
    ok(M.liveSpiel(vS, an + 49 * 3600e3, {}, () => true) === null, "nach 48 h nicht mehr");
    ok(M.liveAnzeige({ ...Lv, section: "POST" }, vS, an + 6 * 3600e3)?.zeit === "Abpfiff", "Endstand laut FuPa auch 6 h nach Anstoß");
    ok(M.liveAnzeige({ ...Lv, section: "POST" }, vS, an + 49 * 3600e3) === null, "Endstand nach 48 h weg");
    ok(M.liveAnzeige({ ...Lv, section: "LIVE" }, vS, an + 6 * 3600e3) === null, "hängender LIVE-Stand bleibt bei 4 h");
    ok(M.liveSpiel(M.sicht(DF, 44831, t0), spaet, {}, () => true) === null, "FLF hat Ergebnis → kein spätes Live-Spiel");
  }
  {
    const sp = (id, d) => ({ id, d, h: { id: 7, n: "FC Koeppchen Wormeldange I" }, a: { id: 8, n: "B" } });
    const DR = { teams: [{ id: 7, reiter: "Seniors 2", klassen: [5] }, { id: 9, reiter: "U13 1", klassen: [5] }],
      klassen: { 5: { n: "R1", typ: "CC", spiele: [sp(1, "2026-10-19T20:00:00+02:00"), sp(2, "2026-12-19T20:00:00+01:00"),
        sp(3, "2026-10-01T20:00:00+02:00"), sp(4, "2026-10-26T19:30:00+01:00")] } } };
    const fsR = [{ kickoff: "2026-10-19T20:00:00+02:00", slug: "fc-koeppchen-mr1-titus-261019" },
                 { kickoff: "2026-10-26T19:30:00+01:00", slug: "fremd-mr1-261026" }];
    const r = reserveSlugs(DR, { "Seniors 2": fsR }, passendesSpiel, Date.parse("2026-10-19T12:00:00+02:00"));
    gleich(r, { 1: "fc-koeppchen-mr1-titus-261019" }, "Reserve-Slugs: nur nahe Spiele, nur Koeppchen-Slugs");
  }
  const b0 = M.liveBasis(null, spS);
  ok(b0.slug === null && b0.flfId === flf.id && b0.h === flf.h.n, "Gerüst ohne live.json");
  ok(M.liveBasis({ ...Lv, flfId: 1 }, spS).slug === null, "live.json vom letzten Spiel gilt nicht");
  const mw = M.mitWorker(b0, { ...Wk, fuer: flf.id });
  ok(mw.hs === 2 && mw.slug === Wk.slug && /fupa\.net\/match\//.test(mw.url), "Worker füllt das Gerüst samt Slug");
  ok(M.mitWorker(b0, { ...Wk, fuer: 999 }).hs === undefined, "Worker-Antwort für ein anderes Spiel zählt nicht");
  ok(M.liveAnzeige(mw, vS, t0) && M.liveAnzeige(b0, vS, t0) === null, "Kasten erst mit Worker-Daten");
  // Unsere Woche
  {
    const di = Date.parse("2026-10-20T12:00:00+02:00");
    gleich(M.wocheTage(di), ["2026-10-19","2026-10-20","2026-10-21","2026-10-22","2026-10-23","2026-10-24","2026-10-25"], "Woche Mo–So um einen Dienstag");
    gleich(M.wocheTage(Date.parse("2026-10-25T21:59:00+02:00"))[0], "2026-10-19", "Sonntag vor 22 Uhr: noch diese Woche");
    gleich(M.wocheTage(Date.parse("2026-10-25T22:00:00+01:00"))[0], "2026-10-26", "Sonntag ab 22 Uhr: nächste Woche (auch über die Zeitumstellung)");
    const w = M.wocheSpiele(D, M.wocheTage(di), di);
    ok(w.filter(sp => sp.d.startsWith("2026-10-24")).length === 1, "Pokalspiel nur einmal, obwohl bei U13 1 und U13 2");
    ok(w.find(sp => sp.d.startsWith("2026-10-24"))?.reiter === "MIN", "Pokal ohne I/II heißt „MIN“");
    ok(!w.some(sp => sp.d.startsWith("2026-10-17")), "Spiel der Vorwoche nicht dabei");
    const bil = M.wocheBilanz([{ gespielt: true, heim: true, hs: 2, as: 1 }, { gespielt: true, heim: false, hs: 2, as: 1 },
      { gespielt: true, heim: true, hs: 1, as: 1 }, { gespielt: true, heim: true, hs: 3, as: 0, erg: false }]);
    gleich(bil, { s: 1, u: 1, n: 1 }, "Bilanz: Heim/Gast richtig, ohne veröffentlichte Ergebnisse (U9/U11) nicht gezählt");
  }
  // Countdown 15 min vor Anpfiff
  {
    const sp = { d: "2026-10-19T20:00:00+02:00" }, um = hm => Date.parse("2026-10-19T" + hm + ":00+02:00");
    gleich([um("19:44"), um("19:45"), um("19:48:30".slice(0, 5)) + 30e3, um("19:59") + 30e3, um("20:00")].map(t => M.minutenBisAnpfiff(sp, t)),
      [null, 15, 12, 1, null], "Countdown: ab 15 min, aufgerundet, beim Anpfiff weg");
    ok(M.minutenBisAnpfiff({ d: "2026-12-05T00:00:01+01:00" }, Date.parse("2026-12-04T23:50:00+01:00")) === null, "Uhrzeit offen: kein Countdown");
  }
  // „Heute Spieltag“
  const morgens = Date.parse("2026-10-18T09:00:00+02:00");
  const hm = M.spieltagHeute(M.sicht(DS, 44831, morgens), morgens);
  ok(hm && hm.sp.id === flf.id && !hm.begonnen, "morgens: Heute Spieltag, noch nicht begonnen");
  const hl = M.spieltagHeute(M.sicht(DS, 44831, t0), t0);
  ok(hl && hl.begonnen, "nach Anstoß: Spiel läuft");
  ok(M.spieltagHeute(M.sicht(DS, 44831, Date.parse("2026-10-17T20:00:00+02:00")), Date.parse("2026-10-17T20:00:00+02:00")) === null, "am Vortag kein Spieltag-Kasten");
  ok(M.spieltagHeute(M.sicht(DS, 44831, Date.parse("2026-10-18T19:30:00+02:00")), Date.parse("2026-10-18T19:30:00+02:00")) === null, "3 h nach Anstoß weg");
  ok(M.spieltagHeute(M.sicht(DF, 44831, t0), t0) === null, "mit FLF-Ergebnis weg");
  gleich(["penalty_foul", "goal_headed", "goal_shoot", "goal_own_goal", "goal_free_kick", "penalty_shootout",
          "goal_scrounger", "goal_distance_shoot", ""].map(M.torArt),
    ["Elfmeter", "Kopfball", "", "Eigentor", "Freistoß", "Elfmeterschießen", "Abstauber", "Fernschuss", ""],
    "Torart mit den echten FuPa-Namen aus 11 Spielen");
  gleich(["card_red", "card_yellow_red", "card_yellow"].map(a => M.kartenArt(a).text), ["Rot", "Gelb-Rot", "Gelb"], "Kartenarten");
  gleich(Lv.karten.map(k => [k.min, k.heim]), [[30, false]], "Karte aus FuPa übernommen, Gast erkannt");
  gleich(M.ereignisListe(Lv).map(e => e.typ + e.min), ["tor12", "karte30", "fehl55"], "Tore, Karten und verschossene Elfmeter nach Minute");
  ok(M.ereignisListe({ tore: Lv.tore }).length === 1, "alte live.json ohne Karten geht");
  ok(M.imLiveFenster(vS, t0) && !M.imLiveFenster(vS, Date.parse("2026-10-19T12:00:00+02:00")), "Abfrage jede Minute nur im Fenster");
}

// BGL Ligue und Nationalteam (Reiter ohne Kalender/Ticker).
{
  const sp = (tag, d, gespielt) => ({ id: tag * 10 + d.length, tag, d, h: { id: 1, n: "A" }, a: { id: 2, n: "B" }, hs: gespielt ? 1 : null, as: gespielt ? 0 : null, gespielt });
  const bgl = { n: "BGL Ligue", tabelle: [], spiele: [
    sp(8, "2026-10-04T16:00:00+02:00", true), sp(9, "2026-10-17T18:00:00+02:00", true), sp(9, "2026-10-18T16:00:00+02:00", false),
    sp(10, "2026-10-25T16:00:00+01:00", false), sp(11, "2026-11-01T16:00:00+01:00", false), sp(12, "2026-11-08T16:00:00+01:00", false),
    sp(5, "2026-12-02T19:00:00+01:00", false) /* verlegt */] };
  const v = M.bglSicht(bgl, Date.parse("2026-10-19T10:00:00+02:00"));
  ok(v.letzter[0] === 9 && v.letzter[1].length === 2, "BGL: letzter Spieltag 9, auch mit offenem Spiel");
  gleich(v.naechste.map(t => t[0]), [10, 11], "BGL: zwei nächste Spieltage");
  const v0 = M.bglSicht({ spiele: bgl.spiele.map(x => ({ ...x, gespielt: false })) }, Date.parse("2026-07-01T10:00:00+02:00"));
  ok(v0.letzter === null && v0.naechste[0][0] === 5, "BGL vor Saisonbeginn: kein letzter Spieltag, ab dem ersten");
  ok(M.bglSicht({ spiele: bgl.spiele.slice(0, 2) }, Date.parse("2026-10-19T10:00:00+02:00")).naechste.length === 0, "BGL Saisonende: keine nächsten");
  const g = (h, a, hs, as) => ({ d: "2026-08-01", h: { id: h, n: h }, a: { id: a, n: a }, hs, as, gespielt: true });
  const erg = [g("A", "B", 2, 0), g("C", "A", 1, 1), g("B", "C", 3, 1)];
  const t1 = M.bglTabelle({ spiele: erg, tabelle: [{ pl: 1, id: "A", n: "A", sp: 1, pkt: 3 }] });
  ok(t1.selbst && t1.flfSp === 1, "BGL: FLF-Tabelle zurück → selbst gerechnet");
  gleich(t1.tabelle.map(r => [r.pl, r.id, r.sp, r.pkt, r.t, r.g]), [[1, "A", 2, 4, 3, 1], [2, "B", 2, 3, 3, 3], [3, "C", 2, 1, 2, 4]], "BGL: eigene Tabelle Punkte/Tore");
  const t2 = M.bglTabelle({ spiele: [{ ...erg[0], d: "2026-08-01" }, { ...erg[1], d: "2026-08-08" }, { ...erg[2], d: "2026-08-15" }],
    tabelle: [{ id: "A", n: "A", sp: 1, pkt: 3 }, { id: "B", n: "B", sp: 1, pkt: -12 }, { id: "C", n: "C", sp: 0, pkt: 0 }] });
  gleich(t2.tabelle.map(r => [r.id, r.pkt, r.abzug]), [["A", 4, 0], ["C", 1, 0], ["B", -9, -12]], "BGL: Punktabzug aus der FLF-Tabelle bleibt");
  const flf = [{ pl: 1, id: "X", n: "X", sp: 2, pkt: 6 }];
  ok(M.bglTabelle({ spiele: erg, tabelle: flf }).tabelle === flf, "BGL: aktuelle FLF-Tabelle gilt");
  const st = (rank, slug, full, m, w, d, l, o, a, p) => ({ rank, matches: m, wins: w, draws: d, defeats: l, ownGoals: o, againstGoals: a, points: p, team: { slug, name: { full } } });
  const ft = fupaTabelleMitFlfNamen([st(1, "a", "FC A-Dorf", 2, 1, 1, 0, 3, 1, 4), st(2, "b", "B-Dorf", 2, 1, 0, 1, 3, 3, -9), st(3, "x", "Unbekannt", 5, 0, 0, 5, 0, 9, 0)], erg, {}, 1);
  gleich(ft.tabelle.map(r => [r.pl, r.id, r.n, r.pkt]), [[1, "A", "A", 4], [2, "B", "B", -9], [3, "x", "Unbekannt", 0]], "BGL: FuPa-Tabelle mit FLF-Namen, Abzug bleibt, Unpassendes behält FuPa-Namen");
  gleich(ft.namen, { a: "A", b: "B" }, "BGL: Zuordnung wird gemerkt");
  ok(fupaTabelleMitFlfNamen([st(1, "a", "FC A-Dorf", 2, 1, 1, 0, 3, 1, 4)], erg).tabelle[0].n === "FC A-Dorf", "BGL: vor dem 3. Spiel keine neue Zuordnung");
  // Saisonanfang: zwei Vereine mit denselben Zahlen → nur das Gedächtnis hilft.
  const gleichAuf = [{ d: "2027-08-01", h: { id: 7, n: "A" }, a: { id: 8, n: "C" }, hs: 1, as: 0, gespielt: true },
                     { d: "2027-08-01", h: { id: 9, n: "B" }, a: { id: 10, n: "D" }, hs: 1, as: 0, gespielt: true }];
  const neuSaison = fupaTabelleMitFlfNamen([st(1, "a", "FC A-Dorf", 1, 1, 0, 0, 1, 0, 3), st(2, "b", "B-Dorf", 1, 1, 0, 0, 1, 0, 3), st(3, "n", "Neuling", 1, 1, 0, 0, 1, 0, 3)], gleichAuf, ft.namen, 1);
  gleich(neuSaison.tabelle.map(r => [r.id, r.n]), [[7, "A"], [9, "B"], ["n", "Neuling"]], "BGL: gemerkte Namen gelten auch bei gleichen Zahlen, Neuling bleibt FuPa");
  // Gemerkt geht vor: passt eine Zeile zufällig auf einen anderen Verein, bleibt der gemerkte Name.
  const verwechselt = fupaTabelleMitFlfNamen([st(1, "a", "FC A-Dorf", 2, 1, 0, 1, 3, 3, 3)], erg, { a: "A" }, 1);
  ok(verwechselt.tabelle[0].n === "A" && verwechselt.namen.a === "A", "BGL: gemerkte Zuordnung wird nicht überschrieben");
  // Kein Name zweimal: der Neue passt auf B, aber B ist schon vergeben → FuPa-Name.
  const doppelt = fupaTabelleMitFlfNamen([st(1, "q", "Quer", 2, 1, 0, 1, 3, 3, 3)], erg, { b: "B" }, 1);
  ok(doppelt.tabelle[0].n === "Quer" && !doppelt.namen.q, "BGL: ein schon vergebener FLF-Name wird nicht doppelt vergeben");
  // FuPa-Seite nicht eindeutig (zwei Zeilen mit gleichen Zahlen) → keine Zuordnung.
  const zwei = fupaTabelleMitFlfNamen([st(1, "a", "X1", 2, 1, 1, 0, 3, 1, 4), st(2, "z", "X2", 2, 1, 1, 0, 3, 1, 4)], erg, {}, 1);
  ok(zwei.tabelle.every(r => r.n.startsWith("X")), "BGL: gleiche Zahlen auf FuPa-Seite → keine Zuordnung");
  gleich(M.extraReiter({ bgl, nati: null }).map(t => t.id), ["bgl", "jk"], "BGL/Roude Léiw nur, wenn Daten da sind; Jugend immer, als letzter");
  // Reiter-Raster: jede Reihe füllt genau 60 Spalten, Handy (4) und Computer (6), für jede Zahl von Reitern.
  for (let n = 1; n <= 30; n++) {
    const b = M.reiterBreiten(n);
    for (const [k, sp] of [[0, 4], [1, 6]]) {
      let reihe = 0, ok = true, volle = 0;
      b.forEach(x => { const w = x[k]; if (!Number.isInteger(w)) ok = false; reihe += w; if (reihe === 60) { reihe = 0; volle++; } else if (reihe > 60) ok = false; });
      if (!ok || reihe !== 0 || volle !== Math.ceil(n / sp)) { gleich([n, sp, b.map(x => x[k])], "volle Reihen", "Reiter-Raster ohne Lücke"); break; }
    }
  }
  gleich(M.reiterBreiten(15).map(x => x[0]).slice(-4), [15, 20, 20, 20], "15 Reiter am Handy: letzte Reihe 3 gleich breite");
  gleich(M.reiterBreiten(15).map(x => x[1]).slice(-4), [10, 20, 20, 20], "15 Reiter am Computer: letzte Reihe 3 gleich breite");
  gleich(M.reiterBreiten(16).map(x => x[0]).slice(-4), [15, 15, 15, 15], "16 Reiter am Handy: alle gleich");

  const r = (typ, slug, title, cat) => ({ type: typ, slug, title, competitionSeason: { slug: "uefa-nations-league", name: "UEFA Nations League", category: { id: cat } } });
  const f = (id, kickoff, section, round) => ({ id, kickoff, section, homeTeam: { name: { full: "Luxemburg" } }, awayTeam: { name: { full: "Estland" } },
    homeGoal: section === "POST" ? 0 : null, awayGoal: section === "POST" ? 1 : null, round });
  const test = { type: "league", slug: "99", competitionSeason: { slug: "testspiele", name: "Testspiele", category: { id: 6 } } };
  const roh = [f(1, "2026-03-26T18:00:00+01:00", "POST", r("cupko", "quali-playoffs", "PlayOff", 4)),
               f(2, "2026-06-03T20:45:00+02:00", "POST", test),
               f(3, "2026-10-06T20:45:00+02:00", "POST", r("cupgroup", "c4", "C4", 4)),
               f(4, "2026-11-13T20:45:00+01:00", "PRE", r("cupgroup", "c4", "C4", 4)),
               f(5, "2027-03-25T20:45:00+01:00", "PRE", { type: "cupgroup", slug: "f", title: "F", competitionSeason: { slug: "wm-quali", name: "WM-Qualifikation", category: { id: 4 } } })];
  gleich(natiGruppe(roh, Date.parse("2026-10-19T12:00:00+02:00")), { comp: "uefa-nations-league", group: "c4", n: "UEFA Nations League · Gruppe C4" }, "Nati: Gruppe des nächsten Pflichtspiels");
  ok(natiGruppe(roh, Date.parse("2026-12-01T12:00:00+01:00")).comp === "wm-quali", "Nati: wechselt von selbst zur Qualifikation");
  ok(natiGruppe(roh.slice(0, 4), Date.parse("2026-12-01T12:00:00+01:00")).group === "c4", "Nati: ohne neues Pflichtspiel bleibt die letzte Gruppe");
  ok(natiGruppe(roh.slice(0, 2), Date.parse("2026-12-01T12:00:00+01:00")) === null, "Nati: Testspiele und K.-o. haben keine Tabelle");
  const ns = natiSpiel(roh[2]);
  ok(ns.h.n === "Luxemburg" && ns.hs === 0 && ns.gespielt && ns.wett === "UEFA Nations League" && ns.runde === "C4", "Nati: Spiel umgerechnet");
  const tab = natiTabelle([{ rank: 4, matches: 4, wins: 1, draws: 0, defeats: 3, ownGoals: 2, againstGoals: 7, points: 3, team: { name: { full: "Luxemburg" } } }]);
  gleich(tab, [{ pl: 4, id: "Luxemburg", n: "Luxemburg", sp: 4, s: 1, u: 0, nl: 3, t: 2, g: 7, pkt: 3 }], "Nati: Tabelle umgerechnet");
  const nv = M.natiSicht({ spiele: roh.map(natiSpiel), gruppe: null }, Date.parse("2026-10-19T12:00:00+02:00"));
  gleich([nv.kommend.map(s => s.id), nv.gespielt.map(s => s.id)], [[4, 5], [3, 2, 1]], "Nati: kommend und Ergebnisse");
  const nvs = M.natiSicht({ spiele: roh.map(m => ({ ...natiSpiel(m), slug: "lux-" + m.id })), gruppe: null }, 0);
  const t4 = Date.parse("2026-11-13T20:45:00+01:00");
  ok(M.natiLiveSpiel(nvs, t4 - 10 * 60e3)?.id === 4 && M.natiLiveSpiel(nvs, t4 + 170 * 60e3)?.id === 4, "Nati live: 15 min vor bis 180 min nach Anstoß");
  ok(M.natiLiveSpiel(nvs, t4 - 20 * 60e3) === null && M.natiLiveSpiel(nvs, t4 + 190 * 60e3) === null, "Nati live: außerhalb des Fensters nichts");
  ok(M.natiLiveSpiel(nvs, t4 + 190 * 60e3, () => true)?.id === 4, "Nati: Endstand bleibt nach dem Fenster, solange kein Ergebnis da ist");
  ok(M.natiLiveSpiel(nvs, t4 + 49 * 3600e3, () => true) === null, "Nati: nach 48 h nicht mehr");
  const nh = M.spieltagHeute(M.natiSicht({ spiele: roh.map(natiSpiel), gruppe: null }, t4 - 8 * 3600e3), t4 - 8 * 3600e3);
  ok(nh && nh.sp.id === 4 && !nh.begonnen, "Nati: Heute-Spieltag-Kasten am Länderspieltag");
}

// Plan B: Worker stößt den FLF-Abruf an (Zeiten in Luxemburger Zeit, Sommer und Winter).
{
  const f = iso => abrufFaellig(Date.parse(iso));
  ok(f("2026-10-24T08:00:00+02:00") && f("2026-10-24T14:45:00+02:00") && f("2026-10-24T22:00:00+02:00"), "Samstag 8–22 Uhr jede Viertelstunde (Sommerzeit)");
  ok(!f("2026-10-24T07:45:00+02:00") && !f("2026-10-24T22:15:00+02:00") && !f("2026-10-24T14:50:00+02:00"), "nicht vor 8, nicht nach 22, nur Viertelstunden");
  ok(f("2026-10-25T08:00:00+01:00") && f("2026-10-25T21:45:00+01:00") && !f("2026-10-25T07:45:00+01:00"), "Sonntag nach der Zeitumstellung: Fenster bleibt 8–22 Uhr");
  ok(f("2026-10-26T22:15:00+01:00") && !f("2026-10-26T21:15:00+01:00") && !f("2026-10-26T22:00:00+01:00"), "Mo–Fr 22:15 Ortszeit, auch im Winter");
  ok(f("2026-10-23T22:15:00+02:00") && !f("2026-10-23T21:15:00+02:00"), "Freitag wie Wochentag, Sommerzeit");
  let tage = 0; for (let t = Date.parse("2026-10-24T00:00:00+02:00"); t < Date.parse("2026-10-31T00:00:00+01:00"); t += 15 * 60e3) tage += abrufFaellig(t);
  ok(f("2026-10-21T23:30:00+02:00") && f("2026-10-31T23:30:00+01:00") && !f("2026-10-21T23:15:00+02:00"), "jeden Abend 23:30 (Sommer und Winter)");
  let minuten = 0; for (let t = Date.parse("2026-10-24T00:00:00+02:00"); t < Date.parse("2026-10-31T00:00:00+01:00"); t += 60e3) minuten += abrufFaellig(t);
  ok(minuten === tage, "Takt jede Minute: FLF-Abruf trotzdem nur zu denselben Zeiten");
  ok(tage === 2 * 57 + 5 + 7 + 7, "eine Woche: 57 Anstöße je Wochenendtag + 5 Abende + 7× 23:30 + 7× 7:00, waren " + tage);
  ok(f("2026-10-20T07:00:00+02:00") && !f("2026-10-20T07:15:00+02:00") && f("2026-10-27T07:00:00+01:00"), "7:00 Luxemburger Zeit, auch nach der Zeitumstellung");
  // scheduled(): ohne Token nichts, mit Token genau ein POST an GitHub.
  const aufrufe = [], echt = globalThis.fetch;
  globalThis.fetch = async (url, o) => { aufrufe.push([url, o]); return new Response(null, { status: 204 }); };
  const warte = []; const ctx = { waitUntil: p => warte.push(p) };
  await worker.scheduled({ scheduledTime: Date.parse("2026-10-24T10:00:03+02:00") }, {}, ctx);
  ok(aufrufe.length === 0, "ohne GITHUB_TOKEN kein Anstoß");
  await worker.scheduled({ scheduledTime: Date.parse("2026-10-24T10:00:03+02:00") }, { GITHUB_TOKEN: "x" }, ctx);
  await worker.scheduled({ scheduledTime: Date.parse("2026-10-24T03:00:00+02:00") }, { GITHUB_TOKEN: "x" }, ctx);
  await Promise.all(warte);
  // Worker liefert Koeppchen- und Länderspiele, sonst nichts.
  const vorher = aufrufe.length;
  const fremd = await worker.fetch(new Request("https://w/?slug=fc-irgendwer-m1-fc-anderer-m1-261018"));
  ok(fremd.status === 400 && aufrufe.length === vorher, "Worker: fremdes Spiel abgelehnt, FuPa nicht gefragt");
  globalThis.fetch = async () => new Response(JSON.stringify({ slug: "luxemburg-m1-estland-m1-261113", homeGoal: 1, awayGoal: 0, section: "LIVE" }), { status: 200 });
  const lux = await worker.fetch(new Request("https://w/?slug=luxemburg-m1-estland-m1-261113"));
  ok(lux.status === 200 && (await lux.json()).hs === 1, "Worker: Länderspiel Luxemburg erlaubt");
  globalThis.fetch = echt;
  {
    // Eine FuPa-Antwort gilt 60 s, auch über Instanzen hinweg (D1), für Handys und Minuten-Lauf gemeinsam.
    const db = new Map(), D1 = { prepare: q => ({ bind: (...v) => ({
      first: async () => /^SELECT/.test(q) ? db.get(v[0]) || null : null,
      run: async () => { if (/^INSERT/.test(q)) db.set(v[0], { t: v[1], roh: v[2] }); } }), run: async () => {} }) };
    let n = 0, stand = 1;
    globalThis.fetch = async () => { n++; return new Response(JSON.stringify({ homeGoal: stand, awayGoal: 0, section: "LIVE" }), { status: 200 }); };
    const t0 = Date.parse("2026-11-01T16:30:00+01:00"), slug = "fc-koeppchen-m1-test-merken";
    const a1 = await fupaSpiel(slug, D1, t0); stand = 2;
    const a2 = await fupaSpiel(slug, D1, t0 + 30e3), a3 = await fupaSpiel(slug, D1, t0 + 59e3);
    ok(n === 1 && a1.f.homeGoal === 1 && a2.f.homeGoal === 1 && a3.t === t0, "FuPa: innerhalb 60 s nur ein Abruf");
    const a4 = await fupaSpiel(slug, D1, t0 + 61e3);
    ok(n === 2 && a4.f.homeGoal === 2 && db.get(slug).t === t0 + 61e3, "FuPa: nach 60 s neu, Stand in D1 geteilt");
    globalThis.fetch = async () => { n++; return new Response("", { status: 500 }); };
    const a5 = await fupaSpiel(slug, D1, t0 + 200e3);
    ok(n === 3 && a5.f.homeGoal === 2, "FuPa nicht erreichbar: letzter Stand bleibt");
  }
  globalThis.fetch = echt;
  ok(aufrufe.length === 1 && aufrufe[0][0].endsWith("/actions/workflows/fussball.yml/dispatches")
     && aufrufe[0][1].method === "POST" && JSON.parse(aufrufe[0][1].body).ref === "main"
     && aufrufe[0][1].headers.authorization === "Bearer x", "mit Token ein POST an GitHub, nachts keiner");
}


// Anonymer Zähler im Worker, mit nachgebautem D1 (nur die drei Anweisungen, die er braucht).
{
  const tage = new Map(), rei = new Map(), arten = new Map(), std = new Map(), ges = new Map(), erste = new Map(), ich = new Map(), fremd = new Map();
  const st = sql => ({ sql, a: [], bind(...a) { this.a = a; return this; },
    async run() {
      if (sql.startsWith("INSERT INTO tage")) { const [t, h] = this.a, x = tage.get(t) || { tag: t, handys: 0, oeffnungen: 0 }; x.handys += h; x.oeffnungen++; tage.set(t, x); }
      if (sql.startsWith("INSERT INTO reiter")) { const k = this.a.join("|"); rei.set(k, (rei.get(k) || 0) + 1); }
      if (sql.startsWith("INSERT INTO arten")) { const [t, a, h] = this.a, k = t + "|" + a, x = arten.get(k) || { tag: t, art: a, handys: 0, oeffnungen: 0 }; x.handys += h; x.oeffnungen++; arten.set(k, x); }
      if (sql.startsWith("INSERT INTO angesehen")) { const k = this.a.join("|"); ges.set(k, (ges.get(k) || 0) + 1); }
      if (sql.startsWith("INSERT INTO erste")) { const k = this.a.join("|"); erste.set(k, (erste.get(k) || 0) + 1); }
      if (sql.startsWith("INSERT INTO ich")) { const k = this.a.join("|"); ich.set(k, (ich.get(k) || 0) + 1); }
      if (sql.startsWith("INSERT INTO fremd")) { const k = this.a.join("|"); fremd.set(k, (fremd.get(k) || 0) + 1); }
      if (sql.startsWith("INSERT INTO stunden")) { const k = this.a.join("|"); std.set(k, (std.get(k) || 0) + 1); }
    },
    async all() {
      if (sql.startsWith("SELECT tag, handys")) return { results: [...tage.values()].sort((a, b) => b.tag.localeCompare(a.tag)) };
      if (sql.startsWith("SELECT tag, art, n FROM erste")) return { results: [...erste].map(([k, n]) => { const [tag, art] = k.split("|"); return { tag, art, n }; }) };
      if (sql.startsWith("SELECT tag, wer")) return { results: [...fremd].map(([k, n]) => { const [tag, wer] = k.split("|"); return { tag, wer, n }; }) };
      if (sql.startsWith("SELECT tag, was")) return { results: [...ich].map(([k, n]) => { const [tag, was] = k.split("|"); return { tag, was, n }; }) };
      if (sql.startsWith("SELECT tag, art")) return { results: [...arten.values()] };
      const quelle = sql.includes("FROM angesehen") ? ges : sql.includes("FROM stunden") ? std : rei;
      return { results: [...quelle].map(([k, n]) => { const [tag, x] = k.split("|"); return { tag, k: sql.includes("FROM stunden") ? +x : x, n }; }) };
    } });
  const db = { prepare: st, batch: async l => { for (const x of l) await x.run(); } };
  await zaehlen(db, "2026-10-24", true, "U13 1", "app", 16);
  await zaehlen(db, "2026-10-24", false, "U13 1", "app", 16);
  await zaehlen(db, "2026-10-24", true, "Seniors 1", "web", 9);
  await zaehlen(db, "2026-10-24", false, "<script>", "boese", 24);
  gleich(tage.get("2026-10-24"), { tag: "2026-10-24", handys: 2, oeffnungen: 4 }, "Zähler: 2 Handys, 4 Öffnungen");
  ok(rei.get("2026-10-24|U13 1") === 2 && rei.size === 2, "Zähler: Reiter gezählt, Unsinn verworfen");
  ok(arten.get("2026-10-24|app").handys === 1 && arten.get("2026-10-24|app").oeffnungen === 2 && arten.get("2026-10-24|web").handys === 1 && arten.size === 2, "Zähler: App/Browser getrennt, Unsinn verworfen");
  ok(std.get("2026-10-24|16") === 2 && std.get("2026-10-24|9") === 1 && std.size === 2, "Zähler: Stunden gezählt, 24 verworfen");
  ok(stundeLux(Date.parse("2026-10-24T14:30:00Z")) === 16 && stundeLux(Date.parse("2026-10-26T14:30:00Z")) === 15 && stundeLux(Date.parse("2026-10-24T22:10:00Z")) === 0, "Stunde in Luxemburger Zeit (Sommer/Winter, Mitternacht 0)");
  await ansehen(db, "2026-10-24", "U9 1"); await ansehen(db, "2026-10-24", "U9 1"); await ansehen(db, "2026-10-24", "<b>");
  ok(ges.get("2026-10-24|U13 1") === 2 && ges.get("2026-10-24|Seniors 1") === 1 && ges.get("2026-10-24|U9 1") === 2 && ges.size === 3, "Angesehen: Öffnen und Umschalten gezählt, Unsinn verworfen");
  ok(rei.size === 2 && tage.get("2026-10-24").oeffnungen === 4, "Umschalten zählt nicht als Öffnung");
  const seite = await zahlenSeite(db);
  ok(/Reiter angesehen[^]*<td>U9 1<\/td><td>2<\/td>/.test(seite), "Zahlen-Seite zeigt angesehene Reiter");
  ok(seite.includes("<td>Sa 24.10.</td><td>2</td><td>4</td><td>1 / 2</td><td>1 / 1</td>") && seite.includes("U13 1") && seite.includes("<td>16 Uhr</td><td>2</td>") && seite.includes("<td>09 Uhr</td><td>1</td>"), "Zahlen-Seite zeigt Tag, App/Browser, Stunden und Reiter");
  // Je Tag getrennt, darunter alle Tage zusammen.
  await zaehlen(db, "2026-10-25", true, "BGL", "web", 20, true);
  await zaehlen(db, "2026-10-25", true, "Woche", "app", 21, true);
  await zaehlen(db, "2026-10-25", false, "Woche", "app", 21);
  const zwei = await zahlenSeite(db);
  const tag25 = zwei.slice(zwei.indexOf("<summary>So 25.10."), zwei.indexOf("<summary>Sa 24.10."));
  const tag24 = zwei.slice(zwei.indexOf("<summary>Sa 24.10."), zwei.indexOf("Alle 30 Tage"));
  const gesamt = zwei.slice(zwei.indexOf("Alle 30 Tage"));
  ok(tag25.includes("<td>20 Uhr</td><td>1</td>") && tag25.includes("<td>BGL</td><td>1</td>") && !tag25.includes("U13 1"), "Zahlen je Tag: 25.10. nur seine Öffnung");
  ok(tag24.includes("<td>16 Uhr</td><td>2</td>") && !tag24.includes("BGL") && tag24.includes("<td>U9 1</td><td>2</td>"), "Zahlen je Tag: 24.10. ohne den 25.");
  ok(gesamt.includes("<td>BGL</td><td>1</td>") && gesamt.includes("<td>U13 1</td><td>2</td>") && gesamt.includes("<td>20 Uhr</td>"), "Zahlen zusammen: beide Tage");
  ok(erste.get("2026-10-25|web") === 1 && erste.get("2026-10-25|app") === 1 && erste.size === 2, "Neue Nutzer: nur mit erst, je App/Browser");
  ok(zwei.includes("<td>So 25.10.</td><td>2</td><td>3</td><td>1 / 2</td><td>1 / 1</td><td>2</td>") && zwei.includes("<td>Sa 24.10.</td><td>2</td><td>4</td><td>1 / 2</td><td>1 / 1</td><td>0</td>") && zwei.includes("<td>1 / 1</td><td>0</td>") && zwei.includes("Öffnungen, 2 neu (App 1, Browser 1)</summary>"), "Zahlen-Seite: Spalte Neu");
  ok(zwei.indexOf("<details open><summary>So 25.10.") > 0 && !zwei.includes("<details open><summary>Sa 24.10."), "neuester Tag aufgeklappt, ältere zu");
  // Eigenes Gerät: nur in der Tabelle ich, nirgends sonst.
  const vorherT = JSON.stringify([...tage, ...rei, ...arten, ...std, ...ges, ...erste]);
  await worker.fetch(new Request("https://w/?zaehle=1&neu=1&erst=1&art=app&reiter=U13%201&ich=1"), { DB: db });
  await worker.fetch(new Request("https://w/?zaehle=1&neu=0&art=app&reiter=U13%201&ich=1"), { DB: db });
  await worker.fetch(new Request("https://w/?angesehen=1&reiter=BGL&ich=1"), { DB: db });
  ok(JSON.stringify([...tage, ...rei, ...arten, ...std, ...ges, ...erste]) === vorherT && ich.size === 2, "Eigenes Gerät: zählt nirgends mit, nur getrennt");
  const mitIch = await zahlenSeite(db);
  ok([...ich.keys()].every(k => k.endsWith("|oeffnung") ? ich.get(k) === 2 : ich.get(k) === 1) && /Eigene Geräte[^]*<td>2<\/td><td>1<\/td>/.test(mitIch), "Zahlen-Seite: eigene Geräte getrennt (2 Öffnungen, 1 Umschalten)");
  // Andere Länder und Roboter: getrennt, nirgends sonst (Scanner am 22.10. aus US, SG, CA, NL).
  const anfrageVon = (q, land, ua = "Mozilla/5.0 (iPhone)", chua = "") => ({ method: "GET", url: "https://w/" + q, cf: land ? { country: land } : undefined,
    headers: new Headers({ "user-agent": ua, ...(chua ? { "sec-ch-ua": chua } : {}) }) });
  const vorherF = JSON.stringify([...tage, ...rei, ...arten, ...std, ...ges, ...erste]);
  await worker.fetch(anfrageVon("?zaehle=1&neu=1&erst=1&art=web&reiter=Woche", "US"), { DB: db });
  await worker.fetch(anfrageVon("?zaehle=1&neu=1&erst=1&art=web&reiter=Woche", "SG"), { DB: db });
  await worker.fetch(anfrageVon("?angesehen=1&reiter=BGL", "US"), { DB: db });
  await worker.fetch(anfrageVon("?zaehle=1&neu=1&erst=1&art=web&reiter=Woche", "LU", "Mozilla/5.0 (iPhone)", '"Chromium";v="138", "HeadlessChrome";v="138"'), { DB: db });
  ok(JSON.stringify([...tage, ...rei, ...arten, ...std, ...ges, ...erste]) === vorherF && fremd.size === 3 && [...fremd.values()].reduce((a, b) => a + b) === 4, "Ausland und Roboter: zählen nicht mit, nur getrennt");
  const f1 = fremd.size;
  await worker.fetch(anfrageVon("?zaehle=1&neu=0&art=app&reiter=U13%201", "LU"), { DB: db });
  await worker.fetch(anfrageVon("?zaehle=1&neu=0&art=app&reiter=U13%201", "FR"), { DB: db });
  await worker.fetch(anfrageVon("?zaehle=1&neu=0&art=app&reiter=U13%201", "BE", "Mozilla/5.0 (Linux; Android 14; Cubot X)"), { DB: db });
  ok(fremd.size === f1 && JSON.stringify([...tage, ...rei, ...arten, ...std, ...ges, ...erste]) !== vorherF, "Luxemburg und Nachbarländer zählen normal");
  const mitFremd = await zahlenSeite(db);
  ok(/Andere Länder und Roboter[^]*US 2, (SG 1, Roboter 1|Roboter 1, SG 1)/.test(mitFremd), "Zahlen-Seite: Ausland und Roboter getrennt mit Land");
  const ohne = await worker.fetch(new Request("https://w/?zaehle=1&neu=1"), {});
  ok(ohne.status === 204, "Zähler ohne D1: still 204");
  ok((await worker.fetch(new Request("https://w/?zahlen"), {})).status === 503, "Zahlen ohne D1: 503 mit Hinweis");
}

// Mitteilungen (Stufe 1): Verschlüsselung, VAPID, Anmelden/Test/Abmelden über den Worker.
{
  const b64 = x => Buffer.from(x).toString("base64url");
  const ua = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const uaPub = new Uint8Array(await crypto.subtle.exportKey("raw", ua.publicKey)), auth = crypto.getRandomValues(new Uint8Array(16));
  const abo = { endpoint: "https://web.push.apple.com/QWER", keys: { p256dh: b64(uaPub), auth: b64(auth) } };
  // Entschlüsseln wie das Handy (RFC 8291) — gegen http_ece einmal von Hand gegengeprüft (21.10.2026).
  const hm = async (k, d) => new Uint8Array(await crypto.subtle.sign("HMAC", await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), d));
  const cat = (...t) => Uint8Array.from(t.flatMap(x => [...x]));
  const te = new TextEncoder();
  const ent = async ct => {
    const salz = ct.slice(0, 16), asPub = ct.slice(21, 86), inh = ct.slice(86);
    const g = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: await crypto.subtle.importKey("raw", asPub, { name: "ECDH", namedCurve: "P-256" }, false, []) }, ua.privateKey, 256));
    const ikm = await hm(await hm(auth, g), cat(te.encode("WebPush: info\0"), uaPub, asPub, [1]));
    const prk = await hm(salz, ikm);
    const k = await crypto.subtle.importKey("raw", (await hm(prk, cat(te.encode("Content-Encoding: aes128gcm\0"), [1]))).slice(0, 16), "AES-GCM", false, ["decrypt"]);
    const klar = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: (await hm(prk, cat(te.encode("Content-Encoding: nonce\0"), [1]))).slice(0, 12) }, k, inh));
    return { text: new TextDecoder().decode(klar.slice(0, -1)), ende: klar.at(-1), rs: new DataView(ct.buffer, ct.byteOffset).getUint32(16), idlen: ct[20] };
  };
  const e1 = await ent(await verschluesseln(abo, '{"titel":"Tor ⚽ für Koeppchen"}'));
  ok(e1.text === '{"titel":"Tor ⚽ für Koeppchen"}' && e1.ende === 2 && e1.rs === 4096 && e1.idlen === 65, "Push: verschlüsselt, Handy kann es lesen (aes128gcm)");
  // Nachgebautes D1 für Schlüssel und Abos.
  const reihen = { k: null, abos: new Map() };
  const db = { prepare: sql => ({ a: [], bind(...a) { this.a = a; return this; },
    async run() {
      if (sql.startsWith("INSERT OR IGNORE INTO push_schluessel") && !reihen.k) reihen.k = { privat: this.a[0], oeffentlich: this.a[1] };
      if (sql.startsWith("INSERT OR REPLACE INTO abos")) reihen.abos.set(this.a[0], { abo: this.a[1] });
      if (sql.startsWith("DELETE FROM abos")) reihen.abos.delete(this.a[0]);
    },
    async first() { return sql.includes("push_schluessel") ? reihen.k : sql.includes("COUNT(*)") ? { n: reihen.abos.size } : reihen.abos.get(this.a[0]) || null; } }) };
  let envX = {};
  const anfrage = (was, body) => worker.fetch(new Request("https://w/?push=" + was, body === undefined ? {} : { method: "POST", body: JSON.stringify(body) }), { DB: db, ...envX });
  const s1 = await (await anfrage("schluessel")).json(), s2 = await (await anfrage("schluessel")).json();
  ok(s1.schluessel?.length === 87 && s1.schluessel === s2.schluessel, "Push: Worker erzeugt Schlüssel einmal und behält ihn");
  ok((await anfrage("anmelden", { ...abo, endpoint: "https://boese.example/x" })).status === 400 && (await anfrage("anmelden", { endpoint: abo.endpoint })).status === 400 && reihen.abos.size === 0, "Push: fremder Dienst oder Abo ohne Schlüssel abgelehnt");
  ok((await anfrage("anmelden", abo)).status === 200 && reihen.abos.has(abo.endpoint), "Push: Abo angemeldet");
  // Höchstzahl (vom Nutzer: schrittweise freigeben): voll → 409, wer schon drin ist, darf sich neu anmelden.
  envX = { MAX_ABOS: "1" };
  const voll = await anfrage("anmelden", { ...abo, endpoint: "https://web.push.apple.com/NEU" });
  ok(voll.status === 409 && (await voll.json()).fehler === "voll" && !reihen.abos.has("https://web.push.apple.com/NEU") && (await anfrage("anmelden", abo)).status === 200, "Push: Höchstzahl erreicht → 409, Angemeldete bleiben");
  envX = {};
  ok((await anfrage("test", { endpoint: "https://web.push.apple.com/unbekannt" })).status === 404, "Push: Test an unbekanntes Gerät → 404");
  const echt = globalThis.fetch, gesendet = [];
  let antwortStatus = 201;
  globalThis.fetch = async (url, o) => { gesendet.push([url, o]); return new Response("", { status: antwortStatus }); };
  const t1 = await anfrage("test", { endpoint: abo.endpoint });
  const [url, o] = gesendet[0] || [];
  const [, jwt, k] = (o?.headers.authorization || "").match(/^vapid t=([^,]+), k=(.+)$/) || [];
  const [h, c, sig] = (jwt || "..").split(".");
  const pub = await crypto.subtle.importKey("raw", Buffer.from(k || "", "base64url"), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]).catch(() => null);
  const echtSig = pub && await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, pub, Buffer.from(sig, "base64url"), te.encode(h + "." + c));
  const nutz = JSON.parse((await ent(new Uint8Array(o.body))).text);
  ok(t1.status === 200 && url === abo.endpoint && o.headers["content-encoding"] === "aes128gcm" && o.headers.ttl && k === s1.schluessel && echtSig
     && JSON.parse(Buffer.from(c, "base64url")).aud === "https://web.push.apple.com" && /Test-Mitteilung/.test(nutz.titel) && /So sehen/.test(nutz.text), "Push: Test-Mitteilung mit gültiger Unterschrift an Apple");
  ok((await anfrage("test", { endpoint: abo.endpoint })).status === 429 && gesendet.length === 1, "Push: zweiter Test innerhalb 20 s gebremst");
  // Abo beim Dienst weg (410) → Worker vergisst es.
  const abo2 = { ...abo, endpoint: "https://web.push.apple.com/WEG" };
  await anfrage("anmelden", abo2); antwortStatus = 410;
  const t3 = await anfrage("test", { endpoint: abo2.endpoint });
  ok(t3.status === 502 && !reihen.abos.has(abo2.endpoint) && reihen.abos.has(abo.endpoint), "Push: 410 vom Dienst → Abo gelöscht");
  globalThis.fetch = echt;
  ok((await anfrage("abmelden", { endpoint: abo.endpoint })).status === 200 && reihen.abos.size === 0, "Push: abgemeldet");
  ok((await worker.fetch(new Request("https://w/?push=schluessel"), {})).status === 503, "Push ohne D1: 503");
  ok((await worker.fetch(new Request("https://w/?push=test"), { DB: db })).status === 405, "Push: Test nur per POST");
  // Service Worker: jede Nachricht wird sichtbar (iOS-Pflicht), Tippen öffnet die App.
  const lauscher = {}, gezeigt = [], geoeffnet = [];
  const selbst = { addEventListener: (n, f) => lauscher[n] = f, skipWaiting() {}, clients: { claim: async () => {}, matchAll: async () => [], openWindow: async u => geoeffnet.push(u) },
    registration: { scope: "https://fckoeppchen.github.io/", showNotification: async (t, o) => gezeigt.push([t, o]) } };
  new Function("self", fs.readFileSync(path.join(hier, "..", "sw.js"), "utf8"))(selbst);
  const warten = []; const ev = x => ({ ...x, waitUntil: p => warten.push(p) });
  const quittungen = [], echtF = globalThis.fetch;
  globalThis.fetch = async u => { quittungen.push(u); return new Response(null, { status: 204 }); };
  lauscher.push(ev({ data: { json: () => ({ titel: "FC Koeppchen", text: "Heute Spiel um 10:00", q: "heute:103" }) } }));
  lauscher.push(ev({ data: null }));
  lauscher.notificationclick(ev({ notification: { close() {}, data: { url: "./" } } }));
  await Promise.all(warten);
  globalThis.fetch = echtF;
  ok(quittungen.length === 1 && quittungen[0] === "https://fckoeppchen.rjtp6r9s9h.workers.dev/?push=angekommen&id=heute%3A103", "Service Worker: meldet „angekommen“ nur für echte Mitteilungen");
  ok(gezeigt.length === 2 && gezeigt[0][1].body === "Heute Spiel um 10:00" && gezeigt[1][0] === "FC Koeppchen" && geoeffnet[0] === "https://fckoeppchen.github.io/", "Service Worker: zeigt jede Mitteilung, Tippen öffnet die App");
  ok(!lauscher.fetch, "Service Worker hat keinen fetch-Teil (lädt und speichert nichts)");
}

// Mitteilungen Stufe 2: Ereignisse aus dem Vergleich alt/neu (kleine, selbst gebaute Daten).
{
  const K = "FC Koeppchen Wormeldange";
  const sp = (id, d, tag, h, a, hs = null, as = null, x = {}) => ({ id, d, tag, h: { id: h[0], n: h[1] }, a: { id: a[0], n: a[1] }, hs, as, gespielt: hs != null, forfait: false, ...x });
  const neuD = () => ({
    saison: { id: 9 }, fupa: { 503: "fc-avenir-beggen-mr1-fc-koeppchen-mr1-261024" },
    teams: [
      { id: 1, ids: [1], n: K + " I", kat: "U13", reiter: "U13 1", klassen: ["k1"], mit: [] },
      { id: 2, ids: [2], n: K + " I", kat: "Seniors", reiter: "Seniors 2", klassen: ["k2"], mit: [] },
      { id: 3, ids: [3], n: K + " I", kat: "U9", reiter: "U9 1", klassen: ["k3"], mit: [] },
    ],
    klassen: {
      k1: { id: "k1", n: "U13 III", typ: "CC", ergebnisse: true, spiele: [
        sp(101, "2026-10-18T10:00:00+02:00", 5, [1, K + " I"], [11, "FC Mondorf"], 3, 1),
        sp(102, "2026-10-18T10:00:00+02:00", 5, [12, "US Hostert"], [13, "FC Remich"], 2, 2),
        sp(103, "2026-10-24T14:00:00+02:00", 6, [14, "AS Hosingen"], [1, K + " I"], null, null, { ort: "Op der Bleech" }) ],
        tabelle: [{ pl: 1, id: 12, n: "US Hostert", sp: 1, pkt: 11 }, { pl: 2, id: 1, n: K + " I", sp: 1, pkt: 10 }] },
      k2: { id: "k2", n: "Promotion", typ: "CC", ergebnisse: true, spiele: [
        sp(201, "2026-10-19T16:00:00+02:00", 7, [2, K + " I"], [21, "FC Titus"], 2, 1),
        sp(503, "2026-10-24T20:00:00+02:00", 8, [22, "Avenir Beggen"], [2, K + " I"]) ],
        tabelle: [{ pl: 3, id: 2, n: K + " I", sp: 1, pkt: 13 }] },
      k3: { id: "k3", n: "U9", typ: "CC", ergebnisse: false, spiele: [
        sp(301, "2026-10-31T10:00:00+01:00", 3, [3, K + " I"], [31, "US Berdorf"]),
        sp(302, "2026-10-25T09:30:00+01:00", 2, [3, K + " I"], [32, "FC Rodange"]) ], tabelle: null },
    },
    bgl: { spiele: [sp(901, "2026-10-19T16:00:00+02:00", 11, [91, "F91 Dudelange"], [92, "Swift Hesperange"], 1, 0)] },
    nati: { spiele: [{ id: 801, d: "2026-11-13T20:45:00+01:00", slug: "luxemburg-m1-estland-m1-261113", h: { id: "Luxemburg", n: "Luxemburg" }, a: { id: "Estland", n: "Estland" }, hs: 2, as: 1, gespielt: true, wett: "UEFA Nations League" }] },
  });
  const neu = neuD(), alt = neuD();
  // Neue Phase (Klasse k4 neu für U13 1) und ein neues Pokalspiel; Seniors-Uhrzeit vorher 00:00.
  neu.klassen.k4 = { id: "k4", n: "U13 Klasse II", typ: "CC", ergebnisse: true, tabelle: null, spiele: [
    sp(401, "2026-11-07T14:00:00+01:00", 1, [1, K + " I"], [41, "FC Mondorf"]), sp(402, "2026-11-14T10:00:00+01:00", 2, [42, "US Hostert"], [1, K + " I"]) ] };
  neu.klassen.k5 = { id: "k5", n: "Coupe U13", typ: "CUP", ergebnisse: true, tabelle: null, spiele: [sp(501, "2026-11-11T18:00:00+01:00", 1, [51, "FC Wiltz"], [1, K + " I"], null, null, { ort: "Wiltz" })] };
  neu.teams[0].klassen = ["k1", "k5", "k4"];
  alt.klassen.k2.spiele[1].d = "2026-10-24T00:00:00+02:00";
  alt.klassen.k1.spiele[1].hs = alt.klassen.k1.spiele[1].as = null;              // Spieltag 5 war noch offen
  alt.klassen.k1.spiele[0].hs = alt.klassen.k1.spiele[0].as = null;              // Tabelle der Tests passt zu den Ergebnissen
  alt.klassen.k1.tabelle = [{ pl: 1, id: 1, n: K + " I", sp: 0, pkt: 9 }, { pl: 2, id: 12, n: "US Hostert", sp: 0, pkt: 8 }];
  alt.klassen.k2.spiele[0].hs = alt.klassen.k2.spiele[0].as = null;              // Seniors-Ergebnis neu
  alt.klassen.k2.tabelle = [{ pl: 3, id: 2, n: K + " I", sp: 0, pkt: 10 }];
  alt.klassen.k3.spiele[0].d = "2026-10-31T00:00:00+01:00";                       // Uhrzeit war offen
  alt.bgl.spiele[0].hs = alt.bgl.spiele[0].as = null;
  alt.nati.spiele[0].hs = alt.nati.spiele[0].as = null;
  const jetzt = Date.parse("2026-10-20T20:00:00+02:00");
  const m = mEreignisse(alt, neu, null, jetzt), id = x => m.ereignisse.find(e => e.id.startsWith(x));
  ok(id("spieltag:k1:5")?.text === "Spieltag 5 komplett: Koeppchen I 3:1 FC Mondorf · alle Ergebnisse in der App" && id("spieltag:k1:5").titel === "U13 1 · Spieltag", "Mitteilung: Spieltag komplett mit unserem Ergebnis, kurzer Titel");
  ok(id("spieltag:k2:7")?.text === "Spieltag 7 komplett: Koeppchen I 2:1 FC Titus · alle Ergebnisse in der App" && id("spieltag:k2:7").titel === "Seniors 2 · Spieltag", "Mitteilung: Spieltag komplett auch bei den Seniors");
  ok(!id("spieltag:k2:8"), "Mitteilung: Seniors-Spieltag ohne alle Ergebnisse nicht komplett");
  ok(id("tabelle:k1")?.text === "Koeppchen I jetzt 2. Platz (vorher 1.) · 10 Punkte" && id("tabelle:k2")?.text === "Koeppchen I jetzt 3. Platz (wie vorher) · 13 Punkte", "Mitteilung: Tabelle mit Platz und vorher");
  {
    // Tabelle erst, wenn sie ganz nachgezogen ist (vom Nutzer, 25.10.2026).
    const halb = neuD(); halb.klassen.k1.tabelle = [{ pl: 1, id: 12, n: "US Hostert", sp: 0, pkt: 8 }, { pl: 2, id: 1, n: K + " I", sp: 1, pkt: 10 }];
    const e1 = mEreignisse(alt, halb, null, jetzt).ereignisse;
    ok(!e1.some(e => e.id.startsWith("tabelle:k1")), "Mitteilung: Tabelle nicht, solange nur unsere Zeile nachgezogen ist");
    const e2 = mEreignisse(halb, neu, null, jetzt).ereignisse.find(e => e.id.startsWith("tabelle:k1"));
    ok(e2?.text === "Koeppchen I jetzt 2. Platz · 10 Punkte", "Mitteilung: Tabelle kommt, sobald die anderen nachgezogen sind (ohne „vorher“)");
    // Im Voraus gewertetes Forfait (Termin in der Zukunft) zählt die FLF erst ab dem Datum — darf nicht blockieren.
    const ff = neuD(); ff.klassen.k1.spiele.push(sp(104, "2026-12-05T00:00:00+01:00", 9, [12, "US Hostert"], [1, K + " I"], 0, 3, { forfait: true }));
    ok(mEreignisse(alt, ff, null, jetzt).ereignisse.some(e => e.id.startsWith("tabelle:k1")), "Mitteilung: Tabelle trotz Forfait im Voraus");
    // Ein Spiel desselben Spieltags fehlt noch (gleicher Tag, FLF noch nicht eingetragen): weder Spieltag noch Tabelle (vom Nutzer, 25.10.2026).
    const fehlt = neuD(); fehlt.klassen.k1.spiele.push(sp(105, "2026-10-18T15:00:00+02:00", 5, [13, "FC Remich"], [14, "AS Hosingen"]));
    const fehltVor = neuD(); fehltVor.klassen.k1.spiele.push({ ...fehlt.klassen.k1.spiele.at(-1) });
    fehltVor.klassen.k1.tabelle = fehltVor.klassen.k1.tabelle.map(x => ({ ...x, sp: 0 }));   // FLF-Tabelle hing noch hinterher
    const ef = [...mEreignisse(alt, fehlt, null, jetzt).ereignisse, ...mEreignisse(fehltVor, fehlt, null, jetzt).ereignisse];
    ok(!ef.some(e => e.id.startsWith("spieltag:k1:5")) && !ef.some(e => e.id.startsWith("tabelle:k1")), "Mitteilung: Spieltag/Tabelle warten auf ein fehlendes Spiel vom selben Wochenende");
    // Kommt es nach, gehen beide raus.
    const ek = mEreignisse(fehlt, (() => { const d = neuD(); d.klassen.k1.spiele.push(sp(105, "2026-10-18T15:00:00+02:00", 5, [13, "FC Remich"], [14, "AS Hosingen"], 1, 1));
      d.klassen.k1.tabelle.push({ pl: 3, id: 13, n: "FC Remich", sp: 2, pkt: 2 }, { pl: 4, id: 14, n: "AS Hosingen", sp: 1, pkt: 1 }); return d; })(), null, jetzt).ereignisse;
    ok(ek.some(e => e.id === "spieltag:k1:5") && ek.some(e => e.id.startsWith("tabelle:k1")), "Mitteilung: nachgetragenes Spiel → Spieltag komplett und Tabelle");
    // Verlegtes Spiel mit altem Datum (über 3 Tage her, ohne Ergebnis) hält nicht auf; steht im Titel.
    const vl = neuD(); vl.klassen.k1.spiele.push(sp(106, "2026-10-16T20:00:00+02:00", 5, [13, "FC Remich"], [14, "AS Hosingen"]));
    const ev = mEreignisse(alt, vl, null, jetzt + 2 * 864e5).ereignisse.find(e => e.id === "spieltag:k1:5");
    ok(ev?.text.startsWith("Spieltag 5 komplett (1 Spiel verlegt): "), "Mitteilung: verlegtes Spiel hält nicht auf, „(1 Spiel verlegt)“");
    // Spiel am Dienstag nach dem Spieltag (Syra – Moutfort) wird abgewartet.
    const st = spieltagStand([sp(1, "2026-10-23T20:00:00+02:00", 6, [1, "a"], [2, "b"], 1, 0), sp(2, "2026-10-24T18:30:00+02:00", 6, [3, "c"], [4, "d"], 2, 2),
      sp(3, "2026-10-27T20:00:00+01:00", 6, [5, "e"], [6, "f"])], 6, Date.parse("2026-10-25T21:00:00+01:00"));
    ok(st && !st.komplett && st.verlegt === 0, "Spieltag: Dienstagsspiel wird abgewartet");
  }
  ok(id("ende:201")?.text === "Koeppchen I 2:1 FC Titus" && id("ende:201").reiter[0] === "Seniors 2", "Mitteilung: Endstand Seniors von der FLF");
  ok(id("zeit:301")?.text === "Uhrzeit steht fest: Sa., 31.10. um 10:00 gegen US Berdorf" && !id("zeit:503"), "Mitteilung: Uhrzeit steht fest nur bei U9/U11, nie bei den Seniors");
  ok(id("phase:k4:1")?.text === "Spielplan U13 Klasse II ist da: 2 Spiele, erstes Sa., 7.11. um 14:00 gegen FC Mondorf" && !id("neu:401"), "Mitteilung: neue Phase als eine Mitteilung");
  ok(id("neu:501")?.titel === "U13 1 · Neues Spiel" && id("neu:501").text === "Mi., 11.11. um 18:00 gegen FC Wiltz · 📍 Wiltz", "Mitteilung: neues Spiel (Pokal)");
  {
    // Nächste Pokalrunde der U13 ohne I/II (gehört zu MIN 1 und MIN 2): einmal, Titel „MIN“, beide Reiter.
    const mk = () => { const d = neuD();
      d.teams[0] = { ...d.teams[0], kurz: "MIN", mit: [5] };
      d.teams.push({ id: 4, ids: [4], n: K + " II", kat: "U13", kurz: "MIN", reiter: "U13 2", klassen: ["k1"], mit: [5] },
                   { id: 5, ids: [5], n: K, kat: "U13", kurz: "MIN", klassen: ["k6"], mit: [] });
      d.klassen.k6 = { id: "k6", n: "Coupe U13", typ: "CUP", ergebnisse: true, tabelle: null, spiele: [] };
      return d; };
    const a2 = mk(), n2 = mk();
    n2.klassen.k6.spiele.push(sp(601, "2026-11-07T14:00:00+01:00", 2, [61, "FC Rodange"], [5, K], null, null, { ort: "Rodange" }));
    const e = mEreignisse(a2, n2, null, jetzt).ereignisse.filter(x => x.id === "neu:601");
    ok(e.length === 1 && e[0].titel === "MIN · Neues Spiel" && e[0].reiter.includes("U13 1") && e[0].reiter.includes("U13 2"),
       "Mitteilung: nächste Pokalrunde ohne I/II einmal als „MIN · Neues Spiel“, für beide Reiter");
  }
  const umgestellt = neuD(), vorUm = neuD(); vorUm.klassen.k3.spiele[0].d = "2026-10-31T11:00:00+01:00";
  ok(!mEreignisse(vorUm, umgestellt, null, jetzt).ereignisse.length, "Mitteilung: geänderte Uhrzeit (11 → 10 Uhr) meldet nichts");
  ok(id("bgl:9:11") && id("nende:801")?.text === "Luxemburg 2:1 Estland", "Mitteilung: BGL-Spieltag und Länderspiel-Endstand");
  ok(!m.ereignisse.some(e => e.reiter.includes("U9 1") && e.art !== "uhrzeit" && e.art !== "heute"), "Mitteilung: U9 nie Ergebnis, Spieltag oder Tabelle");
  ok(!id("heute:") && m.live.length === 0, "Mitteilung: kein Spiel heute → kein Heute Spiel, keine Live-Kandidaten");
  // Ohne Änderung entsteht nichts Neues; ein zweiter Lauf behält die offenen, ohne sie zu doppeln.
  ok(mEreignisse(neu, neu, null, jetzt).ereignisse.length === 0, "Mitteilung: gleicher Stand → nichts");
  const m2 = mEreignisse(alt, neu, m, jetzt + 60e3);
  ok(m2.ereignisse.length === m.ereignisse.length && m2.ereignisse.every((e, i) => e.ab === m.ereignisse[i].ab), "Mitteilung: zweiter Lauf doppelt nichts");
  ok(mEreignisse(neu, neu, m, jetzt + 25 * 3600e3).ereignisse.every(e => e.bis > jetzt + 25 * 3600e3), "Mitteilung: abgelaufene fallen raus");
  // Heute Spiel und Live am Spieltag; Spiel vor 10 Uhr schon am Vorabend um 19 Uhr.
  const sa = mEreignisse(neu, neu, null, Date.parse("2026-10-24T06:00:00+02:00"));
  const fr = mEreignisse(neu, neu, null, Date.parse("2026-10-23T07:10:00+02:00"));
  const h = fr.ereignisse.find(e => e.id === "heute:103"), u9 = sa.ereignisse.find(e => e.id === "heute:302"), s2 = sa.ereignisse.find(e => e.id === "heute:503");
  ok(h?.titel === "U13 1 · Morgen Spiel" && h.text === "14:00 gegen AS Hosingen · 📍 Op der Bleech" && h.ab === Date.parse("2026-10-23T19:00:00+02:00") && h.bis === Date.parse("2026-10-24T14:00:00+02:00"), "Mitteilung: Kinder am Vorabend um 19 Uhr, bis Anpfiff");
  ok(u9?.titel === "U9 1 · Morgen Spiel" && u9.ab === Date.parse("2026-10-24T19:00:00+02:00") && !fr.ereignisse.some(e => e.id === "heute:503"), "Mitteilung: Seniors nicht am Vorabend");
  ok(s2?.titel === "Seniors 2 · Heute Spiel" && s2.ab === Date.parse("2026-10-24T10:00:00+02:00"), "Mitteilung: Seniors am Spieltag um 10 Uhr");
  const spaet = sa.ereignisse.find(e => e.id === "heute:103");
  ok(spaet?.titel === "U13 1 · Heute Spiel" && spaet.ab === Date.parse("2026-10-24T06:00:00+02:00"), "Mitteilung: Kinderspiel erst am Spieltag bekannt → Heute Spiel sofort");
  ok(s2 && sa.live.length === 1 && sa.live[0].slug === "fc-avenir-beggen-mr1-fc-koeppchen-mr1-261024" && sa.live[0].ende === "ende:503" && !sa.live[0].wirHeim, "Mitteilung: Seniors-Spiel heute als Live-Kandidat");
  const mo = mEreignisse(neu, neu, null, Date.parse("2026-10-25T22:30:00+01:00")).ereignisse.find(e => e.id === "woche:2026-10-26");
  ok(mo?.text === "Diese Woche 1 Spiel, davon 1 zu Hause" && mo.ab === umLux("2026-10-26", 10), "Mitteilung: Unsere Woche, ab So 22 Uhr für Montag 10:00 vorbereitet");
  // Kinder als Altersklasse (23.10.2026): gewählt wird „Minimes U13“, jedes Spiel kommt aber als eigene Mitteilung
  // (vom Nutzer, abends: die Zusammenfassung war zu lang). Alte Zusammenfassungen (heute:601+602) werden respektiert.
  {
    const G = { name: "Minimes U13", datei: "minimes-u13.ics" };
    const zwei = (mit3 = false, nur1 = false) => {
      const d = neuD();
      d.teams = [{ id: 1, ids: [1], n: K + " I", kat: "U13", reiter: "U13 1", klassen: ["g1"], mit: [], gruppe: G },
                 { id: 2, ids: [2], n: K + " II", kat: "U13", reiter: "U13 2", klassen: ["g2"], mit: [], gruppe: G },
                 { id: 3, ids: [3], n: K, kat: "Seniors", reiter: "Seniors 1", klassen: ["g3"], mit: [] }];
      d.klassen = {
        g1: { id: "g1", n: "U13 III", typ: "CC", ergebnisse: true, tabelle: null, spiele: [sp(601, "2026-10-24T10:00:00+02:00", 1, [1, K + " I"], [61, "FC Mondorf"], null, null, { ort: "Koeppchen" })] },
        g2: { id: "g2", n: "U13 VI", typ: "CC", ergebnisse: true, tabelle: null, spiele: nur1 ? [] : [sp(602, "2026-10-24T14:00:00+02:00", 1, [62, "US Hostert"], [2, K + " II"])] },
        g3: { id: "g3", n: "Promotion", typ: "CC", ergebnisse: true, tabelle: null, spiele: [sp(604, "2026-10-24T16:00:00+02:00", 1, [3, K], [63, "FC Titus"])] } };
      if (mit3) d.klassen.g2.spiele.push(sp(603, "2026-10-24T17:00:00+02:00", 2, [2, K + " II"], [64, "FC Remich"]));
      return d;
    };
    const fr7 = Date.parse("2026-10-23T07:10:00+02:00"), heuteM = l => l.ereignisse.filter(e => e.art === "heute" && e.id.startsWith("heute:"));
    const a1 = mEreignisse(zwei(), zwei(), null, fr7), z = heuteM(a1);
    const z1 = z.find(e => e.id === "heute:601"), z2 = z.find(e => e.id === "heute:602");
    ok(z.length === 2 && z1.titel === "U13 1 · Morgen Spiel" && z1.text === "10:00 gegen FC Mondorf · 📍 Koeppchen" && z2.titel === "U13 2 · Morgen Spiel"
       && z1.ab === Date.parse("2026-10-23T19:00:00+02:00") && z2.bis === Date.parse("2026-10-24T14:00:00+02:00"), "Mitteilung: zwei U13-Spiele am Vorabend, je eine Mitteilung");
    ok(passtZu({ je: { "Minimes U13": ["heute"] } }, z1) && passtZu({ je: { "Minimes U13": ["heute"] } }, z2) && passtZu({ je: { "U13 2": ["heute"] } }, z2)
       && !passtZu({ je: { "Minimes U13": ["tabelle"] } }, z1), "Mitteilung: Auswahl „Minimes U13“ bekommt beide (alte „U13 2“ auch)");
    // Alte Zusammenfassung, schon fällig (also verschickt): ihre Spiele kommen nicht noch einmal.
    const zus = { id: "heute:601+602", spiele: [601, 602], reiter: ["U13 1", "U13 2", "Minimes U13"], art: "heute", titel: "Minimes U13 · Morgen 2 Spiele", text: "…",
                  ab: Date.parse("2026-10-23T19:00:00+02:00"), bis: Date.parse("2026-10-24T14:00:00+02:00") };
    const sa6 = mEreignisse(zwei(), zwei(), { ereignisse: [zus] }, Date.parse("2026-10-24T06:00:00+02:00"));
    ok(heuteM(sa6).map(e => e.id).sort().join() === "heute:601+602,heute:604", "Mitteilung: nach alter Zusammenfassung nichts doppelt");
    // Noch nicht fällige Zusammenfassung → fällt weg, dafür Einzelmitteilungen.
    const vor19 = mEreignisse(zwei(), zwei(), { ereignisse: [zus] }, Date.parse("2026-10-23T12:00:00+02:00"));
    ok(heuteM(vor19).map(e => e.id).sort().join() === "heute:601,heute:602", "Mitteilung: wartende Zusammenfassung wird zu Einzelmitteilungen");
    const sp3 = heuteM(mEreignisse(zwei(), zwei(true), sa6, Date.parse("2026-10-24T08:00:00+02:00")));
    ok(sp3.map(e => e.id).sort().join() === "heute:601+602,heute:603,heute:604" && sp3.find(e => e.id === "heute:603").titel === "U13 2 · Heute Spiel", "Mitteilung: später dazugekommenes Spiel einzeln");
    const nach19 = heuteM(mEreignisse(zwei(), zwei(), a1, Date.parse("2026-10-24T06:00:00+02:00")));
    ok(nach19.map(e => e.id).sort().join() === "heute:601,heute:602,heute:604" && nach19.find(e => e.id === "heute:601").titel === "U13 1 · Morgen Spiel",
       "Mitteilung: am Spieltag kein zweites Mal (gleiche id), Seniors einzeln");
  }
  // Live im Worker: Ticker erst mit echtem Inhalt; Endstand nach FLF-Reihenfolge (FuPa hier vertauscht).
  const c = sa.live[0], t0 = Date.parse(c.d) + 30 * 60e3;
  ok(liveEreignisse(c, { section: "LIVE", hs: null, as: null, ticker: null, tore: [] }, t0).length === 0, "Live: FuPas automatisches LIVE ohne Tickerer → nichts");
  const tk = liveEreignisse(c, { section: "LIVE", hs: 0, as: 0, ticker: "Paul", tore: [] }, t0)[0];
  ok(tk?.id === "ticker:503" && tk.text === "Heute tickert FuPa das Spiel gegen Avenir Beggen – live in der App.", "Live: Liveticker läuft");
  const hz = liveEreignisse(c, { section: "LIVE", period: "halftime", slug: c.slug, hs: 1, as: 0, ticker: "Paul", tore: [] }, t0).find(e => e.art === "halbzeit");
  ok(hz?.id === "halbzeit:503" && hz.titel === "Seniors 2 · Halbzeit" && hz.text === "Avenir Beggen 1:0 Koeppchen I"
     && !liveEreignisse(c, { section: "LIVE", period: "secondHalf", slug: c.slug, hs: 1, as: 0, ticker: "Paul", tore: [] }, t0).some(e => e.art === "halbzeit")
     && !liveEreignisse(c, { section: "LIVE", period: "halftime", hs: null, as: null, tore: [] }, t0).length, "Live: Halbzeit nur in der Pause und nur mit Stand");
  const en = liveEreignisse({ ...c, wirHeim: true, h: "Koeppchen I", a: "Avenir Beggen" }, { section: "POST", slug: c.slug, hs: 3, as: 1, tore: [] }, t0)[0];
  ok(en?.text === "Koeppchen I 1:3 Avenir Beggen", "Live: Endstand dreht FuPas Zahlen, wenn FuPa Heim/Gast vertauscht");
  ok(liveEreignisse(c, { section: "POST", slug: c.slug, hs: 3, as: 1, tore: [] }, t0)[0].text === "Avenir Beggen 3:1 Koeppchen I", "Live: Endstand ohne Vertauschen");
  // Tore als Mitteilung (vom Nutzer, 23.10.2026): je Tor eine, Stand nach dem Tor in FLF-Reihenfolge, nur frische Tore, keine Karten.
  const hl = [{ id: 11, type: "goal", minute: 42, homeGoal: 1, awayGoal: 0, date: new Date(t0 - 30 * 60e3).toISOString(), primaryRole: { firstName: "Alt", lastName: "Tor" } },
              { id: 12, type: "goal", minute: 50, additionalMinute: 2, homeGoal: 1, awayGoal: 1, date: new Date(t0 - 5 * 60e3).toISOString(), primaryRole: { firstName: "Dario", lastName: "Russo" } },
              { id: 13, type: "card", minute: 55, date: new Date(t0 - 2 * 60e3).toISOString() }];
  const tr = toreRoh({ highlights: hl });
  const torE = l => l.filter(e => e.art === "tor");
  const t1 = torE(liveEreignisse(c, { section: "LIVE", slug: c.slug, hs: 1, as: 1, ticker: "Paul", tore: [], toreRoh: tr }, t0));
  ok(t1.length === 1 && t1[0].id === "tor:503:12" && t1[0].titel === "Seniors 2 · Tor ⚽" && t1[0].text === "Avenir Beggen 1:1 Koeppchen I · 50.+2 Dario Russo",
     "Tor: nur das frische Tor (älter als 20 min nicht), keine Karte, mit Stand und Torschütze");
  const t2 = torE(liveEreignisse({ ...c, wirHeim: true, h: "Koeppchen I", a: "Avenir Beggen" }, { section: "LIVE", slug: c.slug, hs: 1, as: 1, tore: [], toreRoh: [{ ...tr[1], hs: 2, as: 1 }] }, t0));
  ok(t2[0]?.text.startsWith("Koeppchen I 1:2 Avenir Beggen"), "Tor: Stand nach FLF gedreht, wenn FuPa Heim/Gast vertauscht");
  ok(!torE(liveEreignisse(c, { section: "PRE", slug: c.slug, hs: null, as: null, tore: [], toreRoh: tr }, t0)).length, "Tor: vor dem Spiel nichts");
  ok(passtZu({ teams: ["U13 1"], arten: ["heute"] }, h) && !passtZu({ teams: ["U13 2"], arten: ["heute"] }, h) && !passtZu({ teams: ["U13 1"], arten: ["tabelle"] }, h)
     && passtZu({ teams: ["Woche"], arten: [] }, mo) && !passtZu(null, h), "Mitteilung: alte Auswahl (für alle gleich) gilt weiter");
  const tab2 = { ...id("tabelle:k1"), reiter: ["U13 2"] };
  ok(passtZu({ je: { "U13 1": ["heute"], "U13 2": ["tabelle"] } }, h) && passtZu({ je: { "U13 2": ["tabelle"] } }, tab2)
     && !passtZu({ je: { "U13 1": ["tabelle"], "U13 2": ["heute"] } }, h) && !passtZu({ je: { "U13 2": ["heute"] } }, tab2)
     && passtZu({ je: { Woche: ["woche"] } }, mo) && !passtZu({ je: {} }, mo), "Mitteilung: je Mannschaft eigene Arten");

  // Versand im Worker mit nachgebautem D1: gewählt, einmal, nachts nicht, Live aus FuPa.
  const T = { abos: new Map(), gemeldet: new Map(), offen: new Map(), post: new Map(), k: null };
  const db = { prepare: sql => ({ a: [], bind(...a) { this.a = a; return this; },
    async run() {
      const [x, y] = this.a;
      if (sql.startsWith("INSERT OR IGNORE INTO push_schluessel") && !T.k) T.k = { privat: x, oeffentlich: y };
      if (sql.startsWith("INSERT OR IGNORE INTO gemeldet")) T.gemeldet.has(x) || T.gemeldet.set(x, sql.includes("passend") ? { zeit: y, an: 0, passend: this.a[4], text: this.a[5] } : { zeit: y, verpasst: 1 });
      if (sql.startsWith("UPDATE gemeldet SET angekommen")) { const g = T.gemeldet.get(x); if (g) g.angekommen = (g.angekommen || 0) + 1; }
      else if (sql.startsWith("UPDATE gemeldet SET an")) T.gemeldet.get(x).an++;
      if (sql.startsWith("UPDATE gemeldet SET fehler")) { const g = T.gemeldet.get(x); g.fehler = !g.fehler ? y : g.fehler.includes(y) ? g.fehler : g.fehler + ", " + y; }
      if (sql.startsWith("INSERT OR IGNORE INTO offen")) T.offen.has(x) || T.offen.set(x, y);
      if (sql.startsWith("INSERT OR IGNORE INTO postausgang")) { const [id, endpoint, nachricht, bis, prio, zeit] = this.a; T.post.has(id + "|" + endpoint) || T.post.set(id + "|" + endpoint, { id, endpoint, nachricht, bis, prio, zeit }); }
      if (sql.startsWith("DELETE FROM postausgang WHERE id")) T.post.delete(x + "|" + y);
      if (sql.startsWith("DELETE FROM offen")) T.offen.delete(x);
      if (sql.startsWith("DELETE FROM abos")) T.abos.delete(x);
      if (sql.startsWith("DELETE FROM gemeldet")) for (const [k, z] of T.gemeldet) if (z.zeit < x) T.gemeldet.delete(k);
    },
    async first() { if (sql.includes("push_schluessel")) return T.k; if (sql.includes("FROM gemeldet")) return T.gemeldet.has(this.a[0]) ? { id: this.a[0] } : null; return null; },
    async all() {
      if (sql.includes("FROM abos")) return { results: [...T.abos.values()].filter(z => z.wahl) };
      if (sql.includes("FROM offen")) return { results: [...T.offen.values()].map(ereignis => ({ ereignis })) };
      if (sql.includes("FROM postausgang")) return { results: [...T.post.values()].sort((a, b) => (sql.includes("ORDER BY prio") ? a.prio - b.prio : 0) || a.zeit - b.zeit).slice(0, this.a[0]) };
      return { results: [] }; } }),
    batch: async l => { for (const x of l) await x.run(); } };
  const b64 = x => Buffer.from(x).toString("base64url");
  const ua = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const schl = { p256dh: b64(await crypto.subtle.exportKey("raw", ua.publicKey)), auth: b64(crypto.getRandomValues(new Uint8Array(16))) };
  const abo = (e, wahl) => T.abos.set(e, { endpoint: e, abo: JSON.stringify({ endpoint: e, keys: schl }), wahl: wahl && JSON.stringify(wahl) });
  abo("https://web.push.apple.com/U13", { je: { "U13 1": ["heute", "spieltag"], "Seniors 2": ["tabelle"] } });
  abo("https://web.push.apple.com/SEN", { je: { "Seniors 2": ["ticker", "ende"] } });
  abo("https://web.push.apple.com/OHNE", null);
  const echt = globalThis.fetch, an = [];
  let fupa = { slug: c.slug, section: "LIVE", homeGoal: 0, awayGoal: 0, tickerAuthor: { name: "Paul" }, highlights: [] };
  globalThis.fetch = async (url, o) => {
    if (String(url).includes("mitteilungen.json")) return new Response(JSON.stringify(sa));
    if (String(url).includes("api.fupa.net")) return new Response(JSON.stringify(fupa));
    an.push(url.split("/").pop()); return new Response("", { status: 201 });
  };
  const nacht = Date.parse("2026-10-24T06:45:00+02:00"), morgen = Date.parse("2026-10-24T07:30:00+02:00"), spiel = Date.parse("2026-10-24T20:30:00+02:00");
  await mitteilungenSenden(db, nacht);
  ok(an.length === 0, "Versand: nachts nichts (vor 7 Uhr)");
  await mitteilungenSenden(db, morgen);
  ok(an.join() === "U13" && T.gemeldet.has("heute:103") && !T.gemeldet.has("heute:503"), "Versand: Spiel nur an U13, ohne Auswahl nichts, Seniors erst um 10");
  await mitteilungenSenden(db, morgen + 15 * 60e3);
  ok(an.length === 1, "Versand: dasselbe nie zweimal");
  await mitteilungenSenden(db, spiel);
  ok(an.join() === "U13,SEN" && T.gemeldet.has("ticker:503"), "Versand: Liveticker läuft an Seniors 2");
  await mitteilungenSenden(db, spiel + 60e3);
  ok(an.join() === "U13,SEN" && !T.offen.has("ticker:503") && T.gemeldet.get("ticker:503").text.startsWith("Heute tickert FuPa"),
     "Versand: Verschicktes liegt nicht jede Minute neu in der Warteschlange, Text gemerkt");
  fupa = { ...fupa, section: "POST", homeGoal: 1, awayGoal: 4 };
  await mitteilungenSenden(db, Date.parse("2026-10-24T23:00:00+02:00"));   // letzte Minute des Live-Fensters, schon nach 23 Uhr
  ok(an.length === 2 && T.offen.has("ende:503"), "Versand: Endstand nach 23 Uhr wartet");
  ok(tagzeit(Date.parse("2026-10-24T22:59:00+02:00")) && !tagzeit(Date.parse("2026-10-24T23:00:00+02:00")) && !tagzeit(Date.parse("2026-10-26T06:59:00+01:00")) && tagzeit(Date.parse("2026-10-26T07:00:00+01:00")),
     "Versandzeit 7–23 Uhr (vom Nutzer, 23.10.2026), auch im Winter");
  await mitteilungenSenden(db, Date.parse("2026-10-25T07:00:00+01:00"));
  ok(an.join() === "U13,SEN,SEN" && !T.offen.has("ende:503") && T.gemeldet.has("ende:503"), "Versand: Endstand morgens um 7");

  // Postausgang (vom Nutzer, 23.10.2026): viele Handys in kleinen Paketen, Live zuerst, Zähler stimmen.
  T.abos.clear(); T.gemeldet.clear(); T.offen.clear(); T.post.clear();
  for (let i = 0; i < 23; i++) abo("https://web.push.apple.com/W" + i, { je: { Woche: ["woche"], "Seniors 1": ["ende"] } });
  abo("https://fcm.googleapis.com/fcm/send/G1", { je: { Woche: ["woche"] } });
  abo("https://web.push.apple.com/WEG", { je: { Woche: ["woche"] } });
  const p0 = Date.parse("2026-10-26T10:00:00+01:00");
  const wo = { id: "woche:2026-10-26", reiter: ["Woche"], art: "woche", titel: "Unsere Woche", text: "…", ab: p0, bis: p0 + 12 * 3600e3 };
  const endEv = { id: "ende:9", reiter: ["Seniors 1"], art: "ende", titel: "Seniors 1 · Endstand", text: "2:1", ab: p0 + 60e3, bis: p0 + 18 * 3600e3 };
  let datei = { ereignisse: [wo], live: [] };
  const koepfe = new Set(); let gesamt = 0;
  globalThis.fetch = async (url, o) => {
    if (String(url).includes("mitteilungen.json")) return new Response(JSON.stringify(datei));
    gesamt++; koepfe.add(o.headers.authorization);
    return new Response("", { status: String(url).endsWith("/WEG") ? 410 : 201 });
  };
  const r1 = await mitteilungenSenden(db, p0);
  ok(r1.gesendet === PAKET && T.post.size === 25 - PAKET && T.gemeldet.get(wo.id).passend === 25 && T.gemeldet.get(wo.id).an === PAKET,
     `Postausgang: 25 Handys passend, erste Minute nur ${PAKET} verschickt, Rest wartet`);
  ok(mittStatus(wo, T.gemeldet.get(wo.id), p0, T.post.size) === `⏳ wird verschickt: ${PAKET} von 25 Handys, ${25 - PAKET} warten`, "Übersicht: zeigt, dass noch verschickt wird");
  datei = { ereignisse: [wo, endEv], live: [] };
  const vorEnde = gesamt;
  await mitteilungenSenden(db, p0 + 60e3);
  const nachEnde = [...T.post.values()].filter(z => z.id === "ende:9").length;
  ok(nachEnde === 23 - PAKET && T.gemeldet.get("ende:9").an === PAKET && T.gemeldet.get(wo.id).an === PAKET, "Postausgang: Endstand (Live) überholt die Woche");
  for (let m = 2; m < 10 && T.post.size; m++) await mitteilungenSenden(db, p0 + m * 60e3);
  const gw = T.gemeldet.get(wo.id), ge = T.gemeldet.get("ende:9");
  ok(T.post.size === 0 && gw.an === 24 && gw.passend === 25 && gw.fehler === "Handy abgemeldet (410)" && ge.an === 23 && !T.abos.has("https://web.push.apple.com/WEG"),
     "Postausgang: am Ende alle verschickt, 410 gezählt und Abo gelöscht");
  ok(koepfe.size === 2, "VAPID: eine Unterschrift je Push-Dienst (Apple, Google), nicht je Handy");
  ok(mittStatus(wo, gw, p0 + 9 * 60e3, 0).startsWith("✓") && mittStatus(wo, { ...gw, angekommen: 20 }, 0, 0).includes("· angekommen auf 20 · Fehler: Handy abgemeldet (410)"), "Übersicht: verschickt, angekommen und Fehler");
  // Nachts bleibt der Postausgang liegen; abgelaufene Zeilen zählen als Fehler, nicht als verschickt.
  T.post.set(wo.id + "|https://web.push.apple.com/W1", { id: wo.id, endpoint: "https://web.push.apple.com/W1", nachricht: "{}", bis: p0 + 24 * 3600e3, prio: 1, zeit: p0 });
  const vorher2 = gesamt;
  await mitteilungenSenden(db, Date.parse("2026-10-26T23:00:00+01:00"));
  ok(gesamt === vorher2 && T.post.size === 1, "Postausgang: nachts wird nichts verschickt");
  T.post.clear(); T.post.set(wo.id + "|https://web.push.apple.com/W1", { id: wo.id, endpoint: "https://web.push.apple.com/W1", nachricht: "{}", bis: p0 + 60e3, prio: 1, zeit: p0 });
  await mitteilungenSenden(db, p0 + 11 * 60e3);
  ok(gesamt === vorher2 && T.post.size === 0 && T.gemeldet.get(wo.id).fehler.includes("abgelaufen"), "Postausgang: abgelaufen → nicht senden, als Fehler vermerkt");
  const q1 = await worker.fetch(new Request("https://w/?push=angekommen&id=" + encodeURIComponent(wo.id)), { DB: db });
  await worker.fetch(new Request("https://w/?push=angekommen&id=" + encodeURIComponent(wo.id)), { DB: db });
  await worker.fetch(new Request("https://w/?push=angekommen&id=gibts-nicht"), { DB: db });
  ok(q1.status === 204 && T.gemeldet.get(wo.id).angekommen === 2 && !T.gemeldet.has("gibts-nicht"), "Empfangsbestätigung: zählt je Mitteilung, Unbekanntes nicht");
  void vorEnde;
  globalThis.fetch = echt;
  // Übersicht: geplant, verschickt (an wie viele), nachts wartend, verpasst.
  const e0 = { id: "x", titel: "T", ab: Date.parse("2026-10-23T19:00:00+02:00") };
  ok(mittStatus(e0, null, Date.parse("2026-10-23T12:00:00+02:00")) === "⏳ wartet"
     && mittStatus(e0, null, Date.parse("2026-10-23T23:00:00+02:00")) === "🌙 wartet bis 7 Uhr"
     && mittStatus(e0, { zeit: e0.ab, an: 1, passend: 1 }, 0) === "✓ Fr., 23.10., 19:00 an 1 von 1 Handys"
     && mittStatus(e0, { zeit: e0.ab, an: 0, passend: 0 }, 0).includes("niemand hat es angehakt")
     && mittStatus(e0, { zeit: e0.ab, an: 0, passend: 1, fehler: "Push-Dienst 403" }, 0).endsWith("Fehler: Push-Dienst 403")
     && mittStatus(e0, { verpasst: 1, ab: Date.parse("2026-10-23T23:00:00+02:00") }, 0) === "✗ nicht verschickt (abgelaufen, war nachts fällig)", "Übersicht: Stand je Mitteilung");
  const seite = await mitteilungenStand({ prepare: sql => ({ async all() {
    if (sql.includes("FROM abos")) return { results: [{ wahl: '{"je":{"U13 2":["tabelle"],"Seniors 1":["ticker","ende"]}}' }, { wahl: '{"je":{"U13 2":["tabelle","heute"]}}' }] };
    if (sql.includes("FROM gemeldet")) return { results: [{ id: "heute:103", zeit: Date.parse("2026-10-23T19:00:00+02:00"), an: 1, passend: 1, titel: "U13 1 · Morgen Spiel" },
      { id: "ende:9", zeit: Date.parse("2026-10-23T21:58:00+02:00"), an: 1, passend: 1, titel: "Seniors 3 · Endstand", text: "Avenir Beggen 2:2 Koeppchen II" }] };
    return { results: [] }; } }) }, sa, Date.parse("2026-10-24T08:00:00+02:00"));
  ok(seite.includes("2 Handys angemeldet, davon 2 mit Auswahl") && seite.includes("<td>U13 2</td><td class=\"st\">Tabelle 2 · Spiel steht an 1</td>") && seite.includes("Ticker 1 · Endstand 1") && seite.includes("✓ Fr., 23.10., 19:00 an 1 von 1 Handys") && seite.includes("Heute mit Liveticker") && seite.includes("⏳ wartet")
     && seite.includes("Seniors 3 · Endstand<br><small>Avenir Beggen 2:2 Koeppchen II</small>"), "Übersicht: Seite mit Abos, Live und Stand, Text auch nach dem Versand");
}
// BAM (Bambinis U7) aus den FLF-PDFs: Wörter wie aus `pdftotext -bbox`, nachgebaut (vier Spalten).
{
  const zelle = (x, y, t) => { const w = []; for (const teil of t.split(" ")) { w.push({ x0: x, x1: x + teil.length * 3.5, y, t: teil }); x += teil.length * 3.5 + 2; } return w; };
  const zeile = (y, ...zellen) => zellen.flatMap((t, i) => t ? zelle([18, 152, 287, 429][i], y, t) : []);
  const tag = (y0, j, datum, orte, reihen) => [...zelle(18, y0, `Journée ${j} – ${datum}`), ...zeile(y0 + 10, ...orte), ...reihen.flatMap((r, i) => zeile(y0 + 22 + 12 * i, ...r))];
  const seite = [...zelle(152, 14, "Bambinis série 6"),
    ...tag(42, 5, "24/10/26", ["Am Ga (Wormeldange, synth.) 9h30", "Terrain Munsbach (synth.)", "Terrain 2 (Mensdorf, synth.)", "Terrain au Parc (Mertert, synth.)"],
      [["FC Koeppchen Wormeldange I", "FC Munsbach", "ENT Mensdorf/Canach", "Union Mertert-Wasserbillig"],
       ["CS Grevenmacher I", "ENT Biwer/Berbourg II", "Daring Echternach I", "CS Grevenmacher II"],
       ["US Berdorf-Consdorf 01", "US Sandweiler II", "ENT Biwer/Berbourg I", "Daring Echternach II"],
       ["US Moutfort-Medingen", "Victoria Rosport", "FC Koeppchen Wormeldange II", "-"]]),
    ...zelle(152, 160, "Bambinis série 7"),
    ...tag(180, 5, "24/10/26", ["Platz A", "Platz B", "Platz C", "Platz D"], [["A1", "B1", "C1", "D1"], ["A2", "B2", "C2", "D2"], ["A3", "B3", "C3", "D3"], ["A4", "B4", "C4", "D4"]])];
  const kopf = zelle(100, 2, "Coup d'envoi 10.30 hrs, (sauf modification)");
  const t = turniere([[...kopf, ...seite]]);
  ok(t.length === 2 && t[0].ort === "Am Ga (Wormeldange, synth.)" && t[0].zeit === "09:30" && t[0].teams.length === 4 && t[0].serie === 6 && t[0].datum === "2026-10-24",
     "BAM: Turnier BAM 1 mit Platz, eigener Uhrzeit (9h30) und vier Mannschaften");
  ok(t[1].ort === "Terrain 2 (Mensdorf, synth.)" && t[1].zeit === "10:30" && t[1].teams.join("|") === "ENT Mensdorf/Canach|Daring Echternach I|ENT Biwer/Berbourg I|FC Koeppchen Wormeldange II",
     "BAM: BAM 2 in Spalte 3, Uhrzeit aus dem Kopf, fremde Série übergangen");
  const plan = turniere([seite.filter(w => w.t !== "9h30")]);   // Gesamtplan: ohne Uhrzeiten
  ok(plan[0].zeit === null, "BAM: Gesamtplan ohne Uhrzeit");
  const d = bamDaten(plan, t);
  const sp1 = d.klassen["bam-6"].spiele.find(x => x.h.id === 9000701);
  ok(d.teams.map(x => x.reiter).join() === "BAM 1,BAM 2" && sp1.d === "2026-10-24T09:30:00+02:00" && sp1.bam.zeitSicher && sp1.a.n.startsWith("Mini-Spieltag mit CS Grevenmacher I"),
     "BAM: Wochenprogramm schlägt Gesamtplan, Heim in Wormeldange, Gegner im Namen");
  ok(bamDaten(plan, []).klassen["bam-6"].spiele.every(x => x.d.endsWith("T10:30:00+02:00") && !x.bam.zeitSicher), "BAM: ohne Wochenprogramm 10:30, als unsicher markiert");
  ok(isoLux("2026-11-14", "10:30") === "2026-11-14T10:30:00+01:00" && isoLux("2027-03-28", "10:30") === "2027-03-28T10:30:00+02:00", "BAM: Uhrzeit mit Sommer-/Winterzeit");
  ok(zeitAusOrt("Millewiss (Bastendorf) 11h00").zeit === "11:00" && zeitAusOrt("Terrain Ralingen (synth.)").zeit === null, "BAM: Uhrzeit hinter dem Platz");
  // Lieber nichts als etwas Falsches: ein Spieltag mit Koeppchen, dem eine Zeile fehlt, bricht ab.
  const kaputt = seite.filter(w => w.y !== 100);
  let geworfen = false; try { turniere([kaputt]); } catch (e) { geworfen = true; }
  ok(geworfen, "BAM: unklarer Spieltag mit Koeppchen → Abbruch (alter Stand bleibt)");
  ok(pdfListe('x {"url":"https://s3/a.pdf","mime":"application/pdf","name":"20261024 Bambinis.pdf","size":1}').map(p => p.name).join() === "20261024 Bambinis.pdf", "BAM: PDF-Liste aus der Seite");
  // Einhängen und Rückfall: BAM hinter die U9, alter Stand wieder herausziehbar.
  const D0 = { teams: [{ kat: "Seniors", id: 1 }, { kat: "U9", id: 2 }, { kat: "Seniors", id: 3, plus: 1 }], klassen: {} };
  bamDazu(D0, d);
  ok(D0.teams.map(x => x.kat).join() === "Seniors,U9,U7,U7,Seniors" && D0.klassen["bam-6"], "BAM: hinter den U9 eingehängt");
  const zur = bamAus(D0);
  ok(zur.teams.length === 2 && zur.klassen["bam-6"].spiele.length === 2, "BAM: alter Stand für den Rückfall");
  // Mitteilungen für BAM (vom Nutzer, 25.10.2026): „Morgen Spiel“ am Vorabend, „Uhrzeit steht fest“ mit dem Wochenprogramm.
  const altB = { saison: { id: 9 }, ...bamDaten(plan, []) }, neuB = { saison: { id: 9 }, ...bamDaten(plan, t) };
  const freitag = Date.parse("2026-10-23T12:00:00+02:00");
  const mb = mEreignisse(altB, neuB, null, freitag).ereignisse;
  const morgen1 = mb.find(e => e.id === "heute:9202610241"), zeit1 = mb.find(e => e.art === "uhrzeit" && e.id.startsWith("zeit:9202610241"));
  ok(morgen1?.titel === "BAM 1 · Morgen Spiel" && morgen1.text === "09:30 · Mini-Spieltag · 📍 Am Ga (Wormeldange, synth.)" && morgen1.reiter.includes("Bambinis U7"),
     "BAM: Morgen-Mitteilung mit Uhrzeit, Mini-Spieltag und Platz, für die Gruppe Bambinis U7");
  ok(zeit1?.text === "Uhrzeit steht fest: Sa., 24.10. um 09:30 · Mini-Spieltag · 📍 Am Ga (Wormeldange, synth.)", "BAM: Uhrzeit steht fest, sobald das Wochenprogramm da ist");
  ok(!mEreignisse(neuB, neuB, null, freitag).ereignisse.some(e => e.art === "uhrzeit"), "BAM: keine Uhrzeit-Mitteilung, wenn sie schon sicher war");
  ok(mEreignisse(altB, altB, null, freitag).ereignisse.find(e => e.id === "heute:9202610241")?.text.startsWith("10:30 (sauf changement)"), "BAM: ohne Wochenprogramm „sauf changement“");
  bamDazu(D0, null);
  ok(D0.teams.length === 5, "BAM: ohne BAM-Daten bleibt alles, wie es ist");
}
console.log(fehler ? `${fehler} von ${n} Prüfungen fehlgeschlagen` : `alle ${n} Prüfungen grün`);
process.exit(fehler ? 1 : 0);
