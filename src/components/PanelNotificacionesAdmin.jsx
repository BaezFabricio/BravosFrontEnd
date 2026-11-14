import { useEffect, useState } from "react"
import { Bell, Calendar, CheckCheck, ChevronRight, CreditCard, FileText, AlertTriangle, CheckCircle2, X } from "lucide-react"
import { estadoPush, activarPush } from "@/lib/push"
import { toast } from "@/lib/notificar"
import { etiquetaDia, parsearFecha } from "@/lib/fechasNotificaciones"

/*
 * Bandeja de notificaciones del panel admin en escritorio (referencia 14). La dibuja NotificacionesBell con
 * variante="admin": la lógica y los datos son los de siempre (lista, leídas, marcar todas, borrar todas).
 */

const TILE = {
  ok: { background: "var(--sh-avatar)", color: "var(--sh-accent)" },
  info: { background: "rgba(40, 110, 190, 0.18)", color: "#5aa9f0" },
  warn: { background: "var(--sh-warn-bg)", color: "var(--sh-warn)" },
  err: { background: "var(--sh-danger-bg)", color: "var(--sh-danger)" },
}

// Ícono, color y texto del enlace de cada notificación según su tipo
function aspecto(n) {
  const titulo = n.titulo || ""
  if (/documento/i.test(titulo)) return { tono: "info", Icono: FileText, accion: "Revisar" }
  if (n.tipo === "credito" || /abono|membres/i.test(titulo)) return { tono: "warn", Icono: CreditCard, accion: "Ver abono" }
  if (n.tipo === "reserva" || /clase/i.test(titulo)) return { tono: "ok", Icono: Calendar, accion: "Ver clase" }
  if (n.tipo === "exito") return { tono: "ok", Icono: CheckCircle2, accion: "Abrir" }
  if (n.tipo === "error") return { tono: "err", Icono: AlertTriangle, accion: "Abrir" }
  if (n.tipo === "advertencia") return { tono: "warn", Icono: AlertTriangle, accion: "Abrir" }
  return { tono: "ok", Icono: Bell, accion: "Abrir" }
}

// "hace 5 h", "hace 11 min", "Ayer"
function hace(raw, dia) {
  if (dia === "AYER") return "Ayer"
  const min = Math.floor((Date.now() - parsearFecha(raw).getTime()) / 60000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  return `hace ${Math.floor(h / 24)} d`
}

export default function PanelNotificacionesAdmin({ notifs, noLeidas, limpiando, onClickNotif, onMarcarTodas, onBorrarTodas }) {
  const [filtro, setFiltro] = useState("todas")
  const [confirmar, setConfirmar] = useState(false)
  const [push, setPush] = useState(null)
  const [ocultoAvisos, setOcultoAvisos] = useState(false)
  const [activando, setActivando] = useState(false)

  useEffect(() => {
    let vigente = true
    estadoPush().then((e) => { if (vigente) setPush(e) }).catch(() => {})
    return () => { vigente = false }
  }, [])

  const lista = filtro === "todas" ? notifs : notifs.filter((n) => !n.leida)
  const grupos = []
  lista.forEach((n) => {
    const dia = etiquetaDia(n.creadoEn).toUpperCase()
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.dia === dia) ultimo.items.push(n)
    else grupos.push({ dia, items: [n] })
  })

  // Se ofrece activar los avisos solo si este equipo todavía no los tiene y el navegador los permite
  const ofrecerAvisos = !ocultoAvisos && (push === "inactivas")
  const activar = async () => {
    setActivando(true)
    try { await activarPush(); toast.success("Avisos activados en este equipo", { guardar: false }); setPush(await estadoPush()) }
    catch (err) { toast.error("No se pudieron activar los avisos", { description: err.response?.data?.message || err.message }) }
    finally { setActivando(false) }
  }

  const chip = (activo) => ({ height: "36px", padding: "0px 12px", borderRadius: "999px", border: `1px solid ${activo ? "var(--foreground)" : "var(--sh-control-line)"}`, background: activo ? "var(--foreground)" : "transparent", color: activo ? "var(--background)" : "var(--foreground)", font: "700 13px Archivo", whiteSpace: "nowrap", cursor: "pointer" })

  return (
    <div id="panel-notif" role="dialog" aria-label="Notificaciones"
      style={{ position: "absolute", top: "52px", right: "-30px", zIndex: 60, width: "440px", borderRadius: "16px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)", overflow: "hidden", color: "var(--foreground)", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 18px 12px" }}>
        <h2 className="bv-admin-titulo" style={{ flex: "1 1 0%", margin: 0, font: "800 17px Archivo" }}>Notificaciones</h2>
        <button type="button" onClick={onMarcarTodas} disabled={noLeidas === 0}
          style={{ display: "flex", alignItems: "center", gap: "6px", height: "40px", padding: "0px 10px", border: "none", borderRadius: "8px", background: "transparent", color: noLeidas ? "var(--sh-accent)" : "var(--muted-foreground)", font: "700 13px Archivo", whiteSpace: "nowrap", cursor: noLeidas ? "pointer" : "default" }}>
          <CheckCheck className="h-4 w-4" aria-hidden="true" /> Marcar todas como leídas
        </button>
      </div>

      <div role="group" aria-label="Filtrar" style={{ display: "flex", gap: "6px", padding: "0px 18px 12px", borderBottom: "1px solid var(--sh-line)" }}>
        <button type="button" aria-pressed={filtro === "todas"} onClick={() => setFiltro("todas")} style={chip(filtro === "todas")}>{`Todas · ${notifs.length}`}</button>
        <button type="button" aria-pressed={filtro === "sin"} onClick={() => setFiltro("sin")} style={chip(filtro === "sin")}>{`Sin leer · ${noLeidas}`}</button>
      </div>

      <div style={{ maxHeight: "460px", overflowY: "auto" }}>
        {lista.length === 0 && (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{ font: "700 15px Archivo" }}>Estás al día</div>
            <div style={{ marginTop: "4px", font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{notifs.length === 0 ? "No tenés notificaciones." : "No tenés notificaciones sin leer."}</div>
          </div>
        )}
        {grupos.map((g) => (
          <section key={g.dia} aria-label={g.dia}>
            <h3 className="bv-admin-titulo" style={{ margin: 0, padding: "12px 18px 6px", font: "700 11px Archivo", letterSpacing: "0.1em", color: "var(--muted-foreground)", background: "var(--sh-bg)" }}>{g.dia}</h3>
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {g.items.map((n, idx) => {
                const { tono, Icono, accion } = aspecto(n)
                const sinLeer = !n.leida
                return (
                  <li key={n.idNotificacion} style={{ borderTop: "1px solid var(--sh-line)", transition: "all 0.3s", transitionDelay: limpiando ? `${Math.min(idx, 8) * 60}ms` : undefined, transform: limpiando ? "translateX(48px)" : undefined, opacity: limpiando ? 0 : 1 }}>
                    <button type="button" onClick={() => onClickNotif(n)}
                      aria-label={`${sinLeer ? "Sin leer. " : ""}${n.titulo}. ${n.mensaje}`}
                      style={{ display: "flex", width: "100%", gap: "12px", padding: "14px 18px", border: "none", textAlign: "left", cursor: "pointer", background: sinLeer ? "color-mix(in srgb, var(--sh-accent) 7%, var(--card))" : "transparent", color: "var(--foreground)" }}>
                      <span style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "10px", display: "grid", placeItems: "center", ...TILE[tono] }}>
                        <Icono className="h-[17px] w-[17px]" aria-hidden="true" />
                      </span>
                      <span style={{ flex: "1 1 0%", minWidth: 0 }}>
                        <span style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                          <span style={{ flex: "1 1 0%", minWidth: 0, font: "800 14px / 1.35 Archivo" }}>{n.titulo}</span>
                          <span style={{ flexShrink: 0, font: "500 12px Archivo", color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{hace(n.creadoEn, g.dia)}</span>
                        </span>
                        <span style={{ display: "block", marginTop: "3px", font: "400 13px / 1.45 Archivo", color: "var(--sh-link)" }}>{n.mensaje}</span>
                        {n.link && (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", marginTop: "6px", font: "700 13px Archivo", color: "var(--sh-accent)" }}>
                            {accion}<ChevronRight className="h-[14px] w-[14px]" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      {sinLeer && <span aria-hidden="true" style={{ width: "9px", height: "9px", flexShrink: 0, marginTop: "5px", borderRadius: "50%", background: "var(--sh-accent)" }} />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}

        {notifs.length > 0 && (
          <div style={{ borderTop: "1px solid var(--sh-line)", padding: "10px 18px" }}>
            {confirmar ? (
              <div role="alert" style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ flex: "1 1 0%", font: "600 13px Archivo" }}>¿Borrar todas las notificaciones?</span>
                <button type="button" onClick={() => setConfirmar(false)} style={{ height: "36px", padding: "0px 12px", borderRadius: "8px", border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 13px Archivo", cursor: "pointer" }}>No</button>
                <button type="button" onClick={() => { setConfirmar(false); onBorrarTodas() }} style={{ height: "36px", padding: "0px 12px", borderRadius: "8px", border: "none", background: "var(--sh-danger)", color: "var(--card)", font: "700 13px Archivo", cursor: "pointer" }}>Sí, borrar</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmar(true)} style={{ height: "32px", padding: 0, border: "none", background: "transparent", color: "var(--muted-foreground)", font: "600 12px Archivo", textDecoration: "underline", cursor: "pointer" }}>Borrar todas</button>
            )}
          </div>
        )}
      </div>

      {ofrecerAvisos && (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderTop: "1px solid var(--border)" }}>
          <span style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "10px", display: "grid", placeItems: "center", ...TILE.ok }}>
            <Bell className="h-[17px] w-[17px]" aria-hidden="true" />
          </span>
          <span style={{ flex: "1 1 0%", font: "700 13px / 1.35 Archivo" }}>Recibí los avisos en este equipo, aunque la app esté cerrada.</span>
          <button type="button" onClick={activar} disabled={activando}
            style={{ height: "40px", padding: "0px 16px", borderRadius: "8px", border: "none", background: "var(--primary)", color: "var(--primary-foreground)", font: "800 13px Archivo", letterSpacing: "0.03em", cursor: "pointer", opacity: activando ? 0.6 : 1 }}>ACTIVAR</button>
          <button type="button" onClick={() => setOcultoAvisos(true)} aria-label="Ahora no" style={{ width: "32px", height: "32px", border: "none", background: "transparent", color: "var(--muted-foreground)", cursor: "pointer", display: "grid", placeItems: "center" }}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
