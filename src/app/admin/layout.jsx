import { useEffect, useState } from "react"
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
  ChevronDown,
  Bell,
  Home, 
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 🟢 ASOCIAMOS CADA MENÚ CON SU PERMISO DE CONSULTA CORRESPONDIENTE
const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, requiredPermission: "dashboard:consulta" },
  { name: "Usuarios", href: "/admin/usuarios", icon: Users, requiredPermission: "usuarios:consulta" },
  { name: "Clases", href: "/admin/clases", icon: Calendar, requiredPermission: "clases:consulta" },
  { name: "Perfiles", href: "/admin/perfiles", icon: Shield, requiredPermission: "perfiles:consulta" },
  { name: "Configuración", href: "/admin/configuracion", icon: Settings, requiredPermission: "configuracion:consulta" },
]

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userData, setUserData] = useState({
    nombrecompleto: "Administrador",
    correo: "admin@bravos.com",
    perfil: "admin",
  })
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem("avatarUrl") || "")
  
  // 🟢 ESTADO PARA LEER LOS PERMISOS GUARDADOS EN EL LOGIN
  const [permisos, setPermisos] = useState([])
  
  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario")
    const storedAvatar = localStorage.getItem("avatarUrl")
    const storedPermisos = localStorage.getItem("permisos") // 👈 Traemos los permisos

    if (storedAvatar) setAvatarUrl(storedAvatar)

    // 🟢 CARGAMOS LOS PERMISOS EN EL ESTADO GLOBAL DEL LAYOUT
    if (storedPermisos) {
      try {
        setPermisos(JSON.parse(storedPermisos))
      } catch (e) {
        console.error("Error al parsear permisos en el AdminLayout:", e)
      }
    }

    if (!storedUser) return

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

    window.addEventListener("avatar-updated", handleAvatarUpdated)
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdated)
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
    localStorage.removeItem("permisos") // 👈 Limpiamos permisos al salir
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Lateral */}
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

          {/* Menú de navegación principal protegido */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              // 🟢 COMPROBAMOS SI EL USUARIO TIENE EL PERMISO (Admite tanto 'consulta' como 'ver')
              const tieneAcceso = 
                permisos.includes(item.requiredPermission) || 
                permisos.includes(item.requiredPermission.replace(':consulta', ':ver'));

              // Si no tiene el permiso para este módulo, lo salteamos y no dibujamos nada
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

      {/* Contenedor Principal */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <button
              className="lg:hidden text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 text-muted-foreground hover:text-foreground hidden sm:flex"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4" />
                Ver Sitio
              </Button>

              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-accent-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={avatarUrl} alt={userData.nombrecompleto} />
                      <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                        {avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userData.nombrecompleto}</p>
                    <p className="text-xs text-muted-foreground">{userData.correo}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/perfil">
                      <User className="mr-2 h-4 w-4" />
                      Mi Perfil
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* 🟢 PROTEGEMOS CONFIGURACIÓN TAMBIÉN EN EL DROPDOWN SUPERIOR */}
                  {(permisos.includes('configuracion:consulta') || permisos.includes('configuracion:ver')) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin/configuracion">
                          <Settings className="mr-2 h-4 w-4" />
                          Configuración
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-destructive">
                    <button type="button" onClick={handleLogout} className="w-full text-left">
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}