// V111
// Online-only: never cache orders, API responses or stale application code.
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
 if(e.request.mode!=='navigate'||e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(e.request,{cache:"reload"}).catch(()=>new Response('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Santa Rosa</title><body style="font:18px system-ui;padding:24px"><h1>Sin conexión</h1><p>Conéctate a internet para consultar y guardar tus OT.</p><button onclick="location.reload()">Reintentar</button></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'},status:503})));
});
