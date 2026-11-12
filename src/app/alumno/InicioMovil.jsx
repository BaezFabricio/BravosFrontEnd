import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import apiClient from "@/api"
import { Esqueleto, Progreso } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { BottomSheet } from "@/components/bx/BottomSheet"
import { IC } from "@/components/bx/trazos"
import NovedadesPortada from "@/components/NovedadesPortada"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fmtFechaPlan } from "@/lib/miPlan"
import { formatearValor } from "@/lib/ranking"
import { horaCorta, hoyTexto, soloFecha } from "@/lib/fechasBx"
import MisRutinasModal from "./MisRutinasModal"

/*
 * Inicio del alumno en el celular (handoff móvil "01 Inicio"). Se adapta a cualquier tamaño de celular: columnas fluidas, saludo que
 * se achica si el nombre no entra y zonas seguras. Los datos se calculan en AlumnoDashboard y llegan por props.
 * El header fijo y el menú de abajo están en layout.jsx (components/bx/MarcoMovil.jsx).
 */

const ESTADOS = {
  activa: { etiqueta: "ACTIVA", chip: "border-[#3d5a10] bg-[#16220a] text-bx-lima", punto: "bg-bx-lima" },
  por_vencer: { etiqueta: "POR VENCER", chip: "border-[#5a4a12] bg-[#2a230a] text-[#e6c200]", punto: "bg-[#e6c200]" },
  vencida: { etiqueta: "VENCIDA", chip: "border-[#6b2a24] bg-[#2a1210] text-[#ffb4aa]", punto: "bg-[#ffb4aa]" },
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

function Titulo({ id, children, enlace }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 id={id} className="m-0 text-[1.0625rem] font-bold text-bx-ink">{children}</h2>
      {enlace}
    </div>
  )
}

function VerTodas({ to }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1 whitespace-nowrap text-[0.8125rem] font-bold text-bx-ok-fg">
      Ver todas<Ico d={IC.chevRight} size={14} sw={2.4} />
    </Link>
  )
}

// Fila del ranking del box: el puesto del alumno en el ejercicio con más participantes (si todavía no hay marcas, no se muestra)
function RankingFila() {
  const [datos, setDatos] = useState(null)
  useEffect(() => {
    let vigente = true
    apiClient.get("/marcas/ranking").then((r) => { if (vigente) setDatos(r.data?.data || r.data) }).catch(() => {})
    return () => { vigente = false }
  }, [])
  if (!datos?.ejercicio || !datos.ranking?.length) return null
  const fila = datos.ranking.find((f) => f.esMio) || datos.ranking[0]
  const medalla = { 1: "bg-[#f3d56b] text-[#4a3a00]", 2: "bg-[#d5d9e0] text-[#3a3f48]", 3: "bg-[#d9a066] text-[#4a2a00]" }[fila.posicion] || "bg-bx-track text-bx-ink"
  return (
    <Link
      to="/alumno/marcas?vista=ranking"
      aria-label={`Ranking del box, ${datos.ejercicio.nombre}: ${fila.esMio ? "estás" : "primero"} ${fila.posicion}º con ${formatearValor(datos.ejercicio.tipoMarca, fila.valor)}`}
      className="flex min-h-[4.5rem] items-center gap-3.5 rounded-2xl border border-bx-line bg-bx-card p-3.5 text-bx-ink transition-[border-color,transform] duration-200 active:scale-[0.98]"
    >
      <span className={`bx-num grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg ${medalla}`}>{fila.posicion}º</span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold tracking-[0.1em] text-bx-muted">RANKING DEL BOX</span>
        <span className="block truncate text-[0.9375rem] font-bold">
          {datos.ejercicio.nombre} · {fila.nombre}
          {fila.esMio && <span className="ml-1.5 text-[0.6875rem] font-extrabold text-bx-ok-fg">VOS</span>}
        </span>
      </span>
      <span className="bx-num shrink-0 text-[1.375rem] leading-none">{formatearValor(datos.ejercicio.tipoMarca, fila.valor)}</span>
    </Link>
  )
}

function DetalleLogro({ logro }) {
  const Icono = logro.icono
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className={`grid h-12 w-12 place-items-center rounded-xl border ${logro.completado ? "border-bx-ok-line bg-bx-ok-bg text-bx-ok-fg" : "border-bx-line2 bg-bx-surf text-bx-muted"}`}><Icono className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" /></span>
        <span className={`text-sm font-bold ${logro.completado ? "text-bx-ok-fg" : "text-bx-muted"}`}>{logro.completado ? "✓ Desbloqueado" : "Bloqueado"}</span>
      </div>
      <p className="m-0 text-[0.9375rem] leading-normal"><strong>Cómo se consigue:</strong> {logro.descripcion}</p>
    </div>
  )
}

export default function InicioMovil({
  nombreUsuario, frase, racha, creditos, cargando, agendadas, estadoMembresia, nombrePlanes, miPlan,
  logros, clasesHoy, cargandoClases, proximasReservadas, clasesSemanales, metaSemanal, clasesMes, diasEnMes, nombreMes, totalMarcas,
}) {
  const [rutinasAbiertas, setRutinasAbiertas] = useState(false)
  const [logroAbierto, setLogroAbierto] = useState(null) // logro del que se muestra el detalle
  const nombreRef = useRef(null)

  // El nombre va en una sola línea: si no entra en el ancho del celular, se achica hasta que entre
  useEffect(() => {
    const el = nombreRef.current
    if (!el) return undefined
    const ajustar = () => {
      el.style.fontSize = ""
      let px = parseFloat(getComputedStyle(el).fontSize)
      while (el.scrollWidth > el.parentElement.clientWidth && px > 20) { px -= 1; el.style.fontSize = `${px}px` }
    }
    ajustar()
    window.addEventListener("resize", ajustar)
    return () => window.removeEventListener("resize", ajustar)
  }, [nombreUsuario])

  const completados = logros.filter((l) => l.completado).length
  const vigente = !!miPlan?.vigente
  const estado = estadoMembresia ? ESTADOS[estadoMembresia] : null
  const porVencer = estadoMembresia === "por_vencer"
  const dias = vigente ? Math.min(...miPlan.planes.map((p) => p.diasRestantes)) : null
  const disponibles = vigente ? miPlan.totalDisponibles : creditos
  const totalCreditos = vigente ? miPlan.totalCreditos : null
  const pctMes = diasEnMes ? Math.round((clasesMes / diasEnMes) * 100) : 0

  const hoy = hoyTexto()
  const reservadasHoy = new Set(proximasReservadas.filter((r) => soloFecha(r.fechaReserva) === hoy).map((r) => r.idHorario))

  const accesos = [
    { to: "/alumno/creditos", d: IC.card, titulo: "Mis créditos", sub: cargando ? "…" : `${disponibles} ${disponibles === 1 ? "disponible" : "disponibles"}` },
    // Abre el modal con las rutinas de las clases reservadas (no navega)
    { onClick: () => setRutinasAbiertas(true), d: IC.dumb, titulo: "Mis rutinas", sub: plural(agendadas, "clase reservada", "clases reservadas") },
    { to: "/alumno/calculadora-rm", d: IC.calc, titulo: "Calculadora RM", sub: "Calculá tu 1RM" },
    { to: "/alumno/marcas", d: IC.trophy, titulo: "Mis RM", sub: plural(totalMarcas, "registrada", "registradas") },
  ]
  const claseAcceso = "flex flex-col gap-2.5 rounded-2xl border border-bx-line bg-bx-card p-3.5 text-left text-bx-ink transition-[border-color,transform] duration-200 active:scale-[0.97]"

  return (
    <div className="bx bx-entrada flex flex-col gap-[1.375rem]">
      {/* Bienvenida */}
      <section data-guia="res-hero" aria-labelledby="hola" className="relative flex flex-col gap-3 overflow-hidden rounded-[1.25rem] border border-bx-hero-line bg-bx-hero p-5 text-[#ecefe4]">
        <img src="/bravos-logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/4 top-[55%] h-[10.5rem] w-[32.5rem] max-w-none -translate-y-1/2 -rotate-6 opacity-[0.07] [filter:grayscale(1)_brightness(1.4)]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_100%_0%,rgba(155,230,0,0.10),rgba(155,230,0,0)_60%)]" />

        <div className="relative flex items-center gap-0.5">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#3d5a10] bg-[#16220a] px-2.5 text-xs font-bold text-bx-lima">
            <Ico d={IC.flame} size={14} sw={2} />
            {racha === 0 ? "Sin racha" : `${racha} ${racha === 1 ? "día" : "días"} de racha`}
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" aria-label="¿Qué es la racha?" className="grid h-11 w-11 place-items-center text-[#a3a698] active:text-white"><Ico d={IC.help} size={18} /></button>
            </PopoverTrigger>
            <PopoverContent side="bottom" className="w-60 border border-border bg-card p-3 text-sm leading-relaxed text-card-foreground">Días seguidos en los que entrenaste.</PopoverContent>
          </Popover>
        </div>

        <h1 id="hola" className="bx-num relative m-0 overflow-hidden text-[clamp(1.75rem,9.5vw,2.375rem)] uppercase leading-[1.02] tracking-[0.01em]">
          ¡Hola,<br /><span ref={nombreRef} className="block whitespace-nowrap">{nombreUsuario}!</span>
        </h1>
        <p className="relative m-0 text-[0.9375rem] leading-[1.45] text-[#b9bcae]">{frase}</p>

        {/* Franja Mi membresía: toda es un link a Mi membresía */}
        <Link
          to="/alumno/plan"
          data-guia="res-membresia"
          aria-label={vigente
            ? `Mi membresía: ${nombrePlanes}, ${estado?.etiqueta.toLowerCase()}, vence el ${fmtFechaPlan(miPlan.proximoVencimiento)}, ${plural(dias, "día", "días")}, ${disponibles} de ${totalCreditos} créditos`
            : "Mi membresía: sin membresía vigente. Tocá para ver los planes"}
          className="relative mt-1.5 flex flex-col gap-2.5 rounded-[0.875rem] border border-[#2a2a2a] bg-white/[0.04] p-3.5 text-[#ecefe4] transition-[border-color,transform] duration-200 active:scale-[0.98] active:border-[#3d5a10]"
        >
          <span className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-[0.1em] text-[#a3a698]">MI MEMBRESÍA</span>
            {estado && (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[0.1875rem] text-[0.6875rem] font-extrabold ${estado.chip}`}>
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />{estado.etiqueta}
              </span>
            )}
          </span>
          {cargando && !miPlan ? (
            <Esqueleto alto={64} className="!bg-[#1f1f1f]" etiqueta="Cargando membresía" />
          ) : vigente ? (
            <>
              <span className="flex items-end justify-between gap-3">
                <span className="block min-w-0 flex-1">
                  <span className="block truncate text-[1.0625rem] font-extrabold leading-tight">{nombrePlanes}</span>
                  <span className="mt-0.5 block text-[0.8125rem] text-[#a3a698]">Vence el {fmtFechaPlan(miPlan.proximoVencimiento)}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className={`bx-num block text-[1.875rem] leading-none ${porVencer ? "text-[#e6c200]" : "text-bx-lima"}`}>{dias}</span>
                  <span className="block text-[0.6875rem] font-medium text-[#a3a698]">{dias === 1 ? "día" : "días"}</span>
                </span>
              </span>
              <span className="h-px bg-[#2a2a2a]" />
              <span className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.8125rem] font-semibold text-[#a3a698]">Créditos</span>
                  <span>
                    <span className={`bx-num text-[1.375rem] leading-none ${porVencer ? "text-[#e6c200]" : "text-bx-lima"}`}>{disponibles}</span>
                    <span className="text-[0.8125rem] font-semibold text-[#a3a698]"> de {totalCreditos}</span>
                  </span>
                </span>
                <Progreso valor={disponibles} max={totalCreditos || 1} etiqueta="Créditos disponibles" alto={6} color={porVencer ? "bg-[#e6c200]" : "bg-bx-lima"} className="!bg-[#2a2a2a]" />
              </span>
            </>
          ) : (
            <span className="block">
              <span className="block text-[1.0625rem] font-extrabold leading-tight">Sin membresía vigente</span>
              <span className="mt-0.5 block text-[0.8125rem] text-[#a3a698]">{miPlan?.ultimoPlan ? `Tu última membresía fue ${miPlan.ultimoPlan.nombrePlan}. Tocá para renovar.` : "Contratá una membresía para reservar clases."}</span>
            </span>
          )}
        </Link>
      </section>

      {/* Accesos rápidos */}
      <section aria-labelledby="t-acc" className="flex flex-col gap-2.5">
        <Titulo id="t-acc">Accesos rápidos</Titulo>
        <div data-guia="res-accesos" className="grid grid-cols-2 gap-2.5">
          {accesos.map((a) => {
            const contenido = (
              <>
                <span className="grid h-10 w-10 place-items-center rounded-[0.625rem] bg-bx-tile text-bx-ok-fg"><Ico d={a.d} /></span>
                <span>
                  <span className="block text-[0.9375rem] font-bold">{a.titulo}</span>
                  <span className="mt-0.5 block text-xs text-bx-muted">{a.sub}</span>
                </span>
              </>
            )
            return a.to
              ? <Link key={a.titulo} to={a.to} className={claseAcceso}>{contenido}</Link>
              : <button key={a.titulo} type="button" onClick={a.onClick} aria-haspopup="dialog" className={claseAcceso}>{contenido}</button>
          })}
        </div>
      </section>
      <MisRutinasModal open={rutinasAbiertas} onOpenChange={setRutinasAbiertas} />

      {/* Detalle de un logro: qué pide y si ya lo tenés */}
      <BottomSheet abierto={!!logroAbierto} onCerrar={() => setLogroAbierto(null)} titulo={logroAbierto?.nombre || "Logro"} descripcion={logroAbierto ? (logroAbierto.completado ? "Desbloqueado" : "Todavía bloqueado") : ""}>
        {logroAbierto && <DetalleLogro logro={logroAbierto} />}
      </BottomSheet>

      {/* Clases de hoy */}
      <section aria-labelledby="t-hoy" className="flex flex-col gap-2.5">
        <Titulo id="t-hoy" enlace={<VerTodas to="/alumno/reservar" />}>Clases de hoy</Titulo>
        {cargandoClases ? (
          <Esqueleto alto={76} className="rounded-[0.875rem]" etiqueta="Cargando clases" />
        ) : clasesHoy.length === 0 ? (
          <p className="m-0 rounded-[0.875rem] border border-dashed border-bx-btn-line p-4 text-sm text-bx-muted">No hay más clases programadas para hoy.</p>
        ) : (
          <ul className="bx-lista m-0 flex list-none flex-col gap-2 p-0">
            {clasesHoy.map((c) => {
              const hora = horaCorta(c.horaInicio)
              const libres = c.cupoDisponible ?? c.cupos
              const reservada = reservadasHoy.has(c.idHorario)
              // Si la clase ya empezó no se puede reservar: no se muestra el botón
              const [hh, mm] = String(c.horaInicio || "00:00").slice(0, 5).split(":").map(Number)
              const ahora = new Date()
              const yaEmpezo = (ahora.getHours() * 60 + ahora.getMinutes()) >= (hh * 60 + mm)
              return (
                <li key={c.idHorario || c.id} className={`flex items-center gap-3.5 rounded-[0.875rem] border p-3.5 ${reservada ? "border-bx-ok-line bg-bx-ok-bg" : "border-bx-line bg-bx-card"}`}>
                  <div className="bx-num min-w-[4.125rem] text-[2rem] leading-none">{hora}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.9375rem] font-bold">{c.nombreClase || c.nombre}</div>
                    <div className="truncate text-[0.8125rem] text-bx-muted">{c.nombreProfesor || "Staff Bravos"}{libres != null ? ` · ${plural(libres, "lugar", "lugares")}` : ""}</div>
                  </div>
                  {yaEmpezo && !reservada ? (
                    <span className="shrink-0 rounded-full border border-bx-line px-2.5 py-1.5 text-xs font-bold text-bx-muted">Terminada</span>
                  ) : reservada ? (
                    <span className="shrink-0 rounded-full border border-bx-ok-line bg-bx-card px-2.5 py-1.5 text-xs font-bold text-bx-ok-fg">Reservada</span>
                  ) : (
                    <Link to="/alumno/reservar" aria-label={`Reservar la clase de las ${hora}, usa 1 crédito`} className="grid h-11 shrink-0 place-items-center rounded-lg bg-bx-lima px-4 text-sm font-bold text-bx-negro transition-transform duration-200 active:scale-95">Reservar</Link>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <RankingFila />

      {/* Novedades (lista vertical) */}
      <NovedadesPortada compacta limite={3} variante="bxm" />

      {/* Progreso y logros */}
      <section data-guia="res-progreso" aria-labelledby="t-prog" className="flex flex-col gap-3.5 rounded-2xl border border-bx-line bg-bx-card p-4">
        <h2 id="t-prog" className="m-0 text-[1.0625rem] font-bold">Tu progreso</h2>
        {[
          { titulo: "Progreso semanal", sub: "Clases completadas esta semana", valor: `${clasesSemanales}/${metaSemanal}`, actual: clasesSemanales, max: metaSemanal },
          { titulo: "Progreso mensual", sub: `${plural(clasesMes, "clase", "clases")} en ${nombreMes}`, valor: `${pctMes}%`, actual: clasesMes, max: diasEnMes },
        ].map((p) => (
          <div key={p.titulo}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-bold">{p.titulo}</div>
                <div className="text-xs text-bx-muted">{p.sub}</div>
              </div>
              <span className="bx-num shrink-0 text-[1.875rem] leading-none text-bx-ok-fg">{p.valor}</span>
            </div>
            <Progreso valor={p.actual} max={p.max} etiqueta={p.titulo} alto={8} color="bg-bx-lima" />
          </div>
        ))}
        <div className="h-px bg-bx-line2" />
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-bold">Tus logros</span>
          <span className="text-xs font-bold text-bx-ok-fg">{completados} de {logros.length} completados</span>
        </div>
        <ul data-guia="res-logros" className="m-0 grid list-none grid-cols-3 gap-1.5 p-0 min-[360px]:grid-cols-6">
          {logros.map((l) => {
            const Icono = l.icono
            return (
              <li key={l.codigo}>
                <button
                  type="button"
                  aria-label={`${l.nombre}, ${l.completado ? "desbloqueado" : "bloqueado"}`}
                  aria-haspopup="dialog"
                  onClick={() => setLogroAbierto(l)}
                  className={`grid aspect-square min-h-11 w-full place-items-center rounded-[0.625rem] border transition-transform duration-200 active:scale-90 ${l.completado ? "border-bx-ok-line bg-bx-ok-bg text-bx-ok-fg" : "border-bx-line2 bg-bx-surf text-bx-muted"}`}
                >
                  <Icono className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.8} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
