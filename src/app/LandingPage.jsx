import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, LogOut, Mail, MapPin, Menu, Trophy, X } from 'lucide-react'
import { haySesion, cerrarSesionEnServidor } from '@/lib/sesion'
import { ImgConSkeleton } from '@/components/ImgConSkeleton'
import { LandingPageSkeleton } from '@/components/LandingPageSkeleton'
import UserMenu from '@/components/UserMenu'
import CampanaPortada from '@/components/CampanaPortada'
import NovedadesPortada from '@/components/NovedadesPortada'

/*
 * Portada pública (diseño "Bravos Landing"). Los datos de clases, contacto, horarios y mapa salen de Configuración
 * y de los turnos publicados; el diseño y los textos fijos son los de la referencia.
 */

// "Novedades" del menú solo aparece con sesión iniciada (abre el aviso con todas las novedades)
const MENU = [
  { name: 'Clases', href: '#clases' },
  { name: 'Horarios', href: '#horarios' },
  { name: 'Novedades', href: '#novedades', soloSesion: true, accion: 'novedades' },
  { name: 'Nosotros', href: '#nosotros' },
  { name: 'Contacto', href: '#contacto' },
]

// Movimiento de la portada: entradas al cargar, bloques que aparecen al bajar y listas escalonadas.
// Con "reducir movimiento" en el sistema no se anima nada.
const ANIMACIONES = `
@keyframes landing-sube { from { opacity: 0; transform: translateY(28px) } to { opacity: 1; transform: none } }
@keyframes landing-entra { from { opacity: 0 } to { opacity: 1 } }
.landing-sube { animation: landing-sube .9s cubic-bezier(.22,1,.36,1) both }
.landing-entra { animation: landing-entra 1.1s ease both }
.landing-revelar { opacity: 0 }
.landing-revelar.visible { animation: landing-sube .8s cubic-bezier(.22,1,.36,1) both }
.landing-lista > * { animation: landing-sube .5s cubic-bezier(.22,1,.36,1) both }
.landing-lista > :nth-child(2) { animation-delay: .08s }
.landing-lista > :nth-child(3) { animation-delay: .16s }
.landing-lista > :nth-child(n+4) { animation-delay: .24s }
@media (prefers-reduced-motion: reduce) {
  .landing-sube, .landing-entra, .landing-revelar.visible, .landing-lista > * { animation: none !important }
  .landing-revelar { opacity: 1 }
}
`

const TEXTO_NOSOTROS ='Nuestro centro de entrenamiento busca honrar la memoria de los héroes argentinos. Por los que volvieron y los que se quedaron velando por nuestras Islas.'
const TEXTO_MISION = 'Somos una comunidad comprometida con el bienestar y el desarrollo integral de las personas. Trabajamos con atención, profesionalismo y compromiso, acompañando a cada alumno a superar sus propios límites a través del CrossFit.'

const DIAS = [
  { label: 'LUNES', corto: 'LUN', value: 'LUNES' },
  { label: 'MARTES', corto: 'MAR', value: 'MARTES' },
  { label: 'MIÉRCOLES', corto: 'MIÉ', value: 'MIERCOLES' },
  { label: 'JUEVES', corto: 'JUE', value: 'JUEVES' },
  { label: 'VIERNES', corto: 'VIE', value: 'VIERNES' },
  { label: 'SÁBADO', corto: 'SÁB', value: 'SABADO' },
]

const abrirAccion = (e, item) => {
  if (!item.accion) return
  e.preventDefault()
  if (item.accion === 'novedades') window.dispatchEvent(new Event('bravos:abrir-novedades'))
}

/*
 * Horarios de atención: se cargan en Configuración como texto libre ("Lun-Vie: 6:00 - 22:00", "Domingo: Cerrado").
 * Si se puede leer el rango de horas se calcula si el box está abierto ahora.
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

// Número de WhatsApp solo con dígitos (wa.me pide 549 + característica + número)
function digitosWhatsapp(valor) {
  let d = (valor || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('549')) return d
  if (d.startsWith('54')) return '549' + d.slice(2)
  return '549' + d.replace(/^0/, '')
}

const iniciales = (nombre) => {
  if (!nombre || nombre === 'Usuario Bravos') return 'UB'
  const partes = nombre.trim().split(' ')
  return partes.length > 1 ? (partes[0][0] + partes[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase()
}

// Sesión guardada en el navegador (el servidor igual valida todo)
function leerSesion() {
  if (!haySesion()) return null
  const leer = (clave, defecto) => { try { return JSON.parse(localStorage.getItem(clave) || '') ?? defecto } catch { return defecto } }
  const u = leer('usuario', {})
  return {
    userData: {
      nombrecompleto: u?.nombrecompleto || u?.nombre || u?.username || 'Usuario Bravos',
      correo: u?.correo || u?.email || 'sin-correo@bravos.com',
      perfil: u?.perfil || u?.rol || u?.tipo || 'cliente',
      estado: u?.estado || 'activo',
    },
    permisos: Array.isArray(leer('permisos', [])) ? leer('permisos', []) : [],
    avatarUrl: localStorage.getItem('avatarUrl') || '',
  }
}

function LandingPage() {
  const [sesion, setSesion] = useState(leerSesion)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [cfg, setCfg] = useState({})
  const [turnosBox, setTurnosBox] = useState([])
  const [loadingHorarios, setLoadingHorarios] = useState(true)
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => ['LUNES', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'][new Date().getDay()])
  const [mapaVisible, setMapaVisible] = useState(false)

  const logueado = !!sesion

  // Carrusel de la portada: las fotos hero1..hero3 del admin, cambian cada 5 s con fundido.
  // Sin fotos cargadas queda la foto de Malvinas.
  const fotosHero = Object.values(cfg.heroImages || {}).filter(Boolean)
  const imagenesHero = fotosHero.length ? fotosHero : ['/hero-malvinas.png']
  const [indiceHero, setIndiceHero] = useState(0)
  useEffect(() => {
    if (imagenesHero.length <= 1) return
    const intervalo = setInterval(() => setIndiceHero((i) => (i + 1) % imagenesHero.length), 5000)
    return () => clearInterval(intervalo)
  }, [imagenesHero.length])


  // Lo que tiene data-revela aparece con un movimiento suave al entrar en pantalla (una sola vez)
  useEffect(() => {
    if (!configLoaded) return
    const elementos = document.querySelectorAll('[data-revela]')
    if (!('IntersectionObserver' in window)) { elementos.forEach((el) => el.classList.add('visible')); return }
    const observador = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observador.unobserve(e.target) }
      })
    }, { threshold: 0.15 })
    elementos.forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [configLoaded])

  // Datos de la configuración (con reintentos si el servidor no responde; sin datos de relleno)
  useEffect(() => {
    let vivo = true
    let reintento = null
    const alAvatar = (e) => setSesion((s) => (s ? { ...s, avatarUrl: e.detail || '' } : s))
    window.addEventListener('avatar-updated', alAvatar)

    const cargarConfig = (intento = 0) => fetch(`/landing/config?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`La configuración respondió ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (!vivo) return
        setCfg(data || {})
        setConfigLoaded(true)
      })
      .catch((err) => {
        console.error('No se pudo cargar la configuración, se reintenta:', err)
        if (vivo) reintento = setTimeout(() => cargarConfig(intento + 1), Math.min(2000 * 2 ** intento, 15000))
      })
    cargarConfig()

    fetch('/api/vv1/turnos/publicos')
      .then((res) => res.json())
      .then((result) => { if (vivo) setTurnosBox(Array.isArray(result.data) ? result.data : []) })
      .catch((err) => console.error('Error al sincronizar horarios en la landing:', err))
      .finally(() => { if (vivo) setLoadingHorarios(false) })

    return () => {
      vivo = false
      if (reintento) clearTimeout(reintento)
      window.removeEventListener('avatar-updated', alAvatar)
    }
  }, [])

  // Un solo panel a la vez: el menú del celular y el de cuenta no quedan abiertos juntos
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === 'Escape') { setMenuAbierto(false); setUserMenuOpen(false) } }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [])

  const handleLogout = () => {
    cerrarSesionEnServidor()
    ;['usuario', 'avatarUrl', 'permisos'].forEach((k) => localStorage.removeItem(k))
    window.location.reload()
  }

  const permisos = sesion?.permisos || []
  const tieneModulosAdmin = permisos.some((p) => ['usuarios:', 'dashboard:', 'perfiles:', 'membresias:', 'clases:', 'reservas:', 'creditos:', 'configuracion:'].some((pre) => p.startsWith(pre)))
  const tieneModulosAlumno = permisos.some((p) => p.startsWith('alumno'))
  const tieneModulosProfesor = permisos.some((p) => p.startsWith('profesor'))
  const puedeAccederPanel = permisos.length > 0 && sesion?.userData.estado === 'activo'
  const panelesDisponibles = [tieneModulosAlumno && '/alumno', tieneModulosProfesor && '/profesor', tieneModulosAdmin && '/admin'].filter(Boolean)
  const rutaMiPanel = panelesDisponibles.length === 1 ? panelesDisponibles[0] : '/seleccionar-panel'

  const menu = MENU.filter((item) => !item.soloSesion || logueado)

  // Clases: dos tarjetas (CrossFit y Planificación), con lo que se cargó en Configuración
  const clases = [
    { t: cfg.claseCard1Titulo || 'CrossFit', d: cfg.claseCard1Descripcion || 'Entrenamiento funcional de alta intensidad.', min: '60 min', img: cfg.imagenClase1 || '/grupo.png', alt: 'Comunidad Bravos en el box' },
    { t: cfg.claseCard3Titulo || 'Planificación', d: cfg.claseCard3Descripcion || 'Programa personalizado para atletas.', min: '90 min', img: cfg.imagenClase3 || '/atleta.png', alt: 'Atleta levantando la barra' },
  ]

  // Horarios del día elegido (el sábado solo abre Planificación Atleta, turno siesta)
  const turnosDelDia = diaSeleccionado === 'SABADO'
    ? turnosBox
        .filter((t) => /atleta/i.test(t.nombre))
        .map((t) => ({ ...t, horarios: t.horarios.filter((h) => /siesta/i.test(h.turno)) }))
        .filter((t) => t.horarios.length > 0)
    : turnosBox

  const whatsapp = digitosWhatsapp(cfg.whatsapp || cfg.telefono)
  const direccion = cfg.direccion || 'Eva Perón 552'
  const [calle, ...resto] = direccion.split(',')
  const abiertoAhora = estaAbiertoAhora(cfg.horario_semana, cfg.horario_sabado, cfg.horario_domingo)
  const filasHorario = [cfg.horario_semana || 'Lun-Vie: 6:00 - 22:00', cfg.horario_sabado || 'Sábado: 17:00 - 19:00', cfg.horario_domingo || 'Domingo: Cerrado'].map(leerHorario).filter(Boolean)
  // Reservar solo para alumnos con sesión iniciada (el resto ve los horarios sin poder reservar)
  const esAlumno = logueado && permisos.some((p) => p.startsWith('alumno'))
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${direccion}, Formosa`)}`

  if (!configLoaded) return <LandingPageSkeleton />

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0b0b] text-[#ecefe4] selection:bg-[#9be600] selection:text-[#0b0b0b]" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <style>{ANIMACIONES}</style>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-[#9be600] focus:px-3.5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-[#0b0b0b]">
        Saltar al contenido
      </a>

      {/* ENCABEZADO */}
      <header className="sticky top-0 z-40 border-b border-[#262626] bg-[rgba(11,11,11,.92)] backdrop-blur-[10px]">
        <div className="relative mx-auto flex h-[68px] max-w-[1720px] items-center gap-6 px-5">
          <Link to="/" aria-label="Bravos Box, inicio" className="flex shrink-0">
            <img src="/bravos-logo.png" alt="Bravos Box" className="h-[34px] w-auto" />
          </Link>

          <nav aria-label="Principal" className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 gap-1 min-[900px]:flex">
            {menu.map((item) => (
              <a key={item.name} href={item.href} onClick={(e) => abrirAccion(e, item)}
                className="relative flex h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#c9ccbf] no-underline transition-colors after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:origin-left after:scale-x-0 after:bg-[#9be600] after:transition-transform hover:after:scale-x-100 hover:bg-[#161616] hover:text-[#ecefe4] focus-visible:outline-2 focus-visible:outline-[#9be600]">
                {item.name}
              </a>
            ))}
          </nav>
          <span className="flex-1 min-[900px]:hidden" />

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link to="/ranking" className="hidden h-11 items-center gap-2 rounded-[10px] border border-[#3d5a10] px-4 text-[0.8125rem] font-bold tracking-[.04em] text-[#9be600] no-underline transition-colors hover:bg-[#16220a] min-[900px]:flex">
              <Trophy className="h-4 w-4" aria-hidden="true" />
              RANKING
            </Link>

            {logueado ? (
              <>
                <span className="hidden min-[900px]:inline-flex"><CampanaPortada verTodasHref={esAlumno ? '/alumno/notificaciones' : null} /></span>
                <div className="relative hidden min-[900px]:block">
                  <button type="button" onClick={() => setUserMenuOpen((v) => !v)} aria-expanded={userMenuOpen} aria-haspopup="menu" aria-label="Mi cuenta"
                    className="grid h-11 w-11 place-items-center overflow-hidden rounded-full border-2 border-[#9be600] bg-[#1f2a0e] text-sm font-extrabold text-[#9be600] focus-visible:outline-2 focus-visible:outline-[#9be600]">
                    {sesion.avatarUrl ? <img src={sesion.avatarUrl} alt="" className="h-full w-full object-cover" /> : iniciales(sesion.userData.nombrecompleto)}
                  </button>
                  <UserMenu
                    userData={sesion.userData}
                    sinAcordeon
                    avatarUrl={sesion.avatarUrl}
                    userMenuOpen={userMenuOpen}
                    setUserMenuOpen={setUserMenuOpen}
                    handleLogout={handleLogout}
                    tieneModulosAdmin={tieneModulosAdmin}
                    tieneModulosAlumno={tieneModulosAlumno}
                    tieneModulosProfesor={tieneModulosProfesor}
                    puedeAccederPanel={puedeAccederPanel}
                  />
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-2 min-[900px]:flex">
                <Link to="/login" className="flex h-11 items-center rounded-[10px] px-4 text-xs font-black tracking-widest text-[#ecefe4] no-underline hover:bg-[#161616]">INGRESAR</Link>
                <Link to="/registro" className="flex h-11 items-center rounded-[10px] bg-[#9be600] px-5 text-xs font-black tracking-widest text-[#0b0b0b] no-underline hover:bg-[#c4ff3d]">UNIRSE</Link>
              </div>
            )}

            <button type="button" onClick={() => setMenuAbierto((v) => !v)} aria-expanded={menuAbierto} aria-controls="menu-m" aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
              className="grid h-11 w-11 place-items-center rounded-[10px] border border-[#333] text-[#ecefe4] min-[900px]:hidden">
              {menuAbierto ? <X className="h-[22px] w-[22px]" /> : <Menu className="h-[22px] w-[22px]" />}
            </button>
          </div>
        </div>

        {menuAbierto && (
          <nav id="menu-m" aria-label="Principal" className="flex flex-col border-t border-[#262626] bg-[#0b0b0b] px-5 pt-2 pb-5 min-[900px]:hidden">
            <Link to="/ranking" onClick={() => setMenuAbierto(false)} className="flex min-h-[3.25rem] items-center gap-2 border-b border-[#1f1f1f] text-[1.0625rem] font-bold text-[#9be600] no-underline">
              <Trophy className="h-[18px] w-[18px]" aria-hidden="true" /> Ranking
            </Link>
            {menu.map((item) => (
              <a key={item.name} href={item.href} onClick={(e) => { abrirAccion(e, item); setMenuAbierto(false) }}
                className="flex min-h-[3.25rem] items-center border-b border-[#1f1f1f] text-[1.0625rem] font-bold text-[#ecefe4] no-underline">
                {item.name}
              </a>
            ))}
            {logueado ? (
              <>
                {puedeAccederPanel && (
                  <Link to={rutaMiPanel} onClick={() => setMenuAbierto(false)} className="mt-2 flex h-12 items-center justify-center rounded-[10px] border border-[#333] text-sm font-bold text-[#ecefe4] no-underline">Ir a mi panel</Link>
                )}
                <button type="button" onClick={handleLogout} className="mt-2 flex h-12 items-center justify-center gap-2 rounded-[10px] text-sm font-bold text-[#ff6b5e]">
                  <LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
                </button>
              </>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/login" onClick={() => setMenuAbierto(false)} className="flex h-12 items-center justify-center rounded-[10px] border border-[#333] text-sm font-bold text-[#ecefe4] no-underline">INGRESAR</Link>
                <Link to="/registro" onClick={() => setMenuAbierto(false)} className="flex h-12 items-center justify-center rounded-[10px] bg-[#9be600] text-sm font-extrabold text-[#0b0b0b] no-underline">UNIRSE</Link>
              </div>
            )}
            {esAlumno && (
              <a href="#horarios" onClick={() => setMenuAbierto(false)} className="mt-3 flex h-[3.125rem] items-center justify-center rounded-[10px] bg-[#9be600] text-sm font-extrabold tracking-[.04em] text-[#0b0b0b] no-underline">RESERVAR CLASE</a>
            )}
          </nav>
        )}
      </header>

      <main id="main">
        {/* PORTADA: foto de Malvinas a pantalla completa */}
        <section aria-labelledby="t-hero" className="relative flex min-h-[640px] items-end overflow-hidden md:min-h-[min(calc(100vh-68px),820px)]">
          {imagenesHero.map((src, i) => (
            <img key={src} src={src} alt={i === indiceHero ? 'Entrenamiento en Bravos Box' : ''} aria-hidden={i !== indiceHero ? 'true' : undefined} className={`absolute inset-0 h-full w-full object-cover object-[62%_center] transition-opacity duration-1000 lg:object-center ${i === indiceHero ? 'opacity-100' : 'opacity-0'}`} />
          ))}
          <div aria-hidden="true" className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(11,11,11,.9) 0%,rgba(11,11,11,.5) 45%,rgba(11,11,11,.1) 100%)' }} />
          {/* Degradé de abajo a negro: en celular ocupa el 45 % de la portada (como antes); en escritorio solo un borde corto (12 %) para que la foto no corte de golpe */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#0b0b0b] to-transparent md:h-[12%]" />

          <div className="relative mx-auto w-full max-w-[1720px] px-5 pb-10 md:px-10 md:pb-16">
            <div className="landing-entra inline-flex items-center gap-2 text-[0.8125rem] font-semibold tracking-[.08em] text-[#c9ccbf]">
              <MapPin className="h-[15px] w-[15px] text-[#9be600]" aria-hidden="true" />
              FORMOSA CAPITAL · ARGENTINA
            </div>
            <h1 id="t-hero" className="mt-[1.125rem] flex flex-col gap-3.5">
              <img src="/bravos-logo.png" alt="Bravos Box" className="landing-sube h-16 w-auto self-start md:h-[5.25rem] lg:h-24" style={{ animationDelay: '.15s' }} />
              <span className="landing-sube font-[Archivo]! text-[1.25rem] font-extrabold tracking-[.06em] uppercase md:text-[1.25rem] lg:text-[1.5rem]" style={{ animationDelay: '.3s' }}>
                Centro de <span className="text-[#9be600]">entrenamiento</span>
              </span>
            </h1>

            <div className="landing-sube mt-7 flex flex-wrap gap-3" style={{ animationDelay: '.45s' }}>
              {esAlumno && (
                <Link to="/alumno/reservar" className="flex h-[3.375rem] w-full items-center justify-center rounded-[10px] bg-[#9be600] px-6 text-[0.9375rem] font-extrabold tracking-[.04em] text-[#0b0b0b] no-underline transition-colors hover:bg-[#c4ff3d] md:w-auto">
                  RESERVAR CLASE
                </Link>
              )}
              <a href="#horarios" className="flex h-[3.375rem] w-full items-center justify-center rounded-[10px] border border-[rgba(236,239,228,.45)] px-6 text-[0.9375rem] font-bold text-[#ecefe4] no-underline transition-colors hover:border-[#9be600] md:w-auto">
                Ver horarios
              </a>
            </div>
          </div>
        </section>

        {/* NOSOTROS: el lema es lo único con la tipografía stencil del logo */}
        <section id="nosotros" aria-labelledby="t-nos" className="relative scroll-mt-20 overflow-hidden border-b border-[#1f1f1f] md:border-b-0">
          {/* Foto del box con degradé arriba y abajo (solo escritorio; en celular la sección queda como antes) */}
          <div aria-hidden="true" className="absolute inset-0 hidden md:block">
            <ImgConSkeleton src={cfg.imagenNosotros || '/nosotros-fondo.jpg'} alt="" className="h-full w-full object-cover" containerClassName="h-full w-full" />
            <div className="absolute inset-0 bg-black/[.9]" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0b0b0b] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0b0b0b] to-transparent" />
          </div>
          <div className="relative mx-auto grid max-w-[1720px] items-center gap-12 px-5 py-16 lg:py-16 md:grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] md:gap-12">
            <p data-revela className="landing-revelar m-0 font-[Big_Shoulders_Stencil_Display]! text-[2.75rem] leading-[.95] font-black text-[#ecefe4] uppercase md:text-[3.5rem] lg:text-[4.5rem]">
              "El único entrenamiento malo <span className="text-[#9be600]">es el que no hiciste"</span>
            </p>
            <div data-revela className="landing-revelar flex flex-col gap-3.5" style={{ animationDelay: '.15s' }}>
              <img src="/malvinas.png" alt="" aria-hidden="true" className="h-auto w-[12.5rem] max-w-[60%] md:mx-auto" />
              <h2 id="t-nos" className="m-0 font-[Archivo]! text-2xl leading-[1.25] font-extrabold text-[#ecefe4]">Honor y gloria a los Bravos de Malvinas</h2>
              <p className="m-0 text-base leading-relaxed text-[#c9ccbf]">{cfg.descripcionNosotros || TEXTO_NOSOTROS}</p>
              <p className="m-0 text-base leading-relaxed text-[#a3a698]">{cfg.mision || TEXTO_MISION}</p>
              <p className="m-0 hidden text-xs font-bold tracking-[.12em] text-[#9be600] uppercase md:block">{cfg.tituloNosotros || 'Sobre nosotros'}</p>
            </div>
          </div>
        </section>

        {/* CLASES: dos tarjetas que ocupan todo el ancho */}
        <section id="clases" aria-labelledby="t-cla" className="scroll-mt-20">
          <div className="mx-auto max-w-[1720px] px-5 py-16 lg:py-16">
            <p className="m-0 text-xs font-bold tracking-[.12em] text-[#9be600]">ENTRENAMIENTO GUIADO</p>
            <h2 id="t-cla" className="mt-2 mb-7 font-[Archivo]! text-[2rem] leading-[1.05] font-extrabold tracking-[-.02em] md:text-[2.75rem]">Nuestras clases</h2>
            <div className="flex flex-col items-center gap-5 md:flex-row md:items-stretch md:justify-center md:gap-6">
              {clases.map((k, i) => (
                <article key={i} id={`clase-${i + 1}`} data-revela style={{ animationDelay: `${i * 140}ms` }} className="landing-revelar group flex w-full scroll-mt-20 flex-col overflow-hidden md:w-[min(calc((100%-3rem)/3),22rem)] rounded-[18px] border border-[#262626] bg-[#161616] transition-[transform,border-color] duration-300 hover:border-[#9be600]/50 motion-safe:hover:-translate-y-1">
                  {/* Marco de alto fijo: la foto llena el marco (se recorta un poco en los bordes) y las dos tarjetas quedan del mismo tamaño */}
                  <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-[22rem]">
                    <ImgConSkeleton src={k.img} alt={k.alt} className="block h-full w-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-105" containerClassName="absolute inset-0 h-full w-full" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2.5 p-[22px]">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-md bg-[#1f2a0e] px-2.5 py-1 text-xs font-bold text-[#9be600]">{k.min}</span>
                      <span className="rounded-md border border-[#333] px-2.5 py-1 text-xs font-bold text-[#c9ccbf]">Todos los niveles</span>
                    </div>
                    <h3 className="m-0 mt-1 font-[Archivo]! text-2xl font-extrabold">{k.t}</h3>
                    <p className="m-0 flex-1 text-base leading-normal text-[#a3a698]">{k.d}</p>
                    <a href="#horarios" className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] font-bold text-[#9be600] no-underline">
                      Ver horarios de {k.t} <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* HORARIOS */}
        <section id="horarios" aria-labelledby="t-hor" className="scroll-mt-20 border-y border-[#1f1f1f] bg-[#0e0e0e]">
          <div className="mx-auto max-w-[1720px] px-5 py-16 lg:py-16">
            <p className="m-0 text-xs font-bold tracking-[.12em] text-[#9be600]">CALENDARIO ACTIVO</p>
            <h2 id="t-hor" className="mt-2 mb-6 font-[Archivo]! text-[2rem] leading-[1.05] font-extrabold tracking-[-.02em] md:text-[2.75rem]">Horarios semanales</h2>

            <div role="tablist" aria-label="Día de la semana" className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {DIAS.map((d) => {
                const on = diaSeleccionado === d.value
                return (
                  <button key={d.value} type="button" role="tab" aria-selected={on} onClick={() => setDiaSeleccionado(d.value)}
                    className={`h-[2.875rem] shrink-0 rounded-[10px] border px-[1.125rem] text-sm font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#9be600] ${on ? 'border-[#9be600] bg-[#9be600] text-[#0b0b0b]' : 'border-[#333] text-[#ecefe4] hover:border-[#555]'}`}>
                    <span className="md:hidden">{d.corto}</span>
                    <span className="hidden md:inline">{d.label}</span>
                  </button>
                )
              })}
            </div>

            {loadingHorarios ? (
              <div className="grid animate-pulse gap-5 md:grid-cols-2" role="status" aria-label="Cargando horarios">
                {[0, 1].map((i) => <div key={i} className="h-40 rounded-2xl border border-[#262626] bg-[#161616]" />)}
              </div>
            ) : turnosDelDia.length === 0 ? (
              <p className="rounded-2xl border border-[#262626] bg-[#161616] p-6 text-center text-sm text-[#a3a698]">
                {turnosBox.length === 0 ? 'Los horarios se publican muy pronto.' : 'No hay turnos publicados este día.'}
              </p>
            ) : (
              <div key={diaSeleccionado} className="landing-lista grid gap-5 md:grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))]">
                {turnosDelDia.map((tipo) => {
                  const minutos = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))
                  const turnos = Object.values(
                    [...tipo.horarios]
                      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
                      .reduce((acc, h) => {
                        const clave = `${h.turno}|${h.etiqueta || ''}`
                        ;(acc[clave] ||= { clave, turno: h.turno, etiqueta: h.etiqueta, horas: [] }).horas.push(h)
                        return acc
                      }, {})
                  )
                  return (
                    <article key={tipo.codigo} className="rounded-2xl border border-[#262626] bg-[#161616] px-5 py-2">
                      <h3 className="my-3 font-[Archivo]! text-xs font-bold tracking-[.12em] text-[#9be600] uppercase">{tipo.nombre}</h3>
                      {turnos.map((t, i) => (
                        <div key={t.clave} className={`flex flex-wrap items-center gap-2.5 py-3.5 ${i ? 'border-t border-[#262626]' : ''}`}>
                          <div className="min-w-[7.5rem] flex-1">
                            <p className="m-0 text-[0.9375rem] font-bold">Turno {t.turno}</p>
                            {t.etiqueta && <p className="m-0 text-[0.8125rem] text-[#a3a698]">{t.etiqueta}</p>}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {t.horas.map((h) => {
                              const largo = minutos(h.horaFin) - minutos(h.horaInicio) > 90
                              const texto = largo ? `${h.horaInicio.slice(0, 5)} a ${h.horaFin.slice(0, 5)}` : h.horaInicio.slice(0, 5)
                              return esAlumno ? (
                                <Link key={`${h.horaInicio}-${h.horaFin}`} to="/alumno/reservar" aria-label={`Reservar ${largo ? `de ${h.horaInicio.slice(0, 5)} a ${h.horaFin.slice(0, 5)}` : `a las ${h.horaInicio.slice(0, 5)}`}`}
                                  className="flex h-10 items-center rounded-full border border-[#333] px-3.5 text-sm font-bold text-[#ecefe4] no-underline transition-colors hover:border-[#9be600] hover:bg-[#1f2a0e]">
                                  {texto}
                                </Link>
                              ) : (
                                <span key={`${h.horaInicio}-${h.horaFin}`} className="flex h-10 items-center rounded-full border border-[#333] px-3.5 text-sm font-bold text-[#ecefe4]">
                                  {texto}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </article>
                  )
                })}
              </div>
            )}
            <p className="mt-4 text-sm text-[#a3a698]">
              {esAlumno ? 'Tocá un horario para reservar.' : 'Para reservar un horario tenés que iniciar sesión como alumno.'}
            </p>
          </div>
        </section>

        {/* Novedades del box (solo para quien tiene sesión): el aviso se abre desde el menú */}
        <NovedadesPortada soloAviso />

        {/* CONTACTO */}
        <section id="contacto" aria-labelledby="t-con" className="scroll-mt-20">
          <div className="mx-auto max-w-[1720px] px-5 py-16 lg:py-16">
            <p className="m-0 text-xs font-bold tracking-[.12em] text-[#9be600]">CONTACTO DIRECTO</p>
            <h2 id="t-con" className="mt-2 mb-7 font-[Archivo]! text-[2rem] leading-[1.05] font-extrabold tracking-[-.02em] md:text-[2.75rem]">Encontranos</h2>

            <div className="grid gap-5 md:grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))]">
              <div className="flex flex-col gap-3">
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-[#262626] bg-[#161616] px-5 py-[1.125rem] text-[#ecefe4] no-underline transition-colors hover:border-[#9be600]">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#1f2a0e] text-[#9be600]"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
                  <span className="flex-1">
                    <span className="block text-lg font-extrabold">{calle.trim()}</span>
                    <span className="block text-sm text-[#a3a698]">{resto.join(',').trim() || 'Formosa, Argentina'}</span>
                  </span>
                  <span className="text-sm font-bold text-[#9be600]">Cómo llegar ↗<span className="sr-only"> (se abre en otra pestaña)</span></span>
                </a>

                <div className="rounded-2xl border border-[#262626] bg-[#161616] px-5 py-[1.125rem]">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <h3 className="m-0 text-xs font-bold tracking-[.12em] text-[#a3a698]">HORARIOS DEL BOX</h3>
                    {abiertoAhora !== null && (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-bold ${abiertoAhora ? 'border-[#3d5a10] bg-[#16220a] text-[#9be600]' : 'border-[#333] text-[#a3a698]'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${abiertoAhora ? 'bg-[#9be600]' : 'bg-[#6b6b6b]'}`} aria-hidden="true" />
                        {abiertoAhora ? 'Abierto ahora' : 'Cerrado ahora'}
                      </span>
                    )}
                  </div>
                  <dl className="m-0 grid grid-cols-[1fr_auto] gap-y-2 text-[0.9375rem]">
                    {filasHorario.map((f, i) => (
                      <div key={i} className="contents">
                        <dt className="text-[#ecefe4]">{f.etiqueta}</dt>
                        <dd className={`m-0 text-right font-bold tabular-nums ${f.cerrado ? 'font-normal text-[#a3a698]' : ''}`}>{f.valor}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola Bravos Box, quiero hacer una consulta.')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#161616] p-4 text-[#ecefe4] no-underline transition-colors hover:border-[#9be600]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#25D366] text-white"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.78a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88M20.52 3.45A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z" /></svg></span>
                      <span className="min-w-0">
                        <span className="block text-[0.9375rem] font-bold">WhatsApp</span>
                        <span className="block truncate text-[0.8125rem] text-[#a3a698]">+{whatsapp.replace(/^549/, '54 ')}</span>
                      </span>
                    </a>
                  )}
                  {cfg.instagram && (
                    <a href={`https://instagram.com/${cfg.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#161616] p-4 text-[#ecefe4] no-underline transition-colors hover:border-[#9be600]">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-white" style={{ background: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg></span>
                      <span className="min-w-0">
                        <span className="block text-[0.9375rem] font-bold">Instagram</span>
                        <span className="block truncate text-[0.8125rem] text-[#a3a698]">@{cfg.instagram.replace(/^@/, '')}</span>
                      </span>
                    </a>
                  )}
                </div>
                {cfg.email && (
                  <a href={`mailto:${cfg.email}`} className="flex items-center gap-3 rounded-2xl border border-[#262626] bg-[#161616] p-4 text-[#ecefe4] no-underline transition-colors hover:border-[#9be600]">
                    <Mail className="h-5 w-5 text-[#9be600]" aria-hidden="true" />
                    <span className="min-w-0 truncate text-[0.9375rem] font-bold">{cfg.email}</span>
                  </a>
                )}
              </div>

              {/* Mapa: no carga hasta tocar "Cargar mapa" (Google Maps puede guardar cookies) */}
              <div className="relative min-h-[20rem] overflow-hidden rounded-2xl border border-[#262626] bg-[#161616]">
                {mapaVisible ? (
                  <iframe src={cfg.mapaUrl || `https://www.google.com/maps?q=${encodeURIComponent(`${direccion}, Formosa`)}&output=embed`} title="Mapa de ubicación" className="h-full min-h-[20rem] w-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                ) : (
                  <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-3 p-6 text-center">
                    <MapPin className="h-8 w-8 text-[#9be600]" aria-hidden="true" />
                    <button type="button" onClick={() => setMapaVisible(true)} className="h-[2.875rem] rounded-[10px] border border-[#333] px-5 text-sm font-bold text-[#ecefe4] transition-colors hover:border-[#9be600]">
                      Cargar mapa
                    </button>
                    <p className="m-0 max-w-[20rem] text-[0.8125rem] leading-normal text-[#a3a698]">El mapa lo muestra Google Maps, que puede guardar cookies propias.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* PIE */}
      <footer className="border-t border-[#1f1f1f] bg-[#080808]">
        <div className="mx-auto flex max-w-[1720px] flex-col gap-6 px-5 pt-10 pb-7">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex flex-col gap-2">
              <img src="/bravos-logo.png" alt="Bravos Box" className="h-[1.875rem] w-auto self-start" />
              <span className="text-sm text-[#a3a698]">Centro de entrenamiento funcional · Formosa</span>
            </div>
            <Link to="/arrepentimiento" className="flex h-11 items-center rounded-[10px] border border-[#333] px-[1.125rem] text-[0.8125rem] font-bold text-[#ecefe4] no-underline transition-colors hover:border-[#9be600] hover:text-[#ecefe4]">
              Botón de arrepentimiento
            </Link>
          </div>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-1">
            {[['Términos y condiciones', '/terminos'], ['Privacidad', '/privacidad'], ['Cookies', '/cookies'], ['Reembolsos', '/reembolsos']].map(([label, to]) => (
              <Link key={to} to={to} className="flex min-h-11 items-center text-sm font-medium text-[#c9ccbf] no-underline hover:text-[#ecefe4]">{label}</Link>
            ))}
          </nav>
          <div className="flex flex-wrap justify-between gap-2 border-t border-[#1f1f1f] pt-5 text-[0.8125rem] text-[#a3a698]">
            <span>© 2026 Bravos Box. Todos los derechos reservados.</span>
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener noreferrer" className="text-[#c9ccbf] hover:text-[#ecefe4]">
              Defensa de las y los consumidores. Para reclamos ingresá aquí.
            </a>
          </div>
        </div>
      </footer>

      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola Bravos Box, quiero hacer una consulta.')}`} target="_blank" rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp (se abre en otra pestaña)"
          className="fixed right-5 bottom-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,.4)] transition-transform hover:scale-110">
          <svg viewBox="0 0 32 32" className="h-[26px] w-[26px]" fill="currentColor" aria-hidden="true"><path d="M16.04 3C8.86 3 3.04 8.82 3.04 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.94 12.94 0 0 0 16.04 29C23.22 29 29 23.18 29 16S23.22 3 16.04 3Zm0 23.62c-1.98 0-3.92-.53-5.61-1.53l-.4-.24-3.96 1.04 1.06-3.86-.26-.4A10.6 10.6 0 0 1 5.42 16c0-5.86 4.76-10.62 10.62-10.62 5.85 0 10.6 4.76 10.6 10.62 0 5.86-4.75 10.62-10.6 10.62Zm5.82-7.95c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.55-1.57-.94-.84-1.58-1.88-1.76-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.97-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.07 1.3 3.28c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" /></svg>
        </a>
      )}
    </div>
  )
}

export default LandingPage
