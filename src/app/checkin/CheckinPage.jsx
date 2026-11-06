import { useEffect, useRef, useState } from "react"
import { Maximize, Minimize } from "lucide-react"

/*
 * Check-in del gimnasio (para una tablet o una pantalla en recepción). Sin sesión: el alumno escribe su DNI
 * y se registra su asistencia de hoy, solo si tiene reserva en este horario. El equipo se configura una vez con su clave.
 */

const CLAVE_EQUIPO = "bravos-checkin-clave"
const TIEMPO_RESULTADO_MS = 9000
const leerClave = () => { try { return localStorage.getItem(CLAVE_EQUIPO) || "" } catch { return "" } }
const guardarClave = (c) => { try { localStorage.setItem(CLAVE_EQUIPO, c) } catch { /* sin almacenamiento */ } }

async function registrar(dni, clave) {
  const res = await fetch("/api/vv1/asistencia/check-in", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-clave-checkin": clave },
    body: JSON.stringify({ dni }),
  })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data: json.data, mensaje: json.message, codigo: json.errorCode }
}

export default function CheckinPage() {
  const [clave, setClave] = useState(leerClave)
  const [claveNueva, setClaveNueva] = useState("")
  const [dni, setDni] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null) // { tipo: "ok" | "error", ... }
  const temporizador = useRef(null)

  // Después de un registro, la pantalla vuelve sola a la espera para el siguiente alumno
  useEffect(() => {
    if (!resultado) return
    temporizador.current = setTimeout(() => { setResultado(null); setDni("") }, TIEMPO_RESULTADO_MS)
    return () => clearTimeout(temporizador.current)
  }, [resultado])

  const enviar = async (e) => {
    e?.preventDefault()
    if (enviando || dni.length < 6) return
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

  const volverAEspera = () => { clearTimeout(temporizador.current); setResultado(null); setDni("") }

  // Pantalla de configuración del equipo (una sola vez)
  if (!clave) {
    return (
      <Pantalla>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Configurar este equipo</h1>
        <p className="mt-2 text-base text-white/60">Pedile la clave de la pantalla de check-in al administrador. Se guarda una sola vez en este equipo.</p>
        <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); if (claveNueva.trim()) { guardarClave(claveNueva.trim()); setClave(claveNueva.trim()); setClaveNueva("") } }}>
          <input type="password" value={claveNueva} onChange={(e) => setClaveNueva(e.target.value)} aria-label="Clave del equipo" autoComplete="off"
            className="h-16 w-full rounded-2xl border border-white/20 bg-white/5 px-5 text-xl text-white outline-none focus:border-lime-400" />
          <button type="submit" disabled={!claveNueva.trim()} className="h-16 w-full rounded-2xl bg-lime-400 text-lg font-black uppercase tracking-wide text-black disabled:opacity-40">Guardar</button>
        </form>
      </Pantalla>
    )
  }

  // Resultado: asistencia registrada o error
  if (resultado) {
    if (resultado.tipo === "error") {
      return (
        <Pantalla>
          <p className="text-5xl text-red-400" aria-hidden="true">✕</p>
          <h1 className="mt-4 text-3xl font-black uppercase text-white">No se pudo registrar</h1>
          <p className="mt-3 text-lg text-white/75">{resultado.mensaje}</p>
          <button type="button" onClick={volverAEspera} className="mt-10 h-16 w-full rounded-2xl border border-white/25 text-lg font-black uppercase text-white">Volver</button>
        </Pantalla>
      )
    }
    return (
      <Pantalla>
        <p className="text-5xl text-lime-400" aria-hidden="true">✓</p>
        <h1 className="mt-4 text-4xl font-black uppercase text-white">Asistencia registrada</h1>
        <p className="mt-2 text-2xl font-bold text-lime-400">{resultado.bienvenida}</p>
        <div className="mt-8 w-full divide-y divide-white/10 rounded-2xl border border-white/15 text-left">
          <Fila etiqueta="Clase" valor={`${resultado.clase.nombre} · ${resultado.clase.inicio} a ${resultado.clase.fin}`} />
          {resultado.semana && <Fila etiqueta="Esta semana" valor={`${resultado.semana.usadas} de ${resultado.semana.total} clases`} />}
          <Fila etiqueta="Clases disponibles" valor={String(resultado.clasesDisponibles)} />
          {resultado.vence && <Fila etiqueta="Vence" valor={resultado.vence} />}
        </div>
        <button type="button" onClick={volverAEspera} className="mt-8 h-14 w-full rounded-2xl bg-lime-400 text-lg font-black uppercase text-black">Listo</button>
        <p className="mt-3 text-sm text-white/40">La pantalla vuelve sola en unos segundos.</p>
      </Pantalla>
    )
  }

  // Espera: se escribe el DNI
  return (
    <Pantalla>
      <h1 className="text-3xl font-black uppercase tracking-tight text-white">Registrá tu check-in</h1>
      <p className="mt-2 text-base text-white/60">Escribí tu DNI sin puntos y tocá Registrar.</p>
      <form onSubmit={enviar} className="mt-8 space-y-4">
        <input
          value={dni}
          onChange={(e) => setDni(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          autoComplete="off"
          placeholder="DNI"
          aria-label="DNI"
          autoFocus
          className="h-20 w-full rounded-2xl border border-white/20 bg-white/5 text-center text-4xl font-black tracking-[0.15em] text-white outline-none placeholder:text-white/25 focus:border-lime-400"
        />
        <button type="submit" disabled={enviando || dni.length < 6} className="h-20 w-full rounded-2xl bg-lime-400 text-2xl font-black uppercase tracking-wide text-black disabled:opacity-40">
          {enviando ? "Registrando…" : "Registrar"}
        </button>
      </form>
      <button type="button" onClick={() => { setClave(""); guardarClave("") }} className="mt-10 text-xs text-white/30 underline">Cambiar la clave del equipo</button>
    </Pantalla>
  )
}

// Pantalla completa: solo para esta página (el resto del sistema no cambia). Se pide con un toque, porque el navegador lo exige.
function BotonPantallaCompleta() {
  const [completa, setCompleta] = useState(false)
  useEffect(() => {
    const cambio = () => setCompleta(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", cambio)
    return () => document.removeEventListener("fullscreenchange", cambio)
  }, [])
  const alternar = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch { /* el navegador no permite pantalla completa aquí */ }
  }
  return (
    <button type="button" onClick={alternar} aria-label={completa ? "Salir de pantalla completa" : "Pantalla completa"}
      className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white">
      {completa ? <Minimize className="h-5 w-5" aria-hidden="true" /> : <Maximize className="h-5 w-5" aria-hidden="true" />}
    </button>
  )
}

function Pantalla({ children }) {
  return (
    <div className="dark relative min-h-[100dvh] bg-black px-6 py-10 text-white">
      <BotonPantallaCompleta />
      <div className="mx-auto flex min-h-[80dvh] max-w-md flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

function Fila({ etiqueta, valor }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-4">
      <span className="text-sm font-bold uppercase tracking-wide text-white/50">{etiqueta}</span>
      <span className="text-right text-lg font-black text-white">{valor}</span>
    </div>
  )
}
