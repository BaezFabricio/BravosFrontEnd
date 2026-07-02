import { useEffect, useState, useRef } from "react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const navigation = [
  { name: "Asistencia", href: "/profesor", icon: ClipboardCheck },
  { name: "Mis Rutinas", href: "/profesor/rutinas", icon: FileText },
  { name: "Perfil", href: "/profesor/perfil", icon: User },
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center p-4 border-b border-sidebar-border">
            <img src="/logo.jpg" alt="Logo" className="w-10 h-10 rounded-lg mr-3" />
            <span className="font-bold text-accent">BRAVOS</span>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${pathname === item.href ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent"}`} onClick={() => setSidebarOpen(false)}>
                <item.icon className="h-5 w-5" /> {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu /></button>
            <div className="flex-1" />
            
            <div className="flex items-center gap-4"> {/* Ajustamos el gap aquí */}
              <ModeToggle />
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden sm:flex items-center justify-center gap-2 px-3 py-0 h-9 hover:bg-zinc-900 transition-all" 
                onClick={() => window.location.href = '/'}
              >
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" /> 
                  <span className="text-sm font-medium translate-y-[1px]">Ver Sitio</span>
                </div>
              </Button>

              {/* Campanita Alineada */}
              <button className="relative p-2 rounded-full hover:bg-zinc-900 transition-colors">
                <Bell className="h-5 w-5 text-zinc-400" />
                <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white ring-2 ring-background">
                  3
                </span>
              </button>
              
              {/* GLOBITO IDÉNTICO AL LANDING */}
              <div className="relative" ref={menuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-1 focus:outline-none">
                  <Avatar className="h-9 w-9 border border-green-600 bg-green-700">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-green-700 text-white text-xs">{usuario.iniciales}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 rounded-md border border-zinc-800 bg-[#0c0c0e] shadow-2xl z-50 overflow-hidden">
                      <div className="border-b border-zinc-800 p-4">
                        <p className="text-sm font-bold text-white capitalize">{usuario.nombre}</p>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{usuario.email}</p>
                      </div>
                      <div className="p-1">
                        <Link to="/profesor/perfil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900 transition-colors">
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