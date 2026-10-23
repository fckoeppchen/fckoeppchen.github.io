// Service Worker der App (index.html) — NUR Mitteilungen (vom Nutzer, 21.10.2026, Stufe 1).
// Bewusst kein „fetch“: er lädt, speichert und verändert keine Seiten, die App holt ihre Daten wie
// bisher selbst. Wird nur eingerichtet, wenn in der App 5× aufs Logo getippt wurde, und nur für
// die ganze Seite (scope ./).
const WORKER = "https://fckoeppchen.rjtp6r9s9h.workers.dev/";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// iOS verlangt zu jeder Push-Nachricht eine sichtbare Mitteilung, sonst entzieht es die Erlaubnis.
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { text: e.data ? e.data.text() : "" }; }
  const zeigen = self.registration.showNotification(d.titel || "FC Koeppchen", {
    body: d.text || "", tag: d.tag || undefined, data: { url: d.url || "./" },
  });
  // Empfangsbestätigung (vom Nutzer, 23.10.2026): nach dem Anzeigen „angekommen“ melden, nur die Mitteilung,
  // keine Kennung des Handys. Geht das nicht, ist die Mitteilung trotzdem da.
  e.waitUntil(zeigen.then(() => d.q && fetch(WORKER + "?push=angekommen&id=" + encodeURIComponent(d.q), { mode: "no-cors" }).catch(() => {})));
});

// Tippen auf die Mitteilung öffnet die App (oder holt sie nach vorn).
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const ziel = new URL(e.notification.data?.url || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(l => {
    const offen = l.find(c => c.url.startsWith(self.registration.scope));
    return offen ? offen.focus() : self.clients.openWindow(ziel);
  }));
});
