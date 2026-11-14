// Apex Hub CRM · recebe as notificações (lembretes) mesmo com o CRM fechado
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { corpo: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.titulo || 'Apex Hub CRM', {
    body: d.corpo || '', icon: 'img/icone-512.png', badge: 'img/icone-180.png', tag: d.tag || undefined, renotify: true,
    data: { url: d.url || '/#lembretes' }, vibrate: [120, 60, 120],
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ws) => {
    for (const w of ws) if (w.url.startsWith(self.location.origin)) { w.navigate(alvo); return w.focus(); }
    return self.clients.openWindow(alvo);
  }));
});
