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
  Dumbbell,
  Shield,
  ClipboardCheck,
  Clock,
  Phone,
  Mail,
  AtSign
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { LogoBoxBravos } from '@/components/logo-box-bravos'
import { ModeToggle } from "@/components/ModeToggle"
import { GymLoader } from '@/components/GymLoader'
import UserMenu from '@/components/UserMenu'
import NotificacionesBell from '@/components/NotificacionesBell'

const navigation = [
  { name: 'INICIO', href: '#', hasDropdown: false },
  {
    name: 'CLASES',
    href: '#clases',
    hasDropdown: true,
    items: [
      { name: 'Funcional', href: '#clases' },
      { name: 'WOD Intensivo', href: '#clases' },
      { name: 'Open Box', href: '#clases' },
    ],
  },
  { name: 'HORARIOS', href: '#horarios', hasDropdown: false },
  { name: 'NOSOTROS', href: '#nosotros', hasDropdown: false },
  { name: 'CONTACTO', href: '#contacto', hasDropdown: false },
]

const defaultHeroImages = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920', 
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1920', 
  'https://images.unsplash.com/photo-1571731956672-f2b94d7db0cb?q=80&w=1920'  
]

function LandingPage() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [heroImages, setHeroImages] = useState(defaultHeroImages)
  const [titulo, setTitulo] = useState('Centro de Entrenamiento')
  const [logoUrl, setLogoUrl] = useState('/logo-box-bravos-final.png')
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
  const [emailContacto, setEmailContacto] = useState('')
  const [instagram, setInstagram] = useState('')
  const [horarioSemana, setHorarioSemana] = useState('Lun-Vie: 6:00 - 22:00')
  const [horarioSabado, setHorarioSabado] = useState('Sábado: 8:00 - 14:00')
  const [horarioDomingo, setHorarioDomingo] = useState('Domingo: Cerrado')
  const [mapaUrl, setMapaUrl] = useState('https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3540.0638546114256!2d-58.1764654246146!3d-26.18374827715694!2m3!1f0!2f0!3f0!3m2!1i1020!2i540!4f13.1!3m3!1m2!1s0x94576a911765c9b9%3A0x6b6d51c337b587!2sEva%20Per%C3%B3n%20552%2C%20Formosa!5e0!3m2!1ses-419!2sar!4v1716382000000')

  const useVectorLogo = !logoUrl || logoUrl.includes('logo-box-bravos-final.png')

  const [pageLoading, setPageLoading] = useState(true)
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
  const [diaSeleccionado, setDiaSeleccionado] = useState('LUNES')

  const diasSemanaMapeo = [
    { label: 'LUNES', value: 'LUNES' },
    { label: 'MARTES', value: 'MARTES' },
    { label: 'MIÉRCOLES', value: 'MIERCOLES' }, 
    { label: 'JUEVES', value: 'JUEVES' },
    { label: 'VIERNES', value: 'VIERNES' },
    { label: 'SÁBADO', value: 'SABADO' }
  ]

  useEffect(() => {
    let isMounted = true
    const token = localStorage.getItem("token")
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

    if (token) {
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

    fetch(`/landing/config?t=${new Date().getTime()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return
        if (data?.tituloHero) setTitulo(data.tituloHero)
        if (data?.logoUrl) {
          setLogoUrl(data.logoUrl)
          setLogoTs(Date.now())
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
        if (data?.email) setEmailContacto(data.email)
        if (data?.instagram) setInstagram(data.instagram)
        if (data?.horario_semana) setHorarioSemana(data.horario_semana)
        if (data?.horario_sabado) setHorarioSabado(data.horario_sabado)
        if (data?.horario_domingo) setHorarioDomingo(data.horario_domingo)
        if (data?.mapaUrl) setMapaUrl(data.mapaUrl)
      })
      .catch((err) => {
        console.error('Error al cargar config desde el admin:', err)
        if (isMounted) setHeroImages(defaultHeroImages)
      })
      .finally(() => {
        if (isMounted) setPageLoading(false)
      })
    fetch("http://localhost:3001/api/vv1/clases/disponibles")
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
    localStorage.removeItem('token')
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
  
      const diaBaseDatos = c.dia ? c.dia.toUpperCase().trim() : "";
      const diaBoton = diaSeleccionado ? diaSeleccionado.toUpperCase().trim() : "";
      return diaBaseDatos === diaBoton;
    })
    
    .sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || ""));

  if (pageLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <GymLoader text="Cargando..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-foreground selection:bg-emerald-500 selection:text-black">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-black/95 backdrop-blur-md border-b-2 border-lime-400/80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">

              <Link to="/" className="flex items-center">
                {useVectorLogo ? (
                  <LogoBoxBravos className="block h-auto w-auto max-h-[60px] max-w-[180px]" width={180} height={52} />
                ) : (
                  <img
                    src={logoUrl ? `${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${logoTs}` : null}
                    alt="Box Bravos"
                    className="block h-auto w-auto max-h-[60px] max-w-[180px] object-contain"
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
                        {item.items?.map((subItem) => (
                          <a key={subItem.name} href={subItem.href} className="block px-4 py-3 text-xs font-bold tracking-wider text-foreground/60 transition-colors hover:bg-lime-400/5 hover:text-lime-400">
                            {subItem.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="hidden items-center gap-3 lg:flex">

                <ModeToggle />
                
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

              <button type="button" className="p-2 text-foreground lg:hidden" onClick={() => setMobileMenuOpen((previous) => !previous)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-b border-border bg-black lg:hidden">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <a href={item.href} className="flex items-center justify-between py-3 text-sm font-semibold tracking-wide text-white/80 hover:text-white" onClick={() => !item.hasDropdown && setMobileMenuOpen(false)}>
                      {item.name}
                      {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                    </a>
                    {item.hasDropdown && (
                      <div className="ml-2 border-l border-border pl-4">
                        {item.items?.map((subItem) => (
                          <a key={subItem.name} href={subItem.href} className="block py-2 text-sm text-foreground/60 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                            {subItem.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                  {!isLoggedIn ? (
                    <>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full border-white/30 text-foreground hover:bg-white/10">
                          INGRESAR
                        </Button>
                      </Link>
                      <Link to="/registro" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90">
                          UNIRSE
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      {tieneModulosAdmin && puedeAccederPanel && (
                        <Button onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }} variant="outline" className="w-full flex items-center justify-center gap-2 border-border text-foreground hover:bg-foreground/5">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          PANEL DE CONTROL
                        </Button>
                      )}
                      {tieneModulosAlumno && puedeAccederPanel && (
                        <Button onClick={() => { setMobileMenuOpen(false); navigate('/alumno'); }} variant="outline" className="w-full flex items-center justify-center gap-2 border-border text-emerald-400 hover:bg-foreground/5">
                          <Dumbbell className="h-4 w-4 text-emerald-400" />
                          PANEL DE ALUMNO
                        </Button>
                      )}
                      {tieneModulosProfesor && puedeAccederPanel && (
                        <Button onClick={() => { setMobileMenuOpen(false); navigate('/profesor'); }} variant="outline" className="w-full flex items-center justify-center gap-2 border-border text-violet-400 hover:bg-foreground/5">
                          <ClipboardCheck className="h-4 w-4 text-violet-400" />
                          PANEL DE PROFESOR
                        </Button>
                      )}
                      <Button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} variant="destructive" className="w-full flex items-center justify-center gap-2 font-bold bg-red-600 hover:bg-red-700 text-foreground">
                        <LogOut className="h-4 w-4" />
                        CERRAR SESIÓN
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 🟢 SECCIÓN HERO - RECUPERADA CON TU FORMATO NATIVO DE CAPAS EXPANSIVAS */}
      <section className="relative flex min-h-screen items-end pb-8 sm:pb-12">
        {heroImages.map((imageSource, index) => (
          <div key={imageSource} className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}>
            <img src={imageSource} alt="Entrenamiento" className="h-full w-full object-cover" loading={index === 0 ? 'eager' : 'lazy'} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
          </div>
        ))}

        <div className="absolute right-8 bottom-8 z-20 flex gap-2">
          {heroImages.map((_, index) => (
            <button key={index} type="button" onClick={() => setCurrentImageIndex(index)} className={`h-2 rounded-full transition-all ${index === currentImageIndex ? 'w-6 bg-accent' : 'w-2 bg-white/50'}`} />
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
            <div className="flex h-16 w-auto items-center sm:h-20 md:h-24 -ml-[9px]">
              {useVectorLogo ? (
                <LogoBoxBravos className="h-full w-auto object-contain" width={280} height={80} />
              ) : (
                <img
                  src={`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${logoTs}`}
                  alt="Box Bravos"
                  className="h-full w-auto object-contain object-left"
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

            {/* MÁS INFO */}
            <button className="group mt-3 flex items-center gap-2 text-xs font-black tracking-widest text-foreground/70 transition-colors hover:text-lime-400">
              <span>MÁS INFO</span>
              <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
            </button>
          </div>
        </div>
      </section>

      {/* SECCIÓN FRASE MOTIVACIONAL */}
      <section className="bg-black py-12 md:py-16">
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
          <img src={imagenNosotros} alt="Interior del Box" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/80" />
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
            <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[{ value: '500+', label: 'ATLETAS' }, { value: '15', label: 'COACHES' }, { value: '50+', label: 'CLASES/SEM' }, { value: '5', label: 'AÑOS' }].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-black text-accent sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-xs font-semibold tracking-wider text-foreground/50 sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN CLASES */}
      <section id="clases" className="bg-zinc-950 py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">NUESTRAS <span className="text-accent">CLASES</span></h2>
          <div className="grid gap-6 md:grid-cols-3">
            {claseCards.map((clase, idx) => (
              <div key={idx} className="group relative aspect-[4/5] cursor-pointer overflow-hidden">
                <img src={clase.image} alt={clase.titulo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-2xl font-black text-foreground">{clase.titulo.toUpperCase()}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{clase.descripcion}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-semibold">
                    <span className="bg-accent px-2 py-1 text-accent-foreground">{clase.duration}</span>
                    <span className="text-foreground/60">{clase.level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🟢 SECCIÓN HORARIOS: 100% SCONECTADA Y FUNCIONANDO EN PARALELO */}
      <section id="horarios" className="relative py-12 md:py-16">
        <div className="absolute inset-0">
          <img src="/landing-hero-2.jpg" alt="Training" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/90" />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">HORARIOS <span className="text-accent">SEMANALES</span></h2>
          <p className="mb-10 max-w-2xl text-foreground/60">Contamos con clases de lunes a sábado. Elige el horario que mejor se adapte a tu rutina.</p>
          
          <div className="mb-8 flex flex-wrap gap-2">
            {diasSemanaMapeo.map((day) => (
              <button
                key={day.value}
                type="button"
                onClick={() => setDiaSeleccionado(day.value)}
                className={`px-4 py-2 text-sm font-bold tracking-wide transition-all border ${
                  diaSeleccionado === day.value
                    ? "bg-white text-black border-white"
                    : "bg-foreground/5 text-foreground/70 border-border hover:bg-white/10 hover:text-white"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>

          {loadingHorarios ? (
            <p className="text-sm text-foreground/40 animate-pulse">Sincronizando grilla de disciplinas...</p>
          ) : clasesVisibles.length === 0 ? (
            <div className="border border-white/5 bg-foreground/5 rounded-md p-6 text-center">
              <p className="text-sm text-foreground/40">No hay turnos programados para los días {diaSeleccionado.toLowerCase()}.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clasesVisibles.map((item) => (
                <div key={item.idHorario} className="border border-border bg-foreground/5 p-4 transition-colors hover:bg-white/10">
                  <div className="text-lg font-bold text-accent">
                    {item.horaInicio ? item.horaInicio.slice(0, 5) : "00:00"} - {item.horaFin ? item.horaFin.slice(0, 5) : "00:00"} Hs
                  </div>
                  <div className="mt-1 font-bold text-foreground uppercase">{item.nombreClase || "Clase"}</div>
                  
                  {/* 🟢 Renderiza únicamente el nombre del profesor puro si existe en la base de datos */}
                  {item.nombreProfesor && (
                    <div className="mt-1 text-sm text-foreground/50">
                      {item.nombreProfesor}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECCIÓN CONTACTO */}
      <section id="contacto" className="py-12 bg-background text-foreground">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-bravos-green mb-8 uppercase">Encontranos</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Columna de info */}
            <div className="space-y-6">
              {direccion && (
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-bravos-green shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-base mb-1 uppercase">Dirección</h3>
                    <p className="text-muted-foreground">{direccion}</p>
                  </div>
                </div>
              )}
              {(horarioSemana || horarioSabado || horarioDomingo) && (
                <div className="flex items-start gap-4">
                  <Clock className="h-6 w-6 text-bravos-green shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-base mb-1 uppercase">Horarios</h3>
                    {horarioSemana && <p className="text-muted-foreground text-sm">{horarioSemana}</p>}
                    {horarioSabado && <p className="text-muted-foreground text-sm">{horarioSabado}</p>}
                    {horarioDomingo && <p className="text-muted-foreground text-sm">{horarioDomingo}</p>}
                  </div>
                </div>
              )}
              {telefono && (
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-bravos-green shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-base mb-1 uppercase">Teléfono / WhatsApp</h3>
                    <p className="text-muted-foreground">{telefono}</p>
                  </div>
                </div>
              )}
              {emailContacto && (
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-bravos-green shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-base mb-1 uppercase">Email</h3>
                    <p className="text-muted-foreground">{emailContacto}</p>
                  </div>
                </div>
              )}
              {instagram && (
                <div className="flex items-start gap-4">
                  <AtSign className="h-6 w-6 text-bravos-green shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-base mb-1 uppercase">Instagram</h3>
                    <p className="text-muted-foreground">@{instagram.replace(/^@/, '')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Columna de Mapa */}
            <div className="w-full h-[300px] rounded-xl overflow-hidden border border-border shadow-lg">
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
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-black py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <span className="text-lg font-black tracking-tight text-accent">Bravos Box</span>
            <p className="text-sm text-foreground/40">2026 Bravos Box. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage