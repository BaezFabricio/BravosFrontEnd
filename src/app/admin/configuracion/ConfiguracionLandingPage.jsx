import { useEffect, useState } from 'react'
import { Save, Upload, Layout, Users, Dumbbell, MapPin, Image as ImageIcon, Loader2 } from 'lucide-react'
import { GymLoader } from '@/components/GymLoader'
import { toast } from '@/lib/notificar'
import { LogoBoxBravos } from '@/components/logo-box-bravos'

const TABS = [
  { id: 'hero',     label: 'Hero & Logo',       icon: Layout  },
  { id: 'nosotros', label: 'Sobre Nosotros',     icon: Users   },
  { id: 'clases',   label: 'Tarjetas de Clases', icon: Dumbbell },
  { id: 'contacto', label: 'Contacto y Horarios',icon: MapPin  },
]

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-sm font-semibold text-zinc-200">{label}</label>
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    {children}
  </div>
)

const inputCls = "w-full rounded-lg border border-zinc-700 bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-zinc-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
const textareaCls = inputCls + " resize-none"

const SectionCard = ({ title, subtitle, children }) => (
  <div className="rounded-xl border border-border bg-muted/50 p-6 space-y-5">
    <div className="border-b border-border pb-4">
      <h2 className="text-base font-bold text-primary">{title}</h2>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
)

const ImageUpload = ({ preview, onChange, label, aspect = 'aspect-video', disabled }) => (
  <div className={`relative ${aspect} overflow-hidden rounded-xl border border-zinc-700 bg-muted group`}>
    {preview
      ? <img src={preview} className="h-full w-full object-cover" alt="" />
      : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-zinc-700" /></div>
    }
    {!disabled && (
      <label className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
        <Upload className="h-5 w-5 text-foreground" />
        <span className="text-xs font-bold text-foreground">{label}</span>
        <input type="file" accept="image/*" onChange={onChange} className="hidden" />
      </label>
    )}
  </div>
)

function ConfiguracionLandingPage() {
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [activeTab, setActiveTab] = useState('hero')
  const [permisos, setPermisos] = useState([])

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
  const [horarioSemana, setHorarioSemana] = useState('Lun-Vie: 6:00 - 22:00')
  const [horarioSabado, setHorarioSabado] = useState('Sábado: 8:00 - 14:00')
  const [horarioDomingo, setHorarioDomingo] = useState('Domingo: Cerrado')
  const [mapaUrl, setMapaUrl] = useState('')

  const puedeModificar = permisos.includes('configuracion:modificacion')
  const useVectorLogo = !logoPreview || logoPreview.includes('logo-box-bravos-final.png')

  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
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
    const stored = localStorage.getItem('permisos')
    if (stored) { try { setPermisos(JSON.parse(stored)) } catch {} }
  }, [])

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
      fd.append('horario_semana', horarioSemana)
      fd.append('horario_sabado', horarioSabado)
      fd.append('horario_domingo', horarioDomingo)
      fd.append('mapaUrl', mapaUrl)

      const res = await fetch('/landing/config', { method: 'PUT', body: fd })
      if (!res.ok) throw new Error()

      toast.success('¡Configuración guardada correctamente!')
    } catch {
      toast.error('Error al guardar la configuración')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <GymLoader text="Cargando configuración del sitio..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Personalización de Inicio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configurá lo que ven los clientes en la página pública del gimnasio.</p>
        </div>
        {puedeModificar && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={guardando}
            className="bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-5 py-2.5 hover:bg-lime-300 disabled:opacity-50 transition-colors flex items-center gap-2 self-start shrink-0"
          >
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-secondary/30 p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── HERO ── */}
        {activeTab === 'hero' && (
          <>
            <SectionCard title="Título Principal" subtitle="Texto de impacto que aparece sobre las imágenes del carrusel.">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Texto del título">
                  <input disabled={!puedeModificar} type="text" value={tituloHero} onChange={e => setTituloHero(e.target.value)} placeholder="CENTRO DE ENTRENAMIENTO" className={inputCls} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <div className="flex items-center gap-6">
                <div className="h-24 w-56 overflow-hidden rounded-lg border border-border bg-zinc-950 flex items-center justify-center p-3">
                  {useVectorLogo
                    ? <LogoBoxBravos className="h-full w-full" width={200} height={60} />
                    : <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                  }
                </div>
                {puedeModificar && (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
                    <Upload className="h-4 w-4" />
                    Cambiar logo
                    <input type="file" accept="image/*" onChange={e => handleFileChange(e, 'logo')} className="hidden" />
                  </label>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Carrusel de Imágenes" subtitle="3 fotos que rotan como fondo de la sección principal. Resolución recomendada: 1920×1080.">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { preview: heroPreview1, tipo: 'hero1', label: 'Foto 1' },
                  { preview: heroPreview2, tipo: 'hero2', label: 'Foto 2' },
                  { preview: heroPreview3, tipo: 'hero3', label: 'Foto 3' },
                ].map(({ preview, tipo, label }) => (
                  <ImageUpload
                    key={tipo}
                    preview={preview}
                    onChange={e => handleFileChange(e, tipo)}
                    label={label}
                    disabled={!puedeModificar}
                  />
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
            <div className="grid gap-5 md:grid-cols-3">
              {cards.map((card, i) => (
                <div key={i} className="rounded-xl border border-border bg-zinc-950 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tarjeta {i + 1}</span>
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
                    <span className="flex items-center rounded-l-lg border border-r-0 border-zinc-700 bg-zinc-800 px-3 text-sm text-muted-foreground">@</span>
                    <input disabled={!puedeModificar} type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="bravosbox" className={inputCls + " rounded-l-none"} />
                  </div>
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

        {/* Botón bottom (acceso rápido) */}
        {puedeModificar && (
          <div className="flex justify-end pt-2 border-t border-border">
            <button
              type="submit"
              disabled={guardando}
              className="bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-5 py-2.5 hover:bg-lime-300 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}

export default ConfiguracionLandingPage
