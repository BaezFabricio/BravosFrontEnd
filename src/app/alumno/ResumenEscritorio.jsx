import { Link } from "react-router-dom"
import { Boton, DatoHero, EnlaceVer, ErrorBanner, Esqueleto, HeroCard, Pantalla, Progreso, Tarjeta, TituloTarjeta, Vacio } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import RankingResumen from "@/components/bx/RankingResumen"
import NovedadesPortada from "@/components/NovedadesPortada"
import { fmtFechaPlan } from "@/lib/miPlan"
import { diaDelMes, duracion, etiquetaClase, horaCorta, hoyTexto, mesAbreviado, soloFecha } from "@/lib/fechasBx"

/*
 * Resumen del alumno en escritorio (handoff, pantalla 01). Los datos los carga AlumnoDashboard.
 */

// Estado de la membresía dentro del hero (siempre oscuro, igual en los dos modos)
const ESTADOS_MEMBRESIA = {
  activa: { etiqueta: "ACTIVA", clases: "border-[#3d5a10] bg-[#16220a] text-bx-lima", punto: "bg-bx-lima" },
  por_vencer: { etiqueta: "POR VENCER", clases: "border-[#5a4a12] bg-[#2a230a] text-[#e6c200]", punto: "bg-[#e6c200]" },
  vencida: { etiqueta: "VENCIDA", clases: "border-[#6b2a24] bg-[#2a1210] text-[#ffb4aa]", punto: "bg-[#ffb4aa]" },
}

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

export default function ResumenEscritorio({
  nombreUsuario, frase, racha, creditos, totalClases, cargando, errorDatos, onReintentar,
  logros, estadoMembresia, nombrePlanes, miPlan, proximasReservadas,
  clasesHoy, cargandoClases, errorClases,
  clasesSemanales, metaSemanal, clasesMes, diasEnMes, nombreMes, totalMarcas,
}) {
  const desbloqueados = logros.filter((l) => l.completado).length
  const estado = estadoMembresia ? ESTADOS_MEMBRESIA[estadoMembresia] : null
  const hoy = hoyTexto()
  // Clases de hoy que el alumno ya reservó: se compara el horario y el día de la reserva
  const reservadasHoy = new Set(proximasReservadas.filter((r) => soloFecha(r.fechaReserva) === hoy).map((r) => r.idHorario))

  const accesos = [
    { to: "/alumno/reservar", titulo: "Reservar", sub: "Agendar clase", d: IC.cal },
    { to: "/alumno/reservas", titulo: "Mis clases", sub: proximasReservadas.length ? `${plural(proximasReservadas.length, "reservada", "reservadas")}` : "Ninguna reservada", d: IC.clock },
    { to: "/alumno/calculadora-rm", titulo: "Calculadora RM", sub: "Calculá tu 1RM", d: IC.calc },
    { to: "/alumno/marcas", titulo: "Mis RM", sub: plural(totalMarcas, "registrada", "registradas"), d: IC.trophy },
  ]

  const nombreMesTitulo = nombreMes ? nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1) : "Este mes"
  const pctMes = diasEnMes ? Math.round((clasesMes / diasEnMes) * 100) : 0
  const progreso = [
    { titulo: "Esta semana", sub: "Clases completadas", valor: `${clasesSemanales}/${metaSemanal}`, actual: clasesSemanales, max: metaSemanal },
    { titulo: nombreMesTitulo, sub: `${plural(clasesMes, "clase", "clases")} en el mes`, valor: `${pctMes}%`, actual: clasesMes, max: diasEnMes },
  ]

  return (
    <Pantalla>
      {errorDatos && (
        <ErrorBanner
          titulo="No pudimos cargar tus clases y reservas"
          texto="Revisá tu conexión. El resto del resumen está actualizado."
          onReintentar={onReintentar}
        />
      )}

      <HeroCard aria-labelledby="hola">
        <div className="grid grid-cols-1 gap-8 min-[1280px]:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col items-start gap-4">
            <div className="flex items-center gap-1">
              <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#3d5a10] bg-[#16220a] px-3 text-[13px] font-bold text-bx-lima">
                <Ico d={IC.flame} size={16} sw={2} />
                {racha === 0 ? "Sin racha" : `${racha} ${racha === 1 ? "día" : "días"} de racha`}
              </span>
              <button type="button" aria-label="¿Qué es la racha?" title="Días seguidos en los que entrenaste" className="grid h-11 w-11 place-items-center rounded-lg text-[#a3a698] hover:text-white">
                <Ico d={IC.help} size={18} />
              </button>
            </div>
            <h2 id="hola" className="bx-num m-0 text-[clamp(36px,4vw,54px)] uppercase leading-none [text-wrap:balance]">¡Hola, {nombreUsuario}!</h2>
            <p className="m-0 max-w-[52ch] text-lg leading-[1.45] text-[#b9bcae]">{frase}</p>
            <Boton to="/alumno/reservar" tamano="lg" className="gap-2.5">
              <Ico d={IC.cal} size={18} sw={2} />
              RESERVAR CLASE
            </Boton>
            <div className="mt-2">
              <div className="mb-2.5 flex items-baseline gap-2.5">
                <span className="text-xs font-bold tracking-[0.1em] text-[#a3a698]">TUS LOGROS</span>
                <span className="text-[13px] font-medium text-[#a3a698]">{desbloqueados} de {logros.length} desbloqueados</span>
              </div>
              <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
                {logros.map((l) => {
                  const Icono = l.icono
                  return (
                    <li key={l.codigo}>
                      <button
                        type="button"
                        aria-label={`${l.nombre}, ${l.completado ? "desbloqueado" : "bloqueado"}`}
                        title={`${l.nombre}: ${l.descripcion}`}
                        className={`grid h-12 w-12 place-items-center rounded-[10px] border transition-colors hover:border-bx-lima ${l.completado ? "border-[#3d5a10] bg-[#1f2a0e] text-bx-lima" : "border-[#2a2a2a] bg-[#1a1a1a] text-[#5d6152]"}`}
                      >
                        <Icono className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <DatoHero etiqueta="Créditos" valor={cargando ? "…" : creditos} nota="Disponibles para reservar" className="px-4" />
              <DatoHero etiqueta="Clases" valor={totalClases} nota="Tomadas en Bravos" className="px-4" />
            </div>
            {estado && (
              <div className="flex flex-col gap-1 rounded-xl border border-[#262626] bg-[#1a1a1a] p-5">
                <div className="flex items-center justify-between gap-2.5">
                  <span className="text-[13px] font-semibold text-[#a3a698]">Mi membresía</span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] ${estado.clases}`}>
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />
                    {estado.etiqueta}
                  </span>
                </div>
                {nombrePlanes ? (
                  <>
                    <div className="mt-3 truncate text-lg font-extrabold">{nombrePlanes}</div>
                    <div className="text-[13px] text-[#a3a698]">Vence el {fmtFechaPlan(miPlan.proximoVencimiento)}</div>
                  </>
                ) : (
                  <>
                    <div className="mt-3 text-lg font-extrabold">Sin membresía vigente</div>
                    <div className="text-[13px] text-[#a3a698]">
                      {miPlan?.ultimoPlan ? `Tu última membresía fue ${miPlan.ultimoPlan.nombrePlan}` : "Contratá una membresía para reservar clases"}
                    </div>
                  </>
                )}
                <Link
                  to="/alumno/plan"
                  className="mt-3.5 flex h-11 items-center justify-center gap-2 rounded-lg border border-[#4a4d42] text-sm font-bold text-[#ecefe4] transition-colors hover:border-bx-lima hover:text-bx-lima"
                >
                  <Ico d={estadoMembresia === "activa" ? IC.plus : IC.card} size={16} sw={2} />
                  {estadoMembresia === "activa" ? "Contratar otra membresía" : "Renovar membresía"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </HeroCard>

      <nav aria-label="Accesos rápidos" className="grid grid-cols-2 gap-3 min-[1200px]:grid-cols-4">
        {accesos.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="flex min-h-[72px] items-center gap-3.5 rounded-xl border border-bx-line bg-bx-card px-4 py-3 text-bx-ink transition-colors hover:border-bx-lima hover:bg-bx-surf"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-bx-tile text-bx-ok-fg"><Ico d={a.d} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-bold">{a.titulo}</span>
              <span className="block text-[13px] text-bx-muted">{a.sub}</span>
            </span>
            <Ico d={IC.chevRight} size={18} sw={2} className="text-bx-muted" />
          </Link>
        ))}
      </nav>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-start gap-6">
        <div className="flex min-w-0 flex-col gap-6">
          <Tarjeta aria-labelledby="t-res">
            <TituloTarjeta id="t-res" enlace={<EnlaceVer to="/alumno/reservas">Ver todas</EnlaceVer>}>Mis reservas</TituloTarjeta>
            {cargando && <Esqueleto alto={84} etiqueta="Cargando reservas" />}
            {!cargando && errorDatos && <Vacio titulo="No se pudieron cargar tus reservas" />}
            {!cargando && !errorDatos && proximasReservadas.length === 0 && (
              <Vacio
                titulo="No tenés clases reservadas"
                texto="Elegí un horario y asegurá tu lugar."
                accion={<Boton to="/alumno/reservar">Reservar clase</Boton>}
              />
            )}
            {!cargando && !errorDatos && proximasReservadas.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {proximasReservadas.slice(0, 3).map((r) => {
                  const dur = duracion(r.horaInicio, r.horaFin)
                  return (
                    <li key={r.idReserva} className="flex flex-wrap items-center gap-4 rounded-xl border border-bx-ok-line bg-bx-ok-bg p-4">
                      <div className="flex h-16 w-16 flex-col items-center justify-center rounded-[10px] bg-bx-lateral text-[#ecefe4]">
                        <span className="text-[11px] font-semibold tracking-[0.08em] text-bx-lima">{mesAbreviado(r.fechaReserva)}</span>
                        <span className="bx-num text-[28px] leading-none">{diaDelMes(r.fechaReserva)}</span>
                      </div>
                      <div className="min-w-[160px] flex-1">
                        <div className="text-base font-bold">{etiquetaClase(r.fechaReserva, r.horaInicio)}</div>
                        <div className="text-sm text-bx-muted">{r.nombreClase || r.clase}{dur ? ` · ${dur}` : ""}</div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-bx-ok-line bg-bx-surf px-3 py-1.5 text-[13px] font-bold text-bx-ok-fg">
                        <Ico d={IC.check} size={14} sw={2.4} />Confirmada
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Tarjeta>

          <Tarjeta aria-labelledby="t-hoy">
            <TituloTarjeta id="t-hoy" enlace={<EnlaceVer to="/alumno/reservar">Ver todas</EnlaceVer>}>Clases de hoy</TituloTarjeta>
            {cargandoClases && <Esqueleto alto={76} etiqueta="Cargando clases" />}
            {!cargandoClases && errorClases && (
              <div className="rounded-xl border border-dashed border-bx-err-line p-4 text-sm font-medium text-bx-err-fg">No se pudieron cargar las clases de hoy.</div>
            )}
            {!cargandoClases && !errorClases && clasesHoy.length === 0 && (
              <Vacio titulo="No hay más clases programadas para hoy" />
            )}
            {!cargandoClases && !errorClases && clasesHoy.length > 0 && (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {clasesHoy.map((c) => {
                  const hora = horaCorta(c.horaInicio)
                  const libres = c.cupoDisponible
                  const dur = duracion(c.horaInicio, c.horaFin)
                  const reservada = reservadasHoy.has(c.idHorario)
                  return (
                    <li key={c.idHorario || c.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-bx-line2 bg-bx-surf px-4 py-3.5">
                      <div className="bx-num min-w-[72px] text-[30px] leading-none">{hora}</div>
                      <div className="min-w-[150px] flex-1">
                        <div className="text-[15px] font-bold">{c.nombreClase || c.nombre}</div>
                        <div className="text-sm text-bx-muted">{c.nombreProfesor || "Staff Bravos"}{dur ? ` · ${dur}` : ""}</div>
                      </div>
                      {libres != null && (
                        <span className="text-[13px] font-medium text-bx-muted">{libres > 0 ? plural(libres, "lugar libre", "lugares libres") : "Sin lugares libres"}</span>
                      )}
                      {reservada ? (
                        <span className="inline-flex h-11 items-center rounded-lg border border-bx-ok-line bg-bx-ok-bg px-3.5 text-sm font-bold text-bx-ok-fg">Ya reservaste</span>
                      ) : (
                        <Boton to="/alumno/reservar" aria-label={`Reservar clase de las ${hora}`}>Reservar</Boton>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Tarjeta>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Tarjeta aria-labelledby="t-prog" className="flex flex-col gap-5">
            <h2 id="t-prog" className="m-0 text-lg font-bold">Tu progreso</h2>
            {progreso.map((p) => (
              <div key={p.titulo}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <div>
                    <div className="text-[15px] font-bold">{p.titulo}</div>
                    <div className="text-[13px] text-bx-muted">{p.sub}</div>
                  </div>
                  <div className="bx-num text-[32px] leading-none text-bx-ok-fg">{p.valor}</div>
                </div>
                <Progreso valor={p.actual} max={p.max} etiqueta={p.titulo} />
              </div>
            ))}
          </Tarjeta>
          <RankingResumen />
        </div>
      </div>

      <NovedadesPortada compacta limite={3} variante="bx" />
    </Pantalla>
  )
}
