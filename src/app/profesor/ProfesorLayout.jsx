import { cerrarSesionEnServidor } from "@/lib/sesion"
import { useEffect, useState, useRef } from "react"
import { SlotTituloContext } from "@/lib/slotTitulo"
import { usePermisosVivos } from "@/lib/sincronizarPermisos"
import UserMenu from "@/components/UserMenu"
import { panelesPermitidos } from "@/lib/paneles"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"
import { useEsMovil, CabeceraMovilContext } from "./movil"
import { useTemaProfesor } from "./paletaProfesor"
import HojaCuentaCelular from "@/components/HojaCuentaCelular"
import { ChevronLeft, ClipboardList } from "lucide-react"

// Submódulo = una pantalla dentro de un módulo (ej. /profesor/rutinas/5): su "Volver" lleva a la pantalla de arriba
const rutaPadre = (pathname) => {
  const partes = pathname.split("/").filter(Boolean)
  return partes.length >= 3 ? "/" + partes.slice(0, -1).join("/") : null
}
import {
  User,
  X,
  ChevronDown,
  Dumbbell,
  ClipboardCheck,
  Menu,
} from "lucide-react"
import { ModeToggle } from "@/components/ModeToggle"
import HamburgerButton from "@/components/HamburgerButton"
import CampanaProfesor from "./avisos/CampanaProfesor"
import BravoChat from "@/components/BravoChat"
import InvitacionAvisos from "@/components/InvitacionAvisos"
import { HojaMas, EnlacePaginaPrincipal, BotonPaginaPrincipal } from "@/components/MenuPanel"
import { BarraInferior } from '@/components/BarraInferior'

// Pocas opciones: un solo grupo, sin título
const GRUPOS = [{ key: "inicio", titulo: null }]

const navigation = [
  { name: "Asistencia", mobileLabel: "Asistencia", href: "/profesor", icon: ClipboardCheck, grupo: "inicio" },
  { name: "Mis Rutinas", mobileLabel: "Rutinas", href: "/profesor/rutinas", icon: Dumbbell, grupo: "inicio" },
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
  const movil = useEsMovil()
  const C = useTemaProfesor()
  const [cabecera, setCabecera] = useState(null) // la pone cada página en el celular (título, subtítulo, volver)
  const [cuentaAbierta, setCuentaAbierta] = useState(false) // menú de cuenta del celular (globo de arriba)
  // Computadora angosta (menos de 1100 px): el menú lateral queda en íconos (76 px), como en la referencia
  const [compacto, setCompacto] = useState(() => window.innerWidth < 1100)

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
    const checkBreakpoint = () => { setSidebarOpen(window.innerWidth >= 1024); setCompacto(window.innerWidth < 1100) }
    checkBreakpoint()
    window.addEventListener("resize", checkBreakpoint)
    return () => window.removeEventListener("resize", checkBreakpoint)
  }, [])

  const handleLogout = () => {
    cerrarSesionEnServidor()
    localStorage.clear();
    navigate("/login");
  }

  const escritorio = (
    <div className="min-h-screen bg-background bv-prof">
      {/* Menú lateral: solo en la computadora. En el celular se usa el desplegable de arriba a la derecha */}
      <aside style={{ width: compacto ? 76 : 260 }} className={`hidden lg:block fixed top-0 left-0 z-50 h-full bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-lime-400/30">
            <Link to="/inicio" aria-label="Ir a la página principal" className="flex min-h-[44px] items-center gap-3">
              <img src="/logo.jpg" alt="Bravos Box" className="w-10 h-10 rounded-lg" />
              <span className="text-base font-black tracking-widest text-sidebar-foreground">BRAVOS</span>
            </Link>
            <button className="grid h-[44px] w-[44px] place-items-center text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
            {/* Primero: volver al sitio público del box */}
            {!compacto && (
              <div className="mb-1 border-b border-sidebar-border pb-1">
                <EnlacePaginaPrincipal />
              </div>
            )}
            {navigation.map((item) => {
              const isActive = esActivo(item, pathname)
              // Rótulo de grupo de la referencia: MIS CLASES (asistencia, rutinas) y MI CUENTA (perfil)
              const rotulo = compacto ? null : item.href === "/profesor" ? "MIS CLASES" : item.href === "/profesor/perfil" ? "MI CUENTA" : null
              return (
                <div key={item.name}>
                  {rotulo && <div className="px-3 pb-1.5 pt-4 text-[0.6875rem] font-bold tracking-[0.12em] text-sidebar-foreground/50">{rotulo}</div>}
                  <Link
                    to={item.href}
                    aria-current={isActive ? "page" : undefined}
                    title={compacto ? item.name : undefined}
                    className={`flex min-h-[44px] items-center ${compacto ? "justify-center px-0" : "gap-3 px-3"} py-2 [@media(max-height:780px)]:py-1.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all ${
                      isActive
                        ? "border-l-2 border-l-lime-400 pl-[0.625rem] pr-3 bg-[#1f2a0e] text-lime-400"
                        : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                    onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-lime-400" : ""}`} />
                    {!compacto && item.name}
                  </Link>
                </div>
              )
            })}
          </nav>
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ease-in-out ${sidebarOpen ? "lg:pl-[var(--ancho-menu)]" : ""}`} style={{ "--ancho-menu": `${compacto ? 76 : 260}px` }}>
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-[72px] px-4">
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
              

              <CampanaProfesor movil={false} />
              
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

            </div>
          </div>
        </header>

        {/* "Más" (barra de abajo, celular): hoja que sube desde abajo con todas las opciones */}
        <HojaMas
          abierto={menuMovilAbierto}
          onCerrar={() => setMenuMovilAbierto(false)}
          grupos={GRUPOS}
          items={navigation}
          esActivo={(item) => esActivo(item, pathname)}
          onLogout={handleLogout}
          conTema
        />
        <main key={pathname} className="bv-panel-main p-4 lg:p-[24px] pb-36 lg:pb-6">
          {/* "Volver" solo en submódulos (pantallas dentro de un módulo). En las pantallas principales no hay botón */}
          {rutaPadre(location.pathname) && <BotonVolver a={rutaPadre(location.pathname)} texto="Volver" className="mb-4" />}
          <SlotTituloContext.Provider value={slotTitulo}>{children}</SlotTituloContext.Provider>
        </main>

        {/* Mobile Bottom Navigation */}
        {/* Perfil no va en la barra: está dentro de "Más" */}
        <BarraInferior
          items={[
            ...navigation.filter((item) => item.href !== "/profesor/perfil").map((item) => ({ ...item, activo: esActivo(item, pathname) })),
            { name: "Más", mobileLabel: "Más", href: "#", icon: Menu, alTocar: () => setMenuMovilAbierto((v) => !v), activo: menuMovilAbierto },
          ]}
          onNavegar={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
          compactaForzada={menuMovilAbierto}
        />
      </div>

      <BravoChat rol="profesor" />
      {/* Primera vez con la app instalada: invitación a activar los avisos en el celular */}
      <InvitacionAvisos />
    </div>
  )

  // Celular: cabecera con logo o flecha, contenido a pantalla completa y menú flotante de 3 botones
  const porDefecto = {
    "/profesor": { titulo: "Asistencia" },
    "/profesor/rutinas": { titulo: "Mis rutinas" },
    "/profesor/perfil": { titulo: "Mi perfil" },
  }
  const cab = cabecera || porDefecto[pathname] || { titulo: "Bravos" }
  const volver = cabecera?.onVolver || (rutaPadre(pathname) ? () => navigate(rutaPadre(pathname)) : null)
  // Celular: Asistencia va en el centro, como Reservar en la barra del alumno (Rutinas a la izquierda, Perfil a la derecha)
  const itemsMovil = ["/profesor/rutinas", "/profesor", "/profesor/perfil"].map((href) => {
    const item = navigation.find((n) => n.href === href)
    return { ...item, activo: esActivo(item, pathname), centro: href === "/profesor" }
  })

  const arbolMovil = (
    <div className="min-h-[100dvh] bv-prof" style={{ background: C.bg, color: C.ink }}>
      <header className="sticky top-0 z-20 flex h-[60px] items-center gap-2 border-b px-1.5" style={{ background: C.bg, borderColor: C.line, paddingTop: "env(safe-area-inset-top, 0px)" }}>
        {volver ? (
          <button onClick={volver} aria-label={cabecera?.onVolver ? "Volver a las clases del día" : "Volver"} className="grid h-11 w-11 shrink-0 place-items-center">
            <ChevronLeft className="h-[22px] w-[22px]" />
          </button>
        ) : (
          <img src="/logo.jpg" alt="Bravos Box" className="ml-2.5 h-9 w-9 shrink-0 rounded-lg object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[18px] font-extrabold leading-tight">{cab.titulo}</h1>
          {cab.sub && <div className="truncate text-xs" style={{ color: C.muted }}>{cab.sub}</div>}
        </div>
        <CampanaProfesor movil={true} />
        <button onClick={() => setCuentaAbierta(true)} aria-label="Menú de cuenta" className="grid h-11 w-11 shrink-0 place-items-center">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border-2 text-[13px] font-bold" style={{ background: C.card, borderColor: C.lime, color: C.okFg }}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : usuario.iniciales}
          </span>
        </button>
      </header>

      <main key={pathname} className="bv-panel-main flex min-h-0 flex-col gap-3.5 px-4 pt-4" style={{ paddingBottom: 124, overscrollBehavior: "contain" }}>
        <SlotTituloContext.Provider value={null}>{children}</SlotTituloContext.Provider>
      </main>

      <nav aria-label="Navegación principal" className="fixed inset-x-3 bottom-6 z-20 grid h-[68px] grid-cols-3 gap-1 rounded-[22px] border p-1.5" style={{ background: C.card, borderColor: C.line, boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}>
        {itemsMovil.map((item) => {
          const Icono = item.icon || ClipboardList
          if (item.centro) {
            // Botón principal: círculo lima que sobresale de la barra, con el nombre debajo
            return (
              <div key={item.name} className="relative flex items-end justify-center">
                <Link to={item.href} aria-current={item.activo ? "page" : undefined} aria-label={item.name} className="absolute -top-[26px] grid h-[60px] w-[60px] place-items-center rounded-full border-4" style={{ background: C.lime, color: C.onLime, borderColor: C.bg }}>
                  <Icono className="h-[24px] w-[24px]" />
                </Link>
                <span className="pb-[1px] text-[11px] font-bold" style={{ color: C.okFg }}>{item.mobileLabel || item.name}</span>
              </div>
            )
          }
          return (
            <Link key={item.name} to={item.href} aria-current={item.activo ? "page" : undefined} className="flex flex-col items-center justify-center gap-[3px] rounded-2xl text-[11px] font-semibold" style={{ background: item.activo ? C.okBg : "transparent", color: item.activo ? C.okFg : C.muted }}>
              <Icono className="h-[21px] w-[21px]" />
              {item.mobileLabel || item.name}
            </Link>
          )
        })}
      </nav>

      <HojaCuentaCelular
        abierto={cuentaAbierta}
        onCerrar={() => setCuentaAbierta(false)}
        userData={{ nombrecompleto: usuario.nombre, correo: usuario.email }}
        avatarUrl={avatarUrl}
        rutaPerfil="/profesor/perfil"
        rutaConfiguracion="/profesor/configuracion"
        panelActual="profesor"
        onLogout={handleLogout}
      />

      <BravoChat rol="profesor" />
      <InvitacionAvisos />
    </div>
  )

  return (
    <CabeceraMovilContext.Provider value={{ set: setCabecera }}>
      {movil ? arbolMovil : escritorio}
    </CabeceraMovilContext.Provider>
  )
}