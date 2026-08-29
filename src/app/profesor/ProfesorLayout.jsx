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
  FileText,
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

const navigation = [
  { name: "Asistencia", mobileLabel: "Asistencia", href: "/profesor", icon: ClipboardCheck },
  { name: "Mis Rutinas", mobileLabel: "Rutinas", href: "/profesor/rutinas", icon: FileText },
  { name: "Perfil", mobileLabel: "Perfil", href: "/profesor/perfil", icon: User },
]

export default function ProfesorLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [usuario, setUsuario] = useState({ nombre: "Cargando...", email: "", iniciales: "??" })
  const [avatarUrl, setAvatarUrl] = useState("")
  const menuRef = useRef(null)
  
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
    setUsuario({
      nombre: user.nombrecompleto || user.nombre || "Profesor",
      email: user.email || user.correo || "No disponible",
      iniciales: (user.nombrecompleto || user.nombre || "PR").substring(0, 2).toUpperCase()
    });
    setAvatarUrl(user.avatarUrl || localStorage.getItem("avatarUrl") || "");

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    const handleAvatarUpdated = (e) => setAvatarUrl(e.detail || "");

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("avatar-updated", handleAvatarUpdated);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("avatar-updated", handleAvatarUpdated);
    };
  }, []);

  useEffect(() => {
    const checkBreakpoint = () => setSidebarOpen(window.innerWidth >= 1024)
    checkBreakpoint()
    window.addEventListener("resize", checkBreakpoint)
    return () => window.removeEventListener("resize", checkBreakpoint)
  }, [])

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-lime-400/30">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-lg" />
              <span className="text-base font-black tracking-widest text-sidebar-foreground">BRAVOS</span>
            </div>
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
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ease-in-out ${sidebarOpen ? "lg:pl-64" : ""}`}>
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            <HamburgerButton isOpen={sidebarOpen} onClick={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex-1" />
            
            <div className="flex items-center gap-4"> {/* Ajustamos el gap aquí */}
              <ModeToggle />
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex items-center justify-center gap-2 px-3 py-0 h-9 hover:bg-muted transition-all" 
                onClick={() => window.location.href = '/'}
              >
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> 
                  <span className="text-sm font-medium translate-y-[1px]"></span>
                </div>
              </Button>

              <NotificacionesBell />
              
              {/* GLOBITO IDÉNTICO AL LANDING */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 focus:outline-none">
                  <div className="h-9 w-9 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-xs overflow-hidden">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={usuario.nombre} className="h-full w-full object-cover" />
                      : usuario.iniciales
                    }
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                <UserMenu
                  userData={{ nombrecompleto: usuario.nombre, correo: usuario.email }}
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