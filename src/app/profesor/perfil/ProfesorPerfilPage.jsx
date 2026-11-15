import { useRef, useState } from "react"
import { Moon, Sun, LogOut } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { panelesPermitidos } from "@/lib/paneles"
import { cerrarSesionEnServidor } from "@/lib/sesion"
import { useTheme } from "@/components/theme-provider"
import { useTemaProfesor } from "../paletaProfesor"
import { useEsMovil } from "../movil"
import { TituloPagina } from "@/components/TituloPagina"

const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"]
const MAX_FOTO_BYTES = 2 * 1024 * 1024

const iniciales = (nombre = "") => {
  if (!nombre.trim()) return "??"
  const p = nombre.trim().split(" ")
  return (p.length > 1 ? p[0][0] + p[1][0] : nombre.substring(0, 2)).toUpperCase()
}

// Campos que se editan (la referencia usa nombre, correo y teléfono)
const CAMPOS = [
  { k: "nombre", l: "Nombre completo", type: "text", ph: "Tu nombre" },
  { k: "email", l: "Correo electrónico", type: "email", ph: "nombre@correo.com" },
  { k: "telefono", l: "Teléfono", type: "tel", ph: "+54 370 412 3456" },
]

export default function ProfesorPerfilPage() {
  const C = useTemaProfesor()
  const movil = useEsMovil()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const inputFoto = useRef(null)
  const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem("usuario") || "{}"))
  const [datos, setDatos] = useState(() => {
    const u = JSON.parse(localStorage.getItem("usuario") || "{}")
    return { nombre: u.nombrecompleto || u.nombre || "", email: u.email || u.correo || "", telefono: u.telefono || "" }
  })
  const [borrador, setBorrador] = useState(null) // copia mientras se edita
  const [avatarUrl, setAvatarUrl] = useState(() => JSON.parse(localStorage.getItem("usuario") || "{}").avatarUrl || localStorage.getItem("avatarUrl") || "")
  const [guardando, setGuardando] = useState(false)

  const editando = borrador !== null
  const guardar = async () => {
    if (!usuario?.idUsuario) { toast.error("No pudimos identificar tu usuario"); return }
    setGuardando(true)
    try {
      // Solo nombre y teléfono (y correo si cambió). El perfil y el estado no se mandan: el servidor los ignora para uno mismo
      const cuerpo = { nombrecompleto: borrador.nombre.trim(), telefono: borrador.telefono.trim() }
      if (borrador.email.trim() !== datos.email) cuerpo.correo = borrador.email.trim()
      await apiClient.put(`/usuarios/${usuario.idUsuario}`, cuerpo)
      const nuevo = { ...usuario, nombrecompleto: cuerpo.nombrecompleto, telefono: cuerpo.telefono, ...(cuerpo.correo ? { email: cuerpo.correo } : {}) }
      localStorage.setItem("usuario", JSON.stringify(nuevo))
      setUsuario(nuevo)
      setDatos({ nombre: cuerpo.nombrecompleto, email: borrador.email.trim(), telefono: cuerpo.telefono })
      setBorrador(null)
      toast.success("Datos guardados")
    } catch (err) {
      toast.error("No se pudo guardar", { description: err?.response?.data?.message || "Probá de nuevo." })
    } finally {
      setGuardando(false)
    }
  }

  const elegirFoto = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    if (!TIPOS_FOTO.includes(f.type)) { toast.error("La foto tiene que ser JPG, PNG o WEBP"); return }
    if (f.size > MAX_FOTO_BYTES) { toast.error("La foto pesa más de 2 MB"); return }
    const lector = new FileReader()
    lector.onload = async () => {
      try {
        const r = await apiClient.put(`/usuarios/${usuario.idUsuario}/avatar`, { avatarData: lector.result })
        const url = r.data?.data?.avatarUrl || lector.result
        setAvatarUrl(url)
        localStorage.setItem("avatarUrl", url)
        localStorage.setItem("usuario", JSON.stringify({ ...usuario, avatarUrl: url }))
        window.dispatchEvent(new CustomEvent("avatar-updated", { detail: url }))
        toast.success("Actualizamos tu foto")
      } catch {
        toast.error("No se pudo guardar la foto")
      }
    }
    lector.readAsDataURL(f)
  }

  const verDato = (v) => (v && String(v).trim() ? String(v) : null)
  const campoEstilo = { width: "100%", height: 48, boxSizing: "border-box", padding: "0 14px", borderRadius: 10, border: `1px solid ${C.btnLine}`, background: C.surf, color: C.ink, font: "500 16px Archivo", outline: "none" }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1152, width: "100%", margin: "0 auto", color: C.ink, fontFamily: "Archivo, sans-serif" }}>
      {!movil && <TituloPagina descripcion="Tus datos de contacto">Mi perfil</TituloPagina>}
      {panelesPermitidos().alumno && (
        <Link to="/alumno" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: C.okBg, border: `1px solid ${C.okLine}`, color: C.ink, textDecoration: "none" }}>
          <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, background: C.lime, color: C.onLime, display: "grid", placeItems: "center" }} aria-hidden="true">⇄</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", font: "700 15px Archivo" }}>También sos alumno</span>
            <span style={{ display: "block", font: "400 13px Archivo", color: C.muted }}>Cambiá al modo alumno para reservar clases y ver tu membresía.</span>
          </span>
          <span style={{ font: "700 14px Archivo", color: C.okFg, whiteSpace: "nowrap" }}>Cambiar a alumno</span>
        </Link>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap: 16, alignItems: "start" }}>
        <section aria-label="Foto de perfil" style={{ position: "relative", overflow: "hidden", padding: movil ? 16 : "28px 24px", borderRadius: movil ? 16 : 20, background: "#0e0e0e", color: "#ecefe4", border: `1px solid ${C.line}`, display: "flex", flexDirection: movil ? "row" : "column", flexWrap: movil ? "wrap" : undefined, alignItems: "center", gap: movil ? 14 : 10, textAlign: movil ? "left" : "center" }}>
          <span style={{ position: "relative", width: movil ? 64 : 112, height: movil ? 64 : 112, flexShrink: 0, borderRadius: "50%", background: "#2a2c24", border: `3px solid ${C.lime}`, boxSizing: "border-box", display: "grid", placeItems: "center", overflow: "hidden", font: movil ? "900 24px 'Big Shoulders Stencil Display'" : "900 40px 'Big Shoulders Stencil Display'", color: C.lime }}>
            {avatarUrl ? <img src={avatarUrl} alt={datos.nombre || "Foto de perfil"} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : iniciales(datos.nombre)}
          </span>
          {/* Celular: nombre y chip en una columna, como la referencia; en computadora, uno debajo del otro centrado */}
          <div style={movil ? { position: "relative", minWidth: 0, flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 } : { position: "relative", display: "contents" }}>
            <h2 style={{ position: "relative", minWidth: 0, margin: movil ? 0 : "6px 0 0", font: movil ? "900 24px/1 'Big Shoulders Stencil Display'" : "900 30px/1 'Big Shoulders Stencil Display'", textTransform: "uppercase" }}>{datos.nombre || "Sin cargar"}</h2>
            <span style={{ position: "relative", padding: "3px 12px", borderRadius: 999, border: `1px solid ${C.okLine}`, background: "#16220a", color: C.lime, font: "700 11px Archivo", letterSpacing: ".08em" }}>PROFESOR</span>
          </div>
          <input ref={inputFoto} type="file" accept={TIPOS_FOTO.join(",")} onChange={elegirFoto} style={{ display: "none" }} aria-label="Elegir foto de perfil" />
          {/* Celular: botón de cámara de 44 px a la derecha (como la referencia); en computadora, con texto */}
          <button onClick={() => inputFoto.current?.click()} aria-label="Cambiar foto" style={movil
            ? { position: "relative", marginLeft: "auto", width: 44, height: 44, flexShrink: 0, borderRadius: 12, border: "1px solid #4a4d42", background: "transparent", color: "#ecefe4", display: "grid", placeItems: "center", cursor: "pointer" }
            : { position: "relative", marginTop: 6, height: 44, whiteSpace: "nowrap", padding: "0 16px", borderRadius: 10, border: "1px solid #4a4d42", background: "transparent", color: "#ecefe4", font: "700 14px Archivo", cursor: "pointer" }}>
            {movil ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /></svg>
            ) : "Cambiar foto"}
          </button>
        </section>

        <section aria-labelledby="t-dp" style={{ borderRadius: 16, background: C.card, border: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${C.line}` }}>
            <h2 id="t-dp" style={{ flex: 1, margin: 0, font: "700 17px Archivo" }}>Datos personales</h2>
            {!editando ? (
              movil ? (
                <button onClick={() => setBorrador({ ...datos })} style={{ height: 44, padding: "0 4px", border: "none", background: "transparent", color: C.okFg, font: "700 14px Archivo", cursor: "pointer" }}>Editar</button>
              ) : (
                <button onClick={() => setBorrador({ ...datos })} style={{ height: 44, display: "flex", alignItems: "center", gap: 6, padding: "0 14px", borderRadius: 10, border: `1px solid ${C.btnLine}`, background: "transparent", color: C.ink, font: "700 14px Archivo", cursor: "pointer" }}>Editar</button>
              )
            ) : null}
          </div>
          <dl style={{ margin: 0, padding: "6px 20px 14px" }}>
            {CAMPOS.map((c, i) => (
              <div key={c.k} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "12px 0", borderTop: i ? `1px solid ${C.line2}` : "none" }}>
                <dt><label htmlFor={`pf-${c.k}`} style={{ font: "600 13px Archivo", color: C.muted }}>{c.l}</label></dt>
                <dd style={{ margin: 0 }}>
                  {!editando ? (
                    verDato(datos[c.k]) ? <span style={{ font: "600 16px Archivo", color: C.ink }}>{datos[c.k]}</span> : <span style={{ font: "600 16px Archivo", color: C.muted }}>Sin cargar · tocá Editar para agregarlo</span>
                  ) : (
                    <input id={`pf-${c.k}`} type={c.type} value={borrador[c.k]} placeholder={c.ph} onChange={(e) => setBorrador({ ...borrador, [c.k]: e.target.value })} style={campoEstilo} />
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {editando && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "0 20px 18px" }}>
              <button onClick={() => setBorrador(null)} disabled={guardando} style={{ height: 46, padding: "0 16px", borderRadius: 10, border: `1px solid ${C.btnLine}`, background: "transparent", color: C.ink, font: "700 14px Archivo", cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardar} disabled={guardando} style={{ height: 46, padding: "0 18px", border: "none", borderRadius: 10, background: C.lime, color: C.onLime, font: "800 14px Archivo", cursor: "pointer", opacity: guardando ? 0.6 : 1 }}>Guardar cambios</button>
            </div>
          )}
        </section>
        {/* Celular: cambio de tema y cerrar sesión (en computadora están en la barra de arriba) */}
        {movil && (
          <>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, color: C.ink, font: "700 15px Archivo", textAlign: "left", cursor: "pointer" }}>
              {theme === "dark" ? <Moon className="h-[19px] w-[19px]" /> : <Sun className="h-[19px] w-[19px]" />}
              <span style={{ flex: 1 }}>{theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}</span>
            </button>
            <button onClick={() => { cerrarSesionEnServidor(); localStorage.clear(); navigate("/login") }} style={{ minHeight: 56, display: "flex", alignItems: "center", gap: 12, padding: "0 16px", borderRadius: 14, border: `1px solid ${C.line}`, background: C.card, color: C.errFg, font: "700 15px Archivo", textAlign: "left", cursor: "pointer" }}>
              <LogOut className="h-[19px] w-[19px]" />
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </div>
  )
}
