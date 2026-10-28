import { cerrarSesionEnServidor } from "@/lib/sesion"
import { useEffect, useState, useRef } from "react"
import { SlotTituloContext } from "@/lib/slotTitulo"
import { usePermisosVivos } from "@/lib/sincronizarPermisos"
import UserMenu from "@/components/UserMenu"
import { panelesPermitidos } from "@/lib/paneles"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"
import {
  Calendar,
  History,
  CreditCard,
  User,
  LogOut,
  X,
  ChevronDown,
  ShieldAlert,
  Home,
  FolderOpen,
  Trophy,
  Calculator,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ModeToggle"
import HamburgerButton from "@/components/HamburgerButton"
import NotificacionesBell from "@/components/NotificacionesBell"
import apiClient from "@/api"
import RenovarMembresia from "@/components/RenovarMembresia"
import BravoChat from "@/components/BravoChat"
import InvitacionAvisos from "@/components/InvitacionAvisos"
import GuiasAlumno from "@/components/GuiasAlumno"
import { TituloGrupo, MenuMovil, FondoMenuMovil, EnlacePaginaPrincipal, BotonPaginaPrincipal } from "@/components/MenuPanel"
import { BarraInferior } from '@/components/BarraInferior'

// Grupos del menú, en el orden en que se dibujan. El primero va sin título.
const GRUPOS = [
  { key: "inicio", titulo: null },
  { key: "entrenamiento", titulo: "Entrenamiento" },
  { key: "cuenta", titulo: "Mi cuenta" },
]

const navigation = [
  { name: "Resumen", mobileLabel: "Inicio", href: "/alumno", icon: Home, principal: true, grupo: "inicio" },
  { name: "Reservar Clase", mobileLabel: "Reservar", href: "/alumno/reservar", icon: Calendar, principal: true, centro: true, grupo: "entrenamiento" },
  { name: "Mis Reservas", mobileLabel: "Reservas", href: "/alumno/reservas", icon: History, principal: true, grupo: "entrenamiento" },
  { name: "Mis Marcas", mobileLabel: "Marcas", href: "/alumno/marcas", icon: Trophy, grupo: "entrenamiento" },
  { name: "Calculadora RM", mobileLabel: "RM", href: "/alumno/calculadora-rm", icon: Calculator, grupo: "entrenamiento" },
  { name: "Mi Membresía", mobileLabel: "Membresía", href: "/alumno/plan", icon: Wallet, principal: true, grupo: "cuenta" },
  { name: "Mis Créditos", mobileLabel: "Créditos", href: "/alumno/creditos", icon: CreditCard, grupo: "cuenta" },
  { name: "Documentos y Comprobantes", mobileLabel: "Docs", href: "/alumno/documentacion", icon: FolderOpen, grupo: "cuenta" },
  { name: "Mi Perfil", mobileLabel: "Perfil", href: "/alumno/perfil", icon: User, principal: true, grupo: "cuenta" },
]

// "/alumno" (Resumen) solo se marca en su propia página, no en todas las de adentro
const esActivo = (item, pathname) =>
  item.href === "/alumno" ? pathname === "/alumno" : pathname === item.href || pathname.startsWith(item.href + "/")

export default function AlumnoLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  usePermisosVivos() // el menú de paneles se actualiza solo cuando cambian los permisos
  const [slotTitulo, setSlotTitulo] = useState(null) // lugar del título de la pantalla en la barra de arriba (escritorio)
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

  // Reservas próximas del alumno: contador en la barra de abajo (se actualiza al reservar o cancelar) y, justo
  // después de reservar, una pista que marca dónde ver la reserva.
  const [reservasProximas, setReservasProximas] = useState(0)
  const [pistaReserva, setPistaReserva] = useState(false)
  useEffect(() => {
    let vivo = true
    const contar = () => {
      apiClient.get("/reservas/mis-reservas")
        .then((res) => {
          const lista = res.data?.data || res.data || []
          if (vivo) setReservasProximas(lista.filter((r) => r.estadoReserva === "proxima").length)
        })
        .catch(() => {})
    }
    let temporizador = null
    const alCrear = () => {
      contar()
      setPistaReserva(true)
      clearTimeout(temporizador)
      temporizador = setTimeout(() => setPistaReserva(false), 6000)
    }
    contar()
    window.addEventListener("bravos:reserva-creada", alCrear)
    window.addEventListener("bravos:reservas-cambiaron", contar)
    return () => {
      vivo = false
      clearTimeout(temporizador)
      window.removeEventListener("bravos:reserva-creada", alCrear)
      window.removeEventListener("bravos:reservas-cambiaron", contar)
    }
  }, [pathname])

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
    cerrarSesionEnServidor()
    localStorage.clear()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/50 dark:bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}


      <aside className={`hidden lg:block fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-lime-400/30">
            <Link to="/inicio" aria-label="Ir a la página principal" className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Bravos Gym" width={40} height={40} className="rounded-lg" />
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
            {GRUPOS.map((g) => (
              <div key={g.key} className="space-y-0.5">
                <TituloGrupo titulo={g.titulo} />
                {navigation.filter((item) => item.grupo === g.key).map((item) => {
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
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            {/* Tocar la tarjeta lleva al perfil */}
            <Link
              to="/alumno/perfil"
              title="Ver mi perfil"
              onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false) }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
            >
              <div className="h-10 w-10 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-sm overflow-hidden">
                {avatarUrl
                  ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  : getIniciales(userData.nombrecompleto)
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{userData.nombrecompleto}</p>
                <p className="text-xs text-muted-foreground truncate">{userData.correo}</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ease-in-out ${sidebarOpen ? "lg:pl-64" : ""}`}>
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {!sidebarOpen && (
              <div className="hidden lg:block">
                <HamburgerButton isOpen={false} onClick={() => setSidebarOpen(true)} />
              </div>
            )}
            {/* Celular: botón para volver al sitio público, con el texto (el logo solo no se entendía) */}
            {/* Celular: en las pantallas del menú, el título va acá en lugar del logo (el logo sigue en el inicio; "Página principal" está en el menú) */}
            {(() => {
              const actual = pathname !== "/alumno" ? navigation.find((item) => item.href === pathname) : null
              return actual
                ? <h1 data-guia="titulo" className="min-w-0 line-clamp-2 text-[26px] font-black uppercase leading-[1.02] tracking-tight text-foreground lg:hidden">{actual.name === "Documentos y Comprobantes" ? "Documentos" : actual.name}</h1>
                : <BotonPaginaPrincipal />
            })()}
            {/* Escritorio: título de la pantalla (lo escribe cada página con <TituloPagina>); en el celular va el de arriba */}
            <div ref={setSlotTitulo} className="hidden min-w-0 flex-1 px-3 lg:block" />
            <div className="flex-1 lg:hidden" />
            <div className="flex items-center gap-3">
              
              <div className="hidden lg:block"><ModeToggle /></div>
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2" onClick={() => window.location.href = '/'}>
                <Home className="h-4 w-4" />
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
                  panelActual="alumno"
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

              <HamburgerButton
                isOpen={menuMovilAbierto}
                onClick={() => setMenuMovilAbierto((v) => !v)}
                className="lg:hidden text-foreground"
              />
            </div>
          </div>

          {/* Menú desplegable del celular: se abre hacia abajo desde el botón de arriba a la derecha */}
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

        <main className="p-4 lg:p-6 pb-28 lg:pb-6">
          {validandoAcceso ? (
            <div className="max-w-5xl mx-auto space-y-4 animate-pulse" role="status" aria-label="Cargando">
              <div className="h-7 w-48 rounded bg-foreground/10" />
              <div className="h-24 rounded-md bg-foreground/10" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-28 rounded-md bg-foreground/10" />
                <div className="h-28 rounded-md bg-foreground/10" />
              </div>
              <div className="h-40 rounded-md bg-foreground/10" />
            </div>
          ) : !tieneAbonoActivo && !['/alumno/pago-exitoso', '/alumno/pago-pendiente', '/alumno/pago-fallido'].includes(pathname) ? (
            /* 🛑 CORTE DE FLUJO: sin membresía activa → mostrar renovación */
            <div className="max-w-5xl mx-auto mt-4 space-y-4">
              <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3">
                <ShieldAlert className="h-4 w-4 text-red-700 dark:text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-700 dark:text-red-400">Sin membresía vigente</p>
                  <p className="text-xs text-foreground/50 mt-0.5">Renová tu plan para acceder al sistema.</p>
                </div>
                <Button onClick={handleLogout} variant="ghost" size="sm" className="shrink-0 text-foreground/40 hover:text-red-700 dark:hover:text-red-400 text-xs gap-1">
                  <LogOut className="h-3.5 w-3.5" /> Salir
                </Button>
              </div>
              <RenovarMembresia onRenovado={() => window.location.reload()} />
            </div>
          ) : (
            /* ACCESO CONCEDIDO: Muestra las pantallas con sus datos reales */
            <>
              {/* Celular: "Volver" en todas las pantallas menos el inicio del panel. Vuelve a la pantalla
                  anterior si se llegó desde otra; si se entró directo, al inicio del panel */}
              {pathname !== "/alumno" && !navigation.some((item) => (item.principal || item.centro) && item.href === pathname) && (
                <BotonVolver a="/alumno" texto="Volver" className="mb-4 lg:hidden" />
              )}
              <SlotTituloContext.Provider value={slotTitulo}>{children}</SlotTituloContext.Provider>
            </>
          )}
        </main>

        {/* Barra de abajo (celular): solo los accesos principales; el resto está en el menú de arriba a la derecha */}
        <BarraInferior
          items={(() => {
            // La acción principal (Reservar) va en el medio, con las demás repartidas a los costados
            const items = navigation.filter((item) => item.principal && !item.centro)
            const centro = navigation.find((item) => item.centro)
            const mitad = Math.ceil(items.length / 2)
            return [...items.slice(0, mitad), centro, ...items.slice(mitad)].filter(Boolean).map((item) => ({
              ...item,
              activo: esActivo(item, pathname),
              // En "Reservas": cuántas reservas próximas hay y, tras reservar, una pista para ir a verla
              guia: item.href === "/alumno/reservas" ? "reservas" : undefined,
              insignia: item.href === "/alumno/reservas" ? reservasProximas : 0,
              pista: item.href === "/alumno/reservas" && pistaReserva && pathname !== "/alumno/reservas" ? "Tu reserva está acá" : null,
            }))
          })()}
        />
      </div>

      <BravoChat rol="alumno" />
      {/* Primera vez con la app instalada: invitación a activar los avisos en el celular */}
      {/* Guía de bienvenida: la primera vez, cuando ya se sabe si el alumno tiene membresía */}
      <GuiasAlumno lista={!validandoAcceso && tieneAbonoActivo} />
      <InvitacionAvisos />
    </div>
  )
}