import { useEffect, useState } from 'react'
import { Save, Image as ImageIcon, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

function ConfiguracionLandingPage() {
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [activeTab, setActiveTab] = useState('hero')
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' })

  // Estados para los campos del formulario
  const [tituloHero, setTituloHero] = useState('')
  const [tituloSize, setTituloSize] = useState('')
  const [tituloFont, setTituloFont] = useState('')
  const [tituloAlign, setTituloAlign] = useState('')
  const [logo, setLogo] = useState(null)
  
  // Estados para las 3 imágenes
  const [imagenHero1, setImagenHero1] = useState(null)
  const [imagenHero2, setImagenHero2] = useState(null)
  const [imagenHero3, setImagenHero3] = useState(null)
  
  const [logoPreview, setLogoPreview] = useState('/logo-box-bravos-final.png')
  
  // Previews para las 3 imágenes
  const [heroPreview1, setHeroPreview1] = useState('/landing-hero-1.jpg')
  const [heroPreview2, setHeroPreview2] = useState('/landing-hero-2.jpg')
  const [heroPreview3, setHeroPreview3] = useState('/landing-hero-3.jpg')

  // URL base de tu backend
  const API_URL = 'http://localhost:3001'

  // Cargar configuración inicial
  const cargarConfiguracion = async () => {
    try {
      setLoading(true)
      const respuesta = await fetch(`${API_URL}/landing/config?t=${new Date().getTime()}`)
      
      if (!respuesta.ok) {
        throw new Error('No se pudo obtener la configuración del servidor')
      }

      const data = await respuesta.json()
      
      if (data) {
        setTituloHero(data.tituloHero || '')
        setTituloSize(data.tituloHeroSize || '')
        setTituloFont(data.tituloHeroFont || '')
        setTituloAlign(data.tituloHeroAlign || '')
        if (data.logoUrl) setLogoPreview(data.logoUrl)
        // Ajustado para recibir array u objeto de imágenes si el backend las envía así
        if (data.heroImages) {
          const imgs = Array.isArray(data.heroImages) ? data.heroImages : Object.values(data.heroImages)
          setHeroPreview1(imgs[0] || '/landing-hero-1.jpg')
          setHeroPreview2(imgs[1] || '/landing-hero-2.jpg')
          setHeroPreview3(imgs[2] || '/landing-hero-3.jpg')
        }
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error)
      setMensaje({
        texto: 'Error de conexión con el backend. Asegurate de que el servidor esté corriendo.',
        tipo: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  // Manejo de Previews
  const handleFileChange = (e, tipo) => {
    const file = e.target.files[0]
    if (!file) return

    if (tipo === 'logo') {
      setLogo(file)
      setLogoPreview(URL.createObjectURL(file))
    } else if (tipo === 'hero1') {
      setImagenHero1(file)
      setHeroPreview1(URL.createObjectURL(file))
    } else if (tipo === 'hero2') {
      setImagenHero2(file)
      setHeroPreview2(URL.createObjectURL(file))
    } else if (tipo === 'hero3') {
      setImagenHero3(file)
      setHeroPreview3(URL.createObjectURL(file))
    }
  }

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setGuardando(true)
      setMensaje({ texto: '', tipo: '' })

      const formData = new FormData()
      formData.append('tituloHero', tituloHero)
      // Agregar estilos del título si fueron configurados
      if (tituloSize) formData.append('tituloHeroSize', tituloSize)
      if (tituloFont) formData.append('tituloHeroFont', tituloFont)
      if (tituloAlign) formData.append('tituloHeroAlign', tituloAlign)
      if (logo) formData.append('logo', logo)
      if (imagenHero1) formData.append('imagenHero1', imagenHero1)
      if (imagenHero2) formData.append('imagenHero2', imagenHero2)
      if (imagenHero3) formData.append('imagenHero3', imagenHero3)

      const respuesta = await fetch(`${API_URL}/landing/config`, {
        method: 'PUT',
        body: formData,
      })

      if (!respuesta.ok) {
        throw new Error('Error al guardar los datos en el servidor')
      }

      setMensaje({
        texto: '¡Los cambios se actualizaron correctamente!',
        tipo: 'success'
      })
    } catch (error) {
      console.error('Error al guardar:', error)
      setMensaje({
        texto: 'Hubo un problema al guardar la configuración.',
        tipo: 'error'
      })
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-lg font-semibold animate-pulse">Cargando personalización de inicio...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white md:p-10">
      {mensaje.texto && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 border ${
          mensaje.tipo === 'success' 
            ? 'bg-green-950/50 border-green-500/30 text-green-400' 
            : 'bg-red-950/50 border-red-500/30 text-red-400'
        }`}>
          <div className={`h-2 w-2 rounded-full ${mensaje.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">{mensaje.texto}</span>
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Personalización de Inicio</h1>
        <p className="mt-2 text-sm text-zinc-400">Administra la información visual que ven los clientes externos.</p>
      </header>

      <div className="mb-8 flex flex-wrap gap-2 border-b border-zinc-800 pb-px">
        {[
          { id: 'hero', label: 'Hero & Logo', icon: ImageIcon },
          { id: 'nosotros', label: 'Sobre Nosotros', icon: ImageIcon },
          { id: 'clases', label: 'Tarjetas de Clases', icon: ImageIcon },
          { id: 'contacto', label: 'Contacto y Horarios', icon: ImageIcon },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold tracking-wide border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-accent bg-zinc-900 text-white'
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-900/50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
        {activeTab === 'hero' && (
          <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-accent">Sección Principal (Hero)</h2>
              <p className="text-xs text-zinc-400 mt-1">Modifica el encabezado, el título de impacto y el carrusel de imágenes.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide text-zinc-300">Título Principal Landing</label>
                <input
                  type="text"
                  value={tituloHero}
                  onChange={(e) => setTituloHero(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white focus:border-accent focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400">Tamaño (px)</label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={tituloSize}
                      onChange={(e) => setTituloSize(e.target.value)}
                      className="w-24 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400">Alineación</label>
                    <select
                      value={tituloAlign}
                      onChange={(e) => setTituloAlign(e.target.value)}
                      className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-white"
                    >
                      <option value="left">Izquierda</option>
                      <option value="center">Centro</option>
                      <option value="right">Derecha</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-zinc-400">Tipografía</label>
                    <input
                      type="text"
                      placeholder="Ej: Arial, 'Roboto', sans-serif"
                      value={tituloFont}
                      onChange={(e) => setTituloFont(e.target.value)}
                      className="w-48 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold tracking-wide text-zinc-300">Logo de Navegación</label>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-24 bg-zinc-900 border border-zinc-800 rounded p-1 flex items-center justify-center">
                    <img src={logoPreview} alt="Preview Logo" className="max-h-full max-w-full object-contain" />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer bg-zinc-900 hover:bg-zinc-800 text-xs font-bold py-2.5 px-4 border border-zinc-800 rounded-md transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    Seleccionar Archivo
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Bloque de imágenes del carrusel, manteniendo tu estilo original */}
            <div className="space-y-4">
              <label className="text-sm font-semibold tracking-wide text-zinc-300">Imágenes del Carrusel (3 fotos)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { preview: heroPreview1, setter: 'hero1' },
                  { preview: heroPreview2, setter: 'hero2' },
                  { preview: heroPreview3, setter: 'hero3' }
                ].map((item, index) => (
                  <div key={index} className="relative aspect-video overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                    <img src={item.preview} className="h-full w-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <label className="flex items-center gap-2 cursor-pointer bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-bold py-2.5 px-5 rounded-md transition-colors shadow-lg">
                        <Upload className="h-4 w-4" />
                        Foto {index + 1}
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, item.setter)} className="hidden" />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'hero' && (
          <div className="border border-zinc-800 bg-zinc-950 p-12 text-center rounded-xl">
            <p className="text-zinc-500 font-medium">Sección en desarrollo.</p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-zinc-900">
          <Button
            type="submit"
            disabled={guardando}
            className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-5 flex items-center gap-2 shadow-lg shadow-green-950/20 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {guardando ? 'GUARDANDO CAMBIOS...' : 'GUARDAR CONFIGURACIÓN'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ConfiguracionLandingPage