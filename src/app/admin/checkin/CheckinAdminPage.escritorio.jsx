import { useCallback, useEffect, useState } from "react"
import { useConfirmar } from "@/components/useConfirmar"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { getPermisos } from "@/lib/paneles"
import { TituloPagina } from "@/components/TituloPagina"
import { EsqueletoAdmin } from "@/components/admin/kit"

/*
 * Check-in: la pantalla de la recepción donde el alumno escribe su DNI para registrar su asistencia.
 * Desde acá el administrador entrega el enlace al equipo de recepción y elige la clave que ese equipo usa.
 * Cambiar la clave desconecta el equipo actual hasta que le pongan la nueva.
 * Marcación: la referencia del rediseño (pantalla 02). Colores de los tokens del tema.
 */

const MINIMO = 12

const CARD = { borderRadius: "16px", background: "var(--card)", border: "1px solid var(--border)" }
const TITULO_SECCION = { margin: "0px", font: "800 17px Archivo" }
const SUBTITULO = { font: "500 13px Archivo", color: "var(--muted-foreground)" }

const Icono = ({ d, size = 15, sw = 2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
)

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
  const fechaHoy = (() => {
    const t = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }).replace(", ", " ")
    return t.charAt(0).toUpperCase() + t.slice(1)
  })()

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
  const claveValida = clave.trim().length >= MINIMO

  return (
    <>
      {dialogoConfirmar}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1720px", width: "100%" }}>
        <TituloPagina descripcion={"La pantalla donde el alumno escribe su DNI para registrar su asistencia al llegar"}>Check-in</TituloPagina>

        {!estado ? (
          <EsqueletoAdmin filas={3} />
        ) : (
          <>
            {/* Enlace para la recepción */}
            <section aria-labelledby="ck-l" style={{ ...CARD, padding: "22px 24px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 0%", minWidth: "320px" }}>
                <span id="ck-l" style={{ display: "block", font: "700 12px Archivo", letterSpacing: "0.1em", color: "var(--muted-foreground)" }}>ENLACE PARA EL EQUIPO DE RECEPCIÓN</span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                  <span style={{ font: "700 17px Archivo" }}>{enlaceVisible}</span>
                  <button type="button" aria-label="Copiar enlace" onClick={copiarEnlace}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "36px", padding: "0px 12px", borderRadius: "10px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 13px Archivo", whiteSpace: "nowrap", cursor: "pointer" }}>
                    <Icono d="M8 8h12v12H8zM4 16V4h12" />
                    <span>Copiar</span>
                  </button>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                  {estado.configurado ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: "var(--sh-active-bg)", border: "1px solid rgba(155, 230, 0, 0.3)", color: "var(--primary)", font: "700 12px Archivo" }}>
                      <Icono d="M5 12l5 5 9-10" size={13} sw={2.6} />
                      Clave configurada
                    </span>
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", border: "1px solid var(--sh-control-line)", color: "var(--foreground)", font: "700 12px Archivo" }}>
                      Clave sin configurar
                    </span>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", border: "1px solid var(--sh-control-line)", color: "var(--foreground)", font: "700 12px Archivo" }}>
                    <span>{`${estado.registradosHoy ?? 0} registrados hoy`}</span>
                  </span>
                </div>
              </div>
              <a href={enlace} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "50px", padding: "0px 20px", borderRadius: "10px", background: "var(--primary)", color: "var(--primary-foreground)", font: "800 14px Archivo", letterSpacing: "0.03em", whiteSpace: "nowrap", textDecoration: "none" }}>
                <Icono d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" size={17} sw={2.2} />
                ABRIR PANTALLA DE CHECK-IN
              </a>
            </section>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) minmax(0px, 1fr)", gap: "20px", alignItems: "start" }}>
              {/* Clases de hoy */}
              <section aria-labelledby="ch-t" style={{ ...CARD, overflow: "hidden" }}>
                <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
                  <h2 id="ch-t" className="bv-admin-titulo" style={TITULO_SECCION}>Clases de hoy</h2>
                  <div style={{ ...SUBTITULO, marginTop: "3px" }}>{fechaHoy}</div>
                </div>
                {clasesHoy.length === 0 ? (
                  <p style={{ margin: "0px", padding: "28px 22px", textAlign: "center", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Sin clases programadas para hoy.</p>
                ) : (
                  <ul style={{ listStyle: "none", margin: "0px", padding: "0px" }}>
                    {clasesHoy.map((c) => {
                      const reservados = Number(c.reservados) || 0
                      const porcentaje = reservados > 0 ? Math.min(100, Math.round((Number(c.registrados) || 0) / reservados * 100)) : 0
                      return (
                        <li key={c.idHorario} style={{ display: "flex", alignItems: "center", gap: "18px", padding: "16px 22px" }}>
                          <span style={{ minWidth: "120px", font: "800 17px Archivo", fontVariantNumeric: "tabular-nums" }}>{`${c.inicio} – ${c.fin}`}</span>
                          <span style={{ flex: "1 1 0%", minWidth: "0px" }}>
                            <span style={{ display: "block", font: "700 15px Archivo", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.nombre}</span>
                            <span style={{ display: "block", font: "500 13px Archivo", color: "var(--muted-foreground)", marginTop: "2px" }}>{c.tipo}</span>
                          </span>
                          <span style={{ width: "180px" }}>
                            <span style={{ display: "block", textAlign: "right", font: "600 13px Archivo", color: "var(--muted-foreground)" }}>
                              {reservados > 0 ? `${c.registrados} de ${c.reservados} registrados` : "Sin reservas todavía"}
                            </span>
                            <span style={{ display: "block", marginTop: "6px", height: "6px", borderRadius: "3px", background: "var(--sh-track)", overflow: "hidden" }}>
                              <span style={{ display: "block", height: "100%", width: `${porcentaje}%`, background: "var(--primary)" }} />
                            </span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              {/* Quién se registró hoy */}
              <section aria-labelledby="rg-t" style={{ ...CARD, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid var(--border)" }}>
                  <h2 id="rg-t" className="bv-admin-titulo" style={TITULO_SECCION}>Quién se registró hoy</h2>
                  <span aria-live="polite" style={{ font: "600 13px Archivo", color: "var(--muted-foreground)" }}>{`${estado.registradosHoy ?? 0} registrados hoy`}</span>
                </div>
                {registrados.length === 0 ? (
                  <div style={{ padding: "28px 22px", textAlign: "center" }}>
                    <div style={{ font: "700 15px Archivo" }}>Todavía nadie se registró hoy</div>
                    <div style={{ font: "400 14px Archivo", color: "var(--muted-foreground)", marginTop: "4px" }}>Cuando un alumno escriba su DNI en recepción, aparece acá.</div>
                  </div>
                ) : (
                  <ul style={{ listStyle: "none", margin: "0px", padding: "0px" }}>
                    {registrados.map((r, i) => (
                      <li key={`${r.nombre}-${r.inicio}-${i}`} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "8px", padding: "14px 22px" }}>
                        <span style={{ font: "700 15px Archivo" }}>{r.nombre}</span>
                        <span style={{ font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{`${r.inicio} · ${r.clase} · ${r.origen}`}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {/* Clave del equipo (solo quien puede modificar la configuración) */}
            {puedeEditar && (
              <section aria-labelledby="cl-t" style={{ ...CARD, padding: "22px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", gap: "14px" }}>
                  <span style={{ width: "40px", height: "40px", flexShrink: 0, borderRadius: "10px", background: "var(--sh-avatar)", color: "var(--primary)", display: "grid", placeItems: "center" }}>
                    <Icono d="M15 7a4 4 0 1 1-3.9 4.9L3 20v-3h3v-3h3l2.1-2.1A4 4 0 0 1 15 7z" size={19} sw={1.9} />
                  </span>
                  <div>
                    <h2 id="cl-t" className="bv-admin-titulo" style={TITULO_SECCION}>Clave del equipo de recepción</h2>
                    <p style={{ margin: "4px 0px 0px", font: "400 14px / 1.5 Archivo", color: "var(--muted-foreground)" }}>
                      Elegí una frase que reconozcas, de al menos {MINIMO} caracteres. Por ejemplo: Recepcion-Bravos-2026. Se la ponés una sola vez al equipo de la recepción.
                    </p>
                  </div>
                </div>
                <form onSubmit={guardar} style={{ display: "flex", gap: "10px", alignItems: "flex-start", maxWidth: "900px", flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 0%", minWidth: "0px" }}>
                    <label htmlFor="clave-equipo" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0px, 0px, 0px, 0px)" }}>Nueva clave</label>
                    <div style={{ position: "relative" }}>
                      <input
                        id="clave-equipo"
                        type={verClave ? "text" : "password"}
                        value={clave}
                        onChange={(e) => setClave(e.target.value)}
                        autoComplete="off"
                        placeholder={`Nueva clave (mínimo ${MINIMO} caracteres)`}
                        aria-describedby="clave-ayuda"
                        style={{ width: "100%", boxSizing: "border-box", height: "48px", padding: "0px 52px 0px 14px", borderRadius: "10px", border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 16px Archivo" }}
                      />
                      <button type="button" onClick={() => setVerClave((v) => !v)} aria-label={verClave ? "Ocultar la clave" : "Mostrar la clave"} aria-pressed={verClave}
                        style={{ position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)", width: "44px", height: "44px", border: "none", borderRadius: "8px", background: "transparent", color: "var(--muted-foreground)", display: "grid", placeItems: "center", cursor: "pointer" }}>
                        {verClave
                          ? <Icono d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" size={20} sw={1.9} />
                          : <Icono d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" size={20} sw={1.9} />}
                      </button>
                    </div>
                    <div id="clave-ayuda" aria-live="polite" style={{ font: "600 13px Archivo", color: "var(--muted-foreground)", marginTop: "6px" }}>Mínimo {MINIMO} caracteres.</div>
                  </div>
                  <button type="submit" disabled={guardando || !claveValida}
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px", padding: "0px 20px", borderRadius: "10px", border: "none", background: claveValida && !guardando ? "var(--primary)" : "var(--sh-track-strong)", color: claveValida && !guardando ? "var(--primary-foreground)" : "var(--sh-label)", font: "800 14px Archivo", letterSpacing: "0.03em", whiteSpace: "nowrap", cursor: claveValida && !guardando ? "pointer" : "not-allowed" }}>
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
