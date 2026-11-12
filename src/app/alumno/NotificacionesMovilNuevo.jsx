import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "@/api"
import { Chip, ErrorBanner, Esqueleto, FiltroChips } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { estadoPush, activarPush } from "@/lib/push"
import { toast } from "@/lib/notificar"
import { ICONOS_TIPO } from "@/lib/avisosEstilos"

/*
 * Notificaciones en el celular (handoff móvil, Prompt 5): pantalla completa con la bandeja del alumno. Filtros Todas / Sin leer
 * con contador, "Leer todo", aviso para activar los avisos (descartable), no leídas con fondo y punto lima, botón de acción por
 * notificación (si trae enlace) y estado "Estás al día". Usa las mismas rutas que la campanita (/notificaciones).
 */

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

// "2026-11-12 18:41:00" o ISO → Date (MySQL manda sin zona: se toma como UTC)
function parsear(raw) {
  if (!raw) return new Date()
  const s = String(raw).replace(" ", "T")
  return new Date(s.endsWith("Z") || s.includes("+") ? s : s + "Z")
}

const hace = (raw) => {
  const min = Math.floor((Date.now() - parsear(raw).getTime()) / 60000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? "hace 1 día" : `hace ${d} días`
}

// "jueves 12 de noviembre" (sin "(s)")
const diaLargo = (raw) => { const f = parsear(raw); return `${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}` }

// Agrupa por día: Hoy, Ayer o la fecha completa
function grupoDeDia(raw) {
  const f = parsear(raw)
  const hoy = new Date(), ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
  if (f.toDateString() === hoy.toDateString()) return "Hoy"
  if (f.toDateString() === ayer.toDateString()) return "Ayer"
  return diaLargo(raw)
}

export default function NotificacionesMovilNuevo() {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState(null)
  const [error, setError] = useState(false)
  const [filtro, setFiltro] = useState("todas")
  const [leidas, setLeidas] = useState({})
  const [consejo, setConsejo] = useState(() => { try { return localStorage.getItem("bx-consejo-avisos") !== "1" } catch { return true } })
  const [estadoAvisos, setEstadoAvisos] = useState(null)

  const cargar = () => {
    setError(false)
    apiClient.get("/notificaciones")
      .then((r) => setNotifs(r.data?.data?.notificaciones || []))
      .catch(() => setError(true))
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar() }, [])
  useEffect(() => { estadoPush().then(setEstadoAvisos).catch(() => {}) }, [])

  const estaLeida = (n) => !!n.leida || !!leidas[n.idNotificacion]
  const noLeidas = (notifs || []).filter((n) => !estaLeida(n)).length
  const lista = (notifs || []).filter((n) => filtro === "todas" || !estaLeida(n))

  const abrir = (n) => {
    if (!estaLeida(n)) {
      setLeidas((x) => ({ ...x, [n.idNotificacion]: true }))
      apiClient.patch(`/notificaciones/${n.idNotificacion}/leer`).catch(() => {})
    }
    if (n.link) navigate(n.link)
  }

  const leerTodo = () => {
    setLeidas(Object.fromEntries((notifs || []).map((n) => [n.idNotificacion, true])))
    apiClient.patch("/notificaciones/leer-todas").catch(() => {})
    toast.success("Listo, todo leído", { guardar: false })
  }

  const ocultarConsejo = () => { setConsejo(false); try { localStorage.setItem("bx-consejo-avisos", "1") } catch { /* sin almacenamiento */ } }

  const activarAvisos = async () => {
    try {
      await activarPush()
      setEstadoAvisos(await estadoPush())
      toast.success("Avisos activados en este dispositivo", { guardar: false })
    } catch (err) {
      toast.error("No se pudieron activar los avisos", { description: err?.response?.data?.message || err.message })
    }
  }

  // Agrupa la lista por día
  const grupos = []
  lista.forEach((n) => {
    const g = grupoDeDia(n.creadoEn)
    const ult = grupos[grupos.length - 1]
    if (ult && ult.t === g) ult.items.push(n)
    else grupos.push({ t: g, items: [n] })
  })

  return (
    <div className="bx bx-entrada flex flex-col gap-4">
      <h1 className="m-0 text-[1.375rem] font-extrabold">Notificaciones</h1>

      <div className="flex items-center justify-between gap-2">
        <FiltroChips etiqueta="Filtrar notificaciones" tactil valor={filtro} onChange={setFiltro}
          opciones={[{ id: "todas", label: "Todas", contador: (notifs || []).length }, { id: "sin", label: "Sin leer", contador: noLeidas }]} />
        <button type="button" onClick={leerTodo} disabled={noLeidas === 0} aria-label="Marcar todas como leídas" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-2 text-sm font-bold text-bx-ok-fg disabled:text-bx-muted">
          <Ico d="M3 13l4 4L13 9M11 13l4 4 7-8" size={16} sw={2} />Leer todo
        </button>
      </div>

      {consejo && estadoAvisos && estadoAvisos !== "activas" && estadoAvisos !== "no-soportado" && estadoAvisos !== "sin-app" && (
        <section aria-label="Activar avisos" className="relative flex items-start gap-3 rounded-2xl border border-bx-ok-line bg-bx-ok-bg p-4">
          <Ico d={IC.bell} size={20} sw={1.8} className="mt-0.5 shrink-0 text-bx-ok-fg" />
          <div className="min-w-0 flex-1">
            <div className="text-[0.9375rem] font-bold">Activá los avisos en tu celular</div>
            <div className="mt-0.5 text-[0.8125rem] leading-normal text-bx-muted">{estadoAvisos === "instalar-ios" ? "Instalá la app: en Safari, tocá Compartir → Agregar a inicio." : estadoAvisos === "bloqueadas" ? "Están bloqueados en el navegador: permitilos en la configuración del sitio." : "Te avisamos de tus reservas y vencimientos aunque la app esté cerrada."}</div>
            {estadoAvisos === "pendiente" || estadoAvisos === "inactiva" ? (
              <button type="button" onClick={activarAvisos} className="mt-2.5 inline-flex min-h-11 items-center rounded-full bg-bx-lima px-4 text-sm font-extrabold text-bx-negro">Activar avisos</button>
            ) : null}
          </div>
          <button type="button" onClick={ocultarConsejo} aria-label="Ocultar consejo" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-bx-muted"><Ico d={IC.close} size={16} sw={2} /></button>
        </section>
      )}

      {error && <ErrorBanner titulo="No pudimos cargar tus notificaciones" texto="Revisá tu conexión e intentá de nuevo." onReintentar={cargar} />}
      {!error && notifs === null && <Esqueleto alto={140} className="rounded-2xl" etiqueta="Cargando notificaciones" />}

      {!error && notifs && lista.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-bx-line bg-bx-card px-5 py-9 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-bx-tile text-bx-ok-fg"><Ico d={IC.bell} size={22} sw={1.8} /></span>
          <div className="text-base font-bold">Estás al día</div>
          <div className="text-sm text-bx-muted">{filtro === "sin" ? "No tenés notificaciones sin leer." : "Todavía no tenés notificaciones."}</div>
        </div>
      )}

      {grupos.map((g) => (
        <section key={g.t} aria-label={g.t} className="flex flex-col gap-2">
          <h2 className="m-0 text-xs font-semibold tracking-[0.1em] capitalize text-bx-muted">{g.t}</h2>
          <ul className="bx-lista m-0 flex list-none flex-col overflow-hidden rounded-2xl border border-bx-line bg-bx-card p-0">
            {g.items.map((n) => {
              const Icono = ICONOS_TIPO[n.tipo] || IC.bell
              const leida = estaLeida(n)
              return (
                <li key={n.idNotificacion} className={`relative border-t border-bx-line2 first:border-t-0 ${leida ? "" : "bg-bx-unread"}`}>
                  <button type="button" onClick={() => abrir(n)} aria-label={`${leida ? "" : "Sin leer. "}${n.titulo}. ${n.mensaje}`} className="flex w-full gap-3 px-4 py-3.5 text-left active:bg-bx-surf">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bx-line2 text-bx-ink" aria-hidden="true"><Icono className="h-4 w-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`text-[0.9375rem] ${leida ? "font-semibold" : "font-bold"}`}>{n.titulo}</span>
                        <span className="shrink-0 pt-0.5 text-[0.75rem] text-bx-muted">{hace(n.creadoEn)}</span>
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-normal text-bx-muted">{n.mensaje}</span>
                      {n.link && <span className="mt-1.5 inline-block text-[0.8125rem] font-bold text-bx-ok-fg">Ver →</span>}
                    </span>
                    {!leida && <span aria-hidden="true" className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-bx-lima" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {notifs && notifs.length > 0 && <div className="flex justify-center"><Chip tono="neutro">{notifs.length} en total</Chip></div>}
    </div>
  )
}
