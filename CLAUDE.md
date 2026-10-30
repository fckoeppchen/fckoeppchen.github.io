# fckoeppchen.github.io — App „FC Koeppchen“

Nutzer: Laurent (Luxemburg). Deutsch, Du-Form, einfache Sprache, Widerspruch erwünscht. Änderungen
direkt auf `main`, keine Pull Requests. Alles zur App steht in dieser Datei und in `IDEEN.md`.

## Umzug (22.10.2026, vom Nutzer)

Die App lag bis zum 22.10.2026 als `fussball.html` im Repo `strakekine/panini-wm-2026`
(Adresse `strakekine.github.io/panini-wm-2026/fussball.html`). Anlass: Der Verein will die App im
eigenen Newschannel verteilen, die alte Adresse war zu lang. Neu: GitHub-**Organisation**
`fckoeppchen` (kein zweites Konto — GitHub erlaubt nur eines je Person), Repo
`fckoeppchen.github.io`, Adresse **https://fckoeppchen.github.io/**. Kopie der alten App, dabei geändert:

- Dateinamen: `fussball.html` → **`index.html`**, `fussball-sw.js` → **`sw.js`** (Scope `./`),
  `fussball.webmanifest` → **`app.webmanifest`**, `IDEEN-fussball.md` → **`IDEEN.md`**.
  In den Abschnitten unten (aus der alten CLAUDE.md übernommen) stehen noch die alten Namen —
  gemeint sind diese Dateien.
- **Home-Icon** in Vereinsfarben (vom Verein: Logo auf weiß-schwarz-grünen Streifen, Vorlage als Bild
  vom Nutzer): `apple-touch-icon` (180 px) und `bilder/icon-192.png`, `-512.png` (purpose `any`), dazu für Android `bilder/icon-maskable-192.png`,
  `-512.png` (purpose `maskable`): Logo auf 58 % verkleinert, damit Androids runde Maske die Streifen
  stehen lässt und das Logo nicht anschneidet (Vorschau mit 80- und 72-%-Kreis geprüft). **Erstes Android-Gerät, 23.10.2026:** installierte App, der Launcher nahm das `any`-Symbol rund ausgeschnitten (Logo fast voll, rechts schmaler schwarz-grüner Rand), nicht das maskable — vom Nutzer: „es ist gut so“, nicht ändern. In der App selbst
  steht weiter das Logo ohne Streifen (`LOGO` kommt jetzt aus `rel="icon"`, nicht mehr aus dem Home-Icon).
- **Eigener Worker „fckoeppchen“** (`https://fckoeppchen.rjtp6r9s9h.workers.dev/`), eigene D1-Datenbank
  → Statistik und Mitteilungen fangen neu an (vom Nutzer: „komplett neue Statistik“). Stößt dieses
  Repo an (`REPO`), liest `data/mitteilungen.json` von hier. Der alte Worker `koeppchen-live` bleibt
  unverändert für die alte App.
- **Beide 5×-Schalter fragen beim Einschalten nach einem Code** (vom Nutzer genannt; steht bewusst nicht hier, das Repo ist öffentlich), Groß/klein
  egal. Steht nur als SHA-256 in der Datei (`CODE_HASH`, `codeStimmt`) — hält Neugierige ab, kein echter
  Schutz (dem Nutzer so gesagt, „ja“). Ausschalten ohne Code. Die Statistik-Seite `?zahlen` bleibt ohne
  Code (vom Nutzer). **Zweiter Code nur fürs Logo/Mitteilungen** (vom Nutzer, 23.10.2026, Fassung neu k, für 1–2 Tester;
  `TEST_HASH`, `codeStimmt(frage, true)`): schaltet nur die Mitteilungen ein, **nicht** „eigenes Gerät“ in der Statistik —
  das bleibt beim ersten Code (Tester zählen also normal mit). Wortlaut beider Codes nur beim Nutzer, nie in eine Datei.
- Fassungen dieser Kopie heißen „… neu a“, „… neu b“ usw.
- **Fassung neu b** (vom Nutzer, 22.10.): Kalender-Knopf (`.kal`) und Mannschafts-Schilder in „Unsere Woche“
  (`.pill.wteam`) grün (`--accentT`, dunkles Türkis aus dem Logo) statt schwarz; Fußzeile „Gemacht von
  Laurent R. für den FC Koeppchen“ (5×-Schalter `#von` unverändert).
- **Koeppi** (Maskottchen, vom Verein angeregt, Plan in `IDEEN.md`, Fassung neu c, 22.10.2026): Bilder vom Nutzer
  (freigestellt) in `bilder/koeppi/`, verkleinert (160 px hoch, 128 Farben, 7–9 KB) als `bilder/k-<name>.png`,
  angezeigt 64×72 (`koeppiBild`, `koeppiZeile`). **Nur Kinder-Reiter** (`istKinder`: U9, U11, U13, U15) und
  „Unsere Woche“; nie Seniors, BGL, Roude Léiw, nie im Live-Kasten (vom Nutzer). Vortag: neuer Kasten
  „Morgen Spieltag! ⚽“ (`spieltagMorgen`, `tagNach`, `morgenHtml`) mit Fuß-auf-Ball + „Trinkflasche nicht
  vergessen! 😉“; Spieltag vor Anpfiff (und Uhrzeit offen) dasselbe im Heute-Kasten; ab Countdown
  Trinkflasche + „Viel Spaß und viel Glück! 💪“, im Spiel „Daumen drücken! 🤞“ (diese zwei Sätze von Claude,
  dem Nutzer gesagt). Streifen über den Ergebnissen (`nachDemSpiel`): U13/U15 nur nach Sieg „Gewonnen! 🎉
  7:1 gegen …“, U9/U11 nach jedem Spiel „Super gemacht, U9 1! 💪 Nächstes Spiel: …“ — höchstens 7 Tage
  (Claudes Grenze, sonst stünde er die Winterpause durch), weg sobald Vortag/Spieltag des nächsten. Ruhiger
  Koeppi rechts im Kasten „neue Klasse noch nicht eingetragen“ und bei „Noch keine Termine“. Woche-Kopf:
  Fahne, nach dem Wochenende bei mehr Siegen als Niederlagen Ball-und-Faust, ohne Spiele ruhig. Tests:
  Logik mit eigenen kleinen Daten, Gegenprobe; Browser mit gestellter Uhr (alle Fälle, Seniors ohne Koeppi).
- **Fassung neu e — Wunsch des Vereins** (22.10.2026): **keine Ergebnisse hervorheben**, Kinder nicht für Siege
  loben, keine Bilanz. Darum: Streifen nach **jedem** Kinderspiel (U9–U15) gleich, „Super gemacht, U13 1! 💪“ +
  ein Spruch des Vereins (`SPRUECHE`, reihum: Zahl der gespielten Spiele + Versatz je Reiter (feste Reihenfolge der 7 Jugend-Reiter), vom Nutzer neu h — nächstes Spiel = nächster Spruch, Reiter fangen verschieden an; seit neu i 8 Sprüche — 5 vom Verein, 3 vom Nutzer aus Claudes Vorschlägen; jeder Reiter startet bei einem eigenen) + „Nächstes Spiel: …“; kein „Gewonnen“, kein
  Ergebnis. „Unsere Woche“: **Fahnen-Koeppi**, Woche ohne Spiele der ruhige (vom Nutzer, neu g). **Es geht nur um Koeppi** (vom Nutzer,
  Fassung neu f): Wochenbilanz-Text, farbige Ergebnisse, „Aufstieg … 🎉“, Mitteilungen bleiben wie sie waren
  — damit waren nur diese drei Punkte gemeint; die **Wochenbilanz ist raus** (vom Verein „ohne Bilanz“; in neu f irrtümlich zurückgeholt, seit 23.10. neu c wieder weg, Kopf immer „n Spiele, davon m zu Hause“; `wocheBilanz` nur noch im Test). **Neu f, Bilder getauscht** (vom Nutzer): Morgen-Kasten
  `trinkflasche.png`, Heute vor Anpfiff `fuss-auf-ball.png`, ab Countdown und im Spiel `ball-faust.png`.
- **Motto #mirvunderkoeppchen** (vom Nutzer, 23.10.2026, Fassung 23.10. neu a): grüne Zeile (`MOTTO`, `.motto`) unten im
  „Morgen Spieltag!“- und „Heute Spieltag!“-Kasten aller Mannschaften (auch Seniors), nicht bei Roude Léiw.
  Bei den Kindern (neu d, vom Nutzer) direkt unter dem Koeppi-Satz statt ganz unten.
  „Unsere Woche“ (neu b, vom Nutzer gewählt): im Wochen-Kopf unter „n Spiele, davon m zu Hause“ neben dem Koeppi.
- **„FuPa“ im Heute-Kasten als Link** (vom Nutzer, 23.10.2026, Fassung 23.10. neu e): Hinweis „Liveticker, wenn
  verfügbar — sobald bei FuPa jemand tickert“ verlinkt FuPa schon vor dem Ticker (`fupaLink`): Spiel per
  `D.fupa[id]` bzw. `live.json`, Roude Léiw per `sp.slug`, sonst `fupa.net/club/fc-koeppchen`.
- **Gemeinsamer Kalender je Kinder-Altersklasse** (vom Nutzer, 23.10.2026, Fassung 23.10. neu f): die Kinder werden
  jede Woche neu auf 1/2 verteilt — getrennte Abos würden sie auseinanderdividieren. U13 1+2 → „Minimes U13“
  (`minimes-u13.ics`), U11 → „Poussins U11“, U9 → „Pupilles U9“ (Schreibweise vom Nutzer, `GRUPPEN` in
  `tools/fussball.mjs`, `t.gruppe` in der JSON, `icsGruppe`). Beide Reiter zeigen denselben Knopf „📅 Minimes U13
  im Kalender abonnieren“; im Kalender bleibt „Koeppchen U13 1/2“ im Titel (vom Nutzer: man muss wissen, wann
  welche spielt), Pokal einmal. Reiter bleiben getrennt. Einzel-`.ics` (u13-1 …) werden weiter geschrieben
  (bestehende Abos), sind aber nicht mehr verlinkt. Seniors unverändert. **Neu g** (vom Nutzer): auch U15 →
  „Scolaires U15“; Kinder-Kalender heißen **immer** nach der Altersklasse, auch bei nur einer Mannschaft — so bleibt
  das Abo gültig, wenn eine Mannschaft dazukommt oder wegfällt. Neue Altersklasse (U17) = Zeile in `AGES` + `GRUPPEN`.
- **Mitteilungen: Kinder als Altersklasse** (vom Nutzer, 23.10.2026, Fassung neu h, „im Einklang mit dem Verein“): im Zahnrad
  „Minimes U13“, „Scolaires U15“, „Poussins U11“, „Pupilles U9“ statt U13 1/U13 2 usw. (`mReiter`, Name aus `t.gruppe`), Seniors
  einzeln. Alte Auswahl je Mannschaft wird beim Öffnen umgeschrieben (`mGruppiert`, Arten zusammen). Jedes Ereignis in
  `mitteilungen.json` trägt in `reiter` zusätzlich den Gruppennamen (`mitGruppe`) — **Worker unverändert**, `passtZu` passt so.
  Titel nennen weiter die Mannschaft („U13 2 · Tabelle“). Spieltag komplett/Tabelle bleiben je Mannschaft (eigene Klassen,
  kommen zu verschiedenen Zeiten). **Morgen/Heute Spiel zusammengefasst (am selben Abend zurückgenommen, siehe unten):** alle Spiele einer Altersklasse am selben Tag in
  einer Mitteilung („Minimes U13 · Morgen 2 Spiele“, je Zeile „U13 1: 10:00 gegen …“), id `heute:<id>+<id>`, Feld `spiele`;
  ein Spiel allein wie bisher `heute:<id>`. Noch nicht fällige (ab > jetzt) werden mit neuen Spielen neu gebaut, schon fällige
  decken ihre Spiele ab; ein später bekanntes Spiel kommt einzeln. Tests mit Gegenprobe.
- **Versand für viele Handys** (vom Nutzer, 23.10.2026, Fassung neu j, „Los“; Plan in `IDEEN.md`): **Postausgang** in D1
  (`postausgang`: id, endpoint, nachricht, bis, prio, zeit). Fällige Mitteilung → `gemeldet` (an 0, passend n) + je passendem
  Handy eine Zeile; jeder Minuten-Lauf schickt höchstens **`PAKET` = 10** (vom Nutzer: klein und sicher; erst nach Messung im
  Dashboard erhöhen), Live (ticker/halbzeit/ende) zuerst, nur 7–23 Uhr; `an` zählt je Erfolg hoch, Fehler je Art einmal in
  `fehler` (410 löscht das Abo, seine übrigen Zeilen laufen als „Handy abgemeldet“ durch; `bis` vorbei → „abgelaufen“).
  `?zahlen`: „⏳ wird verschickt: 10 von 25 Handys, 15 warten“. **Höchstzahl** (vom Nutzer, „Lösung 2“): `?push=anmelden`
  nimmt neue Handys nur bis `MAX_ABOS` (Cloudflare-Variable, ohne sie 50) → 409 `voll`, App löst dann das Abo wieder und sagt
  „Mitteilungen gibt es bald für alle – im Moment sind alle Plätze vergeben …“. **Empfangsbestätigung** (vom Nutzer): `sw.js`
  meldet nach dem Anzeigen `?push=angekommen&id=` (Feld `q` in der Nachricht, nicht bei der Test-Mitteilung), `gemeldet.angekommen`,
  „· angekommen auf 47“; zählt nur bekannte ids, ohne Kennung des Handys. Rechenzeit: Schlüssel und VAPID-Kopf (je Push-Dienst,
  6 h) bleiben im Speicher (`SCHLUESSEL`, `KOEPFE`). Tests: 25 nachgebaute Handys, Pakete, Vorrang, 410, nachts, abgelaufen,
  Höchstzahl, Quittung; Gegenproben gemacht. Mit altem Worker harmlos (Quittung → 405, kein 409).
- **Kinder-Namen vom Verein** (23.10.2026, Fassung neu m): Reiter, Mitteilungen, Kalender-Titel und „Unsere Woche“ heißen
  **SCO, MIN 1, MIN 2, POU 1, POU 2, PUP 1, PUP 2** (Pokal ohne I/II: „MIN“, „SCO“) statt U15, U13 1 … (`kurz` in `AGES`,
  `reiter(t)`; `reiter(t, true)` gibt den alten Namen). Einzel-Kalender behalten ihren Dateinamen (`u13-1.ics`), Gruppen
  („Minimes U13“ …) bleiben. `istKinder` geht jetzt nach der Altersklasse (vorher Name mit „U…“ — sonst wäre Koeppi weg gewesen),
  die Spruch-Reihenfolge (`fest`) mit den neuen Namen in alter Reihenfolge. Statistik zählt ab da unter den neuen Namen.
- **Kinder wieder je Spiel eine Mitteilung** (vom Nutzer, 23.10.2026 abends): „Pupilles U9 · Morgen 2 Spiele“ war auf dem
  Sperrbildschirm abgeschnitten. Jetzt wieder `heute:<Spiel>` je Spiel („PUP 1 · Morgen Spiel“), gewählt wird weiter die
  Altersklasse. Schon fällige alte Zusammenfassungen (`heute:a+b`) decken ihre Spiele ab, wartende fallen weg (Tests, Gegenprobe).
- **Tore als Mitteilung** (vom Nutzer, 23.10.2026 abends, Fassung neu n; nur Tore, keine Karten): Worker macht im Live-Fenster aus
  FuPas `highlights` (type goal) je Tor eine Mitteilung „Seniors 1 · Tor ⚽“ / „Avenir Beggen 1:1 Koeppchen II · 50. Dario Russo“
  (`toreRoh`, id `tor:<Spiel>:<FuPa-id>`, Stand nach dem Tor, FLF-Reihenfolge, nur Tore der letzten 20 min, Vorrang wie Live).
  Art `tor` nur sichtbar mit **eigenem Code**: der Logo-Merker `fussball_v1_mtest` ist jetzt `"pro"` oder `"test"` (alte `"1"`
  zählen wie test → Nutzer meldet sich einmal ab und mit eigenem Code wieder an); `mTore()`. Beim Anhaken der Mannschaft ist
  „Tore“ **nicht** mit an (vom Nutzer: bewusst wählen). Für alle freischalten: `mTore` → true. Worker neu einfügen nötig.
- **Verschossene Elfmeter im Live-Kasten** (vom Nutzer, 23.10.2026, Fassung neu o): FuPa-`highlights` type `penaltyfail` →
  Feld `fehl` (Worker `kuerzen` und `liveAus`, beide gleich, Test), Zeile „❌ 55. Name · Elfmeter verschossen (Mannschaft)“.
  Keine Mitteilung dafür. FuPa liefert **keine Vorlagengeber und keine Gelben Karten** (am 23.10. in 7 Spielen geprüft).
- **Text verschickter Mitteilungen gemerkt** (23.10.2026 abends, vom Nutzer): `gemeldet.text`, damit `?zahlen` auch beim Endstand den
  Text zeigt (vorher nur, solange eine Kopie in `offen` lag). Live-Ereignisse, die schon verschickt sind, legt der Worker nicht mehr
  jede Minute neu in `offen` (sparte nur Schreibzugriffe). Liste auf `?zahlen`: 7 Tage, höchstens 50; `gemeldet` 30 Tage.
- **Live-Kasten nimmt den frischeren Stand** (23.10.2026, Fassung neu p): bei einem Tester stand im Reiter noch „Halbzeit“,
  in der Woche schon die 82. (zwei getrennte Abrufe: `W` für den offenen Reiter — ruht, während die Woche offen ist —, `WS` für alle
  Spiele). `wFrisch(sp)` nimmt den mit dem neueren `abgerufen`, für Kasten, Minutentakt und Woche.
- **FuPa-Endstand bleibt bis zum FLF-Ergebnis** (vom Nutzer, 23.10.2026, Fassung neu r): Seniors 3 spielte um 20:00, um 23:00
  (Ende des Live-Fensters, 180 min) waren Kasten und Stand in der Woche weg, die FLF noch leer. Jetzt bleibt ein Spiel ohne
  FLF-Ergebnis bis 48 h (`ENDE_FRIST`) Live-Kandidat, wenn der Endstand (POST) bekannt ist oder in dieser Sitzung noch nicht
  nachgefragt wurde (`liveSpiel(…, spaet)`, `SPAET_VERSUCHT`): **einmal je App-Öffnung eine Worker-Frage**, mit Endstand gar keine
  mehr. Endstände liegen in localStorage (`fussball_v1_ende`), überstehen also das Schließen. Kasten „Endstand laut FuPa“ bis zum
  FLF-Ergebnis (`liveAnzeige`: POST 48 h, LIVE weiter 4 h); nach Abpfiff kein Minutentakt mehr. Browser-Test mit gestellter Uhr
  (23:16, eine Worker-Anfrage in 5 min, nach Neuladen ohne Worker noch da), Gegenprobe gemacht.
  **Roude Léiw genauso** (Fassung neu s, `natiLiveSpiel(…, spaet)`): bleibt, bis der FLF-Abruf das FuPa-Ergebnis in die Daten
  holt (z. B. Anpfiff 18:00 an einem Wochentag → Kasten sonst 21:00 weg, Ergebnis erst 22:15). Nach Abpfiff steht im Kasten
  kein „fast live“/„bis zu 7 min Verzögerung“ mehr.
- **FuPa höchstens einmal pro Minute je Spiel** (vom Nutzer, 24.10.2026, für den Text an FuPa): `fupaSpiel(slug, db, now)` im
  Worker merkt eine Antwort 60 s (`MERKEN_MS`, vorher 20 s), erst im Speicher der Instanz, dann in D1 (`fupa_spiel`, 7 Tage),
  gemeinsam für Handy-Anfragen (`?slug=`) und den Minuten-Lauf der Mitteilungen (vorher fragte der extra). FuPa weg → letzter
  Stand. `abgerufen` = Zeit des FuPa-Abrufs. Stand in der App dadurch bis ~2 min alt. Test mit Zählung der Abrufe, Gegenprobe.
  **Worker neu einfügen nötig.**
- **U9/U11 einheitlich „gespielt“, Ergebnisse nicht gespeichert** (vom Nutzer, 24.10.2026, Fassung 24.10. neu c): vorher
  „gespielt“ nur, wenn die FLF den Spielbericht hatte, sonst „–“ (PUP 2 seit 3.10. ohne Bericht). Jetzt ab 3 h nach Anpfiff
  (Uhrzeit offen: ab dem Tag danach, `istVorbei`) immer „gespielt“. Die FLF-Schnittstelle liefert die versteckten Ergebnisse
  mit; `spiel()` speichert bei `showResult: false` keine `hs`/`as` mehr (Wunsch des Vereins). Test mit Gegenprobe.
- **Abgebrochene Spiele** (24.10.2026, Fassung 24.10. neu d): U15–Oberkorn stand im Extranet „2 - 0“, in der App ohne
  Ergebnis — die FLF führte es mit `isPlayed` false, aber Endergebnis und Bemerkung „Arrêté“ (kommt als „Arr\uFFFDt\uFFFD“).
  `spiel()`: Endergebnis (ohne Forfait) = gespielt; `bemerkung()` repariert „Arrêté“; App schreibt „abgebrochen, gewertet“.
- **Koeppi-Kasten mit dem Spiel** (vom Nutzer, 25.10.2026, Fassung 25.10. neu a): Solange „Super gemacht“ steht
  (`nachDemSpiel`), steht das Spiel unten im grünen Kasten (`.streifenbox`, `ergZeile`) statt in der Liste darunter —
  gleich dargestellt wie in der Liste, nicht größer (Vereinswunsch: Ergebnis nicht hervorheben). Bei 390 px geprüft.
- **Fassung 25.10. neu b** (vom Nutzer): aufklappbare Karten mit grünem Kopf, weißer Schrift, Knopf „Anzeigen ▾“ weiß
  (grüne Schrift), offen „Zuklappen ▴“ schwarz. **Spruch je Woche** statt je Spielzahl (`nachDemSpiel`: Woche des Spiels +
  Platz in `fest`) — am 24.10. hatten MIN 1 (mit Pokal ein Spiel mehr) und MIN 2 denselben Spruch. Test mit Gegenprobe.
- **U9/U11 auch Freundschaftsspiele ohne Ergebnis** (vom Nutzer, 25.10.2026, Fassung 25.10. neu c): die Klasse „Amicaux“
  hat `showResult: true`, darum stand bei PUP 1 „– · Ergebnis noch nicht eingetragen“. `KEINE_ERG` (tools/fussball.mjs):
  `aufbereiten` löscht `hs`/`as` aller Spiele mit einer U9/U11-Mannschaft von uns (fremde bleiben), `eigeneSpiele` und
  `sicht` setzen `erg: false` → „gespielt“. Test mit Gegenprobe.
- **BAM (Bambinis U7)** (vom Verein über den Nutzer, 24./25.10.2026, Fassung 25.10. neu d; vom Nutzer: gleich sichtbar, nur zwei
  Nutzer bisher): nicht im Extranet, nur als PDF auf www.flf.lu. `tools/bambini.mjs`: PDF-Listen aus dem JSON der Seiten
  „Programmes généraux“ (`U7…Bambini…`, ganze Tour, ohne Uhrzeit) und „Programme hebdomadaire“ (`…Bambinis.pdf`, mit Uhrzeit,
  „9h30“ hinter dem Platz, sonst „Coup d'envoi 10.30“ im Kopf); `pdftotext -bbox` (Lage jedes Worts), je Seite die vier
  Spaltenanfänge, je Spieltag die letzten vier Zeilen = Mannschaften, davor der Platz. Nur Turniere mit Koeppchen; passt ein
  solcher Spieltag nicht ins Muster → Fehler → **alter BAM-Stand** (`bamAus`), Rest des Abrufs läuft (vom Nutzer: „wir würden dann
  reparieren“). `bamDaten` baut Mannschaften (`kat` U7, `kurz` BAM, ids 9000701/9000702, Reiter BAM 1/2 hinter den PUP, Kalender
  `u7-1/2.ics` + Gruppe „Bambinis U7“) und eine Klasse `bam-<Série>` (typ CC, ohne Ergebnisse/Tabelle) im Format von `aufbereiten`
  — Reiter, Woche, Kalender, Koeppi, Morgen-Kasten laufen ohne Sonderweg. Spiel = Mini-Spieltag (vom Nutzer 25.10.: nicht „Turnier/Tournoi“, klingt nach Wettkampf): Gegnerseite „Mini-Spieltag mit …“,
  `sp.bam = {mit, zeitSicher}`, Heim = Platz in Wormeldange, Wochenprogramm schlägt Gesamtplan, ohne es 10:30. Kalender-Titel
  „Koeppchen BAM 1 · Mini-Spieltag in Mensdorf“, Gegner in der Beschreibung. **Mitteilungen für BAM** (vom Nutzer, 25.10., Fassung neu f; im Zahnrad
  „Bambinis U7“): „BAM 1 · Morgen Spiel“ am Vorabend 19:00 („09:30 · Mini-Spieltag · 📍 …“, ohne Wochenprogramm „10:30 (sauf
  changement)“) und „Uhrzeit steht fest“, sobald das Wochenprogramm die Zeit bringt (`bam.zeitSicher` false → true). `KEINE_ERG` hat U7. Spruch: `fest` jetzt 9 Teams bei 8 Sprüchen — BAM 2 und MIN 1 können am selben
  Wochenende denselben haben (dem Nutzer gesagt, ein 9. Spruch löst es). Workflow installiert poppler-utils, falls pdftotext fehlt.
  Am 25.10. gegen beide PDFs geprüft (16 Turniere, 8 Spieltage), Tests mit nachgebauten Wörtern, Gegenprobe.
- **Fassung 25.10. neu g:** (1) **Kalender: Uhrzeit offen auch bei 00:00:01** (am selben Tag vom Nutzer geändert: **keine Ganztagstermine** mehr, Termin um 00:00 mit „· Uhrzeit offen“ im Titel — „dann wissen die Leute, dass es noch gesetzt werden muss“) — die FLF schreibt „offen“ inzwischen als 00:00:01,
  `ics()` prüfte auf „ 00:00:00“ → 88 Spiele (U9/U11 ab 14.11.) standen 0:00–1:30 nachts statt ganztägig; jetzt Stunde:Minute
  (App und Mitteilungen prüften schon so). Test mit Gegenprobe. (2) **BAM „ca. 10:30“** (vom Nutzer) solange das Wochenprogramm
  fehlt: `wann(sp)` nimmt auch ein Spiel und setzt „ca.“ bei `sp.bam.zeitSicher` false (Reiter, Woche, Morgen-/Heute-Kasten).
  Im Kalender bleiben es 10:30 mit Hinweis in der Beschreibung (ganztägig wäre schlechter).
- **Reiter „Jugendkommission“ + flexibles Raster** (vom Nutzer, 25.10.2026, Fassung 25.10. neu h): letzter Reiter immer `jk`
  (`extraReiter`, Knopf = Logo der Jugendkommissioun auf weißem Feld, `bilder/jk-logo-klein.png`; Statistik-Name „Jugend“).
  Inhalt (`jkHtml`): großes Logo (`bilder/jk-logo.png`), Foto der Jugendkommission (`bilder/jugendkommissioun.jpg`, 900 px;
  Originale in `bilder/jk/`), YouTube-Video `JK_VIDEO` über `youtube-nocookie.com` (spielt in der App), darunter **alle
  Kalender-Abos** (`alleKalender`: Kinder als Altersklasse, je einmal, Reiter-Reihenfolge; `kalKnopf` auch in den Mannschafts-Reitern).
  **Raster:** 60 Spalten (`reiterBreiten`): volle Reihen normal (Handy 4, ab 600 px 6), die **letzte Reihe teilt sich die Breite
  gleichmäßig** (vom Nutzer gewählt statt „nur der letzte Knopf breit“) — nie eine Lücke, egal wie viele Mannschaften dazukommen
  oder wegfallen. Test prüft 1–30 Reiter für Handy und Computer, Gegenprobe gemacht. Bei 390 und 1000 px angesehen.
- **Datenschutz-Hinweis** (vom Nutzer, 25.10.2026, Fassung neu i, **ohne Kontaktangabe**): aufklappbar in der Fußzeile (`#datenschutz`,
  `DS_OFFEN` hält ihn bei Takten offen, Reiterwechsel klappt ihn zu wie alles andere — vom Nutzer): anonyme Zählung, Push-Adresse + Auswahl nur bei Mitteilungen, Rest bleibt auf dem Handy,
  Daten von FLF/FuPa, Video von YouTube. Bei neuen Datenflüssen (z. B. Facebook) mitändern.
  **Seit 26.10. (Fassung neu e, vom Nutzer) mit Kontakt** `koeppchenapp@hotmail.com` (mailto-Link) — vorher bewusst ohne.
- **„Spieltag komplett“ auch für Seniors 1–3** (vom Nutzer, 25.10.2026, Fassung neu k): wenn alle Spiele des Spieltags der Klasse
  eingetragen sind, mit unserem Ergebnis; danach wie bisher „Tabelle“. Im Zahnrad neuer Haken bei den Seniors (wer Seniors schon
  gewählt hat, muss ihn selbst anhaken). Kinder bleiben: keine Mitteilung nur für unser Spiel (Vereinswunsch).
- **„Tabelle“ erst, wenn die ganze Tabelle nachgezogen ist** (vom Nutzer, 25.10.2026): vorher kam sie, sobald nur unsere
  Zeile ein Spiel mehr hatte — Platz konnte falsch sein. Jetzt `tabelleFertig(k)`: jede Zeile hat so viele Spiele wie Ergebnisse
  in der Klasse. War unsere Zeile schon vorher neu, ohne „(vorher …)“. **Nur Spiele bis jetzt zählen**: im Voraus gewertete
  Forfaits (Larochette zog sich zurück, Termine bis Mai mit 0:3) zählt die FLF erst ab dem Datum — die erste Fassung hielt
  Réserves Cl3 S2 darum fälschlich für „nicht fertig“. Am 25.10. abends: alle 6 Klassen fertig. Kinder und Seniors gleich.
  Tests mit Gegenprobe.
- **Spieltag komplett / Tabelle nach Spieltag** (vom Nutzer, 25.10.2026 abends, Fassung neu l): `spieltagStand(spiele, tag, now)` in
  `tools/mitteilungen.mjs`: Haupttermin = mittlerer Termin; ein Spiel ohne Ergebnis gilt als **verlegt** (hält nicht auf), wenn es
  > 7 Tage vom Haupttermin weg ist oder sein Termin > 3 Tage vorbei ist (FLF lässt beim Verlegen das alte Datum stehen, Koeppchen II –
  Syra 3.10.); ein Dienstagsspiel nach Freitag wird abgewartet. „Spieltag komplett“ dann, Titel „(1 Spiel verlegt)“, ist unser Spiel
  verlegt „unser Spiel noch offen“. **„Tabelle“ erst, wenn der Spieltag unseres letzten Spiels komplett ist und `tabelleFertig`**
  (Anlass: Seniors 1 bekam „11. Platz“, zwei Spiele des Spieltags fehlten, danach 12.). Alter Stand wird zu `alt.stand` beurteilt;
  nur Spieltage der letzten 10 Tage. BGL genauso. Später vielleicht beide zu einer Meldung zusammenlegen, wenn sie meist gleichzeitig
  kommen (vom Nutzer: erst beobachten). **App:** in „Alle Spiele der Klasse“ hat jedes offene Spiel seinen Termin (am Spieltag-Tag
  nur Uhrzeit), alte offene „noch nicht gespielt (verlegt)“, gespielte an anderem Tag das Datum; Kopf = mittlerer Termin.
- **Kurze Titel** (vom Nutzer, 25.10.2026, Bild vom Sperrbildschirm: „Seniors 1 · Spieltag 1…“): iOS zeigt vom Titel nur ~22 Zeichen,
  den Text ganz. Darum „… · Spieltag“ (Text „Spieltag 10 komplett: …“), „… · Uhrzeit“ (Text „Uhrzeit steht fest: …“), „Roude Léiw ·
  Heute“ (Text „Länderspiel um …“). Neue Titel: Mannschaft + ein Wort.
- **Workflows: Checkout `ref: main`, Rebase `-X theirs` + `rebase --abort`** (25.10.2026, nach einem roten Lauf in
  fussball-vereine: ein wartender Lauf arbeitete mit altem Stand → Konflikt in data/fussball.json). Bei uns noch nie rot,
  aber dieselbe Lage (Worker-Anstoß und verspäteter GitHub-Zeitplan gleichzeitig, z. B. 23:30 → sonst erst 7:00 wieder).
  `fussball-live.yml` auch `ref: main`. `bgl.namen` geht dabei nicht verloren (jeder Lauf liest den neuesten Stand).
- **Reiter beim Runterscrollen weg** (vom Nutzer, 26.10.2026, Fassung 26.10. neu a; 16 Knöpfe nahmen ~¼ des Bildschirms): Reiter
  in eigener sticky-Leiste `#leiste` unter dem Kopf (`--kopfH` = Höhe des Kopfs, `kopfHoehe`). Nach 24 px Runterscrollen schiebt sie
  sich per `transform` hinter den Kopf (Klasse `weg`, grüner Strich bleibt), Hochscrollen, ganz oben oder Tippen auf den Kopf
  holen sie zurück. Nur transform, kein Höhenwechsel — sonst springt der Inhalt (iOS hat kein Scroll-Anchoring).
  **Neu b nach dem iPhone-Test des Nutzers:** weg nach 30 px runter schon ab 60 px von oben (vorher erst ab ~230 px — „dauert am
  Anfang zu lang“), zurück erst nach 90 px hoch (vorher 24 — „zu schnell zurück“), letzte 80 px vor dem Ende zählen nicht (unten
  flackerte es beim Nachfedern, die Überschrift verschwand kurz; dazu `translateZ(0)` am Kopf, eigene Ebene über der Leiste),
  Bewegung 0,35 s weich statt 0,22 s („flüssiger“). Oben federn war schon in Ordnung.
  **Neu c** (zweiter iPhone-Test): Anfang gut; zurück erst nach 150 px; Bewegung 0,7 s weich ein und aus („springt zu viel“);
  unten flackerte es weiter → **Nachfedern ganz aus** (`overscroll-behavior-y:none` an html/body, iOS ab 16).
  **Neu d** (vom Nutzer: Flackern war nur unten, oben zum Neuladen lassen; „ein klein wenig langsamer“): `overscroll-behavior` wieder
  raus, stattdessen fängt ein `touchmove`-Lauscher (passive: false) am Seitenende das Weiterziehen nach oben ab — CSS kann nicht nur
  eine Richtung; ein Wischen mit Schwung kann unten trotzdem kurz federn. Bewegung 0,85 s.
  **Neu e** (vom Nutzer): nur-unten federte die Überschrift unter die Reiter → wieder **oben und unten aus** (`overscroll-behavior-y:none`),
  Lauscher raus; Neuladen im Browser über dessen Knopf. Bewegung bleibt 0,85 s.
  **Neu f** (vom Nutzer): Zeile unter „FC Koeppchen“ mit Mannschaftsnummer aus dem FLF-Namen („U13 Minimes 1 · 2026-2027“,
  „Seniors Réserves 2“), damit man es auch bei weggeschobenen Reitern sieht; ohne I/II (SCO, Seniors 1) unverändert.
  **27.10. neu a** (vom Nutzer): grüner Strich unter den Reitern 5 px statt 3 px (fällt beim Einfahren besser auf); `weg` schiebt um 100 % − 5 px.
- **Coach, Stufe 1** (vom Nutzer, 27.10.2026, Fassung 27.10. neu b; Plan und Entscheidungen in `IDEEN.md` „COACH-Reiter“): Trainer tragen
  Freundschaftsspiele/Turniere ein. **📋 neben dem Zahnrad** (`#coachknopf`, nur mit Merker `fussball_v1_coach` = {schluessel, name, rolle,
  teams}), Bereich wie das Zahnrad (`COACH_OFFEN`, `#coach`, bei Takten nicht neu gebaut — iPhone-Tippen). **Eingang 5× Logo, ein Feld für
  alle Codes** (`codeArt`): eigener Code → Mitteilungen (pro) **und** Coach-Verwalter, Tester-Code → nur Mitteilungen, sonst fragt die App den
  Worker (`?coach=einloesen`) = Trainer-Code, **nur in der installierten App** (`istApp`, sonst wäre der Einmal-Code in Safari verbraucht).
  **Leer lassen + OK** schaltet Mitteilungen-Test und Coach auf dem Gerät aus (vorher: 5× ohne Code = aus). **Worker** (`coachAnfrage`, D1-Tabellen
  `coach_trainer`, `coach_geraet`, `coach_spiel`, `coach_stand`, legt er selbst an): Codes „ABCD-2345“ **gelten einmal**, gespeichert nur als
  SHA-256; Einlösen gibt dem Handy einen geheimen Schlüssel (auch nur als Hash gespeichert) und meldet ein früheres Handy desselben Trainers ab.
  Verwalter = Gerät mit `trainer_id` 0, angemeldet mit dem Code zu `ADMIN_HASH` (= `CODE_HASH`). Trainer: nur eigene Spiele, nur eigene
  Mannschaften; Verwalter alles, sieht Namen, legt Trainer an („✓ Code genutzt am …“), „Neuer Code“ (alter Code + Handy ungültig). Beim Start
  fragt die App `?coach=ich` — 401 (gesperrt/neuer Code) → 📋 weg. 10 falsche Codes je 10 min und Adresse → Pause. Speichern/Löschen stößt
  den FLF-Abruf **sofort** an (höchstens 1×/min, sonst `coach_stand.nachholen` im nächsten Takt). **Abruf:** `tools/fussball.mjs` holt
  `?coach=spiele` (öffentlich, ohne Namen, ab 60 Tagen zurück; Fehler → `alt.coach`), `coachDazu` baut je Mannschaft eine Klasse
  `coach-<id>` (typ FM, ohne Ergebnisse, n „Vom Trainer eingetragen“), Spiel-ID `8e9 + id`, Gegner „Turnier: FC Mondercange“ bei
  Nicht-Freundschaftsspielen, `sp.coach = {art, gegner, ende?, bem?}`, `sp.abgesagt`. Uhrzeit offen = 00:00 wie bei der FLF. `bamAus`
  lässt Coach-Klassen weg (sonst doppelt). **App:** Schild = Art (`artText`), Zusatz „bis ca. 15:00 · Bemerkung“ (`coachZusatz`), abgesagt
  steht mit „abgesagt“ da, nicht im Heute-/Morgen-Kasten, nicht bei „Super gemacht“; kein Ticker für Coach-Spiele. **Kalender:** Ende vom
  Trainer, abgesagt = „ABGESAGT:“ + `STATUS:CANCELLED`. **Mitteilungen:** „Morgen/Heute Spiel“ wie jedes Spiel (Turnier: „10:00 · Turnier: …“),
  abgesagte nicht, nicht in „Neue Woche“-Zahl, **kein „Neues Spiel“** (kommt mit Stufe 2, eigener Haken). Tests: `node test/coach.mjs`
  (Worker mit echter SQLite, `node:sqlite`; **nicht in der Action**, weil experimentell) und Abschnitt Coach in `test/fussball.mjs`; Browser-Test
  mit dem echten Worker-Code hinter `page.route` (Verwalter → Trainer anlegen → Browser lehnt Code ab → App löst ein → Formular, Tippen ohne
  Fokusverlust, Speichern, Kopie, Absagen → Reiter zeigt Turnier → Neuer Code wirft das alte Handy raus). Gegenproben gemacht. **Worker neu einfügen nötig.**
  **Neu c** (vom Nutzer): kleines dunkelgrünes „COACH“ (`coachZeichen`, `.coachz`) vor Datum/Zeile in Nächste Spiele, Ergebnissen, Woche und
  im Kopf von Heute-/Morgen-Kasten — sofort erkennbar, dass es kein FLF-Spiel ist. Bei 390 px angesehen.
  **Neu d** (vom Nutzer): „Zu Hause“ trägt gleich **Am Ga (Wormeldange, synth.)** ein (`HEIMPLATZ`; auswärts leert es wieder, Abruf nimmt
  es auch, wenn der Platz fehlt). Uhrzeit und Ende als **zwei Auswahlfelder 00–23 / Minuten in 5er-Schritten** (`zeitWahl`) statt
  `type=time` — das zeigte je nach Handysprache AM/PM. Datum bleibt das Handy-Datumsfeld, darunter auf Deutsch („→ Samstag, 31. Oktober 2026“).
  **Stufe 2** (vom Nutzer, 27.10.2026, Fassung 27.10. neu e): **Rollen** — `chef` (Laurent, Gerät mit person 0, eigener Code), `admin` = Verwalter
  (alle Spiele, Trainer anlegen/ändern/entfernen, **keine Verwalter** — die legt nur der Chef an und entfernt sie), `trainer`. `darfPerson` im
  Worker, die App zeigt Knöpfe nur bei `p.darf`. **Mehrere Codes je Person** (Tabelle `coach_code`, je Gerät einer, jeder gilt einmal; der
  Stufe-1-Code aus `coach_trainer.code_hash` zieht beim ersten Start einmal um): „+ Code für weiteres Gerät“ (andere Geräte bleiben),
  offenen Code „zurückziehen“, „Alle Geräte abmelden“ (Handy verloren; offene Codes fallen mit weg), „Entfernen“ (Person, Codes, Geräte weg,
  ihre Spiele bleiben mit „eingetragen von …“), „Mannschaften ändern“. Liste zeigt „📱 auf n Geräten angemeldet“, offene Codes, zuletzt
  eingelöst. **Codes auch am Computer/Android im Browser** (vom Nutzer: Desktop) — gesperrt ist nur iPhone-Safari (`IOS && !istApp`,
  getrennter Speicher). **Verlauf** (`coach_verlauf`, 1 Jahr, letzte 60 in der App, nur Chef/Verwalter): neu/geändert/abgesagt/gelöscht,
  Personen angelegt/geändert/entfernt, Codes gemacht/eingelöst/zurückgezogen. **Mitteilungen** (Art `trainer`, Haken „Trainer: neu, geändert,
  abgesagt“ bei jeder Mannschaft gleich nach „Spiel steht an“, beim Anhaken an; bestehende Auswahl muss ihn selbst anhaken): in
  `tools/mitteilungen.mjs` aus `alt.coach`/`neu.coach` (öffentliche Liste hat jetzt `geaendert`) — **Neues Spiel**, **Geändert** („Jetzt … (vorher
  …)“, nur Datum/Uhrzeit/Gegner/Art/Platz/Mannschaft, nicht Bemerkung/Ende), **Abgesagt** (auch wenn es nach der Ankündigung gelöscht
  wird). Vom Nutzer gestrichen: „Findet statt“ (wieder angesetzt meldet nichts — „die Kinder sind ja da“), „Gestrichen“ (= Abgesagt). `ab` = Änderung + 10 min; ändert er in der Zeit nochmal, ersetzt das neue Ereignis das wartende und behält dessen `basis` (Stand,
  den die Eltern kennen) — vertippt = eine Mitteilung, zurückgeändert/gleich gelöscht = keine. Neue Spiele für heute/morgen nicht extra (dafür
  „Morgen/Heute Spiel“). Kurz vor Anpfiff geändert → sofort. Erster Lauf ohne `alt.coach` → nichts. Tests: `test/coach.mjs` 51 (Rollen, Codes,
  Geräte, Entfernen, Verlauf, Umzug Stufe 1), `test/fussball.mjs` 374 (Trainer-Mitteilungen, Gegenprobe), Browser: Chef → Verwalter am Computer
  → Trainer, iPhone-Safari lehnt ab, iPhone-App nimmt an, zweiter Code am Computer, Mannschaften ändern, Verlauf, Geräte abmelden, Entfernen.
  **Worker neu einfügen nötig.**
  **Fassung 27.10. neu g** (vom Nutzer): (1) **Trainer sehen und bearbeiten alle Trainer-Spiele ihrer Mannschaften**, auch von anderen eingetragene
  (mit „eingetragen von …“), inkl. Löschen (Worker `darf`/`liste` nach `coachTeile(reiter)` ∩ `teams`). (2) **Ein Spiel für mehrere Mannschaften**:
  `reiter` = „MIN 1+MIN 2“ (Auswahl `mannschaftOptionen`: jede einzeln + je Altersklasse „MIN 1 + 2 (beide)“); `coachDazu` legt je Mannschaft
  eine Kopie mit derselben id an (beide Reiter), `sp.coach.mannschaften` = „MIN 1+2“ (`coachName`) → Woche einmal als „MIN 1+2“, Gruppen-Kalender
  einmal „Koeppchen MIN 1+2 – …“, „Morgen Spiel“ und Trainer-Mitteilungen einmal als „MIN 1+2 · …“ (überall derselbe Name, vom Nutzer). Ändern: neue Mannschaften nur eigene, schon
  dabei gewesene dürfen bleiben. (3) **Nachfrage bei doppeltem Spiel** (`gleicherTag`): gleiche Mannschaft am selben Tag schon ein Trainer- oder
  FLF-Spiel → „Am … steht schon: … Trotzdem speichern?“ (Liste wird vorher frisch geholt). Tests: coach.mjs 60, fussball.mjs 381, Browser.
  **Worker neu einfügen nötig.**
- **Tabellen-Mitteilung: id mit Spieltag** (28.10.2026): `tabelle:<Klasse>:<Team>:<Spiele>:<Spieltag>`. Seniors 2/3 bekamen nach „Spieltag
  komplett“ keine Tabelle — ihre alte id (nur Spielzahl) war schon vor der Spieltag-Regel (24./27.10.) einmal verschickt, der Worker schickt
  jede id nur einmal.
- **Nachholspiel** (vom Nutzer, 28.10.2026, Fassung 28.10. neu a; Anlass PUP 1 – UMW vom 24.10. auf 31.10. verlegt, bei der FLF noch am alten
  Datum, nicht gespielt): neue Coach-Art „Nachholspiel“ (wie Freundschaftsspiel „gegen …“, `mitGegner`/`coachMitGegner`, Kalender „(Nachholspiel)“).
  **Doppelt mit der FLF:** `coachDazu` lässt ein Trainer-Spiel weg, sobald die FLF für dieselbe Mannschaft am selben Tag ein Spiel hat und der
  Gegner passt (`gegnerPasst`: ein Wort gleich oder Anfangsbuchstaben „UMW“ = „Union Mertert-Wasserbillig“; beim Nachholspiel reicht der Tag),
  `D.coachDoppelt` = ids → im Coach-Bereich „✓ Steht jetzt auch bei der FLF … kannst diesen Eintrag löschen“. Tests mit Gegenprobe.
  Offen: das alte FLF-Spiel (24.10.) steht bei U9/U11 nach dem Termin als „gespielt“, obwohl es ausfiel — die FLF sagt es nicht anders.
**Worker neu einfügen nötig** (Art im Worker).
- **„Morgen/Heute Spiel“ wird bis zum Versand jedes Mal neu gebaut** (27.10.2026, vom Nutzer gesehen: ein mittags eingetragenes und gleich
  gelöschtes Trainer-Spiel für MIN 2 kam um 19:00 trotzdem als „Morgen Spiel“): noch nicht fällige `heute`-Ereignisse (ab > jetzt) fallen
  aus `vorher` weg und entstehen aus den aktuellen Daten neu — gelöscht/abgesagt/verlegt → weg, geänderte Uhrzeit → neuer Text (gleiche id).
  Galt auch für FLF-Spiele (verlegtes Spiel behielt den alten Text). Schon fällige bleiben (verschickt). Test mit Gegenprobe.
- **FuPa-Widget statt Schnittstelle** (vom Nutzer, 29.10.2026, Fassung 29.10. neu a; FuPa hat auf die Anfrage nicht geantwortet, Paul Krier
  von FuPa Luxemburg sieht eher ein rechtliches Problem → Mail an FuPa Deutschland, **vom Nutzer verschickt am 29.10.2026**: Nutzung wie bisher? sonst wenigstens Halbzeit-/Endstand). **Letzter Stand mit Schnittstelle: Commit `8485948`.**
  **Schalter statt Ausbau:** `FUPA_API` in `index.html` und `FUPA.api` in `tools/fupa-modus.mjs` (beide `false`; der Test prüft, dass sie
  gleich stehen). Zurück = beide auf `true`, sonst nichts (Worker unverändert). **Aus:** kein Live-Kasten, kein Stand in „Unsere Woche“
  (`liveKandidaten` leer), keine Worker-/live.json-Abfragen, keine FuPa-Slugs der Reserven (`neu.fupa` leer), `fussball-live.mjs` startet
  nicht, `mitteilungen.mjs` gibt dem Worker keine `live`-Spiele → keine Mitteilungen Ticker/Halbzeit/Tor; **Endstand kommt aus den
  FLF-Daten** (Seniors) bzw. aus den Roude-Léiw-Daten. Im Zahnrad verschwinden die Haken (`mArtenFuer`, `mAufraeumen` räumt). **Bleibt von
  FuPa** (vom Nutzer: Tabellen sind Tatsachen): BGL-Tabelle, Roude Léiw (Spiele, Ergebnisse, Tabelle). **Widget:** „Team-Liveticker“, im
  Widget-Builder vom Nutzer unter koeppchenapp@hotmail.com angelegt, nur für https://fckoeppchen.github.io/ (`FUPA_WIDGET`, ids je Reiter
  Seniors 1/2/3; für die Nationalmannschaft gibt es keins → im Heute-Kasten nur der Link „Liveticker auf FuPa“). Am Spieltag unter dem
  Heute-Kasten (`fupaWidgetHtml`), nicht bei Trainer-Spielen. **Erst nach Zustimmung** („Liveticker anzeigen“, `fussball_v1_fupaOk` = ja;
  FuPa-Bedingungen: das Handy spricht dann direkt mit FuPa), zurücknehmen im Datenschutz-Hinweis (lädt die Seite neu). Das Widget-Element
  bleibt über alle Neuaufbauten dasselbe (`FUPA_EL`, `fupaEinsetzen` nach jedem `render`): FuPas `widget.js` beobachtet die Seite
  (MutationObserver) und füllt ein schon gefülltes Element nicht neu. Browser-Test mit echter Adresse (Seite per `page.route` unter
  fckoeppchen.github.io) und echtem Widget: vor Zustimmung 0 FuPa-Anfragen, danach Ticker da, Neuaufbau lädt keine Daten neu, Uhrzeit in
  Ortszeit richtig. Kosmetik (Schrift, Farben) im Widget-Builder.
  **Kopf des Widget-Kastens hellgrün wie der Heute-Kasten** (vom Nutzer, Fassung 30.10. neu e, `.fupakarte`), seit neu f auch mit grünem Rahmen. **Seit neu g alle Karten so** (vom Nutzer): `.card` 2 px grüner Rahmen, `.chead` hellgrün (#e6f6f2); aufklappbare Karten behalten den dunkelgrünen Kopf, der LIVE-Kasten seinen roten Rahmen. **Neu h** (vom Nutzer): Heute-/Morgen-Kasten und der heutige Tag in „Unsere Woche“ (alle `.heute`) mit **dunkelgrünem** Kopf, weißer Schrift, Rahmen dunkelgrün — das Aktuelle fällt sofort auf.
  **Widget aktualisiert sich nicht selbst** (30.10.2026 im FuPa-Skript nachgesehen: kein Takt, nur Knopf ↻ `.fp-liveticker-view-refresh-button`).
  Darum tippt die App ihn an (vom Nutzer, Fassung 30.10. neu o, `fupaAktualisieren`): jede Minute und sofort beim Zurückkommen in die App,
  nur sichtbar und nur 15 min vor bis 3 h nach Anpfiff (`data-anstoss` am Platzhalter). Mit echtem Widget im laufenden Spiel geprüft:
  1 Abruf beim Laden, +1 nach einer Minute, +1 beim Zurückkommen.
  **Neu p:** auch beim Zurückwechseln auf den Reiter mit dem Widget sofort (`FUPA_ZULETZT`); Neuaufbauten im selben Reiter lösen nichts aus (geprüft).
  **Neu q** (vom Nutzer): rote Rahmen um die Spielminute im Widget weg (`.fupaplatz .match-header-caption.live`, `.fp-caption-text.live`, `border:0!important`), grüner Balken bleibt.
  **„Unsere Woche“** (vom Nutzer, Fassung 29.10. neu b): bei Seniors-Spielen mit Widget 15 min vor bis 3 h nach Anpfiff „🔴 läuft ·
  **Liveticker von FuPa im Reiter**, falls jemand tickt“ (ob jemand tickt, weiß die App ohne Schnittstelle nicht). Bei 390 px angesehen.
  **Fassung 29.10. neu c** (vom Nutzer): im Widget-Kasten „Tore aufs Handy? Mit der FuPa-App dem FC Koeppchen folgen.“ (Link zur
  Mannschaftsseite bei FuPa, `FUPA_TEAM` m1/mr1/mr2 ohne Saison — FuPa leitet auf die aktuelle weiter; neu d) — Tor-Mitteilungen gibt es ohne Schnittstelle nicht.
  **BGL-Tabelle wieder von der FLF** (vom Nutzer, 29.10.2026: FLF-Tabelle wieder aktuell, 11 Spiele, mit Swifts −12; FuPa für die BGL ganz
  raus): `FUPA.bgl` in `tools/fupa-modus.mjs` = false. Hinkt die FLF-Tabelle nach, rechnet die App selbst (`bglTabelle`, Punktabzug aus der
  FLF-Tabelle). FuPas Begründungstext zum Abzug entfällt. Roude Léiw bleibt bei FuPa (FLF fragen: vom Nutzer nicht gewollt, sonst stünde
  auch das Extranet zur Frage; die FLF-Webseite lädt die Länderspiele von Clubee nach — gleiche Lage wie FuPa, nicht genutzt).
- **Mitteilungen für alle — vorbereitet, noch aus** (vom Nutzer, 30.10.2026, Fassung 30.10. neu a): `MITT_FUER_ALLE` in `index.html`
  (false). Auf sein Go → true: alle sehen das Zahnrad (`mitt()` statt `mtest()` in `zahnradZeigen` und beim Start-Aufräumen — sonst
  räumte `swAufraeumen` die Abos normaler Nutzer weg; leerer Code beim 5×-Logo schaltet dann nur Test/Coach aus, nicht das Abo), Tore und
  Coach bleiben beim eigenen Code (`mTore`, `coachDa`). Einmaliger Hinweis oben „🔔 Neu: Mitteilungen … nach und nach frei …“ mit ✕
  (`mittHinweis`, `fussball_v1_mhinweis`; Text vom Nutzer abgenommen), im Browser mit Link „so installierst du sie“ → Zahnrad mit
  Anleitung. **Phasen über `MAX_ABOS`** bei Cloudflare (erst ~30–35, die Tester-Handys zählen mit; dann ~100; ab mehreren hundert `PAKET`
  hoch nach Blick auf die Rechenzeit, ggf. Bezahlplan 5 $). Browser-Test: aus = wie vorher (normal kein Zahnrad, Tester schon), an =
  Zahnrad + Hinweis, Link öffnet Anleitung, ✕ bleibt auch nach Neuladen weg.
- **Begrüßung beim ersten Öffnen — vorbereitet, noch aus** (Fassung 30.10. neu b, Plan und Texte in IDEEN.md): `BEGRUESSUNG` in
  `index.html` (false), Kasten oben mit Koeppi-Fahne, DE/FR/EN-Knöpfe (vorausgewählt nach `navigator.language`), „Los geht's“ →
  `fussball_v1_willkommen`. Solange er steht, kommt der Mitteilungen-Hinweis nicht (`willkommen() || mittHinweis()`), danach schon.
  **`?reiter=<id>`** in der Adresse setzt einmal den Reiter und wird gleich wieder entfernt (`history.replaceState`) — für die
  Umzugsseite der alten App; sonst landete er in der Home-Bildschirm-Adresse. Browser-Test: Sprachwechsel bleibt bei Takten, „Los
  geht's“ bleibt nach Neuladen weg, danach Mitteilungen-Hinweis, `?reiter=45404` → Seniors 3 und Adresse ohne Parameter.
- **Haken in der Mitteilungs-Liste auf `?zahlen`** (vom Nutzer, 31.10.2026): `mittStatus` setzt vorn **✓** = an alle passenden Handys
  verschickt, **✓✓** (grün) = auch überall angekommen (Quittung `angekommen` ≥ `passend`), **⚠️** (rot) = nicht an alle (Fehler), „–“ =
  niemand hat es angehakt; Text dahinter wie vorher. Test mit Gegenprobe. **Worker neu einfügen nötig.**
  **Je Tag aufklappbar** (vom Nutzer, 30.10.2026): Mitteilungen nach dem Tag von „fällig ab“ gruppiert (`<details>`, heute offen, 7 Tage,
  höchstens 300). Datum **grün** = alles ✓✓ (oder „–“, niemand angehakt), **rot** nur bei einem Fehler (⚠️, ✗; vom Nutzer: „solange keine Fehlermeldung
  dasteht, ist alles ok“), sonst ohne Farbe (✓ ohne volle Empfangsbestätigung, oder es wartet noch). **Eigene Geräte nur 5 Tage** (`ICH_TAGE`): jedes Zählen löscht ältere Zeilen in `ich`. Tests mit Gegenprobe.
- **Neue Fassung von selbst laden** (vom Nutzer, 30.10.2026, Fassung 30.10. neu l, **ohne Hinweis**): iOS lädt die App beim App-Wechsel nicht
  neu, Eltern blieben tagelang auf alten Fassungen. `neueFassung()`: nach ≥ 30 min im Hintergrund (`UPDATE_PAUSE`) beim Zurückkommen `HEAD`
  auf die eigene Adresse (`cache: no-store`); ist der ETag als „unsere Fassung“ gemerkt (`fussball_v1_etag`), nichts. Sonst die Datei holen,
  `FASSUNG` herauslesen, anders → `location.reload()` (Reiter bleibt in localStorage). Nicht bei offenem Zahnrad/Coach, nicht unter file://,
  dieselbe neue Fassung höchstens einmal je Stunde (`fussball_v1_neuGeladen`, gegen Schleifen, falls ein Zwischenspeicher die alte liefert).
  Daten-Commits der Action ändern index.html nicht → kein Neuladen. GitHub Pages bis 10 min Verzug. Browser-Test mit nachgebautem Server
  (10 min nichts, 40 min HEAD+GET, dann nur HEAD, Coach offen nichts, neue Fassung lädt neu mit Reiter, alter Zwischenspeicher keine Schleife).
  **Wirkt erst ab dieser Fassung** — wer noch eine ältere offen hat, muss einmal ganz schließen.
  **Neu m** (30.10. nachmittags, vom Nutzer gesehen: iOS öffnete die App aus einem alten Zwischenspeicher, ohne die grünen Kästen,
  erst ganz schließen half): Prüfung **auch 5 s nach jedem Start**, und **nur vorwärts** (`fassungWert`: Datum + Buchstaben a…z, aa…;
  unbekanntes Format → nie neu laden) — eine ältere Fassung vom Server lädt nie. Browser-Test: alte Kopie geöffnet → lädt neue, Server
  älter → bleibt.
- **„📡 Live von FuPa“ nur für eigene Geräte** (vom Nutzer, 30.10.2026, Fassung 30.10. neu n; Bauplan in IDEEN.md): App bleibt für alle gleich
  (`FUPA_API` false), nur Live-Mitteilungen kommen zurück — für Geräte mit eigenem Code („pro“) oder **Familien-Code** (`FAM_HASH`, Merker
  `"familie"`: Mitteilungen + 📡, kein Coach, kein „eigenes Gerät“; Wortlaut nur beim Nutzer). Zahnrad: gestrichelter Kasten „📡 Nur für dich:
  Live von FuPa“ (`liveKasten`, `.livekasten`), Haupt-Haken „Live-Mitteilungen an“ (`fussball_v1_livean`; aus → „· live“-Auswahl geht nicht
  zum Worker), Seniors 1–3 + Roude Léiw mit Ticker/Halbzeit/Tor/Endstand, Auswahl unter `"Seniors 1 · live"` (`LIVE_ZUSATZ`). Abruf
  (`tools/mitteilungen.mjs`, `LIVE_TEAM`): bei `FUPA.api` false Live-Kandidaten mit `reiter: ["… · live"]`, Titel „📡 Seniors 1“, ids
  `lticker:`/`lhalbzeit:`/`ende-live:` (Nati `lnticker:`/`lnhalbzeit:`/`nende-live:`) — der FLF-Endstand `ende:` bleibt für alle (bei ihm
  kommt der Endstand also zweimal, vom Nutzer so gewollt). **Worker:** `liveGewollt(abos, c)` — FuPa nur, wenn ein Abo für den Kandidaten
  eine Live-Art gewählt hat; `slugZu(anstoss, kurz)` sucht jetzt auch `mr1`/`mr2` (live_slug-Schlüssel `mr1|<anstoss>`). `reserveHolen`
  bleibt aus. Tests (fussball.mjs 400): ohne Abo 0 FuPa-Anfragen, Suche mr1, nur ans „· live“-Abo, eigene Endstand-id; Gegenproben.
  Browser: Kasten mit Familien- und eigenem Code, nicht mit Tester-Code, Auswahl/Haupt-Haken richtig zum Worker. **Worker neu einfügen nötig.**
- **Kasten „Letztes Spiel“ oben** (vom Nutzer, 30.10.2026, Fassung 30.10. neu r, `letztesHtml`): nach dem Spiel bis zum Vortag des nächsten
  (Heute-/Morgen-Kasten übernimmt), höchstens 7 Tage. **Seniors 1–3:** „Letztes Spiel · Endstand“, Datum + Spieltag, Ergebnis groß in Grün
  (`.letztes .gross`), darunter Klasse und „jetzt n. Platz“ (kein Sieg/Niederlage — vom Nutzer: sieht man am Ergebnis), nur mit FLF-Ergebnis,
  keine Trainer-Spiele. **Jugend:** „Letzter Spieltag“ mit Koeppi (ball-faust), „Super gemacht“ + Spruch (`nachDemSpiel`), Spiel klein wie in
  der Liste (`spielZeile`; U7/U9/U11 „gespielt“), Bambinis ohne Gegnerzeile („Mini-Spieltag in Wormeldange mit …“, `ortKurz`), nächstes Spiel.
  Der grüne Koeppi-Streifen in „Unsere Ergebnisse“ ist dafür weg, das Spiel steht dort wieder normal. Browser mit gestellter Uhr (Seniors 1/3,
  MIN 1, PUP 2, BAM 1, keine Fehler).
  **Neu s** (vom Nutzer): Platz erst, wenn die FLF-Tabelle nachgezogen ist (`tabelleFertig` in der App, gleiche Regel wie die Mitteilung „Tabelle“), sonst nur die Klasse; Bambinis mit vollem Platz „📍 Am Ga (Wormeldange, synth.)“ statt nur Ort. Browser: Tabelle hinkt → ohne Platz.
- **Pokal bei den Kindern: keine Ergebnis-Mitteilung** (vom Nutzer, 22.10.2026, „so lassen“): „Spieltag komplett“
  und „Tabelle“ gibt es nur für Ligaklassen (CC), Pokal/Freundschaft lösen nur „Morgen/Heute Spiel“ aus.
- **Fassung neu j — Durchsicht 22.10.2026** (auf Wunsch des Nutzers, mit zweiter unabhängiger Prüfung): (1) Spiele mit
  **Uhrzeit offen (00:00)** galten ab 3 Uhr morgens am Spieltag als gespielt (kein Heute-Kasten, Spiel unter
  „Bisherige Spiele“, „Super gemacht“ schon vor dem Spiel) — betraf alle U9/U11-Spiele ab 14.11. (14 Spiele).
  Jetzt `istVorbei`: offen → erst am Tag danach, sonst 3 h nach Anpfiff (in `sicht`, `spieltagHeute`).
  (2) `wocheTage` rechnete in 24-h-Schritten: in der Woche der Frühjahrsumstellung (22.–27.3.2027, 23–24 Uhr)
  fehlte der Sonntag — jetzt Kalendertage (`tagPlus`). (3) `bisDahin` („morgen“/„in 2 Tagen“) nahm die
  Zeitzone des Handys statt Luxemburg (`tageZwischen`). Tests mit Gegenprobe. **Neu k:** bei offener Uhrzeit stand ab
  Mitternacht „Spiel läuft“ — `begonnen` jetzt nie bei Uhrzeit offen (Browser-Gegenkontrolle).
- **Fassung neu d** (22.10.): Woche ohne Spiele, Hinweis „Nächstes Spiel: … gegen …“ nannte bei Auswärtsspielen
  Koeppchen als Gegner (`heim` gab es dort nicht) — jetzt über `wir`. Gesehen beim Koeppi-Bild für den Nutzer.
- **Andere Länder und Roboter zählen getrennt** (vom Nutzer, 22.10.2026): Am ersten Tag öffneten 8 Scanner
  die neue Adresse (Cloudflare-Log: Amazon mit „HeadlessChrome“, Google, Palo Alto, Singapur, Toronto,
  Amsterdam), drei davon direkt nachdem der Nutzer sie im Staatsnetz (CTIE) geöffnet hatte — Firmennetze
  prüfen neue Adressen selbst. `fremdGrund(req)`: `user-agent`/`sec-ch-ua` mit HeadlessChrome/bot/crawler/
  spider oder `cf.verifiedBotCategory` → „Roboter“; Land (`cf.country`) außer LU, DE, FR, BE → das Land.
  Solche `zaehle`/`angesehen` gehen nur in die Tabelle `fremd` (tag, wer, n), Abschnitt „Andere Länder und
  Roboter“ auf `?zahlen`. Ohne `cf` (Test) zählt normal. `ich=1` geht vor. Die 9 Einträge vom 22.10.
  (8 Scanner + 1 Nutzer vor dem Code) stehen noch in den Hauptzahlen — **vor dem Start beim Verein
  Statistik auf null setzen** (D1-Konsole: Tabellen tage, reiter, arten, stunden, angesehen, erste leeren).

**Parallelbetrieb** (vom Nutzer: ein paar Tage beide vergleichen, bevor der Verein den Link verschickt).
In der Zeit **Änderungen nur hier**, die alte App bleibt stehen (nur bei echtem Defekt dort nachziehen).
**Danach** im alten Repo: `fussball.html` wird eine Umzugsseite (Logo, Text „umgezogen, damit sie für
den ganzen Verein leichter erreichbar ist“, Knopf zur neuen Adresse mit dem gewählten Reiter, Anleitung
alte App löschen / neue installieren); `fussball.yml` wird ein **Kalender-Spiegel** (kopiert die `.ics`
von hier, damit alte Abos weiterlaufen) **bis Ende 2026**, mit Hinweis „bitte neu abonnieren“ als
eigener Termin an den nächsten Spieltagen **und** in jedem Spiel (vom Nutzer: beides); Live-Action dort
aus. Koeppi (Maskottchen) erst nach dem Umzug (vom Nutzer), dafür ein Bild ohne Hintergrund vom Verein.
Vor „Mitteilungen für alle“ / dem Newschannel noch: FuPa fragen (am besten der Verein), ein Satz
Datenschutz in der App, ~~Versand in Pakete aufteilen~~ (gebaut 23.10., neu j), Worker-Grenze (100 000 Abrufe/Tag gratis; Live
seit 23.10. jede Minute je Handy) anschauen.

## Start beim Verein — Zeitplan (vom Nutzer, 22.10.2026: Montag 26.10. rausgeben)

- Do 22.10.: 22:25 Worker-Anstoß prüfen (Token/Cron). Statistik vom Nutzer auf null gesetzt (erledigt).
- Fr 23.10.: 18:00 Heim/Gast Beggen–Koeppchen II bei FuPa ansehen, danach Live-Kasten auf FLF-Reihenfolge
  (nur neue App). Abends erster echter „Morgen Spieltag!“ mit Koeppi; 19:00 Mitteilung „Morgen Spiel“ doppelt.
- Sa 24.10.: Kinderspiele (U13 Pokal 14:00). QR-Code für die neue Adresse machen.
- So 25.10.: Seniors. Abends nach dem „Go“ vom Nutzer: alte `fussball.html` → Umzugsseite, alte
  `fussball.yml` → Kalender-Spiegel mit Hinweis, alte Live-Action aus; Statistik prüfen, ggf. null.
  (Zeitumstellung in der Nacht 24./25.10. — Uhrzeiten in App, Kalender, Worker dabei mit ansehen.)
- Mo 26.10.: Verein verschickt Link + Einladungstext (4 Sprachen) + QR-Code + Koeppi-Text im Newschannel.
  **Verschoben** (vom Nutzer, 25.10.2026 abends): der Verein wartet erst FuPas Antwort ab. Bis zum „Go“ des Vereins bleibt die alte
  App unverändert (kein Umzug, kein Kalender-Spiegel); direkt vor dem Start Statistik prüfen/auf null.
- Danach: erste Woche Statistik und Worker-Last beobachten; FuPa (Nutzer: „später“); Mitteilungen für alle
  erst mit Versand in Paketen; 5×-Schalter ausbauen (vorher fragen); Android-Test; Kalender-Spiegel Ende 2026 aus.

**Erinnerung Phase 2** (vom Nutzer, 22.10.2026): geplante Aufgabe „Phase 2 Rundschreiben prüfen“ (jeden Montag
8:31): sobald U13/U15 eine neue Ligaklasse haben und in `REGELN` nichts dafür steht, den Nutzer ums Foto vom
neuen FLF-Rundschreiben bitten; danach die Aufgabe abschalten.
**U13 in Phase 2 vielleicht nur ein Team** (vom Nutzer, 23.10.2026): Ein Reiter bleibt heute die ganze Saison, sobald
die Mannschaft ein Ligaspiel hatte. 2025-26 hatte die U13 in Phase 1 „FC Koeppchen Wormeldange“ + „II“, ab Phase 2 nur
noch das erste (ohne I). Dieses Jahr heißt es „… I“ — fällt das I weg, gäbe es einen dritten Reiter „U13“, sonst bleibt
„U13 2“ mit nur Phase 1 stehen. **Nicht vorab bauen** (vom Nutzer: „schauen wir uns zusammen an, wenn es soweit ist“, ein,
zwei Tage falsch ist nicht schlimm). **Dann eine Logik für beide Fälle bauen** (I bleibt / I fällt weg), damit es in künftigen
Saisons von selbst stimmt (vom Nutzer). Die Montags-Aufgabe „Phase 2 Rundschreiben prüfen“ erinnert daran. Vorgeschlagene Regel, falls nötig: Reiter weg, sobald eine andere Mannschaft derselben
Altersklasse eine neuere Ligaklasse begonnen hat; alte Spiele unter „frühere Phasen“ beim verbliebenen Reiter.

## Fußball (`fussball.html`) — Stand und Regeln

Nutzer: Laurent; seine Kinder spielen bei den **U13 Minimes des FC Koeppchen Wormeldange**
(Luxemburg). App-Name „FC Koeppchen“, Logo vom Nutzer (eingebettet als PNG, 180 px, 32 Farben).
**Vereinsfarben**: weiss, schwarz, ein bisschen Grün (Türkis aus dem Logo) — vom Nutzer so
gewünscht, darum hell und nicht dunkel wie die anderen Apps. Zeigt ohne Suchen: nächste Spiele,
Tabelle, eigene Ergebnisse, alle Spiele der Klasse, frühere Phasen aufklappbar (aufklappbare Karten mit Knopf „Anzeigen ▾“/„Zuklappen ▴“, vom Nutzer, Fassung m; Spieltag-Zeilen darin grün und fett mit Linie, `.tag`, Fassung n). Einzeldatei,
iPhone-Regeln der Pizza-App.

**Mannschaften** (vom Nutzer, 18.10.2026; **seit 23.10. U15 vor U13**, vom Nutzer): Reiter in dieser Reihenfolge **Seniors 1, U15, U13 1, U13 2,
U11 1, U11 2, U9 1, U9 2, Seniors 2, Seniors 3**, dann BGL, Roude Léiw (Platz der Altersklasse = `reihe` in `AGES`; der Index in `AGES` bleibt, Tests und `ak` hängen daran) (Seniors 2/3 = Réserves I/II). Beim allerersten Öffnen steht die App auf „Unsere Woche“, danach auf dem zuletzt gewählten Reiter (vom Nutzer, 20.10.2026, Fassung l; vorher U13 1). Beschriftung arabisch
(„U13 1“, nicht „Mannschaft I“). Reihenfolge und Auswahl stehen in `AGES` in
`tools/fussball.mjs` (ageCategoryId: U13 4, U15 11, U11 7, U9 5, Seniors 1). Réserves sind bei der FLF eine
eigene Kategorie (9999, „Seniors (R)“). Bewusst nicht dabei: U7 (zwei Bambini-Teams gemeldet, aber noch kein Spiel — bei
keinem Verein; letzte Saison ab Mitte Dezember), Mädchen/Dames (spielen als ENT
Wormeldange/Munsbach/Hostert). Weitere Mannschaften: Eintrag in `AGES`, sonst nichts.
**U9 und U11: die FLF veröffentlicht weder Ergebnisse noch Tabelle** (`showResult`/`showRanking`
false). Die App zeigt dort nur Termine und blendet Ergebnisse auch dann aus, wenn die
Schnittstelle eins liefern sollte. Freundschaftsspiele (FM) liegen landesweit in einer Klasse
„Amicaux 1/2“ — davon nur die eigenen, keine fremden abrufen. „Nächste Spiele“ zeigt höchstens
fünf (Seniors hätten sonst die halbe Saison dort).
**BGL League und Roude Léiw** (vom Nutzer, 19.10.2026; „BGL League“ vom Nutzer — die FLF schreibt
„BGL Ligue“, unter diesem Namen wird die Klasse gesucht). **Reiter: „BGL“ und das FLF-Logo**
(`FLF_LOGO`, vom Nutzer als Bild, 55×72; Knöpfe in alter Größe, längere Texte passten nicht).
Bei den BGL-Spielen steht das Stadion (`ort`). Beide Reiter schwarz wie alle (grün ausprobiert, vom Nutzer verworfen: „sieht nicht gut aus“). **Roude Léiw** hat den
„Heute Spieltag“-Kasten (`heuteHtml`, gemeinsam mit den Mannschaften; Stadion per Einzelabruf
`matches/<slug>` für die nächsten drei Spiele, die Liste hat keins) und einen **Liveticker** (vom
Nutzer, 19.10.2026): FuPa tickert die Länderspiele (z. B. Yann Ferreira). `natiSpiel` bringt den
FuPa-`slug` mit, `natiLiveSpiel` (Fenster wie Seniors 1), `liveBasis` baut das Gerüst mit Slug, die
App fragt den Worker direkt — **kein GitHub-Lauf, keine live.json**; ohne Worker kein Ticker, das
Ergebnis kommt dann mit dem nächsten Abruf. Der Worker lässt dafür Slugs mit `luxemburg-m1` durch
(**neu einfügen nötig**). `liveHtml` ist gemeinsam; fett steht die eigene Seite (`wir`), vorher war
bei den Seniors immer die Heimmannschaft fett — falsch bei Auswärtsspielen. zwei Reiter hinter den Mannschaften
(`extraReiter`, `id` „bgl“/„nati“ als Text), ohne Kalender, Ticker, Spieltag-Kasten. **BGL**:
Spiele aus der FLF (`bglHolen`, Klasse per Name, Nummer wechselt je Saison), zuletzt gespielter
Spieltag (`bglSicht`, auch angefangen) und die **zwei** nächsten (vom Nutzer). **Tabelle von FuPa**
(`standings?competition=nationaldivision`, ohne Saison = aktuelle; vom Nutzer: das Original statt
selbst gerechnet), weil die FLF-Tabelle hinterherhinkt (19.10.: nach 8 Spielen, gespielt 10). FuPa
führt Punktabzüge samt Begründung (`text`, Swift Hesperange −12, wird angezeigt). FuPa schreibt
deutsch („Differdingen“) — `fupaTabelleMitFlfNamen` gibt jeder Zeile den FLF-Namen der Mannschaft
mit denselben Zahlen (Sp/S/U/N/Tore) aus den FLF-Ergebnissen, am 19.10. alle 16 eindeutig. Jede Zuordnung
wird **gemerkt** (`bgl.namen`, FuPa-`teamId` → FLF-Name, in data/fussball.json): am Saisonanfang
haben viele dieselben Zahlen, dann gilt das Gedächtnis (vom Nutzer). **Absicherungen** (vom Nutzer):
gemerkt wird nie überschrieben (Umbenennung von Hand in `bgl.namen`), neu zugeordnet nur bei
eindeutigen Zahlen auf beiden Seiten und ab 3 Spielen, kein FLF-Name zweimal — schlimmstenfalls
steht ein deutscher Name da, nie ein falscher. Gegenprobe gemacht. **Zieht die FLF mit ihrer Tabelle
irgendwann zeitnah nach, zurück auf die FLF-Tabelle umstellen** (vom Nutzer) — dann entfällt das. FuPa weg
→ FLF-Tabelle; hinkt die, rechnet `bglTabelle` in der App selbst (letzter Rückfall, mit Hinweis).
**Roude Léiw** von FuPa (`natiHolen`,
`luxemburg-m1-<Jahr>` für Vorjahr/Jahr/Folgejahr, `flavor` past+current); Tabelle über
`GET api.fupa.net/v1/standings?competition=<slug>&group=<round.slug>` (ohne Saison = aktuelle).
`natiGruppe` nimmt die Gruppe des nächsten Pflichtspiels (Gruppenrunde/Liga, kein Testspiel
= Kategorie 6, kein K.-o.), sonst des letzten — **Wechsel Nations League → Qualifikation von
selbst, aber noch nie echt gesehen**: beim ersten Qualifikationsspiel nachsehen, ob FuPa die
Gruppe genauso führt. Ergebnisse: die letzten acht. Fällt einer der Abrufe aus, bleibt der
alte Stand (der FLF-Abruf der Mannschaften läuft trotzdem durch).
**Heute-Spieltag-Kasten** (vom Nutzer, 18.10.2026): an jedem Reiter oben „Heute Spieltag! ⚽ Anstoß HH:MM“
mit Gegner und Ort (`spieltagHeute`, Tag in Luxemburger Zeit), ab Anstoß „Spiel läuft“; weg, sobald
die FLF ein Ergebnis hat oder 3 h nach Anstoß. Steht der LIVE-Kasten da, entfällt er. Der LIVE-Kasten kommt erst mit Stand, Tickerer oder Tor — FuPa setzt ab Anpfiff von selbst „LIVE“, auch ohne Tickerer (19.10., Fassung s). Ohne Tickerer heißt es ab Anpfiff „erscheint hier, falls bei FuPa jemand tickert“, ab 15 min danach „Bisher tickert niemand … Ergebnis kommt, sobald die FLF es einträgt“ (vom Nutzer, Fassung t). Stadion überall mit 📍 davor, nur bei kommenden Spielen (vom Nutzer, 20.10., Fassung a/b). BGL-Reiter bewusst anders als die Mannschaften: Tabelle, zuletzt gespielter Spieltag, nächste Spieltage (vom Nutzer, 20.10.: einheitlich ausprobiert, Tabelle zuerst ist besser). Datum im Spieltag-Kopf größer (`.tagdatum`, 15 px). **Ideen und Vorgemerktes stehen in `IDEEN-fussball.md`** (Mitteilungen „Spieltag komplett“/„Tabelle aktualisiert“ u. a.). Forfait mit Termin in der Zukunft (Larochette gegen Koeppchen II, 5.12. und 3.5., von der FLF schon gewertet) heißt „Forfait, im Voraus gewertet“ und bleibt oben in den Ergebnissen (vom Nutzer, Fassung d). **Unsere Woche** (vom Nutzer, 20.10.2026, Fassung f): breiter Knopf über allen Reitern
(`.seg button.woche`, `grid-column:1/-1`, Vereinslogo links/rechts) mit „· n Spiele“, „· heute n Spiele“
oder „· 🔴 n Spiele gerade LIVE“. Reiter `"woche"`: alle Spiele aller Koeppchen-Reiter Mo–So
(`wocheTage`, ab So 22 Uhr die nächste Woche), je Spiel einmal (`wocheSpiele`, Pokal ohne I/II heißt
„U13“), nach Tagen; Zeile = `spielZeile` mit Schild der Mannschaft (`.pill.wteam`, 14 px, vom Nutzer: größer, Fassung k), 🏠/✈️, Uhrzeit oder „läuft“/
„🔴 LIVE · Minute“ (rot), 📍 Stadion bis die FLF ein Ergebnis hat; Tippen öffnet den Reiter
(`data-gehe`). Kopf: Zeitraum, „n Spiele, davon m zu Hause“, nach dem Wochenende die Bilanz
(`wocheBilanz`). „gleichzeitig mit …“ bei < 90 min Abstand und anderem Platz. Live: `liveKandidaten`/
`holenWorkerAlle` fragen den Worker **seit 23.10. (Fassung neu i, vom Nutzer) jede Minute** (vorher 20 s; 100 000 Aufrufe/Tag gratis, der Ticker war der Hauptverbraucher) für jedes Spiel im Live-Fenster (Seniors 1–3), egal
welcher Reiter offen ist; `WS` = Stand je FLF-Spiel. Bei vertauschtem FuPa-Spiel dreht die Woche die
**Zahlen** (FLF-Namen bleiben), der Live-Kasten im Reiter noch die **Namen** — vom Nutzer entschieden:
auch der Kasten bekommt die FLF-Reihenfolge, **aber erst nach dem Blick am Fr 23.10.** — **Blick gemacht, nicht umgebaut** (vom Nutzer, 23.10.: FuPa hatte das Spiel bis 18 Uhr selbst richtiggestellt; „wird sicher während einem getickerten Spiel korrigiert sein“). Kasten bleibt bei FuPas Reihenfolge, Woche/Endstand drehen weiter die Zahlen (67 von 68
FuPa-Spielen der Saison haben dieselbe Reihenfolge wie die FLF, nur Beggen–Koeppchen II nicht).
Vereins-Zusätze (Platzbelegung, Woche teilen, Heimspiel-Kalender) zurückgestellt → `IDEEN-fussball.md`.
Reiter-Raster: Handy 4 je Reihe, ab 600 px 6 je Reihe; letzte Reihe teilt sich die Breite (`reiterBreiten`, seit 25.10. neu h).
**Anonymer Zähler** (vom Nutzer, 20.10.2026): App meldet `WORKER_URL?zaehle=1&neu=0|1&reiter=…` nach
dem ersten Laden und nach ≥ 30 min im Hintergrund; `neu` merkt sich nur das Handy
(`fussball_v1_gezaehlt` = Tag). Worker schreibt in **D1** (Binding `DB`, Tabellen `tage`, `reiter`, legt
sie selbst an), ohne Binding still 204. Ansehen: `WORKER_URL?zahlen` (30 Tage; seit 21.10. auch je Tag aufklappbar mit Uhrzeit, angesehenen Reitern und Reitern beim Öffnen, vom Nutzer — Worker neu einfügen nötig). **Neue Nutzer** (vom Nutzer, 21.10., Fassung 21.10. a): beim allerersten Öffnen `erst=1` (`fussball_v1_erst`), Tabelle `erste` je App/Browser, Spalte „Neu“. Wer schon Daten der App hat (`fussball_v1`, `_data`, `_gezaehlt`), wird still als „vorher“ markiert und zählt nicht. Safari → Home-Bildschirm zählt dort noch einmal neu (getrennte Speicher). **Eingerichtet vom Nutzer am 20.10.2026** (D1 `koeppchen-zahlen`, Binding `DB`, Code neu
eingefügt, damit auch 22:15 Ortszeit); geprüft: zaehle 204, zahlen 200, fremder Slug 400. Ein Testaufruf von
Claude zählt am 20.10. als eine Öffnung. **Seit Fassung h** (vom Nutzer): `art=app|web` (Home-Bildschirm/Browser, je Handys / Öffnungen; Safari und Home-Bildschirm haben getrennte Speicher, wer beides nutzt, zählt doppelt) und die Stunde in Ortszeit (`stundeLux`, nimmt der Worker selbst), Tabellen `arten`, `stunden`. **Seit Fassung i** (vom Nutzer): `?angesehen=1&reiter=…` bei jedem Umschalten auf einen anderen Reiter (Knopf oder Tippen in der Woche, derselbe zweimal hintereinander zählt einmal), Tabelle `angesehen`; der Reiter beim Öffnen zählt dort mit. Zählt nicht als Öffnung; hin und zurück (Seniors 1 → U9 1 → Seniors 1) zählt zweimal, so gewollt (vom Nutzer: „passt so“). **Worker eingefügt vom Nutzer am 20.10., geprüft.** **Fassung j:** am Computer zählte jedes Öffnen doppelt (vom Nutzer gemeldet; im Testbrowser nur einmal — vermutlich Vorladen von Chrome/Edge beim Tippen der Adresse). Darum: bei `document.prerendering` erst beim Anzeigen zählen, nur sichtbar, und höchstens eine Öffnung je Minute (`fussball_v1_zuletztGezaehlt`). Vom Nutzer am Computer bestätigt: zählt jetzt einfach. Test mit nachgebautem D1, Gegenprobe gemacht.
**Versteckte 5×-Tipp-Schalter — später beide wieder ausbauen** (vom Nutzer, 21.10.2026): (1) „Gemacht von Laurent R.“ = eigenes Gerät in der Statistik (unten), (2) Vereinslogo oben = Mitteilungen testen (geplant, `IDEEN-fussball.md`, Stufe 1/2). Wenn die Mitteilungen für alle kommen bzw. der Nutzer nicht mehr baut: beide Schalter samt Merker (`fussball_v1_ich`, Test-Merker) aus der App nehmen, beim Statistik-Schalter auch `ich` im Worker und den Abschnitt „Eigene Geräte“ — **vorher den Nutzer fragen**.
**Mitteilungen Stufe 1 gebaut** (vom Nutzer, 21.10.2026, Fassung 21.10. c; Plan in `IDEEN-fussball.md`). **Letzter Stand ohne Mitteilungen: Commit `260fc72`** (Fassung 21.10. b) — dorthin zurück, falls etwas schiefgeht. 5× aufs Vereinslogo oben → Merker `fussball_v1_mtest` → Zahnrad ⚙️ rechts im Kopf → Kasten `#mitt` über `main` (nicht in `main`, das wird ständig neu gebaut): Hinweis „nur vom Home-Bildschirm“ (`istApp`), „App neu anlegen“ ohne `PushManager`, „in Einstellungen erlauben“ bei `denied`, sonst „Mitteilungen erlauben“ → `Notification.requestPermission()` **zuerst, direkt im Tippen** (iOS), dann `fussball-sw.js` mit `scope: "./fussball.html"` (andere Apps im Repo unberührt), Schlüssel vom Worker (`?push=schluessel`), `pushManager.subscribe`, `?push=anmelden`. Danach „Test-Mitteilung senden“ (`?push=test`) und „Abmelden“. **Rückweg:** ohne Merker räumt die App beim Start Abo und Service Worker ab (`swAufraeumen`). `fussball-sw.js` hat nur `push` (zeigt immer eine Mitteilung — iOS-Pflicht) und `notificationclick`, **kein `fetch`**. `fussball.webmanifest` (`display: standalone`; iOS nimmt weiter das apple-touch-icon) — nur für neu angelegte Home-Bildschirm-Apps wirksam. **Worker:** `?push=schluessel|anmelden|test|abmelden` (POST als Text, kein Preflight), VAPID-Schlüssel erzeugt er beim ersten Mal selbst in D1 (`push_schluessel`), Abos in `abos` (`test` = 1), nur Push-Dienste von Apple/Google/Mozilla/Microsoft, Test höchstens alle 20 s, 404/410 löscht das Abo. Verschlüsselung RFC 8291 (`verschluesseln`), VAPID RFC 8292 (`vapidKopf`, `sub` = App-Adresse); **gegen `http_ece` gegengeprüft** (fremde Umsetzung entschlüsselt unsere Nachricht), Test entschlüsselt selbst und prüft die Unterschrift, Gegenprobe (vertauschte Schlüssel) bricht ab. Browser-Test mit Webserver, nachgebautem PushManager und Erlaubnis. **Am iPhone geprüft (21.10.2026, 14:23):** Test-Mitteilung kam an, mit Vereinslogo. iOS schreibt darunter selbst „from FC Koeppchen“ — der Titel „FC Koeppchen“ doppelt sich also; echte Mitteilungen bekommen darum einen eigenen Titel (z. B. „U13 1 · Heute Spiel“).
**Mitteilungen Stufe 2 gebaut** (vom Nutzer, 21.10.2026: „alle sofort einbauen“, Fassung 21.10. d; weiterhin nur für ihn hinter dem 5×-Logo). **Ablauf:** der FLF-Abruf (`tools/fussball.mjs` → `tools/mitteilungen.mjs`, `ereignisse(alt, neu, vorher, now)`) vergleicht alten und neuen Stand und schreibt `data/mitteilungen.json` (`ereignisse` mit `id`, `reiter[]`, `art`, `titel`, `text`, `ab`, `bis`; `live` = Seniors- und Länderspiele von heute). Der Worker (`scheduled`, **seit Fassung h jede Minute**, Cron `* * * * *` (**vom Nutzer am 21.10. bei Cloudflare umgestellt, „Every minute“ bestätigt**) — vom Nutzer: „Ticker läuft“ soll gleich kommen, nicht erst nach 15 min; `abrufFaellig` stößt den FLF-Abruf weiter nur zu den Viertelstunden an, Test prüft es Minute für Minute; `mitteilungenSenden`) liest die Datei über raw (bis 5 min Cache, also bis ~6 min Verzug nach dem FLF-Abruf), prüft die Live-Kandidaten selbst bei FuPa (`liveEreignisse`: Ticker erst mit Stand/Tickerer/Tor und `LIVE`; Endstand bei `POST`, Zahlen nach FLF gedreht, wenn FuPa Heim/Gast vertauscht) und schickt an Abos mit passender `wahl` (`passtZu`: Mannschaft angehakt und Art angehakt; „Woche“ nur über den Mannschafts-Haken). **Jede id nur einmal** (Tabelle `gemeldet`, erst eintragen, dann senden), Live-Ereignisse warten in `offen`. **Nur 7–23 Uhr** (`tagzeit`; bis 23.10.2026 7–22, vom Nutzer verlängert, damit Endstände der Abendspiele noch am Abend kommen; Hinweis im Zahnrad und auf `?zahlen` mitgeändert), sonst wartet es bis `bis`. Arten und Texte: Spiel steht an (vom Nutzer, Fassung f: **Kinder am Vorabend 19:00 „Morgen Spiel“, Seniors und Roude Léiw am Spieltag 10:00 „Heute Spiel“**, Seniors-Anstoß vor 11 Uhr 7:30; Kinderspiel erst am Spieltag bekannt → „Heute Spiel“ ab 7:30, gleiche id), Spieltag komplett (U13, U15, BGL; mit unserem Ergebnis), Tabelle (U13, U15, Seniors; wenn unsere Zeile mehr Spiele hat: „jetzt 2. Platz (vorher 3.)“), Uhrzeit steht fest (**nur U9/U11**, nur 00:00 → echte Zeit; geänderte Uhrzeiten nie, Seniors nie — vom Nutzer: die Zeit gibt der Trainer durch), Neue Phase / neues Spiel (**U13, U15**, vom Nutzer: neue Ligaklasse = eine Mitteilung „Spielplan … ist da“, sonst je neues Spiel, ab 4 auf einmal zusammengefasst; Spieltag und Tabelle prüfen alle Ligaklassen, damit beim Phasenwechsel nichts verloren geht), Liveticker läuft, **Halbzeit** (vom Nutzer, Fassung h: FuPa-`period` „halftime“ mit Stand, nur bei echtem Ticker) und Endstand (Seniors 1–3 über FuPa bzw. FLF, Roude Léiw über FuPa; gleiche id, also nur einmal), Unsere Woche (Mo 10:00, vom Nutzer). U9/U11 nie Ergebnisse. In der App unter dem Zahnrad **je Mannschaft eigene Arten** (vom Nutzer, Fassung 21.10. j: „bei U13 2 nur die Tabelle“): Mannschaft anhaken → darunter klappen genau ihre Arten auf (`mArtenFuer`: U13/U15 Spiel/Neu/Spieltag/Tabelle, U9/U11 Spiel/Uhrzeit, Seniors Spiel/Tabelle/Ticker/Halbzeit/Ende, BGL Spieltag, Roude Léiw Spiel/Ticker/Halbzeit/Ende, Woche nur der eine Haken), beim Anhaken erst alle an. Gespeichert als `{ je: { "U13 2": ["tabelle"] } }` (`_mwahl`, `?push=wahl`); die alte Form `{teams, arten}` liest die App um und `passtZu` versteht sie weiter. Haken, die es bei einer Mannschaft nicht mehr gibt, räumt die App beim Öffnen des Zahnrads weg und speichert einmal neu (`mAufraeumen`, Fassung l). Titel ohne „FC Koeppchen“ (iOS schreibt den App-Namen selbst dazu). **Zahnrad = eigener Reiter** (vom Nutzer, Fassung 21.10. e): `MITT_OFFEN` zeigt `#mitt` in `main`, das bei den Takten nicht neu gebaut wird; Reiter-Knöpfe und Tippen in der Woche schließen ihn, der Mannschafts-Reiter bleibt gemerkt. **Außerhalb der App** (vom Nutzer): iPhone in Safari → Anleitung „bitte installieren“ (Teilen → Zum Home-Bildschirm), Computer → Anleitung für iPhone und Android mit Adresse (`installHtml`), Android → Anleitung „App installieren“ (auch im Teilen-Text, Fassung 22.10. a; vom Nutzer, Fassung g: **Mitteilungen auf jedem Gerät nur in der installierten App, in jedem Browser nur die Anleitung**). Dafür hat `fussball.webmanifest` Symbole (`bilder/fussball-192.png`, `-512.png`, aus dem Vereinslogo, weißer Rand für Androids runde Maske), sonst legt Chrome nur ein Lesezeichen an, das im Browser aufgeht (`istApp` bliebe falsch). Auf Android nicht ausprobiert. **Zahnrad sehen weiterhin nur Geräte mit 5×-Logo** — für alle erst mit Stufe 3. Erster Lauf der Action mit Mitteilungen am 21.10. grün. Tests mit eigenen kleinen Daten (nicht den echten, die ändern sich), Versand mit nachgebautem D1 und Uhrzeiten; Gegenprobe gemacht. **Übersicht auf `?zahlen`** (vom Nutzer, 21.10.: „nicht nur was rausging, sondern ob alles rausging“): Abschnitt „Mitteilungen“ unten — Handys angemeldet/mit Auswahl, „Gewählt“ je Mannschaft und Art (bei mehreren Handys mit Anzahl, nie wer; vom Nutzer), heutige Live-Spiele, jede geplante Mitteilung (Datei + `offen` + `gemeldet` der letzten 7 Tage) mit Stand (`mittStatus`): ⏳ wartet, 🌙 wartet bis 7 Uhr, ✓ Zeit an n von m Handys (m = wer es angehakt hat, mit Fehlergrund), ✗ nicht verschickt (abgelaufen). Dafür hat `gemeldet` die Spalten titel, ab, an, passend, fehler, verpasst (`gemeldetSpalten`, legt der Worker selbst an). Ob das iPhone sie angezeigt hat, sieht der Worker nicht. **Grenze für Stufe 3:** Cloudflare gratis ~50 Abrufe je Takt, jede Mitteilung je Handy einer — für viele Nutzer muss der Versand aufgeteilt werden. **Worker neu einfügen nötig.**
**Eigenes Gerät** (vom Nutzer, 21.10.2026, Fassung 21.10. b: sein iPhone verfälscht beim Bauen die Zahlen): 5× innerhalb von 4 s auf „Gemacht von Laurent R.“ tippen → Nachfrage → `fussball_v1_ich`; dann gehen `zaehle` und `angesehen` mit `&ich=1`, der Worker schreibt nur in die Tabelle `ich` (`tag, was = oeffnung|umschalten`) und zeigt sie unten auf `?zahlen` getrennt. **Zahlen-Seite fürs Handy** (vom Nutzer, 21.10.: Haupttabelle zu breit): Tag als „Mi 21.10.“, „Öffn.“, Neu nur als Zahl (vor dem 21.10. „–“), App/Browser der Neuen im aufklappbaren Tag; bei 390 px geprüft. Fußzeile sagt „Dieses Gerät zählt nicht in der Statistik mit.“, nochmal 5× schaltet zurück. Safari und Home-Bildschirm einzeln einschalten. Was vorher gezählt wurde, bleibt drin (keine Kennung, nicht trennbar). **Worker neu einfügen nötig.**
Fußzeile nennt die Abrufzeiten genau (vom Nutzer): täglich 7:00, 12:00 (seit 27.10.2026, vom Nutzer) und 23:30, Mo–Fr 22:15, Sa/So 8–22
alle 15 min. Dafür rechnet der Worker den Wochentags-Abend seit 20.10. in Ortszeit (vorher 20:15 UTC).
**Karten-Link am 📍: geprüft und vom Nutzer verworfen** (20.10., „nur ein Gimmick“): FLF-`sportField` hat nur `id` und `name`; FuPa-`venue` hat lat/long und Adresse, aber nur Seniors/Nati und falsch, wenn FuPa das Spiel falsch führt. **Countdown** (vom Nutzer, 19.10.2026, alle
Reiter): 15 min vor Anpfiff wird daraus „Gleich geht's los! ⚽ · Anpfiff in n Minuten“
(`minutenBisAnpfiff`, aufgerundet, nicht bei Uhrzeit 00:00); ein 10-s-Takt führt die Minuten nach
und baut zum Beginn des Countdowns und beim Anpfiff neu (`UMSCHALT`). Bei Reitern mit Ticker steht
vorher „Liveticker, wenn verfügbar — sobald bei FuPa jemand tickert.“ (nicht mehr „startet mit dem
Anpfiff“: bei den Reserven tickert nicht immer jemand).

**Quelle:** Hinter https://extranet.flf.lu/match steckt `https://extranet.flf.lu/api/graphql`
(Angular-App), antwortet **ohne Anmeldung**, schickt aber **keine CORS-Freigabe** — der Browser
kann sie nicht direkt fragen. Darum: `tools/fussball.mjs` (Node, keine Abhängigkeiten) holt die
Daten. **Takt (Plan B, vom Nutzer 19.10.2026):** Der Cloudflare-Worker (`scheduled`, Cron
`*/15 * * * *`, `abrufFaellig()`) stößt `fussball.yml` per `workflow_dispatch` an — Sa/So 8–22 Uhr
Luxemburger Zeit jede Viertelstunde, Mo–Fr 22:15 Ortszeit (bis 20.10. 20:15 UTC), **jeden Tag 23:30** (vom Nutzer: Länderspiele
um 20:45 sind sonst erst am nächsten Morgen drin). **Und jeden Tag 7:00** (vom Nutzer, 20.10.: die FLF trug Seniors 2 vom 19.10. erst nach dem 23:30-Lauf ein; geholt hat es dann GitHubs Reserve um 00:56 statt 00:37). **Eingefügt vom Nutzer am 20.10., geprüft: Anstoß 7:00:23, Lauf grün.** GitHubs eigener Zeitplan bleibt als Reserve:
Sa/So stündlich (:17 UTC 6–20), Mo–Fr 19:17 UTC, täglich 22:37 UTC. Doppelte Läufe schaden nicht (`concurrency`,
Commit nur bei Änderung). Abwechseln GitHub/Cloudflare im Viertelstundentakt hat der Nutzer
vorgeschlagen, abgeraten: GitHub kommt ~20 min zu spät oder gar nicht, das gäbe Lücken.
Der Worker braucht das Secret `GITHUB_TOKEN` (Fine-grained, nur dieses Repo, Actions: Read and
write). **Eingerichtet vom Nutzer am 19.10.2026: Token ohne Ablaufdatum („No expiration“), Secret
unter „Runtime variables and secrets“, Cron Trigger „every 15 minutes“, neuer Code eingefügt**
(Länderspiel-Slug geprüft: 200). Wird das Token je gelöscht oder widerrufen, meldet der Worker
401 im Log und nur die Reserve läuft; dann neues Token anlegen und im Worker ersetzen. Ein „Neu laden“, das die Action startet, ginge nur mit einem GitHub-Schlüssel in der
öffentlichen Datei — abgelehnt; live ginge nur über einen eigenen Vermittler (Cloudflare Worker),
dem Nutzer als zu viel Aufwand vorgeschlagen. Einen „Neu laden“-Knopf gibt es darum nicht mehr
(hätte nur die Datei neu gelesen; das passiert beim Öffnen und bei `visibilitychange` ohnehin).
Die Action committet `data/fussball.json` nur bei inhaltlicher Änderung. Die App liest von
`raw.githubusercontent.com` (CORS `*`, 5 min Cache, wartet nicht auf GitHub Pages), Rückfall
`data/fussball.json` relativ, letzter Stand in localStorage (`fussball_v1_data`) für offline.
Achtung beim lokalen Arbeiten: Die Action committet auf `main` — vor dem Push `git pull --rebase`.
Unten in der App steht „Gemacht von Laurent R.“ mit dem Vereinslogo (vom Nutzer so gewünscht,
kein Fußball-Emoji). Darüber „App teilen“ (vom Nutzer): `navigator.share` mit seinem
Einladungstext (`TEILEN_TEXT`, Link darin). **Nur `text`, kein `url`** — mit `url` ließ iMessage
den Text weg (am iPhone gemeldet), WhatsApp nicht. Ohne Teilen-Leiste in die Zwischenablage.
**Fassung:** `FASSUNG` steht ganz unten — bei jeder Änderung an `fussball.html` hochzählen; am
iPhone läuft nach einem Push oft noch die alte Datei (Zwischenspeicher), erst Fassung prüfen lassen.

**Liveticker auch für Seniors 2 und 3** (vom Nutzer, 19.10.2026, Fassung q). FuPa tickert die Réserves
regelmäßig (2026-27: Seniors 2 4 von 6 Pflichtspielen, Seniors 3 alle 8; wechselnde Tickerer, oft
der Gegner). FuPa-Teams `fc-koeppchen-mr1-<Saison>` = Réserves I, `mr2` = Réserves II. **Worker
unverändert** (sucht per `?anstoss=` nur Seniors 1): Der FLF-Abruf holt die FuPa-Slugs vorab
(`reserveHolen`/`reserveSlugs`, Spiele gestern bis +3 Wochen, über `passendesSpiel`) nach
`D.fupa` (FLF-Spiel-ID → Slug); die App fragt den Worker damit direkt (`liveSpiel(v, now, fupa)`).
Ohne Slug (FuPa führt das Spiel noch nicht) kein Ticker. Kein GitHub-Lauf, keine live.json für die
Reserven. **Heim/Gast**: FuPa führte Beggen–Koeppchen II (23.10.) andersherum als die FLF (FLF
stimmt, Stadion in Beggen) — der Kasten nimmt dann FuPas Reihenfolge, sonst stünde der Stand
verkehrt (Slug beginnt mit der Heimmannschaft). Im Browser mit nachgebautem Worker geprüft.

**Live-Ticker Seniors 1 (gebaut 18.10.2026, vom Nutzer gewünscht).** Test am 18.10. gegen Beggen:
**die FLF trägt während des Spiels nichts ein** (alle Felder leer), **FuPa liefert live** Stand,
Minute, Halbzeit und Torschützen, sobald jemand am Platz tickert (am 18.10. Paul Krier, CEO von FuPa Luxemburg — sonst wechselnd: 2026-27 bei Seniors 1 zwölf verschiedene Tickerer in 19 Spielen, oft vom Gegner; Stand 22.10.). FuPa Luxemburg = Luxembourg Sports Network (LSN) sàrl, luxemburg@fupa.net; Mutter FuPa GmbH, Fürstenstein bei Passau.
`tools/fussball-live.mjs --wache` + `.github/workflows/fussball-live.yml`: **startet nur 4× am
Tag** (11:23, 14:23, 17:23, 19:23 Winterzeit; der letzte für Abendspiele bis ~22:40). Liegt in den nächsten 170 min ein Anstoß des Reiters
„Seniors 1“ (aus `data/fussball.json`), bleibt der Lauf an, wartet bis 15 min vorher, fragt dann
alle 2 min und committet selbst, bis 180 min nach Anstoß (oder Abpfiff + 2 Abfragen). 170 + 180
min < 6 h Laufzeitgrenze. 180 statt 150, weil Pokal mit Verlängerung und Elfmeterschießen 155–165
min ab Anpfiff dauert (vom Nutzer gefragt); ein Start steigt auch in ein laufendes Spiel ein.
`liveZeit` kennt Verlängerung/Elfmeter nur über Wortteile im FuPa-`period` (gesehen bisher nur
started/halftime/secondHalf) — beim ersten echten Pokalspiel mit Verlängerung nachsehen. Statt 288 Läufen alle 5 min — vom Nutzer so gewollt; ein Zeitplan, der
sich selbst umstellt, geht nicht (GITHUB_TOKEN darf keine Workflow-Dateien ändern). Anstöße der
Seniors 2025–27: 14:00 bis 20:00, meist So 16:00; ein Anstoß vor 11:30 oder nach ~22:40 fiele
durch. Ohne `--wache` fragt das Skript einmal ab (für Hand-Tests). **Push in jedem Takt**
(`sync()`): Am 18.10. ging der Abpfiff verloren — Rebase ohne Git-Namen scheiterte (Name hing nur
per `-c` am Commit), danach hielt der Lauf die lokale Datei für gespeichert. Jetzt `git config`
einmal, und jeder Takt schiebt nach, was noch nicht oben ist. Sonst FuPa-Teamslug aus https://www.fupa.net/club/fc-koeppchen
(`fc-koeppchen-m1-<2026-27>`), Spiel per gleichem Anstoß aus `window.REDUX_DATA` von
`/team/<slug>/matches` (Slug wird in `live.json` gemerkt), dann
`GET https://api.fupa.net/v1/matches/<slug>` (ohne Anmeldung, keine CORS-Freigabe): `homeGoal`,
`awayGoal`, `section` PRE/LIVE/POST, `live.{minute, period started|halftime|secondHalf, running,
lastTimestamp}`, `highlights[type=goal]` mit `primaryRole` und `team.teamSlug`. Geschrieben wird
`data/live.json` **nur bei inhaltlicher Änderung** (`gleich()` ignoriert `minute`/`minuteAt`) —
die App zählt die Minute selbst weiter (`liveZeit`, gedeckelt „45+“/„90+“), sonst gäbe es einen
Commit je 5 min. App: LIVE-Kasten oben im Reiter (`liveAnzeige`), nur bei LIVE/POST, weg sobald
die FLF ein Ergebnis hat oder 4 h nach Anstoß; holt `live.json` jede Minute, solange ein Spiel
im Fenster ist, und baut dann nur die Minute neu (`#liveZeit`), damit Aufgeklapptes offen bleibt.
Grenzen, dem Nutzer gesagt: leer ohne Tickerer, GitHub startet geplante Läufe oft verspätet.
**raw.githubusercontent hält Dateien bis 5 min** (`max-age=300`, am 18.10. geprüft: `?t=` hilft
**nicht**, zweiter Abruf mit anderem `t` war ein Cache-HIT) — über GitHub also 2–7 min Verzögerung.
**Schneller Weg: Cloudflare Worker** (`tools/cloudflare-worker.js`, vom Nutzer gewünscht): App
fragt `WORKER_URL?slug=<FuPa-Slug aus live.json>` jede Minute (bis 23.10. alle 20 s) — **oder, wenn live.json fürs laufende
Spiel noch nichts hat, `?anstoss=<FLF-Anstoß>`**: Dann sucht der Worker selbst (`GET api.fupa.net/v1/teams/
fc-koeppchen-m1-<2026-27>/matches?flavor=current`, Rückfall `past` → `passendesSpiel`, dritte
Kopie, Test prüft). **Nicht über die Webseite**: die gab dem Worker bei Cloudflare am 18.10.
„nicht gefunden“, lokal ging es. Gültige `flavor`: current, past (all/next/upcoming… → 422).
Der GitHub-Lauf sucht seitdem genauso (`fupaSpiele()`), die Webseite wird nirgends mehr gelesen; Saison aus dem Datum, ab Juli neu; nur
±36 h um jetzt; Fund 6 h gemerkt). `liveSpiel()` nimmt das Spiel aus dem FLF-Spielplan, nur für
Reiter „Seniors 1“; `liveBasis()` baut daraus ein Gerüst, `mitWorker()` füllt es (`W.fuer` =
FLF-Spiel-ID). Damit hängt der Kasten nicht mehr am pünktlichen Start des GitHub-Laufs (vom
Nutzer gefragt); der Lauf bleibt Rückfall. Der Worker fragt FuPa der Worker fragt FuPa höchstens
alle 20 s je Spiel (egal wie viele zuschauen), schickt CORS `*`, nur Koeppchen-Slugs. `mitWorker()`
legt seinen Stand über `live.json`; welches Spiel es ist, kommt weiter aus `live.json` (GitHub-
Lauf). Worker weg → GitHub-Stand. Karten im Kasten (`kartenArt`, `ereignisListe`, vom Nutzer gewünscht): FuPa führt sie in
`highlights` als `type: "card"` (gesehen: `card_red` gegen Mersch 11.10.); ob Gelb dort kommt, ist
offen. Seit Fassung h reicht der Worker `karten` mit durch — **neu einfügen nötig** (der alte gibt
nur `tore`; `mitWorker` übernimmt nur Felder, die er schickt, live.json füllt dann die Karten).
Torart im Kasten (`torArt`, vom Nutzer gewünscht) aus FuPas `subtype`; echte Namen am 18.10.
aus 11 Koeppchen-Spielen gesammelt: goal_shoot 34× (kein Zusatz), goal_headed 6× Kopfball,
penalty_foul 5× Elfmeter, goal_scrounger 3× Abstauber, goal_free_kick Freistoß, goal_own_goal
Eigentor, penalty_shootout Elfmeterschießen, goal_distance_shoot Fernschuss. Karten: nur
card_red 1× — Gelb führt FuPa in `highlights` offenbar nicht. `kuerzen()` im Worker und `liveAus()` im Lauf sind zwei Kopien
derselben Umrechnung, der Test prüft, dass sie gleich rechnen. `WORKER_URL` leer = nur GitHub. Eingerichtet vom Nutzer am 18.10.2026:
`https://koeppchen-live.rjtp6r9s9h.workers.dev/` (Cloudflare-Konto des Nutzers). Die Domain ist in der Umgebung freigegeben;
am 18.10. geprüft: liefert 2:1 POST mit drei Toren, CORS `*`, fremder Slug → 400.
Last: Seiten kommen über GitHubs CDN; GitHub begrenzt unangemeldete Abrufe je IP — viele Handys
hinter einer Adresse (Sportplatz-WLAN, Mobilfunk-NAT) könnten anstoßen, nicht geprüft; Rückfall
ist die Pages-Kopie. FuPa (`www.fupa.net`, `api.fupa.net`) ist in der Umgebung
freigegeben; `*.fupa.net` griff nicht. FuPa führt nur Seniors (m1, mr1, mr2) und Damen.

Schnittstelle, ausprobiert (Introspektion ist aus, Felder über Fehlermeldungen gefunden):
- `MatchCriteria`: `clubId, seasonId, matchTypeId (ALL|CC|CUP|FM|PLO), ageCategoryId, divisionId,
  teamId, startDate, endDate`. **`matches` ohne `startDate`/`endDate` → INTERNAL_SERVER_ERROR.**
  `rankings` braucht sie nicht.
- Verein: `clubId` 1003703 („Wormeldange FC Koeppchen“), U13 Minimes = `ageCategoryId` 4.
  Saison aus `defaultValues.currentSeasonId` — wechselt im Juli von selbst.
- **Eine Mannschaft = Altersklasse + Name, nicht die FLF-Nummer** (`ids`): Zur Phase 3 nach der
  Winterpause hat die FLF 2025-26 neue Nummern vergeben (U13 41766 → 43705, U15 41773 → 43706);
  Phase 1 → 2 blieb gleich. Ohne das gäbe es ab Februar zwei Reiter „U13 1“. `id` = erste Nummer
  (die gemerkte Auswahl bleibt gültig). Pokalteams mit gleichem Namen (U15, Réserves) fallen
  dadurch direkt in ihre Ligamannschaft.
- Teams (U13): I = 45396, II = 45397, im Pokal tritt der Verein als 45398 ohne I/II an. Mannschaften
  ohne Ligaspiel bekommen keinen Reiter, ihre Spiele erscheinen bei jedem Reiter **derselben
  Altersklasse** (`aufteilen()`, `ak`) — sonst stünde der U15-Pokal bei der U13.
- `finalHomeScore` vor `homeScore` (Endergebnis, z. B. nach Forfait). Uhrzeit 00:00 = noch nicht
  festgelegt, wird nicht angezeigt.
- Die Seite hat beim Ausprobieren einmal die Verbindung gekappt: Abfragen mit 1 s Pause, Wiederholung.

**Kalender-Abo** (vom Nutzer gewünscht; Abo statt Export, weil verschobene Spiele sonst nicht
mitwandern): Der Abruf schreibt je Reiter `kalender/<reiter>.ics` (z. B. `u13-1.ics`), die App
verlinkt `webcal://strakekine.github.io/panini-wm-2026/kalender/…` — **GitHub Pages** (liefert
`text/calendar`), nicht raw.githubusercontent. Darunter „Klappt nicht?“ mit der https-Adresse zum
Kopieren (Einstellungen → Kalender → Accounts → Andere → Kalenderabo). UID = FLF-Spiel-ID,
`DTSTAMP` fest (sonst neuer Commit bei jedem Lauf), Uhrzeit 00:00 → ganztägig, eigene Mannschaft im Titel
wie der Reiter („Koeppchen U13 1“, Pokal ohne I/II „Koeppchen U13“ — vom Nutzer, sonst waren U13 1
und U11 1 beide „Koeppchen I“), Dauer Seniors 2 h,
U9/U11 1:30, sonst 1:45. **Welche Spiele zu einem Reiter gehören, steht nur in
`tools/fussball.mjs`** (`reiter`, `mit`, `eigeneSpiele`) — App und Kalender lesen dasselbe.
**Am iPhone geprüft (18.10.2026):** Das Abo zieht Commits der Action nach (2:1 gegen Beggen kam
im Kalender an), Pages baut also auch nach Action-Commits neu.
**GitHub lässt Zeitpläne aus (18.10.2026):** Statt alle 15 min lief der FLF-Abruf nur um 14:37 und
18:09 (Ortszeit), der Live-Start um 18:23 gar nicht. Die FLF trug das 2:1 zwischen 18:10 und 19:30
ein; erst ein Handstart (`gh api -X POST …/actions/workflows/fussball.yml/dispatches -f ref=main`)
brachte es in App und Kalender. Möglich, dass es an den vielen Änderungen der Workflow-Dateien an
dem Tag lag — am nächsten Wochenende nachsehen. Dem Nutzer vorgeschlagen, noch offen: die
Live-Wache fragt nach Abpfiff eine Stunde lang alle 15 min selbst die FLF ab — überholt durch
Plan B (Worker stößt an). 18.10. abends: 20:17 → 20:39, 21:17 ausgelassen, 22:17 → 22:40. **19.10. (Mo): Plan B geprüft** — der Worker stieß pünktlich um 20:15:24 UTC an (`workflow_dispatch`, ohne Handstart, Lauf grün); GitHubs eigener Zeitplan (19:17 UTC) lief den ganzen Tag **kein einziges Mal**.

**Klasse wechselt während der Saison** (Phase 1 → 2): gesucht wird nach dem Verein, die Klassen
ergeben sich aus den Spielen. Die zuletzt begonnene Ligaklasse ist die aktuelle, die anderen
„früher“. Ist die aktuelle fertig gespielt und noch kein neues Ligaspiel da, steht oben der
Abschluss (Platz, Auf-/Abstieg) und „neue Klasse noch nicht eingetragen“.

**Auf-/Abstieg** (`REGELN`, Rundschreiben der FLF „Après la Phase 1 2026-2027“, vom Nutzer als
Bild): Kl. I 5./6. runter; II und III 1. hoch, 5./6. runter; IV 1./2. hoch, 5./6. runter; V 1.
jeder Serie und bester Zweiter hoch. Letzte Klasse (U13: VI) hängt laut FLF von den Anmeldungen
ab — dort wird **nichts markiert**, statt etwas zu behaupten. Das Rundschreiben gilt für **U13 und
U15** (für die U15 derselbe Wortlaut, vom Nutzer als Text); Seniors und U9/U11 werden nicht markiert. Regeln gelten je Saison +
Altersklasse + Phase;
für Phase 2 gibt es noch keine, ohne Regel keine Markierung. Neues Rundschreiben → neuer Eintrag.
Stand 18.10.2026: Phase 1 beendet, Koeppchen I Zweiter in Kl. IV → Kl. III; Koeppchen II
Fünfter in Kl. VI. Nächstes Spiel Pokal 1/32 am 24.10. gegen AS Hosingen.

**Testen:** `node test/fussball.mjs` — Aufbereitung aus nachgebauten Rohdaten, Regeln, Reiter,
Abschlusshinweis, 3-h-Grenze für Spiele ohne Ergebnis, Klassenwechsel. Schneidet `Logik`…
`Oberfläche` aus der HTML. Läuft auch vor jedem Abruf in der Action. Gegenprobe gemacht.
**Browser-Tests: Worker-Adresse sperren** (`page.route("**/fckoeppchen.rjtp6r9s9h.workers.dev/**", r => r.abort())`) — am 23.10. zählte ein Ladetest von Claude echt beim Worker (landete als „Roboter“ unter „Andere Länder“, nicht in den Hauptzahlen). Abruf live: `NODE_USE_ENV_PROXY=1 node tools/fussball.mjs` (in der Cloud-Umgebung braucht Node
den Proxy ausdrücklich).

**Wach halten:** GitHub schaltet Zeitpläne nach 60 Tagen ohne Repo-Aktivität ab; Abrufe ohne
Commit zählen nicht (Winterpause). Darum schaltet sich die Action am Ende jedes Laufs per
`gh api -X PUT …/workflows/fussball.yml/enable` selbst wieder ein (`actions: write`), ohne
Leer-Commits. Dass das die Frist zurücksetzt, ist übernommen (keepalive-workflow), nicht über
60 Tage selbst geprüft. Fällt sie trotzdem aus: Actions-Tab → „Fussball-Daten“ → Enable.
`stand` in der JSON ist der Zeitpunkt der letzten **Änderung** (geschrieben wird nur bei
Änderung), die App sagt darum „zuletzt geändert“, nicht „abgerufen“.
Am iPhone noch nicht ausprobiert.
