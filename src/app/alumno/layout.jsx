import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Calendar,
  History,
  CreditCard,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  ShieldAlert,
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
// 🟢 Importamos el cliente para consultar los abonos en tiempo real
import apiClient from "@/api"

const navigation = [
  { name: "Dashboard", href: "/alumno", icon: LayoutDashboard },
  { name: "Reservar Clase", href: "/alumno/reservar", icon: Calendar },
  { name: "Mis Reservas", href: "/alumno/reservas", icon: History },
  { name: "Mis Créditos", href: "/alumno/creditos", icon: CreditCard },
  { name: "Mi Perfil", href: "/alumno/perfil", icon: User },
]

export default function AlumnoLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userData, setUserData] = useState({
    idUsuario: null,
    nombrecompleto: "Usuario Bravos",
    correo: "alumno@email.com",
    perfil: "alumno",
  })
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem("avatarUrl") || "")
  
  // 🟢 ESTADOS PARA EL CONTROL DE ACCESO COMERCIAL
  const [tieneAbonoActivo, setTieneAbonoActivo] = useState(true)
  const [validandoAcceso, setValidandoAcceso] = useState(true)

  const location = useLocation()
  const navigate = useNavigate()
  const pathname = location.pathname

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario")
    const storedAvatar = localStorage.getItem("avatarUrl")

    if (storedAvatar) setAvatarUrl(storedAvatar)
    if (!storedUser) {
      setValidandoAcceso(false)
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      if (parsedUser?.avatarUrl) {
        localStorage.setItem("avatarUrl", parsedUser.avatarUrl)
        setAvatarUrl(parsedUser.avatarUrl)
      }

      const idUserReal = parsedUser?.idUsuario || parsedUser?.id || null;

      setUserData({
        idUsuario: idUserReal,
        nombrecompleto: parsedUser?.nombrecompleto || parsedUser?.nombre || parsedUser?.username || "Usuario Bravos",
        correo: parsedUser?.correo || parsedUser?.email || "alumno@email.com",
        perfil: parsedUser?.perfil || parsedUser?.rol || parsedUser?.tipo || "alumno",
      })

      // 🟢 CONTROL DE ACCESO: Consultamos los abonos reales vinculados al ID del usuario
      if (idUserReal) {
        apiClient.get(`/usuarios/${idUserReal}/abonos`)
          .then((response) => {
            const abonos = response.data?.data || response.data || []
            // Validamos si posee al menos un abono activo en su historial
            const activo = abonos.some(abono => abono.estado === 'ACTIVO')
            setTieneAbonoActivo(activo)
          })
          .catch((err) => {
            console.error("Error validando el estado comercial del alumno:", err)
            setTieneAbonoActivo(false)
          })
          .finally(() => {
            setValidandoAcceso(false)
          })
      } else {
        setValidandoAcceso(false)
      }

    } catch (error) {
      console.error("Error al inicializar sesión en el layout:", error)
      setValidandoAcceso(false)
    }

    const handleAvatarUpdated = (event) => {
      setAvatarUrl(event.detail || "")
    }

    window.addEventListener("avatar-updated", handleAvatarUpdated)
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdated)
  }, [])

  const getIniciales = (name) => {
    if (!name) return "BR"
    const parts = name.trim().split(" ")
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR NAVEGACIÓN */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <Link to="/alumno" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Bravos Gym" width={48} height={48} className="rounded-lg" />
              <span className="text-lg font-bold text-accent">BRAVOS</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
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
                  {getIniciales(userData.nombrecompleto)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{userData.nombrecompleto}</p>
                <p className="text-xs text-muted-foreground truncate">{userData.correo}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={avatarUrl} alt={userData.nombrecompleto} />
                      <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">{getIniciales(userData.nombrecompleto)}</AvatarFallback>
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
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* 🟢 RENDERIZADO CONDICIONAL DE CONTROL DE ACCESO */}
        <main className="p-4 lg:p-6">
          {validandoAcceso ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <p className="text-sm text-muted-foreground animate-pulse">Sincronizando credenciales de acceso con Bravos Box...</p>
            </div>
          ) : !tieneAbonoActivo ? (
            /* 🛑 CORTE DE FLUJO: Pantalla de bloqueo si no tiene créditos o pagos activos */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-border rounded-2xl max-w-2xl mx-auto mt-8 shadow-xl">
              <div className="p-4 mb-4 text-destructive bg-destructive/10 rounded-full animate-bounce">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">MEMBRESÍA COMPROMETIDA O INEXISTENTE</h2>
              <p className="text-muted-foreground max-w-md text-sm leading-relaxed mb-6">
                Detectamos que tu usuario no registra un pase de abono activo con créditos disponibles en el sistema.
              </p>
              <div className="p-4 rounded-xl bg-black/40 border border-border text-left w-full text-xs text-muted-foreground space-y-2 mb-6">
                <p>• <strong>Para regularizar:</strong> Deberás presentarte en la recepción del Box.</p>
                <p>• <strong>Administración:</strong> Podrán darte de alta cargando el abono y registrando tu pago en la cuenta corriente.</p>
              </div>
              <Button onClick={handleLogout} variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 font-bold">
                <LogOut className="mr-2 h-4 w-4" /> Salir del Sistema
              </Button>
            </div>
          ) : (
            /* ACCESO CONCEDIDO: Muestra las pantallas con sus datos reales */
            children
          )}
        </main>
      </div>
    </div>
  )
}