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
- **Beide 5×-Schalter fragen beim Einschalten nach einem Code** (vom Nutzer: „PROACCOUNT“), Groß/klein
  egal. Steht nur als SHA-256 in der Datei (`CODE_HASH`, `codeStimmt`) — hält Neugierige ab, kein echter
  Schutz (dem Nutzer so gesagt, „ja“). Ausschalten ohne Code. Die Statistik-Seite `?zahlen` bleibt ohne
  Code (vom Nutzer).
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
  kommen zu verschiedenen Zeiten). **Morgen/Heute Spiel zusammengefasst:** alle Spiele einer Altersklasse am selben Tag in
  einer Mitteilung („Minimes U13 · Morgen 2 Spiele“, je Zeile „U13 1: 10:00 gegen …“), id `heute:<id>+<id>`, Feld `spiele`;
  ein Spiel allein wie bisher `heute:<id>`. Noch nicht fällige (ab > jetzt) werden mit neuen Spielen neu gebaut, schon fällige
  decken ihre Spiele ab; ein später bekanntes Spiel kommt einzeln. Tests mit Gegenprobe.
- **Versand für viele Handys** (vom Nutzer, 23.10.2026, Fassung neu j, „Los“; Plan in `IDEEN.md`): **Postausgang** in D1
  (`postausgang`: id, endpoint, nachricht, bis, prio, zeit). Fällige Mitteilung → `gemeldet` (an 0, passend n) + je passendem
  Handy eine Zeile; jeder Minuten-Lauf schickt höchstens **`PAKET` = 10** (vom Nutzer: klein und sicher; erst nach Messung im
  Dashboard erhöhen), Live (ticker/halbzeit/ende) zuerst, nur 7–22 Uhr; `an` zählt je Erfolg hoch, Fehler je Art einmal in
  `fehler` (410 löscht das Abo, seine übrigen Zeilen laufen als „Handy abgemeldet“ durch; `bis` vorbei → „abgelaufen“).
  `?zahlen`: „⏳ wird verschickt: 10 von 25 Handys, 15 warten“. **Höchstzahl** (vom Nutzer, „Lösung 2“): `?push=anmelden`
  nimmt neue Handys nur bis `MAX_ABOS` (Cloudflare-Variable, ohne sie 50) → 409 `voll`, App löst dann das Abo wieder und sagt
  „Mitteilungen gibt es bald für alle – im Moment sind alle Plätze vergeben …“. **Empfangsbestätigung** (vom Nutzer): `sw.js`
  meldet nach dem Anzeigen `?push=angekommen&id=` (Feld `q` in der Nachricht, nicht bei der Test-Mitteilung), `gemeldet.angekommen`,
  „· angekommen auf 47“; zählt nur bekannte ids, ohne Kennung des Handys. Rechenzeit: Schlüssel und VAPID-Kopf (je Push-Dienst,
  6 h) bleiben im Speicher (`SCHLUESSEL`, `KOEPFE`). Tests: 25 nachgebaute Handys, Pakete, Vorrang, 410, nachts, abgelaufen,
  Höchstzahl, Quittung; Gegenproben gemacht. Mit altem Worker harmlos (Quittung → 405, kein 409).
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
auch der Kasten bekommt die FLF-Reihenfolge, **aber erst nach dem Blick am Fr 23.10.** (67 von 68
FuPa-Spielen der Saison haben dieselbe Reihenfolge wie die FLF, nur Beggen–Koeppchen II nicht).
Vereins-Zusätze (Platzbelegung, Woche teilen, Heimspiel-Kalender) zurückgestellt → `IDEEN-fussball.md`.
Reiter-Raster: Handy 4 je Reihe, ab 600 px 6 je Reihe (12 Knöpfe = 2 volle Reihen).
**Anonymer Zähler** (vom Nutzer, 20.10.2026): App meldet `WORKER_URL?zaehle=1&neu=0|1&reiter=…` nach
dem ersten Laden und nach ≥ 30 min im Hintergrund; `neu` merkt sich nur das Handy
(`fussball_v1_gezaehlt` = Tag). Worker schreibt in **D1** (Binding `DB`, Tabellen `tage`, `reiter`, legt
sie selbst an), ohne Binding still 204. Ansehen: `WORKER_URL?zahlen` (30 Tage; seit 21.10. auch je Tag aufklappbar mit Uhrzeit, angesehenen Reitern und Reitern beim Öffnen, vom Nutzer — Worker neu einfügen nötig). **Neue Nutzer** (vom Nutzer, 21.10., Fassung 21.10. a): beim allerersten Öffnen `erst=1` (`fussball_v1_erst`), Tabelle `erste` je App/Browser, Spalte „Neu“. Wer schon Daten der App hat (`fussball_v1`, `_data`, `_gezaehlt`), wird still als „vorher“ markiert und zählt nicht. Safari → Home-Bildschirm zählt dort noch einmal neu (getrennte Speicher). **Eingerichtet vom Nutzer am 20.10.2026** (D1 `koeppchen-zahlen`, Binding `DB`, Code neu
eingefügt, damit auch 22:15 Ortszeit); geprüft: zaehle 204, zahlen 200, fremder Slug 400. Ein Testaufruf von
Claude zählt am 20.10. als eine Öffnung. **Seit Fassung h** (vom Nutzer): `art=app|web` (Home-Bildschirm/Browser, je Handys / Öffnungen; Safari und Home-Bildschirm haben getrennte Speicher, wer beides nutzt, zählt doppelt) und die Stunde in Ortszeit (`stundeLux`, nimmt der Worker selbst), Tabellen `arten`, `stunden`. **Seit Fassung i** (vom Nutzer): `?angesehen=1&reiter=…` bei jedem Umschalten auf einen anderen Reiter (Knopf oder Tippen in der Woche, derselbe zweimal hintereinander zählt einmal), Tabelle `angesehen`; der Reiter beim Öffnen zählt dort mit. Zählt nicht als Öffnung; hin und zurück (Seniors 1 → U9 1 → Seniors 1) zählt zweimal, so gewollt (vom Nutzer: „passt so“). **Worker eingefügt vom Nutzer am 20.10., geprüft.** **Fassung j:** am Computer zählte jedes Öffnen doppelt (vom Nutzer gemeldet; im Testbrowser nur einmal — vermutlich Vorladen von Chrome/Edge beim Tippen der Adresse). Darum: bei `document.prerendering` erst beim Anzeigen zählen, nur sichtbar, und höchstens eine Öffnung je Minute (`fussball_v1_zuletztGezaehlt`). Vom Nutzer am Computer bestätigt: zählt jetzt einfach. Test mit nachgebautem D1, Gegenprobe gemacht.
**Versteckte 5×-Tipp-Schalter — später beide wieder ausbauen** (vom Nutzer, 21.10.2026): (1) „Gemacht von Laurent R.“ = eigenes Gerät in der Statistik (unten), (2) Vereinslogo oben = Mitteilungen testen (geplant, `IDEEN-fussball.md`, Stufe 1/2). Wenn die Mitteilungen für alle kommen bzw. der Nutzer nicht mehr baut: beide Schalter samt Merker (`fussball_v1_ich`, Test-Merker) aus der App nehmen, beim Statistik-Schalter auch `ich` im Worker und den Abschnitt „Eigene Geräte“ — **vorher den Nutzer fragen**.
**Mitteilungen Stufe 1 gebaut** (vom Nutzer, 21.10.2026, Fassung 21.10. c; Plan in `IDEEN-fussball.md`). **Letzter Stand ohne Mitteilungen: Commit `260fc72`** (Fassung 21.10. b) — dorthin zurück, falls etwas schiefgeht. 5× aufs Vereinslogo oben → Merker `fussball_v1_mtest` → Zahnrad ⚙️ rechts im Kopf → Kasten `#mitt` über `main` (nicht in `main`, das wird ständig neu gebaut): Hinweis „nur vom Home-Bildschirm“ (`istApp`), „App neu anlegen“ ohne `PushManager`, „in Einstellungen erlauben“ bei `denied`, sonst „Mitteilungen erlauben“ → `Notification.requestPermission()` **zuerst, direkt im Tippen** (iOS), dann `fussball-sw.js` mit `scope: "./fussball.html"` (andere Apps im Repo unberührt), Schlüssel vom Worker (`?push=schluessel`), `pushManager.subscribe`, `?push=anmelden`. Danach „Test-Mitteilung senden“ (`?push=test`) und „Abmelden“. **Rückweg:** ohne Merker räumt die App beim Start Abo und Service Worker ab (`swAufraeumen`). `fussball-sw.js` hat nur `push` (zeigt immer eine Mitteilung — iOS-Pflicht) und `notificationclick`, **kein `fetch`**. `fussball.webmanifest` (`display: standalone`; iOS nimmt weiter das apple-touch-icon) — nur für neu angelegte Home-Bildschirm-Apps wirksam. **Worker:** `?push=schluessel|anmelden|test|abmelden` (POST als Text, kein Preflight), VAPID-Schlüssel erzeugt er beim ersten Mal selbst in D1 (`push_schluessel`), Abos in `abos` (`test` = 1), nur Push-Dienste von Apple/Google/Mozilla/Microsoft, Test höchstens alle 20 s, 404/410 löscht das Abo. Verschlüsselung RFC 8291 (`verschluesseln`), VAPID RFC 8292 (`vapidKopf`, `sub` = App-Adresse); **gegen `http_ece` gegengeprüft** (fremde Umsetzung entschlüsselt unsere Nachricht), Test entschlüsselt selbst und prüft die Unterschrift, Gegenprobe (vertauschte Schlüssel) bricht ab. Browser-Test mit Webserver, nachgebautem PushManager und Erlaubnis. **Am iPhone geprüft (21.10.2026, 14:23):** Test-Mitteilung kam an, mit Vereinslogo. iOS schreibt darunter selbst „from FC Koeppchen“ — der Titel „FC Koeppchen“ doppelt sich also; echte Mitteilungen bekommen darum einen eigenen Titel (z. B. „U13 1 · Heute Spiel“).
**Mitteilungen Stufe 2 gebaut** (vom Nutzer, 21.10.2026: „alle sofort einbauen“, Fassung 21.10. d; weiterhin nur für ihn hinter dem 5×-Logo). **Ablauf:** der FLF-Abruf (`tools/fussball.mjs` → `tools/mitteilungen.mjs`, `ereignisse(alt, neu, vorher, now)`) vergleicht alten und neuen Stand und schreibt `data/mitteilungen.json` (`ereignisse` mit `id`, `reiter[]`, `art`, `titel`, `text`, `ab`, `bis`; `live` = Seniors- und Länderspiele von heute). Der Worker (`scheduled`, **seit Fassung h jede Minute**, Cron `* * * * *` (**vom Nutzer am 21.10. bei Cloudflare umgestellt, „Every minute“ bestätigt**) — vom Nutzer: „Ticker läuft“ soll gleich kommen, nicht erst nach 15 min; `abrufFaellig` stößt den FLF-Abruf weiter nur zu den Viertelstunden an, Test prüft es Minute für Minute; `mitteilungenSenden`) liest die Datei über raw (bis 5 min Cache, also bis ~6 min Verzug nach dem FLF-Abruf), prüft die Live-Kandidaten selbst bei FuPa (`liveEreignisse`: Ticker erst mit Stand/Tickerer/Tor und `LIVE`; Endstand bei `POST`, Zahlen nach FLF gedreht, wenn FuPa Heim/Gast vertauscht) und schickt an Abos mit passender `wahl` (`passtZu`: Mannschaft angehakt und Art angehakt; „Woche“ nur über den Mannschafts-Haken). **Jede id nur einmal** (Tabelle `gemeldet`, erst eintragen, dann senden), Live-Ereignisse warten in `offen`. **Nur 7–22 Uhr** (`tagzeit`), sonst wartet es bis `bis`. Arten und Texte: Spiel steht an (vom Nutzer, Fassung f: **Kinder am Vorabend 19:00 „Morgen Spiel“, Seniors und Roude Léiw am Spieltag 10:00 „Heute Spiel“**, Seniors-Anstoß vor 11 Uhr 7:30; Kinderspiel erst am Spieltag bekannt → „Heute Spiel“ ab 7:30, gleiche id), Spieltag komplett (U13, U15, BGL; mit unserem Ergebnis), Tabelle (U13, U15, Seniors; wenn unsere Zeile mehr Spiele hat: „jetzt 2. Platz (vorher 3.)“), Uhrzeit steht fest (**nur U9/U11**, nur 00:00 → echte Zeit; geänderte Uhrzeiten nie, Seniors nie — vom Nutzer: die Zeit gibt der Trainer durch), Neue Phase / neues Spiel (**U13, U15**, vom Nutzer: neue Ligaklasse = eine Mitteilung „Spielplan … ist da“, sonst je neues Spiel, ab 4 auf einmal zusammengefasst; Spieltag und Tabelle prüfen alle Ligaklassen, damit beim Phasenwechsel nichts verloren geht), Liveticker läuft, **Halbzeit** (vom Nutzer, Fassung h: FuPa-`period` „halftime“ mit Stand, nur bei echtem Ticker) und Endstand (Seniors 1–3 über FuPa bzw. FLF, Roude Léiw über FuPa; gleiche id, also nur einmal), Unsere Woche (Mo 10:00, vom Nutzer). U9/U11 nie Ergebnisse. In der App unter dem Zahnrad **je Mannschaft eigene Arten** (vom Nutzer, Fassung 21.10. j: „bei U13 2 nur die Tabelle“): Mannschaft anhaken → darunter klappen genau ihre Arten auf (`mArtenFuer`: U13/U15 Spiel/Neu/Spieltag/Tabelle, U9/U11 Spiel/Uhrzeit, Seniors Spiel/Tabelle/Ticker/Halbzeit/Ende, BGL Spieltag, Roude Léiw Spiel/Ticker/Halbzeit/Ende, Woche nur der eine Haken), beim Anhaken erst alle an. Gespeichert als `{ je: { "U13 2": ["tabelle"] } }` (`_mwahl`, `?push=wahl`); die alte Form `{teams, arten}` liest die App um und `passtZu` versteht sie weiter. Haken, die es bei einer Mannschaft nicht mehr gibt, räumt die App beim Öffnen des Zahnrads weg und speichert einmal neu (`mAufraeumen`, Fassung l). Titel ohne „FC Koeppchen“ (iOS schreibt den App-Namen selbst dazu). **Zahnrad = eigener Reiter** (vom Nutzer, Fassung 21.10. e): `MITT_OFFEN` zeigt `#mitt` in `main`, das bei den Takten nicht neu gebaut wird; Reiter-Knöpfe und Tippen in der Woche schließen ihn, der Mannschafts-Reiter bleibt gemerkt. **Außerhalb der App** (vom Nutzer): iPhone in Safari → Anleitung „bitte installieren“ (Teilen → Zum Home-Bildschirm), Computer → Anleitung für iPhone und Android mit Adresse (`installHtml`), Android → Anleitung „App installieren“ (auch im Teilen-Text, Fassung 22.10. a; vom Nutzer, Fassung g: **Mitteilungen auf jedem Gerät nur in der installierten App, in jedem Browser nur die Anleitung**). Dafür hat `fussball.webmanifest` Symbole (`bilder/fussball-192.png`, `-512.png`, aus dem Vereinslogo, weißer Rand für Androids runde Maske), sonst legt Chrome nur ein Lesezeichen an, das im Browser aufgeht (`istApp` bliebe falsch). Auf Android nicht ausprobiert. **Zahnrad sehen weiterhin nur Geräte mit 5×-Logo** — für alle erst mit Stufe 3. Erster Lauf der Action mit Mitteilungen am 21.10. grün. Tests mit eigenen kleinen Daten (nicht den echten, die ändern sich), Versand mit nachgebautem D1 und Uhrzeiten; Gegenprobe gemacht. **Übersicht auf `?zahlen`** (vom Nutzer, 21.10.: „nicht nur was rausging, sondern ob alles rausging“): Abschnitt „Mitteilungen“ unten — Handys angemeldet/mit Auswahl, „Gewählt“ je Mannschaft und Art (bei mehreren Handys mit Anzahl, nie wer; vom Nutzer), heutige Live-Spiele, jede geplante Mitteilung (Datei + `offen` + `gemeldet` der letzten 7 Tage) mit Stand (`mittStatus`): ⏳ wartet, 🌙 wartet bis 7 Uhr, ✓ Zeit an n von m Handys (m = wer es angehakt hat, mit Fehlergrund), ✗ nicht verschickt (abgelaufen). Dafür hat `gemeldet` die Spalten titel, ab, an, passend, fehler, verpasst (`gemeldetSpalten`, legt der Worker selbst an). Ob das iPhone sie angezeigt hat, sieht der Worker nicht. **Grenze für Stufe 3:** Cloudflare gratis ~50 Abrufe je Takt, jede Mitteilung je Handy einer — für viele Nutzer muss der Versand aufgeteilt werden. **Worker neu einfügen nötig.**
**Eigenes Gerät** (vom Nutzer, 21.10.2026, Fassung 21.10. b: sein iPhone verfälscht beim Bauen die Zahlen): 5× innerhalb von 4 s auf „Gemacht von Laurent R.“ tippen → Nachfrage → `fussball_v1_ich`; dann gehen `zaehle` und `angesehen` mit `&ich=1`, der Worker schreibt nur in die Tabelle `ich` (`tag, was = oeffnung|umschalten`) und zeigt sie unten auf `?zahlen` getrennt. **Zahlen-Seite fürs Handy** (vom Nutzer, 21.10.: Haupttabelle zu breit): Tag als „Mi 21.10.“, „Öffn.“, Neu nur als Zahl (vor dem 21.10. „–“), App/Browser der Neuen im aufklappbaren Tag; bei 390 px geprüft. Fußzeile sagt „Dieses Gerät zählt nicht in der Statistik mit.“, nochmal 5× schaltet zurück. Safari und Home-Bildschirm einzeln einschalten. Was vorher gezählt wurde, bleibt drin (keine Kennung, nicht trennbar). **Worker neu einfügen nötig.**
Fußzeile nennt die Abrufzeiten genau (vom Nutzer): täglich 7:00 und 23:30, Mo–Fr 22:15, Sa/So 8–22
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
