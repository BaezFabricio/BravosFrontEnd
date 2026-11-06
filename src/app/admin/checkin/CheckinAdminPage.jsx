import { useCallback, useEffect, useState } from "react"
import { Copy, KeyRound } from "lucide-react"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { Card } from "@/components/ui/card"
import { TituloPagina } from "@/components/TituloPagina"
import { Cargando } from "@/components/Cargando"

/*
 * Check-in: la pantalla de la recepción donde el alumno escribe su DNI para registrar su asistencia.
 * Desde acá el administrador entrega el enlace al equipo de recepción y elige la clave que ese equipo usa.
 * Cambiar la clave desconecta el equipo actual hasta que le pongan la nueva.
 */

const MINIMO = 12

export default function CheckinAdminPage() {
  const puedeEditar = getPermisos().includes("configuracion:modificacion")
  const [estado, setEstado] = useState(null)
  const [clave, setClave] = useState("")
  const [guardando, setGuardando] = useState(false)
  // Siempre con https: el sistema no acepta cambios desde una dirección http
  const enlace = window.location.hostname === "localhost" ? `${window.location.origin}/check-in` : "https://bravosbox.com.ar/check-in"

  const cargar = useCallback(() => {
    apiClient.get("/asistencia/check-in/estado")
      .then((r) => setEstado(r.data?.data || r.data))
      .catch(() => { setEstado({ configurado: false, registradosHoy: 0 }); toast.error("No se pudo cargar el estado del check-in") })
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const guardar = async (e) => {
    e.preventDefault()
    const limpia = clave.trim()
    if (limpia.length < MINIMO) return toast.error(`La clave tiene que tener al menos ${MINIMO} caracteres`, { guardar: false })
    const aviso = estado?.configurado
      ? "Se va a cambiar la clave y el equipo de recepción actual deja de funcionar hasta que le pongas la nueva. ¿Seguimos?"
      : "Se va a guardar la clave del equipo de recepción. ¿Seguimos?"
    if (!window.confirm(aviso)) return
    setGuardando(true)
    try {
      await apiClient.post("/asistencia/check-in/clave", { clave: limpia })
      toast.success("Clave guardada", { guardar: false })
      setClave("")
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar la clave")
    } finally {
      setGuardando(false)
    }
  }

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(enlace)
      toast.success("Enlace copiado", { guardar: false })
    } catch {
      toast.error("No se pudo copiar")
    }
  }

  return (
    <div className="space-y-4">
      <TituloPagina descripcion={"La pantalla donde el alumno escribe su DNI para registrar su asistencia al llegar."}>Check-in</TituloPagina>

      {!estado ? (
        <Cargando filas={2} />
      ) : (
        <>
          <Card className="gap-4 rounded-2xl border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Enlace para el equipo de recepción</p>
                <p className="mt-1 break-all font-mono text-sm text-foreground">{enlace}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={enlace} target="_blank" rel="noopener noreferrer"
                  className="flex h-11 items-center gap-2 rounded-xl border border-lime-500/50 px-4 text-sm font-bold text-lime-700 hover:bg-lime-400/10 dark:text-lime-400">
                  Abrir en pantalla completa
                </a>
                <button type="button" onClick={copiarEnlace}
                  className="flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-bold text-foreground hover:bg-foreground/5">
                  <Copy className="h-4 w-4" aria-hidden="true" /> Copiar
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <p><span className="text-muted-foreground">Clave configurada: </span><strong className="text-foreground">{estado.configurado ? "Sí" : "No"}</strong></p>
              <p><span className="text-muted-foreground">Registrados hoy: </span><strong className="tabular-nums text-foreground">{estado.registradosHoy}</strong></p>
            </div>
          </Card>

          {puedeEditar && (
            <Card className="gap-4 rounded-2xl border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
                <div>
                  <p className="font-bold text-foreground">Clave del equipo de recepción</p>
                  <p className="text-sm text-muted-foreground">
                    Elegí una frase que reconozcas, de al menos {MINIMO} caracteres. Por ejemplo: Recepcion-Bravos-2026.
                    Se la ponés una sola vez al equipo de la recepción.
                  </p>
                </div>
              </div>
              <form onSubmit={guardar} className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  autoComplete="off"
                  placeholder={`Mínimo ${MINIMO} caracteres`}
                  aria-label="Nueva clave del equipo"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-border bg-background/60 px-4 font-mono text-base text-foreground outline-none focus:border-lime-500"
                />
                <button type="submit" disabled={guardando || clave.trim().length < MINIMO}
                  className="h-12 rounded-xl bg-lime-400 px-6 text-sm font-black uppercase tracking-wide text-black hover:bg-lime-300 disabled:opacity-40">
                  {guardando ? "Guardando…" : estado.configurado ? "Cambiar clave" : "Guardar clave"}
                </button>
              </form>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
