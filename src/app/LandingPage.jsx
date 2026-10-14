import { haySesion, cerrarSesionEnServidor } from "@/lib/sesion"
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Menu,
  X,
  LogOut,
  User,
  Clock,
  Mail
} from 'lucide-react'

import { MoveHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImgConSkeleton } from '@/components/ImgConSkeleton'
import { LandingPageSkeleton } from '@/components/LandingPageSkeleton'
import UserMenu from '@/components/UserMenu'
import NotificacionesBell from '@/components/NotificacionesBell'

const navigation = [
  { name: 'INICIO', href: '#', hasDropdown: false },
  { name: 'CLASES', href: '#clases', hasDropdown: true },
  { name: 'HORARIOS', href: '#horarios', hasDropdown: false },
  { name: 'NOSOTROS', href: '#nosotros', hasDropdown: false },
  { name: 'CONTACTO', href: '#contacto', hasDropdown: false },
]

// En el celular la foto horizontal se recorta a los costados: para algunas fotos se elige qué parte
// queda a la vista (posición horizontal). Se reconocen por el nombre del archivo en Cloudinary.
const ENFOQUE_MOVIL = {
  davcsvmbrdsoditcgyyb: '60% center', // soldado al que cargan sus compañeros
}
const enfoqueMovil = (url) => {
  const clave = Object.keys(ENFOQUE_MOVIL).find((id) => url.includes(id))
  return clave ? ENFOQUE_MOVIL[clave] : undefined
}

/*
 * Horarios de atención: se cargan en Configuración como texto libre ("Lun-Vie: 6:00 - 22:00",
 * "Domingo: Cerrado"). Se separan en etiqueta y valor, y si se puede leer el rango de horas se
 * calcula si el box está abierto ahora. Si el texto no se entiende, no se muestra nada de eso.
 */
function leerHorario(texto) {
  if (!texto) return null
  const i = texto.indexOf(':')
  const conEtiqueta = i > 0 && !/^\s*\d/.test(texto)
  const etiqueta = conEtiqueta ? texto.slice(0, i).trim() : ''
  const valor = (conEtiqueta ? texto.slice(i + 1) : texto).trim()
  if (/cerrado/i.test(valor)) return { etiqueta, valor, cerrado: true }
  const m = valor.match(/(\d{1,2})(?::(\d{2}))?\s*(?:a|-|–|hasta)\s*(\d{1,2})(?::(\d{2}))?/i)
  const rango = m ? { desde: +m[1] * 60 + +(m[2] || 0), hasta: +m[3] * 60 + +(m[4] || 0) } : null
  return { etiqueta, valor, rango }
}

// true / false si se puede saber con los horarios cargados; null si no
function estaAbiertoAhora(semana, sabado, domingo) {
  const ahora = new Date()
  const dia = ahora.getDay()
  const hoy = leerHorario(dia === 0 ? domingo : dia === 6 ? sabado : semana)
  if (!hoy) return null
  if (hoy.cerrado) return false
  if (!hoy.rango) return null
  const minutos = ahora.getHours() * 60 + ahora.getMinutes()
  return minutos >= hoy.rango.desde && minutos < hoy.rango.hasta
}

// Nivel de las tarjetas de clases, escrito completo
const NIVELES = { TODOS: 'Todos los niveles', 'INT/AVZ': 'Intermedio y avanzado' }

function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [clasesAbiertas, setClasesAbiertas] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [heroImages, setHeroImages] = useState([]) // sin fotos de relleno: hasta que llegan las reales se ve el skeleton
  const [titulo, setTitulo] = useState('Centro de Entrenamiento')
  const [logoUrl, setLogoUrl] = useState(null)
  const [logoFailed, setLogoFailed] = useState(false)
  const [logoImgLoaded, setLogoImgLoaded] = useState(false)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [tituloSize, setTituloSize] = useState(null)
  const [tituloFont, setTituloFont] = useState(null)
  const [logoTs, setLogoTs] = useState(Date.now())

  // Nosotros
  const [tituloNosotros, setTituloNosotros] = useState('')
  const [descripcionNosotros, setDescripcionNosotros] = useState('')
  const [mision, setMision] = useState('')
  const [imagenNosotros, setImagenNosotros] = useState('/gym-interior.jpg')

  // Clases cards
  const [claseCards, setClaseCards] = useState([
    { titulo: 'FUNCIONAL', descripcion: 'Entrenamiento funcional de alta intensidad que combina levantamiento, cardio y gimnasia.', duration: '60 MIN', level: 'TODOS', image: '/hero-crossfit.jpg' },
    { titulo: 'WOD INTENSIVO', descripcion: 'Workout of the Day con ejercicios variados para maximizar rendimiento y resistencia.', duration: '45 MIN', level: 'INT/AVZ', image: '/wod-training.jpg' },
    { titulo: 'OPEN BOX', descripcion: 'Espacio libre para entrenar a tu ritmo con acceso a todo el equipamiento.', duration: '90 MIN', level: 'TODOS', image: '/gym-interior.jpg' },
  ])

  // Contacto
  const [direccion, setDireccion] = useState('Eva Perón 552')
  const [telefono, setTelefono] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [emailContacto, setEmailContacto] = useState('')
  const [instagram, setInstagram] = useState('')
  const [horarioSemana, setHorarioSemana] = useState('Lun-Vie: 6:00 - 22:00')
  const [horarioSabado, setHorarioSabado] = useState('Sábado: 8:00 - 14:00')
  const [horarioDomingo, setHorarioDomingo] = useState('Domingo: Cerrado')
  const [mapaVisible, setMapaVisible] = useState(false)
  const [filtroClase, setFiltroClase] = useState('todas') // "todas" o el índice de la tarjeta
  const [estadisticas, setEstadisticas] = useState(null) // cifras reales del box (solo cantidades)
  const [mapaUrl, setMapaUrl] = useState('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3540.0638546114256!2d-58.1764654246146!3d-26.18374827715694!2m3!1f0!2f0!3f0!3m2!1i1020!2i540!4f13.1!3m3!1m2!1s0x94576a911765c9b9%3A0x6b6d51c337b587!2sEva%20Per%C3%B3n%20552%2C%20Formosa!5e0!3m2!1ses-419!2sar!4v1716382000000')

  // Submenú de CLASES: una entrada por tarjeta, con el mismo nombre, que lleva a esa tarjeta
  const subItemsClases = claseCards.map((clase, idx) => ({ name: clase.titulo, href: `#clase-${idx + 1}` }))

  const showLogoSkeleton = !logoUrl || logoFailed || !logoImgLoaded
  const pageLoading = !configLoaded || (!!logoUrl && !logoImgLoaded && !logoFailed)

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('avatarUrl') || '')
  
  const [permisos, setPermisos] = useState([])
  const [userData, setUserData] = useState({
    nombrecompleto: 'Usuario Bravos',
    correo: 'sin-correo@bravos.com',
    perfil: 'cliente',
    estado: 'activo'
  });

  // 🟢 ESTADOS DE HORARIOS SCONECTADOS
  const [clasesBackend, setClasesBackend] = useState([])
  const [loadingHorarios, setLoadingHorarios] = useState(true)
  // Arranca en el día de hoy (el domingo no hay clases: arranca en el lunes)
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => {
    const hoy = ['LUNES', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'][new Date().getDay()]
    return hoy
  })

  const diasSemanaMapeo = [
    { label: 'LUNES', corto: 'LUN', value: 'LUNES' },
    { label: 'MARTES', corto: 'MAR', value: 'MARTES' },
    { label: 'MIÉRCOLES', corto: 'MIÉ', value: 'MIERCOLES' },
    { label: 'JUEVES', corto: 'JUE', value: 'JUEVES' },
    { label: 'VIERNES', corto: 'VIE', value: 'VIERNES' },
    { label: 'SÁBADO', corto: 'SÁB', value: 'SABADO' }
  ]

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const storedUser = localStorage.getItem("usuario")
    const storedAvatar = localStorage.getItem("avatarUrl")
    const storedPermisos = localStorage.getItem("permisos")

    if (storedAvatar) setAvatarUrl(storedAvatar)

    if (storedPermisos) {
      try {
        setPermisos(JSON.parse(storedPermisos))
      } catch (error) {
        console.error("Error al parsear permisos:", error)
      }
    }

    if (haySesion()) {
      setIsLoggedIn(true)
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUserData({
            nombrecompleto: parsedUser?.nombrecompleto || parsedUser?.nombre || parsedUser?.username || 'Usuario Bravos',
            correo: parsedUser?.correo || parsedUser?.email || 'sin-correo@bravos.com',
            perfil: parsedUser?.perfil || parsedUser?.rol || parsedUser?.tipo || 'cliente',
            estado: parsedUser?.estado || 'activo'
          })
        } catch (error) {
          console.error("Error al parsear el usuario:", error)
        }
      }
    } else {
      setIsLoggedIn(false)
    }

    const handleAvatarUpdated = (event) => {
      setAvatarUrl(event.detail || "")
    }

    window.addEventListener("avatar-updated", handleAvatarUpdated)

    // Si la configuración no llega (servidor caído, conexión lenta o un error), NO se muestra la página con
    // datos de relleno: sigue el skeleton y se vuelve a intentar solo (2 s, 4 s, 8 s… hasta 15 s entre intentos).
    let reintento = null
    const cargarConfig = (intento = 0) => fetch(`/landing/config?t=${new Date().getTime()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`La configuración respondió ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!isMounted) return
        if (data?.tituloHero) setTitulo(data.tituloHero)
        if (data?.logoUrl) {
          const ts = Date.now()
          setLogoUrl(data.logoUrl)
          setLogoFailed(false)
          setLogoImgLoaded(false)
          setLogoTs(ts)
          const preload = new Image()
          preload.onload = () => { if (isMounted) setLogoImgLoaded(true) }
          preload.onerror = () => { if (isMounted) setLogoFailed(true) }
          preload.src = `${data.logoUrl}${data.logoUrl.includes('?') ? '&' : '?'}t=${ts}`
        } else {
          setLogoUrl(null)
        }
        if (data?.tituloHeroSize) setTituloSize(data.tituloHeroSize)
        if (data?.tituloHeroFont) setTituloFont(data.tituloHeroFont)

        if (data?.heroImages) {
          const imagenesBackend = Object.values(data.heroImages).filter(Boolean)
          if (imagenesBackend.length > 0) {
            setHeroImages(imagenesBackend)
          }
        }

        // Nosotros
        if (data?.tituloNosotros) setTituloNosotros(data.tituloNosotros)
        if (data?.descripcionNosotros) setDescripcionNosotros(data.descripcionNosotros)
        if (data?.mision) setMision(data.mision)

        // Nosotros imagen
        if (data?.imagenNosotros) setImagenNosotros(data.imagenNosotros)

        // Clases cards
        setClaseCards([
          { titulo: data?.claseCard1Titulo || 'FUNCIONAL', descripcion: data?.claseCard1Descripcion || 'Entrenamiento funcional de alta intensidad que combina levantamiento, cardio y gimnasia.', duration: '60 MIN', level: 'TODOS', image: data?.imagenClase1 || '/hero-crossfit.jpg' },
          { titulo: data?.claseCard2Titulo || 'WOD INTENSIVO', descripcion: data?.claseCard2Descripcion || 'Workout of the Day con ejercicios variados para maximizar rendimiento y resistencia.', duration: '45 MIN', level: 'INT/AVZ', image: data?.imagenClase2 || '/wod-training.jpg' },
          { titulo: data?.claseCard3Titulo || 'OPEN BOX', descripcion: data?.claseCard3Descripcion || 'Espacio libre para entrenar a tu ritmo con acceso a todo el equipamiento.', duration: '90 MIN', level: 'TODOS', image: data?.imagenClase3 || '/gym-interior.jpg' },
        ])

        // Contacto
        if (data?.direccion) setDireccion(data.direccion)
        if (data?.telefono) setTelefono(data.telefono)
        if (data?.whatsapp) setWhatsapp(data.whatsapp)
        if (data?.email) setEmailContacto(data.email)
        if (data?.instagram) setInstagram(data.instagram)
        if (data?.estadisticas) setEstadisticas(data.estadisticas)
        if (data?.horario_semana) setHorarioSemana(data.horario_semana)
        if (data?.horario_sabado) setHorarioSabado(data.horario_sabado)
        if (data?.horario_domingo) setHorarioDomingo(data.horario_domingo)
        if (data?.mapaUrl) setMapaUrl(data.mapaUrl)
        setConfigLoaded(true) // recién ahora se muestra la página
      })
      .catch((err) => {
        console.error('No se pudo cargar la configuración, se reintenta:', err)
        if (isMounted) reintento = setTimeout(() => cargarConfig(intento + 1), Math.min(2000 * 2 ** intento, 15000))
      })
    cargarConfig()
    fetch("/api/vv1/clases/disponibles")
      .then((res) => res.json())
      .then((result) => {
        if (isMounted) {

          // Buscamos el array inspeccionando si viene en .data, .clases o directo en el objeto
          const datosReales = result.data || result.clases || (Array.isArray(result) ? result : []);
          
          setClasesBackend(datosReales);
        }
      })
      .catch((err) => console.error('Error al sincronizar horarios en la landing:', err))
      .finally(() => {
        if (isMounted) setLoadingHorarios(false)
      })

    return () => {
      isMounted = false
      if (reintento) clearTimeout(reintento)
      window.removeEventListener("avatar-updated", handleAvatarUpdated)
    }
  }, [])

  useEffect(() => {
    if (heroImages.length <= 1) return
    const interval = setInterval(() => {
      setCurrentImageIndex((previousIndex) => (previousIndex + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [heroImages])

  const handleLogout = () => {
    cerrarSesionEnServidor()
    localStorage.removeItem('usuario')
    localStorage.removeItem('avatarUrl')
    localStorage.removeItem('permisos')
    window.location.reload()
  }

  const tieneModulosAdmin = permisos.some(p => 
    p.startsWith('usuarios:') || p.startsWith('dashboard:') || 
    p.startsWith('perfiles:') || p.startsWith('membresias:') ||
    p.startsWith('clases:') || p.startsWith('reservas:') ||
    p.startsWith('creditos:') || p.startsWith('configuracion:')
  );
  
  const tieneModulosAlumno = permisos.some(p => p.startsWith('alumno'));
  const tieneModulosProfesor = permisos.some(p => p.startsWith('profesor')); 
  const puedeAccederPanel = permisos.length > 0 && userData.estado === 'activo';
  const panelesDisponibles = [tieneModulosAlumno && '/alumno', tieneModulosProfesor && '/profesor', tieneModulosAdmin && '/admin'].filter(Boolean);
  const rutaMiPanel = panelesDisponibles.length === 1 ? panelesDisponibles[0] : '/seleccionar-panel';

  const getIniciales = (name) => {
    if (!name || name === 'Usuario Bravos') return 'UB'
    const parts = name.trim().split(' ')
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // 🟢 FILTRADO DINÁMICO CRONOLÓGICO CONECTADO
  const clasesVisibles = clasesBackend
    .filter((c) => {
      if (c.fechaEspecifica) {
        // Clase única: solo en la grilla del día correspondiente
        const diaSemanaFecha = ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'][new Date(c.fechaEspecifica + 'T00:00:00').getDay()]
        return diaSemanaFecha === (diaSeleccionado || "").toUpperCase().trim()
      }
      const diaBaseDatos = c.dia ? c.dia.toUpperCase().trim() : "";
      const diaBoton = diaSeleccionado ? diaSeleccionado.toUpperCase().trim() : "";
      return diaBaseDatos === diaBoton;
    })
    .sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || ""));

  if (pageLoading) {
    return (
      <LandingPageSkeleton />
    )
  }

  const irAlContenido = () => {
    document.getElementById('contenido')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Número de WhatsApp solo con dígitos, como lo pide wa.me
  // wa.me pide el número completo: 549 + característica + número (sin 0 ni 15).
  const whatsappDigitos = (() => {
    let d = (whatsapp || telefono || '').replace(/\D/g, '')
    if (!d) return ''
    if (d.startsWith('549')) return d
    if (d.startsWith('54')) return '549' + d.slice(2)
    return '549' + d.replace(/^0/, '')
  })()

  // La página principal es siempre oscura, aunque el celular esté en modo claro: "dark" hace que los colores del tema
  // se vean claros sobre el fondo negro (antes el texto salía casi negro sobre negro).
  return (
    <div className="dark min-h-screen overflow-x-hidden bg-black text-foreground selection:bg-emerald-500 selection:text-black">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-black/95 backdrop-blur-md border-b-2 border-lime-400/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              <Link to="/" className="flex items-center h-[52px]">
                {showLogoSkeleton && (
                  <div className="h-[40px] w-[150px] bg-white/5 animate-pulse rounded" />
                )}
                {logoUrl && (
                  <img
                    src={`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${logoTs}`}
                    alt="Box Bravos"
                    className={`block h-auto w-auto max-h-[34px] max-w-[120px] object-contain sm:max-h-[48px] sm:max-w-[150px] lg:max-h-[60px] lg:max-w-[180px] ${logoImgLoaded ? '' : 'hidden'}`}
                    onLoad={() => setLogoImgLoaded(true)}
                    onError={() => setLogoFailed(true)}
                    ref={(el) => { if (el?.complete && el.naturalWidth > 0) setLogoImgLoaded(true) }}
                  />
                )}
              </Link>

              <nav className="hidden items-center gap-0 lg:flex">
                <Link to="/" className="group relative px-4 py-5 text-xs font-black tracking-widest text-foreground/70 transition-colors hover:text-white">
                  INICIO
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"/>
                </Link>

                {navigation.filter(item => item.name !== 'INICIO').map((item) => (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <a href={item.href} className="group relative flex items-center gap-1 px-4 py-5 text-xs font-black tracking-widest text-foreground/70 transition-colors hover:text-white">
                      {item.name}
                      {item.hasDropdown && <ChevronDown className="h-3.5 w-3.5" />}
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-lime-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left"/>
                    </a>

                    {item.hasDropdown && activeDropdown === item.name && (
                      <div className="absolute top-full left-0 w-48 border border-lime-400/20 border-t-2 border-t-lime-400 bg-black shadow-xl shadow-black/50">
                        {subItemsClases.map((subItem) => (
                          <a key={subItem.href} href={subItem.href} className="block px-4 py-3 text-xs font-bold tracking-wider text-foreground/60 transition-colors hover:bg-lime-400/5 hover:text-lime-400">
                            {subItem.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">

                {!isLoggedIn ? (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" className="text-xs font-black tracking-widest text-foreground/70 hover:bg-foreground/5 hover:text-white">
                        INGRESAR
                      </Button>
                    </Link>
                    <Link to="/registro">
                      <Button className="bg-lime-400 px-6 text-xs font-black tracking-widest text-black hover:bg-lime-300 transition-colors">
                        UNIRSE
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-4 relative">
                    <NotificacionesBell />

                    <div className="relative">
                      <button 
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-1 focus:outline-none"
                      >
                        <div className="h-9 w-9 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-xs overflow-hidden">
                          {avatarUrl
                            ? <img src={avatarUrl} alt={userData.nombrecompleto} className="h-full w-full object-cover" />
                            : getIniciales(userData.nombrecompleto)
                          }
                        </div>
                        <ChevronDown className="h-4 w-4 text-foreground/60" />
                      </button>

                      <UserMenu
                        userData={userData}
                        avatarUrl={avatarUrl}
                        userMenuOpen={userMenuOpen}
                        setUserMenuOpen={setUserMenuOpen}
                        handleLogout={handleLogout}
                        tieneModulosAdmin={tieneModulosAdmin}
                        tieneModulosAlumno={tieneModulosAlumno}
                        tieneModulosProfesor={tieneModulosProfesor}
                        puedeAccederPanel={puedeAccederPanel}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 lg:hidden">
                {!mobileMenuOpen && (!isLoggedIn ? (
                  <Link to="/login" className="flex h-9 items-center rounded-full border border-white/25 px-4 text-xs font-black tracking-widest text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400">
                    INGRESAR
                  </Link>
                ) : puedeAccederPanel && (
                  <Link to={rutaMiPanel} aria-label="Ir a mi panel" className="flex h-9 items-center gap-2 rounded-full border border-white/25 pl-1 pr-3 text-xs font-black tracking-widest text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400">
                    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-lime-400 text-[10px] text-black">
                      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : getIniciales(userData.nombrecompleto)}
                    </span>
                    MI PANEL
                  </Link>
                ))}
                <button type="button" aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={mobileMenuOpen} className="p-2 text-foreground" onClick={() => setMobileMenuOpen((previous) => !previous)}>
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          // Menú del celular: se despliega hacia abajo (no ocupa toda la pantalla) y se cierra tocando afuera
          <>
            <div className="fixed inset-x-0 top-[66px] bottom-0 z-30 bg-black/60 lg:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
            <div className="fixed inset-x-0 top-[66px] z-40 max-h-[calc(100svh-66px)] overflow-y-auto overscroll-contain border-b border-white/10 bg-black shadow-2xl lg:hidden">
              <nav aria-label="Secciones del sitio" className="px-4 py-2">
                <ul>
                  {navigation.map((item) => (
                    <li key={item.name}>
                      {item.hasDropdown ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setClasesAbiertas((v) => !v)}
                            aria-expanded={clasesAbiertas}
                            className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-2 text-left text-sm font-black tracking-widest text-white transition-colors hover:text-bravos-green focus-visible:text-bravos-green focus-visible:outline-none"
                          >
                            {item.name}
                            <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${clasesAbiertas ? 'rotate-180 text-bravos-green' : ''}`} aria-hidden="true" />
                          </button>
                          {clasesAbiertas && (
                            <ul className="pb-1 pl-3">
                              {subItemsClases.map((subItem) => (
                                <li key={subItem.href}>
                                  <a href={subItem.href} onClick={() => setMobileMenuOpen(false)} className="flex min-h-[38px] items-center px-2 text-[13px] font-medium text-white/60 transition-colors hover:text-bravos-green focus-visible:text-bravos-green focus-visible:outline-none">
                                    {subItem.name}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <a href={item.href} onClick={() => setMobileMenuOpen(false)} className="flex min-h-[44px] items-center rounded-lg px-2 text-sm font-black tracking-widest text-white transition-colors hover:text-bravos-green focus-visible:text-bravos-green focus-visible:outline-none">
                          {item.name}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="border-t border-white/10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                {!isLoggedIn ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center rounded-lg border border-white/25 text-xs font-bold tracking-wider text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bravos-green">
                      INGRESAR
                    </Link>
                    <Link to="/registro" onClick={() => setMobileMenuOpen(false)} className="flex h-11 items-center justify-center rounded-lg bg-accent text-xs font-black tracking-wider text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bravos-green">
                      UNIRSE
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bravos-green text-sm font-black text-black">
                      {avatarUrl
                        ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                        : (userData.nombrecompleto || '?').trim().charAt(0).toUpperCase()}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-bold capitalize text-white">{userData.nombrecompleto}</p>
                    <button
                      type="button"
                      onClick={() => { setMobileMenuOpen(false); handleLogout() }}
                      className="flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-red-600 px-3 text-xs font-bold text-white transition-colors hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      CERRAR SESIÓN
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* 🟢 SECCIÓN HERO - RECUPERADA CON TU FORMATO NATIVO DE CAPAS EXPANSIVAS */}
      <section className="relative flex min-h-[85svh] items-end pb-8 sm:min-h-screen sm:pb-12">
        {heroImages.map((imageSource, index) => (
          <div key={imageSource} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}>
            <ImgConSkeleton src={imageSource} alt="Entrenamiento" className="h-full w-full object-cover object-[var(--enfoque-movil,center)] sm:object-center" containerClassName="h-full w-full" style={enfoqueMovil(imageSource) ? { '--enfoque-movil': enfoqueMovil(imageSource) } : undefined} loading={index === 0 ? 'eager' : 'lazy'} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
          </div>
        ))}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-40 bg-gradient-to-b from-transparent via-black/70 to-black" aria-hidden="true" />

        <button
          type="button"
          onClick={irAlContenido}
          aria-label="Ver más contenido"
          className="group absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-1 text-white/70 sm:flex transition-colors hover:text-lime-400 focus-visible:text-lime-400 focus-visible:outline-none"
        >
          <span className="h-10 w-px bg-gradient-to-b from-transparent to-current" />
          <ChevronDown className="h-7 w-7 motion-safe:animate-bounce" />
        </button>

        <div className="absolute right-2 bottom-5 z-20 flex sm:right-24 sm:bottom-6">
          {heroImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentImageIndex(index)}
              aria-label={`Ver foto ${index + 1} de ${heroImages.length}`}
              aria-current={index === currentImageIndex ? 'true' : undefined}
              className="group flex h-11 items-center px-1.5 focus-visible:outline-none"
            >
              <span className={`block h-2 rounded-full transition-all group-focus-visible:ring-2 group-focus-visible:ring-lime-400 ${index === currentImageIndex ? 'w-6 bg-accent' : 'w-2 bg-white/50'}`} />
            </button>
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-2">

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-foreground/50">
              <span>Argentina</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground/70">Formosa Capital</span>
            </div>

            {/* Logo */}
            <div className="flex h-16 w-auto items-center sm:h-20 md:h-24 -ml-[2px]">
              {showLogoSkeleton && (
                <div className="h-full w-[220px] bg-white/5 animate-pulse rounded" />
              )}
              {logoUrl && (
                <img
                  src={`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${logoTs}`}
                  alt="Box Bravos"
                  className={`h-full w-auto object-contain object-left ${logoImgLoaded ? '' : 'hidden'}`}
                  onLoad={() => setLogoImgLoaded(true)}
                  onError={() => setLogoFailed(true)}
                  ref={(el) => { if (el?.complete && el.naturalWidth > 0) setLogoImgLoaded(true) }}
                />
              )}
            </div>

            {/* Título */}
            <p
              className="text-xl font-black tracking-wide text-foreground sm:text-2xl md:text-3xl"
              style={{ fontSize: tituloSize ? `${tituloSize}px` : undefined, fontFamily: tituloFont || undefined }}
            >
              {titulo}
            </p>

            {/* Botón para sumarse — solo celular y sin sesión (con sesión, "Mi panel" está en la barra de arriba) */}
            {!isLoggedIn && (
              <div className="mt-4 w-full lg:hidden">
                <Link to="/registro" className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-lime-400 text-sm font-black tracking-widest text-black transition-colors hover:bg-lime-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  UNIRME <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            )}

            {/* MÁS INFO */}
            <button type="button" onClick={irAlContenido} className="group mt-1 -ml-1 flex min-h-11 items-center gap-2 rounded-md px-1 text-xs font-black tracking-widest text-foreground/70 transition-colors hover:text-lime-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 sm:mt-3">
              <span>MÁS INFO</span>
              <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
            </button>
          </div>
        </div>
      </section>

      {/* SECCIÓN FRASE MOTIVACIONAL */}
      <section id="contenido" className="scroll-mt-16 bg-black py-12 md:py-16">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <blockquote className="text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
            {'"EL ÚNICO ENTRENAMIENTO MALO'} <br />
            <span className="text-accent">{'ES EL QUE NO HICISTE"'}</span>
          </blockquote>
        </div>
      </section>

      {/* SECCIÓN SOBRE NOSOTROS */}
      <section id="nosotros" className="relative py-10 md:py-12">
        <div className="absolute inset-0">
          <ImgConSkeleton src={imagenNosotros} alt="Interior del Box" className="h-full w-full object-cover" containerClassName="h-full w-full" />
          <div className="absolute inset-0 bg-black/80" />
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" aria-hidden="true" />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
              {tituloNosotros
                ? <>{tituloNosotros.toUpperCase()}</>
                : <>SOBRE <span className="text-accent">NOSOTROS</span></>
              }
            </h2>
            {descripcionNosotros
              ? <p className="mt-6 text-lg leading-relaxed text-foreground/70">{descripcionNosotros}</p>
              : <p className="mt-6 text-lg leading-relaxed text-foreground/70">Somos más que un gimnasio. Somos una comunidad de atletas comprometidos con la excelencia. Desde 2019, hemos ayudado a cientos de personas a transformar sus vidas a través del entrenamiento funcional.</p>
            }
            {mision
              ? <p className="mt-4 text-lg leading-relaxed text-foreground/70">{mision}</p>
              : <p className="mt-4 text-lg leading-relaxed text-foreground/70">Nuestro Box cuenta con equipamiento Rogue Fitness de primera línea y coaches certificados que te guiarán en cada paso de tu transformación.</p>
            }
            {(() => {
              // Solo cifras reales y mayores a cero; si no hay ninguna, no se muestra el bloque
              const n = (v, uno, varios) => (v === 1 ? uno : varios)
              const cifras = estadisticas ? [
                { value: estadisticas.atletas, label: n(estadisticas.atletas, 'ATLETA ACTIVO', 'ATLETAS ACTIVOS') },
                { value: estadisticas.coaches, label: n(estadisticas.coaches, 'COACH', 'COACHES') },
                { value: estadisticas.clasesPorSemana, label: n(estadisticas.clasesPorSemana, 'CLASE POR SEMANA', 'CLASES POR SEMANA') },
              ].filter((c) => c.value > 0) : []
              if (cifras.length === 0) return null
              return (
                <div className="mt-10 flex flex-wrap gap-x-10 gap-y-6">
                  {cifras.map((stat) => (
                    <div key={stat.label}>
                      <div className="text-3xl font-black text-accent sm:text-4xl">{stat.value}</div>
                      <div className="mt-1 text-xs font-semibold tracking-wider text-foreground/50 sm:text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      </section>

      {/* SECCIÓN CLASES */}
      <section id="clases" className="bg-zinc-950 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-accent">Entrenamiento guiado</p>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">NUESTRAS <span className="text-accent">CLASES</span></h2>
            </div>
            {filtroClase === 'todas' && claseCards.length > 1 && (
              <span className="flex shrink-0 items-center gap-1 pb-1 text-xs text-white/50 md:hidden">
                Deslizar <MoveHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            )}
          </div>

          {/* Filtro por disciplina */}
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0" role="group" aria-label="Filtrar clases">
            {[{ id: 'todas', texto: 'Todas' }, ...claseCards.map((c, i) => ({ id: i, texto: c.titulo }))].map(({ id, texto }) => (
              <button key={id} type="button" onClick={() => setFiltroClase(id)} aria-pressed={filtroClase === id}
                className={`min-h-[38px] shrink-0 rounded-md border px-4 text-xs font-black uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  filtroClase === id ? 'border-accent bg-accent text-black' : 'border-white/15 bg-white/5 text-white/75 hover:border-white/30'
                }`}>
                {texto}
              </button>
            ))}
          </div>

          {/* Celular: tarjetas que se deslizan de costado. Computadora: las tres juntas */}
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
            {claseCards.map((clase, idx) => {
              if (filtroClase !== 'todas' && filtroClase !== idx) return null
              const nivel = NIVELES[clase.level] || clase.level
              return (
                <article key={idx} id={`clase-${idx + 1}`}
                  className={`flex scroll-mt-20 snap-start flex-col overflow-hidden rounded-md border border-border bg-foreground/5 ${filtroClase === 'todas' ? 'w-[85%] shrink-0 sm:w-[60%] md:w-auto' : 'w-full'}`}>
                  <div className="relative aspect-square overflow-hidden">
                    <ImgConSkeleton src={clase.image} alt={clase.titulo} className="h-full w-full object-cover" containerClassName="h-full w-full absolute inset-0" />
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {clase.duration && <span className="rounded-md bg-accent px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-black">{clase.duration}</span>}
                      {nivel && <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">{nivel}</span>}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-xl font-black uppercase text-white">{clase.titulo}</h3>
                    <p className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed text-white/65">{clase.descripcion}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* 🟢 SECCIÓN HORARIOS: 100% SCONECTADA Y FUNCIONANDO EN PARALELO */}
      <section id="horarios" className="relative py-12 md:py-16">
        <div className="absolute inset-0">
          {/* Fondo decorativo: sin texto alternativo, y si el archivo no está se oculta (antes aparecía la palabra "Training") */}
          <img src="/landing-hero-2.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <div className="absolute inset-0 bg-black/90" />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-accent">Calendario activo</p>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">HORARIOS <span className="text-accent">SEMANALES</span></h2>
          <p className="mb-5 mt-2 max-w-2xl text-sm text-white/60">Tocá un día para ver los turnos.</p>

          {/* Días: una sola fila, pareja, en el celular */}
          <div className="mb-6 grid grid-cols-6 gap-1.5 sm:flex sm:flex-wrap sm:gap-2" role="group" aria-label="Día de la semana">
            {diasSemanaMapeo.map((day) => {
              const elegido = diaSeleccionado === day.value
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setDiaSeleccionado(day.value)}
                  aria-pressed={elegido}
                  aria-label={day.label}
                  className={`min-h-[44px] rounded-md border text-xs font-black tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-5 ${
                    elegido
                      ? 'border-accent bg-accent text-black'
                      : 'border-border bg-white/5 text-white/75 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <span className="sm:hidden">{day.corto}</span>
                  <span className="hidden sm:inline">{day.label}</span>
                </button>
              )
            })}
          </div>

          {loadingHorarios ? (
            <div className="space-y-3 animate-pulse" role="status" aria-label="Cargando">{[0, 1, 2].map((i) => <div key={i} className="h-16 rounded-md border border-border bg-white/5" />)}</div>
          ) : clasesVisibles.length === 0 ? (
            <div className="rounded-md border border-border bg-white/5 p-6 text-center">
              <p className="text-sm text-white/50">No hay turnos los {diasSemanaMapeo.find((d) => d.value === diaSeleccionado)?.label.toLowerCase()}.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clasesVisibles.map((item) => (
                <div key={item.idHorario} className="flex items-center gap-4 rounded-md border border-border bg-foreground/5 p-4 transition-colors hover:border-white/25">
                  <div className="shrink-0 text-center">
                    <p className="text-lg font-black leading-none tabular-nums text-accent">{item.horaInicio ? item.horaInicio.slice(0, 5) : '--:--'}</p>
                    <p className="mt-1 text-[11px] tabular-nums text-white/45">a {item.horaFin ? item.horaFin.slice(0, 5) : '--:--'}</p>
                  </div>
                  <div className="h-10 w-px shrink-0 bg-white/10" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate font-black uppercase text-white">{item.nombreClase || 'Clase'}</p>
                    {item.nombreProfesor && <p className="truncate text-sm text-white/55">{item.nombreProfesor}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN CONTACTO */}
      <section id="contacto" className="bg-zinc-950 py-12 text-white md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-widest text-accent">Contacto directo</p>
          <h2 className="mb-6 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl md:text-5xl">Encontranos</h2>

          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 md:gap-8">
            {/* Columna de info */}
            <div className="space-y-3">
              {/* Accesos directos a WhatsApp e Instagram (el mapa va completo, abajo) */}
              {(whatsappDigitos || instagram) && (
                <div className="grid grid-cols-2 gap-3">
                  {whatsappDigitos && (
                    <a href={`https://wa.me/${whatsappDigitos}?text=${encodeURIComponent('Hola Bravos Box, quiero hacer una consulta.')}`}
                      target="_blank" rel="noopener noreferrer"
                      className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-md text-center border border-border bg-foreground/5 p-4 transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${instagram ? '' : 'col-span-2'}`}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#25D366] text-white">
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.78a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88M20.52 3.45A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z" /></svg>
                      </span>
                      <span className="min-w-0 max-w-full">
                        <span className="block text-sm font-black uppercase text-white">WhatsApp</span>
                        <span className="block truncate text-xs text-white/55">+{whatsappDigitos.replace(/^549/, '54 ')}</span>
                      </span>
                    </a>
                  )}
                  {instagram && (
                    <a href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-md text-center border border-border bg-foreground/5 p-4 transition-colors hover:border-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${whatsappDigitos ? '' : 'col-span-2'}`}>
                      <span className="flex h-9 w-9 items-center justify-center rounded-md text-white" style={{ background: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
                      </span>
                      <span className="min-w-0 max-w-full">
                        <span className="block text-sm font-black uppercase text-white">Instagram</span>
                        <span className="block truncate text-xs text-white/55">@{instagram.replace(/^@/, '')}</span>
                      </span>
                    </a>
                  )}
                </div>
              )}
              {/* Dirección, horarios y demás datos */}
              <div className="divide-y divide-white/10 overflow-hidden rounded-md border border-border bg-foreground/5">
                {direccion && (() => {
                  const [calle, ...resto] = direccion.split(',')
                  return (
                    <div className="flex items-start gap-3 p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent"><MapPin className="h-4 w-4" aria-hidden="true" /></span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Dirección</p>
                        <p className="font-bold text-white">{calle.trim()}</p>
                        <p className="text-sm text-white/55">{resto.join(',').trim() || 'Formosa, Argentina'}</p>
                      </div>
                    </div>
                  )
                })()}

                {(horarioSemana || horarioSabado || horarioDomingo) && (() => {
                  const filas = [horarioSemana, horarioSabado, horarioDomingo].map(leerHorario).filter(Boolean)
                  const abierto = estaAbiertoAhora(horarioSemana, horarioSabado, horarioDomingo)
                  return (
                    <div className="flex items-start gap-3 p-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent"><Clock className="h-4 w-4" aria-hidden="true" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Horarios del box</p>
                          {abierto !== null && (
                            <span className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                              abierto ? 'border-accent/40 bg-accent/10 text-accent' : 'border-white/15 bg-white/5 text-white/60'
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${abierto ? 'bg-accent' : 'bg-white/40'}`} aria-hidden="true" />
                              {abierto ? 'Abierto ahora' : 'Cerrado ahora'}
                            </span>
                          )}
                        </div>
                        <dl className="mt-2 space-y-1">
                          {filas.map((f, i) => (
                            <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
                              {f.etiqueta && <dt className="text-white/80">{f.etiqueta}</dt>}
                              <dd className={`ml-auto text-right font-bold tabular-nums ${f.cerrado ? 'font-normal text-white/45' : 'text-white'}`}>{f.valor}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    </div>
                  )
                })()}

                {emailContacto && (
                  <a href={`mailto:${emailContacto}`} className="flex items-center gap-3 p-4 transition-colors hover:bg-white/[0.03]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent"><Mail className="h-4 w-4" aria-hidden="true" /></span>
                    <span className="min-w-0">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-white/50">Email</span>
                      <span className="block truncate text-sm font-bold text-white">{emailContacto}</span>
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* Columna de Mapa (en el celular va debajo de los datos) */}
            <div className="h-[280px] w-full overflow-hidden rounded-md border border-border shadow-lg md:h-[360px]">
              {!mapaVisible ? (
                <button
                  type="button"
                  onClick={() => setMapaVisible(true)}
                  className="flex h-full w-full flex-col items-center justify-center gap-3 bg-muted/40 px-6 text-center transition-colors hover:bg-muted/70"
                >
                  <MapPin className="h-10 w-10 text-accent" />
                  <span className="text-sm font-black uppercase tracking-widest text-foreground">Ver mapa</span>
                  <span className="max-w-xs text-xs text-foreground/50">
                    El mapa lo muestra Google Maps, que puede guardar cookies propias.
                  </span>
                </button>
              ) : (
              <iframe
                src={mapaUrl}
                width="100%"
                height="100%"
                style={{ filter: 'grayscale(0.8) invert(1) contrast(0.9)' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de ubicación"
              />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-black py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex flex-col items-center gap-2">
              {/* El mismo logo del encabezado (se carga en Configuración → Portada y logo) */}
              {logoUrl && !logoFailed ? (
                <img
                  src={`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${logoTs}`}
                  alt="Bravos Box"
                  loading="lazy"
                  className="block h-auto max-h-[64px] w-auto max-w-[200px] object-contain"
                />
              ) : (
                <span className="text-xl font-black uppercase tracking-tight text-white">Bravos Box</span>
              )}
              <p className="text-xs text-white/50">Centro de entrenamiento funcional y CrossFit · Formosa</p>
            </div>
            <nav aria-label="Información legal" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/65">
              <Link to="/terminos" className="hover:text-white">Términos y condiciones</Link>
              <Link to="/privacidad" className="hover:text-white">Privacidad</Link>
              <Link to="/cookies" className="hover:text-white">Cookies</Link>
              <Link to="/reembolsos" className="hover:text-white">Reembolsos</Link>
            </nav>
            <Link
              to="/arrepentimiento"
              className="flex min-h-[44px] items-center rounded-md border border-white/25 bg-white/5 px-5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:border-accent hover:text-accent"
            >
              Botón de arrepentimiento
            </Link>
          </div>
          <div className="mt-8 flex flex-col items-center gap-2 border-t border-border pt-6 text-center text-xs text-white/40">
            <p>2026 Bravos Box. Todos los derechos reservados.</p>
            <a
              href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white"
            >
              Defensa de las y los consumidores. Para reclamos ingresá aquí.
            </a>
          </div>
        </div>
      </footer>
      {whatsappDigitos && (
        <a
          href={`https://wa.me/${whatsappDigitos}?text=${encodeURIComponent('Hola Bravos Box, quiero hacer una consulta.')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/40 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <svg viewBox="0 0 32 32" className="h-8 w-8" fill="currentColor" aria-hidden="true">
            <path d="M16.04 3C8.86 3 3.04 8.82 3.04 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.94 12.94 0 0 0 16.04 29C23.22 29 29 23.18 29 16S23.22 3 16.04 3Zm0 23.62c-1.98 0-3.92-.53-5.61-1.53l-.4-.24-3.96 1.04 1.06-3.86-.26-.4A10.6 10.6 0 0 1 5.42 16c0-5.86 4.76-10.62 10.62-10.62 5.85 0 10.6 4.76 10.6 10.62 0 5.86-4.75 10.62-10.6 10.62Zm5.82-7.95c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.07 1.3 3.28c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" />
          </svg>
        </a>
      )}
    </div>
  )
}

export default LandingPage