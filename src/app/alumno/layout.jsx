import { useEffect, useState, useRef } from "react"
import UserMenu from "@/components/UserMenu"
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
  Home,
  Shield,
  Dumbbell,
  ClipboardCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ModeToggle"
import HamburgerButton from "@/components/HamburgerButton"
import NotificacionesBell from "@/components/NotificacionesBell"
import apiClient from "@/api"

const navigation = [
  { name: "Dashboard", mobileLabel: "Inicio", href: "/alumno", icon: LayoutDashboard },
  { name: "Reservar Clase", mobileLabel: "Reservar", href: "/alumno/reservar", icon: Calendar },
  { name: "Mis Reservas", mobileLabel: "Reservas", href: "/alumno/reservas", icon: History },
  { name: "Mis Créditos", mobileLabel: "Créditos", href: "/alumno/creditos", icon: CreditCard },
  { name: "Mi Perfil", mobileLabel: "Perfil", href: "/alumno/perfil", icon: User },
]

export default function AlumnoLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef(null)
  
  const [userData, setUserData] = useState({
    idUsuario: null,
    nombrecompleto: "Usuario Bravos",
    correo: "alumno@email.com",
    perfil: "alumno",
  })
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem("avatarUrl") || "")
  
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

      if (idUserReal) {
        apiClient.get(`/usuarios/${idUserReal}/abonos`)
          .then((response) => {
            const abonos = response.data?.data || response.data || []
            const hoy = new Date()
            hoy.setHours(0, 0, 0, 0)
            const activo = abonos.some(abono => {
              if (abono.estado !== 'ACTIVO') return false
              if (!abono.vencimiento) return true
              const venc = new Date(abono.vencimiento)
              venc.setHours(0, 0, 0, 0)
              return venc >= hoy
            })
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

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    const handleAvatarUpdated = (event) => setAvatarUrl(event.detail || "")
    window.addEventListener("avatar-updated", handleAvatarUpdated)
    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated)
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [])

  useEffect(() => {
    const checkBreakpoint = () => setSidebarOpen(window.innerWidth >= 1024)
    checkBreakpoint()
    window.addEventListener("resize", checkBreakpoint)
    return () => window.removeEventListener("resize", checkBreakpoint)
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
        <div className="fixed inset-0 bg-background/50 dark:bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}


      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-lime-400/30">
            <Link to="/alumno" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Bravos Gym" width={40} height={40} className="rounded-lg" />
              <span className="text-base font-black tracking-widest text-sidebar-foreground">BRAVOS</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-0.5">
            {navigation.map((item) => {
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
                  : getIniciales(userData.nombrecompleto)
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{userData.nombrecompleto}</p>
                <p className="text-xs text-muted-foreground truncate">{userData.correo}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ease-in-out ${sidebarOpen ? "lg:pl-64" : ""}`}>
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <HamburgerButton isOpen={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex-1" />
            <div className="flex items-center gap-3">
              <ModeToggle />
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2" onClick={() => window.location.href = '/'}>
                <Home className="h-4 w-4" /> Ver Sitio
              </Button>

              <NotificacionesBell />
              
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 focus:outline-none transition-transform hover:scale-105 active:scale-95">
                  <div className="h-9 w-9 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-xs overflow-hidden">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={userData.nombrecompleto} className="h-full w-full object-cover" />
                      : getIniciales(userData.nombrecompleto)
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

        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {validandoAcceso ? (
            <div className="flex items-center justify-center min-h-[50vh]">
              <p className="text-sm text-muted-foreground animate-pulse">Sincronizando credenciales de acceso con Bravos Box...</p>
            </div>
          ) : !tieneAbonoActivo && pathname !== '/alumno/perfil' ? (
            /* 🛑 CORTE DE FLUJO: Pantalla de bloqueo si no tiene créditos o pagos activos */
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-border rounded-2xl max-w-2xl mx-auto mt-8 shadow-xl">
              <div className="p-4 mb-4 text-destructive bg-destructive/10 rounded-full animate-bounce">
                <ShieldAlert className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">MEMBRESÍA COMPROMETIDA O INEXISTENTE</h2>
              <p className="text-muted-foreground max-w-md text-sm leading-relaxed mb-6">
                Detectamos que tu usuario no registra un pase de abono activo con créditos disponibles en el sistema.
              </p>
              <div className="p-4 rounded-xl bg-background/40 dark:bg-black/40 border border-border text-left w-full text-xs text-muted-foreground space-y-2 mb-6">
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

        {/* Mobile Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 bg-sidebar border-t border-sidebar-border lg:hidden">
          <div className="flex items-center justify-around">
            {navigation.map(item => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                  className={`flex flex-col items-center gap-1 py-3 px-1 flex-1 min-w-0 transition-colors ${isActive ? "text-lime-400" : "text-sidebar-foreground/50"}`}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{item.mobileLabel}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}