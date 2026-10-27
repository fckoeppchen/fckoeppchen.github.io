// Coach (27.10.2026): Worker-Teil mit echter SQLite-Datenbank statt D1 (node:sqlite, ab Node 22.5).
// node test/coach.mjs — Rückgabewert 1 bei Fehler.
import { DatabaseSync } from "node:sqlite";
import worker, { coachSpielPruefen, coachTabellenNeu, codeNorm, neuerCode } from "../tools/cloudflare-worker.js";

let n = 0, fehler = 0;
const ok = (b, was) => { n++; if (!b) { fehler++; console.log("✗", was); } };

function d1(db = new DatabaseSync(":memory:")) {
  return { roh: db, prepare: sql => ({ a: [], bind(...a) { this.a = a; return this; },
    async run() { db.prepare(sql).run(...this.a); return {}; },
    async first() { return db.prepare(sql).get(...this.a) ?? null; },
    async all() { return { results: db.prepare(sql).all(...this.a) }; } }) };
}
const anstoesse = [];
globalThis.fetch = async (url) => { anstoesse.push(String(url)); return new Response(null, { status: 204 }); };
const env = { DB: d1(), GITHUB_TOKEN: "x" };
coachTabellenNeu();
const W = "https://w.example/";
async function post(was, daten, ip = "1.2.3.4") {
  const r = await worker.fetch(new Request(W + "?coach=" + was, { method: "POST", body: JSON.stringify(daten), headers: { "cf-connecting-ip": ip } }), env);
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
}
const sha = async t => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, "0")).join("");

// Codes
ok(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(neuerCode()) && !/[01OIL]/.test(neuerCode()), "Code: Form ABCD-2345 ohne 0/O/1/I/L");
ok(codeNorm(" abcd-2345 ") === "ABCD2345", "Code: Groß/klein, Strich und Leerzeichen egal");

// Eingaben prüfen
const heute = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Luxembourg" });
const tag = n => new Date(Date.parse(heute + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const gut = { reiter: "MIN 1", art: "Turnier", datum: tag(5), zeit: "10:00", ende: "15:00", gegner: "FC Mondercange", heim: false, ort: "Mondercange", bem: "" };
ok(typeof coachSpielPruefen(gut) === "object", "Prüfung: gutes Spiel geht durch");
ok(coachSpielPruefen({ ...gut, gegner: " " }) === "Veranstalter fehlt" && coachSpielPruefen({ ...gut, art: "Freundschaftsspiel", gegner: "" }) === "Gegner fehlt", "Prüfung: Gegner/Veranstalter Pflicht");
ok(coachSpielPruefen({ ...gut, art: "Party" }) === "Art fehlt" && coachSpielPruefen({ ...gut, datum: "morgen" }) === "Datum fehlt" && coachSpielPruefen({ ...gut, zeit: "25:00" }) === "Uhrzeit ungültig", "Prüfung: Art, Datum, Uhrzeit");
ok(coachSpielPruefen({ ...gut, datum: tag(500) }) === "Datum zu weit weg", "Prüfung: Datum über ein Jahr weg");
ok(coachSpielPruefen({ ...gut, zeit: "" }).zeit === null && coachSpielPruefen({ ...gut, gegner: "a\u0000b".padEnd(100, "x") }).gegner.length === 60, "Prüfung: Uhrzeit offen, Länge und Steuerzeichen");

// Ohne Code nichts
ok((await post("liste", { schluessel: "x".repeat(40) })).status === 401, "Fremder Schlüssel: abgelehnt");
ok((await post("einloesen", { code: "FALSCH-CODE" })).status === 404, "Falscher Code: abgelehnt");
ok((await post("einloesen", { code: "irgendwas" })).status === 404, "Chef nur mit dem echten Code");
// Chef: Gerät mit person 0 direkt in der Datenbank (der echte Code steht nirgends).
const chef = "A".repeat(43);
await env.DB.prepare("INSERT INTO coach_geraet (schluessel_hash, trainer_id, seit) VALUES (?1, 0, 'x')").bind(await sha(chef)).run();
ok((await post("ich", { schluessel: chef })).rolle === "chef", "Chef erkannt");

// Verwalter anlegen (nur Chef), Trainer anlegen (Chef und Verwalter)
const v1 = await post("person_neu", { schluessel: chef, name: "Präsident", rolle: "admin", teams: ["MIN 1"] });
ok(v1.ok && /^[A-Z2-9]{4}-/.test(v1.code), "Chef legt Verwalter an");
const praesi = await post("einloesen", { code: v1.code });
ok(praesi.rolle === "admin" && praesi.teams.length === 0, "Verwalter löst ein, Rolle admin, alle Mannschaften");
ok((await post("person_neu", { schluessel: praesi.schluessel, name: "Tiago", rolle: "admin" })).status === 403, "Verwalter darf keine Verwalter anlegen");
const t1 = await post("person_neu", { schluessel: praesi.schluessel, name: "Tom", teams: ["MIN 1", "MIN 2"] });
ok(t1.ok && t1.code, "Verwalter legt Trainer an");
const l0 = await post("liste", { schluessel: praesi.schluessel });
const pTom = l0.personen.find(p => p.name === "Tom"), pPr = l0.personen.find(p => p.name === "Präsident");
ok(pTom.darf && !pPr.darf && pTom.codes.length === 1 && !pTom.codes[0].eingeloest && pTom.geraete === 0, "Liste: Verwalter darf Trainer, nicht Verwalter; Code offen, 0 Geräte");
ok(!JSON.stringify(l0).includes(t1.code) && !JSON.stringify(l0).includes("code_hash"), "Liste: Codes nicht noch einmal abrufbar");
ok((await post("liste", { schluessel: chef })).personen.every(p => p.darf), "Chef darf alle");

// Einlösen, Einmal-Code, weiterer Code fürs zweite Gerät
const tomHandy = await post("einloesen", { code: t1.code.toLowerCase().replace("-", " ") });
ok(tomHandy.schluessel && tomHandy.name === "Tom" && tomHandy.rolle === "trainer" && tomHandy.teams.join() === "MIN 1,MIN 2", "Trainer löst Code ein (klein, mit Leerzeichen)");
const nochmal = await post("einloesen", { code: t1.code });
ok(nochmal.status === 404 && nochmal.fehler === "Dieser Code wurde schon benutzt.", "Code gilt nur einmal");
const c2 = await post("code_neu", { schluessel: praesi.schluessel, id: t1.id });
ok(c2.ok && c2.code && c2.code !== t1.code, "Weiterer Code für ein zweites Gerät");
const tomPC = await post("einloesen", { code: c2.code });
ok(tomPC.schluessel && (await post("ich", { schluessel: tomHandy.schluessel })).name === "Tom", "Zweites Gerät angemeldet, das erste bleibt");
const l1 = (await post("liste", { schluessel: chef })).personen.find(p => p.name === "Tom");
ok(l1.geraete === 2 && l1.codes.every(c => c.eingeloest), "Liste: 2 Geräte, beide Codes genutzt");
// Offenen Code zurückziehen
const c3 = await post("code_neu", { schluessel: chef, id: t1.id });
const c3id = (await post("liste", { schluessel: chef })).personen.find(p => p.name === "Tom").codes.find(c => !c.eingeloest).id;
ok((await post("code_weg", { schluessel: praesi.schluessel, code: c3id })).ok && (await post("einloesen", { code: c3.code })).status === 404, "Offenen Code zurückziehen: gilt nicht mehr");
ok((await post("code_neu", { schluessel: tomHandy.schluessel, id: t1.id })).status === 403, "Trainer darf keine Codes machen");
ok((await post("code_neu", { schluessel: praesi.schluessel, id: v1.id })).status === 403, "Verwalter darf keine Codes für Verwalter machen");

// Mannschaften ändern
ok((await post("person_aendern", { schluessel: praesi.schluessel, id: t1.id, teams: ["MIN 1"] })).ok
   && (await post("ich", { schluessel: tomPC.schluessel })).teams.join() === "MIN 1", "Mannschaften ändern wirkt sofort");

// Spiele
anstoesse.length = 0;
const s1 = await post("speichern", { schluessel: tomHandy.schluessel, spiel: gut });
ok(s1.ok && anstoesse.some(u => u.includes("/dispatches")), "Trainer speichert, Abruf sofort angestoßen");
ok((await post("speichern", { schluessel: tomHandy.schluessel, spiel: { ...gut, reiter: "MIN 2" } })).status === 403, "Nicht mehr seine Mannschaft: abgelehnt");
const t2 = await post("person_neu", { schluessel: chef, name: "Anna", teams: ["SCO"] });
const anna = await post("einloesen", { code: t2.code });
const s3 = await post("speichern", { schluessel: anna.schluessel, spiel: { ...gut, reiter: "SCO", art: "Freundschaftsspiel", gegner: "Remich", heim: true, zeit: "" } });
ok(s3.ok, "Zweite Trainerin speichert für ihre Mannschaft");
ok((await post("speichern", { schluessel: anna.schluessel, spiel: { ...gut, reiter: "SCO", id: s1.id } })).status === 403, "Fremdes Spiel ändern: abgelehnt");
ok((await post("loeschen", { schluessel: anna.schluessel, id: s1.id })).status === 403, "Fremdes Spiel löschen: abgelehnt");
const lt = await post("liste", { schluessel: tomPC.schluessel });
ok(lt.spiele.length === 1 && lt.spiele[0].id === s1.id && !lt.spiele[0].von && !lt.personen && !lt.verlauf, "Trainer sieht nur eigene Spiele, keine Personen, keinen Verlauf");
const la = await post("liste", { schluessel: praesi.schluessel });
ok(la.spiele.length === 2 && la.spiele.every(s => s.von), "Verwalter sieht alle Spiele mit Namen");
ok((await post("speichern", { schluessel: praesi.schluessel, spiel: { ...gut, reiter: "SCO", id: s3.id, gegner: "Remich 2", zeit: "" } })).ok, "Verwalter ändert fremdes Spiel");
const ab = await post("speichern", { schluessel: tomHandy.schluessel, spiel: { ...gut, id: s1.id, abgesagt: true } });
ok(ab.ok && ab.id === s1.id, "Absagen ändert dasselbe Spiel");
const pub = await (await worker.fetch(new Request(W + "?coach=spiele"), env)).json();
ok(pub.spiele.length === 2 && !/Tom|Anna|Präsident/.test(JSON.stringify(pub)) && pub.spiele.find(s => s.id === s1.id).abgesagt && pub.spiele.every(s => s.geaendert), "Öffentlich: alle Spiele, abgesagt, mit Änderungszeit, ohne Namen");
ok(pub.spiele.find(s => s.id === s3.id).zeit === null, "Öffentlich: Uhrzeit offen = null");

// Verlauf
const vl = (await post("liste", { schluessel: chef })).verlauf.map(v => v.wer + ": " + v.was);
ok(vl.some(v => v.startsWith("Laurent: Verwalter Präsident angelegt")) && vl.some(v => v === "Präsident: Trainer Tom angelegt (MIN 1, MIN 2)")
   && vl.some(v => v.startsWith("Tom: abgesagt: MIN 1")) && vl.some(v => v.startsWith("Präsident: geändert: SCO")) && vl.some(v => v === "Tom: Code eingelöst (neues Gerät)"), "Verlauf: wer hat wann was gemacht");

// Anstoß höchstens einmal je Minute, der Rest im nächsten Takt
anstoesse.length = 0;
await post("speichern", { schluessel: tomHandy.schluessel, spiel: gut });
await post("speichern", { schluessel: tomHandy.schluessel, spiel: gut });
ok(anstoesse.length === 0, "Zweimal schnell hintereinander: kein zweiter Anstoß sofort");
await env.DB.prepare("UPDATE coach_stand SET v = '0' WHERE k = 'anstoss'").run();
await worker.scheduled({ scheduledTime: Date.parse("2026-10-27T10:03:00Z") }, env, { waitUntil: p => p });
await new Promise(r => setTimeout(r, 50));
ok(anstoesse.filter(u => u.includes("/dispatches")).length === 1, "Nächster Takt holt den Anstoß nach");

// Alle Geräte abmelden, entfernen
ok((await post("geraete_weg", { schluessel: praesi.schluessel, id: t1.id })).ok && (await post("ich", { schluessel: tomHandy.schluessel })).status === 401 && (await post("ich", { schluessel: tomPC.schluessel })).status === 401, "Alle Geräte abmelden: beide raus");
const c4 = await post("code_neu", { schluessel: praesi.schluessel, id: t1.id });
const tom3 = await post("einloesen", { code: c4.code });
ok(tom3.name === "Tom" && (await post("liste", { schluessel: tom3.schluessel })).spiele.length === 3, "Neuer Code: wieder drin, sieht seine Spiele");
ok((await post("person_weg", { schluessel: praesi.schluessel, id: v1.id })).status === 403, "Verwalter darf Verwalter nicht entfernen");
ok((await post("person_weg", { schluessel: praesi.schluessel, id: t1.id })).ok && (await post("ich", { schluessel: tom3.schluessel })).status === 401, "Trainer entfernt: abgemeldet");
const nachher = await post("liste", { schluessel: chef });
ok(!nachher.personen.some(p => p.name === "Tom") && nachher.spiele.filter(s => s.von === "Tom").length === 3, "Entfernt: Person weg, ihre Spiele bleiben");
ok((await post("person_weg", { schluessel: chef, id: v1.id })).ok && (await post("ich", { schluessel: praesi.schluessel })).status === 401, "Chef entfernt Verwalter");
// Abmelden
ok((await post("abmelden", { schluessel: anna.schluessel })).ok && (await post("ich", { schluessel: anna.schluessel })).status === 401, "Abmelden: Schlüssel gilt nicht mehr");
// Durchprobieren
for (let i = 0; i < 10; i++) await post("einloesen", { code: "XXXX-XXX" + i }, "9.9.9.9");
ok((await post("einloesen", { code: t2.code }, "9.9.9.9")).status === 429, "Nach 10 falschen Codes: Pause");

// Umzug aus Stufe 1: Code stand in coach_trainer → wandert nach coach_code
{
  const db = new DatabaseSync(":memory:");
  db.exec("CREATE TABLE coach_trainer (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, teams TEXT NOT NULL, rolle TEXT NOT NULL DEFAULT 'trainer', code_hash TEXT, eingeloest TEXT, gesperrt INTEGER NOT NULL DEFAULT 0, seit TEXT NOT NULL)");
  db.prepare("INSERT INTO coach_trainer (name, teams, code_hash, seit) VALUES ('Alt', '[\"MIN 1\"]', ?, 'x')").run(await sha("ABCD2345"));
  env.DB = d1(db); coachTabellenNeu();
  const alt = await post("einloesen", { code: "ABCD-2345" }, "5.5.5.5");
  ok(alt.name === "Alt", "Stufe-1-Code gilt nach dem Umzug weiter");
  ok(db.prepare("SELECT code_hash FROM coach_trainer").get().code_hash === null && db.prepare("SELECT COUNT(*) AS n FROM coach_code").get().n === 1, "Umzug nur einmal");
}

console.log(fehler ? `${fehler} von ${n} Prüfungen fehlgeschlagen` : `alle ${n} Prüfungen grün`);
process.exit(fehler ? 1 : 0);
