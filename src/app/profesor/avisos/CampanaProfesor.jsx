import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, X } from "lucide-react"
import { useTemaProfesor } from "../paletaProfesor"
import { useAvisosProfesor } from "./useAvisosProfesor"
import ListaAvisos from "./ListaAvisos"

// Campanita del profesor. Celular: abre la pantalla de avisos. Escritorio: despliega el panel (420 px).
export default function CampanaProfesor({ movil }) {
  const C = useTemaProfesor()
  const navigate = useNavigate()
  const { avisos, noLeidas, cargando, marcarLeido, marcarTodos } = useAvisosProfesor()
  const [abierto, setAbierto] = useState(false)
  const caja = useRef(null)

  // Escritorio: se cierra con Escape y al tocar afuera
  useEffect(() => {
    if (!abierto) return undefined
    const alTocar = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false) }
    const alTeclear = (e) => { if (e.key === "Escape") setAbierto(false) }
    document.addEventListener("mousedown", alTocar)
    document.addEventListener("keydown", alTeclear)
    return () => { document.removeEventListener("mousedown", alTocar); document.removeEventListener("keydown", alTeclear) }
  }, [abierto])

  const irA = (aviso) => { setAbierto(false); if (aviso.link) navigate(aviso.link) }

  const tocar = () => {
    if (movil) navigate("/profesor/avisos")
    else setAbierto((v) => !v)
  }

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={tocar}
        aria-label={`Avisos${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`}
        aria-expanded={!movil ? abierto : undefined}
        className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[10px]"
        style={{ color: C.ink }}
      >
        <Bell className="h-[22px] w-[22px]" aria-hidden="true" />
        {noLeidas > 0 && (
          <span
            className="absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-extrabold leading-none"
            style={{ background: C.lime, color: C.onLime }}
          >
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {!movil && abierto && (
        <div
          role="dialog"
          aria-label="Avisos"
          className="absolute right-0 top-[calc(100%+8px)] z-50 flex max-h-[70vh] w-[420px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border shadow-2xl"
          style={{ background: C.card, borderColor: C.line, overscrollBehavior: "contain" }}
        >
          <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: C.line }}>
            <h2 className="m-0 text-base font-extrabold" style={{ color: C.ink }}>Avisos</h2>
            <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar avisos" className="grid h-11 w-11 place-items-center rounded-[10px]" style={{ color: C.muted }}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="overflow-y-auto p-4" style={{ overscrollBehavior: "contain" }}>
            <ListaAvisos avisos={avisos} noLeidas={noLeidas} cargando={cargando} onLeer={marcarLeido} onLeerTodos={marcarTodos} onAbrir={irA} />
          </div>
        </div>
      )}
    </div>
  )
}
