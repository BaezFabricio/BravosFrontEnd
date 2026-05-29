**Configuración de FRONTEND_URL y enlaces de verificación**

Resumen
- El problema reportado: los emails de verificación contienen `localhost` y sólo funcionan si se abren en la misma máquina donde corre el frontend.
- Solución: hacer que el backend genere links absolutos usando una variable de entorno `FRONTEND_URL` (apuntando al host público o IP LAN correspondiente).

Variables de entorno recomendadas
- `FRONTEND_URL` (backend): URL pública del frontend que se usará en los emails. Ejemplo: `https://app.midominio.com` o `http://192.168.1.50:5173` para dev LAN.
- `VITE_API_BASE_URL` (frontend): base para las llamadas API desde la app (ej. `/api/vv1` o `https://api.midominio.com/api/vv1`).

Ejemplo (Node.js / Express) — generar link de verificación en backend
```js
// suponiendo que tienes un token de verificación (token)
const frontend = process.env.FRONTEND_URL || 'http://localhost:5173'
const verificationUrl = `${frontend.replace(/\/$/, '')}/verificar-cuenta/${token}`

// Enviar email (pseudo código)
const html = `
  <p>Hola ${user.nombre},</p>
  <p>Hacé click en el siguiente enlace para verificar tu cuenta:</p>
  <a href="${verificationUrl}">${verificationUrl}</a>
`
// luego enviar con tu función de correo
sendMail(user.email, 'Verificá tu cuenta', html)
```

Notas y pruebas
- En desarrollo podés usar la IP de tu máquina (ej. `http://192.168.1.50:5173`) para que otros dispositivos en la misma LAN puedan abrir el link.
- Alternativa temporal: exponer tu dev con `ngrok http 5173` y usar la URL que te da ngrok como `FRONTEND_URL`.

Pruebas por curl
- Verificar token (GET):
```bash
curl -i "http://TU_BACKEND_HOST/api/vv1/auth/verificar/TU_TOKEN"
```

- Reenviar verificación (POST):
```bash
curl -i -X POST "http://TU_BACKEND_HOST/api/vv1/auth/reenviar-verificacion" \
  -H "Content-Type: application/json" \
  -d '{"idUsuario":"ID_DEL_USUARIO","nuevoCorreo":"mi@correo.com"}'
```

Checklist antes de producción
- [ ] Backend genera enlaces con `FRONTEND_URL` (no `localhost`).
- [ ] Emails contienen URL absoluta válida y con HTTPS en producción.
- [ ] CORS configurado en backend para permitir orígenes del frontend.
- [ ] Revisar `SameSite` y `domain` de cookies si se usan cookies de sesión.
