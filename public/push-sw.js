/*
 * Piezas extra del service worker de Bravos Box. Lo carga el service worker de la app
 * (vite.config.js, workbox.importScripts), así que funciona con la app instalada y en la
 * versión de producción.
 */

/*
 * Túnel de ngrok (solo para pruebas desde el celular). La versión gratis de ngrok contesta con una
 * pantalla de aviso a todo pedido de un navegador que no la haya aceptado, y la app instalada no
 * puede aceptarla: las imágenes salían rotas y los datos no cargaban. Una imagen no puede pedirse
 * con un encabezado desde la página, así que desde acá se piden de nuevo con el encabezado que
 * ngrok necesita para dejarlas pasar. Solo se activa si el sitio se abre por ngrok.
 */
const EN_NGROK = /ngrok/i.test(self.location.hostname)
const CACHE_IMAGENES = 'imagenes-app-v2' // el mismo que usa vite.config.js

if (EN_NGROK) {
  // Lo que ya se guardó mal (la pantalla del aviso guardada como si fuera una imagen) se borra
  self.addEventListener('activate', (evento) => {
    evento.waitUntil(caches.delete('imagenes-app'))
  })

  self.addEventListener('fetch', (evento) => {
    const pedido = evento.request
    if (pedido.method !== 'GET' || pedido.mode === 'navigate') return
    const url = new URL(pedido.url)
    if (url.origin !== self.location.origin) return
    const esDelServidor = /^\/(api|landing|uploads)\//.test(url.pathname)
    const esImagen = /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname)
    if (!esDelServidor && !esImagen) return // el resto (código, estilos…) lo atiende el service worker normal

    evento.respondWith((async () => {
      const cache = await caches.open(CACHE_IMAGENES)
      if (esImagen) {
        const guardada = await cache.match(pedido)
        if (guardada) return guardada
      }
      try {
        const encabezados = new Headers(pedido.headers)
        encabezados.set('ngrok-skip-browser-warning', '1')
        const respuesta = await fetch(new Request(pedido.url, { headers: encabezados, credentials: 'include', mode: 'same-origin' }))
        // Solo se guarda si de verdad es una imagen (nunca la pantalla de aviso)
        if (esImagen && respuesta.ok && (respuesta.headers.get('content-type') || '').startsWith('image/')) {
          cache.put(pedido, respuesta.clone())
        }
        return respuesta
      } catch (error) {
        const guardada = esImagen ? await cache.match(pedido) : null
        if (guardada) return guardada
        throw error
      }
    })())
  })
}

/*
 * Notificaciones push de Bravos Box.
 * El contenido lo manda el servidor sin datos sensibles: { titulo, cuerpo, url }.
 */

self.addEventListener('push', (evento) => {
  let datos = {}
  try {
    datos = evento.data ? evento.data.json() : {}
  } catch {
    datos = { cuerpo: evento.data ? evento.data.text() : '' }
  }
  if (!datos.cuerpo) return

  evento.waitUntil(
    self.registration.showNotification(datos.titulo || 'Bravos Box', {
      body: datos.cuerpo,
      icon: '/pwa-192x192.png',
      lang: 'es-AR',
      data: { url: datos.url || '/' },
    })
  )
})

// Al tocar la notificación se abre la pantalla que corresponde (siempre dentro de la app)
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  let destino = new URL('/', self.location.origin)
  try {
    const pedido = new URL(evento.notification.data?.url || '/', self.location.origin)
    if (pedido.origin === self.location.origin) destino = pedido
  } catch { /* se abre el inicio */ }

  evento.waitUntil((async () => {
    const ventanas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const abierta = ventanas.find((v) => new URL(v.url).origin === self.location.origin)
    if (abierta) {
      await abierta.focus()
      if ('navigate' in abierta) await abierta.navigate(destino.href)
      return
    }
    await self.clients.openWindow(destino.href)
  })())
})
