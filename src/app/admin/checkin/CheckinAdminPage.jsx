import { useCallback, useEffect, useState } from "react"
import { useConfirmar } from "@/components/useConfirmar"
import { Copy, Eye, EyeOff, ExternalLink, KeyRound, UserCheck } from "lucide-react"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { TituloPagina } from "@/components/TituloPagina"
import { EsqueletoAdmin, EstadoVacio } from "@/components/admin/kit"

/*
 * Check-in: la pantalla de la recepción donde el alumno escribe su DNI para registrar su asistencia.
 * Desde acá el administrador entrega el enlace al equipo de recepción y elige la clave que ese equipo usa.
 * Cambiar la clave desconecta el equipo actual hasta que le pongan la nueva.
 */

const MINIMO = 12

export default function CheckinAdminPage() {
  const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
  const puedeEditar = getPermisos().includes("configuracion:modificacion")
  const [estado, setEstado] = useState(null)
  const [clave, setClave] = useState("")
  const [verClave, setVerClave] = useState(false)
  const [guardando, setGuardando] = useState(false)
  // Siempre con https: el sistema no acepta cambios desde una dirección http
  const enlace = window.location.hostname === "localhost" ? `${window.location.origin}/check-in` : "https://bravosbox.com.ar/check-in"
  const enlaceVisible = enlace.replace(/^https?:\/\//, "")

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
    if (!(await pedirConfirmacion(aviso))) return
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

  const clasesHoy = estado?.clasesHoy ?? []
  const registrados = estado?.registrados ?? []

  return (
    <>
      {dialogoConfirmar}
      <div className="space-y-5">
        <TituloPagina descripcion={"La pantalla donde el alumno escribe su DNI para registrar su asistencia al llegar"}>Check-in</TituloPagina>

        {!estado ? (
          <EsqueletoAdmin filas={3} />
        ) : (
          <>
            {/* Enlace para la recepción */}
            <section aria-label="Enlace para el equipo de recepción" className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-border bg-card p-6">
              <div className="min-w-0 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Enlace para el equipo de recepción</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[18px] font-bold text-foreground">{enlaceVisible}</span>
                  <button type="button" onClick={copiarEnlace}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] font-bold text-foreground transition-colors hover:bg-[rgba(128,128,128,.14)]">
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-bold ${estado.configurado ? "border-lime-600/40 bg-lime-400/10 text-lime-700 dark:text-lime-400" : "border-border text-muted-foreground"}`}>
                    {estado.configurado ? "✓ Clave configurada" : "Clave sin configurar"}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-[12px] font-bold text-foreground">{estado.registradosHoy ?? 0} registrados hoy</span>
                </div>
              </div>
              <a href={enlace} target="_blank" rel="noopener noreferrer"
                className="inline-flex h-[50px] items-center gap-2 rounded-[10px] bg-lime-400 px-6 text-[13px] font-extrabold uppercase tracking-[.04em] text-[#0b0b0b] no-underline transition-colors hover:bg-lime-300">
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Abrir pantalla de check-in
              </a>
            </section>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Clases de hoy */}
              <section aria-labelledby="ch-t" className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="border-b border-border px-6 py-5">
                  <h2 id="ch-t" className="text-[17px] font-extrabold text-foreground">Clases de hoy</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}</p>
                </div>
                {clasesHoy.length === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-muted-foreground">Sin clases programadas para hoy.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {clasesHoy.map((c) => {
                      const reservados = Number(c.reservados) || 0
                      const porcentaje = reservados > 0 ? Math.min(100, Math.round((Number(c.registrados) || 0) / reservados * 100)) : 0
                      return (
                        <li key={c.idHorario} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 px-6 py-5">
                          <span className="text-[20px] font-extrabold tabular-nums text-foreground">{c.inicio} – {c.fin}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-[15px] font-bold text-foreground">{c.nombre}</span>
                            <span className="block truncate text-[13px] text-muted-foreground">{c.tipo}</span>
                          </span>
                          <span className="w-[180px] text-right">
                            <span className="block text-[13px] font-semibold text-muted-foreground">
                              {reservados > 0 ? `${c.registrados} de ${c.reservados} registrados` : "Sin reservas todavía"}
                            </span>
                            <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                              <span className="block h-full rounded-full bg-lime-400" style={{ width: `${porcentaje}%` }} />
                            </span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              {/* Quién se registró hoy */}
              <section aria-labelledby="rg-t" className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-6 py-5">
                  <h2 id="rg-t" className="text-[17px] font-extrabold text-foreground">Quién se registró hoy</h2>
                  <span className="text-[13px] font-semibold text-muted-foreground">{estado.registradosHoy ?? 0} registrados hoy</span>
                </div>
                {registrados.length === 0 ? (
                  <EstadoVacio
                    icono={UserCheck}
                    titulo="Todavía nadie se registró hoy"
                    texto="Cuando un alumno escriba su DNI en recepción, aparece acá."
                  />
                ) : (
                  <ul className="divide-y divide-border">
                    {registrados.map((r, i) => (
                      <li key={`${r.nombre}-${r.inicio}-${i}`} className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 px-6 py-2.5 text-sm">
                        <span className="font-bold text-foreground">{r.nombre}</span>
                        <span className="text-xs text-muted-foreground">{r.inicio} · {r.clase} · {r.origen}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Clave del equipo (solo quien puede modificar la configuración) */}
            {puedeEditar && (
              <section aria-labelledby="cl-t" className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-lime-400/15 text-lime-700 dark:bg-[#1f2a0e] dark:text-lime-400" aria-hidden="true">
                    <KeyRound className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2 id="cl-t" className="text-[17px] font-extrabold text-foreground">Clave del equipo de recepción</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Elegí una frase que reconozcas, de al menos {MINIMO} caracteres. Por ejemplo: Recepcion-Bravos-2026. Se la ponés una sola vez al equipo de la recepción.
                    </p>
                  </div>
                </div>
                <form onSubmit={guardar} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="clave-equipo" className="sr-only">Nueva clave</label>
                    <div className="relative">
                      <input
                        id="clave-equipo"
                        type={verClave ? "text" : "password"}
                        value={clave}
                        onChange={(e) => setClave(e.target.value)}
                        autoComplete="off"
                        placeholder={`Nueva clave (mínimo ${MINIMO} caracteres)`}
                        className="h-[46px] w-full rounded-[10px] border border-border bg-background px-3.5 pr-12 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <button
                        type="button"
                        onClick={() => setVerClave((v) => !v)}
                        aria-label={verClave ? "Ocultar la clave" : "Mostrar la clave"}
                        className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        {verClave ? <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
                      </button>
                    </div>
                    <p className="mt-1.5 text-[12px] font-semibold text-muted-foreground">Mínimo {MINIMO} caracteres.</p>
                  </div>
                  <button type="submit" disabled={guardando || clave.trim().length < MINIMO}
                    className="inline-flex h-[46px] items-center justify-center rounded-[10px] bg-lime-400 px-5 text-[13px] font-extrabold uppercase tracking-[.04em] text-[#0b0b0b] transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40">
                    {guardando ? "Guardando…" : estado.configurado ? "CAMBIAR CLAVE" : "GUARDAR CLAVE"}
                  </button>
                </form>
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}
