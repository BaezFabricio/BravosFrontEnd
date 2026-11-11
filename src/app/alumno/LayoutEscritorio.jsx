import { Link, useLocation } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import NotificacionesBell from "@/components/NotificacionesBell"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { AvatarBx, MenuCuenta } from "@/components/bx/MenuCuenta"

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

export default function LayoutEscritorio({ userData, avatarUrl, onLogout, children }) {
  const { pathname } = useLocation()
  const { theme, setTheme } = useTheme()
  const oscuro = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
  const { titulo, subtitulo } = paginaActual(pathname)

  return (
    <div className="bx flex min-h-screen bg-bx-bg text-bx-ink">
      <aside aria-label="Menú del alumno" className="sticky top-0 z-20 flex h-screen w-[272px] shrink-0 flex-col bg-bx-lateral text-[#ecefe4]">
        <div className="flex h-[76px] items-center gap-3 border-b border-[#26281f] px-5">
          <img src="/logo.jpg" alt="" className="h-10 w-10 rounded-lg object-cover" />
          <span className="flex-1 text-lg font-extrabold tracking-[0.12em]">BRAVOS</span>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {NAV.map((n) => {
            const activo = esActivo(n, pathname)
            return (
              <div key={n.href} className="contents">
                {n.grupo && <div className="px-3 pb-1.5 pt-[18px] text-[11px] font-bold tracking-[0.12em] text-[#8b8e80]">{n.grupo}</div>}
                <Link
                  to={n.href}
                  aria-current={activo ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-semibold transition-colors ${activo ? "bg-[#1f2a0e] text-bx-lima" : "text-[#c9ccbe] hover:bg-[#1f2119] hover:text-white"}`}
                >
                  <Ico d={n.icono} />
                  <span>{n.name}</span>
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Tocar la tarjeta lleva al perfil */}
        <Link to="/alumno/perfil" title="Ver mi perfil" className="flex items-center gap-3 border-t border-[#26281f] px-5 py-4 hover:bg-[#1f2119]">
          <AvatarBx nombre={userData.nombrecompleto} url={avatarUrl} className="!bg-[#2a2c24]" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{userData.nombrecompleto}</div>
            <div className="truncate text-xs text-[#8b8e80]">{userData.correo}</div>
          </div>
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-[72px] items-center gap-3 border-b border-bx-line bg-bx-bg px-6">
          <div className="min-w-0 flex-1">
            <h1 data-guia="titulo" className="m-0 truncate text-xl font-bold">{titulo}</h1>
            {subtitulo && <div className="truncate text-[13px] text-bx-muted">{subtitulo}</div>}
          </div>
          <button
            type="button"
            onClick={() => setTheme(oscuro ? "light" : "dark")}
            aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] border border-bx-btn-line bg-bx-card text-bx-ink hover:bg-bx-surf"
          >
            <Ico d={oscuro ? IC.sun : IC.moon} />
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

        <main className="mx-auto flex w-full max-w-[1600px] flex-col px-6 pb-[120px] pt-6">{children}</main>
      </div>
    </div>
  )
}
