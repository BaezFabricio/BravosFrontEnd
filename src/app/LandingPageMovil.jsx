import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { haySesion, cerrarSesionEnServidor } from '@/lib/sesion'
import { LandingPageSkeleton } from '@/components/LandingPageSkeleton'
import { PANELES, panelesPermitidos } from '@/lib/paneles'

/*
 * Portada pública para celular (menos de 768 px), según handoff_landing/PROMPT_MOVIL.md y
 * "Bravos Landing Movil.dc.html". Los datos (clases, horarios, contacto, carrusel) salen de Configuración
 * y de los turnos publicados, igual que la versión de escritorio.
 */

const DIAS = [
  { label: 'LUNES', corto: 'LUN', value: 'LUNES' },
  { label: 'MARTES', corto: 'MAR', value: 'MARTES' },
  { label: 'MIÉRCOLES', corto: 'MIÉ', value: 'MIERCOLES' },
  { label: 'JUEVES', corto: 'JUE', value: 'JUEVES' },
  { label: 'VIERNES', corto: 'VIE', value: 'VIERNES' },
  { label: 'SÁBADO', corto: 'SÁB', value: 'SABADO' },
]

const TEXTO_NOSOTROS = 'Nuestro centro de entrenamiento busca honrar la memoria de los héroes argentinos. Por los que volvieron y los que se quedaron velando por nuestras Islas.'
const TEXTO_MISION = 'Somos una comunidad comprometida con el bienestar y el desarrollo integral de las personas. Trabajamos con atención, profesionalismo y compromiso, acompañando a cada alumno a superar sus propios límites a través del CrossFit.'

// Horarios de atención escritos en Configuración ("Lun-Vie: 6:00 - 22:00", "Domingo: Cerrado")
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
  const d = (valor || '').replace(/\D/g, '')
  if (!d) return ''
  if (d.startsWith('549')) return d
  if (d.startsWith('54')) return '549' + d.slice(2)
  return '549' + d.replace(/^0/, '')
}

// Sesión guardada en el navegador (el servidor igual valida todo)
function leerSesion() {
  if (!haySesion()) return null
  const leer = (clave, defecto) => { try { return JSON.parse(localStorage.getItem(clave) || '') ?? defecto } catch { return defecto } }
  const u = leer('usuario', {})
  return {
    userData: { nombrecompleto: u?.nombrecompleto || u?.nombre || u?.username || 'Usuario Bravos' },
    permisos: Array.isArray(leer('permisos', [])) ? leer('permisos', []) : [],
    avatarUrl: localStorage.getItem('avatarUrl') || '',
  }
}

const IconoWhatsapp = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.78a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.82 9.82 0 0 1 6.99 2.9 9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88M20.52 3.45A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z" /></svg>
)

const IconoInstagram = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
)

export default function LandingPageMovil() {
  const [sesion, setSesion] = useState(leerSesion)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [cfg, setCfg] = useState({})
  const [turnosBox, setTurnosBox] = useState([])
  const [loadingHorarios, setLoadingHorarios] = useState(true)
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => ['LUNES', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'][new Date().getDay()])
  const [expandido, setExpandido] = useState(false)
  const [mapaVisible, setMapaVisible] = useState(false)
  const [indiceHero, setIndiceHero] = useState(0)
  const botonMenuRef = useRef(null)
  const hojaRef = useRef(null)

  const logueado = !!sesion
  const permisos = sesion?.permisos || []
  const esAlumno = logueado && permisos.some((p) => p.startsWith('alumno'))
  const puedeAccederPanel = permisos.length > 0
  const panelesDisponibles = PANELES.filter((p) => panelesPermitidos()[p.key]).map((p) => p.href)
  const rutaMiPanel = panelesDisponibles.length === 1 ? panelesDisponibles[0] : '/seleccionar-panel'

  // Carrusel de la portada: las fotos hero1..hero3 del admin, cambian cada 5 s. Sin fotos, queda la de Malvinas.
  const fotosHero = Object.values(cfg.heroImages || {}).filter(Boolean)
  const imagenesHero = fotosHero.length ? fotosHero : ['/hero-malvinas.png']
  useEffect(() => {
    if (imagenesHero.length <= 1) return
    const intervalo = setInterval(() => setIndiceHero((i) => (i + 1) % imagenesHero.length), 5000)
    return () => clearInterval(intervalo)
  }, [imagenesHero.length])

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

  // Menú: Escape lo cierra, el foco queda adentro mientras está abierto y vuelve al botón al cerrarse
  useEffect(() => {
    if (!menuAbierto) return
    const primero = hojaRef.current?.querySelector('a, button')
    primero?.focus()
    const alTeclear = (e) => {
      if (e.key === 'Escape') { setMenuAbierto(false); return }
      if (e.key !== 'Tab' || !hojaRef.current) return
      const foco = [...hojaRef.current.querySelectorAll('a[href], button:not([disabled])')]
      if (!foco.length) return
      const primeroFoco = foco[0]
      const ultimo = foco[foco.length - 1]
      if (e.shiftKey && document.activeElement === primeroFoco) { e.preventDefault(); ultimo.focus() }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeroFoco.focus() }
    }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [menuAbierto])

  const cerrarMenu = () => {
    setMenuAbierto(false)
    botonMenuRef.current?.focus()
  }

  const handleLogout = () => {
    cerrarSesionEnServidor()
    ;['usuario', 'avatarUrl', 'permisos'].forEach((k) => localStorage.removeItem(k))
    window.location.reload()
  }

  // Clases: CrossFit y Planificación, con lo que se cargó en Configuración
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
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(`${direccion}, Formosa`)}`

  if (!configLoaded) return <LandingPageSkeleton />

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0b0b0b] text-[#ecefe4] selection:bg-[#9be600] selection:text-[#0b0b0b]" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@700;800&display=swap" precedence="default" />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-[#9be600] focus:px-3.5 focus:py-2.5 focus:text-sm focus:font-bold focus:text-[#0b0b0b]">
        Saltar al contenido
      </a>

      {/* ENCABEZADO (56 px, borde lima abajo) */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b-2 border-[#9be600] bg-[#0b0b0b] pr-3 pl-4">
        <Link to="/" aria-label="Bravos Box, inicio" className="flex shrink-0">
          <img src="/bravos-logo.png" alt="Bravos Box" className="h-[26px] w-auto" />
        </Link>
        <span className="flex-1" />
        {logueado ? (
          <Link to={rutaMiPanel} className="flex h-10 items-center gap-2 rounded-full border border-[#3a3a3a] bg-[#141414] py-0 pr-3.5 pl-1 text-xs font-extrabold tracking-[.04em] text-[#ecefe4] no-underline">
            <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border-2 border-[#9be600] bg-[#1f2a0e] text-[11px] font-extrabold text-[#9be600]">
              {sesion.avatarUrl ? <img src={sesion.avatarUrl} alt="" className="h-full w-full object-cover" /> : (sesion.userData.nombrecompleto.trim().split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'UB')}
            </span>
            MI PANEL
          </Link>
        ) : (
          <Link to="/login" className="flex h-10 items-center rounded-full border border-[#3a3a3a] bg-[#141414] px-4 text-xs font-extrabold tracking-[.04em] text-[#ecefe4] no-underline">Ingresar</Link>
        )}
        <button
          ref={botonMenuRef}
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Menú"
          aria-haspopup="dialog"
          aria-expanded={menuAbierto}
          className="grid h-11 w-11 place-items-center rounded-[10px] text-[#ecefe4]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
      </header>

      <main id="main" className="pb-[110px]">
        {/* PORTADA como la versión anterior: 85 % de la pantalla, carrusel de fotos, texto abajo a la izquierda */}
        <section aria-labelledby="t-hero" className="relative flex min-h-[66svh] items-end overflow-hidden bg-[#0b0b0b] pb-8">
          {imagenesHero.map((src, i) => (
            <img key={src} src={src} alt={i === indiceHero ? 'Entrenamiento en Bravos Box' : ''} aria-hidden={i !== indiceHero ? 'true' : undefined} className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${i === indiceHero ? 'opacity-100' : 'opacity-0'}`} />
          ))}
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-black/70 to-black" />
          <div className="relative flex w-full flex-col gap-3 px-4 pb-6">
            <nav aria-label="Ubicación" className="flex items-center gap-1.5 text-xs text-[#ecefe4]/50">
              <span>Argentina</span>
              <span aria-hidden="true">›</span>
              <span className="text-[#ecefe4]/70">Formosa Capital</span>
            </nav>
            <h1 id="t-hero" className="m-0 flex flex-col gap-3">
              <img src="/bravos-logo.png" alt="Bravos Box" className="h-16 w-auto self-start" />
              <span className="!font-[Archivo] text-xl font-black tracking-wide text-[#ecefe4]">CENTRO DE ENTRENAMIENTO</span>
            </h1>
            {!logueado && (
              <Link to="/registro" className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#9be600] text-sm font-black tracking-widest text-[#0b0b0b] no-underline">
                UNIRME
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
              </Link>
            )}
            <div className="flex items-center justify-end">
              <span className="flex items-center gap-1.5" aria-hidden={imagenesHero.length <= 1 ? 'true' : undefined}>
                {imagenesHero.map((_, i) => (
                  <button key={i} type="button" onClick={() => setIndiceHero(i)} aria-label={`Ver foto ${i + 1} de ${imagenesHero.length}`} aria-current={i === indiceHero ? 'true' : undefined} className="grid h-5 place-items-center">
                    <span className={`block h-[7px] rounded-[4px] transition-all ${i === indiceHero ? 'w-5 bg-[#9be600]' : 'w-[7px] rounded-full bg-[#555]'}`} />
                  </button>
                ))}
              </span>
            </div>
          </div>
        </section>

        {/* FRASE (primero) y luego el bloque de Malvinas, dentro del mismo recuadro */}
        <section id="nosotros" aria-label="Nosotros" className="relative mx-4 mt-6 scroll-mt-16 overflow-hidden rounded-[18px] border border-[#262626] bg-[#0e0e0e] px-4 pt-6 pb-[18px]">
          <p className="m-0 text-center text-[27px] leading-[1.15] font-extrabold tracking-normal uppercase" style={{ fontFamily: "'Barlow Semi Condensed', Archivo, sans-serif", textShadow: '0 0 14px rgba(255,255,255,.35), 0 2px 6px rgba(0,0,0,.8)' }}>
            "El único entrenamiento malo <span className="text-[#9be600]" style={{ textShadow: '0 0 14px rgba(155,230,0,.55), 0 2px 6px rgba(0,0,0,.8)' }}>es el que no hiciste"</span>
          </p>
          <div className="mt-14 flex items-center gap-3 border-t border-[#262626] pt-8">
            <img src="/malvinas.png" alt="" aria-hidden="true" className="h-16 w-auto" />
            <span className="text-[15px] leading-[1.3] font-bold">Honor y gloria a los Bravos de Malvinas</span>
          </div>
          {expandido && (
            <div className="mt-3 flex flex-col gap-2.5">
              <p className="m-0 text-sm leading-[1.55] text-[#c9ccbf]">{cfg.descripcionNosotros || TEXTO_NOSOTROS}</p>
              <p className="m-0 text-sm leading-[1.55] text-[#a3a698]">{cfg.mision || TEXTO_MISION}</p>
            </div>
          )}
          <button type="button" onClick={() => setExpandido((v) => !v)} aria-expanded={expandido} className="mt-2 flex h-10 items-center p-0 text-sm font-bold text-[#9be600]">
            {expandido ? 'Ver menos' : 'Ver más'}
          </button>
        </section>

        {/* CLASES: tarjetas en carrusel horizontal */}
        <section id="clases" aria-labelledby="t-clases" className="mt-8 scroll-mt-16">
          <h2 id="t-clases" className="mx-4 mb-3.5 !font-[Archivo] text-[24px] font-extrabold">Nuestras clases</h2>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {clases.map((k, i) => (
              <article key={i} className="w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#262626] bg-[#161616]">
                <img src={k.img} alt={k.alt} className="block h-[170px] w-full object-cover object-[center_30%]" />
                <div className="p-[14px_16px_16px]">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="m-0 !font-[Archivo] text-[18px] font-extrabold">{k.t}</h3>
                    <span className="rounded-md bg-[#1f2a0e] px-2 py-[3px] text-xs font-bold text-[#9be600]">{k.min}</span>
                  </div>
                  <p className="m-0 mt-1.5 text-sm leading-[1.45] text-[#a3a698]">{k.d}</p>
                  <a href="#horarios" className="flex min-h-11 items-center text-sm font-bold text-[#ecefe4] no-underline">Ver horarios →</a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* HORARIOS: pestañas por día */}
        <section id="horarios" aria-labelledby="t-horarios" className="mx-4 mt-8 scroll-mt-16">
          <h2 id="t-horarios" className="mb-3.5 !font-[Archivo] text-[24px] font-extrabold">Horarios</h2>
          <div role="tablist" aria-label="Día de la semana" className="grid grid-cols-6 gap-[5px]">
            {DIAS.map((d) => {
              const on = diaSeleccionado === d.value
              return (
                <button key={d.value} type="button" role="tab" aria-selected={on} onClick={() => setDiaSeleccionado(d.value)}
                  className={`h-[52px] rounded-xl border text-[13px] font-extrabold ${on ? 'border-[#9be600] bg-[#9be600] text-[#0b0b0b]' : 'border-[#262626] bg-[#161616] text-[#ecefe4]'}`}>
                  {d.corto}
                </button>
              )
            })}
          </div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-[#262626] bg-[#161616]">
            {loadingHorarios ? (
              <p className="m-0 p-4 text-sm text-[#a3a698]" role="status">Cargando horarios…</p>
            ) : turnosDelDia.length === 0 ? (
              <p className="m-0 p-4 text-center text-sm text-[#a3a698]">{turnosBox.length === 0 ? 'Los horarios se publican muy pronto.' : 'No hay turnos publicados este día.'}</p>
            ) : turnosDelDia.map((tipo, idxTipo) => {
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
                <div key={tipo.codigo} className={`p-3.5 ${idxTipo ? 'border-t border-[#262626]' : ''}`}>
                  <p className="m-0 text-[11px] font-semibold tracking-[.1em] text-[#a3a698] uppercase">{tipo.nombre}</p>
                  {turnos.map((t) => (
                    <div key={t.clave} className="mt-2">
                      <p className="m-0 text-sm font-bold">Turno {t.turno}{t.etiqueta ? <span className="font-normal text-[#a3a698]"> · {t.etiqueta}</span> : null}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {t.horas.map((h) => {
                          const largo = minutos(h.horaFin) - minutos(h.horaInicio) > 90
                          const texto = largo ? `${h.horaInicio.slice(0, 5)} a ${h.horaFin.slice(0, 5)}` : h.horaInicio.slice(0, 5)
                          return esAlumno ? (
                            <Link key={`${h.horaInicio}-${h.horaFin}`} to="/alumno/reservar" className="flex h-10 items-center rounded-[10px] border border-[#333] px-3.5 text-[15px] font-extrabold text-[#ecefe4] no-underline">{texto}</Link>
                          ) : (
                            <span key={`${h.horaInicio}-${h.horaFin}`} className="flex h-10 items-center rounded-[10px] border border-[#333] px-3.5 text-[15px] font-extrabold text-[#ecefe4]">{texto}</span>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
          <p className="m-0 mt-3 text-sm text-[#a3a698]">
            {esAlumno ? 'Tocá un horario para reservar.' : 'Para reservar un horario tenés que iniciar sesión como alumno.'}
          </p>
        </section>

        {/* CONTACTO */}
        <section id="contacto" aria-labelledby="t-contacto" className="mx-4 mt-8 scroll-mt-16">
          <h2 id="t-contacto" className="mb-3.5 !font-[Archivo] text-[24px] font-extrabold">Encontranos</h2>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              {whatsapp && (
                <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola Bravos Box, quiero hacer una consulta.')}`} target="_blank" rel="noopener noreferrer"
                  className="flex min-h-[110px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#262626] bg-[#161616] p-3.5 text-center text-[#ecefe4] no-underline">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-[#25D366] text-white"><IconoWhatsapp /></span>
                  <span className="text-sm font-extrabold">WhatsApp</span>
                  <span className="text-xs text-[#a3a698]">+{whatsapp.replace(/^549/, '54 ')}</span>
                </a>
              )}
              {cfg.instagram && (
                <a href={`https://instagram.com/${cfg.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex min-h-[110px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#262626] bg-[#161616] p-3.5 text-center text-[#ecefe4] no-underline">
                  <span className="grid h-10 w-10 place-items-center rounded-md text-white" style={{ background: 'linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)' }}><IconoInstagram /></span>
                  <span className="text-sm font-extrabold">Instagram</span>
                  <span className="text-xs text-[#a3a698]">@{cfg.instagram.replace(/^@/, '')}</span>
                </a>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#161616]">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 text-[#ecefe4] no-underline">
                <span className="flex-1">
                  <span className="block text-[11px] font-semibold tracking-[.1em] text-[#a3a698]">DIRECCIÓN</span>
                  <span className="block text-base font-extrabold">{calle}{resto.length ? `,${resto.join(',')}` : ''}</span>
                  <span className="block text-[13px] text-[#a3a698]">Formosa, Argentina</span>
                </span>
                <span className="text-[13px] font-bold text-[#9be600]">Cómo llegar ↗<span className="sr-only"> (se abre en otra pestaña)</span></span>
              </a>
              <div className="flex gap-3 border-t border-[#222] p-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-[.1em] text-[#a3a698]">HORARIOS DEL BOX</span>
                    {abiertoAhora !== null && (
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${abiertoAhora ? 'border-[#3d5a10] bg-[#16220a] text-[#9be600]' : 'border-[#444] bg-[#1a1a1a] text-[#a3a698]'}`}>
                        {abiertoAhora ? '● Abierto' : '● Cerrado'}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-[1fr_auto] gap-y-1.5 text-sm">
                    {filasHorario.map((f, i) => (
                      <span key={i} className="contents">
                        <span>{f.etiqueta || 'Horario'}</span>
                        <strong className={f.cerrado ? 'font-normal text-[#a3a698]' : ''}>{f.valor}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setMapaVisible((v) => !v)} aria-expanded={mapaVisible}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#333] bg-transparent text-sm font-bold text-[#ecefe4]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9be600" strokeWidth="1.9" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /></svg>
              {mapaVisible ? 'Ocultar mapa' : 'Ver mapa'}
            </button>
            {mapaVisible && (
              <iframe src={cfg.mapaUrl || `https://www.google.com/maps?q=${encodeURIComponent(`${direccion}, Formosa`)}&output=embed`} title="Mapa de ubicación" className="h-64 w-full rounded-2xl border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            )}
          </div>
        </section>

        {/* PIE */}
        <footer className="mx-4 mt-8 border-t border-[#1f1f1f] pt-7">
          <div className="mb-4 flex flex-col items-center gap-2.5 text-center">
            <img src="/bravos-logo.png" alt="Bravos Box" className="h-14 w-auto" />
            <span className="text-[13px] text-[#a3a698]">Centro de entrenamiento · Formosa</span>
          </div>
          <nav aria-label="Legal" className="mt-5 overflow-hidden rounded-[14px] border border-[#232323] bg-[#141414]">
            {[['Términos y condiciones', '/terminos'], ['Privacidad', '/privacidad'], ['Cookies', '/cookies'], ['Reembolsos', '/reembolsos']].map(([label, to]) => (
              <Link key={to} to={to} className="flex min-h-[50px] items-center justify-between border-b border-[#222] pr-3.5 pl-4 text-[15px] font-medium text-[#ecefe4] no-underline">{label}<span aria-hidden="true" className="text-[#6b6e62]">›</span></Link>
            ))}
            <Link to="/arrepentimiento" className="flex min-h-[50px] items-center justify-between pr-3.5 pl-4 text-[15px] font-bold text-[#ff8a80] no-underline">Botón de arrepentimiento<span aria-hidden="true" className="text-[#6b6e62]">›</span></Link>
          </nav>
          <p className="mt-[18px] text-center text-xs leading-[1.6] text-[#a3a698]">
            © 2026 Bravos Box<br />
            <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener noreferrer" className="text-[#c9ccbf]">Defensa de las y los consumidores</a>
          </p>
        </footer>
      </main>

      {/* WhatsApp flotante (52 px, abajo a la derecha) */}
      {whatsapp && (
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Hola Bravos Box, quiero hacer una consulta.')}`} target="_blank" rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp (se abre en otra pestaña)"
          className="fixed right-4 bottom-[30px] z-30 grid h-[52px] w-[52px] place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,.4)]">
          <IconoWhatsapp />
        </a>
      )}

      {/* MENÚ: hoja que sube desde abajo, con fondo oscuro detrás */}
      {menuAbierto && (
        <>
          <div onClick={cerrarMenu} className="fixed inset-0 z-[35] bg-black/60" aria-hidden="true" />
          <nav ref={hojaRef} role="dialog" aria-modal="true" aria-label="Menú"
            className="fixed inset-x-0 bottom-0 z-[36] flex flex-col rounded-t-[24px] border-t border-[#262626] bg-[#161616] px-4 pt-3 pb-9">
            <span aria-hidden="true" className="mb-2 h-[5px] w-10 self-center rounded-[3px] bg-[#333]" />
            <Link to="/ranking" onClick={cerrarMenu} className="flex min-h-14 items-center border-b border-[#222] text-base font-bold text-[#ecefe4] no-underline">Ranking</Link>
            {[['Clases', '#clases'], ['Horarios', '#horarios'], ['Nosotros', '#nosotros'], ['Contacto', '#contacto']].map(([label, href]) => (
              <a key={href} href={href} onClick={cerrarMenu} className="flex min-h-14 items-center border-b border-[#222] text-base font-bold text-[#ecefe4] no-underline">{label}</a>
            ))}
            {esAlumno && (
              <Link to="/alumno" onClick={cerrarMenu} className="mt-3 flex h-12 items-center justify-center rounded-[10px] bg-[#9be600] text-sm font-extrabold tracking-[.04em] text-[#0b0b0b] no-underline">IR A MI PANEL</Link>
            )}
            {logueado ? (
              <div className="mt-3.5 flex items-center gap-3 border-t border-[#262626] pt-3.5">
                {puedeAccederPanel && (
                  <Link to={rutaMiPanel} onClick={cerrarMenu} className="flex h-11 flex-1 items-center justify-center rounded-[10px] border border-[#333] text-sm font-bold text-[#ecefe4] no-underline">Mi panel</Link>
                )}
                <button type="button" onClick={handleLogout} className="flex h-11 items-center justify-center rounded-[10px] border border-[#6b2a24] px-3 text-[13px] font-bold text-[#ff8a80]">Cerrar sesión</button>
              </div>
            ) : (
              <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-[#262626] pt-3.5">
                <Link to="/login" onClick={cerrarMenu} className="flex h-12 items-center justify-center rounded-[10px] border border-[#333] text-sm font-bold text-[#ecefe4] no-underline">INGRESAR</Link>
                <Link to="/registro" onClick={cerrarMenu} className="flex h-12 items-center justify-center rounded-[10px] bg-[#9be600] text-sm font-extrabold text-[#0b0b0b] no-underline">UNIRSE</Link>
              </div>
            )}
          </nav>
        </>
      )}
    </div>
  )
}
