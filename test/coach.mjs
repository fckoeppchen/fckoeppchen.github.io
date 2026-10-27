// Coach, Stufe 1 (27.10.2026): Worker-Teil mit echter SQLite-Datenbank statt D1 (node:sqlite, ab Node 22.5).
// node test/coach.mjs — Rückgabewert 1 bei Fehler.
import { DatabaseSync } from "node:sqlite";
import worker, { coachSpielPruefen, coachTabellenNeu, codeNorm, neuerCode } from "../tools/cloudflare-worker.js";

let n = 0, fehler = 0;
const ok = (b, was) => { n++; if (!b) { fehler++; console.log("✗", was); } };

function d1() {
  const db = new DatabaseSync(":memory:");
  return { prepare: sql => ({ a: [], bind(...a) { this.a = a; return this; },
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

// Verwalter (Code nur hier im Test durch einen Ersatz: der echte Hash passt zu keinem Testcode)
const echt = await post("einloesen", { code: "irgendwas" });
ok(echt.status === 404, "Verwalter nur mit dem echten Code");
// Für die weiteren Tests ein Verwalter direkt in der Datenbank (Gerät mit trainer_id 0).
const sha = async t => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, "0")).join("");
const adminS = "A".repeat(43);
await env.DB.prepare("INSERT INTO coach_geraet (schluessel_hash, trainer_id, seit) VALUES (?1, 0, 'x')").bind(await sha(adminS)).run();
const ich = await post("ich", { schluessel: adminS });
ok(ich.rolle === "admin", "Verwalter erkannt");

// Trainer anlegen, Einmal-Code
const t1 = await post("trainer_neu", { schluessel: adminS, name: "Tom", teams: ["MIN 1", "MIN 2"] });
ok(t1.ok && /^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(t1.code), "Trainer angelegt, Code einmal angezeigt");
const liste0 = await post("liste", { schluessel: adminS });
ok(liste0.trainer.length === 1 && !liste0.trainer[0].eingeloest && !JSON.stringify(liste0).includes(t1.code), "Liste: noch nicht eingelöst, Code nicht noch einmal abrufbar");
const tom = await post("einloesen", { code: t1.code.toLowerCase().replace("-", " ") });
ok(tom.schluessel && tom.name === "Tom" && tom.rolle === "trainer" && tom.teams.join() === "MIN 1,MIN 2", "Trainer löst Code ein (klein, mit Leerzeichen)");
const nochmal = await post("einloesen", { code: t1.code });
ok(nochmal.status === 404 && nochmal.fehler === "Dieser Code wurde schon benutzt.", "Code gilt nur einmal");
ok((await post("liste", { schluessel: adminS })).trainer[0].eingeloest, "Verwalter sieht: Code genutzt");
const nicht = await post("trainer_neu", { schluessel: tom.schluessel, name: "X", teams: ["MIN 1"] });
ok(nicht.status === 403, "Trainer darf keine Trainer anlegen");

// Spiele
anstoesse.length = 0;
const s1 = await post("speichern", { schluessel: tom.schluessel, spiel: gut });
ok(s1.ok && anstoesse.some(u => u.includes("/dispatches")), "Trainer speichert, Abruf sofort angestoßen");
const s2 = await post("speichern", { schluessel: tom.schluessel, spiel: { ...gut, reiter: "SCO" } });
ok(s2.status === 403, "Fremde Mannschaft: abgelehnt");
const t2 = await post("trainer_neu", { schluessel: adminS, name: "Anna", teams: ["SCO"] });
const anna = await post("einloesen", { code: t2.code });
const s3 = await post("speichern", { schluessel: anna.schluessel, spiel: { ...gut, reiter: "SCO", art: "Freundschaftsspiel", gegner: "Remich", heim: true, zeit: "" } });
ok(s3.ok, "Zweite Trainerin speichert für ihre Mannschaft");
ok((await post("speichern", { schluessel: anna.schluessel, spiel: { ...gut, reiter: "SCO", id: s1.id } })).status === 403, "Fremdes Spiel ändern: abgelehnt");
ok((await post("loeschen", { schluessel: anna.schluessel, id: s1.id })).status === 403, "Fremdes Spiel löschen: abgelehnt");
const lt = await post("liste", { schluessel: tom.schluessel });
ok(lt.spiele.length === 1 && lt.spiele[0].id === s1.id && !lt.spiele[0].von && !lt.trainer, "Trainer sieht nur eigene Spiele, keine Trainerliste");
const la = await post("liste", { schluessel: adminS });
ok(la.spiele.length === 2 && la.spiele.every(s => s.von), "Verwalter sieht alle Spiele mit Namen");
// Absagen = speichern mit abgesagt
const ab = await post("speichern", { schluessel: tom.schluessel, spiel: { ...gut, id: s1.id, abgesagt: true } });
ok(ab.ok && ab.id === s1.id, "Absagen ändert dasselbe Spiel");
// Öffentliche Liste ohne Namen
const pub = await (await worker.fetch(new Request(W + "?coach=spiele"), env)).json();
ok(pub.spiele.length === 2 && !JSON.stringify(pub).includes("Tom") && !JSON.stringify(pub).includes("Anna") && pub.spiele.find(s => s.id === s1.id).abgesagt, "Öffentlich: alle Spiele, abgesagt markiert, ohne Trainernamen");
ok(pub.spiele.find(s => s.id === s3.id).zeit === null, "Öffentlich: Uhrzeit offen = null");
// Verwalter ändert fremdes Spiel
ok((await post("speichern", { schluessel: adminS, spiel: { ...gut, reiter: "SCO", id: s3.id, gegner: "Remich 2" } })).ok, "Verwalter darf fremde Spiele ändern");
ok((await post("loeschen", { schluessel: tom.schluessel, id: s1.id })).ok, "Trainer löscht eigenes Spiel");
ok((await (await worker.fetch(new Request(W + "?coach=spiele"), env)).json()).spiele.length === 1, "Gelöscht ist weg");

// Anstoß höchstens einmal je Minute, der Rest im nächsten Takt
anstoesse.length = 0;
await post("speichern", { schluessel: tom.schluessel, spiel: gut });
await post("speichern", { schluessel: tom.schluessel, spiel: gut });
ok(anstoesse.length === 0, "Zweimal schnell hintereinander: kein zweiter Anstoß sofort");
await env.DB.prepare("UPDATE coach_stand SET v = '0' WHERE k = 'anstoss'").run();
await worker.scheduled({ scheduledTime: Date.parse("2026-10-27T10:03:00Z") }, env, { waitUntil: p => p });
await new Promise(r => setTimeout(r, 50));
ok(anstoesse.filter(u => u.includes("/dispatches")).length === 1, "Nächster Takt holt den Anstoß nach");

// Neuer Code: altes Handy raus
const neuC = await post("trainer_code", { schluessel: adminS, id: t1.id });
ok(neuC.code && neuC.code !== t1.code && (await post("ich", { schluessel: tom.schluessel })).status === 401, "Neuer Code: altes Handy abgemeldet");
const tom2 = await post("einloesen", { code: neuC.code });
ok(tom2.name === "Tom" && (await post("liste", { schluessel: tom2.schluessel })).spiele.length === 2, "Neues Handy sieht seine Spiele wieder");
// Gesperrt (Stufe 2 baut den Knopf; die Prüfung steht schon)
await env.DB.prepare("UPDATE coach_trainer SET gesperrt = 1 WHERE id = ?1").bind(t1.id).run();
ok((await post("ich", { schluessel: tom2.schluessel })).status === 401, "Gesperrt: abgemeldet");
// Abmelden
ok((await post("abmelden", { schluessel: anna.schluessel })).ok && (await post("ich", { schluessel: anna.schluessel })).status === 401, "Abmelden: Schlüssel gilt nicht mehr");
// Durchprobieren
for (let i = 0; i < 10; i++) await post("einloesen", { code: "XXXX-XXX" + i }, "9.9.9.9");
ok((await post("einloesen", { code: t2.code }, "9.9.9.9")).status === 429, "Nach 10 falschen Codes: Pause");

console.log(fehler ? `${fehler} von ${n} Prüfungen fehlgeschlagen` : `alle ${n} Prüfungen grün`);
process.exit(fehler ? 1 : 0);
