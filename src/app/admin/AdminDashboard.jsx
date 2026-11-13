import { useEffect, useState } from "react"
import { Users, Calendar, TrendingUp, UserCheck, Clock, DollarSign, Dumbbell, Plus } from "lucide-react"
import { Link } from "react-router-dom"
import apiClient from "@/api"
import { Cargando } from '@/components/Cargando'
import { TituloPagina } from "@/components/TituloPagina"

const AVATAR_COLORS = [
  { bg: "bg-lime-400/15",   text: "text-lime-700 dark:text-lime-400" },
  { bg: "bg-sky-400/15",    text: "text-sky-700 dark:text-sky-400" },
  { bg: "bg-violet-400/15", text: "text-violet-700 dark:text-violet-400" },
  { bg: "bg-orange-400/15", text: "text-orange-700 dark:text-orange-400" },
  { bg: "bg-pink-400/15",   text: "text-pink-700 dark:text-pink-400" },
  { bg: "bg-teal-400/15",   text: "text-teal-700 dark:text-teal-400" },
]

// Frase del saludo: cambia cada día (se calcula una vez al cargar la pantalla)
const FRASES_SALUDO = [
  "Hoy el box está en buenas manos.",
  "Repasemos cómo viene el movimiento del box.",
  "Un día ordenado hace al box más fuerte.",
]
const DIA_MS = 24 * 60 * 60 * 1000
const FECHA_LARGA = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })
const FRASE_DEL_DIA =FRASES_SALUDO[Math.floor(Date.now() / 86400000) % FRASES_SALUDO.length]

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

  // Los textos de abajo salen de los datos reales (antes había porcentajes fijos, "+12%" y "+8%")
  const total = Number(tarjetas.totalUsuarios) || 0
  const activos = Number(tarjetas.usuariosActivos) || 0
  const porcentajeActivos = total > 0 ? Math.round((activos / total) * 100) : 0
  const statsLayout = [
    { title: "Total Usuarios",        value: tarjetas.totalUsuarios,        sub: "Alumnos registrados", type: "neutral",  icon: Users },
    { title: "Usuarios Activos",      value: tarjetas.usuariosActivos,      sub: total > 0 ? `${porcentajeActivos}% del total` : "Sin alumnos todavía", type: "positive", icon: UserCheck },
    { title: "Ingresos del Mes",      value: ingresosFormateados,           sub: "Pagos confirmados",type: "positive", icon: DollarSign },
    { title: "Membresías por Vencer", value: tarjetas.membresiasPorVencer,  sub: "En período de renovación", type: "warning",  icon: Clock },
  ]

  const statStyle = {
    neutral:  { border: "border-l-foreground/20", badgeBg: "bg-foreground/10",  icon: "text-foreground/50", sub: "text-foreground/40" },
    positive: { border: "border-l-lime-600 dark:border-l-lime-400",     badgeBg: "bg-lime-400/15",    icon: "text-lime-700 dark:text-lime-400",     sub: "text-lime-700 dark:text-lime-400" },
    warning:  { border: "border-l-yellow-600 dark:border-l-yellow-400", badgeBg: "bg-yellow-400/15",  icon: "text-yellow-700 dark:text-yellow-400", sub: "text-yellow-700 dark:text-yellow-400" },
  }

  const formatearActividad = (fechaOrden) => {
    if (!fechaOrden) return { fecha: '-', hora: null }
    const d = new Date(fechaOrden)
    if (isNaN(d.getTime())) return { fecha: '-', hora: null }
    const hoy = new Date()
    const ayer = new Date(); ayer.setDate(hoy.getDate() - 1)
    const esHoy  = d.toDateString() === hoy.toDateString()
    const esAyer = d.toDateString() === ayer.toDateString()
    const fecha = esHoy ? 'Hoy' : esAyer ? 'Ayer' : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
    const h = d.getHours(), m = d.getMinutes()
    const hora = (h === 0 && m === 0) ? null : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    return { fecha, hora }
  }

  const actividadIcon = (action = '') => {
    if (action.toLowerCase().includes('pago')) return <DollarSign className="h-3.5 w-3.5 text-lime-700 dark:text-lime-400" />
    if (action.toLowerCase().includes('reserv')) return <Calendar className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
    return <TrendingUp className="h-3.5 w-3.5 text-foreground/30" />
  }

  // Filtros de la actividad por período (hoy, últimos 7 días, últimos 30 días). Un período aparece solo si hay actividad en él
  const tiempoDe = (a) => new Date(a.fecha_orden).getTime()
  const filtrosActividad = {
    hoy: (a) => { const t = tiempoDe(a); return !isNaN(t) && new Date(t).toDateString() === new Date(ahora).toDateString() },
    semana: (a) => { const t = tiempoDe(a); return !isNaN(t) && t <= ahora && ahora - t <= 7 * DIA_MS },
    mes: (a) => { const t = tiempoDe(a); return !isNaN(t) && t <= ahora && ahora - t <= 30 * DIA_MS },
  }
  // Etiqueta del centro de cada fila: "Hoy", "Semana pasada" o "Mes pasado"
  const fechaDeActividad = (f) => { const d = new Date(f); return isNaN(d.getTime()) ? "-" : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}` }
  // Texto de cada actividad, más claro: "Reservó: Miércoles" pasa a "Reservó clase miércoles"
  const textoAccion = (accion = "") => {
    const m = String(accion).match(/^Reservó:\s*(.+)$/i)
    if (m) return `Reservó clase ${m[1].charAt(0).toLowerCase()}${m[1].slice(1)}`
    return accion
  }

  // Grupos de actividad por período, en orden: hoy, semana pasada, mes pasado y el resto
  const grupoDe = (a) => (filtrosActividad.hoy(a) ? "hoy" : filtrosActividad.semana(a) ? "semana" : filtrosActividad.mes(a) ? "mes" : "antes")
  const ROTULO_GRUPO = { hoy: "Hoy", semana: "Semana pasada", mes: "Mes pasado", antes: "Anteriores" }
  const actividadFiltrada = recentActivity.filter((a) => filtroActividad === "todo" || String(a.action || "").toLowerCase().includes(filtroActividad === "pagos" ? "pago" : "reserv"))
  const grupos = ["hoy", "semana", "mes", "antes"]
    .map((k) => ({ k, label: ROTULO_GRUPO[k], items: actividadFiltrada.filter((a) => grupoDe(a) === k) }))
    .filter((g) => g.items.length > 0)

  // Contenido de las tres listas: en el celular van en pestañas y en la computadora, en tarjetas
  const listaActividad = (
    <>{loading ? (
      <Cargando filas={2} className="py-2" />
    ) : actividadFiltrada.length === 0 ? (
      <p className="text-sm text-foreground/40 text-center py-8">Sin actividad reciente.</p>
    ) : (
      <div className="pt-2">
        {grupos.map((g) => (
          <div key={g.k}>
            <div className="relative border-t border-border">
              <span className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-card px-2 text-[0.5625rem] font-bold uppercase tracking-wider text-foreground/50">{g.label}</span>
            </div>
            <div className="divide-y divide-border">
              {g.items.map((activity, index) => {
                const { hora } = formatearActividad(activity.fecha_orden)
                return (
                  <div key={index} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 hover:bg-foreground/[0.02] transition-colors">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-lime-400/10 flex items-center justify-center">
                        {actividadIcon(activity.action)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">{activity.user}</p>
                        <p className="text-xs leading-snug text-foreground/60">{textoAccion(activity.action)}</p>
                      </div>
                    </div>
                    <div className="flex h-7 flex-col justify-center justify-self-end text-right">
                      <p className="text-[0.6875rem] text-foreground/40 whitespace-nowrap">{fechaDeActividad(activity.fecha_orden)}</p>
                      {hora && <p className="text-[0.6875rem] text-foreground/30">{hora} hs</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )}</>
  )

  const listaSinPago = (
      <>{loading ? (
        <p className="text-sm text-foreground/40 text-center py-8">Buscando...</p>
      ) : suspendedUsers.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-lime-700 dark:text-lime-400 font-semibold">¡Todo en orden!</p>
          <p className="text-xs text-foreground/40 mt-1">No hay usuarios suspendidos.</p>
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
                  <p className="text-[0.6875rem] text-foreground/40 mt-0.5 truncate">{user.email || "sin correo"}</p>
                </div>
                <span className={`text-[0.625rem] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md shrink-0 ${colorDias(user.daysOverdue)}`}>
                  {user.daysOverdue <= 0 ? "Sin créditos" : `${user.daysOverdue} días`}
                </span>
              </div>
            )
          })}
        </div>
      )}</>
  )

  const listaClases = (
    <>{loading ? (
      <Cargando filas={2} className="py-2" />
    ) : clasesHoy.length === 0 ? (
      <div className="px-5 py-8 text-center">
        <Dumbbell className="h-8 w-8 text-foreground/15 mx-auto mb-2" />
        <p className="text-sm text-foreground/40">No hay clases programadas para hoy.</p>
      </div>
    ) : (
      <div className="divide-y divide-border">
        {clasesHoy.map((cls, index) => {
          const lleno = cls.spots && cls.spots.includes('/') && cls.spots.split('/')[0] === cls.spots.split('/')[1]
          return (
            <div key={index} className="flex items-center justify-between px-5 py-3 hover:bg-foreground/[0.02] transition-colors gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-black text-foreground/50 w-12 shrink-0">{cls.time}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{cls.name}</p>
                  <p className="text-[0.6875rem] text-foreground/40 truncate">{cls.coach}</p>
                </div>
              </div>
              <span className={`text-[0.625rem] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md shrink-0 ${lleno ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" : "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/20"}`}>
                {cls.spots || "0/0"}
              </span>
            </div>
          )
        })}
      </div>
    )}</>
  )

  if (!puedeVer) return null

  const PESTANAS = [
    { id: "actividad", label: "Actividad reciente" },
    { id: "sinPago", label: "Sin pago", cantidad: suspendedUsers.length },
    { id: "clases", label: "Clases de hoy" },
  ]

  // Saludo: primer nombre de quien inició sesión y una frase que cambia cada día
  const primerNombre = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("usuario") || "null")
      return String(u?.nombrecompleto || u?.nombre || u?.username || "").trim().split(/\s+/)[0] || ""
    } catch {
      return ""
    }
  })()
  const ACCESOS = [
    { label: "Cargar abono", href: "/admin/usuarios", permiso: "usuarios:consulta", principal: true },
    { label: "Nuevo usuario", href: "/admin/usuarios/nuevo", permiso: "usuarios:consulta" },
    { label: "Crear clase", href: "/admin/clases/nueva", permiso: "clases:consulta" },
    { label: "Abrir check-in", href: "/admin/check-in", permiso: "configuracion:consulta" },
  ]
  const accesosVisibles = ACCESOS.filter((a) => permisos.includes(a.permiso))

  return (
    <div className="space-y-6">
      <div>
        <TituloPagina descripcion={"Panel de administración - Bravos Gym"}>Resumen</TituloPagina>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card px-5 py-5 md:px-7 md:py-6">
          <p className="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-lime-700 dark:text-lime-400">{FECHA_LARGA}</p>
          <h2 className="mt-2 text-4xl font-black uppercase leading-[0.95] tracking-tight text-foreground md:text-5xl">
            {primerNombre ? `Hola, ${primerNombre}` : "Bienvenido"}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/65 md:text-base">{FRASE_DEL_DIA}</p>
        </div>
      </div>

      {/* Accesos rápidos (computadora) */}
      {accesosVisibles.length > 0 && (
        <div role="group" aria-label="Accesos rápidos" className="hidden flex-wrap gap-2.5 lg:flex">
          {accesosVisibles.map((a) => (
            <Link
              key={a.href}
              to={a.href}
              className={`flex h-11 items-center gap-2 rounded-[10px] px-4 text-[13px] font-bold tracking-wide no-underline transition-colors ${
                a.principal ? "bg-lime-400 text-black hover:bg-lime-300" : "border border-border text-foreground hover:border-lime-500"
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
        {statsLayout.map((stat) => {
          const s = statStyle[stat.type]
          return (
            <div key={stat.title} className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card px-5 py-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-[.1em] text-muted-foreground leading-tight">{stat.title}</p>
                <span className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] ${s.badgeBg}`}>
                  <stat.icon className={`h-[17px] w-[17px] ${s.icon}`} aria-hidden="true" />
                </span>
              </div>
              <p className="text-[44px] font-black leading-none text-foreground" style={{ fontFamily: "'Big Shoulders Stencil Display', Archivo, sans-serif" }}>{stat.value}</p>
              <p className={`text-[13px] font-semibold ${s.sub}`}>{stat.sub}</p>
            </div>
          )
        })}
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
            {pestana === "sinPago" && !loading && suspendedUsers.length > 0 && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[0.625rem] font-black uppercase tracking-wider text-white">
                {suspendedUsers.length} {suspendedUsers.length === 1 ? "usuario" : "usuarios"}
              </span>
            )}
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {pestana === "sinPago" ? listaSinPago : pestana === "clases" ? listaClases : listaActividad}
          </div>
        </div>
      </div>

      {/* COMPUTADORA: actividad con filtros a la izquierda; clases de hoy, pendientes y sin pago a la derecha */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start lg:gap-6">
        <section aria-labelledby="t-act-d" className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4">
            <h2 id="t-act-d" className="flex-1 text-[17px] font-extrabold text-foreground">Actividad reciente</h2>
            <div role="group" aria-label="Filtrar actividad" className="flex gap-1.5">
              {[["todo", "Todo"], ["pagos", "Pagos"], ["reservas", "Reservas"]].map(([id, label]) => {
                const activo = filtroActividad === id
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setFiltroActividad(id)}
                    className={`h-9 rounded-full border px-3.5 text-[13px] font-bold transition-colors ${
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
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="t-clases-d" className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 id="t-clases-d" className="whitespace-nowrap text-[17px] font-extrabold text-foreground">Clases de hoy</h2>
              {permisos.includes("clases:consulta") && (
                <Link to="/admin/clases" className="whitespace-nowrap text-[13px] font-bold text-foreground no-underline hover:text-lime-600 dark:hover:text-lime-400">Ver clases</Link>
              )}
            </div>
            {!loading && clasesHoy.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <span className="grid h-[52px] w-[52px] place-items-center rounded-[14px] bg-lime-400/10 text-lime-700 dark:text-lime-400">
                  <Calendar className="h-6 w-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-base font-bold text-foreground">No hay clases para hoy</p>
                  <p className="mt-1 text-sm text-muted-foreground">Los alumnos no pueden reservar hasta que crees una.</p>
                </div>
                {permisos.includes("clases:consulta") && (
                  <Link to="/admin/clases/nueva" className="flex h-11 items-center gap-2 rounded-[10px] border border-lime-600/40 bg-lime-400/10 px-4 text-[13px] font-extrabold tracking-wide text-lime-700 no-underline hover:border-lime-500 dark:text-lime-400">
                    <Plus className="h-4 w-4" aria-hidden="true" /> CREAR CLASE
                  </Link>
                )}
              </div>
            ) : listaClases}
          </section>

          <section aria-labelledby="t-atencion" className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 id="t-atencion" className="text-[17px] font-extrabold text-foreground">Requiere atención</h2>
            </div>
            <ul className="m-0 list-none p-0">
              {[
                { t: "Usuarios sin pago", n: loading ? null : suspendedUsers.length },
                { t: "Membresías por vencer", n: loading ? null : Number(tarjetas.membresiasPorVencer) || 0 },
              ].map((fila, i) => (
                <li key={fila.t} className={`flex min-h-[58px] items-center gap-3 px-5 ${i ? "border-t border-border" : ""}`}>
                  <span className="flex-1 text-sm font-semibold text-foreground">{fila.t}</span>
                  <span className={`min-w-[30px] rounded-full border px-2.5 py-0.5 text-center text-[13px] font-extrabold ${fila.n > 0 ? "border-yellow-500/30 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400" : "border-border bg-muted text-muted-foreground"}`}>
                    {fila.n === null ? "…" : fila.n}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="t-sinpago-d" className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="t-sinpago-d" className="text-[17px] font-extrabold text-foreground">Sin pago</h2>
              {!loading && (
                <span className="rounded-md border border-yellow-400/20 bg-yellow-400/10 px-2 py-0.5 text-[0.625rem] font-black uppercase tracking-widest text-yellow-700 dark:text-yellow-400">
                  {suspendedUsers.length} {suspendedUsers.length === 1 ? "usuario" : "usuarios"}
                </span>
              )}
            </div>
            {listaSinPago}
          </section>
        </div>
      </div>
    </div>
  )
}
