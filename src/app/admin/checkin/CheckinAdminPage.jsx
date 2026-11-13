import { useCallback, useEffect, useState } from "react"
import { useConfirmar } from "@/components/useConfirmar"
import { Copy, Eye, EyeOff, ExternalLink, KeyRound, UserCheck } from "lucide-react"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { TituloPagina } from "@/components/TituloPagina"
import { EsqueletoAdmin, EstadoVacio, BotonAdmin, TarjetaAdmin } from "@/components/admin/kit"

/*
 * Check-in: la pantalla de la recepción donde el alumno escribe su DNI para registrar su asistencia.
 * Desde acá el administrador entrega el enlace al equipo de recepción y elige la clave que ese equipo usa.
 * Cambiar la clave desconecta el equipo actual hasta que le pongan la nueva.
 */

const MINIMO = 12

// El resumen por tipo solo aporta si algún tipo tiene 2 o más clases hoy; con una clase por tipo repetiría la lista de abajo
const hayTipoConVariasClases = (clases = []) => {
  const cuenta = {}
  for (const c of clases) {
    cuenta[c.tipo] = (cuenta[c.tipo] || 0) + 1
    if (cuenta[c.tipo] > 1) return true
  }
  return false
}

export default function CheckinAdminPage() {
  const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
  const puedeEditar = getPermisos().includes("configuracion:modificacion")
  const [estado, setEstado] = useState(null)
  const [clave, setClave] = useState("")
  const [verClave, setVerClave] = useState(false)
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

  return (
    <>
      {dialogoConfirmar}
      <div className="space-y-6">
        <TituloPagina descripcion={"La pantalla donde el alumno escribe su DNI para registrar su asistencia al llegar."}>Check-in</TituloPagina>

        {!estado ? (
          <EsqueletoAdmin filas={3} />
        ) : (
          <>
            {/* Enlace para la recepción */}
            <TarjetaAdmin className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Enlace para el equipo de recepción</p>
                  <p className="mt-1 break-all font-mono text-sm text-foreground">{enlace}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a href={enlace} target="_blank" rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-border px-4 text-[13px] font-bold text-foreground no-underline hover:bg-[rgba(128,128,128,.14)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" /> Abrir pantalla de check-in
                  </a>
                  <BotonAdmin onClick={copiarEnlace} aria-label="Copiar enlace">
                    <Copy className="h-4 w-4" aria-hidden="true" /> Copiar
                  </BotonAdmin>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <span className="rounded-[10px] border border-border px-3.5 py-2 text-sm">
                  <span className="text-muted-foreground">Clave configurada: </span>
                  <strong className="text-foreground">{estado.configurado ? "Sí" : "No"}</strong>
                </span>
                <span className="rounded-[10px] border border-border px-3.5 py-2 text-sm">
                  <span className="text-muted-foreground">Registrados hoy: </span>
                  <strong className="tabular-nums text-foreground">{estado.registradosHoy}</strong>
                </span>
              </div>
            </TarjetaAdmin>

            {/* Clases de hoy y registros */}
            <TarjetaAdmin>
              {hayTipoConVariasClases(estado.clasesHoy) && (
                <div className="border-b border-border p-5">
                  <h2 className="text-[17px] font-extrabold text-foreground">Hoy por tipo de clase</h2>
                  {(estado.porTipo?.length ?? 0) === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">Hoy no hay clases.</p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {estado.porTipo.map((t) => (
                        <div key={t.tipo} className="rounded-xl border border-border p-3">
                          <p className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">{t.tipo}</p>
                          <p className="mt-1 text-sm text-foreground">
                            <strong className="tabular-nums">{t.registrados}</strong> de <span className="tabular-nums">{t.reservados}</span> reservados se registraron
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="border-b border-border p-5">
                <h2 id="ch-t" className="text-[17px] font-extrabold text-foreground">Clases de hoy</h2>
                {(estado.clasesHoy?.length ?? 0) === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">Sin clases programadas para hoy.</p>
                ) : (
                  <ul aria-labelledby="ch-t" className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
                    {estado.clasesHoy.map((c) => (
                      <li key={c.idHorario} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-bold text-foreground">{c.inicio} a {c.fin} · {c.nombre}</p>
                          <p className="text-xs text-muted-foreground">{c.tipo}</p>
                        </div>
                        <p className="tabular-nums text-foreground">
                          <strong>{c.registrados}</strong> <span className="text-muted-foreground">registrados de {c.reservados} reservados</span>
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h2 id="rg-t" className="border-b border-border px-5 py-4 text-[17px] font-extrabold text-foreground">Quién se registró hoy</h2>
                {(estado.registrados?.length ?? 0) === 0 ? (
                  <EstadoVacio
                    icono={UserCheck}
                    titulo="Todavía nadie se registró hoy"
                    texto="Cuando un alumno escriba su DNI en recepción, aparece acá."
                  />
                ) : (
                  <ul aria-labelledby="rg-t" className="divide-y divide-border">
                    {estado.registrados.map((r, i) => (
                      <li key={`${r.nombre}-${r.inicio}-${i}`} className="flex min-h-[52px] flex-wrap items-center justify-between gap-2 px-5 py-2.5 text-sm">
                        <span className="font-bold text-foreground">{r.nombre}</span>
                        <span className="text-xs text-muted-foreground">{r.inicio} · {r.clase} · {r.origen}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </TarjetaAdmin>

            {/* Clave del equipo (solo quien puede modificar la configuración) */}
            {puedeEditar && (
              <TarjetaAdmin className="p-5">
                <div className="flex items-start gap-3">
                  <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
                  <div>
                    <h2 id="cl-t" className="text-[17px] font-extrabold text-foreground">Clave del equipo de recepción</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Elegí una frase que reconozcas, de al menos {MINIMO} caracteres. Por ejemplo: Recepcion-Bravos-2026.
                      Se la ponés una sola vez al equipo de la recepción.
                    </p>
                  </div>
                </div>
                <form onSubmit={guardar} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" aria-labelledby="cl-t">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="clave-equipo" className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">Nueva clave</label>
                    <div className="relative">
                    <input
                      id="clave-equipo"
                      type={verClave ? "text" : "password"}
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      autoComplete="off"
                      placeholder={`Mínimo ${MINIMO} caracteres`}
                      className="h-12 w-full rounded-[10px] border border-border bg-background px-3.5 pr-12 font-mono text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                  </div>
                  <BotonAdmin variante="principal" type="submit" disabled={guardando || clave.trim().length < MINIMO} className="h-12 sm:w-auto">
                    {guardando ? "Guardando…" : estado.configurado ? "CAMBIAR CLAVE" : "GUARDAR CLAVE"}
                  </BotonAdmin>
                </form>
              </TarjetaAdmin>
            )}
          </>
        )}
      </div>
    </>
  )
}
