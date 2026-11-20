import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "@/api"
import BandejaMovil from "@/components/BandejaMovil"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { estadoPush, activarPush } from "@/lib/push"
import { toast } from "@/lib/notificar"

/*
 * Notificaciones en el celular: pantalla completa con la bandeja del alumno (diseño de BandejaMovil: tarjetas que se abren
 * para ver las acciones y se borran deslizándolas). Filtros Todas / Sin leer, "Leer todo", "Borrar todo", aviso para activar
 * los avisos (descartable). Usa las mismas rutas que la campanita (/notificaciones).
 */

export default function NotificacionesMovilNuevo() {
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState(null)
  const [error, setError] = useState(false)
  const [filtro, setFiltro] = useState("todas")
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

  const noLeidas = (notifs || []).filter((n) => !n.leida).length

  const leer = (n) => {
    if (n.leida) return
    setNotifs((prev) => prev.map((x) => (x.idNotificacion === n.idNotificacion ? { ...x, leida: true } : x)))
    apiClient.patch(`/notificaciones/${n.idNotificacion}/leer`).catch(() => {})
  }
  const abrir = (n) => {
    leer(n)
    if (n.link) navigate(n.link)
  }
  const leerTodo = () => {
    setNotifs((prev) => prev.map((x) => ({ ...x, leida: true })))
    apiClient.patch("/notificaciones/leer-todas").catch(() => {})
    toast.success("Listo, todo leído", { guardar: false })
  }
  const borrar = (n) => {
    setNotifs((prev) => prev.filter((x) => x.idNotificacion !== n.idNotificacion))
    apiClient.delete(`/notificaciones/${n.idNotificacion}`).catch(() => { toast.error("No se pudo borrar la notificación", { guardar: false }); cargar() })
  }
  const borrarTodo = () => {
    setNotifs([])
    apiClient.delete("/notificaciones").catch(() => { toast.error("No se pudieron borrar las notificaciones", { guardar: false }); cargar() })
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

  const aviso = consejo && estadoAvisos && estadoAvisos !== "activas" && estadoAvisos !== "no-soportado" && estadoAvisos !== "sin-app" ? (
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
  ) : null

  return (
    <BandejaMovil
      notifs={notifs}
      cargando={!error && notifs === null}
      error={error}
      onReintentar={cargar}
      filtro={filtro}
      onFiltro={setFiltro}
      noLeidas={noLeidas}
      onAbrir={abrir}
      onLeer={leer}
      onBorrar={borrar}
      onLeerTodo={leerTodo}
      onBorrarTodo={borrarTodo}
      aviso={aviso}
      className="bx-entrada"
    />
  )
}
