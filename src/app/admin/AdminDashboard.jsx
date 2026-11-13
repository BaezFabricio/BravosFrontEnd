import { useContext, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { AlertTriangle, Calendar, ChevronRight, Clock, DollarSign, Plus, TrendingUp, UserCheck } from "lucide-react"
import apiClient from "@/api"
import { SlotTituloContext } from "@/lib/slotTitulo"
import { EsqueletoAdmin, EstadoVacio, TarjetaAdmin } from "@/components/admin/kit"

const AVATAR_COLORS = [
  { bg: "bg-lime-400/15",   text: "text-lime-700 dark:text-lime-400" },
  { bg: "bg-sky-400/15",    text: "text-sky-700 dark:text-sky-400" },
  { bg: "bg-violet-400/15", text: "text-violet-700 dark:text-violet-400" },
  { bg: "bg-orange-400/15", text: "text-orange-700 dark:text-orange-400" },
  { bg: "bg-pink-400/15",   text: "text-pink-700 dark:text-pink-400" },
  { bg: "bg-teal-400/15",   text: "text-teal-700 dark:text-teal-400" },
]

const DIA_MS = 24 * 60 * 60 * 1000
const FECHA_HOY = (() => {
  const texto = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
})()
const MES_ACTUAL = new Date().toLocaleDateString("es-AR", { month: "long" }).toUpperCase()

function getInitials(name = "") {
  const partes = name.trim().split(/\s+/)
  if (!partes[0]) return "?"
  return (partes[0][0] + (partes[1]?.[0] || "")).toUpperCase()
}

// Días sin pagar: 30 o más en rojo, de 15 a 29 en amarillo, menos de 15 en verde
function colorDias(dias) {
  if (dias >= 30) return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
  if (dias >= 15) return "bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/20"
  return "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/20"
}

function getAvatarColor(name = "") {
  const suma = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[suma % AVATAR_COLORS.length]
}

const TONO_ICONO = {
  ok: "bg-lime-400/15 text-lime-700 dark:text-lime-400",
  aviso: "bg-yellow-400/15 text-yellow-700 dark:text-yellow-400",
  error: "bg-red-500/15 text-red-700 dark:text-[#ff8a80]",
}
const TONO_NOTA = {
  ok: "text-lime-700 dark:text-lime-400",
  muted: "text-muted-foreground",
}

// Monto que viene escrito en la acción ("Pago recibido: $50.00" → "$50.00")
const montoDe = (accion = "") => (String(accion).match(/\$\s?[\d.,]+/) || [""])[0]

// Fecha corta de la fila: "12 nov" y, si tiene hora, "12 nov · 13:44"
const fechaCorta = (fechaOrden) => {
  const d = new Date(fechaOrden)
  if (isNaN(d.getTime())) return "-"
  return `${d.getDate()} ${d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}`
}

export default function AdminDashboard() {
  const [tarjetas, setTarjetas] = useState({
    totalUsuarios: "...",
    usuariosActivos: "...",
    ingresosMes: "...",
    membresiasPorVencer: "..."
  })
  const [suspendedUsers, setSuspendedUsers] = useState([])
  const [clasesHoy, setClasesHoy] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [pestana, setPestana] = useState("actividad")
  const [filtroActividad, setFiltroActividad] = useState("todo")
  const [ahora, setAhora] = useState(0) // momento en que llegaron los datos (para filtrar por hoy, semana y mes)
  const slotCabecera = useContext(SlotTituloContext)
  const permisos = JSON.parse(localStorage.getItem('permisos') || '[]');
  // Solo oculta la pantalla: el permiso real lo controla el servidor en /dashboard/metrics
  const puedeVer = permisos.includes('dashboard:consulta')

  useEffect(() => {
    if (!puedeVer) return
    const fetchDashboardStats = async () => {
      try {
        const response = await apiClient.get("/dashboard/metrics")
        const resData = response.data?.data || response.data
        if (resData) {
          setTarjetas(resData.tarjetas)
          setSuspendedUsers(resData.suspendedUsers || [])
          setClasesHoy(resData.clasesDeHoy || [])
          setAhora(Date.now())
          setRecentActivity(resData.recentActivity || [])
        }
      } catch (error) {
        console.error("Error al sincronizar métricas del administrador:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardStats()
  }, [puedeVer])

  const ingresosFormateados = typeof tarjetas.ingresosMes === "number"
    ? `$${tarjetas.ingresosMes.toLocaleString("es-AR")}`
    : tarjetas.ingresosMes

  // Los textos salen de los datos reales
  const total = Number(tarjetas.totalUsuarios) || 0
  const activos = Number(tarjetas.usuariosActivos) || 0
  const porcentajeActivos = total > 0 ? Math.round((activos / total) * 100) : 0
  const sinPago = suspendedUsers.length

  // Los cuatro indicadores de la referencia
  const indicadores = [
    { label: "USUARIOS ACTIVOS", value: tarjetas.usuariosActivos, unit: total > 0 ? `de ${total}` : "", nota: total > 0 ? `${porcentajeActivos}% del total` : "Sin alumnos todavía", tono: "ok", notaTono: "ok", Icono: UserCheck },
    { label: `INGRESOS DE ${MES_ACTUAL}`, value: ingresosFormateados, unit: "", nota: "Pagos confirmados", tono: "ok", notaTono: "ok", Icono: DollarSign },
    { label: "POR VENCER", value: tarjetas.membresiasPorVencer, unit: "membresías", nota: "En período de renovación", tono: "aviso", notaTono: "muted", Icono: Clock },
    { label: "SIN PAGO", value: sinPago, unit: "usuarios", nota: sinPago > 0 ? "Con membresía vencida" : "Nadie suspendido", tono: "error", notaTono: "muted", Icono: AlertTriangle },
  ]

  // Actividad: filtro por tipo (Todo, Pagos, Reservas)
  const actividadFiltrada = recentActivity.filter((a) => {
    if (filtroActividad === "todo") return true
    const accion = String(a.action || "").toLowerCase()
    return filtroActividad === "pagos" ? accion.includes("pago") : accion.includes("reserv")
  })

  const formatearHora = (fechaOrden) => {
    const d = new Date(fechaOrden)
    if (isNaN(d.getTime())) return null
    const h = d.getHours(), m = d.getMinutes()
    return (h === 0 && m === 0) ? null : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  // Grupos de la actividad: "ESTA SEMANA" (últimos 7 días) y después el nombre del mes
  const grupoDe = (f) => {
    const t = new Date(f).getTime()
    if (isNaN(t)) return "-"
    if (ahora && ahora - t <= 7 * DIA_MS) return "ESTA SEMANA"
    return new Date(t).toLocaleDateString("es-AR", { month: "long" }).toUpperCase()
  }
  const grupos = []
  for (const a of actividadFiltrada) {
    const label = grupoDe(a.fecha_orden)
    let g = grupos.find((x) => x.label === label)
    if (!g) { g = { label, items: [] }; grupos.push(g) }
    g.items.push(a)
  }

  const iconoActividad = (action = "") => {
    const accion = String(action).toLowerCase()
    if (accion.includes("pago")) return { Icono: DollarSign, bg: "bg-lime-400/15", fg: "text-lime-700 dark:text-lime-400" }
    if (accion.includes("reserv")) return { Icono: Calendar, bg: "bg-muted", fg: "text-muted-foreground" }
    return { Icono: TrendingUp, bg: "bg-muted", fg: "text-muted-foreground" }
  }

  // Texto de cada actividad, más claro: "Reservó: Miércoles" pasa a "Reservó clase miércoles"
  const textoAccion = (accion = "") => {
    const m = String(accion).match(/^Reservó:\s*(.+)$/i)
    if (m) return `Reservó clase ${m[1].charAt(0).toLowerCase()}${m[1].slice(1)}`
    return accion
  }

  // Contenido de la actividad, con sus grupos y filas
  const listaActividad = loading ? (
    <EsqueletoAdmin filas={3} />
  ) : actividadFiltrada.length === 0 ? (
    <EstadoVacio titulo="Sin actividad reciente" texto="Cuando los alumnos reserven o paguen, aparece acá." />
  ) : (
    <div>
      {grupos.map((g) => (
        <div key={g.label}>
          <p className="px-5 pb-1.5 pt-3.5 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">{g.label}</p>
          <ul className="divide-y divide-border">
            {g.items.map((activity, index) => {
              const { Icono, bg, fg } = iconoActividad(activity.action)
              const monto = montoDe(activity.action)
              const hora = formatearHora(activity.fecha_orden)
              return (
                <li key={index} className="grid min-h-[60px] grid-cols-[36px_minmax(0,1fr)_auto_128px] items-center gap-3.5 border-t border-border px-5 py-2 first:border-t-0">
                  <span className={`grid h-9 w-9 place-items-center rounded-full ${bg} ${fg}`} aria-hidden="true">
                    <Icono className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-bold text-foreground">{activity.user}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{textoAccion(activity.action)}</span>
                  </span>
                  <span className="text-[15px] font-extrabold text-lime-700 dark:text-lime-400">{monto}</span>
                  <span className="text-right text-[13px] font-medium text-muted-foreground">
                    {fechaCorta(activity.fecha_orden)}{hora ? ` · ${hora}` : ""}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )

  // Lista de usuarios sin pago (celular)
  const listaSinPago = loading ? (
    <p className="text-sm text-muted-foreground text-center py-8">Buscando...</p>
  ) : suspendedUsers.length === 0 ? (
    <div className="px-5 py-8 text-center">
      <p className="text-sm text-lime-700 dark:text-lime-400 font-semibold">¡Todo en orden!</p>
      <p className="text-xs text-muted-foreground mt-1">No hay usuarios suspendidos.</p>
    </div>
  ) : (
    <div className="divide-y divide-border">
      {suspendedUsers.map((user) => {
        const avatar = getAvatarColor(user.name)
        return (
          <div key={user.dni} className="flex items-center gap-3 px-5 py-3 hover:bg-foreground/[0.02] transition-colors">
            <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[0.6875rem] font-black ${avatar.bg} ${avatar.text}`}>
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{user.name}</p>
              <p className="text-[0.6875rem] text-muted-foreground mt-0.5 truncate">{user.email || "sin correo"}</p>
            </div>
            <span className={`text-[0.625rem] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md shrink-0 ${colorDias(user.daysOverdue)}`}>
              {user.daysOverdue <= 0 ? "Sin créditos" : `${user.daysOverdue} días`}
            </span>
          </div>
        )
      })}
    </div>
  )

  // Clases de hoy (lista cuando hay clases)
  const listaClases = loading ? (
    <EsqueletoAdmin filas={2} />
  ) : clasesHoy.length === 0 ? (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <span className="grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-lime-400/10 text-lime-700 dark:text-lime-400">
        <Calendar className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-base font-bold text-foreground">No hay clases para hoy</p>
        <p className="mt-1 text-sm text-muted-foreground">Los alumnos no pueden reservar hasta que crees una.</p>
      </div>
      <Link to="/admin/clases/nueva" className="flex h-11 items-center gap-2 rounded-[10px] border border-lime-600/40 bg-lime-400/10 px-4 text-[13px] font-extrabold tracking-wide text-lime-700 no-underline hover:border-lime-500 dark:text-lime-400">
        <Plus className="h-4 w-4" aria-hidden="true" /> + CREAR CLASE
      </Link>
    </div>
  ) : (
    <ul className="divide-y divide-border">
      {clasesHoy.map((cls, index) => {
        const lleno = cls.spots && cls.spots.includes('/') && cls.spots.split('/')[0] === cls.spots.split('/')[1]
        return (
          <li key={index} className="flex items-center justify-between gap-4 px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="w-12 shrink-0 text-xs font-black text-muted-foreground">{cls.time}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{cls.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{cls.coach}</p>
              </div>
            </div>
            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-black uppercase tracking-widest ${lleno ? "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400" : "border-lime-400/20 bg-lime-400/10 text-lime-700 dark:text-lime-400"}`}>
              {cls.spots || "0/0"}
            </span>
          </li>
        )
      })}
    </ul>
  )

  if (!puedeVer) return null

  const PESTANAS = [
    { id: "actividad", label: "Actividad reciente" },
    { id: "sinPago", label: "Sin pago", cantidad: suspendedUsers.length },
    { id: "clases", label: "Clases de hoy" },
  ]

  // Saludo: primer nombre de quien inició sesión
  const primerNombre = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("usuario") || "null")
      return String(u?.nombrecompleto || u?.nombre || u?.username || "").trim().split(/\s+/)[0] || ""
    } catch {
      return ""
    }
  })()

  // Accesos rápidos: solo los que el perfil puede usar
  const ACCESOS = [
    { label: "Cargar abono", href: "/admin/usuarios", permiso: "usuarios:consulta", principal: true },
    { label: "Nuevo usuario", href: "/admin/usuarios/nuevo", permiso: "usuarios:consulta" },
    { label: "Crear clase", href: "/admin/clases/nueva", permiso: "clases:consulta" },
    { label: "Abrir check-in", href: "/admin/check-in", permiso: "configuracion:consulta" },
  ]
  const accesosVisibles = ACCESOS.filter((a) => permisos.includes(a.permiso))

  // Título de la barra superior (fecha y saludo), como la referencia
  const cabecera = (
    <div className="min-w-0">
      <p className="truncate text-[13px] font-medium text-muted-foreground">{FECHA_HOY}</p>
      <h1 className="truncate text-[22px] font-extrabold leading-tight text-foreground">{primerNombre ? `Hola, ${primerNombre}` : "Bienvenido"}</h1>
    </div>
  )

  return (
    <div className="space-y-6">
      {slotCabecera ? createPortal(cabecera, slotCabecera) : slotCabecera === false ? cabecera : null}

      {/* Accesos rápidos */}
      {accesosVisibles.length > 0 && (
        <div role="group" aria-label="Accesos rápidos" className="flex flex-wrap gap-2.5">
          {accesosVisibles.map((a) => (
            <Link
              key={a.href}
              to={a.href}
              className={`flex h-11 items-center gap-2 whitespace-nowrap rounded-[10px] text-[13px] no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                a.principal
                  ? "bg-lime-400 px-[18px] font-extrabold uppercase tracking-[.04em] text-[#0b0b0b] hover:bg-lime-300"
                  : "border border-[#cfcfc4] px-4 font-bold text-foreground hover:bg-[rgba(128,128,128,.14)] dark:border-[#333]"
              }`}
            >
              {a.principal && <Plus className="h-4 w-4" aria-hidden="true" />}
              {a.label}
            </Link>
          ))}
        </div>
      )}

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {indicadores.map((k) => (
          <div key={k.label} className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card px-5 py-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground">{k.label}</p>
              <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] ${TONO_ICONO[k.tono]}`} aria-hidden="true">
                <k.Icono className="h-[17px] w-[17px]" />
              </span>
            </div>
            <p className="flex items-baseline gap-2">
              <span className="text-[44px] font-black leading-none text-foreground" style={{ fontFamily: "'Big Shoulders Stencil Display', Archivo, sans-serif" }}>{k.value}</span>
              {k.unit && <span className="text-[15px] font-semibold text-muted-foreground">{k.unit}</span>}
            </p>
            <p className={`text-[13px] font-semibold ${TONO_NOTA[k.notaTono]}`}>{k.nota}</p>
          </div>
        ))}
      </div>

      {/* CELULAR: las tres listas en pestañas */}
      <div className="lg:hidden">
        <div role="tablist" aria-label="Detalle del resumen" className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={pestana === p.id}
              onClick={() => setPestana(p.id)}
              className={`flex min-h-[2.75rem] items-center justify-center gap-1.5 rounded-lg px-1 text-center text-[0.625rem] font-black uppercase leading-tight tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                pestana === p.id ? "bg-foreground/10 text-foreground" : "text-foreground/55 hover:text-foreground"
              }`}
            >
              {p.label}
              {!loading && p.cantidad > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[0.5625rem] text-white">{p.cantidad}</span>
              )}
            </button>
          ))}
        </div>
        <div role="tabpanel" className="mt-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-sm font-black uppercase tracking-wide text-foreground">
              {pestana === "sinPago" ? "Usuarios sin pago" : pestana === "clases" ? "Clases de hoy" : "Actividad reciente"}
            </p>
          </div>
          <TarjetaAdmin>
            {pestana === "sinPago" ? listaSinPago : pestana === "clases" ? listaClases : listaActividad}
          </TarjetaAdmin>
        </div>
      </div>

      {/* COMPUTADORA: actividad a la izquierda; clases de hoy y requiere atención a la derecha */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start lg:gap-6">
        <TarjetaAdmin>
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <h2 className="flex-1 text-[17px] font-extrabold text-foreground">Actividad reciente</h2>
            <div role="group" aria-label="Filtrar actividad" className="flex gap-1.5">
              {[["todo", "Todo"], ["pagos", "Pagos"], ["reservas", "Reservas"]].map(([id, label]) => {
                const activo = filtroActividad === id
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltroActividad(id)}
                    className={`h-9 rounded-full border px-3.5 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      activo ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-[rgba(128,128,128,.14)]"
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          {listaActividad}
          <Link to="/admin/reportes" className="flex min-h-[52px] items-center justify-center border-t border-border text-sm font-bold text-foreground no-underline hover:bg-[rgba(128,128,128,.14)]">
            Ver toda la actividad →
          </Link>
        </TarjetaAdmin>

        <div className="flex flex-col gap-6">
          <TarjetaAdmin>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="whitespace-nowrap text-[17px] font-extrabold text-foreground">Clases de hoy</h2>
              <Link to="/admin/clases" className="whitespace-nowrap text-[13px] font-bold text-foreground no-underline hover:text-lime-700 dark:hover:text-lime-400">Ver clases</Link>
            </div>
            {listaClases}
          </TarjetaAdmin>

          <TarjetaAdmin>
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[17px] font-extrabold text-foreground">Requiere atención</h2>
            </div>
            <ul className="divide-y divide-border">
              {[
                { t: "Usuarios sin pago", n: loading ? null : sinPago, href: "/admin/usuarios" },
                { t: "Membresías por vencer", n: loading ? null : Number(tarjetas.membresiasPorVencer) || 0, href: "/admin/planes" },
              ].map((fila) => (
                <li key={fila.t}>
                  <Link to={fila.href} className="flex min-h-[58px] items-center gap-3 px-5 text-foreground no-underline hover:bg-[rgba(128,128,128,.14)]">
                    <span className="flex-1 text-sm font-semibold">{fila.t}</span>
                    <span className={`min-w-[30px] rounded-full border px-2.5 py-0.5 text-center text-[13px] font-extrabold ${fila.n > 0 ? "border-yellow-500/30 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400" : "border-border bg-muted text-muted-foreground"}`}>
                      {fila.n === null ? "…" : fila.n}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </TarjetaAdmin>
        </div>
      </div>
    </div>
  )
}
