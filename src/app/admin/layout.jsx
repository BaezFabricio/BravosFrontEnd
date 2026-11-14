import { cerrarSesionEnServidor } from "@/lib/sesion"
import { LayoutAdminContext } from "@/lib/layoutBx"
import { ContenedorPortal } from "@/lib/contenedorPortal"
import { useZoomLienzo } from "@/lib/useZoomLienzo"
import { useEffect, useLayoutEffect, useState, useRef } from "react"
import { SlotTituloContext } from "@/lib/slotTitulo"
import { EVENTO_PERMISOS } from "@/lib/sincronizarPermisos"
import { Link, useLocation } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"

// Submódulo = una pantalla dentro de un módulo (ej. /admin/usuarios/5/editar): su "Volver" lleva a la pantalla de arriba
// Estas pantallas calculan su propio "Volver" (depende de la URL): el layout no pone otro
const ES_FORM_CLASES = new RegExp("^/admin/clases/(turnos|nueva|editar/)")
const CON_VOLVER_PROPIO = ["/admin/usuarios/abonos/carga-masiva"]
const rutaPadre = (pathname) => {
  if (CON_VOLVER_PROPIO.includes(pathname)) return null
  // La ficha del alumno (/admin/usuarios/:id) trae su propio "Volver a Usuarios", como la referencia
  if (/^\/admin\/usuarios\/\d+$/.test(pathname)) return null
  const partes = pathname.split("/").filter(Boolean)
  return partes.length >= 3 ? "/" + partes.slice(0, -1).join("/") : null
}
import { useNavigate } from "react-router-dom"
import UserMenu from "@/components/UserMenu"
import { panelesPermitidos } from "@/lib/paneles"
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Settings,
  X,
  Shield,
  ChevronDown,
  BarChart3,
  Medal,
  Bell,
  UserCheck,
  Menu,
} from "lucide-react"
import { Moon, Sun } from "lucide-react"
import HamburgerButton from "@/components/HamburgerButton"
import IconoWhatsApp from "@/components/IconoWhatsApp"
import NotificacionesBell from "@/components/NotificacionesBell"
import BravoChat from "@/components/BravoChat"
import InvitacionAvisos from "@/components/InvitacionAvisos"
import { HojaMas, BotonPaginaPrincipal } from "@/components/MenuPanel"
import { BarraInferior } from '@/components/BarraInferior'

// Grupos del menú, en el orden en que se dibujan. El primero va sin título.
const GRUPOS = [
  { key: "inicio", titulo: null },
  { key: "gestion", titulo: "Gestión" },
  { key: "sistema", titulo: "Sistema" },
]

const navigation = [
  { name: "Resumen", mobileLabel: "Inicio", href: "/admin", icon: LayoutDashboard, requiredPermission: "dashboard:consulta", grupo: "inicio" },
  { name: "Usuarios y abonos", mobileLabel: "Usuarios", href: "/admin/usuarios", icon: Users, requiredPermission: "usuarios:consulta", grupo: "gestion" },
  { name: "Clases", mobileLabel: "Clases", href: "/admin/clases", icon: Calendar, requiredPermission: "clases:consulta", grupo: "gestion" },
  { name: "Planes", mobileLabel: "Planes", href: "/admin/planes", icon: CreditCard, requiredPermission: "membresias:consulta", grupo: "gestion" },
  { name: "Reportes", mobileLabel: "Reportes", href: "/admin/reportes", icon: BarChart3, requiredPermission: "dashboard:consulta", grupo: "gestion" },
  { name: "Check-in", mobileLabel: "Check-in", href: "/admin/check-in", icon: UserCheck, requiredPermission: "configuracion:consulta", grupo: "gestion" },
  { name: "Novedades", mobileLabel: "Novedades", href: "/admin/novedades", icon: Bell, requiredPermission: "configuracion:consulta", grupo: "gestion" },
  { name: "Ejercicios del RM", mobileLabel: "RM", href: "/admin/ejercicios-rm", icon: Medal, requiredPermission: "configuracion:consulta", grupo: "gestion" },
  { name: "Avisos WhatsApp", mobileLabel: "Avisos", href: "/admin/avisos", icon: IconoWhatsApp, requiredPermission: "clases:consulta", grupo: "gestion" },
  { name: "Perfiles", mobileLabel: "Perfiles", href: "/admin/perfiles", icon: Shield, requiredPermission: "perfiles:consulta", grupo: "sistema" },
  { name: "Configuración del box", mobileLabel: "Config", href: "/admin/configuracion", icon: Settings, requiredPermission: "configuracion:consulta", grupo: "sistema" },
]

// Marcación del menú y de la barra de arriba, tal cual la referencia del rediseño (colores en variables del tema)
const ICONO_PAGINA = "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"
const ICONO_SOL = "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
const ICONO_LUNA = "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"
const ICONOS_MENU = {
  "/admin": "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  "/admin/usuarios": "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 20v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
  "/admin/clases": "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M3 10h18",
  "/admin/planes": "M3 6h18v12H3zM3 10h18",
  "/admin/reportes": "M4 20V10M10 20V4M16 20v-7M22 20H2",
  "/admin/check-in": "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 20v-1a5 5 0 0 1 8-4M15 18l2 2 4-4",
  "/admin/novedades": "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4",
  "/admin/ejercicios-rm": "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  "/admin/avisos": "M3 21l1.6-4.7A8.5 8.5 0 1 1 8 19.5z",
  "/admin/perfiles": "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  "/admin/configuracion": "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.8 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.8-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.8 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 21 9h.1a2 2 0 1 1 0 4H21a1.7 1.7 0 0 0-1.6 2z",
}

function Icono({ d, size = 18, sw = 1.8 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const estiloEnlace = (activo) => ({
  display: "flex", alignItems: "center", gap: "12px", minHeight: "42px", padding: "0px 12px", borderRadius: "10px",
  background: activo ? "var(--sh-active-bg)" : "transparent",
  color: activo ? "var(--sh-accent)" : "var(--sh-link)",
  font: "600 14px Archivo", whiteSpace: "nowrap", textDecoration: "none",
})

const estiloBotonCuadrado = {
  width: "44px", height: "44px", borderRadius: "10px", border: "1px solid var(--sh-btn-line)", background: "transparent",
  color: "var(--sh-ink)", display: "grid", placeItems: "center", cursor: "pointer",
}

export default function AdminLayout({ children }) {
  const [raiz, setRaiz] = useState(null)
  const [anfitrion, setAnfitrion] = useState(null) // donde se montan menús y ventanas (ver useZoomLienzo)
  useZoomLienzo(raiz, anfitrion) // el panel se diseña a 1920 px y se achica según el ancho de la ventana
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

  // Tema del panel (oscuro, claro o automático). Se guarda en el navegador y se aplica antes del primer dibujo
  const [modoTema, setModoTema] = useState(() => {
    const guardado = localStorage.getItem("bravos-admin-tema-modo")
    return guardado === "oscuro" || guardado === "claro" || guardado === "auto" ? guardado : "auto"
  })
  const [sistemaOscuro, setSistemaOscuro] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches)
  useEffect(() => {
    const consulta = window.matchMedia("(prefers-color-scheme: dark)")
    const alCambiar = (e) => setSistemaOscuro(e.matches)
    consulta.addEventListener("change", alCambiar)
    return () => consulta.removeEventListener("change", alCambiar)
  }, [])
  const tema = modoTema === "auto" ? (sistemaOscuro ? "oscuro" : "claro") : modoTema
  useLayoutEffect(() => {
    const html = document.documentElement
    html.classList.add("bv-admin")
    html.dataset.bvTema = tema
    localStorage.setItem("bravos-admin-tema", tema)
    return () => { html.classList.remove("bv-admin"); delete html.dataset.bvTema }
  }, [tema])
  const cambiarModoTema = (nuevo) => {
    localStorage.setItem("bravos-admin-tema-modo", nuevo)
    setModoTema(nuevo)
  }
  useEffect(() => {
    // Si le cambian el perfil mientras tiene el panel abierto, el menú se actualiza solo (sin volver a iniciar sesión)
    const alCambiar = () => { try { setPermisos(JSON.parse(localStorage.getItem('permisos') || '[]')) } catch { /* nada */ } }
    window.addEventListener(EVENTO_PERMISOS, alCambiar)
    return () => window.removeEventListener(EVENTO_PERMISOS, alCambiar)
  }, [])
  const [slotTitulo, setSlotTitulo] = useState(null) // lugar del título de la pantalla en la barra de arriba
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
    
    <ContenedorPortal.Provider value={anfitrion}>
    <div ref={setRaiz} className="min-h-screen bg-background">
      {/* Menú lateral: solo en la computadora. En el celular se usa el desplegable de arriba a la derecha */}
      <aside
        className={`hidden lg:flex lg:flex-col fixed top-0 left-0 z-50 h-full w-[272px] transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sh-bg)", borderRight: "1px solid var(--sh-line)" }}
      >
        <div style={{ height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0px 20px", borderBottom: "1px solid var(--sh-line)" }}>
          <Link to="/inicio" aria-label="Ir a la página principal" style={{ display: "flex", alignItems: "center" }}>
            <img src={tema === "claro" ? "/bravos-logo-claro.png" : "/bravos-logo.png"} alt="Bravos Box" style={{ height: "30px", width: "auto" }} />
          </Link>
          <button type="button" aria-label="Ocultar menú lateral" onClick={() => setSidebarOpen(false)}
            style={{ width: "44px", height: "44px", display: "grid", placeItems: "center", borderRadius: "10px", border: "none", background: "transparent", color: "var(--sh-head)", cursor: "pointer" }}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Administración" style={{ flex: "1 1 0%", overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "2px" }}>
          <Link to="/inicio" className="bv-nav-link" style={estiloEnlace(false)} onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}>
            <Icono d={ICONO_PAGINA} />
            <span>Página principal</span>
          </Link>
          {GRUPOS.map((g) => {
            const delGrupo = visibles.filter((item) => item.grupo === g.key)
            if (delGrupo.length === 0) return null
            return (
              <div key={g.key} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {g.titulo && (
                  <div style={{ padding: "18px 12px 6px", font: "700 11px Archivo", letterSpacing: "0.12em", color: "var(--sh-label)" }}>
                    <span>{g.titulo.toUpperCase()}</span>
                  </div>
                )}
                {delGrupo.map((item) => {
                  const isActive = esActivo(item)
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className="bv-nav-link"
                      style={estiloEnlace(isActive)}
                      onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
                    >
                      <Icono d={ICONOS_MENU[item.href]} />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Tocar la tarjeta lleva al perfil (cerrar sesión está en el menú de la cuenta, arriba a la derecha) */}
        <Link
          to="/admin/perfil"
          title="Ver mi perfil"
          onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
          style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderTop: "1px solid var(--sh-line)", textDecoration: "none", color: "inherit" }}
        >
          <span style={{ width: "40px", height: "40px", flexShrink: 0, borderRadius: "50%", background: "var(--sh-avatar)", border: "2px solid var(--sh-accent)", display: "grid", placeItems: "center", font: "800 13px Archivo", color: "var(--sh-accent)" }}>
            {avatarFallback}
          </span>
          <span style={{ flex: "1 1 0%", minWidth: "0px" }}>
            <span style={{ display: "block", font: "700 14px Archivo", color: "var(--sh-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userData.nombrecompleto}</span>
            <span style={{ display: "block", font: "500 12px Archivo", color: "var(--sh-accent)" }}>Administrador</span>
          </span>
        </Link>
      </aside>

      
      

      <div className={`transition-[padding] duration-300 ease-in-out ${sidebarOpen ? "lg:pl-[272px]" : ""}`}>
        <header className="sticky top-0 z-[5] border-b border-[color:var(--sh-line)] bg-[var(--sh-header-bg)] backdrop-blur-[8px]">
          <div className="flex items-center justify-between gap-[12px] h-16 px-4 lg:h-[71px] lg:px-[32px]">
            {!sidebarOpen && (
              <div className="hidden lg:block">
                <HamburgerButton isOpen={false} onClick={() => setSidebarOpen(true)} />
              </div>
            )}
            {/* Celular: botón para volver al sitio público, con el texto (el logo solo no se entendía) */}
            <BotonPaginaPrincipal />
            {/* Título de la pantalla (lo escribe cada página con <TituloPagina>) */}
            <div ref={setSlotTitulo} className="min-w-0 flex-1 px-3 lg:px-0" />

            <div className="flex items-center gap-[12px]">
              <div className="hidden lg:block">
                <button
                  type="button"
                  onClick={() => cambiarModoTema(tema === "oscuro" ? "claro" : "oscuro")}
                  aria-label={tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                  style={estiloBotonCuadrado}
                >
                  <Icono d={tema === "oscuro" ? ICONO_SOL : ICONO_LUNA} />
                </button>
              </div>
              <NotificacionesBell variante="admin" />

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  aria-label={`Menú de ${userData.nombrecompleto}`}
                  style={{ display: "flex", alignItems: "center", gap: "6px", height: "44px", padding: "0px 6px", border: "none", background: "transparent", color: "var(--sh-head)", cursor: "pointer" }}
                >
                  <span style={{ width: "36px", height: "36px", flexShrink: 0, borderRadius: "50%", background: "var(--sh-avatar)", border: "2px solid var(--sh-accent)", display: "grid", placeItems: "center", font: "800 12px Archivo", color: "var(--sh-accent)" }}>
                    {avatarFallback}
                  </span>
                  <Icono d="m6 9 6 6 6-6" size={14} sw={2.4} />
                </button>

                <UserMenu
                  variante="admin"
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
            </div>
          </div>
        </header>

        {/* "Más" (barra de abajo, celular): hoja que sube desde abajo con todas las opciones */}
        <HojaMas
          abierto={menuMovilAbierto}
          onCerrar={() => setMenuMovilAbierto(false)}
          grupos={GRUPOS}
          items={visibles}
          esActivo={esActivo}
          onLogout={handleLogout}
          conTema
        />
        <main className="p-4 pb-36 lg:px-[32px] lg:pb-[48px] lg:pt-[24px]" style={{ maxWidth: "1720px" }}>
          {/* "Volver" solo en submódulos (pantallas dentro de un módulo). En las pantallas principales no hay botón */}
          {rutaPadre(location.pathname) && <BotonVolver a={rutaPadre(location.pathname)} texto="Volver" className={"mb-4 " + (ES_FORM_CLASES.test(location.pathname) ? "lg:hidden" : "")}  />}
          <SlotTituloContext.Provider value={slotTitulo}><LayoutAdminContext.Provider value={true}>{children}</LayoutAdminContext.Provider></SlotTituloContext.Provider>
        </main>

        {/* Mobile Bottom Navigation */}
        {/* Con 5 accesos, el del medio (Clases) va destacado */}
        <BarraInferior items={[...visibles.slice(0, 4), { name: "Más", mobileLabel: "Más", href: "#", icon: Menu, alTocar: () => setMenuMovilAbierto((v) => !v), activo: menuMovilAbierto }].map((item, i, arr) => ({ ...item, activo: item.alTocar ? menuMovilAbierto : esActivo(item), centro: arr.length === 5 && i === 2 }))} compactaForzada={menuMovilAbierto} />
      </div>

      <BravoChat rol="admin" />
      {/* Primera vez con la app instalada: invitación a activar los avisos en el celular */}
      <InvitacionAvisos />
      <div ref={setAnfitrion} data-anfitrion-portales />
    </div>
    </ContenedorPortal.Provider>
  )
}