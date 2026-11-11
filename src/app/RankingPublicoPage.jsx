import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Medal, Search } from "lucide-react"
import PodioRanking from "@/components/PodioRanking"
import UserMenu from "@/components/UserMenu"
import { haySesion, cerrarSesionEnServidor } from "@/lib/sesion"

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

const iniciales = (nombre) => String(nombre || "?").trim().split(/s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "?"

/*
 * Página pública del ranking de RM del box: se abre desde el botón "Ranking" de la portada.
 * Muestra los 20 primeros de cada ejercicio (nombre y marca). Para cargar el propio RM hay que ingresar.
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
    window.location.href = "/inicio"
  }

  const ejercicios = datos?.ejercicios || []
  const actual = datos?.ejercicio
  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const todas = datos?.ranking || []
    return q ? todas.filter((f) => String(f.nombre).toLowerCase().includes(q)) : todas
  }, [datos, busqueda])

  return (
    <div className="dark min-h-screen bg-black text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-lime-400/40 px-4 py-3 sm:px-8">
        <Link to="/inicio" className="flex items-center gap-3" aria-label="Volver al inicio">
          <img src="/acceso/brvs.png" alt="" className="h-10 w-10 rounded-lg" />
          <span className="hidden text-lg font-black tracking-[0.3em] text-lime-400 sm:block">BRAVOS BOX</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/inicio" className="flex h-10 items-center rounded-full bg-lime-400 px-4 text-xs font-black tracking-widest text-black transition-colors hover:bg-lime-300">VOLVER AL SITIO</Link>
          {sesion ? (
            <div className="relative">
              <button type="button" onClick={() => setMenuAbierto((v) => !v)} aria-label="Abrir el menú de tu cuenta" aria-expanded={menuAbierto}
                className="flex items-center gap-1 focus:outline-none">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime-400 text-xs font-black text-black">
                  {sesion.avatarUrl ? <img src={sesion.avatarUrl} alt="" className="h-full w-full object-cover" /> : iniciales(sesion.userData.nombrecompleto)}
                </span>
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
            <Link to="/login" className="flex h-10 items-center rounded-full border border-white/25 px-4 text-xs font-black tracking-widest text-white transition-colors hover:bg-white/10">INGRESAR</Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-8 sm:py-12">
        <div>
          <p className="text-[0.6875rem] font-black uppercase tracking-widest text-lime-400">Los mejores del box</p>
          <h1 className="text-3xl font-black tracking-tight text-white sm:text-5xl">RANKING <span className="text-lime-400">DE RM</span></h1>
          <p className="mt-2 text-sm text-white/60">Las mejores marcas de nuestros alumnos por ejercicio. {sesion ? "Cargá tu RM desde tu panel para aparecer." : "Para aparecer, ingresá y cargá tu RM."}</p>
        </div>

        {error ? (
          <p className="rounded-2xl border border-white/15 p-8 text-center text-white/70">No se pudo cargar el ranking. Probá de nuevo en un momento.</p>
        ) : !datos ? (
          <p className="text-white/50" role="status">Cargando…</p>
        ) : !actual ? (
          <div className="rounded-2xl border border-white/15 p-10 text-center">
            <Medal className="mx-auto mb-3 h-10 w-10 text-white/40" aria-hidden="true" />
            <p className="font-bold text-white">Todavía no hay marcas cargadas</p>
            <p className="mt-1 text-sm text-white/60">Cuando los alumnos carguen su RM, vas a ver el ranking acá.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_16.25rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" aria-hidden="true" />
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar un alumno" aria-label="Buscar alumno"
                  className="h-12 w-full rounded-xl border border-white/20 bg-white/5 pl-10 pr-3 text-base text-white outline-none placeholder:text-white/35 focus:border-lime-400" />
              </div>
              <select value={actual.idCatalogo} onChange={(e) => { setIdCatalogo(Number(e.target.value)); setBusqueda("") }} aria-label="Filtrar por ejercicio"
                className="h-12 w-full rounded-xl border border-white/20 bg-white/5 px-3 text-base font-bold text-white outline-none focus:border-lime-400">
                {ejercicios.map((e) => <option key={e.idCatalogo} value={e.idCatalogo} className="bg-black text-white">{e.nombre}{e.participantes > 0 ? ` (${e.participantes})` : ""}</option>)}
              </select>
            </div>

            {filas.length === 0 ? (
              <p className="rounded-2xl border border-white/15 p-8 text-center text-sm text-white/60">{(datos.ranking || []).length === 0 ? `Nadie cargó una marca de ${actual.nombre} todavía.` : "Nadie coincide con la búsqueda."}</p>
            ) : (
              <PodioRanking filas={filas} tipo={actual.tipoMarca} />
            )}
          </>
        )}
      </main>
    </div>
  )
}
