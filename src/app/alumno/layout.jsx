import { cerrarSesionEnServidor } from "@/lib/sesion"
import { useEffect, useState } from "react"
import { SlotTituloContext } from "@/lib/slotTitulo"
import { usePermisosVivos } from "@/lib/sincronizarPermisos"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"
import {
  Calendar,
  History,
  CreditCard,
  User,
  LogOut,
  ShieldAlert,
  Home,
  FolderOpen,
  Trophy,
  Calculator,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import NotificacionesBell from "@/components/NotificacionesBell"
import NovedadesPortada from "@/components/NovedadesPortada"
import apiClient from "@/api"
import RenovarMembresia from "@/components/RenovarMembresia"
import BravoChat from "@/components/BravoChat"
import InvitacionAvisos from "@/components/InvitacionAvisos"
import GuiasAlumno from "@/components/GuiasAlumno"
import { HojaMas } from "@/components/MenuPanel"
import { EncabezadoMovil, MenuInferior } from "@/components/bx/MarcoMovil"
import { HojaCuenta } from "@/components/bx/MenuCuenta"
import { IC } from "@/components/bx/trazos"
import { Ico } from "@/components/bx/iconos"
import { useAnchoPanel } from '@/lib/useEscritorio'
import LayoutEscritorio from './LayoutEscritorio'

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
  { name: "Mis RM", mobileLabel: "RM", href: "/alumno/marcas", icon: Trophy, grupo: "entrenamiento" },
  { name: "Calculadora RM", mobileLabel: "RM", href: "/alumno/calculadora-rm", icon: Calculator, grupo: "entrenamiento" },
  { name: "Mi Membresía", mobileLabel: "Membresía", href: "/alumno/plan", icon: Wallet, principal: true, grupo: "cuenta" },
  { name: "Mis Créditos", mobileLabel: "Créditos", href: "/alumno/creditos", icon: CreditCard, grupo: "cuenta" },
  { name: "Documentos y Comprobantes", mobileLabel: "Docs", href: "/alumno/documentacion", icon: FolderOpen, grupo: "cuenta" },
  { name: "Mi Perfil", mobileLabel: "Perfil", href: "/alumno/perfil", icon: User, grupo: "cuenta" },
]

// "/alumno" (Resumen) solo se marca en su propia página, no en todas las de adentro
const esActivo = (item, pathname) =>
  item.href === "/alumno" ? pathname === "/alumno" : pathname === item.href || pathname.startsWith(item.href + "/")

// Campanita del celular: lleva a la pantalla de Notificaciones y muestra cuántas hay sin leer
function CampanaMovil() {
  const [noLeidas, setNoLeidas] = useState(0)
  useEffect(() => {
    let vigente = true
    const pedir = () => apiClient.get("/notificaciones").then((r) => { if (vigente) setNoLeidas(r.data?.data?.noLeidas || 0) }).catch(() => {})
    pedir()
    const t = setInterval(pedir, 30000)
    return () => { vigente = false; clearInterval(t) }
  }, [])
  return (
    <Link to="/alumno/notificaciones" aria-label={`Notificaciones${noLeidas ? `, ${noLeidas} sin leer` : ""}`} className="relative grid h-11 w-11 place-items-center rounded-[0.625rem] text-bx-ink transition-transform duration-200 active:scale-90">
      <Ico d={IC.bell} size={22} sw={1.8} />
      {noLeidas > 0 && <span className="absolute right-1 top-1 h-[1.125rem] min-w-[1.125rem] rounded-[0.5625rem] bg-bx-lima px-1 text-center text-[0.625rem] font-extrabold leading-[1.125rem] text-bx-negro">{noLeidas > 9 ? "9+" : noLeidas}</span>}
    </Link>
  )
}

export default function AlumnoLayout({ children }) {
  // Desde 1024 px: diseño de escritorio (LayoutEscritorio). Por debajo: el marco del celular, que no cambia.
  const escritorio = useAnchoPanel()
  const [cuentaAbierta, setCuentaAbierta] = useState(false)

  // Celular: el contenido se desplaza sin barra de scroll visible
  useEffect(() => {
    if (escritorio) return undefined
    document.documentElement.classList.add("sin-barra-movil")
    return () => document.documentElement.classList.remove("sin-barra-movil")
  }, [escritorio])
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  usePermisosVivos() // el menú de paneles se actualiza solo cuando cambian los permisos
  const slotTitulo = null // las pantallas no dibujan su título en el cuerpo: lo muestran el header (celular) y la barra de arriba (escritorio)
  
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

    const handleAvatarUpdated = (event) => setAvatarUrl(event.detail || "")
    window.addEventListener("avatar-updated", handleAvatarUpdated)
    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated)
    }
  }, [])

  // Si el alumno cambia su nombre en Mi perfil, el menú y el encabezado lo muestran al instante
  useEffect(() => {
    const refrescar = () => {
      try {
        const u = JSON.parse(localStorage.getItem("usuario") || "{}")
        setUserData((prev) => ({ ...prev, nombrecompleto: u.nombrecompleto || u.nombre || prev.nombrecompleto }))
      } catch { /* sin cambios */ }
    }
    window.addEventListener("usuario-actualizado", refrescar)
    return () => window.removeEventListener("usuario-actualizado", refrescar)
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
    const alCrear = () => {
      contar()
      setPistaReserva(true)
    }
    contar()
    window.addEventListener("bravos:reserva-creada", alCrear)
    window.addEventListener("bravos:reservas-cambiaron", contar)
    return () => {
      vivo = false
      window.removeEventListener("bravos:reserva-creada", alCrear)
      window.removeEventListener("bravos:reservas-cambiaron", contar)
    }
  }, [pathname])

  // La pista "Tu reserva está acá" se mantiene hasta que el alumno entra a Reservas
  useEffect(() => {
    if (pathname === "/alumno/reservas") setPistaReserva(false)
  }, [pathname])

  const handleLogout = () => {
    cerrarSesionEnServidor()
    localStorage.clear()
    navigate("/login", { replace: true })
  }

  // Contenido de la pantalla (el mismo en celular y escritorio)
  const cuerpo = (
    <>
          {/* Pop-up de novedades: sale al entrar (una vez por dispositivo) y se vuelve a abrir desde el botón de arriba */}
          <NovedadesPortada conAviso soloAviso />
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
              {/* "Volver" en las subpáginas (celular y escritorio). En el inicio del módulo no hay botón */}
              {/* Solo en submódulos (pantallas dentro de un módulo): en las pantallas principales no hay "Volver" */}
              {pathname.split("/").filter(Boolean).length >= 3 && (
                <BotonVolver a={"/" + pathname.split("/").filter(Boolean).slice(0, -1).join("/")} texto="Volver" className="mb-4" />
              )}
              <SlotTituloContext.Provider value={slotTitulo}>{children}</SlotTituloContext.Provider>
            </>
          )}
            </>
  )

  // Piezas que van en los dos marcos
  const globales = (
    <>
      <BravoChat rol="alumno" />
      {/* Guía de bienvenida: la primera vez, cuando ya se sabe si el alumno tiene membresía */}
      <GuiasAlumno lista={!validandoAcceso && tieneAbonoActivo} />
      {/* Primera vez con la app instalada: invitación a activar los avisos en el celular */}
      <InvitacionAvisos />
    </>
  )

  if (escritorio) {
    return (
      <>
        <LayoutEscritorio userData={userData} avatarUrl={avatarUrl} onLogout={handleLogout}>{cuerpo}</LayoutEscritorio>
        {globales}
      </>
    )
  }

  // Título de la pantalla en el header (en el inicio va solo el logo)
  const actual = pathname !== "/alumno" ? navigation.find((item) => item.href === pathname) : null
  const tituloHeader = actual ? (actual.name === "Documentos y Comprobantes" ? "Documentos" : actual.name) : null

  // Menú de abajo: Inicio · Reservas · Reservar (centro) · Membresía · Más
  const ICONOS_MENU = { "/alumno": IC.home, "/alumno/reservas": IC.hist, "/alumno/reservar": IC.cal, "/alumno/plan": IC.wallet }
  const itemsMenu = (() => {
    const items = navigation.filter((item) => item.principal && !item.centro)
    const centro = navigation.find((item) => item.centro)
    const mitad = Math.ceil(items.length / 2)
    const mas = { name: "Más", mobileLabel: "Más", href: "/alumno/mas", d: IC.menu, guia: "menu" }
    return [...items.slice(0, mitad), centro, ...items.slice(mitad), mas].filter(Boolean).map((item) => ({
      ...item,
      d: item.d || ICONOS_MENU[item.href],
      // "Más" se marca cuando su menú está abierto (no tiene ruta propia)
      activo: item.alTocar ? menuMovilAbierto : esActivo(item, pathname),
      // En "Reservas": cuántas reservas próximas hay y, tras reservar, una pista para ir a verla
      guia: item.guia || (item.href === "/alumno/reservas" ? "reservas" : undefined),
      insignia: item.href === "/alumno/reservas" ? reservasProximas : 0,
      pista: item.href === "/alumno/reservas" && pistaReserva && pathname !== "/alumno/reservas" ? "Tu reserva está acá" : null,
    }))
  })()

  return (
    <div className="min-h-screen bg-background">
      <EncabezadoMovil
        titulo={tituloHeader}
        userData={userData}
        avatarUrl={avatarUrl}
        onAvatar={() => setCuentaAbierta(true)}
        campana={<CampanaMovil />}
      />

      {/* Menú de cuenta (avatar): hoja que sube desde abajo */}
      <HojaCuenta
        abierto={cuentaAbierta}
        onCerrar={() => setCuentaAbierta(false)}
        userData={userData}
        avatarUrl={avatarUrl}
        rutaPerfil="/alumno/perfil"
      />

      {/* "Más" (menú de abajo): hoja que sube desde abajo con todas las opciones */}
      <HojaMas
        abierto={menuMovilAbierto}
        onCerrar={() => setMenuMovilAbierto(false)}
        grupos={GRUPOS}
        items={navigation}
        esActivo={(item) => esActivo(item, pathname)}
        onLogout={handleLogout}
        conTema
      />

      <main className="p-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        {cuerpo}
      </main>

      <MenuInferior items={itemsMenu} />

      {globales}
    </div>
  )
}
