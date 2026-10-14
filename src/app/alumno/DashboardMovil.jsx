import { useState } from "react"
import { Link } from "react-router-dom"
import { Calendar, Calculator, Dumbbell, ChevronRight, CreditCard, Plus, Flame, HelpCircle, Trophy, TrendingUp, Users } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fmtFechaPlan } from "@/lib/miPlan"
import MisRutinasModal from "./MisRutinasModal"
import { Cargando } from '@/components/Cargando'

/*
 * Inicio del alumno en el celular (debajo de lg). La versión de escritorio sigue en
 * AlumnoDashboard.jsx: los datos se calculan allá una sola vez y llegan por props.
 */

const ESTADOS = {
  activa:     { label: "Activa",     cls: "bg-lime-400/10 border-lime-400/30 text-lime-700 dark:text-lime-400", dot: "bg-lime-500 dark:bg-lime-400" },
  por_vencer: { label: "Por vencer", cls: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400", dot: "bg-yellow-500" },
  vencida:    { label: "Vencida",    cls: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400", dot: "bg-red-500" },
}

// Signo de ayuda que se abre al tocarlo (el tooltip de escritorio necesita pasar el mouse)
const Ayuda = ({ texto, className = "" }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label="Ayuda"
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-foreground/40 transition-colors active:text-lime-600 ${className}`}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
    </PopoverTrigger>
    <PopoverContent side="top" className="w-64 border border-border bg-card p-3 text-sm leading-relaxed text-card-foreground">
      {texto}
    </PopoverContent>
  </Popover>
)

const Seccion = ({ titulo, extra, children }) => (
  <section className="space-y-2.5">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-xs font-black uppercase tracking-widest text-foreground/60">{titulo}</h2>
      {extra}
    </div>
    {children}
  </section>
)

const VerTodas = ({ to }) => (
  <Link to={to} className="flex items-center text-xs font-bold text-lime-700 dark:text-lime-400">
    Ver todas <ChevronRight className="h-3.5 w-3.5" />
  </Link>
)

export default function DashboardMovil({
  nombreUsuario, racha, creditos, cargando, agendadas, estadoMembresia, nombrePlanes, miPlan,
  logros, clasesHoy, cargandoClases, proximasReservadas, clasesSemanales, metaSemanal, clasesMes, diasEnMes, nombreMes, totalMarcas,
}) {
  const completados = logros.filter((l) => l.completado).length
  const meta = estadoMembresia ? ESTADOS[estadoMembresia] : null

  const [rutinasAbiertas, setRutinasAbiertas] = useState(false)

  const accesos = [
    { to: "/alumno/creditos", icon: CreditCard, titulo: "Mis Créditos", sub: cargando ? "…" : `${creditos} disponibles` },
    // Abre el modal con las rutinas de las clases reservadas (no navega)
    { onClick: () => setRutinasAbiertas(true), icon: Dumbbell, titulo: "Mis Rutinas", sub: `${agendadas} ${agendadas === 1 ? "clase reservada" : "clases reservadas"}` },
    { to: "/alumno/calculadora-rm", icon: Calculator, titulo: "Calculadora RM", sub: "Calculá tu 1RM" },
    { to: "/alumno/marcas", icon: Trophy, titulo: "Mis Marcas", sub: `${totalMarcas} ${totalMarcas === 1 ? "registrada" : "registradas"}` },
  ]

  return (
    <div className="space-y-6">
      {/* Saludo y acción principal */}
      <div data-guia="res-hero" className="rounded-2xl border border-sidebar-border bg-sidebar p-5">
        <div className="flex items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-lime-400/30 bg-lime-400/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">
            <Flame className="h-3 w-3" />
            {racha === 0 ? "Sin racha" : `${racha} ${racha === 1 ? "día" : "días"} de racha`}
          </span>
          <Ayuda texto="Tu racha son los días seguidos que asististe al gimnasio." className="text-sidebar-foreground/40" />
        </div>
        <h1 className="mt-3 text-2xl font-black uppercase leading-tight tracking-tight text-sidebar-foreground text-balance">
          ¡Vamos, {nombreUsuario}!
        </h1>
        <p className="mt-1 text-sm text-sidebar-foreground/60">Cada entrenamiento es una oportunidad para ser mejor</p>
        <Link
          to="/alumno/reservar"
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wider text-black transition-colors active:bg-lime-300"
        >
          <Calendar className="h-5 w-5" /> Reservar clase
        </Link>
      </div>

      {/* Números rápidos */}
      <div data-guia="res-numeros" className="grid grid-cols-2 gap-3">
        <div className="relative rounded-xl border border-border bg-card p-4">
          <Ayuda texto="Créditos disponibles para reservar clases. Cada clase usa uno." className="absolute right-1.5 top-1.5" />
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Créditos</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-black tabular-nums text-lime-700 dark:text-lime-400">{cargando ? "…" : creditos}</span>
            <span className="text-xs font-bold text-foreground/50">disp.</span>
          </p>
        </div>
        <div className="relative rounded-xl border border-border bg-card p-4">
          <Ayuda texto="Clases que reservaste y todavía no se dieron." className="absolute right-1.5 top-1.5" />
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Clases</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="text-3xl font-black tabular-nums text-lime-700 dark:text-lime-400">{cargando ? "…" : agendadas}</span>
            <span className="text-xs font-bold text-foreground/50">{agendadas === 1 ? "agendada" : "agendadas"}</span>
          </p>
        </div>
      </div>

      {/* Membresía */}
      {meta && (
          <div data-guia="res-membresia" className="space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-foreground/60">Mi membresía</h2>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${meta.cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            {nombrePlanes ? (
              <div>
                <p className="truncate text-lg font-black uppercase tracking-tight text-foreground">{nombrePlanes}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-foreground/60">
                  <Calendar className="h-3.5 w-3.5" /> Vence el {fmtFechaPlan(miPlan.proximoVencimiento)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-black uppercase tracking-tight text-foreground">Sin membresía vigente</p>
                <p className="mt-0.5 text-xs text-foreground/60">
                  {miPlan?.ultimoPlan ? `Tu última membresía fue ${miPlan.ultimoPlan.nombrePlan}` : "Contratá una membresía para reservar clases"}
                </p>
              </div>
            )}
            <Link
              to="/alumno/plan"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-lime-600/60 text-xs font-black uppercase tracking-wider text-lime-700 transition-colors active:bg-lime-400/10 dark:border-lime-400/60 dark:text-lime-400"
            >
              {/* Mismo criterio que la pantalla de membresía: se renueva desde el día 1 del mes en que vence o si ya venció;
                  con la membresía activa, lo que se ofrece es contratar otra */}
              {estadoMembresia === "activa"
                ? <><Plus className="h-4 w-4" /> Contratar otra membresía</>
                : <><CreditCard className="h-4 w-4" /> Renovar membresía</>}
            </Link>
          </div>
      )}

      {/* Logros: al tocar uno se abre un globito con su información */}
      <Seccion
        titulo="Tus logros"
        extra={<span className="text-xs font-bold text-lime-700 dark:text-lime-400">{completados} de {logros.length} completados</span>}
      >
        <div data-guia="res-logros" className="grid grid-cols-6 gap-2">
          {logros.map((l) => (
            <Popover key={l.codigo}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={l.nombre}
                  className={`flex aspect-square items-center justify-center rounded-xl border transition-colors data-[state=open]:ring-2 data-[state=open]:ring-lime-500 ${
                    l.completado
                      ? "border-lime-400/30 bg-lime-400/15 text-lime-700 dark:text-lime-400"
                      : "border-border bg-card text-foreground/30"
                  }`}
                >
                  <l.icono className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" className="w-60 border border-border bg-card p-3 text-card-foreground">
                <p className="text-xs font-black uppercase tracking-wide text-foreground">{l.nombre}</p>
                <p className="mt-0.5 text-sm text-foreground/70">{l.descripcion}</p>
                <p className={`mt-1.5 text-[10px] font-black uppercase tracking-widest ${l.completado ? "text-lime-700 dark:text-lime-400" : "text-foreground/40"}`}>
                  {l.completado ? "✓ Desbloqueado" : "Bloqueado"}
                </p>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </Seccion>

      {/* Accesos rápidos */}
      <Seccion titulo="Accesos rápidos">
        <div data-guia="res-accesos" className="grid grid-cols-2 gap-3">
          {accesos.map((a) => {
            const contenido = (
              <>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-400/15 text-lime-700 dark:text-lime-400">
                  <a.icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="mt-3 text-sm font-bold text-foreground">{a.titulo}</span>
                <span className="mt-0.5 text-xs text-foreground/60">{a.sub}</span>
              </>
            )
            const cls = "flex flex-col items-center rounded-xl border border-border bg-card px-3 py-5 text-center active:border-lime-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
            return a.to ? (
              <Link key={a.titulo} to={a.to} className={cls}>{contenido}</Link>
            ) : (
              <button key={a.titulo} type="button" onClick={a.onClick} aria-haspopup="dialog" className={cls}>{contenido}</button>
            )
          })}
        </div>
      </Seccion>
      <MisRutinasModal open={rutinasAbiertas} onOpenChange={setRutinasAbiertas} />

      {/* Clases de hoy */}
      <Seccion titulo="Clases de hoy" extra={<VerTodas to="/alumno/reservar" />}>
        <div className="rounded-xl border border-border bg-card">
          {cargandoClases ? (
            <Cargando filas={2} className="py-2" />
          ) : clasesHoy.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-foreground/50">No hay más clases programadas para hoy.</p>
          ) : (
            <ul className="divide-y divide-border">
              {clasesHoy.map((c) => {
                const cupo = c.cupoDisponible ?? c.cupos ?? 0
                return (
                  <li key={c.idHorario || c.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="w-12 shrink-0 text-lg font-black tabular-nums text-foreground">{(c.horaInicio || "00:00").slice(0, 5)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-foreground">{c.nombreClase || c.nombre}</p>
                      <p className="truncate text-xs text-foreground/50">
                        {c.nombreProfesor || "Staff Bravos"} · <span className={cupo <= 3 ? "text-red-700 dark:text-red-400" : ""}>{cupo} lugares</span>
                      </p>
                    </div>
                    <Link to="/alumno/reservar" className="shrink-0 rounded-lg bg-lime-400 px-3 py-2 text-xs font-black uppercase text-black">
                      Reservar
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Seccion>

      {/* Próximas reservas */}
      <Seccion titulo="Mis reservas" extra={<VerTodas to="/alumno/reservas" />}>
        <div className="rounded-xl border border-border bg-card">
          {cargando ? (
            <Cargando filas={2} className="py-2" />
          ) : proximasReservadas.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-6 text-center">
              <Users className="h-8 w-8 text-foreground/30" />
              <p className="mt-2 text-sm text-foreground/50">No tenés reservas próximas</p>
              <Link to="/alumno/reservar" className="mt-3 rounded-lg border border-lime-600/60 px-4 py-2 text-xs font-black uppercase tracking-wider text-lime-700 dark:border-lime-400/60 dark:text-lime-400">
                Reservar ahora
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {proximasReservadas.slice(0, 3).map((r) => (
                <li key={r.idReserva} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-lime-400/15 text-sm font-black tabular-nums text-lime-700 dark:text-lime-400">
                    {(r.horaInicio || "00").slice(0, 2)}h
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-foreground">{r.nombreClase || r.clase}</p>
                    <p className="text-xs text-foreground/50">
                      {r.fechaReserva ? fmtFechaPlan(String(r.fechaReserva).slice(0, 10)) : "Hoy"} · {(r.horaInicio || "00:00").slice(0, 5)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Seccion>

      {/* Progreso semanal y mensual (mismo cálculo que la versión de escritorio) */}
      <div data-guia="res-progreso" className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400/15 text-lime-700 dark:text-lime-400">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-widest text-foreground">Progreso semanal</p>
            <p className="text-xs text-foreground/50">Clases completadas esta semana</p>
          </div>
          <span className="text-2xl font-black tabular-nums text-lime-700 dark:text-lime-400">{clasesSemanales}/{metaSemanal}</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
          <div className="h-full rounded-full bg-lime-500 transition-all dark:bg-lime-400" style={{ width: `${Math.min((clasesSemanales / metaSemanal) * 100, 100)}%` }} />
        </div>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400/15 text-lime-700 dark:text-lime-400">
              <Calendar className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black uppercase tracking-widest text-foreground">Progreso mensual</p>
              <p className="text-xs text-foreground/50">{clasesMes} {clasesMes === 1 ? "clase" : "clases"} en {nombreMes}</p>
            </div>
            <span className="text-2xl font-black tabular-nums text-lime-700 dark:text-lime-400">{Math.round((clasesMes / diasEnMes) * 100)}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-lime-500 transition-all dark:bg-lime-400" style={{ width: `${Math.min((clasesMes / diasEnMes) * 100, 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
