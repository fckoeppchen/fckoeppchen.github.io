// Woher der Liveticker der Seniors kommt (vom Nutzer, 29.10.2026, solange FuPa die Nutzung der Schnittstelle nicht erlaubt hat):
//   api: true  = wie bis 29.10.2026 — Worker fragt api.fupa.net, Live-Kasten, Stand in der Woche, Live-Mitteilungen.
//   api: false = nur das FuPa-Widget in der App; kein Live-Abruf (Reserven-Slugs, live.json, Live-Mitteilungen).
// Zurück: hier true UND in index.html `FUPA_API = true`. Tabellen (BGL, Roude Léiw) und Spiele der Roude Léiw kommen in
// beiden Fällen von FuPa (vom Nutzer: Tabellen sind Tatsachen). Objekt statt Konstante, damit die Tests umschalten können.
export const FUPA = { api: false };
