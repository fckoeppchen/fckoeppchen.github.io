# Ideen für die App „FC Koeppchen“ (`fussball.html`)

Gesammelt, noch nicht gebaut. Wer etwas davon angeht, streicht es hier und trägt den Stand in
`CLAUDE.md` ein.

## Koeppi (Maskottchen) — Plan vom Nutzer, 22.10.2026 — **gebaut 22.10., Fassung neu c, danach vom Verein geändert (neu e: keine Siege/Bilanz, siehe CLAUDE.md)**

Vom Verein angeregt („Koeppi als Identifikationsfigur für die Jugendspieler“). Bilder vom Nutzer, freigestellt
(512 px, durchsichtig, weißer Sticker-Rand), Originale in `bilder/koeppi/`. In der App als eigene Dateien
(verkleinert ~30–50 KB, nur laden wenn gebraucht), nicht eingebettet. Etwa daumengroß (~70 px).
**Nur in „Unsere Woche“ und bei den Kinder-Reitern (U9, U11, U13, U15)** — nicht bei den Seniors, **nicht im
Live-Kasten** (vom Nutzer). Kein trauriger Koeppi nach Niederlagen.

- Kinder-Reiter, **Vortag und Spieltag bis zum Anpfiff**: `fuss-auf-ball.png` (vom Nutzer getauscht). Am
  Vortag ein **neuer Kasten „Morgen Spieltag! ⚽“** oben im Reiter, aufgebaut wie „Heute Spieltag!“ (Tag,
  Uhrzeit, Gegner, 📍 Ort, „Trinkflasche nicht vergessen! 😉“) — vom Nutzer gewählt (Variante A, nicht nur
  neben „Nächste Spiele“); am Spieltag wird daraus der Heute-Kasten, Koeppi bleibt. Nur Kinder-Reiter.
- Kinder-Reiter, **„Gleich geht's los!“ und während des Spiels**: `trinkflasche.png`.
- **U13/U15 nach einem Sieg**: `rennend.png` (Faust, schwarzes Trikot) als Streifen „Gewonnen! 🎉 7:1
  gegen …“ oben in „Ergebnisse“ über dem neuesten Spiel, bis das nächste Spiel ansteht.
- **U9/U11** (keine Ergebnisse): nach **jedem** Spiel „Super gemacht, U9 1! 💪 Nächstes Spiel: …“ mit
  `rennend.png`, bis das nächste ansteht (vom Nutzer: nur das, kein Saisonzähler, kein Uhrzeit-Hinweis).
- **Leere Stellen** (hellgrüner Hinweis „neue Klasse noch nicht eingetragen“, „Nächste Spiele“ leer,
  Winterpause): `ruhig.png` rechts im Kasten.
- **Unsere Woche, Kopf**: immer `fahne.png` (#mirvunderkoeppchen); nach dem Wochenende bei positiver Bilanz
  (mehr Siege als Niederlagen, nur Spiele mit Ergebnis) stattdessen `ball-faust.png`; Woche ohne Spiele `ruhig.png`.

## Vorgemerkt (vom Nutzer, 20.10.2026)

### Mitteilungen (Plan vom Nutzer, 21.10.2026 — Stufe 1 und 2 gebaut 21.10., Fassung c/d; Stufe 3 „für alle“ offen)

Ursprünglich vorgemerkt am 20.10. als „Spieltag komplett“ / „Tabelle aktualisiert“; am 21.10. mit dem
Nutzer ausgearbeitet. Entscheiden, wann gebaut wird, wenn der Zähler zeigt, dass die App genutzt wird
(20.10.: 24 Handys, 10 davon vom Home-Bildschirm).

**Bedienung:** Zahnrad oben in der App → Benachrichtigungszentrale: Hauptschalter (beim ersten Einschalten
fragt iOS), „Meine Mannschaften“ zum Abhaken, darunter die Arten (jede für alle abgehakten Mannschaften;
was es bei einer Mannschaft nicht gibt, fällt dort weg), unten „Test-Mitteilung senden“. Wenige, aber
wichtige Meldungen für Eltern und Spieler; nachts nichts (nach 22 Uhr → 7 Uhr; seit 23.10.2026 nach 23 Uhr, vom Nutzer).

**Was es pro Reiter gibt:**

| | Heute Spiel | Spieltag komplett | Tabelle | Uhrzeit fest | Ticker läuft | Endstand |
|---|---|---|---|---|---|---|
| U13, U15 | ✓ | ✓ (mit unserem Ergebnis) | ✓ | (selten) | – | – |
| U9, U11 | ✓ | – | – | ✓ | – | – |
| Seniors 1–3 | ✓ | – | ✓ | ✓ (Réserves) | ✓ | ✓ |
| BGL | – | ✓ | – | – | – | – |
| Roude Léiw | ✓ | – | – | – | ✓ | ✓ |
| Woche | einmal „neue Woche online“ (Spielzahl) |

- **Heute Spiel:** „Heute Spiel um 10:00 in Remich“ je Mannschaft (nicht in der Woche — wen eine andere
  Mannschaft nicht interessiert, soll nichts davon bekommen, vom Nutzer). Morgens ~7:30, für Spiele vor
  10 Uhr am Vorabend ~19 Uhr.
- **Spieltag komplett und Tabelle sind zwei Meldungen** (vom Nutzer): die FLF zieht die Tabelle oft
  erst später nach. Tabelle als „Koeppchen I jetzt 2. Platz“.
- **Uhrzeit fest:** FLF trägt erst 00:00 ein (App zeigt dann nur das Datum), die Zeit später. Am 21.10.
  ohne Uhrzeit: U9 30 von 40 kommenden Spielen, U11 27 von 36, Réserves 20 von 205.
- **Seniors: keine Tor-Meldungen** (vom Nutzer: zu viel). Stattdessen einmal „Heute tickert FuPa das
  Spiel von Seniors 2 – live in der App“, sobald wirklich getickert wird (erster Eintrag des Tickerers,
  nicht FuPas automatisches LIVE), und der Endstand (Ticker, sonst FLF). Grund auch technisch: Cloudflare
  gratis ≈ 50 Sendungen je Aufruf, jede Mitteilung geht einzeln an jedes Handy.
- **Roude Léiw wie die Seniors** (vom Nutzer, 21.10.): „Heute tickert FuPa das Länderspiel – live in der
  App“ und der Endstand. Den Ticker in der App gibt es seit 19.10. (FuPa-Slug `luxemburg-m1-…`).
- **Ticker läuft / Endstand erkennt nur der Server:** der Worker müsste an Spieltagen in den Spielfenstern
  selbst bei FuPa nachsehen (~alle 5 min).
- **Verlegungen/Absagen:** sagt der Trainer (vom Nutzer, 20.10.); höchstens wählbar und standardmäßig
  aus — die FLF war beim Pokal Rodange (8.11. → 7.11.) früher dran.

**Technik:** Web Push nur vom Home-Bildschirm, iOS ab 16.4. Abos (anonymer Apple-Endpunkt + gewählte
Mannschaften/Arten) in D1; VAPID-Schlüssel als Secret im Worker; kleine Service-Worker-Datei im Repo.
Der FLF-Abruf (`tools/fussball.mjs`) erkennt die Ereignisse beim Vergleich alt/neu. Abgemeldete Geräte
(404/410) löscht der Worker selbst. U9/U11-Ergebnisse nie.

**Testen nur für den Nutzer zuerst** (vom Nutzer): Zahnrad erscheint nur nach **5× Tippen auf das
Vereinslogo oben** (vom Nutzer, 21.10.: statt Geheimlink — die Home-Bildschirm-App hat keine
Adresszeile, Mitteilungen gehen aber nur dort; merkt sich das Handy). Service Worker wird nur dort
eingerichtet, alle anderen merken nichts. Stufe 1: Erlauben + Test-Mitteilung. Stufe 2: echte Meldungen nur für ihn, ein, zwei
Wochenenden. Stufe 3: für alle — **dabei das 5×-Tippen aufs Logo wieder ausbauen**. Aufwand Stufe 1+2 etwa ein Tag, beim Nutzer ~10 min Cloudflare.

### Versand für viele Handys — Plan, besprochen 23.10.2026 — **gebaut 23.10. (Fassung neu j), Worker neu einfügen nötig**

Heute schickt der Worker eine fällige Mitteilung in einem Rutsch an alle passenden Abos. Gratis-Plan: höchstens 50
Abrufe nach draußen und 10 ms Rechenzeit je Lauf; jede Mitteilung je Handy = ein Abruf + Verschlüsselung (+ heute je
Push eine VAPID-Unterschrift). **Plan (vom Nutzer: „brauchen nicht gleichzeitig anzukommen“, auf Nummer sicher, Pakete
lieber klein):** Postausgang in D1 — fällige Mitteilung wird je Handy als Zeile eingetragen, jeder Minuten-Lauf schickt
ein **kleines** Paket (Größe erst messen, eher 10 als 30), Rest in der nächsten Minute; Live (Ticker/Halbzeit/Ende) vor
dem Rest; VAPID-Kopf je Push-Dienst einige Stunden wiederverwenden. Mit vielen nachgebauten Handys testen, danach im
Cloudflare-Dashboard die echte Rechenzeit ansehen und die Paketgröße einstellen. Schneller ginge mit Selbstaufruf
(mehrere Pakete parallel) oder Workers Paid (5 $/Monat, Frage an den Verein) — beides vorerst nicht nötig.
**Freigabe schrittweise (vom Nutzer, 23.10.2026: „Lösung 2“):** Höchstzahl im Worker — er nimmt nur so viele
Anmeldungen (`?push=anmelden`) an wie eingestellt (z. B. erst 50), danach in der App „Mitteilungen bald für alle, bitte
später nochmal versuchen“. Zahl nach jedem ruhigen Wochenende anheben (100, 200 …), eine Zahl im Worker. Verworfen bzw.
nicht gewählt: Testgruppe per Code, Freigabe nach Mannschaften (ungerecht).
**Empfangsbestätigung (vom Nutzer, 23.10.2026: „ja klar“):** `sw.js` meldet beim `push`-Ereignis nach dem Anzeigen kurz
`WORKER_URL?push=angekommen&id=<Ereignis-id>` (ohne Kennung des Handys, nur gezählt); `gemeldet` bekommt eine Spalte
`angekommen`, `?zahlen` zeigt „✓ 19:00 an 48 von 50 Handys · angekommen auf 47“. Gelesen/geöffnet wird bewusst nicht
gemessen. Kostet je Mitteilung und Handy einen Worker-Aufruf. Kein Neuinstallieren: der Browser holt ein geändertes `sw.js`
beim nächsten Öffnen der App selbst, das Abo bleibt. Worker einmal neu einfügen (zusammen mit Postausgang/Höchstzahl).
**Liveticker-Abfrage:** 100 000 Worker-Aufrufe/Tag gratis, der Ticker fragt je offenem Handy alle 20 s. Vom Nutzer:
**60 s sind in Ordnung**, wenn das besser ist (dreimal weniger Aufrufe; die Minute zählt die App ohnehin selbst weiter).

### Neuigkeiten-Hinweis in der App — besprochen 23.10.2026, **beim Freischalten der Mitteilungen zum ersten Mal**

Grüner Kasten ganz oben auf jedem Reiter („🆕 Neu: Mitteilungen – werden phasenweise freigeschaltet …“) mit ✕; weggeklickt
merkt es sich das Handy (localStorage, je Kennung). Nicht an eine Fassung gebunden: jeder Hinweis hat Kennung und **Enddatum**
(z. B. 4 Wochen) — wer selten öffnet, sieht ihn trotzdem; nach dem Enddatum weg. Neuer Hinweis = neue Kennung (z. B. später der
Ticker), mehrere gleichzeitig → nur der neueste. Lieber als Push an alle (erreicht nur, wer Mitteilungen schon hat). Text, Dauer,
Platz erst dann festlegen (vom Nutzer). App geht am 26.10. **ohne** Mitteilungen raus.

### Tore als Mitteilung — besprochen 23.10.2026 — **gebaut am selben Abend (neu n), vorerst nur mit eigenem Code**

Machbar und nicht teuer (~1–2 h): der Worker holt im Live-Fenster ohnehin jede Minute FuPa samt `tore`; je neuem Tor eine
Mitteilung „Seniors 1 · Tor! ⚽“ / „Koeppchen 2:1 Beggen · 67. Name“ (id je Tor), Vorrang wie Live. Neuer Haken „Tore“ bei
Seniors 1–3 und Roude Léiw, **beim Anhaken der Mannschaft NICHT von selbst an** (vom Nutzer: bewusst wählen). Grenzen: FuPa trägt
oft Minuten später ein, Postausgang 10 Handys/min (bei vielen Handys mehrere Minuten Versatz), falsch getickerte Tore lassen sich
nicht zurückholen, nur wo jemand tickert.

### FuPa um Erlaubnis fragen — wenn der Verein die App übernimmt (vom Nutzer, 22.10.2026)

Solange nur er und ein paar Freunde die App nutzen, bleibt es so (private Nutzung, kein Geld, FuPa als
Quelle mit Link und Tickerer-Namen im LIVE-Kasten). Übernimmt der Verein die App: kurze Mail an
FuPa Luxemburg (LSN sàrl, luxemburg@fupa.net, CEO Paul Krier) — „kostenlose Vereins-App ohne Werbung
zeigt bei unseren Spielen euren Liveticker mit Link, ok?“. Grund: FuPas eigene Schnittstelle ist nicht
als offizielles Angebot gedacht; EU-Datenbankschutz bei systematischer Übernahme ist eine Grauzone.
In den Nutzungsbedingungen: Vergütung erst bei kommerzieller Nutzung, kein ausdrückliches Verbot
automatischer Abrufe gefunden. **Sagt FuPa nein** (vom Nutzer): Liveticker, Halbzeit und Ticker-Endstand
raus, Ergebnisse nur noch von der FLF. Achtung, FuPa steckt auch in der BGL-Tabelle (Rückfall: FLF-Tabelle
bzw. selbst gerechnet, gibt es schon) und im ganzen Reiter Roude Léiw (Spiele, Tabelle — dafür bräuchte es
eine andere Quelle oder der Reiter entfällt).

## Vorschläge von Claude (20.10.2026, noch nicht besprochen)

- **„Dieses Wochenende“**: alle Spiele aller Koeppchen-Mannschaften von Freitag bis Sonntag auf
  einen Blick (Uhrzeit, Gegner, heim/auswärts, Platz). Für Eltern mit mehreren Kindern, für
  Zuschauer und für die Buvette. Aus den vorhandenen Daten, kein neuer Abruf.
- **Kalender-Abo „Alle Heimspiele“**: ein zusätzliches `.ics` mit jedem Spiel in Wormeldange, über
  alle Mannschaften — für Helfer, Buvette, Platzwart.
- **Formkurve in der Tabelle**: die letzten fünf Ergebnisse je Mannschaft (S/U/N), aus den
  FLF-Ergebnissen der Klasse.
- **Letztes Duell beim nächsten Spiel**: unter dem Gegner das letzte Ergebnis gegen ihn (diese oder
  letzte Saison), soweit in den Daten.
- **Torschützen der Seniors**: Saisonliste aus den FuPa-Tickern (nur, wo getickert wurde — also
  unvollständig, das müsste dabeistehen).
- **QR-Code / Aushang**: eine Seite mit QR-Code zur App für den Aushang im Clubhaus oder zum
  Weiterleiten — damit die App überhaupt bei den Eltern ankommt.
- **Anonymer Zähler**: der Worker zählt, wie oft die App am Tag geöffnet wird (nur eine Zahl, keine
  Geräte). Damit ließe sich die Frage „wird sie genutzt?“ vor den Mitteilungen beantworten.

## Wochenvorschau: Teile für den Verein (vom Nutzer zurückgestellt, 20.10.2026)

Die Wochenvorschau selbst ist gebaut („Unsere Woche“, 20.10.2026); diese Zusätze erst mal nicht:

- **Platzbelegung Am Ga**: je Tag mit Heimspielen eine Zeile „Am Ga: 10:00–18:00 belegt, 4 Spiele“
  (für Buvette, Platzwart, Schiedsrichterbetreuung).
- **„Woche teilen“**: fertiger Text für WhatsApp-Gruppen („⚽ FC Koeppchen diese Woche: Sa 10:00
  U13 1 – Hosingen (🏠 Am Ga) …“), über `navigator.share` wie „App teilen“ (nur `text`).
- **Kalender-Abo „Alle Heimspiele“** (steht auch oben bei den Vorschlägen).
- **Anonymer Zähler** (oben): Handys pro Tag und Öffnungen pro Tag (Öffnen = Start oder zurück nach
  ≥ 30 min im Hintergrund), auf Wunsch je Reiter; Speicher D1 statt KV (mehr Schreibvorgänge
  frei); Anzeige über `WORKER_URL?zahlen`, letzte 30 Tage. **Gebaut 20.10.2026** (siehe CLAUDE.md).

## BAM (Bambinis U7) — gebaut am 25.10.2026 (Fassung neu d), sofort sichtbar statt versteckt (vom Nutzer)

- Nicht im Extranet, nur als PDF auf www.flf.lu (in der Umgebung freigeschaltet): „Programmes généraux“
  (`generaux-92804v4`, PDF „U7_Bambinis Tour 1 programme détaillé 2026-2027“) und „Programme hebdomadaire“
  (`hebdomadaires-92803v4`, z. B. „20261024 Bambinis.pdf“, „Coup d'envoi 10.30 hrs (sauf modification)“,
  andere Uhrzeit hinter dem Platz, z. B. „9h30“). Dateien liegen auf clubee-websites-prod (S3).
- Koeppchen I und II in **Bambinis série 6**, Tour 1: 8 Spieltage 26.09.–28.11. Je Spieltag 4 Spalten = 4
  Mini-Tournois (Platz, dann 3–4 Mannschaften, „-“ = frei); lange Platznamen laufen in eine zweite Zeile.
  `pdftotext -layout` liest es.
- Plan (vom Nutzer): Reiter BAM 1/BAM 2, je Samstag „Mini-Tournoi in … · Uhrzeit · mit …“, keine Ergebnisse/
  Tabelle; Woche, Kalender „Bambinis U7“, Koeppi, Morgen-Kasten. Im normalen FLF-Abruf mit, eigener Teil:
  Fehler → alter BAM-Stand bleibt, Rest läuft weiter (vom Nutzer: „wir würden dann reparieren“). Lieber nichts
  als etwas Falsches. **Erst versteckt** hinter dem 5×-Logo-Code, ein, zwei Samstage gegen das PDF prüfen,
  dann mit einer Zeile für alle freischalten. Nicht in der alten App testen.

## Indoor (LALUX Indoor Cup) — Winter, noch offen (24.10.2026)

- Seite www.flf.lu/lalux-indoor-84127v4: bisher nur „Calendrier 2026-2027 LALUX Indoor Cup.pdf“ mit den Runden je
  Kategorie (U9/U11 1. Runde 5. bzw. 12./13.12., U13 1. Runde 2./3.1., 2. Runde U13/U9 16./17.1., U11 9./10.1., …,
  Finale 20./21.3.), ohne Mannschaften und Hallen. Die genauen Spielpläne kommen vermutlich später als eigene PDFs
  — Anfang Dezember nachsehen (oder vorher prüfen, ob sie im Extranet auftauchen). Gleicher Weg wie BAM.
- **Vom Nutzer:** LALUX Indoor = die Indoor-Meisterschaft, wichtig → automatisch aus den FLF-PDFs. **Kleine Turniere**, die
  der Trainer ab und zu anmeldet, kommen von Hand: reicht Datum, Ort, Uhrzeit („Turnier in … um …“) im Reiter, in der Woche
  und im Kalender. Mit dem Verein klären, wer Bescheid gibt. Idee: eine kleine Datei `data/turniere.json` (Mannschaft,
  Datum, Uhrzeit, Ort, Name), die Claude auf Zuruf füllt — oder der Nutzer selbst auf GitHub im Browser.

## Vom 24.10.2026 abends (vom Nutzer) — alle drei erledigt am 25.10. (neu a, neu b)

1. **Koeppi-Streifen mit Ergebnis:** Solange „Super gemacht“ steht (bis 7 Tage, oder bis Vortag/Spieltag des nächsten),
   das Spiel mit in den Kasten nehmen (größer), danach normal unter „Unsere Ergebnisse“. Achtung Vereinswunsch „keine
   Ergebnisse hervorheben“ — mit dem Nutzer klären, ob das bei U13/U15 dazu passt (U9/U11 haben ohnehin keine Zahlen).
2. **Aufklappbare Karten auffälliger** („Alle Spiele der Klasse“, „Frühere Phasen“): grauer Kopf auf Weiß fällt nicht auf.
   Vorschlag des Nutzers: Kopf grün, Knopf „Anzeigen/Zuklappen“ weiß oder schwarz. Varianten zeigen.
3. **Spruch doppelt am selben Wochenende** (MIN 1/MIN 2, PUP 1/PUP 2): Index = gespielte Spiele + Versatz (Platz in `fest`,
   Nachbarn 1 auseinander). Hat ein Team ein Spiel mehr (z. B. Pokal), heben sich die 1 auf → gleicher Spruch. Lösung:
   Index aus der Woche (Kalenderwoche/Wochenende) + Platz in `fest`; bei 8 Sprüchen und 7 Teams nie zwei gleiche am selben
   Wochenende, jede Woche ein anderer.

## Begrüßung beim ersten Öffnen — nach dem Umzug (vom Nutzer, 26.10.2026, **noch nicht bauen**)

Kasten über der App, bis „Los geht's“ getippt ist (eigener Merker, neu — darum sehen ihn alle einmal, auch
bisherige Nutzer, der Nutzer und seine 3 Tester, ohne Handarbeit). „Los geht's“ schließt ihn für immer. Keine Push-Mitteilung
(ginge nur an Handys mit Mitteilungen). **Koeppi mit Fahne** (`k-fahne.png`; ein winkender Koeppi existiert nicht —
falls gewünscht, Bild vom Verein). **Drei Sprachen DE · FR · EN** (vom Nutzer, 26.10.): kleine Knöpfe oben im Kasten, vorausgewählt nach Sprache des Handys
(`navigator.language`, sonst Deutsch). „Unsere Woche“ bleibt in FR/EN deutsch (Knopfname in der App). Texte vom Nutzer abgenommen:

> **Willkommen beim FC Koeppchen! 👋**
> Diese App ist für Eltern und Kinder gemacht. Hier seht ihr immer, wann und wo eure Mannschaft spielt, und ihr könnt
> auch die Spiele eurer Freunde verfolgen.
> Die Seniors sind auch mit dabei. So sehen die Kinder, wie „die Großen“ spielen, und alle im Verein bleiben auf dem
> Laufenden. Denn wir sind alle Koeppchen.
> **So geht's:** Oben eine Mannschaft antippen, dann seht ihr ihre Spiele, die Tabelle und die Ergebnisse. ·
> **Unsere Woche** zeigt alle Spiele des Vereins in dieser Woche. · 📅 Mit dem Kalender-Abo landen die Spiele direkt in
> eurem Handy-Kalender, auch wenn sich ein Termin ändert.
> Viel Spaß und bis bald am Platz! ⚽ **#mirvunderkoeppchen**  [ Los geht's ]

> 🇫🇷 **Bienvenue au FC Koeppchen ! 👋**
> Cette application a été créée pour les parents et les enfants. Vous voyez toujours quand et où joue votre équipe, et
> vous pouvez aussi suivre les matchs de vos amis.
> Les Seniors sont aussi de la partie. Ainsi, les enfants voient comment jouent « les grands », et tout le club reste
> informé. Car nous sommes tous Koeppchen.
> **Comment ça marche :** Touchez une équipe en haut pour voir ses matchs, le classement et les résultats. ·
> **Unsere Woche** montre tous les matchs du club de la semaine. · 📅 Avec l'abonnement au calendrier, les matchs
> arrivent directement dans le calendrier de votre téléphone, même si un horaire change.
> Amusez-vous bien et à bientôt au terrain ! ⚽ **#mirvunderkoeppchen**  [ C'est parti ! ]

> 🇬🇧 **Welcome to FC Koeppchen! 👋**
> This app was made for parents and children. You can always see when and where your team plays, and you can also
> follow your friends' matches.
> The Seniors are part of it too. This way, the children see how "the grown-ups" play, and everyone in the club stays
> up to date. Because we are all Koeppchen.
> **How it works:** Tap a team at the top to see its matches, the table and the results. · **Unsere Woche** shows all
> of the club's matches this week. · 📅 With the calendar subscription, the matches go straight into your phone's
> calendar, even if a time changes.
> Have fun and see you at the pitch! ⚽ **#mirvunderkoeppchen**  [ Let's go! ]

## COACH-Reiter: Trainer tragen eigene Spiele ein (vom Nutzer, 26.10.2026, **noch nicht bauen**)

Für Freundschaftsspiele, Turniere u. Ä., die nicht im Extranet stehen. Ersetzt die alte Idee `data/turniere.json`.
- **Eingang:** 5× aufs Vereinslogo → Name + **eigener Code** (Name allein reicht nicht, App ist öffentlich — Claudes Einwand,
  vom Nutzer so übernommen). Code prüft der **Worker** (nie in der Datei). Ein Eingang, der Code entscheidet: Tester-Code →
  Mitteilungen, Trainer-Code → Reiter **COACH**. Bleibt auf dem Handy bis Abmelden.
- **Trainer:** sieht/ändert/löscht **nur eigene** Spiele, und **nur für seine Mannschaft(en)** (vom Nutzer). FLF-Spiele nie.
- **Verwalter:** Laurent, Präsident der Jugendkommission, Jugendkoordinator Tiago — sehen alles mit Name des Eintragenden,
  können alles ändern/löschen, legen Trainer an (Name, Code, Mannschaften), sperren Codes; Spiele eines gesperrten Trainers
  bleiben und können übernommen werden.
- **Felder:** Art (Freundschaftsspiel · Turnier · Hallenturnier · Sonstiges), Mannschaft, Datum, Uhrzeit (oder offen),
  Gegner/Veranstalter, Ort (zu Hause Wormeldange oder Freitext), Bemerkung.
- **Weg:** Worker speichert (D1) und stößt **sofort** den Abruf an (vom Nutzer, 26.10.: lieber sofort als bis zum nächsten Abruf
  warten — Trainer sieht, dass es geklappt hat, kurzfristige Absagen kommen gleich an; im COACH-Reiter sofort sichtbar); `tools/fussball.mjs` holt die Spiele und baut sie wie BAM ins
  Format von `aufbereiten` → Reiter, Unsere Woche, Kalender, Mitteilungen, Koeppi ohne Sonderweg. ~5–10 min bis sichtbar.
- Trainernamen nie in öffentlichen Daten. Datenschutz-Hinweis ergänzen. Trägt die FLF dasselbe Spiel später ein: Hinweis
  im COACH-Reiter („steht jetzt auch bei der FLF, deins löschen?“).
- Offen: Ergebnisse bei Seniors-Spielen? (Kinder: keine, Vereinswunsch.)

## Reiter beim Runterscrollen ausblenden (vom Nutzer, 26.10.2026) — **gebaut am selben Tag, Fassung 26.10. neu a**

Anlass: 16 Knöpfe (Woche + 15 Reiter) im festen Kopf (`header{position:sticky}`) nehmen am Handy ~¼ des Bildschirms, auch
beim Scrollen. Gewählt (Variante 1 von 4): beim **Runterscrollen** schiebt sich `#seg` weg, oben bleibt eine schmale Leiste
(Logo + Name des aktuellen Reiters, z. B. „MIN 1“); ein Stück **Hochscrollen** holt alle Reiter zurück (wie Safaris
Adresszeile). Kein Tipp mehr als heute. Verworfen/zurückgestellt: zuklappen mit „Mannschaft wechseln ▾“ (ein Tipp mehr),
Wisch-Reihe (versteckt Reiter); „Meine Mannschaften“ (Favoriten + „Alle ▾“) ggf. später, wenn Eltern es wünschen.
Beim Bauen auf iPhone achten: Gummiband-Scrollen oben/unten darf nicht flackern, Zahnrad/Live-Kasten nicht verdecken.
