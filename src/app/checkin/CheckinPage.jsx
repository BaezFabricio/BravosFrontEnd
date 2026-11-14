import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, Maximize, Minimize } from "lucide-react"

/*
 * Check-in del gimnasio (para una tablet o una pantalla en recepción), referencia 02. Sin sesión: el alumno escribe su DNI
 * y se registra su asistencia de hoy, solo si tiene reserva en este horario. El equipo se configura una vez con su clave.
 */

const CLAVE_EQUIPO = "bravos-checkin-clave"
const TIEMPO_RESULTADO_MS = 9000
const MIN_CLAVE = 12
const leerClave = () => { try { return localStorage.getItem(CLAVE_EQUIPO) || "" } catch { return "" } }
const guardarClave = (c) => { try { localStorage.setItem(CLAVE_EQUIPO, c) } catch { /* sin almacenamiento */ } }
const conPuntos = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

// "Volver al panel" solo aparece si quien abre la pantalla tiene sesión de administración
const vieneDelAdmin = () => { try { return JSON.parse(localStorage.getItem("permisos") || "[]").some((p) => String(p).startsWith("configuracion:")) } catch { return false } }

async function registrar(dni, clave) {
  const res = await fetch("/api/vv1/asistencia/check-in", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-clave-checkin": clave },
    body: JSON.stringify({ dni }),
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data: json.data, mensaje: json.message, codigo: json.errorCode }
}

const BORDE = "var(--ck-borde, #2a2a2a)"
const TEXTO = "#ecefe4"
const MUDO = "#a3a698"
const SUAVE = "#c9ccbf"
const lima = { background: "#9be600", color: "#0b0b0b", cursor: "pointer" }
const apagado = { background: "#262626", color: "#7d8073", cursor: "not-allowed" }
const etiqueta = { display: "block", font: "700 12px Archivo", letterSpacing: "0.1em", color: MUDO }

export default function CheckinPage() {
  const [clave, setClave] = useState(leerClave)
  const [claveNueva, setClaveNueva] = useState("")
  const [verClave, setVerClave] = useState(false)
  const [dni, setDni] = useState("")
  const [errorDni, setErrorDni] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null) // { tipo: "ok" | "error", ... }
  const [configurando, setConfigurando] = useState(false)
  const temporizador = useRef(null)

  // Después de un registro, la pantalla vuelve sola a la espera para el siguiente alumno
  useEffect(() => {
    if (!resultado) return undefined
    temporizador.current = setTimeout(() => { setResultado(null); setDni("") }, TIEMPO_RESULTADO_MS)
    return () => clearTimeout(temporizador.current)
  }, [resultado])

  const dniValido = dni.length >= 7 && dni.length <= 8

  const enviar = async (e) => {
    e?.preventDefault()
    if (enviando) return
    if (!dniValido) { setErrorDni(dni ? "El DNI tiene 7 u 8 números. Revisalo." : "Escribí tu DNI."); return }
    setEnviando(true)
    try {
      const r = await registrar(dni, clave)
      if (r.ok) setResultado({ tipo: "ok", ...r.data })
      else if (r.status === 401) {
        // La clave del equipo no es la del servidor: se vuelve a pedir
        setClave("")
        guardarClave("")
        setResultado({ tipo: "error", mensaje: "La clave de este equipo no es válida. Configurala de nuevo." })
      } else setResultado({ tipo: "error", mensaje: r.mensaje || "No se pudo registrar tu asistencia. Consultá en la recepción." })
    } catch {
      setResultado({ tipo: "error", mensaje: "Sin conexión con el servidor. Probá de nuevo o consultá en la recepción." })
    } finally {
      setEnviando(false)
    }
  }

  const volverAEspera = () => { clearTimeout(temporizador.current); setResultado(null); setDni(""); setErrorDni("") }
  const irAConfigurar = () => { setConfigurando(true); setClaveNueva("") }

  // Configuración del equipo (una sola vez)
  if (!clave || configurando) {
    const faltan = MIN_CLAVE - claveNueva.length
    const lista = faltan <= 0
    const guardar = () => { if (!lista) return; guardarClave(claveNueva.trim()); setClave(claveNueva.trim()); setClaveNueva(""); setConfigurando(false) }
    return (
      <Marco>
        <div style={{ width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <h1 style={{ margin: 0, letterSpacing: "normal", textTransform: "none", font: "800 36px / 1.1 Archivo" }}>Configurar este equipo</h1>
            <p style={{ margin: "8px 0 0", font: "500 16px / 1.5 Archivo", color: SUAVE }}>Pedile la clave de la pantalla de check-in al administrador. Se guarda una sola vez en este equipo.</p>
          </div>
          <div>
            <label htmlFor="cfg" style={etiqueta}>CLAVE DEL EQUIPO</label>
            <div style={{ position: "relative", marginTop: 8 }}>
              <input id="cfg" type={verClave ? "text" : "password"} autoFocus autoComplete="off" value={claveNueva}
                onChange={(e) => setClaveNueva(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") guardar() }}
                style={{ width: "100%", boxSizing: "border-box", height: 56, padding: "0px 52px 0px 14px", borderRadius: 10, border: `1px solid ${lista ? "#3d5a10" : BORDE}`, background: "#0e0e0e", color: TEXTO, font: "500 18px Archivo" }} />
              <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? "Ocultar clave" : "Mostrar clave"} aria-pressed={verClave}
                style={{ position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, border: "none", borderRadius: 8, background: "transparent", color: SUAVE, display: "grid", placeItems: "center", cursor: "pointer" }}>
                {verClave ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
            <div role="status" style={{ marginTop: 8, font: "600 14px Archivo", color: lista ? "#9be600" : MUDO }}>
              {!claveNueva.length ? "Mínimo 12 caracteres." : lista ? "Lista para guardar." : `Faltan ${faltan} caracteres (${claveNueva.length} de ${MIN_CLAVE}).`}
            </div>
          </div>
          <button type="button" onClick={guardar} disabled={!lista}
            style={{ height: 60, borderRadius: 12, border: "none", font: "800 17px Archivo", letterSpacing: "0.03em", ...(lista ? lima : apagado) }}>Guardar</button>
          {configurando && clave && <button type="button" onClick={() => setConfigurando(false)} style={{ border: "none", background: "transparent", color: MUDO, font: "600 14px Archivo", textDecoration: "underline", cursor: "pointer" }}>Cancelar</button>}
        </div>
      </Marco>
    )
  }

  // Resultado: asistencia registrada o error
  if (resultado) {
    if (resultado.tipo === "error") {
      return (
        <Marco>
          <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
            <p aria-hidden="true" style={{ margin: 0, font: "800 56px Archivo", color: "#ff8a80" }}>✕</p>
            <h1 style={{ margin: 0, letterSpacing: "normal", textTransform: "none", font: "800 36px / 1.1 Archivo" }}>No se pudo registrar</h1>
            <p style={{ margin: 0, font: "500 18px / 1.5 Archivo", color: SUAVE }}>{resultado.mensaje}</p>
            <button type="button" onClick={volverAEspera} style={{ marginTop: 16, width: "100%", height: 64, borderRadius: 14, border: `1px solid ${BORDE}`, background: "transparent", color: TEXTO, font: "800 18px Archivo", cursor: "pointer" }}>Volver</button>
          </div>
        </Marco>
      )
    }
    return (
      <Marco>
        <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
          <p aria-hidden="true" style={{ margin: 0, font: "800 56px Archivo", color: "#9be600" }}>✓</p>
          <h1 style={{ margin: 0, letterSpacing: "normal", textTransform: "none", font: "800 38px / 1.1 Archivo" }}>Asistencia registrada</h1>
          <p style={{ margin: 0, font: "700 24px Archivo", color: "#9be600" }}>{resultado.bienvenida}</p>
          <div style={{ marginTop: 10, width: "100%", borderRadius: 14, border: `1px solid ${BORDE}`, textAlign: "left", overflow: "hidden" }}>
            <Fila etiqueta="Clase" valor={`${resultado.clase.nombre} · ${resultado.clase.inicio} a ${resultado.clase.fin}`} />
            {resultado.semana && <Fila etiqueta="Esta semana" valor={`${resultado.semana.usadas} de ${resultado.semana.total} clases`} />}
            <Fila etiqueta="Clases disponibles" valor={String(resultado.clasesDisponibles)} />
            {resultado.vence && <Fila etiqueta="Vence" valor={resultado.vence} />}
          </div>
          <button type="button" onClick={volverAEspera} style={{ marginTop: 10, width: "100%", height: 64, borderRadius: 14, border: "none", font: "800 18px Archivo", ...lima }}>Listo</button>
          <p style={{ margin: 0, font: "500 14px Archivo", color: MUDO }}>La pantalla vuelve sola en unos segundos.</p>
        </div>
      </Marco>
    )
  }

  // Espera: se escribe el DNI
  return (
    <Marco pie={<button type="button" onClick={irAConfigurar} style={{ position: "absolute", bottom: 20, minHeight: 44, padding: "0px 12px", border: "none", background: "transparent", color: MUDO, font: "600 14px Archivo", textDecoration: "underline", cursor: "pointer" }}>Configurar equipo (solo administrador)</button>}>
      <form onSubmit={enviar} noValidate style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, letterSpacing: "normal", textTransform: "none", font: "800 40px / 1.1 Archivo" }}>Registrá tu asistencia</h1>
          <p style={{ margin: "8px 0 0", font: "500 18px Archivo", color: SUAVE }}>Escribí tu DNI con el teclado y apretá Enter.</p>
        </div>
        <div>
          <label htmlFor="dni" style={etiqueta}>DNI</label>
          <input id="dni" autoFocus inputMode="numeric" autoComplete="off" aria-invalid={Boolean(errorDni)} aria-describedby="dni-e"
            value={conPuntos(dni)}
            onChange={(e) => { setDni(e.target.value.replace(/\D/g, "").slice(0, 8)); setErrorDni("") }}
            onKeyDown={(e) => { if (e.key === "Escape") { setDni(""); setErrorDni("") } }}
            style={{ width: "100%", boxSizing: "border-box", height: 96, marginTop: 8, padding: "0px 14px", borderRadius: 10, border: `1px solid ${errorDni ? "#6b2a24" : BORDE}`, background: "#0e0e0e", color: TEXTO, textAlign: "center", font: "800 46px Archivo", letterSpacing: "0.06em", fontVariantNumeric: "tabular-nums" }} />
          <div id="dni-e" role="alert" style={{ marginTop: 8, minHeight: 20, textAlign: "center", font: "600 14px Archivo", color: "#ff8a80" }}>{errorDni}</div>
        </div>
        <button type="submit" disabled={enviando}
          style={{ height: 72, borderRadius: 14, border: "none", font: "800 20px Archivo", letterSpacing: "0.03em", ...(dniValido && !enviando ? lima : apagado) }}>
          {enviando ? "Registrando…" : "Registrar"}
        </button>
        <div aria-hidden="true" style={{ marginTop: -6, textAlign: "center", font: "500 14px Archivo", color: MUDO }}>
          o apretá <Tecla>Enter</Tecla> · <Tecla>Esc</Tecla> para borrar
        </div>
      </form>
    </Marco>
  )
}

function Tecla({ children }) {
  return <span style={{ padding: "2px 8px", borderRadius: 6, border: "1px solid #444", background: "#161616", color: TEXTO, font: "700 13px Archivo" }}>{children}</span>
}

// Marco de la pantalla: foto a la izquierda (45 %), y a la derecha la hora, pantalla completa y el contenido
function Marco({ children, pie }) {
  const [hora, setHora] = useState(() => new Date())
  const [completa, setCompleta] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setHora(new Date()), 15000)
    const cambio = () => setCompleta(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", cambio)
    return () => { clearInterval(t); document.removeEventListener("fullscreenchange", cambio) }
  }, [])
  const alternar = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { /* el navegador no permite pantalla completa aquí */ }
  }
  const reloj = `${String(hora.getHours()).padStart(2, "0")}:${String(hora.getMinutes()).padStart(2, "0")} · ${hora.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" }).replace(",", "").replace(".", "")}`
  return (
    <div className="dark" style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", background: "#050505", color: TEXTO, fontFamily: "Archivo, sans-serif" }}>
      <div className="hidden md:block" style={{ position: "relative", width: "45%", flexShrink: 0, overflow: "hidden", background: "#000" }}>
        <img src="/checkin-atleta.jpg" alt="Atleta entrenando en Bravos Box con la frase: Empieza aunque no sepas lo que viene luego" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
        <span aria-hidden="true" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 120, background: "linear-gradient(90deg, rgba(5, 5, 5, 0), #050505)" }} />
      </div>
      <div style={{ flex: "1 1 0%", minWidth: 0, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, overflowY: "auto" }}>
        <div style={{ position: "absolute", top: 24, left: 40, right: 24, display: "flex", alignItems: "center", gap: 12 }}>
          {vieneDelAdmin() && (
            <Link to="/admin/check-in" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, padding: "0px 16px", borderRadius: 10, border: "1px solid #333", color: TEXTO, font: "700 14px Archivo", textDecoration: "none", whiteSpace: "nowrap" }}>
              <ArrowLeft className="h-[17px] w-[17px]" aria-hidden="true" /> Volver al panel
            </Link>
          )}
          <span style={{ flex: "1 1 0%" }} />
          <span style={{ font: "700 15px Archivo", color: SUAVE, fontVariantNumeric: "tabular-nums" }}>{reloj}</span>
          <button type="button" onClick={alternar} aria-label={completa ? "Salir de pantalla completa" : "Pantalla completa"}
            style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid #333", background: "transparent", color: TEXTO, display: "grid", placeItems: "center", cursor: "pointer" }}>
            {completa ? <Minimize className="h-[19px] w-[19px]" aria-hidden="true" /> : <Maximize className="h-[19px] w-[19px]" aria-hidden="true" />}
          </button>
        </div>
        {children}
        {pie}
      </div>
    </div>
  )
}

function Fila({ etiqueta: titulo, valor }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, padding: "14px 20px", borderTop: `1px solid ${BORDE}` }}>
      <span style={{ font: "700 13px Archivo", letterSpacing: "0.08em", textTransform: "uppercase", color: MUDO }}>{titulo}</span>
      <span style={{ textAlign: "right", font: "800 18px Archivo" }}>{valor}</span>
    </div>
  )
}
