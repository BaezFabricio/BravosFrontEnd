import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Save, Camera, ArrowLeft, Image as ImageIcon, Loader2, ExternalLink, Check } from "lucide-react"
import { AdminFormSkeleton } from '@/components/AdminPageSkeleton'
import { toast } from '@/lib/notificar'
import { LogoBoxBravos } from '@/components/logo-box-bravos'
import DatosBancarios from './DatosBancarios'
import MenuAjustes from './MenuAjustes'
import { TituloPagina } from "@/components/TituloPagina"
import RecortarFoto from '@/components/RecortarFoto'

// Cada sección se abre desde el menú de Configuración con ?seccion=
const SECCIONES = {
  hero:     { grupo: 'Web pública', titulo: 'Portada y logo', detalle: 'El título, el logo y las fotos del carrusel de la portada.' },
  nosotros: { grupo: 'Web pública', titulo: 'Sobre nosotros', detalle: 'La foto, la historia y la misión que ven los visitantes.' },
  clases:   { grupo: 'Web pública', titulo: 'Tarjetas de clases', detalle: 'Las 2 tarjetas que presentan las clases en la portada.' },
  contacto: { grupo: 'Web pública', titulo: 'Contacto, horarios y mapa', detalle: 'Cómo encontrarte y los datos legales del gimnasio.' },
  banco:    { grupo: 'Cobros', titulo: 'Datos bancarios', detalle: 'La cuenta a la que transfieren los alumnos.' },
}

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold uppercase tracking-[.1em] text-foreground/60">{label}</label>
    {children}
    {hint && <p className="text-xs text-foreground/50">{hint}</p>}
  </div>
)

const inputCls = "w-full min-h-[3rem] rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-base text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-400/25 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
const textareaCls = inputCls + " resize-y leading-relaxed"

const SectionCard = ({ title, subtitle, children }) => (
  <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div>
      <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
        <span className="h-3.5 w-1 rounded-full bg-lime-400" aria-hidden="true" /> {title}
      </h2>
      {subtitle && <p className="mt-1 text-sm text-foreground/55">{subtitle}</p>}
    </div>
    {children}
  </section>
)

// Foto con botón "Cambiar" siempre visible (en el celular no existe el "pasar el mouse")
const ImageUpload = ({ preview, onChange, label, aspect = 'aspect-video', disabled }) => (
  <div className={`relative ${aspect} overflow-hidden rounded-xl border border-border bg-muted`}>
    {preview
      ? <img src={preview} className="h-full w-full object-cover" alt="" />
      : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-foreground/25" /></div>
    }
    {!disabled && (
      <label className="absolute bottom-2.5 right-2.5 flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-background/85 px-3.5 text-[13px] font-bold text-foreground backdrop-blur transition-colors hover:bg-background focus-within:ring-2 focus-within:ring-lime-400">
        <Camera className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onChange} className="sr-only" />
      </label>
    )}
  </div>
)

// Selector 1 · 2 · 3 para ver de a una foto o tarjeta en el celular
const SelectorTres = ({ valor, onChange, etiquetas, nombre }) => (
  <div role="tablist" aria-label={nombre} className={`grid gap-1 rounded-xl border border-border bg-background/60 p-1 md:hidden ${etiquetas.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
    {etiquetas.map((e, i) => (
      <button key={i} type="button" role="tab" aria-selected={valor === i} onClick={() => onChange(i)}
        className={`min-h-[2.5rem] truncate rounded-lg px-2 text-xs font-black transition-colors ${valor === i ? 'bg-lime-400 text-black' : 'text-foreground/60'}`}>
        {e}
      </button>
    ))}
  </div>
)

function ConfiguracionLandingPage() {
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  // Sin ?seccion= se muestra el menú general; con ?seccion= la pantalla de esa sección
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  // Volver al menú: si se llegó desde el menú, 'atrás'; si se entró directo, se reemplaza esta página
  // por el menú. Así no se apilan páginas y el 'Volver' del menú no rebota a la sección.
  const volverAlMenu = () => {
    if (location.state?.desdeMenu) navigate(-1)
    else navigate('/admin/configuracion', { replace: true })
  }
  const seccionPedida = searchParams.get('seccion')
  const activeTab = Object.prototype.hasOwnProperty.call(SECCIONES, seccionPedida) ? seccionPedida : null
  const [fotoHero, setFotoHero] = useState(0)
  const [tarjeta, setTarjeta] = useState(0)
  // Permisos guardados al iniciar sesión: solo deciden si se puede editar en pantalla (el servidor controla al guardar)
  const [permisos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('permisos') || '[]') } catch { return [] }
  })

  // Hero
  const [tituloHero, setTituloHero] = useState('')
  const [tituloSize, setTituloSize] = useState('')
  const [tituloFont, setTituloFont] = useState('')
  const [tituloAlign, setTituloAlign] = useState('left')
  const [logo, setLogo] = useState(null)
  const [logoPreview, setLogoPreview] = useState('/logo-box-bravos-final.png')
  const [imagenHero1, setImagenHero1] = useState(null)
  const [imagenHero2, setImagenHero2] = useState(null)
  const [imagenHero3, setImagenHero3] = useState(null)
  const [heroPreview1, setHeroPreview1] = useState('/landing-hero-1.jpg')
  const [heroPreview2, setHeroPreview2] = useState('/landing-hero-2.jpg')
  const [heroPreview3, setHeroPreview3] = useState('/landing-hero-3.jpg')

  // Nosotros
  const [tituloNosotros, setTituloNosotros] = useState('')
  const [subtituloNosotros, setSubtituloNosotros] = useState('')
  const [descripcionNosotros, setDescripcionNosotros] = useState('')
  const [mision, setMision] = useState('')
  const [imagenNosotros, setImagenNosotros] = useState(null)
  const [imagenNosotrosPreview, setImagenNosotrosPreview] = useState('/gym-interior.jpg')

  // Clases: dos tarjetas. La 1 es CrossFit (claseCard1 / imagenClase1) y la 2 es Planificación (claseCard3 / imagenClase3).
  const [cards, setCards] = useState([
    { titulo: 'CrossFit', descripcion: '', icono: '🔥' },
    { titulo: 'Planificación', descripcion: '', icono: '📋' },
  ])
  const [imagenesClase, setImagenesClase] = useState([null, null])
  const [imagenesClasePreview, setImagenesClasePreview] = useState(['/hero-crossfit.jpg', '/gym-interior.jpg'])
  // Foto elegida que se está ajustando antes de guardarla (null si no hay ninguna)
  const [recorte, setRecorte] = useState(null)

  const updateCard = (i, field, val) =>
    setCards(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c))

  // Contacto
  const [direccion, setDireccion] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  // Titular del servicio, para Términos y Privacidad
  const [legalTitular, setLegalTitular] = useState('')
  const [legalCuit, setLegalCuit] = useState('')
  const [legalDomicilio, setLegalDomicilio] = useState('')
  const [horarioSemana, setHorarioSemana] = useState('Lun-Vie: 6:00 - 22:00')
  const [horarioSabado, setHorarioSabado] = useState('Sábado: 17:00 - 19:00')
  const [horarioDomingo, setHorarioDomingo] = useState('Domingo: Cerrado')
  const [mapaUrl, setMapaUrl] = useState('')
  const [bancoSinCbu, setBancoSinCbu] = useState(false)
  const [base, setBase] = useState(null)
  const fotoActual = JSON.stringify([tituloHero, tituloSize, tituloFont, tituloAlign, tituloNosotros, subtituloNosotros, descripcionNosotros, mision, direccion, telefono, email, instagram, whatsapp, mapaUrl, cards])
  useEffect(() => { if (!loading && base === null) setBase(fotoActual) }, [loading, base, fotoActual])
  const hayCambios = base !== null && (fotoActual !== base || [logo, imagenHero1, imagenHero2, imagenHero3, imagenNosotros, recorte].some(Boolean) || imagenesClase.some(Boolean))
  useEffect(() => {
    fetch('/landing/banco').then((r) => r.json()).then((j) => { const d = j?.data || j || {}; setBancoSinCbu(!String(d.cvuTransferencia || '').trim()) }).catch(() => {})
  }, [])

  const puedeModificar = permisos.includes('configuracion:modificacion')
  const useVectorLogo = !logoPreview || logoPreview.includes('logo-box-bravos-final.png')

  const cargarConfiguracion = async () => {
    try {
      const res = await fetch(`/landing/config?t=${Date.now()}`)
      if (!res.ok) throw new Error()
      const d = await res.json()

      setTituloHero(d.tituloHero || '')
      setTituloSize(d.tituloHeroSize || '')
      setTituloFont(d.tituloHeroFont || '')
      setTituloAlign(d.tituloHeroAlign || 'left')
      if (d.logoUrl) setLogoPreview(d.logoUrl)
      if (d.heroImages) {
        const imgs = Array.isArray(d.heroImages) ? d.heroImages : Object.values(d.heroImages)
        if (imgs[0]) setHeroPreview1(imgs[0])
        if (imgs[1]) setHeroPreview2(imgs[1])
        if (imgs[2]) setHeroPreview3(imgs[2])
      }

      setTituloNosotros(d.tituloNosotros || '')
      setSubtituloNosotros(d.subtituloNosotros || '')
      setDescripcionNosotros(d.descripcionNosotros || '')
      setMision(d.mision || '')
      if (d.imagenNosotros) setImagenNosotrosPreview(d.imagenNosotros)
      if (d.imagenClase1) setImagenesClasePreview(prev => [d.imagenClase1, prev[1]])
      if (d.imagenClase3) setImagenesClasePreview(prev => [prev[0], d.imagenClase3])

      setCards([
        { titulo: d.claseCard1Titulo || 'CrossFit', descripcion: d.claseCard1Descripcion || '', icono: d.claseCard1Icono || '🔥' },
        { titulo: d.claseCard3Titulo || 'Planificación', descripcion: d.claseCard3Descripcion || '', icono: d.claseCard3Icono || '📋' },
      ])

      setDireccion(d.direccion || '')
      setTelefono(d.telefono || '')
      setEmail(d.email || '')
      setInstagram(d.instagram || '')
      setWhatsapp(d.whatsapp || '')
      setLegalTitular(d.legalTitular || '')
      setLegalCuit(d.legalCuit || '')
      setLegalDomicilio(d.legalDomicilio || '')
      setHorarioSemana(d.horario_semana || 'Lun-Vie: 6:00 - 22:00')
      setHorarioSabado(d.horario_sabado || 'Sábado: 17:00 - 19:00')
      setHorarioDomingo(d.horario_domingo || 'Domingo: Cerrado')
      setMapaUrl(d.mapaUrl || '')
    } catch {
      toast.error('No se pudo cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  // Al entrar o salir de una sección, la pantalla arranca desde arriba
  useEffect(() => { window.scrollTo(0, 0) }, [activeTab])

  const handleFileChange = (e, tipo) => {
    if (!puedeModificar) return
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    // Las tarjetas se ajustan antes de guardarse (ver RecortarFoto)
    if (tipo === 'clase1') { setRecorte({ indice: 0, archivo: file }); return }
    if (tipo === 'clase3') { setRecorte({ indice: 1, archivo: file }); return }
    const url = URL.createObjectURL(file)
    if (tipo === 'logo') { setLogo(file); setLogoPreview(url) }
    else if (tipo === 'hero1') { setImagenHero1(file); setHeroPreview1(url) }
    else if (tipo === 'hero2') { setImagenHero2(file); setHeroPreview2(url) }
    else if (tipo === 'hero3') { setImagenHero3(file); setHeroPreview3(url) }
    else if (tipo === 'nosotros') { setImagenNosotros(file); setImagenNosotrosPreview(url) }
  }

  // Foto de una tarjeta: primero se ajusta a cuadrado; al aceptar recién se guarda como elegida
  const aplicarRecorte = (blob) => {
    const indice = recorte.indice
    const archivo = new File([blob], `tarjeta-${indice + 1}.jpg`, { type: 'image/jpeg' })
    const url = URL.createObjectURL(archivo)
    setImagenesClase(prev => { const n = [...prev]; n[indice] = archivo; return n })
    setImagenesClasePreview(prev => { const n = [...prev]; n[indice] = url; return n })
    setRecorte(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!puedeModificar) return

    try {
      setGuardando(true)
      const fd = new FormData()

      // Hero
      fd.append('tituloHero', tituloHero)
      if (tituloSize) fd.append('tituloHeroSize', tituloSize)
      if (tituloFont) fd.append('tituloHeroFont', tituloFont)
      fd.append('tituloHeroAlign', tituloAlign)
      if (logo) fd.append('logo', logo)
      if (imagenHero1) fd.append('imagenHero1', imagenHero1)
      if (imagenHero2) fd.append('imagenHero2', imagenHero2)
      if (imagenHero3) fd.append('imagenHero3', imagenHero3)
      if (imagenNosotros) fd.append('imagenNosotros', imagenNosotros)
      if (imagenesClase[0]) fd.append('imagenClase1', imagenesClase[0])
      if (imagenesClase[1]) fd.append('imagenClase3', imagenesClase[1])

      // Nosotros
      fd.append('tituloNosotros', tituloNosotros)
      fd.append('subtituloNosotros', subtituloNosotros)
      fd.append('descripcionNosotros', descripcionNosotros)
      fd.append('mision', mision)

      // Clases
      fd.append('claseCard1Titulo', cards[0].titulo)
      fd.append('claseCard1Descripcion', cards[0].descripcion)
      fd.append('claseCard1Icono', cards[0].icono)
      fd.append('claseCard3Titulo', cards[1].titulo)
      fd.append('claseCard3Descripcion', cards[1].descripcion)
      fd.append('claseCard3Icono', cards[1].icono)

      // Contacto
      fd.append('direccion', direccion)
      fd.append('telefono', telefono)
      fd.append('email', email)
      fd.append('instagram', instagram)
      fd.append('whatsapp', whatsapp)
      fd.append('legalTitular', legalTitular)
      fd.append('legalCuit', legalCuit)
      fd.append('legalDomicilio', legalDomicilio)
      fd.append('horario_semana', horarioSemana)
      fd.append('horario_sabado', horarioSabado)
      fd.append('horario_domingo', horarioDomingo)
      fd.append('mapaUrl', mapaUrl)

      // El servidor exige sesión y permiso de configuración para guardar (no se fija Content-Type: lo arma el navegador para FormData)
      const res = await fetch('/landing/config', {
        method: 'PUT',
        headers: {  },
        body: fd,
      })
      if (!res.ok) throw new Error()

      toast.success('¡Configuración guardada correctamente!')
    } catch {
      toast.error('Error al guardar la configuración')
    } finally {
      setGuardando(false)
    }
  }

  // Escritorio: la columna de la izquierda tiene las secciones y a la derecha siempre hay una abierta (Portada por defecto).
  // Celular: el menú general de ajustes, como antes.
  const esEscritorio = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  const tab = activeTab || (esEscritorio ? 'hero' : null)
  if (!tab) return <MenuAjustes />

  const seccion = SECCIONES[tab]
  const esLanding = tab !== 'banco'

  if (esLanding && loading) {
    return <AdminFormSkeleton />
  }

  const botonGuardar = (clase, texto = 'Guardar cambios') => (
    <button type="submit" form="form-landing" disabled={guardando}
      className={`flex items-center justify-center gap-2 rounded-xl bg-lime-400 font-black uppercase tracking-widest text-black transition-colors hover:bg-lime-300 disabled:opacity-50 ${clase}`}>
      {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {guardando ? 'Guardando…' : texto}
    </button>
  )

  const detalleNav = (it) => {
    if (it.id === 'contacto') {
      const faltan = [!email && 'email', !legalCuit && 'CUIT', !mapaUrl && 'mapa'].filter(Boolean)
      return faltan.length ? { texto: `Falta: ${faltan.join(', ')}`, falta: true } : { texto: it.detalle }
    }
    if (it.id === 'clases') return { texto: `Las ${cards.length} clases de la portada` }
    if (it.id === 'banco' && bancoSinCbu) return { texto: 'Falta: CBU o CVU', falta: true }
    return { texto: it.detalle }
  }
  const SECCIONES_NAV = [
    { grupo: 'Web pública', items: [
      { id: 'hero', texto: 'Portada y logo', detalle: 'Título, logo y fotos del carrusel' },
      { id: 'nosotros', texto: 'Sobre nosotros', detalle: 'Foto, historia y misión' },
      { id: 'clases', texto: 'Tarjetas de clases', detalle: 'Las 3 disciplinas de la portada' },
      { id: 'contacto', texto: 'Contacto, horarios y mapa', detalle: 'Teléfono, redes, horarios y datos legales' },
    ] },
    { grupo: 'Cobros', items: [
      { id: 'banco', texto: 'Datos bancarios', detalle: 'Banco, CBU/CVU y alias para transferencias' },
    ] },
  ]

  return (
    <div className="lg:grid lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:items-start lg:gap-6">
      <nav aria-label="Secciones de configuración" className="hidden lg:block" style={{ padding: 0 }}>
        {SECCIONES_NAV.map((g) => (
          <div key={g.grupo} style={{ marginTop: 8 }}>
            <p style={{ margin: '8px 10px 6px', font: '700 11px Archivo', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>{g.grupo}</p>
            {g.items.map((it) => {
              const activo = tab === it.id
              return (
                <Link key={it.id} to={`?seccion=${it.id === 'hero' ? 'hero' : it.id}`} aria-current={activo ? 'page' : undefined}
                  style={{ display: 'block', padding: '12px 14px', borderRadius: 12, marginBottom: 4, textDecoration: 'none', border: `1px solid ${activo ? 'var(--primary)' : 'transparent'}`, background: activo ? 'var(--sh-active-bg)' : 'transparent', color: 'var(--foreground)' }}>
                  <span style={{ display: 'block', font: '800 15px Archivo' }}>{it.texto}</span>
                  <span style={{ display: 'block', font: detalleNav(it).falta ? '600 12px Archivo' : '500 12px Archivo', color: detalleNav(it).falta ? 'var(--sh-warn)' : 'var(--muted-foreground)' }}>{detalleNav(it).texto}</span>
                </Link>
              )
            })}
          </div>
        ))}
        <a href="/" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '0px 14px', font: '800 14px Archivo', color: 'var(--primary)', textDecoration: 'none' }}>
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver la web pública
        </a>
      </nav>
      <div className={`mx-auto max-w-5xl space-y-5 lg:mx-0 lg:max-w-none ${esLanding && puedeModificar ? 'pb-24 lg:pb-0' : ''}`}>
      {/* Encabezado de la sección */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          {esLanding && puedeModificar && botonGuardar('min-h-[2.5rem] px-4 text-xs lg:hidden', 'Guardar')}
          <button type="button" onClick={volverAlMenu}
            className="ml-auto lg:hidden inline-flex min-h-[2.5rem] items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Configuración del Box
          </button>
        </div>
        <div>
          <p className="lg:hidden text-[0.6875rem] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">{seccion.grupo}</p>
          <TituloPagina descripcion={"Lo que ven los visitantes en la web y los alumnos al pagar"}>Configuración del box</TituloPagina>
          <div className="mb-4"><h2 className="text-[22px] font-extrabold text-foreground">{seccion.titulo}</h2><p className="mt-1 text-sm text-muted-foreground lg:hidden">{seccion.detalle}</p><p className="hidden mt-1 text-sm text-muted-foreground lg:block">{detalleNav(SECCIONES_NAV.flatMap((g) => g.items).find((it) => it.id === tab) || {}).texto || seccion.detalle}</p></div>
        </div>
        {!puedeModificar && (
          <p className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground/60">Tu perfil puede ver esta sección pero no cambiarla.</p>
        )}
      </div>

      {/* Los datos bancarios se guardan aparte (su propia ruta en el servidor) */}
      {tab === 'banco' && <DatosBancarios puedeModificar={puedeModificar} />}

      {esLanding && (
      <form id="form-landing" onSubmit={handleSubmit} className="space-y-5 lg:flex lg:flex-col lg:min-h-[calc(var(--bv-vh,100dvh)-13.5rem)]">

        {/* ── HERO ── */}
        {tab === 'hero' && (
          <>
            {/* ESCRITORIO: Título principal como la referencia (botones de elección y vista previa). Mismos campos y datos. */}
            <div className="hidden lg:block" style={{ borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', padding: '22px 24px' }}>
              <h2 className="bv-admin-titulo" style={{ margin: 0, font: '800 17px Archivo' }}>Título principal</h2>
              <p style={{ margin: '4px 0 18px', font: '500 13px Archivo', color: 'var(--muted-foreground)' }}>Aparece sobre las fotos del carrusel.</p>
              <label htmlFor="cfg-titulo-hero" style={{ display: 'block', marginBottom: 8, font: '700 11px Archivo', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Texto del título *</label>
              <input id="cfg-titulo-hero" disabled={!puedeModificar} type="text" value={tituloHero} onChange={(e) => setTituloHero(e.target.value)} placeholder="CENTRO DE ENTRENAMIENTO"
                style={{ width: '100%', boxSizing: 'border-box', height: 46, padding: '0px 14px', borderRadius: 10, border: '1px solid var(--input-line)', background: 'var(--input)', color: 'var(--foreground)', font: '500 15px Archivo' }} />
              {(() => {
                const tamanos = [{ id: 'chico', px: '32', texto: 'Chico' }, { id: 'mediano', px: '48', texto: 'Mediano' }, { id: 'grande', px: '64', texto: 'Grande' }]
                const pxActual = tituloSize || '48'
                const alineaciones = [{ id: 'left', texto: 'Izquierda' }, { id: 'center', texto: 'Centro' }]
                const tipografias = [{ id: 'sans-serif', texto: 'Sans serif' }, { id: 'stencil', texto: 'Stencil' }]
                const tipoActual = tituloFont || 'sans-serif'
                const grupo = (titulo, opciones, valor, onElegir, ancho) => (
                  <div style={{ flex: ancho }}>
                    <span style={{ display: 'block', marginBottom: 8, font: '700 11px Archivo', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>{titulo}</span>
                    <div role="radiogroup" aria-label={titulo} style={{ display: 'flex', gap: 2, padding: 4, borderRadius: 10, border: '1px solid var(--sh-control-line)' }}>
                      {opciones.map((o) => (
                        <button key={o.id} type="button" role="radio" aria-checked={valor === o.id} disabled={!puedeModificar} onClick={() => onElegir(o)}
                          style={{ flex: '1 1 0%', height: 40, borderRadius: 8, border: 'none', cursor: puedeModificar ? 'pointer' : 'not-allowed', background: valor === o.id ? 'var(--primary)' : 'transparent', color: valor === o.id ? 'var(--primary-foreground)' : 'var(--foreground)', font: '700 14px Archivo' }}>
                          {o.texto}
                        </button>
                      ))}
                    </div>
                  </div>
                )
                const fuente = tipoActual === 'stencil' ? "'Big Shoulders Stencil Display', Archivo, sans-serif" : 'Archivo, sans-serif'
                const alinear = tituloAlign === 'center' ? 'center' : 'flex-start'
                return (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 18 }}>
                      {grupo('Tamaño', tamanos.map((t) => ({ ...t, id: t.px, texto: t.texto })), pxActual, (o) => setTituloSize(o.px), 1)}
                      {grupo('Alineación', alineaciones, tituloAlign === 'center' ? 'center' : 'left', (o) => setTituloAlign(o.id), 1)}
                      {grupo('Tipografía', tipografias, tipoActual, (o) => setTituloFont(o.id), 1)}
                    </div>
                    <span style={{ display: 'block', margin: '18px 0 8px', font: '700 11px Archivo', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Vista previa</span>
                    <div style={{ position: 'relative', height: 200, borderRadius: 12, overflow: 'hidden', background: `#111 url(${heroPreview1}) center / cover no-repeat` }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,.15))' }} />
                      <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', justifyContent: alinear, padding: '0px 40px', textAlign: tituloAlign === 'center' ? 'center' : 'left' }}>
                        <span style={{ font: `900 ${Number(pxActual) || 48}px / 1.05 ${fuente}`, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#fff' }}>{tituloHero || 'CENTRO DE ENTRENAMIENTO'}</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>

            {/* ESCRITORIO: Logo y carrusel de fotos como la referencia (mismos campos y datos) */}
            <div className="hidden lg:block space-y-5">
              {(() => {
                const tarjeta = { borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', padding: '22px 24px' }
                const titulo = { margin: 0, font: '800 17px Archivo' }
                const sub = { margin: '4px 0 16px', font: '500 13px Archivo', color: 'var(--muted-foreground)' }
                const etiqueta = { display: 'block', marginBottom: 8, font: '700 11px Archivo', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }
                return (
                  <>
                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Logo de navegación</h2>
                      <p style={sub}>Aparece en la barra superior de la web. PNG con fondo transparente, mínimo 400 px de ancho.</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        {/* Fondo oscuro a propósito: así se ve el logo en la barra de la web */}
                        <div style={{ width: 260, height: 110, boxSizing: 'border-box', padding: 12, borderRadius: 12, border: '1px solid var(--border)', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {useVectorLogo
                            ? <LogoBoxBravos className="h-full w-full" width={200} height={60} />
                            : <img src={logoPreview} alt="Logo actual" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          }
                        </div>
                        {puedeModificar && (
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0px 16px', borderRadius: 10, border: '1px solid var(--sh-control-line)', color: 'var(--foreground)', font: '700 14px Archivo', cursor: 'pointer' }}>
                            <Camera className="h-4 w-4" aria-hidden="true" />
                            Cambiar logo
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => handleFileChange(e, 'logo')} className="sr-only" />
                          </label>
                        )}
                      </div>
                    </section>

                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Carrusel de fotos</h2>
                      <p style={sub}>3 fotos que rotan de fondo en la portada, en este orden. Recomendado: 1920 × 1080.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
                        {[
                          { preview: heroPreview1, tipo: 'hero1' },
                          { preview: heroPreview2, tipo: 'hero2' },
                          { preview: heroPreview3, tipo: 'hero3' },
                        ].map(({ preview, tipo }, i) => (
                          <div key={tipo}>
                            <span style={etiqueta}>Foto {i + 1}</span>
                            <ImageUpload preview={preview} onChange={e => handleFileChange(e, tipo)} label="Cambiar" aspect="aspect-[16/10]" disabled={!puedeModificar} />
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )
              })()}
            </div>

            {/* Celular y tableta: campos como antes */}
            <div className="lg:hidden">
            <SectionCard title="Título Principal" subtitle="Texto de impacto que aparece sobre las imágenes del carrusel.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Texto del título">
                  <input disabled={!puedeModificar} type="text" value={tituloHero} onChange={e => setTituloHero(e.target.value)} placeholder="CENTRO DE ENTRENAMIENTO" className={inputCls} />
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Tamaño (px)">
                    <input disabled={!puedeModificar} type="number" min={10} max={200} value={tituloSize} onChange={e => setTituloSize(e.target.value)} className={inputCls} placeholder="48" />
                  </Field>
                  <Field label="Alineación">
                    <select disabled={!puedeModificar} value={tituloAlign} onChange={e => setTituloAlign(e.target.value)} className={inputCls}>
                      <option value="left">Izquierda</option>
                      <option value="center">Centro</option>
                      <option value="right">Derecha</option>
                    </select>
                  </Field>
                  <Field label="Tipografía">
                    <input disabled={!puedeModificar} type="text" value={tituloFont} onChange={e => setTituloFont(e.target.value)} placeholder="sans-serif" className={inputCls} />
                  </Field>
                </div>
              </div>
            </SectionCard>
            </div>

            <div className="lg:hidden">
            <SectionCard title="Logo de Navegación" subtitle="Aparece en la barra superior de la landing page.">
              <div className="grid grid-cols-[1fr_auto] items-center gap-3 sm:flex sm:gap-6">
                {/* Fondo oscuro a propósito: así se ve el logo en la barra de la web */}
                <div className="flex h-20 min-w-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-zinc-950 p-3 sm:h-24 sm:w-56">
                  {useVectorLogo
                    ? <LogoBoxBravos className="h-full w-full" width={200} height={60} />
                    : <img src={logoPreview} alt="Logo actual" className="h-full w-full object-contain" />
                  }
                </div>
                {puedeModificar && (
                  <label className="flex min-h-[3rem] cursor-pointer items-center gap-2 rounded-xl border border-dashed border-lime-500/50 bg-lime-400/10 px-4 text-sm font-bold text-lime-700 transition-colors hover:bg-lime-400/15 focus-within:ring-2 focus-within:ring-lime-500 dark:text-lime-400">
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Cambiar logo
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => handleFileChange(e, 'logo')} className="sr-only" />
                  </label>
                )}
              </div>
            </SectionCard>
            </div>

            <div className="lg:hidden">
            <SectionCard title="Carrusel de Imágenes" subtitle="3 fotos que rotan como fondo de la sección principal. Resolución recomendada: 1920×1080.">
              <div className="lg:hidden"><SelectorTres valor={fotoHero} onChange={setFotoHero} etiquetas={['Foto 1', 'Foto 2', 'Foto 3']} nombre="Fotos del carrusel" /></div>
              {/* Celular: de a una foto. Computadora: las tres juntas */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { preview: heroPreview1, tipo: 'hero1' },
                  { preview: heroPreview2, tipo: 'hero2' },
                  { preview: heroPreview3, tipo: 'hero3' },
                ].map(({ preview, tipo }, i) => (
                  <div key={tipo} className={i === fotoHero ? '' : 'hidden md:block'}>
                    <p className="mb-1.5 hidden text-[0.6875rem] font-black uppercase tracking-widest text-foreground/60 md:block">Foto {i + 1}</p>
                    <ImageUpload
                      preview={preview}
                      onChange={e => handleFileChange(e, tipo)}
                      label="Cambiar"
                      aspect="aspect-[16/10]"
                      disabled={!puedeModificar}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
            </div>
          </>
        )}

        {/* ── NOSOTROS ── */}
        {tab === 'nosotros' && (
          <>
            {/* ESCRITORIO: Sobre nosotros como la referencia (tarjetas con su título, campos con sus textos). Mismos datos. */}
            <div className="hidden lg:block space-y-5">
              {(() => {
                const tarjeta = { borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', padding: '22px 24px' }
                const titulo = { margin: 0, font: '800 17px Archivo' }
                const sub = { margin: '4px 0 16px', font: '500 13px Archivo', color: 'var(--muted-foreground)' }
                const etiqueta = { display: 'block', marginBottom: 8, font: '700 11px Archivo', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }
                const opc = { textTransform: 'none', letterSpacing: 0, fontWeight: 500 }
                const campo = { width: '100%', boxSizing: 'border-box', height: 46, padding: '0px 14px', borderRadius: 10, border: '1px solid var(--input-line)', background: 'var(--input)', color: 'var(--foreground)', font: '500 15px Archivo' }
                const area = { ...campo, height: 'auto', padding: '12px 14px', font: '500 15px / 1.5 Archivo', resize: 'vertical' }
                const ayuda = { margin: '6px 0 0', font: '500 12px Archivo', color: 'var(--muted-foreground)' }
                return (
                  <>
                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Foto de fondo</h2>
                      <p style={sub}>Va detrás del texto en la sección Sobre nosotros. Recomendado: 1920 × 1080.</p>
                      <div style={{ width: 448 }}>
                        <ImageUpload preview={imagenNosotrosPreview} onChange={e => handleFileChange(e, 'nosotros')} label="Cambiar foto" aspect="aspect-video" disabled={!puedeModificar} />
                      </div>
                    </section>

                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Encabezado</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 16 }}>
                        <div>
                          <label htmlFor="nos-titulo" style={etiqueta}>Título de la sección *</label>
                          <input id="nos-titulo" disabled={!puedeModificar} type="text" value={tituloNosotros} onChange={e => setTituloNosotros(e.target.value)} placeholder="Sobre Nosotros" style={campo} />
                        </div>
                        <div>
                          <label htmlFor="nos-frase" style={etiqueta}>Frase corta <span style={opc}>(opcional)</span></label>
                          <input id="nos-frase" disabled={!puedeModificar} type="text" value={subtituloNosotros} onChange={e => setSubtituloNosotros(e.target.value)} placeholder="Ej: Más que un gimnasio, una comunidad" style={campo} />
                          <p style={ayuda}>Va debajo del título.</p>
                        </div>
                      </div>
                    </section>

                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Historia</h2>
                      <p style={sub}>La cuentan quiénes son y qué los hace únicos. Se muestra en la web pública.</p>
                      <label htmlFor="nos-desc" style={etiqueta}>Descripción *</label>
                      <textarea id="nos-desc" disabled={!puedeModificar} rows={5} value={descripcionNosotros} onChange={e => setDescripcionNosotros(e.target.value)} placeholder="Bravos Box es un centro de entrenamiento CrossFit fundado en..." style={area} />
                    </section>

                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Misión / valores</h2>
                      <p style={sub}>Frase o párrafo corto que resume la filosofía del gimnasio.</p>
                      <label htmlFor="nos-mision" style={etiqueta}>Misión</label>
                      <textarea id="nos-mision" disabled={!puedeModificar} rows={3} value={mision} onChange={e => setMision(e.target.value)} placeholder="Nuestra misión es transformar vidas a través del movimiento funcional y la comunidad." style={area} />
                      <p style={ayuda}>Aparece destacada visualmente en la sección Sobre Nosotros.</p>
                    </section>
                  </>
                )
              })()}
            </div>

            {/* Celular y tableta: tarjetas como antes */}
            <div className="lg:hidden">
            <SectionCard title="Foto de fondo" subtitle="Imagen que aparece detrás del texto en la sección Sobre Nosotros. Resolución recomendada: 1920×1080.">
              <div className="max-w-sm">
                <ImageUpload
                  preview={imagenNosotrosPreview}
                  onChange={e => handleFileChange(e, 'nosotros')}
                  label="Cambiar foto"
                  aspect="aspect-video"
                  disabled={!puedeModificar}
                />
              </div>
            </SectionCard>

            <SectionCard title="Encabezado de la sección" subtitle="Título y frase corta que presentan al gimnasio.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Título de la sección">
                  <input disabled={!puedeModificar} type="text" value={tituloNosotros} onChange={e => setTituloNosotros(e.target.value)} placeholder="Sobre Nosotros" className={inputCls} />
                </Field>
                <Field label="Subtítulo / tagline">
                  <input disabled={!puedeModificar} type="text" value={subtituloNosotros} onChange={e => setSubtituloNosotros(e.target.value)} placeholder="Más que un gimnasio, una comunidad." className={inputCls} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Descripción del gimnasio" subtitle="Texto principal que cuenta la historia y propuesta de valor de Bravos Box.">
              <Field label="Descripción" hint="Contá quiénes son, cuándo fundaron el gym, qué los hace únicos. Se muestra en la landing pública.">
                <textarea
                  disabled={!puedeModificar}
                  rows={5}
                  value={descripcionNosotros}
                  onChange={e => setDescripcionNosotros(e.target.value)}
                  placeholder="Bravos Box es un centro de entrenamiento CrossFit fundado en..."
                  className={textareaCls}
                />
              </Field>
            </SectionCard>

            <SectionCard title="Misión / valores" subtitle="Frase o párrafo corto que resume la filosofía del gimnasio.">
              <Field label="Misión" hint="Aparece destacada visualmente en la sección Sobre Nosotros.">
                <textarea
                  disabled={!puedeModificar}
                  rows={3}
                  value={mision}
                  onChange={e => setMision(e.target.value)}
                  placeholder="Nuestra misión es transformar vidas a través del movimiento funcional y la comunidad."
                  className={textareaCls}
                />
              </Field>
            </SectionCard>
            </div>
          </>
        )}

        {/* ── CLASES ── */}
        {tab === 'clases' && (
          <>
          <div className="lg:hidden">
          <SectionCard title="Tarjetas de clases" subtitle="Dos tarjetas que se muestran en la landing: CrossFit y Planificación.">
            <SelectorTres valor={tarjeta} onChange={setTarjeta} etiquetas={cards.map((c, i) => c.titulo || `Tarjeta ${i + 1}`)} nombre="Tarjetas" />
            {/* Celular: de a una tarjeta. Computadora: las dos juntas */}
            <div className="grid gap-5 md:grid-cols-2">
              {cards.map((card, i) => (
                <div key={i} className={`space-y-3 rounded-xl border border-border bg-background/50 p-4 ${i === tarjeta ? '' : 'hidden md:block'}`}>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-lime-400/15 px-2 py-0.5 text-[0.625rem] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Tarjeta {i + 1}</span>
                  </div>

                  <Field label="Foto de la tarjeta" hint="Se ajusta a cuadrado: arrastrá la foto y usá el zoom antes de guardar.">
                    <ImageUpload
                      preview={imagenesClasePreview[i]}
                      onChange={e => handleFileChange(e, i === 0 ? 'clase1' : 'clase3')}
                      label="Cambiar foto"
                      aspect="aspect-square"
                      disabled={!puedeModificar}
                    />
                  </Field>

                  <Field label="Nombre de la clase">
                    <input
                      disabled={!puedeModificar}
                      type="text"
                      value={card.titulo}
                      onChange={e => updateCard(i, 'titulo', e.target.value)}
                      placeholder="CrossFit"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Descripción breve">
                    <textarea
                      disabled={!puedeModificar}
                      rows={3}
                      value={card.descripcion}
                      onChange={e => updateCard(i, 'descripcion', e.target.value)}
                      placeholder="Entrenamiento funcional de alta intensidad para todos los niveles."
                      className={textareaCls}
                    />
                  </Field>
                </div>
              ))}
            </div>
          </SectionCard>
          </div>

            {/* ESCRITORIO: Tarjetas de clases como la referencia (mismos datos) */}
            <div className="hidden lg:block">
              <p style={{ margin: '0 0 20px', font: '500 15px Archivo', color: 'var(--muted-foreground)' }}>Las 2 tarjetas que presentan las clases en la portada.</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 }}>
                {cards.map((card, i) => {
                  const n = i + 1
                  const etiqueta = { display: 'block', marginBottom: 8, font: '700 12px Archivo', letterSpacing: '0.1em', color: 'var(--muted-foreground)' }
                  const campo = { width: '100%', boxSizing: 'border-box', height: 48, padding: '0px 14px', borderRadius: 10, border: '1px solid var(--input-line)', background: 'var(--input)', color: 'var(--foreground)', font: '500 15px Archivo' }
                  const area = { ...campo, height: 'auto', padding: '12px 14px', font: '500 15px / 1.6 Archivo', resize: 'vertical' }
                  const ayuda = { margin: '6px 0 0', font: '500 13px / 1.45 Archivo', color: 'var(--muted-foreground)' }
                  return (
                    <section key={i} style={{ borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <span style={{ alignSelf: 'flex-start', padding: '3px 9px', borderRadius: 6, background: 'var(--sh-active-bg)', border: '1px solid var(--sh-accent)', color: 'var(--sh-accent)', font: '700 11px Archivo', letterSpacing: '0.06em' }}>TARJETA {n}</span>
                      <ImageUpload preview={imagenesClasePreview[i]} onChange={e => handleFileChange(e, i === 0 ? 'clase1' : 'clase3')} label="Cambiar foto" aspect="aspect-square" disabled={!puedeModificar} />
                      <p style={{ margin: '-8px 0 0', font: '500 13px Archivo', color: 'var(--muted-foreground)' }}>Se recorta en cuadrado. Elegí una foto con el motivo al centro.</p>
                      <div>
                        <label htmlFor={'cls-nombre-' + n} style={etiqueta}>NOMBRE DE LA CLASE *</label>
                        <input id={'cls-nombre-' + n} disabled={!puedeModificar} type="text" maxLength={30} value={card.titulo} onChange={e => updateCard(i, 'titulo', e.target.value)} style={campo} />
                      </div>
                      <div>
                        <label htmlFor={'cls-desc-' + n} style={etiqueta}>DESCRIPCIÓN BREVE *</label>
                        <textarea id={'cls-desc-' + n} disabled={!puedeModificar} rows={2} maxLength={90} value={card.descripcion} onChange={e => updateCard(i, 'descripcion', e.target.value)} style={area} />
                        <p style={ayuda}>{(card.descripcion || '').length} / 90 caracteres</p>
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>

            {recorte && <RecortarFoto archivo={recorte.archivo} onAceptar={aplicarRecorte} onCancelar={() => setRecorte(null)} />}
          </>
        )}

        {/* ── CONTACTO ── */}
        {tab === 'contacto' && (
          <>
            <div className="lg:hidden">
            <SectionCard title="Datos de contacto" subtitle="Información que aparece en la sección de contacto de la landing.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Dirección">
                  <input disabled={!puedeModificar} type="text" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. Siempre Viva 123, Buenos Aires" className={inputCls} />
                </Field>
                <Field label="Teléfono / WhatsApp">
                  <input disabled={!puedeModificar} type="text" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+54 11 1234-5678" className={inputCls} />
                </Field>
                <Field label="Email de contacto">
                  <input disabled={!puedeModificar} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="info@bravosbox.com" className={inputCls} />
                </Field>
                <Field label="Instagram (usuario)">
                  <div className="flex">
                    <span className="flex items-center rounded-l-xl border border-r-0 border-border bg-muted px-3 text-sm font-bold text-foreground/60">@</span>
                    <input disabled={!puedeModificar} type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="bravosbox" className={inputCls + " rounded-l-none"} />
                  </div>
                </Field>
                <Field label="WhatsApp (botón flotante de la página)">
                  <input disabled={!puedeModificar} type="tel" inputMode="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5493704123456" className={inputCls} />
                  <p className="mt-1 text-xs text-muted-foreground">Con código de país y de área, sin el 0 ni el 15. Ej.: 54 9 370 4123456. Si queda vacío, el botón no se muestra.</p>
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Horarios de atención" subtitle="Se muestran en la landing debajo de los datos de contacto.">
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Lunes a Viernes">
                  <input disabled={!puedeModificar} type="text" value={horarioSemana} onChange={e => setHorarioSemana(e.target.value)} placeholder="6:00 - 22:00" className={inputCls} />
                </Field>
                <Field label="Sábado">
                  <input disabled={!puedeModificar} type="text" value={horarioSabado} onChange={e => setHorarioSabado(e.target.value)} placeholder="17:00 - 19:00" className={inputCls} />
                </Field>
                <Field label="Domingo">
                  <input disabled={!puedeModificar} type="text" value={horarioDomingo} onChange={e => setHorarioDomingo(e.target.value)} placeholder="Cerrado" className={inputCls} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Datos legales" subtitle="Aparecen en los Términos y condiciones y en la Política de privacidad. La ley exige identificar a quien presta el servicio.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Titular o razón social" hint="Nombre de la persona o empresa dueña del gimnasio.">
                  <input disabled={!puedeModificar} type="text" value={legalTitular} onChange={e => setLegalTitular(e.target.value)} placeholder="BRAVOS FITNESS S.R.L." className={inputCls} />
                </Field>
                <Field label="CUIT">
                  <input disabled={!puedeModificar} type="text" value={legalCuit} onChange={e => setLegalCuit(e.target.value)} placeholder="30-71649283-9" className={inputCls} />
                </Field>
                <Field label="Domicilio legal" hint="Si lo dejás vacío se usa la dirección de contacto.">
                  <input disabled={!puedeModificar} type="text" value={legalDomicilio} onChange={e => setLegalDomicilio(e.target.value)} placeholder="Eva Perón 552, Formosa" className={inputCls} />
                </Field>
              </div>
            </SectionCard>

            <SectionCard title="Mapa (Google Maps)" subtitle="URL del embed de Google Maps para mostrar la ubicación del gimnasio.">
              <Field label="URL del embed" hint='En Google Maps → Compartir → Insertar mapa → copiá solo el valor del atributo src del iframe.'>
                <input disabled={!puedeModificar} type="url" value={mapaUrl} onChange={e => setMapaUrl(e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." className={inputCls} />
              </Field>
              {mapaUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-border aspect-video">
                  <iframe src={mapaUrl} className="h-full w-full" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
              )}
            </SectionCard>
            </div>

            {/* ESCRITORIO: Contacto, horarios y mapa como la referencia (mismos datos) */}
            <div className="hidden lg:block space-y-5">
              {(() => {
                const tarjeta = { borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', padding: '22px 24px' }
                const titulo = { margin: 0, font: '800 17px Archivo' }
                const sub = { margin: '4px 0 16px', font: '500 13px Archivo', color: 'var(--muted-foreground)' }
                const etiqueta = { display: 'block', marginBottom: 8, font: '700 11px Archivo', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }
                const opc = { textTransform: 'none', letterSpacing: 0, fontWeight: 500 }
                const campo = { width: '100%', boxSizing: 'border-box', height: 46, padding: '0px 14px', borderRadius: 10, border: '1px solid var(--input-line)', background: 'var(--input)', color: 'var(--foreground)', font: '500 15px Archivo' }
                const ayuda = { margin: '6px 0 0', font: '500 12px Archivo', color: 'var(--muted-foreground)' }
                const prefijo = { display: 'flex', alignItems: 'center', padding: '0px 14px', borderRadius: '10px 0px 0px 10px', border: '1px solid var(--input-line)', borderRight: 0, background: 'var(--muted)', color: 'var(--muted-foreground)', font: '600 15px Archivo' }
                const filaHorario = { display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr)', alignItems: 'center', gap: 16, padding: '14px 18px' }
                return (
                  <>
                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Datos de contacto</h2>
                      <p style={sub}>Aparecen en la sección de contacto de la web.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <label htmlFor="con-direccion" style={etiqueta}>Dirección *</label>
                          <input id="con-direccion" disabled={!puedeModificar} type="text" value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Av. Siempre Viva 123, Buenos Aires" style={campo} />
                        </div>
                        <div>
                          <label htmlFor="con-telefono" style={etiqueta}>Teléfono *</label>
                          <input id="con-telefono" disabled={!puedeModificar} type="tel" inputMode="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+54 11 1234-5678" style={campo} />
                          <p style={ayuda}>Con código de país y de área, sin el 0 ni el 15.</p>
                        </div>
                        <div>
                          <label htmlFor="con-email" style={etiqueta}>Email de contacto <span style={opc}>(opcional)</span></label>
                          <input id="con-email" disabled={!puedeModificar} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Ej: info@bravosbox.com" style={campo} />
                        </div>
                        <div>
                          <label htmlFor="con-instagram" style={etiqueta}>Instagram <span style={opc}>(opcional)</span></label>
                          <div style={{ display: 'flex' }}>
                            <span style={prefijo}>@</span>
                            <input id="con-instagram" disabled={!puedeModificar} type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="bravos.box" style={{ ...campo, borderRadius: '0px 10px 10px 0px' }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: 20, padding: '16px 18px', borderRadius: 12, background: 'var(--muted)', border: '1px solid var(--border)' }}>
                        <div style={{ font: '700 15px Archivo' }}>Botón flotante de WhatsApp</div>
                        <p style={{ margin: '2px 0 12px', font: '500 13px Archivo', color: 'var(--muted-foreground)' }}>Se muestra abajo a la derecha en toda la web. Si queda vacío, no se muestra.</p>
                        <label htmlFor="con-whatsapp" style={etiqueta}>Número de WhatsApp</label>
                        <input id="con-whatsapp" disabled={!puedeModificar} type="tel" inputMode="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="5493704123456" style={campo} />
                        <p style={ayuda}>Con código de país y de área, sin el 0 ni el 15. Ej.: 54 9 370 4123456.</p>
                      </div>
                    </section>

                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Horarios de atención</h2>
                      <p style={sub}>Se muestran debajo de los datos de contacto.</p>
                      <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                        {[
                          { id: 'semana', etiqueta: 'Lunes a viernes', valor: horarioSemana, set: setHorarioSemana, ph: '6:00 - 22:00' },
                          { id: 'sabado', etiqueta: 'Sábado', valor: horarioSabado, set: setHorarioSabado, ph: '17:00 - 19:00' },
                          { id: 'domingo', etiqueta: 'Domingo', valor: horarioDomingo, set: setHorarioDomingo, ph: 'Cerrado' },
                        ].map((h, i) => (
                          <div key={h.id} style={{ ...filaHorario, borderTop: i ? '1px solid var(--border)' : 0 }}>
                            <label htmlFor={'con-h-' + h.id} style={{ font: '700 15px Archivo' }}>{h.etiqueta}</label>
                            <input id={'con-h-' + h.id} disabled={!puedeModificar} type="text" value={h.valor} onChange={e => h.set(e.target.value)} placeholder={h.ph} style={campo} />
                          </div>
                        ))}
                      </div>
                    </section>

                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Datos legales</h2>
                      <p style={sub}>Aparecen en los Términos y condiciones y en la Política de privacidad. La ley pide identificar a quien presta el servicio.</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div>
                          <label htmlFor="con-titular" style={etiqueta}>Titular o razón social *</label>
                          <input id="con-titular" disabled={!puedeModificar} type="text" value={legalTitular} onChange={e => setLegalTitular(e.target.value)} placeholder="BRAVOS FITNESS S.R.L." style={campo} />
                          <p style={ayuda}>La persona o empresa dueña del gimnasio.</p>
                        </div>
                        <div>
                          <label htmlFor="con-cuit" style={etiqueta}>CUIT *</label>
                          <input id="con-cuit" disabled={!puedeModificar} type="text" value={legalCuit} onChange={e => setLegalCuit(e.target.value)} placeholder="30-71649283-9" style={campo} />
                          <p style={ayuda}>11 números. Los guiones se ponen solos.</p>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label htmlFor="con-domicilio" style={etiqueta}>Domicilio legal</label>
                          <input id="con-domicilio" disabled={!puedeModificar} type="text" value={legalDomicilio} onChange={e => setLegalDomicilio(e.target.value)} placeholder="Eva Perón 552, Formosa" style={campo} />
                          <p style={ayuda}>Si lo dejás vacío, se usa la dirección de contacto.</p>
                        </div>
                      </div>
                    </section>

                    <section style={tarjeta}>
                      <h2 className="bv-admin-titulo" style={titulo}>Mapa</h2>
                      <p style={sub}>La ubicación del gimnasio en la web.</p>
                      <label htmlFor="con-mapa" style={etiqueta}>Enlace de Google Maps</label>
                      <input id="con-mapa" disabled={!puedeModificar} type="url" value={mapaUrl} onChange={e => setMapaUrl(e.target.value)} placeholder="https://www.google.com/maps/embed?pb=..." style={campo} />
                      <p style={ayuda}>En Google Maps → Compartir → Insertar mapa → copiá solo el valor del atributo src del iframe.</p>
                      {mapaUrl && (
                        <div style={{ marginTop: 16, height: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <iframe src={mapaUrl} title="Mapa del gimnasio" style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                        </div>
                      )}
                    </section>
                  </>
                )
              })()}
            </div>
          </>
        )}

        {/* Guardar: en el celular queda fijo arriba de la barra de navegación (con lugar para la mascota del chat) */}
        {puedeModificar && (
          <div className="lg:hidden fixed inset-x-0 bottom-[4rem] z-20 border-t border-border bg-background/95 py-3 pl-4 pr-[4.75rem] backdrop-blur lg:static lg:flex lg:justify-end lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            {botonGuardar('min-h-[3rem] w-full px-6 text-xs lg:w-auto')}
          </div>
        )}
        {/* Escritorio: barra de abajo como la referencia */}
        <div style={{ marginTop: 'auto' }} className="hidden lg:flex sticky bottom-0 z-10 items-center justify-between gap-4 border-t border-border bg-background/95 py-4 backdrop-blur lg:pr-24 lg:-mb-[48px] lg:-ml-[22rem] lg:-mr-8 lg:pl-8">
          <span className="text-sm font-semibold text-muted-foreground">{guardando ? 'Guardando…' : hayCambios ? 'Cambios sin guardar' : 'Todo guardado'}</span>
          <div className="flex gap-3">
            <button type="button" onClick={() => window.location.reload()} disabled={guardando}
              className="inline-flex h-[46px] items-center rounded-[10px] border border-border px-5 text-[14px] font-bold text-foreground transition-colors hover:bg-[rgba(128,128,128,.14)] disabled:opacity-50">
              Descartar cambios
            </button>
            {puedeModificar && (
              <button type="submit" form="form-landing" disabled={guardando || !hayCambios}
                className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] px-6 text-[13px] font-black uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-60 bg-lime-400 text-black hover:bg-lime-300 disabled:bg-[rgba(128,128,128,.22)] disabled:text-muted-foreground">
                {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {guardando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            )}
          </div>
        </div>
      </form>
      )}
      </div>
    </div>
  )
}

export default ConfiguracionLandingPage
