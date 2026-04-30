// Minimal service worker. Chrome requires a registered SW with a fetch
// handler before showing the install prompt. We don't cache anything yet
// — that would break Mongo/Gemini/GCal API responses if mishandled.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // intentionally empty: lets the network handle every request
});
