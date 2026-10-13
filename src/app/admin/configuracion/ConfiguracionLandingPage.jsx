import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Save, Camera, ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react'
import { AdminFormSkeleton } from '@/components/AdminPageSkeleton'
import { toast } from '@/lib/notificar'
import { LogoBoxBravos } from '@/components/logo-box-bravos'
import DatosBancarios from './DatosBancarios'
import MenuAjustes from './MenuAjustes'

// Cada sección se abre desde el menú de Configuración con ?seccion=
const SECCIONES = {
  hero:     { grupo: 'Web pública', titulo: 'Portada y logo', detalle: 'El título, el logo y las fotos del carrusel de la portada.' },
  nosotros: { grupo: 'Web pública', titulo: 'Sobre nosotros', detalle: 'La foto, la historia y la misión que ven los visitantes.' },
  clases:   { grupo: 'Web pública', titulo: 'Tarjetas de clases', detalle: 'Las 3 tarjetas que presentan las disciplinas en la portada.' },
  contacto: { grupo: 'Web pública', titulo: 'Contacto, horarios y mapa', detalle: 'Cómo encontrarte y los datos legales del gimnasio.' },
  banco:    { grupo: 'Cobros', titulo: 'Datos bancarios', detalle: 'La cuenta a la que transfieren los alumnos.' },
}

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-black uppercase tracking-widest text-foreground/60">{label}</label>
    {children}
    {hint && <p className="text-xs text-foreground/50">{hint}</p>}
  </div>
)

const inputCls = "w-full min-h-[48px] rounded-xl border border-border bg-background/60 px-3.5 py-2.5 text-base text-foreground placeholder:text-foreground/35 outline-none transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-400/25 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
const textareaCls = inputCls + " resize-y leading-relaxed"

const SectionCard = ({ title, subtitle, children }) => (
  <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div>
      <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground">
        <span className="h-3.5 w-1 rounded-full bg-lime-400" aria-hidden="true" /> {title}
      </h2>
      {subtitle && <p className="mt-1 text-xs text-foreground/55">{subtitle}</p>}
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
      <label className="absolute bottom-2 right-2 flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-full bg-black/70 px-3 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-black/85 focus-within:ring-2 focus-within:ring-lime-400">
        <Camera className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onChange} className="sr-only" />
      </label>
    )}
  </div>
)

// Selector 1 · 2 · 3 para ver de a una foto o tarjeta en el celular
const SelectorTres = ({ valor, onChange, etiquetas, nombre }) => (
  <div role="tablist" aria-label={nombre} className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-background/60 p-1 md:hidden">
    {etiquetas.map((e, i) => (
      <button key={i} type="button" role="tab" aria-selected={valor === i} onClick={() => onChange(i)}
        className={`min-h-[40px] truncate rounded-lg px-2 text-xs font-black transition-colors ${valor === i ? 'bg-lime-400 text-black' : 'text-foreground/60'}`}>
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

  // Clases (3 cards)
  const [cards, setCards] = useState([
    { titulo: 'CrossFit', descripcion: '', icono: '🔥' },
    { titulo: 'Funcional', descripcion: '', icono: '💪' },
    { titulo: 'Planificación', descripcion: '', icono: '📋' },
  ])
  const [imagenesClase, setImagenesClase] = useState([null, null, null])
  const [imagenesClasePreview, setImagenesClasePreview] = useState(['/hero-crossfit.jpg', '/wod-training.jpg', '/gym-interior.jpg'])

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
  const [horarioSabado, setHorarioSabado] = useState('Sábado: 8:00 - 14:00')
  const [horarioDomingo, setHorarioDomingo] = useState('Domingo: Cerrado')
  const [mapaUrl, setMapaUrl] = useState('')

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
      if (d.imagenClase1) setImagenesClasePreview(prev => [d.imagenClase1, prev[1], prev[2]])
      if (d.imagenClase2) setImagenesClasePreview(prev => [prev[0], d.imagenClase2, prev[2]])
      if (d.imagenClase3) setImagenesClasePreview(prev => [prev[0], prev[1], d.imagenClase3])

      setCards([
        { titulo: d.claseCard1Titulo || 'CrossFit', descripcion: d.claseCard1Descripcion || '', icono: d.claseCard1Icono || '🔥' },
        { titulo: d.claseCard2Titulo || 'Funcional', descripcion: d.claseCard2Descripcion || '', icono: d.claseCard2Icono || '💪' },
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
      setHorarioSabado(d.horario_sabado || 'Sábado: 8:00 - 14:00')
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
    if (!file) return
    const url = URL.createObjectURL(file)
    if (tipo === 'logo') { setLogo(file); setLogoPreview(url) }
    else if (tipo === 'hero1') { setImagenHero1(file); setHeroPreview1(url) }
    else if (tipo === 'hero2') { setImagenHero2(file); setHeroPreview2(url) }
    else if (tipo === 'hero3') { setImagenHero3(file); setHeroPreview3(url) }
    else if (tipo === 'nosotros') { setImagenNosotros(file); setImagenNosotrosPreview(url) }
    else if (tipo === 'clase1') { setImagenesClase(prev => { const n=[...prev]; n[0]=file; return n }); setImagenesClasePreview(prev => { const n=[...prev]; n[0]=url; return n }) }
    else if (tipo === 'clase2') { setImagenesClase(prev => { const n=[...prev]; n[1]=file; return n }); setImagenesClasePreview(prev => { const n=[...prev]; n[1]=url; return n }) }
    else if (tipo === 'clase3') { setImagenesClase(prev => { const n=[...prev]; n[2]=file; return n }); setImagenesClasePreview(prev => { const n=[...prev]; n[2]=url; return n }) }
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
      if (imagenesClase[1]) fd.append('imagenClase2', imagenesClase[1])
      if (imagenesClase[2]) fd.append('imagenClase3', imagenesClase[2])

      // Nosotros
      fd.append('tituloNosotros', tituloNosotros)
      fd.append('subtituloNosotros', subtituloNosotros)
      fd.append('descripcionNosotros', descripcionNosotros)
      fd.append('mision', mision)

      // Clases
      fd.append('claseCard1Titulo', cards[0].titulo)
      fd.append('claseCard1Descripcion', cards[0].descripcion)
      fd.append('claseCard1Icono', cards[0].icono)
      fd.append('claseCard2Titulo', cards[1].titulo)
      fd.append('claseCard2Descripcion', cards[1].descripcion)
      fd.append('claseCard2Icono', cards[1].icono)
      fd.append('claseCard3Titulo', cards[2].titulo)
      fd.append('claseCard3Descripcion', cards[2].descripcion)
      fd.append('claseCard3Icono', cards[2].icono)

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

  // Menú general de ajustes
  if (!activeTab) return <MenuAjustes />

  const seccion = SECCIONES[activeTab]
  const esLanding = activeTab !== 'banco'

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

  return (
    <div className={`mx-auto max-w-5xl space-y-5 ${esLanding && puedeModificar ? 'pb-24 lg:pb-0' : ''}`}>
      {/* Encabezado de la sección */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={volverAlMenu}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-bold text-foreground/80 transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Configuración del Box
          </button>
          {esLanding && puedeModificar && botonGuardar('min-h-[40px] px-4 text-xs', 'Guardar')}
        </div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">{seccion.grupo}</p>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">{seccion.titulo}</h1>
          <p className="mt-1 text-sm text-foreground/60">{seccion.detalle}</p>
        </div>
        {!puedeModificar && (
          <p className="rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground/60">Tu perfil puede ver esta sección pero no cambiarla.</p>
        )}
      </div>

      {/* Los datos bancarios se guardan aparte (su propia ruta en el servidor) */}
      {activeTab === 'banco' && <DatosBancarios puedeModificar={puedeModificar} />}

      {esLanding && (
      <form id="form-landing" onSubmit={handleSubmit} className="space-y-5">

        {/* ── HERO ── */}
        {activeTab === 'hero' && (
          <>
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
                  <label className="flex min-h-[48px] cursor-pointer items-center gap-2 rounded-xl border border-dashed border-lime-500/50 bg-lime-400/10 px-4 text-sm font-bold text-lime-700 transition-colors hover:bg-lime-400/15 focus-within:ring-2 focus-within:ring-lime-500 dark:text-lime-400">
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Cambiar logo
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => handleFileChange(e, 'logo')} className="sr-only" />
                  </label>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Carrusel de Imágenes" subtitle="3 fotos que rotan como fondo de la sección principal. Resolución recomendada: 1920×1080.">
              <SelectorTres valor={fotoHero} onChange={setFotoHero} etiquetas={['Foto 1', 'Foto 2', 'Foto 3']} nombre="Fotos del carrusel" />
              {/* Celular: de a una foto. Computadora: las tres juntas */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { preview: heroPreview1, tipo: 'hero1' },
                  { preview: heroPreview2, tipo: 'hero2' },
                  { preview: heroPreview3, tipo: 'hero3' },
                ].map(({ preview, tipo }, i) => (
                  <div key={tipo} className={i === fotoHero ? '' : 'hidden md:block'}>
                    <p className="mb-1.5 hidden text-[11px] font-black uppercase tracking-widest text-foreground/60 md:block">Foto {i + 1}</p>
                    <ImageUpload
                      preview={preview}
                      onChange={e => handleFileChange(e, tipo)}
                      label="Cambiar"
                      disabled={!puedeModificar}
                    />
                  </div>
                ))}
              </div>
            </SectionCard>
          </>
        )}

        {/* ── NOSOTROS ── */}
        {activeTab === 'nosotros' && (
          <>
            <SectionCard title="Foto de fondo" subtitle="Imagen que aparece detrás del texto en la sección Sobre Nosotros. Resolución recomendada: 1920×1080.">
              <div className="max-w-sm">
                <ImageUpload
                  preview={imagenNosotrosPreview}
                  onChange={e => handleFileChange(e, 'nosotros')}
                  label="Cambiar foto"
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
          </>
        )}

        {/* ── CLASES ── */}
        {activeTab === 'clases' && (
          <SectionCard title="Tarjetas de clases" subtitle="Tres tarjetas que se muestran en la landing para presentar los tipos de entrenamiento disponibles.">
            <SelectorTres valor={tarjeta} onChange={setTarjeta} etiquetas={cards.map((c, i) => c.titulo || `Tarjeta ${i + 1}`)} nombre="Tarjetas" />
            {/* Celular: de a una tarjeta. Computadora: las tres juntas */}
            <div className="grid gap-5 md:grid-cols-3">
              {cards.map((card, i) => (
                <div key={i} className={`space-y-3 rounded-xl border border-border bg-background/50 p-4 ${i === tarjeta ? '' : 'hidden md:block'}`}>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-lime-400/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Tarjeta {i + 1}</span>
                  </div>

                  <Field label="Foto de la tarjeta">
                    <ImageUpload
                      preview={imagenesClasePreview[i]}
                      onChange={e => handleFileChange(e, `clase${i + 1}`)}
                      label="Cambiar foto"
                      aspect="aspect-[4/3]"
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
        )}

        {/* ── CONTACTO ── */}
        {activeTab === 'contacto' && (
          <>
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
                  <input disabled={!puedeModificar} type="text" value={horarioSabado} onChange={e => setHorarioSabado(e.target.value)} placeholder="8:00 - 14:00" className={inputCls} />
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
          </>
        )}

        {/* Guardar: en el celular queda fijo arriba de la barra de navegación (con lugar para la mascota del chat) */}
        {puedeModificar && (
          <div className="fixed inset-x-0 bottom-[64px] z-20 border-t border-border bg-background/95 py-3 pl-4 pr-[76px] backdrop-blur lg:static lg:flex lg:justify-end lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            {botonGuardar('min-h-[48px] w-full px-6 text-xs lg:w-auto')}
          </div>
        )}
      </form>
      )}
    </div>
  )
}

export default ConfiguracionLandingPage
