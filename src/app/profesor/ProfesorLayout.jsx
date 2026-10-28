import { cerrarSesionEnServidor } from "@/lib/sesion"
import { useEffect, useState, useRef } from "react"
import { SlotTituloContext } from "@/lib/slotTitulo"
import { usePermisosVivos } from "@/lib/sincronizarPermisos"
import UserMenu from "@/components/UserMenu"
import { panelesPermitidos } from "@/lib/paneles"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"
import {
  User,
  X,
  ChevronDown,
  FileText,
  Home,
  ClipboardCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ModeToggle"
import HamburgerButton from "@/components/HamburgerButton"
import NotificacionesBell from "@/components/NotificacionesBell"
import BravoChat from "@/components/BravoChat"
import InvitacionAvisos from "@/components/InvitacionAvisos"
import { MenuMovil, FondoMenuMovil, EnlacePaginaPrincipal, BotonPaginaPrincipal } from "@/components/MenuPanel"
import { BarraInferior } from '@/components/BarraInferior'

// Pocas opciones: un solo grupo, sin título
const GRUPOS = [{ key: "inicio", titulo: null }]

const navigation = [
  { name: "Asistencia", mobileLabel: "Asistencia", href: "/profesor", icon: ClipboardCheck, grupo: "inicio" },
  { name: "Mis Rutinas", mobileLabel: "Rutinas", href: "/profesor/rutinas", icon: FileText, grupo: "inicio" },
  { name: "Perfil", mobileLabel: "Perfil", href: "/profesor/perfil", icon: User, grupo: "inicio" },
]

// "/profesor" (Asistencia) solo se marca en su propia página, no en Rutinas ni Perfil
const esActivo = (item, pathname) =>
  item.href === "/profesor" ? pathname === "/profesor" : pathname === item.href || pathname.startsWith(item.href + "/")

export default function ProfesorLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  usePermisosVivos() // el menú de paneles se actualiza solo cuando cambian los permisos
  const [slotTitulo, setSlotTitulo] = useState(null) // lugar del título de la pantalla en la barra de arriba
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
    cerrarSesionEnServidor()
    localStorage.clear();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Menú lateral: solo en la computadora. En el celular se usa el desplegable de arriba a la derecha */}
      <aside className={`hidden lg:block fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-lime-400/30">
            <Link to="/inicio" aria-label="Ir a la página principal" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Bravos Box" className="w-10 h-10 rounded-lg" />
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
            {navigation.map((item) => {
              const isActive = esActivo(item, pathname)
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
          </nav>
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
            {/* Celular: logo que lleva a la página principal, como en los otros paneles */}
            {/* Celular: botón para volver al sitio público, con el texto (el logo solo no se entendía) */}
            <BotonPaginaPrincipal />
            {/* Título de la pantalla (lo escribe cada página con <TituloPagina>) */}
            <div ref={setSlotTitulo} className="min-w-0 flex-1 px-3" />

            <div className="flex items-center gap-3">
              
              <div className="hidden lg:block"><ModeToggle /></div>
              
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
                  panelActual="profesor"
                  userData={{ nombrecompleto: usuario.nombre, correo: usuario.email }}
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

          {/* Menú desplegable del celular: igual que en los paneles de alumno y administrador */}
          <MenuMovil
            abierto={menuMovilAbierto}
            onCerrar={() => setMenuMovilAbierto(false)}
            grupos={GRUPOS}
            items={navigation}
            esActivo={(item) => esActivo(item, pathname)}
            onLogout={handleLogout}
            conTema
          />
        </header>

        <FondoMenuMovil abierto={menuMovilAbierto} onCerrar={() => setMenuMovilAbierto(false)} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          {/* Celular: "Volver" en Mis Rutinas (el Perfil ya trae el suyo); no en Asistencia, que es el inicio */}
          {location.pathname === "/profesor/rutinas" && (
            <BotonVolver a="/profesor" texto="Volver" className="mb-4 lg:hidden" />
          )}
          <SlotTituloContext.Provider value={slotTitulo}>{children}</SlotTituloContext.Provider>
        </main>

        {/* Mobile Bottom Navigation */}
        <BarraInferior items={navigation.map(item => ({ ...item, activo: esActivo(item, pathname) }))} onNavegar={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }} />
      </div>

      <BravoChat rol="profesor" />
      {/* Primera vez con la app instalada: invitación a activar los avisos en el celular */}
      <InvitacionAvisos />
    </div>
  )
}