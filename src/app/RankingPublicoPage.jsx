import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Medal, Search } from "lucide-react"
import UserMenu from "@/components/UserMenu"
import { haySesion, cerrarSesionEnServidor } from "@/lib/sesion"
import { formatearValor } from "@/lib/ranking"

// Datos de la sesión (los mismos que usa la portada); el servidor igual valida todo
function leerSesion() {
  if (!haySesion()) return null
  const leer = (clave, defecto) => { try { return JSON.parse(localStorage.getItem(clave) || "") ?? defecto } catch { return defecto } }
  const u = leer("usuario", {})
  return {
    userData: {
      nombrecompleto: u?.nombrecompleto || u?.nombre || u?.username || "Usuario Bravos",
      correo: u?.correo || u?.email || "sin-correo@bravos.com",
      perfil: u?.perfil || u?.rol || u?.tipo || "cliente",
      estado: u?.estado || "activo",
    },
    permisos: Array.isArray(leer("permisos", [])) ? leer("permisos", []) : [],
    avatarUrl: localStorage.getItem("avatarUrl") || "",
  }
}

const iniciales = (nombre) => String(nombre || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "?"

// Podio: 1.º al centro (más alto), 2.º a la izquierda y 3.º a la derecha
const COLOR_PUESTO = { 1: "#e6c200", 2: "#c9ccbf", 3: "#c98a4b" }
const ALTURA_PUESTO = { 1: "7.5rem", 2: "5.625rem", 3: "4.25rem" }
const ORDEN_PODIO = [2, 1, 3]

/*
 * Página pública del ranking de RM del box (diseño "Bravos Ranking"). Muestra los primeros 20 de cada ejercicio.
 * Para aparecer hay que cargar la propia marca desde el panel del alumno.
 */
export default function RankingPublicoPage() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(false)
  const [idCatalogo, setIdCatalogo] = useState(null)
  const [busqueda, setBusqueda] = useState("")
  const [sesion] = useState(leerSesion)
  const [menuAbierto, setMenuAbierto] = useState(false)

  useEffect(() => {
    let vigente = true
    fetch(`/api/vv1/marcas/ranking-publico${idCatalogo ? `?idCatalogo=${idCatalogo}` : ""}`)
      .then((r) => r.json())
      .then((r) => { if (vigente) { setError(false); setDatos(r.data) } })
      .catch(() => { if (vigente) setError(true) })
    return () => { vigente = false }
  }, [idCatalogo])

  const permisos = sesion?.permisos || []
  const tieneModulosAdmin = permisos.some((p) => ["usuarios:", "dashboard:", "perfiles:", "membresias:", "clases:", "reservas:", "creditos:", "configuracion:"].some((pre) => p.startsWith(pre)))
  const cerrarSesion = () => {
    cerrarSesionEnServidor()
    ;["usuario", "avatarUrl", "permisos"].forEach((k) => localStorage.removeItem(k))
    window.location.href = "/"
  }

  const ejercicios = datos?.ejercicios || []
  const actual = datos?.ejercicio
  const todas = useMemo(() => datos?.ranking || [], [datos])
  const q = busqueda.trim().toLowerCase()
  const filas = useMemo(() => (q ? todas.filter((f) => String(f.nombre).toLowerCase().includes(q)) : todas.slice(3)), [todas, q])
  const puesto = (n) => todas.find((f) => f.posicion === n)
  const mia = todas.find((f) => f.esMio)
  const tipo = actual?.tipoMarca || "peso"
  const nombreEj = actual?.nombre || ""
  const destinoMarcas = sesion ? "/alumno/marcas" : "/login"

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-[#ecefe4]" style={{ fontFamily: "Archivo, sans-serif" }}>
      <header className="sticky top-0 z-10 border-b border-[#262626] bg-[rgba(11,11,11,.92)] backdrop-blur-[10px]">
        <div className="mx-auto flex h-[68px] max-w-[1720px] items-center gap-3 px-5">
          <Link to="/" aria-label="Bravos Box, inicio" className="flex">
            <img src="/bravos-logo.png" alt="Bravos Box" className="h-[34px] w-auto" />
          </Link>
          <span className="flex-1" />
          <Link to="/" className="hidden h-11 items-center gap-2 rounded-[10px] border border-[#333] px-4 text-sm font-bold text-[#ecefe4] no-underline transition-colors hover:border-[#9be600] sm:flex">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
            Volver al sitio
          </Link>
          {sesion ? (
            <div className="relative">
              <button type="button" onClick={() => setMenuAbierto((v) => !v)} aria-label="Abrir el menú de tu cuenta" aria-expanded={menuAbierto}
                className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-[#9be600] bg-[#1f2a0e] text-sm font-extrabold text-[#9be600]">
                {sesion.avatarUrl ? <img src={sesion.avatarUrl} alt="" className="h-full w-full object-cover" /> : iniciales(sesion.userData.nombrecompleto)}
              </button>
              <UserMenu
                userData={sesion.userData}
                avatarUrl={sesion.avatarUrl}
                userMenuOpen={menuAbierto}
                setUserMenuOpen={setMenuAbierto}
                handleLogout={cerrarSesion}
                tieneModulosAdmin={tieneModulosAdmin}
                tieneModulosAlumno={permisos.some((p) => p.startsWith("alumno"))}
                tieneModulosProfesor={permisos.some((p) => p.startsWith("profesor"))}
                puedeAccederPanel={permisos.length > 0 && sesion.userData.estado === "activo"}
              />
            </div>
          ) : (
            <Link to="/login" className="flex h-11 items-center rounded-[10px] px-4 text-xs font-black tracking-widest text-[#ecefe4] no-underline hover:bg-[#161616]">INGRESAR</Link>
          )}
        </div>
      </header>

      {/* Encabezado oscuro con el logo de fondo y el puesto propio */}
      <section className="relative overflow-hidden border-b border-[#1f1f1f] bg-[#0e0e0e]">
        <img src="/bravos-logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute top-1/2 -right-20 w-[56.25rem] -translate-y-1/2 -rotate-6 opacity-5 [filter:grayscale(1)_brightness(1.4)]" />
        <div className="relative mx-auto flex max-w-[1120px] flex-wrap items-end justify-between gap-7 px-5 py-14">
          <div className="max-w-[35rem]">
            <p className="m-0 text-xs font-bold tracking-[.12em] text-[#9be600]">LOS MEJORES DEL BOX</p>
            <h1 className="mt-2 mb-0 font-[Archivo]! text-[2.25rem] leading-[1.05] font-extrabold tracking-[-.02em] md:text-[3rem]">Ranking de RM</h1>
            <p className="mt-3 text-base leading-normal text-[#a3a698]">
              Las mejores marcas de nuestros alumnos por ejercicio. {sesion ? "Cargá tu RM desde tu panel para aparecer." : "Para aparecer, ingresá y cargá tu RM."}
            </p>
          </div>

          {actual && (
            <div className="flex flex-wrap items-center gap-[1.125rem] rounded-2xl border border-[#3d5a10] bg-[#141414] px-5 py-[1.125rem]">
              <div>
                <p className="m-0 text-[0.6875rem] font-semibold tracking-[.1em] whitespace-nowrap text-[#a3a698] uppercase">Tu puesto en {nombreEj}</p>
                <div className="mt-1 flex items-baseline gap-2.5">
                  <span className="text-4xl leading-none font-extrabold text-[#9be600]">{mia ? `${mia.posicion}º` : "—"}</span>
                  <span className="text-base font-bold">{mia ? formatearValor(tipo, mia.valor) : "Sin marca"}</span>
                </div>
              </div>
              <Link to={destinoMarcas} className="flex h-11 items-center rounded-[10px] bg-[#9be600] px-4 text-[0.8125rem] font-extrabold tracking-[.03em] whitespace-nowrap text-[#0b0b0b] no-underline transition-colors hover:bg-[#c4ff3d]">
                ACTUALIZAR MI RM
              </Link>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto flex max-w-[1120px] flex-col gap-7 px-5 pt-8 pb-24">
        {error ? (
          <p className="rounded-2xl border border-[#262626] p-8 text-center text-[#a3a698]">No se pudo cargar el ranking. Probá de nuevo en un momento.</p>
        ) : !datos ? (
          <p className="text-[#a3a698]" role="status">Cargando…</p>
        ) : !actual ? (
          <div className="rounded-2xl border border-[#262626] p-10 text-center">
            <Medal className="mx-auto mb-3 h-10 w-10 text-[#6b6b6b]" aria-hidden="true" />
            <p className="m-0 font-bold">Todavía no hay marcas cargadas</p>
            <p className="mt-1 text-sm text-[#a3a698]">Cuando los alumnos carguen su RM, vas a ver el ranking acá.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-nowrap items-center gap-3">
              <div role="group" aria-label="Ejercicio" className="flex min-w-0 flex-1 gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {ejercicios.map((e) => {
                  const on = e.idCatalogo === actual.idCatalogo
                  return (
                    <button key={e.idCatalogo} type="button" aria-pressed={on} onClick={() => { setIdCatalogo(e.idCatalogo); setBusqueda("") }}
                      className={`h-11 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#9be600] ${on ? "border-[#9be600] bg-[#9be600] text-[#0b0b0b]" : "border-[#333] text-[#ecefe4] hover:border-[#555]"}`}>
                      {e.nombre}
                    </button>
                  )
                })}
              </div>
              <label className="relative block w-[15rem] shrink-0">
                <span className="sr-only">Buscar un alumno</span>
                <Search className="pointer-events-none absolute top-[0.8125rem] left-3.5 h-[18px] w-[18px] text-[#a3a698]" aria-hidden="true" />
                <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar un alumno"
                  className="h-11 w-full rounded-[10px] border border-[#333] bg-[#141414] pr-3.5 pl-[2.625rem] text-[0.9375rem] font-medium text-[#ecefe4] outline-[#9be600] placeholder:text-[#6b6b6b]" />
              </label>
            </div>

            {/* Podio (se oculta al buscar) */}
            {!q && (
              <section aria-label="Podio" className="grid grid-cols-3 items-end gap-3.5">
                {ORDEN_PODIO.map((n) => {
                  const f = puesto(n)
                  const c = COLOR_PUESTO[n]
                  const av = n === 1 ? "4.75rem" : "3.875rem"
                  return (
                    <div key={n} className="flex flex-col items-center gap-2.5 text-center">
                      {f ? (
                        <div className="flex w-full flex-col items-center gap-2">
                          <span className="grid place-items-center rounded-full border-[3px] bg-[#1f2a0e] text-lg font-extrabold text-[#9be600]" style={{ width: av, height: av, borderColor: c }}>{iniciales(f.nombre)}</span>
                          <span className="flex max-w-full items-center justify-center gap-1.5 text-[0.9375rem] leading-tight font-bold whitespace-nowrap">
                            <span className="min-w-0 truncate">{f.nombre}</span>
                            {f.esMio && <span className="rounded-md bg-[#9be600] px-1.5 py-0.5 text-[0.625rem] font-extrabold text-[#0b0b0b]">VOS</span>}
                          </span>
                          <span className="text-[1.375rem] leading-tight font-extrabold">{formatearValor(tipo, f.valor)}</span>
                        </div>
                      ) : (
                        <div className="flex w-full flex-col items-center gap-1.5">
                          <span className="grid place-items-center rounded-full border-2 border-dashed border-[#333] text-xl font-bold text-[#6b6b6b]" style={{ width: av, height: av }} aria-hidden="true">?</span>
                          <span className="text-sm leading-tight font-semibold whitespace-nowrap text-[#a3a698]">Puesto libre</span>
                          <Link to={destinoMarcas} className="flex min-h-8 items-center text-[0.8125rem] leading-tight font-bold whitespace-nowrap text-[#9be600] no-underline">Cargá tu RM</Link>
                        </div>
                      )}
                      <div className="flex w-full items-start justify-center rounded-t-2xl border border-b-0 pt-3.5 text-[1.875rem] font-extrabold"
                        style={{ height: ALTURA_PUESTO[n], background: f ? (n === 1 ? "#1a1d0f" : "#161616") : "transparent", borderColor: f ? (n === 1 ? "#5a5212" : "#262626") : "#262626", color: c }}>
                        {n}º
                      </div>
                    </div>
                  )
                })}
              </section>
            )}

            {/* Tabla desde el 4.º puesto (al buscar, toda la lista) */}
            <section aria-label={`Ranking de ${nombreEj}`} className="overflow-hidden rounded-2xl border border-[#262626] bg-[#141414]">
              <div className="grid grid-cols-[72px_minmax(0,1fr)_120px] gap-3 border-b border-[#262626] px-5 py-3 text-[0.6875rem] font-semibold tracking-[.1em] text-[#a3a698]">
                <span>PUESTO</span><span>ALUMNO</span><span className="text-right">RM</span>
              </div>
              {filas.length === 0 ? (
                <div className="px-5 py-9 text-center">
                  <p className="m-0 font-bold">{q ? `No encontramos a "${busqueda.trim()}"` : "Por ahora solo está el podio"}</p>
                  <p className="mt-1 text-sm text-[#a3a698]">{q ? "Probá con otro nombre." : "Cuando más alumnos carguen su RM, aparecen acá desde el 4º puesto."}</p>
                </div>
              ) : (
                <ol className="m-0 list-none p-0">
                  {filas.map((f, i) => (
                    <li key={`${f.posicion}-${f.nombre}-${i}`} className="grid min-h-[3.75rem] grid-cols-[72px_minmax(0,1fr)_120px] items-center gap-3 border-t px-5 py-2"
                      style={{ borderColor: i ? "#1f1f1f" : "transparent", background: f.esMio ? "#121a0a" : "transparent" }}>
                      <span className="text-base font-extrabold" style={{ color: COLOR_PUESTO[f.posicion] || "#a3a698" }}>{f.posicion}º</span>
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="grid h-[2.125rem] w-[2.125rem] shrink-0 place-items-center rounded-full bg-[#1f1f1f] text-xs font-extrabold text-[#c9ccbf]">{iniciales(f.nombre)}</span>
                        <span className="truncate text-[0.9375rem] font-bold">{f.nombre}</span>
                        {f.esMio && <span className="shrink-0 rounded-md bg-[#9be600] px-1.5 py-0.5 text-[0.625rem] font-extrabold text-[#0b0b0b]">VOS</span>}
                      </span>
                      <span className="text-right text-[1.0625rem] font-extrabold">{formatearValor(tipo, f.valor)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  )
}
