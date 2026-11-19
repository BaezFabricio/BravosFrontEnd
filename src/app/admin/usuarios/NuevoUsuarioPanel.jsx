import { useEffect, useState } from "react"
import { Check, Eye, EyeOff, RefreshCw } from "lucide-react"
import { toast } from "@/lib/notificar"
import { crearUsuario, getUsuarios } from "@/api"
import PanelLateral, { Campo, Seccion, Divisor, estiloInput, botonSecundario, botonPrincipal } from "@/components/PanelLateral"

/*
 * Nuevo usuario (escritorio): panel lateral sobre la lista de usuarios. La cuenta la crea el administrador: nace activa, con el
 * correo verificado y una contraseña temporal que la persona cambia al entrar por primera vez. Puede tener más de un perfil
 * (por ejemplo Alumno y Profesor): los permisos se suman y el primero que se marca es el principal.
 */
const REGLAS = [
  ["8 caracteres o más", (p) => p.length >= 8],
  ["Una mayúscula", (p) => /[A-Z]/.test(p)],
  ["Una minúscula", (p) => /[a-z]/.test(p)],
  ["Un número", (p) => /\d/.test(p)],
]
const problemaContrasena = (p = "") => {
  const falla = REGLAS.find(([, ok]) => !ok(p))
  return falla ? `Falta: ${falla[0].toLowerCase()}.` : null
}

// Contraseña temporal al azar (generador criptográfico del navegador). Sin letras que se confunden (l, I, O, 0).
function generarContrasena() {
  const may = "ABCDEFGHJKLMNPQRSTUVWXYZ", min = "abcdefghijkmnopqrstuvwxyz", num = "23456789"
  const todos = may + min + num
  const azar = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n }
  const letras = [may[azar(may.length)], min[azar(min.length)], num[azar(num.length)]]
  while (letras.length < 10) letras.push(todos[azar(todos.length)])
  for (let i = letras.length - 1; i > 0; i--) { const j = azar(i + 1); [letras[i], letras[j]] = [letras[j], letras[i]] }
  return letras.join("")
}

// Qué puede hacer cada perfil conocido (los perfiles salen de la base; los que no están acá usan su propia descripción)
const AYUDA_PERFIL = { alumno: "Reserva y entrena", profesor: "Toma lista y ve rutinas", admin: "Acceso a este panel" }
const ORDEN = ["alumno", "profesor", "admin"]
const clave = (p) => String(p.nombrePerfil || "").trim().toLowerCase()
const ordenar = (lista) => [...lista].sort((a, b) => {
  const ia = ORDEN.indexOf(clave(a)), ib = ORDEN.indexOf(clave(b))
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
})
const normalizarTelefono = (t = "") => t.replace(/\D/g, "")

const VACIO = { nombre: "", dni: "", telefono: "", email: "" }

export default function NuevoUsuarioPanel({ open, onOpenChange, onCreado }) {
  const [form, setForm] = useState(VACIO)
  const [perfiles, setPerfiles] = useState([])
  const [cargandoPerfiles, setCargandoPerfiles] = useState(true)
  const [elegidos, setElegidos] = useState([]) // ids (texto); el primero es el principal
  const [password, setPassword] = useState("")
  const [ver, setVer] = useState(false)
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)

  // Al abrir: formulario limpio y una contraseña temporal nueva
  useEffect(() => {
    if (!open) return
    setForm(VACIO); setErrores({}); setVer(false); setPassword(generarContrasena())
    let vigente = true
    setCargandoPerfiles(true)
    fetch("/api/vv1/perfiles")
      .then((r) => r.json())
      .then((r) => {
        if (!vigente) return
        const lista = r.success && Array.isArray(r.data) ? ordenar(r.data) : []
        setPerfiles(lista)
        // Por defecto, Alumno (el alta más común). Nunca uno con más poder.
        const alumno = lista.find((p) => clave(p).includes("alumno"))
        setElegidos(alumno ? [String(alumno.idPerfil)] : [])
      })
      .catch(() => { if (vigente) toast.error("No se pudieron cargar los perfiles", { description: "Sin perfiles no se puede crear el usuario. Cerrá el panel y probá de nuevo." }) })
      .finally(() => { if (vigente) setCargandoPerfiles(false) })
    return () => { vigente = false }
  }, [open])

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((x) => (x[campo] ? { ...x, [campo]: undefined } : x))
  }
  const alternar = (id) => {
    setElegidos((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
    setErrores((x) => (x.perfil ? { ...x, perfil: undefined } : x))
  }

  const guardar = async (e) => {
    e?.preventDefault()
    const nuevos = {}
    if (form.nombre.trim().length < 2) nuevos.nombre = "Escribí el nombre y apellido."
    if (!/^\d{6,10}$/.test(form.dni.trim())) nuevos.dni = "Entre 6 y 10 números, sin puntos."
    if (form.telefono.trim() && !/^[\d\s+()-]{6,30}$/.test(form.telefono.trim())) nuevos.telefono = "Solo números, espacios, + y guiones."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nuevos.email = "El correo no es válido."
    if (elegidos.length === 0) nuevos.perfil = "Elegí al menos un perfil."
    const pw = problemaContrasena(password)
    if (pw) nuevos.password = pw
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return

    setEnviando(true)
    try {
      // Si ya existe alguien con ese correo, DNI o teléfono, se avisa antes de intentar crearlo
      const usuarios = await getUsuarios()
      const email = form.email.trim().toLowerCase(), dni = form.dni.trim(), tel = normalizarTelefono(form.telefono)
      const repetido = usuarios.find((u) =>
        (u.email || "").trim().toLowerCase() === email || (u.dni || "").trim() === dni || (tel && normalizarTelefono(u.telefono || "") === tel))
      if (repetido) {
        const campo = (repetido.email || "").trim().toLowerCase() === email ? "correo" : (repetido.dni || "").trim() === dni ? "DNI" : "teléfono"
        toast.error(`Ya existe un usuario con ese ${campo}`, { description: "Usá otro dato o editá el usuario existente." })
        return
      }
      await crearUsuario({ nombre: form.nombre.trim(), dni, email, telefono: form.telefono.trim(), perfiles: elegidos, password })
      toast.success("Usuario creado", { guardar: false })
      onOpenChange(false)
      onCreado?.()
    } catch (err) {
      const mensaje = err.response?.data?.message
      toast.error("No se pudo crear el usuario", { description: mensaje || "Revisá los datos e intentá de nuevo." })
    } finally {
      setEnviando(false)
    }
  }

  const pie = (
    <>
      <button type="button" onClick={() => onOpenChange(false)} disabled={enviando} style={botonSecundario}>Cancelar</button>
      <button type="submit" form="form-nuevo-usuario" disabled={enviando || cargandoPerfiles} style={botonPrincipal(enviando || cargandoPerfiles)}>
        {enviando ? "Creando…" : "Crear usuario"}
      </button>
    </>
  )

  return (
    <PanelLateral
      open={open}
      onOpenChange={onOpenChange}
      titulo="Nuevo usuario"
      descripcion="Con cuenta para entrar a la app. Si no va a usar la app, usá «Alumno sin cuenta»."
      pie={pie}
    >
      <form id="form-nuevo-usuario" onSubmit={guardar} noValidate>
        <Seccion titulo="Datos personales">
          <Campo id="nu-nombre" etiqueta="Nombre y apellido" error={errores.nombre}>
            <input id="nu-nombre" value={form.nombre} onChange={cambiar("nombre")} maxLength={100} autoComplete="off" autoFocus placeholder="Ej: Juan Pérez" style={estiloInput(errores.nombre)} />
          </Campo>
          <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", alignItems: "start" }}>
            <Campo id="nu-dni" etiqueta="DNI" error={errores.dni}>
              <input id="nu-dni" value={form.dni} onChange={cambiar("dni")} inputMode="numeric" maxLength={10} autoComplete="off" placeholder="Sin puntos" style={estiloInput(errores.dni)} />
            </Campo>
            <Campo id="nu-tel" etiqueta="Teléfono" opcional ayuda="Lo usamos para avisos por WhatsApp." error={errores.telefono}>
              <input id="nu-tel" value={form.telefono} onChange={cambiar("telefono")} inputMode="tel" maxLength={30} autoComplete="off" placeholder="3704 123456" style={estiloInput(errores.telefono)} />
            </Campo>
          </div>
          <Campo id="nu-email" etiqueta="Correo" ayuda="Con este correo inicia sesión." error={errores.email}>
            <input id="nu-email" type="email" value={form.email} onChange={cambiar("email")} maxLength={100} autoComplete="off" placeholder="nombre@correo.com" style={estiloInput(errores.email)} />
          </Campo>
        </Seccion>

        <Divisor />

        <Seccion titulo="Perfil">
          <p id="nu-perfil-ayuda" style={{ margin: "-8px 0 0", font: "500 12px/1.45 Archivo, sans-serif", color: "var(--muted-foreground)" }}>
            Podés elegir más de uno. El primero que marques es el principal.
          </p>
          {cargandoPerfiles ? (
            <p style={{ margin: 0, font: "500 13px Archivo, sans-serif", color: "var(--muted-foreground)" }}>Cargando perfiles…</p>
          ) : perfiles.length === 0 ? (
            <p style={{ margin: 0, font: "600 13px Archivo, sans-serif", color: "var(--sh-danger)" }}>No hay perfiles creados. Creá uno en Perfiles.</p>
          ) : (
            <div role="group" aria-describedby="nu-perfil-ayuda" style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))" }}>
              {perfiles.map((p) => {
                const id = String(p.idPerfil)
                const activo = elegidos.includes(id)
                return (
                  <button key={id} type="button" role="checkbox" aria-checked={activo} onClick={() => alternar(id)}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                    style={{
                      display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-start", textAlign: "left", padding: "12px 14px", borderRadius: 10, cursor: "pointer", minHeight: 62,
                      border: `1px solid ${activo ? "var(--primary)" : "var(--border)"}`,
                      background: activo ? "color-mix(in srgb, var(--primary) 14%, transparent)" : "transparent", color: "var(--foreground)",
                    }}>
                    <span style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 6, font: "700 14px Archivo, sans-serif" }}>
                      {p.nombrePerfil}
                      {activo && <Check size={14} strokeWidth={3} aria-hidden="true" style={{ color: "var(--primary)", flex: "none" }} />}
                    </span>
                    <span style={{ font: "500 12px/1.35 Archivo, sans-serif", color: "var(--muted-foreground)" }}>
                      {AYUDA_PERFIL[clave(p)] || p.descripcion || ""}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
          {errores.perfil && <p role="alert" style={{ margin: 0, font: "600 12px Archivo, sans-serif", color: "var(--sh-danger)" }}>{errores.perfil}</p>}
        </Seccion>

        <Divisor />

        <Seccion titulo="Acceso">
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label htmlFor="nu-pass" style={{ font: "700 13px Archivo, sans-serif" }}>Contraseña temporal</label>
              <button type="button" onClick={() => { setPassword(generarContrasena()); setVer(true); setErrores((x) => ({ ...x, password: undefined })) }}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", padding: "2px 4px", borderRadius: 6, color: "var(--primary)", font: "700 13px Archivo, sans-serif", cursor: "pointer" }}>
                <RefreshCw size={14} aria-hidden="true" /> Generar otra
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <input id="nu-pass" type={ver ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setErrores((x) => ({ ...x, password: undefined })) }}
                autoComplete="new-password" maxLength={72} aria-describedby="nu-reglas" style={{ ...estiloInput(errores.password), paddingRight: 46 }} />
              <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                style={{ position: "absolute", right: 6, top: 5, display: "grid", placeItems: "center", width: 36, height: 36, background: "transparent", border: "none", borderRadius: 8, color: "var(--muted-foreground)", cursor: "pointer" }}>
                {ver ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
            <ul id="nu-reglas" style={{ listStyle: "none", margin: "4px 0 0", padding: 0, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "6px 14px" }}>
              {REGLAS.map(([texto, ok]) => {
                const cumple = ok(password)
                return (
                  <li key={texto} style={{ display: "flex", alignItems: "center", gap: 7, font: "600 12px Archivo, sans-serif", color: cumple ? "var(--primary)" : "var(--muted-foreground)" }}>
                    <Check size={13} strokeWidth={3} aria-hidden="true" style={{ opacity: cumple ? 1 : 0.35 }} />
                    {texto}<span className="sr-only">{cumple ? ": cumple" : ": falta"}</span>
                  </li>
                )
              })}
            </ul>
            {errores.password && <p role="alert" style={{ margin: 0, font: "600 12px Archivo, sans-serif", color: "var(--sh-danger)" }}>{errores.password}</p>}
            <p style={{ margin: 0, font: "500 12px/1.45 Archivo, sans-serif", color: "var(--muted-foreground)" }}>Al entrar por primera vez le pedimos que la cambie.</p>
          </div>
        </Seccion>
      </form>
    </PanelLateral>
  )
}
