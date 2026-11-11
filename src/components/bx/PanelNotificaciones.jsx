import { useEffect, useRef, useState } from "react"
import { Info } from "lucide-react"
import { FiltroChips } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { ICONOS_TIPO } from "@/lib/avisosEstilos"
import { estadoPush, activarPush } from "@/lib/push"
import { toast } from "@/lib/notificar"
import { etiquetaDia, formatearFechaNotif, haceTiempo } from "@/lib/fechasNotificaciones"

/*
 * Panel de notificaciones del módulo Alumno en escritorio (handoff, pantalla 10).
 * Lo dibuja NotificacionesBell con variante="bx": la lógica y los datos son los de siempre.
 */

const TONOS = {
  ok: "bg-bx-tile text-bx-ok-fg",
  warn: "bg-bx-warn-bg text-bx-warn-fg",
  err: "bg-bx-err-bg text-bx-err-fg",
  info: "bg-bx-line2 text-bx-ink",
}

// Tono e ícono de cada notificación según su tipo (la cancelación de una reserva y una clase nueva tienen el suyo)
function aspecto(n) {
  if (n.tipo === "reserva" && /cancel/i.test(n.titulo || "")) return { tono: "warn", d: IC.back }
  if (/nueva clase/i.test(n.titulo || "")) return { tono: "info", d: IC.plusCircle }
  switch (n.tipo) {
    case "reserva": return { tono: "ok", d: IC.cal }
    case "asistencia": return { tono: "ok", d: IC.dumb }
    case "exito": return { tono: "ok", d: IC.check }
    case "credito": return { tono: "warn", d: IC.card }
    case "advertencia": return { tono: "warn", d: IC.warn }
    case "error": return { tono: "err", d: IC.warn }
    default: return { tono: "info", d: IC.bell }
  }
}

export function PanelNotificaciones({ notifs, noLeidas, limpiando, onCerrar, onClickNotif, onMarcarTodas, onBorrarTodas }) {
  const [filtro, setFiltro] = useState("todas")
  const [confirmar, setConfirmar] = useState(false)
  const cerrarRef = useRef(null)

  useEffect(() => {
    cerrarRef.current?.focus()
    const onKey = (e) => { if (e.key === "Escape") onCerrar() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onCerrar])

  const lista = filtro === "todas" ? notifs : notifs.filter((n) => !n.leida)
  const grupos = []
  lista.forEach((n) => {
    const dia = etiquetaDia(n.creadoEn).toUpperCase()
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.dia === dia) ultimo.items.push(n)
    else grupos.push({ dia, items: [n] })
  })

  return (
    <section
      id="panel-notif"
      role="dialog"
      aria-labelledby="t-notif"
      className="bx-pop absolute right-0 top-14 z-50 flex max-h-[min(40rem,calc(100vh-6rem))] w-[min(26.25rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-bx-line bg-bx-card shadow-[0_1rem_2.5rem_rgba(0,0,0,.35)]"
    >
      <div className="flex items-center justify-between gap-3 py-4 pl-5 pr-4">
        <div>
          <h2 id="t-notif" className="text-lg font-bold text-bx-ink">Notificaciones</h2>
          <div aria-live="polite" className="mt-0.5 text-[0.8125rem] font-medium text-bx-muted">
            {noLeidas === 0 ? "Todo leído" : noLeidas === 1 ? "1 sin leer" : `${noLeidas} sin leer`}
          </div>
        </div>
        <button ref={cerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar notificaciones" className="grid h-11 w-11 place-items-center rounded-[0.625rem] text-bx-ink hover:bg-bx-surf">
          <Ico d={IC.close} size={18} sw={2} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 border-b border-bx-line pb-3 pl-4 pr-3">
        <FiltroChips
          opciones={[{ id: "todas", label: "Todas" }, { id: "sin", label: "Sin leer" }]}
          valor={filtro}
          onChange={setFiltro}
          etiqueta="Filtrar"
          className="flex-nowrap gap-1.5"
        />
        <button
          type="button"
          onClick={onMarcarTodas}
          disabled={noLeidas === 0}
          className={`h-9 px-2.5 text-[0.8125rem] font-bold ${noLeidas ? "cursor-pointer text-bx-ok-fg" : "cursor-default text-bx-muted"}`}
        >
          Marcar todo como leído
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {lista.length === 0 && (
          <div className="px-6 py-10 text-center">
            <div className="text-base font-bold text-bx-ink">Estás al día</div>
            <div className="mt-1 text-sm text-bx-muted">{notifs.length === 0 ? "No tenés notificaciones." : "No tenés notificaciones sin leer."}</div>
          </div>
        )}
        {grupos.map((g) => (
          <div key={g.dia}>
            <h3 className="px-5 pb-1.5 pt-3 text-xs font-semibold tracking-[0.1em] text-bx-muted">{g.dia}</h3>
            <ul className="bx-lista m-0 list-none p-0">
              {g.items.map((n, idx) => {
                const { tono, d } = aspecto(n)
                const sinLeer = !n.leida
                return (
                  <li
                    key={n.idNotificacion}
                    style={limpiando ? { transitionDelay: `${Math.min(idx, 8) * 60}ms` } : undefined}
                    className={`relative border-t border-bx-line2 transition-all duration-300 ${sinLeer ? "bg-bx-unread" : ""} ${limpiando ? "translate-x-12 opacity-0" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={() => onClickNotif(n)}
                      aria-label={`${sinLeer ? "Sin leer. " : ""}${n.titulo}. ${n.mensaje} ${haceTiempo(n.creadoEn)}`}
                      className="flex w-full gap-3.5 py-3.5 pl-5 pr-11 text-left text-bx-ink hover:bg-bx-surf"
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${TONOS[tono]}`}>
                        <Ico d={d} size={18} sw={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[0.9375rem] ${sinLeer ? "font-bold" : "font-semibold"}`}>{n.titulo}</span>
                        <span className="mt-0.5 block text-sm leading-[1.45] text-bx-muted">{n.mensaje}</span>
                        <span title={formatearFechaNotif(n.creadoEn)} className="mt-1.5 block text-xs font-medium text-bx-muted">{haceTiempo(n.creadoEn)}</span>
                      </span>
                    </button>
                    {sinLeer && <span aria-hidden="true" className="absolute right-5 top-5 h-2.5 w-2.5 rounded-full bg-bx-lima" />}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
        {notifs.length > 0 && (
          <div className="border-t border-bx-line2 px-5 pb-4 pt-3">
            {confirmar ? (
              <div role="alert" className="flex flex-wrap items-center gap-2.5">
                <span className="min-w-[10rem] flex-1 text-sm font-medium text-bx-ink">¿Borrar todas las notificaciones?</span>
                <button type="button" onClick={() => setConfirmar(false)} className="h-10 rounded-lg border border-bx-btn-line px-3.5 text-[0.8125rem] font-bold text-bx-ink">No</button>
                <button type="button" onClick={() => { setConfirmar(false); onBorrarTodas() }} className="h-10 rounded-lg bg-bx-err-fg px-3.5 text-[0.8125rem] font-bold text-bx-card">Sí, borrar</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmar(true)} className="h-10 text-[0.8125rem] font-semibold text-bx-muted underline">Borrar todas</button>
            )}
          </div>
        )}
      </div>

      <PiePush />
    </section>
  )
}

// Pie del panel: estado de los avisos push de este dispositivo. Activar no crea ninguna notificación.
function PiePush() {
  const [estado, setEstado] = useState(null)
  const [trabajando, setTrabajando] = useState(false)

  useEffect(() => {
    let vigente = true
    estadoPush().then((e) => { if (vigente) setEstado(e) }).catch(() => {})
    return () => { vigente = false }
  }, [])

  // Sin app instalada o navegador sin soporte: no se muestra nada (igual que antes)
  if (!estado || estado === "sin-app" || estado === "no-soportado") return null

  const activar = async () => {
    setTrabajando(true)
    try {
      await activarPush()
      toast.success("Avisos activados en este dispositivo", { guardar: false })
    } catch (err) {
      toast.error("No se pudieron activar los avisos", { description: err.response?.data?.message || err.message })
    } finally {
      setEstado(await estadoPush().catch(() => estado))
      setTrabajando(false)
    }
  }

  const activas = estado === "activas"
  const texto = activas
    ? "Avisos activados en este dispositivo."
    : estado === "instalar-ios"
      ? "Para recibir avisos en el iPhone, instalá la app: en Safari, Compartir → Agregar a inicio."
      : estado === "bloqueadas"
        ? "Los avisos están bloqueados en este navegador. Permitilos en la configuración del sitio."
        : "Recibí los avisos en este dispositivo, aunque la app esté cerrada."
  const puedeActivar = !activas && estado !== "instalar-ios" && estado !== "bloqueadas"

  return (
    <div className="flex items-center gap-3 border-t border-bx-line bg-bx-surf py-3.5 pl-5 pr-4">
      <span className={`flex ${activas ? "text-bx-ok-fg" : "text-bx-muted"}`}><Ico d={activas ? IC.bell : IC.bellOff} /></span>
      <span className="flex-1 text-sm font-medium leading-snug text-bx-ink">{texto}</span>
      {puedeActivar && (
        <button type="button" onClick={activar} disabled={trabajando} className="h-11 rounded-full bg-bx-lima px-[1.125rem] text-sm font-bold text-bx-negro hover:bg-bx-lima-hover disabled:opacity-60">
          {trabajando ? "Activando…" : "Activar"}
        </button>
      )}
    </div>
  )
}

// Avisos abajo en el medio (5 s): role="status" aria-live="polite"
const AVISO_OK = { caja: "border-[#3d5a10] bg-bx-lateral text-[#ecefe4]", icono: "text-bx-lima" }
const TONOS_AVISO = {
  exito: AVISO_OK,
  reserva: AVISO_OK,
  asistencia: AVISO_OK,
  error: { caja: "border-bx-err-line bg-bx-err-bg text-bx-err-fg", icono: "" },
  advertencia: { caja: "border-bx-warn-line bg-bx-warn-bg text-bx-warn-fg", icono: "" },
  credito: { caja: "border-bx-warn-line bg-bx-warn-bg text-bx-warn-fg", icono: "" },
}
const AVISO_NEUTRO = { caja: "border-bx-line bg-bx-card text-bx-ink", icono: "" }

export function AvisosAbajo({ toasts, onClick }) {
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[110] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icono = ICONOS_TIPO[t.tipo] || Info
        const generico = ["Éxito", "Error", "Atención", "Info"].includes(t.titulo)
        const tono = TONOS_AVISO[t.tipo] || AVISO_NEUTRO
        return (
          <div
            key={t.pid}
            onClick={() => onClick(t)}
            className={`bx-aviso pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-[0_0.5rem_1.5rem_rgba(0,0,0,.3)] ${tono.caja} ${t.link ? "cursor-pointer" : ""}`}
          >
            <Icono className={`h-[1.125rem] w-[1.125rem] shrink-0 ${tono.icono}`} aria-hidden="true" />
            <p className="leading-snug">{!generico && <span className="font-bold">{t.titulo}. </span>}{t.mensaje}</p>
            {t.accion && <span className="whitespace-nowrap font-bold text-bx-lima">{t.accion}</span>}
          </div>
        )
      })}
    </div>
  )
}
