import { useState } from "react"
import { ContenedorPortal } from "@/lib/contenedorPortal"
import { useZoomLienzo } from "@/lib/useZoomLienzo"
import { Link, useLocation } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import NotificacionesBell from "@/components/NotificacionesBell"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { AvatarBx, MenuCuenta } from "@/components/bx/MenuCuenta"
import { LayoutBxContext } from "@/lib/layoutBx"

/*
 * Marco del módulo Alumno en escritorio (desde 1024 px): menú lateral oscuro, barra de arriba con título y subtítulo de
 * la pantalla, tema, campanita y menú de cuenta. Diseño del handoff (pantallas 01, 10 y 11). El celular tiene su propio marco.
 */

// Menú: "grupo" abre un título de grupo antes de la opción
const NAV = [
  { name: "Página principal", href: "/inicio", icono: IC.globe },
  { name: "Resumen", href: "/alumno", icono: IC.home },
  { name: "Reservar clase", href: "/alumno/reservar", icono: IC.cal, grupo: "ENTRENAMIENTO" },
  { name: "Mis reservas", href: "/alumno/reservas", icono: IC.hist },
  { name: "Mis RM", href: "/alumno/marcas", icono: IC.trophy },
  { name: "Calculadora RM", href: "/alumno/calculadora-rm", icono: IC.calc },
  { name: "Mi membresía", href: "/alumno/plan", icono: IC.wallet, grupo: "MI CUENTA" },
  { name: "Mis créditos", href: "/alumno/creditos", icono: IC.card },
  { name: "Documentos y comprobantes", href: "/alumno/documentacion", icono: IC.folder },
  { name: "Mi perfil", href: "/alumno/perfil", icono: IC.user },
]

// Título y subtítulo de la barra de arriba para cada pantalla
const PAGINAS = [
  ["/alumno/reservar", "Reservar clase", "Elegí día y horario"],
  ["/alumno/reservas", "Mis reservas", "Tus próximas clases y el historial"],
  ["/alumno/marcas", "Mis RM", "Cargá tu RM de cada ejercicio y mirá cómo estás en el ranking del box."],
  ["/alumno/calculadora-rm", "Calculadora RM", "Estimá tu repetición máxima (1RM) a partir de una serie, sin tener que probar tu máximo real."],
  ["/alumno/plan", "Mi membresía", "Tu membresía, tus créditos y tus renovaciones."],
  ["/alumno/creditos", "Mis créditos", "Estado de tu cuenta y movimientos."],
  ["/alumno/documentacion", "Documentos y comprobantes", "Cargá los documentos que pide el gimnasio."],
  ["/alumno/perfil", "Mi perfil", "Tus datos personales y la seguridad de tu cuenta."],
  ["/perfil", "Mi perfil", "Tus datos personales y la seguridad de tu cuenta."],
  ["/alumno/novedades", "Novedades", null],
  ["/alumno/configuracion", "Mi configuración", null],
  ["/alumno/pago", "Pago de la membresía", null],
]

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

// "Miércoles 11 de noviembre" (hora local)
function fechaDeHoy() {
  const h = new Date()
  return `${DIAS[h.getDay()]} ${h.getDate()} de ${MESES[h.getMonth()]}`
}

function paginaActual(pathname) {
  if (pathname === "/alumno") return { titulo: "Resumen", subtitulo: fechaDeHoy() }
  const p = PAGINAS.find(([ruta]) => pathname === ruta || pathname.startsWith(ruta + "/") || pathname.startsWith(ruta + "-"))
  return p ? { titulo: p[1], subtitulo: p[2] } : { titulo: "Alumno", subtitulo: null }
}

const esActivo = (item, pathname) =>
  item.href === "/alumno" ? pathname === "/alumno" : pathname === item.href || pathname.startsWith(item.href + "/")

const LEE_MENU = () => { try { return localStorage.getItem("bx-menu-cerrado") !== "1" } catch { return true } }

export default function LayoutEscritorio({ userData, avatarUrl, onLogout, children }) {
  const { pathname } = useLocation()
  const { theme, setTheme } = useTheme()
  const oscuro = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
  const { titulo, subtitulo } = paginaActual(pathname)
  // El menú se puede ocultar (se desliza hacia la izquierda y el contenido ocupa su lugar); se recuerda la elección
  const [menuAbierto, setMenuAbierto] = useState(LEE_MENU)
  const [raiz, setRaiz] = useState(null)
  const [anfitrion, setAnfitrion] = useState(null) // donde se montan menús y ventanas (ver useZoomLienzo)
  useZoomLienzo(raiz, anfitrion) // se diseña a 1920 px y se achica según el ancho de la ventana
  const cambiarMenu = (abierto) => {
    setMenuAbierto(abierto)
    try { localStorage.setItem("bx-menu-cerrado", abierto ? "0" : "1") } catch { /* sin almacenamiento: no se recuerda */ }
  }

  return (
    <ContenedorPortal.Provider value={anfitrion}>
    <div ref={setRaiz} className="bx min-h-screen bg-bx-bg text-bx-ink">
      <aside
        style={{ height: "var(--bv-vh, 100vh)" }}
        aria-label="Menú del alumno"
        inert={!menuAbierto}
        className={`fixed left-0 top-0 z-20 flex h-screen w-[17rem] flex-col bg-bx-lateral text-[#ecefe4] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuAbierto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[4.75rem] items-center gap-3 border-b border-[#26281f] px-5">
          <img src="/logo.jpg" alt="" className="h-10 w-10 rounded-lg object-cover" />
          <span className="flex-1 text-lg font-extrabold tracking-[0.12em]">BRAVOS</span>
          <button
            type="button"
            onClick={() => cambiarMenu(false)}
            aria-label="Ocultar el menú"
            className="grid h-11 w-11 place-items-center rounded-lg text-[#8b8e80] transition-[background-color,color,transform] duration-200 hover:bg-[#1f2119] hover:text-white active:scale-90"
          >
            <Ico d="m15 6-6 6 6 6" size={20} sw={2} />
          </button>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((n) => {
            const activo = esActivo(n, pathname)
            return (
              <div key={n.href} className="contents">
                {n.grupo && <div className="px-3 pb-1.5 pt-[1.125rem] text-[0.6875rem] font-bold tracking-[0.12em] text-[#8b8e80]">{n.grupo}</div>}
                <Link
                  to={n.href}
                  aria-current={activo ? "page" : undefined}
                  className={`group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-[0.9375rem] font-semibold transition-[background-color,color,transform] duration-200 active:scale-[0.98] ${activo ? "bg-[#1f2a0e] text-bx-lima" : "text-[#c9ccbe] hover:bg-[#1f2119] hover:text-white"}`}
                >
                  {activo && <span aria-hidden="true" className="bx-barra-v absolute bottom-2 left-0 top-2 w-[0.1875rem] rounded-full bg-bx-lima" />}
                  <span className="flex transition-transform duration-200 group-hover:translate-x-0.5"><Ico d={n.icono} /></span>
                  <span>{n.name}</span>
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Tocar la tarjeta lleva al perfil */}
        <Link to="/alumno/perfil" title="Ver mi perfil" className="flex items-center gap-3 border-t border-[#26281f] px-5 py-4 transition-colors duration-200 hover:bg-[#1f2119]">
          <AvatarBx nombre={userData.nombrecompleto} url={avatarUrl} className="!bg-[#2a2c24]" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{userData.nombrecompleto}</div>
            <div className="truncate text-xs text-[#8b8e80]">{userData.correo}</div>
          </div>
        </Link>
      </aside>

      <div className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${menuAbierto ? "pl-[17rem]" : "pl-0"}`}>
        <header className="sticky top-0 z-10 flex h-[4.5rem] items-center gap-3 border-b border-bx-line bg-bx-bg px-6">
          {!menuAbierto && (
            <button
              type="button"
              onClick={() => cambiarMenu(true)}
              aria-label="Mostrar el menú"
              className="bx-aparece grid h-11 w-11 shrink-0 place-items-center rounded-[0.625rem] border border-bx-btn-line bg-bx-card text-bx-ink transition-[background-color,transform] duration-200 hover:bg-bx-surf active:scale-95"
            >
              <Ico d={IC.menu} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 data-guia="titulo" key={titulo} className="bx-aparece m-0 truncate text-xl font-bold">{titulo}</h1>
            {subtitulo && <div key={subtitulo} className="bx-aparece truncate text-[0.8125rem] text-bx-muted">{subtitulo}</div>}
          </div>
          <button
            type="button"
            onClick={() => setTheme(oscuro ? "light" : "dark")}
            aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[0.625rem] border border-bx-btn-line bg-bx-card text-bx-ink transition-[background-color,transform] duration-200 hover:bg-bx-surf active:scale-95"
          >
            {/* El sol y la luna se cruzan girando */}
            <span className={`absolute flex transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${oscuro ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}><Ico d={IC.sun} /></span>
            <span className={`absolute flex transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${oscuro ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}><Ico d={IC.moon} /></span>
          </button>
          <NotificacionesBell variante="bx" />
          <MenuCuenta
            userData={userData}
            avatarUrl={avatarUrl}
            onLogout={onLogout}
            rutaPerfil="/alumno/perfil"
            rutaConfiguracion="/alumno/configuracion"
          />
        </header>

        <main className="mx-auto flex w-full max-w-[100rem] flex-col px-6 pb-[7.5rem] pt-6">
          <LayoutBxContext.Provider value={true}>{children}</LayoutBxContext.Provider>
        </main>
      </div>
      <div ref={setAnfitrion} data-anfitrion-portales />
    </div>
    </ContenedorPortal.Provider>
  )
}
