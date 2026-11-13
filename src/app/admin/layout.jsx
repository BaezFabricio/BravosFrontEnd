import { cerrarSesionEnServidor } from "@/lib/sesion"
import { useEffect, useLayoutEffect, useState, useRef } from "react"
import { SlotTituloContext } from "@/lib/slotTitulo"
import { EVENTO_PERMISOS } from "@/lib/sincronizarPermisos"
import { Link, useLocation } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"

// Submódulo = una pantalla dentro de un módulo (ej. /admin/usuarios/5/editar): su "Volver" lleva a la pantalla de arriba
// Estas pantallas calculan su propio "Volver" (depende de la URL): el layout no pone otro
const CON_VOLVER_PROPIO = ["/admin/usuarios/abonos/carga-masiva"]
const rutaPadre = (pathname) => {
  if (CON_VOLVER_PROPIO.includes(pathname)) return null
  const partes = pathname.split("/").filter(Boolean)
  return partes.length >= 3 ? "/" + partes.slice(0, -1).join("/") : null
}
import { useNavigate } from "react-router-dom"
import UserMenu from "@/components/UserMenu"
import { panelesPermitidos } from "@/lib/paneles"
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  X,
  Shield,
  ChevronDown,
  BarChart3,
  Medal,
  Bell,
  UserCheck,
  Menu,
} from "lucide-react"
import { Moon, Sun } from "lucide-react"
import HamburgerButton from "@/components/HamburgerButton"
import IconoWhatsApp from "@/components/IconoWhatsApp"
import NotificacionesBell from "@/components/NotificacionesBell"
import BravoChat from "@/components/BravoChat"
import InvitacionAvisos from "@/components/InvitacionAvisos"
import { TituloGrupo, HojaMas, EnlacePaginaPrincipal, BotonPaginaPrincipal } from "@/components/MenuPanel"
import { BarraInferior } from '@/components/BarraInferior'

// Grupos del menú, en el orden en que se dibujan. El primero va sin título.
const GRUPOS = [
  { key: "inicio", titulo: null },
  { key: "gestion", titulo: "Gestión" },
  { key: "sistema", titulo: "Sistema" },
]

const navigation = [
  { name: "Resumen", mobileLabel: "Inicio", href: "/admin", icon: LayoutDashboard, requiredPermission: "dashboard:consulta", grupo: "inicio" },
  { name: "Usuarios y Abonos", mobileLabel: "Usuarios", href: "/admin/usuarios", icon: Users, requiredPermission: "usuarios:consulta", grupo: "gestion" },
  { name: "Clases", mobileLabel: "Clases", href: "/admin/clases", icon: Calendar, requiredPermission: "clases:consulta", grupo: "gestion" },
  { name: "Planes", mobileLabel: "Planes", href: "/admin/planes", icon: CreditCard, requiredPermission: "membresias:consulta", grupo: "gestion" },
  { name: "Reportes", mobileLabel: "Reportes", href: "/admin/reportes", icon: BarChart3, requiredPermission: "dashboard:consulta", grupo: "gestion" },
  { name: "Check-in", mobileLabel: "Check-in", href: "/admin/check-in", icon: UserCheck, requiredPermission: "configuracion:consulta", grupo: "gestion" },
  { name: "Novedades", mobileLabel: "Novedades", href: "/admin/novedades", icon: Bell, requiredPermission: "configuracion:consulta", grupo: "gestion" },
  { name: "Ejercicios del RM", mobileLabel: "RM", href: "/admin/ejercicios-rm", icon: Medal, requiredPermission: "configuracion:consulta", grupo: "gestion" },
  { name: "Avisos WhatsApp", mobileLabel: "Avisos", href: "/admin/avisos", icon: IconoWhatsApp, requiredPermission: "clases:consulta", grupo: "gestion" },
  { name: "Perfiles", mobileLabel: "Perfiles", href: "/admin/perfiles", icon: Shield, requiredPermission: "perfiles:consulta", grupo: "sistema" },
  { name: "Configuración del Box", mobileLabel: "Config", href: "/admin/configuracion", icon: Settings, requiredPermission: "configuracion:consulta", grupo: "sistema" },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  // Tema del panel (oscuro, claro o automático). Se guarda en el navegador y se aplica antes del primer dibujo
  const [modoTema, setModoTema] = useState(() => {
    const guardado = localStorage.getItem("bravos-admin-tema-modo")
    return guardado === "oscuro" || guardado === "claro" || guardado === "auto" ? guardado : "auto"
  })
  const [sistemaOscuro, setSistemaOscuro] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches)
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-color-scheme: dark)")
    const alCambiar = (e) => setSistemaOscuro(e.matches)
    consulta.addEventListener("change", alCambiar)
    return () => consulta.removeEventListener("change", alCambiar)
  }, [])
  const tema = modoTema === "auto" ? (sistemaOscuro ? "oscuro" : "claro") : modoTema
  useLayoutEffect(() => {
    const html = document.documentElement
    html.classList.add("bv-admin")
    html.dataset.bvTema = tema
    localStorage.setItem("bravos-admin-tema", tema)
    return () => { html.classList.remove("bv-admin"); delete html.dataset.bvTema }
  }, [tema])
  const cambiarModoTema = (nuevo) => {
    localStorage.setItem("bravos-admin-tema-modo", nuevo)
    setModoTema(nuevo)
  }
  useEffect(() => {
    // Si le cambian el perfil mientras tiene el panel abierto, el menú se actualiza solo (sin volver a iniciar sesión)
    const alCambiar = () => { try { setPermisos(JSON.parse(localStorage.getItem('permisos') || '[]')) } catch { /* nada */ } }
    window.addEventListener(EVENTO_PERMISOS, alCambiar)
    return () => window.removeEventListener(EVENTO_PERMISOS, alCambiar)
  }, [])
  const [slotTitulo, setSlotTitulo] = useState(null) // lugar del título de la pantalla en la barra de arriba
  const [userData, setUserData] = useState({
    nombrecompleto: "Administrador",
    correo: "admin@bravos.com",
    perfil: "admin",
  })
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem("avatarUrl") || "")
  const [permisos, setPermisos] = useState([])
  
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname
  const menuRef = useRef(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario")
    const storedAvatar = localStorage.getItem("avatarUrl")
    const storedPermisos = JSON.parse(localStorage.getItem('permisos') || '[]');

    const opcionesPermitidas = navigation.filter(item => storedPermisos.includes(item.requiredPermission));
    
    if (pathname === '/admin' && !storedPermisos.includes('dashboard:consulta') && opcionesPermitidas.length > 0) {
        navigate(opcionesPermitidas[0].href, { replace: true });
    }

    if (storedAvatar) setAvatarUrl(storedAvatar)
    setPermisos(storedPermisos)

    if (!storedUser) {
      navigate("/login")
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      if (parsedUser?.avatarUrl) {
        localStorage.setItem("avatarUrl", parsedUser.avatarUrl)
        setAvatarUrl(parsedUser.avatarUrl)
      }

      setUserData({
        nombrecompleto: parsedUser?.nombrecompleto || parsedUser?.nombre || parsedUser?.username || "Administrador",
        correo: parsedUser?.correo || parsedUser?.email || "admin@bravos.com",
        perfil: parsedUser?.perfil || parsedUser?.rol || parsedUser?.tipo || "admin",
      })
    } catch (error) {
      console.error("Error al parsear el usuario desde localStorage:", error)
    }

    const handleAvatarUpdated = (event) => {
      setAvatarUrl(event.detail || "")
    }

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };

    window.addEventListener("avatar-updated", handleAvatarUpdated)
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated)
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [pathname, navigate])

  useEffect(() => {
    const checkBreakpoint = () => setSidebarOpen(window.innerWidth >= 1024)
    checkBreakpoint()
    window.addEventListener("resize", checkBreakpoint)
    return () => window.removeEventListener("resize", checkBreakpoint)
  }, [])

  const getIniciales = (name) => {
    if (!name) return "AD"
    const parts = name.trim().split(" ")
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const avatarFallback = getIniciales(userData.nombrecompleto)

  // Opciones que el perfil puede ver (el servidor igual controla cada ruta)
  const visibles = navigation.filter((item) =>
    permisos.includes(item.requiredPermission) || permisos.includes(item.requiredPermission.replace(':consulta', ':ver')))
  // "/admin" (Resumen) solo se marca en su propia página, no en todas las de adentro
  const esActivo = (item) => item.href === "/admin" ? pathname === "/admin" : pathname === item.href || pathname.startsWith(item.href + "/")

  const handleLogout = () => {
    cerrarSesionEnServidor()
    localStorage.removeItem("usuario")
    localStorage.removeItem("avatarUrl")
    localStorage.removeItem("permisos")
    navigate("/login", { replace: true })
  }

  return (
    
    <div className="min-h-screen bg-background">
      {/* Menú lateral: solo en la computadora. En el celular se usa el desplegable de arriba a la derecha */}
      <aside
        className={`hidden lg:block fixed top-0 left-0 z-50 h-full w-[272px] bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex h-[72px] items-center justify-between px-5 border-b border-sidebar-border">
            <Link to="/inicio" aria-label="Ir a la página principal" className="flex items-center gap-3">
              <img src={tema === "claro" ? "/bravos-logo-claro.png" : "/bravos-logo.png"} alt="Bravos Box" className="h-[30px] w-auto" />
            </Link>
            <button aria-label="Ocultar menú lateral" className="grid h-11 w-11 place-items-center rounded-[10px] text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            {/* Primero: volver al sitio público del box */}
            <div className="mb-1 border-b border-sidebar-border pb-1">
              <EnlacePaginaPrincipal />
            </div>
            {GRUPOS.map((g) => {
              const delGrupo = visibles.filter((item) => item.grupo === g.key)
              if (delGrupo.length === 0) return null
              return (
                <div key={g.key} className="space-y-0.5">
                  <TituloGrupo titulo={g.titulo} />
                  {delGrupo.map((item) => {
                    const isActive = esActivo(item)
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex min-h-[42px] items-center gap-3 py-2 rounded-[10px] text-sm font-semibold transition-all ${
                          isActive
                            ? "px-3 bg-lime-400/15 text-lime-700 dark:bg-[#16220a] dark:text-lime-400"
                            : "px-3 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        }`}
                        onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                      >
                        <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-lime-700 dark:text-lime-400" : ""}`} />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </nav>



          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-1">
              {/* Tocar la tarjeta lleva al perfil */}
              <Link
                to="/admin/perfil"
                title="Ver mi perfil"
                onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-lime-400 bg-lime-400/15 text-[13px] font-extrabold text-lime-700 dark:bg-[#1f2a0e] dark:text-lime-400">
                  {avatarFallback}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {userData.nombrecompleto}
                  </p>
                  <p className="text-xs font-medium text-lime-700 dark:text-lime-400 truncate">Administrador</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
                className="shrink-0 rounded-lg p-2 text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      
      

      <div className={`transition-[padding] duration-300 ease-in-out ${sidebarOpen ? "lg:pl-[272px]" : ""}`}>
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:h-[72px] lg:px-8">
            {!sidebarOpen && (
              <div className="hidden lg:block">
                <HamburgerButton isOpen={false} onClick={() => setSidebarOpen(true)} />
              </div>
            )}
            {/* Celular: botón para volver al sitio público, con el texto (el logo solo no se entendía) */}
            <BotonPaginaPrincipal />
            {/* Título de la pantalla (lo escribe cada página con <TituloPagina>) */}
            <div ref={setSlotTitulo} className="min-w-0 flex-1 px-3" />
            
            <div className="flex items-center gap-3">

              <div className="hidden lg:block">
                <button
                  type="button"
                  onClick={() => cambiarModoTema(tema === "oscuro" ? "claro" : "oscuro")}
                  aria-label={tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  className="grid h-11 w-11 place-items-center rounded-[10px] border border-[#cfcfc4] text-foreground transition-colors hover:bg-[rgba(128,128,128,.14)] dark:border-[#262626]"
                >
                  {tema === "oscuro" ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
                </button>
              </div>
              <NotificacionesBell variante="bx" />
              
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 focus:outline-none">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-lime-400 bg-lime-400/15 text-xs font-extrabold text-lime-700 dark:bg-[#1f2a0e] dark:text-lime-400">
                    {avatarFallback}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                

                

                <UserMenu
                  panelActual="admin"
                  userData={userData}
                  avatarUrl={avatarUrl}
                  userMenuOpen={userMenuOpen}
                  setUserMenuOpen={setUserMenuOpen}
                  handleLogout={handleLogout}
                  tieneModulosAdmin={panelesPermitidos().admin}
                  tieneModulosAlumno={panelesPermitidos().alumno}
                  tieneModulosProfesor={panelesPermitidos().profesor}
                  puedeAccederPanel={true}
                />
              </div>
            </div>
          </div>

        </header>

        {/* "Más" (barra de abajo, celular): hoja que sube desde abajo con todas las opciones */}
        <HojaMas
          abierto={menuMovilAbierto}
          onCerrar={() => setMenuMovilAbierto(false)}
          grupos={GRUPOS}
          items={visibles}
          esActivo={esActivo}
          onLogout={handleLogout}
          conTema
        />
        <main className="p-4 lg:p-6 pb-36 lg:pb-6">
          {/* "Volver" solo en submódulos (pantallas dentro de un módulo). En las pantallas principales no hay botón */}
          {rutaPadre(location.pathname) && <BotonVolver a={rutaPadre(location.pathname)} texto="Volver" className="mb-4" />}
          <SlotTituloContext.Provider value={slotTitulo}>{children}</SlotTituloContext.Provider>
        </main>

        {/* Mobile Bottom Navigation */}
        {/* Con 5 accesos, el del medio (Clases) va destacado */}
        <BarraInferior items={[...visibles.slice(0, 4), { name: "Más", mobileLabel: "Más", href: "#", icon: Menu, alTocar: () => setMenuMovilAbierto((v) => !v), activo: menuMovilAbierto }].map((item, i, arr) => ({ ...item, activo: item.alTocar ? menuMovilAbierto : esActivo(item), centro: arr.length === 5 && i === 2 }))} compactaForzada={menuMovilAbierto} />
      </div>

      <BravoChat rol="admin" />
      {/* Primera vez con la app instalada: invitación a activar los avisos en el celular */}
      <InvitacionAvisos />
    </div>
  )
}