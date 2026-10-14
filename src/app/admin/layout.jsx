import { cerrarSesionEnServidor } from "@/lib/sesion"
import { useEffect, useState, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"
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
  Home,
  BarChart3,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ModeToggle"
import HamburgerButton from "@/components/HamburgerButton"
import NotificacionesBell from "@/components/NotificacionesBell"
import BravoChat from "@/components/BravoChat"
import InvitacionAvisos from "@/components/InvitacionAvisos"
import { TituloGrupo, MenuMovil, FondoMenuMovil, EnlacePaginaPrincipal, BotonPaginaPrincipal } from "@/components/MenuPanel"
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
  { name: "Avisos WhatsApp", mobileLabel: "Avisos", href: "/admin/avisos", icon: MessageCircle, requiredPermission: "clases:consulta", grupo: "gestion" },
  { name: "Perfiles", mobileLabel: "Perfiles", href: "/admin/perfiles", icon: Shield, requiredPermission: "perfiles:consulta", grupo: "sistema" },
  { name: "Configuración del Box", mobileLabel: "Config", href: "/admin/configuracion", icon: Settings, requiredPermission: "configuracion:consulta", grupo: "sistema" },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
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
        className={`hidden lg:block fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-lime-400/30">
            <Link to="/inicio" aria-label="Ir a la página principal" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Bravos Gym" width={40} height={40} className="rounded-lg" />
              <span className="text-base font-black tracking-widest text-sidebar-foreground">BRAVOS</span>
            </Link>
            <button className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors p-1" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
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
                        className={`flex items-center gap-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all ${
                          isActive
                            ? "border-l-2 border-l-lime-600 dark:border-l-lime-400 pl-[10px] pr-3 bg-lime-400/10 text-lime-700 dark:text-lime-400"
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
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-10 w-10 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-sm overflow-hidden">
                {avatarUrl
                  ? <img src={avatarUrl} alt={userData.nombrecompleto} className="h-full w-full object-cover" />
                  : avatarFallback
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userData.nombrecompleto}
                </p>
                <p className="text-xs text-muted-foreground truncate">{userData.correo}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="shrink-0 p-1.5 text-sidebar-foreground/30 hover:text-red-700 dark:hover:text-red-400 transition-colors rounded"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      
      

      <div className={`transition-[padding] duration-300 ease-in-out ${sidebarOpen ? "lg:pl-64" : ""}`}>
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            {!sidebarOpen && (
              <div className="hidden lg:block">
                <HamburgerButton isOpen={false} onClick={() => setSidebarOpen(true)} />
              </div>
            )}
            {/* Celular: botón para volver al sitio público, con el texto (el logo solo no se entendía) */}
            <BotonPaginaPrincipal />
            <div className="flex-1" />
            
            <div className="flex items-center gap-3">

              <ModeToggle />
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2" onClick={() => window.location.href = '/'}>
                <Home className="h-4 w-4" /> 
              </Button>

              <NotificacionesBell />
              
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 focus:outline-none">
                  <div className="h-9 w-9 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-xs overflow-hidden">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={userData.nombrecompleto} className="h-full w-full object-cover" />
                      : avatarFallback
                    }
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

              <HamburgerButton
                isOpen={menuMovilAbierto}
                onClick={() => setMenuMovilAbierto((v) => !v)}
                className="lg:hidden text-foreground"
              />
            </div>
          </div>

          {/* Menú desplegable del celular: igual que en los paneles de alumno y profesor */}
          <MenuMovil
            abierto={menuMovilAbierto}
            onCerrar={() => setMenuMovilAbierto(false)}
            grupos={GRUPOS}
            items={visibles}
            esActivo={esActivo}
            onLogout={handleLogout}
          />
        </header>

        <FondoMenuMovil abierto={menuMovilAbierto} onCerrar={() => setMenuMovilAbierto(false)} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {/* Celular: "Volver" en las secciones del menú (Usuarios, Clases, Planes…); no en el Resumen */}
          {/* Dentro de una sección de Configuración, la propia pantalla muestra "← Configuración" */}
          {location.pathname !== "/admin" && navigation.some((n) => n.href === location.pathname) && !location.search.includes("seccion=") && (
            <BotonVolver a="/admin" texto="Volver" className="mb-4 lg:hidden" />
          )}
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        {/* Con 5 accesos, el del medio (Clases) va destacado */}
        <BarraInferior items={visibles.slice(0, 5).map((item, i, arr) => ({ ...item, activo: esActivo(item), centro: arr.length === 5 && i === 2 }))} />
      </div>

      <BravoChat rol="admin" />
      {/* Primera vez con la app instalada: invitación a activar los avisos en el celular */}
      <InvitacionAvisos />
    </div>
  )
}