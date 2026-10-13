# Bravos Box como aplicación instalable (PWA)

## 1. Qué es y para qué sirve

Una **PWA** (*Progressive Web App*, aplicación web progresiva) es una aplicación web que el navegador permite **instalar** en el celular o la computadora, como si fuera una app nativa, sin pasar por Play Store ni App Store.

En Bravos Box esto significa que el alumno, el profesor o el administrador puede:

- **Instalar la app** desde el navegador y tener el ícono de Bravos Box en la pantalla de inicio.
- **Abrirla a pantalla completa**, sin la barra de direcciones del navegador.
- **Cargarla más rápido** a partir de la segunda vez, porque la estructura de la app queda guardada en el dispositivo.
- **Recibir las actualizaciones automáticamente**: cuando se publica una versión nueva, la app instalada se actualiza sola.

Sigue siendo **la misma aplicación web**: un único código para computadora, Android e iPhone. No hay una app aparte que mantener.

### Lo que la PWA *no* cambia

- **Necesita internet para los datos.** Reservas, pagos, créditos, abonos y perfiles se piden siempre al servidor en el momento. Sin conexión, la app abre pero no puede mostrar ni cargar información.
- **No reemplaza al backend.** El servidor, la base de datos y Mercado Pago siguen funcionando igual que antes.

---

## 2. Componentes de una PWA

| Pieza | Qué hace | Dónde está en el proyecto |
|---|---|---|
| **Manifiesto** (`manifest.webmanifest`) | Le dice al navegador el nombre de la app, sus íconos, colores y cómo abrirla. Sin él no se puede instalar. | Lo genera el build a partir de `vite.config.js` |
| **Service worker** (`sw.js`) | Programa que corre en segundo plano en el navegador: guarda los archivos de la app y la actualiza. | Lo genera el build (`dist/sw.js`) |
| **Íconos** | Imagen de la app en la pantalla de inicio, en la pantalla de carga y en la pestaña. | `public/` |
| **HTTPS** | Requisito del navegador para instalar una PWA (salvo en `localhost`). | Lo da el hosting o el túnel (ngrok / Cloudflare) |

---

## 3. Qué se implementó

### 3.1 Herramienta

Se usó el complemento **`vite-plugin-pwa`** (versión **1.3.0**), que se integra al build de Vite y genera automáticamente el manifiesto y el service worker (con la librería Workbox de Google).

> Se eligió la versión 1.3.0 (publicada en mayo de 2026) en lugar de la 2.0.0 (publicada a comienzos de octubre de 2026) por estabilidad: la 1.3.0 ya tiene varios meses de uso y es compatible con Vite 8, que usa el proyecto.

Instalación (ya realizada):

```bash
npm install -D vite-plugin-pwa@1.3.0
```

### 3.2 Archivos modificados y agregados

| Archivo | Cambio |
|---|---|
| `vite.config.js` | Configuración de la PWA: manifiesto, qué se guarda en el dispositivo y qué no, actualización automática y vista previa de producción. |
| `index.html` | Idioma `es-AR`, íconos nuevos, color de la barra del celular según modo claro u oscuro, descripción y nombre para iPhone. |
| `package.json` / `package-lock.json` | Nueva dependencia de desarrollo `vite-plugin-pwa`. |
| `public/pwa-192x192.png` | Ícono de la app, 192×192 px. |
| `public/pwa-512x512.png` | Ícono de la app, 512×512 px (también se usa como ícono recortable en Android). |
| `public/apple-touch-icon-180x180.png` | Ícono para iPhone / iPad, 180×180 px. |
| `public/favicon-48x48.png` | Ícono de la pestaña del navegador. |

### 3.3 Identidad visual de la app instalada

| Elemento | Valor | Motivo |
|---|---|---|
| Nombre completo | **Bravos Box** | Se muestra al instalar. |
| Nombre corto | **Bravos** | Se muestra debajo del ícono en la pantalla de inicio. |
| Ícono | Logo **BRVS** sobre fondo verde (a partir de `public/logo.jpg`) | Es cuadrado, con fondo de borde a borde y el texto centrado: Android puede recortarlo en círculo o en "gota" sin cortar las letras. |
| Color de la pantalla de carga | `#445f40` (verde del logo) | Al abrir la app, la pantalla de carga se ve del mismo color que el ícono. |
| Color de la barra del celular | `#0a0a0a` (negro de la app) en el manifiesto; en el navegador, `#e9e7e1` en modo claro y `#0a0a0a` en modo oscuro | Acompaña el tema de la app. |
| Modo de apertura | `standalone` (pantalla completa, sin barra del navegador) | Se siente como una app nativa. |
| Orientación | Vertical | La app está pensada para usarse en vertical en el celular. |
| Idioma | `es-AR` | Español de Argentina. |

Los íconos se generaron redimensionando `public/logo.jpg` (1080×1080 px) con interpolación de alta calidad.

---

## 4. Privacidad: qué se guarda en el dispositivo y qué no

El service worker guarda archivos en el dispositivo para que la app cargue rápido. Como Bravos Box maneja **datos personales** (DNI, teléfonos, pagos) y **datos sensibles** (certificados médicos, según la Ley 25.326), se definió una regla estricta:

> **En el dispositivo se guarda solo la estructura de la app. Nunca datos de personas.**

### Se guarda

| Qué | Cómo | Para qué |
|---|---|---|
| Código de la app (JavaScript), estilos (CSS) e `index.html` | Se guardan al instalar (*precache*) | Que la app abra rápido |
| Íconos de la app y el manifiesto | Se guardan al instalar | Que la app instalada tenga su ícono |
| Fotos y gráficos públicos (mascotas, logos, fondos de `public/`) | Se guardan al verlos por primera vez, hasta 60 imágenes durante 30 días | Que no se descarguen cada vez |
| Tipografías de Google Fonts | Se guardan al usarlas | Que el texto se vea igual sin volver a descargarlas |

### No se guarda nunca

| Qué | Por qué |
|---|---|
| Todo lo que responde el servidor bajo **`/api/`** (usuarios, reservas, pagos, créditos, abonos) | Son datos de personas: tienen que pedirse siempre al servidor, con la sesión de quien está usando el dispositivo. |
| Todo lo que está bajo **`/landing/`** (configuración y datos bancarios) | Es información que puede cambiar en cualquier momento y que debe leerse actualizada. |
| Todo lo que está bajo **`/uploads/`** (comprobantes de pago, certificados médicos, declaraciones juradas, videos) | Son documentos privados. Si quedaran guardados en el celular, otra persona que use ese dispositivo podría verlos. |

Además, esas tres rutas están **excluidas de la navegación del service worker** (`navigateFallbackDenylist`): el service worker nunca las responde por su cuenta; siempre van directo al servidor.

En `vite.config.js` esta regla está en la constante `RUTAS_DEL_SERVIDOR`.

---

## 5. Actualizaciones

- Se configuró **actualización automática** (`registerType: 'autoUpdate'`).
- Cuando se publica una versión nueva de la app, el service worker la detecta, descarga los archivos nuevos y la app pasa a usarlos sola. Nadie tiene que desinstalar ni reinstalar nada.
- Los archivos de versiones anteriores se borran automáticamente (`cleanupOutdatedCaches`), para no ocupar espacio de más en el dispositivo.

---

## 6. Desarrollo vs. producción

| | `npm run dev` (desarrollo) | `npm run build` + `npm run preview` (producción) |
|---|---|---|
| Service worker | **Apagado** | Activo |
| Se puede instalar | No | Sí |
| Para qué se usa | Programar: los cambios se ven al instante | Probar la app tal como la va a usar la gente |

La PWA está **apagada en desarrollo** a propósito (`devOptions: { enabled: false }`): si estuviera prendida, el navegador podría seguir mostrando una versión vieja guardada mientras se programa, y los cambios no se verían.

---

## 7. Cómo probarla

### 7.1 En la computadora

Con el backend corriendo (`npm run server` en `BravosBackEnd`):

```bash
npm run build
```

```bash
npm run preview
```

Abrir **http://localhost:4173** en Chrome o Edge. En la barra de direcciones aparece el ícono de **instalar**.

### 7.2 En el celular

El celular necesita llegar a la app por **HTTPS**. En desarrollo se usa un túnel con ngrok, apuntando al puerto de la vista previa de producción (**4173**, no 5173):

```bash
ngrok http --url=<tu-dominio-ngrok> 4173
```

Después, abrir `https://<tu-dominio-ngrok>` en el celular.

> El dominio de ngrok tiene que estar permitido en `vite.config.js` (`server.allowedHosts`); la vista previa usa la misma lista.

### 7.3 Instalar en el celular

**Android (Chrome):**
1. Abrir la dirección de la app.
2. Menú **⋮** → **"Instalar app"** (o "Agregar a la pantalla principal").
3. Confirmar. Aparece el ícono de Bravos en la pantalla de inicio.

**iPhone (Safari):**
1. Abrir la dirección de la app **en Safari** (en iPhone, solo Safari permite instalar apps web).
2. Botón **Compartir** (cuadrado con flecha) → **"Agregar a inicio"**.
3. Confirmar. Aparece el ícono de Bravos en la pantalla de inicio.

**Para desinstalar:** como cualquier app, manteniendo presionado el ícono y eligiendo "Desinstalar" o "Eliminar".

---

## 8. Verificación realizada

La PWA se verificó con la versión de producción (`npm run build` + `npm run preview`) en **Microsoft Edge 155** (motor Chromium, el mismo de Chrome), usando el protocolo de depuración del navegador:

| Prueba | Resultado |
|---|---|
| El build genera el manifiesto y el service worker | ✅ `manifest.webmanifest`, `sw.js` y `registerSW.js` en `dist/` |
| El manifiesto se lee sin errores | ✅ Sin errores |
| La app cumple los requisitos para instalarse | ✅ El navegador no reporta errores de instalación |
| El service worker se registra y controla la página | ✅ Activo y controlando |
| Qué quedó guardado en el dispositivo | ✅ Solo: `index.html`, el código JS, los estilos CSS, `registerSW.js`, los 4 íconos y el manifiesto. Nada de `/api`, `/landing` ni `/uploads`. |
| La configuración pasa el linter | ✅ `eslint vite.config.js` sin errores |

---

## 9. Limitaciones conocidas

- **Sin conexión, la app no muestra datos.** Abre, pero reservas, pagos y demás necesitan internet.
- **Tamaño de la descarga inicial.** Todo el código de la app está en un solo archivo de unos 2,1 MB (589 KB comprimido), y la primera instalación lo descarga completo. Se puede mejorar dividiendo el código por pantallas. Por este tamaño se subió el límite de archivos guardados a 3 MB (`maximumFileSizeToCacheInBytes`); el límite por defecto es 2 MB.
- **Notificaciones en el teléfono** (por ejemplo, "tu membresía vence mañana"): la PWA lo permite, pero **no está implementado**. Requiere trabajo en el frontend y en el backend. En iPhone solo funcionan con la app instalada en la pantalla de inicio (iOS 16.4 o posterior).
- **En iPhone** la instalación se hace a mano desde Safari: no aparece un aviso automático de "instalar" como en Android.

---

## 10. Mantenimiento

### Cambiar el ícono

1. Reemplazar `public/logo.jpg` por la imagen nueva (cuadrada, idealmente 1080×1080 px o más, con el contenido importante dentro del 80 % central).
2. Volver a generar los cuatro íconos en los tamaños de la tabla de la sección 3.2 (192, 512, 180 y 48 px), con los mismos nombres.
3. Hacer un build nuevo. La app instalada toma el ícono nuevo al actualizarse; en algunos teléfonos hace falta reinstalarla para ver el cambio de ícono.

### Cambiar nombre o colores

Editar el bloque `manifest` en `vite.config.js` (`name`, `short_name`, `theme_color`, `background_color`) y los `<meta name="theme-color">` de `index.html`.

### Si se agrega una ruta nueva al backend

Si el backend empieza a atender una ruta nueva que **no** empieza con `/api/`, `/landing/` ni `/uploads/`, hay que agregarla a `RUTAS_DEL_SERVIDOR` en `vite.config.js`. Si no, el service worker podría responder esa ruta con la app en lugar de ir al servidor.

---

## 11. Referencias

- Complemento usado: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- Librería del service worker: [Workbox (Google)](https://developer.chrome.com/docs/workbox)
- Qué es una PWA: [web.dev — Progressive Web Apps](https://web.dev/explore/progressive-web-apps)
- Manifiesto: [MDN — Web app manifest](https://developer.mozilla.org/es/docs/Web/Manifest)
