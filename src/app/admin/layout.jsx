import { useEffect, useState, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import UserMenu from "@/components/UserMenu"
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ClipboardCheck,
  Dumbbell,
  ChevronDown,
  Bell,
  Home,
  User,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ModeToggle"
import HamburgerButton from "@/components/HamburgerButton"
import NotificacionesBell from "@/components/NotificacionesBell"

const navigation = [
  { name: "Dashboard", mobileLabel: "Inicio", href: "/admin", icon: LayoutDashboard, requiredPermission: "dashboard:consulta" },
  { name: "Usuarios", mobileLabel: "Usuarios", href: "/admin/usuarios", icon: Users, requiredPermission: "usuarios:consulta" },
  { name: "Clases", mobileLabel: "Clases", href: "/admin/clases", icon: Calendar, requiredPermission: "clases:consulta" },
  { name: "Planes", mobileLabel: "Planes", href: "/admin/planes", icon: CreditCard, requiredPermission: "membresias:consulta" },
  { name: "Reportes", mobileLabel: "Reportes", href: "/admin/reportes", icon: BarChart3, requiredPermission: "dashboard:consulta" },
  { name: "Perfiles", mobileLabel: "Perfiles", href: "/admin/perfiles", icon: Shield, requiredPermission: "perfiles:consulta" },
  { name: "Configuración", mobileLabel: "Config", href: "/admin/configuracion", icon: Settings, requiredPermission: "configuracion:consulta" },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
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

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("usuario")
    localStorage.removeItem("avatarUrl")
    localStorage.removeItem("permisos")
    navigate("/login", { replace: true })
  }

  return (
    
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/50 dark:bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-lime-400/30">
            <Link
              to="/"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-3"
            >
              <img src="/logo.jpg" alt="Bravos Gym" width={40} height={40} className="rounded-lg" />
              <span className="text-base font-black tracking-widest text-sidebar-foreground">BRAVOS</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navigation.map((item) => {
              const tieneAcceso =
                permisos.includes(item.requiredPermission) ||
                permisos.includes(item.requiredPermission.replace(':consulta', ':ver'));

              if (!tieneAcceso) return null;

              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all ${
                    isActive
                      ? "border-l-2 border-lime-400 pl-[10px] pr-3 bg-lime-400/10 text-lime-400"
                      : "px-3 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                  onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-lime-400" : ""}`} />
                  {item.name}
                </Link>
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
                className="shrink-0 p-1.5 text-sidebar-foreground/30 hover:text-red-400 transition-colors rounded"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      
      

      <div className={`transition-[padding] duration-300 ease-in-out ${sidebarOpen ? "lg:pl-64" : ""}`}>
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            <HamburgerButton isOpen={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex-1" />
            
            <div className="flex items-center gap-4">
              <ModeToggle />
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2" onClick={() => window.location.href = '/'}>
                <Home className="h-4 w-4" /> Ver Sitio
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
                  userData={userData}
                  avatarUrl={avatarUrl}
                  userMenuOpen={userMenuOpen}
                  setUserMenuOpen={setUserMenuOpen}
                  handleLogout={handleLogout}
                  tieneModulosAdmin={true}
                  tieneModulosAlumno={true}
                  tieneModulosProfesor={true}
                  puedeAccederPanel={true}
                />
              </div>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-sidebar border-t border-sidebar-border lg:hidden">
          <div className="flex items-center justify-around">
            {navigation
              .filter(item => permisos.includes(item.requiredPermission) || permisos.includes(item.requiredPermission.replace(':consulta', ':ver')))
              .slice(0, 5)
              .map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex flex-col items-center gap-1 py-3 px-1 flex-1 min-w-0 transition-colors ${isActive ? "text-lime-400" : "text-sidebar-foreground/50"}`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{item.mobileLabel}</span>
                  </Link>
                )
              })
            }
          </div>
        </nav>
      </div>
    </div>
  )
}