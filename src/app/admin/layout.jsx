import { useEffect, useState, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { useNavigate } from "react-router-dom"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/ModeToggle"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, requiredPermission: "dashboard:consulta" },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users, requiredPermission: "usuarios:consulta" },
  { name: "Clases", href: "/admin/clases", icon: Calendar, requiredPermission: "clases:consulta" },
  { name: "Planes", href: "/admin/planes", icon: CreditCard, requiredPermission: "membresias:consulta" },
  { name: "Reportes", href: "/admin/reportes", icon: BarChart3, requiredPermission: "dashboard:consulta" },
  { name: "Perfiles", href: "/admin/perfiles", icon: Shield, requiredPermission: "perfiles:consulta" },
  { name: "Configuración", href: "/admin/configuracion", icon: Settings, requiredPermission: "configuracion:consulta" },
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
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <Link 
              to="/" 
              onClick={() => window.location.href = '/'} 
              className="flex items-center gap-3"
            >
              <img
                src="/logo.jpg"
                alt="Bravos Gym"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-accent">BRAVOS</span>
            </Link>
            <button
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          

          <nav className="flex-1 p-4 space-y-1">
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          

          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="h-10 w-10 border border-sidebar-border">
                <AvatarImage src={avatarUrl} alt={userData.nombrecompleto} />
                <AvatarFallback className="bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userData.nombrecompleto}
                </p>
                <p className="text-xs text-muted-foreground truncate">{userData.correo}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      
      

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu /></button>
            <div className="flex-1" />
            
            <div className="flex items-center gap-4">
              <ModeToggle />
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2" onClick={() => window.location.href = '/'}>
                <Home className="h-4 w-4" /> Ver Sitio
              </Button>

              <button className="relative p-2 rounded-full hover:bg-zinc-900 transition-colors">
                <Bell className="h-5 w-5 text-zinc-400" />
                
                {/* Este es el círculo que debe quedar superpuesto */}
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white ring-2 ring-background">
                  3
                </span>
              </button>
              
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 focus:outline-none">
                  <Avatar className="h-9 w-9 border border-green-600 bg-green-700">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-green-700 text-white text-xs">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                

                

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 rounded-md border border-zinc-800 bg-[#0c0c0e] shadow-2xl z-50 overflow-hidden">
                      <div className="border-b border-zinc-800 p-4">
                        <p className="text-sm font-bold text-white capitalize">{userData.nombrecompleto}</p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{userData.correo}</p>
                      </div>
                      <div className="p-1">
                        <Link to="/admin/perfil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900 transition-colors">
                          <User className="h-4 w-4 text-zinc-400" /> Mi Perfil
                        </Link>
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900 transition-colors">
                          <Shield className="h-4 w-4 text-zinc-400" /> Panel de Control
                        </Link>
                        <Link to="/alumno" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900 transition-colors">
                          <Dumbbell className="h-4 w-4 text-zinc-400" /> Panel de Alumno
                        </Link>
                        <Link to="/profesor" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900 transition-colors">
                          <ClipboardCheck className="h-4 w-4 text-zinc-400" /> Panel de Profesor
                        </Link>
                        <button onClick={handleLogout} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-950/20 border-t border-zinc-800/60">
                          <LogOut className="h-4 w-4 text-red-500" /> Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}