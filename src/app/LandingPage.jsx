import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Menu,
  X,
  LogOut,
  Bell,
  Settings,
  User,
  Dumbbell,
  Shield,
  ClipboardCheck // 🟢 AGREGADO: Importación del ícono para evitar ReferenceError
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogoBoxBravos } from '@/components/logo-box-bravos'

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
  const [tituloAlign, setTituloAlign] = useState(null)
  const [logoTs, setLogoTs] = useState(Date.now())

  const useVectorLogo = !logoUrl || logoUrl.includes('logo-box-bravos-final.png')

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('avatarUrl') || '')
  
  const [permisos, setPermisos] = useState([])
  const [userData, setUserData] = useState({
    nombrecompleto: 'Usuario Bravos',
    correo: 'sin-correo@bravos.com',
    perfil: 'cliente',
    estado: 'activo'
  });

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
        if (data?.tituloHeroAlign) setTituloAlign(data.tituloHeroAlign)
        if (data?.heroImages) {
          const imagenesBackend = Object.values(data.heroImages).filter(Boolean)
          if (imagenesBackend.length > 0) {
            setHeroImages(imagenesBackend)
            return
          }
        }
        setHeroImages(defaultHeroImages)
      })
      .catch((err) => {
        console.error('Error al cargar config desde el admin:', err)
        if (isMounted) setHeroImages(defaultHeroImages)
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

  // Identificación de privilegios en el LocalStorage
  const tieneModulosAdmin = permisos.some(p => 
    p.startsWith('usuarios:') || p.startsWith('dashboard:') || 
    p.startsWith('perfiles:') || p.startsWith('membresias:') ||
    p.startsWith('clases:') || p.startsWith('reservas:') ||
    p.startsWith('creditos:') || p.startsWith('configuracion:')
  );
  
  const tieneModulosAlumno = permisos.some(p => p.startsWith('alumno'));
  const tieneModulosProfesor = permisos.some(p => p.startsWith('profesor')); // 🟢 CORREGIDO: Se quitó la tilde para unificar con el resto del archivo
  const puedeAccederPanel = permisos.length > 0 && userData.estado === 'activo';

  const getIniciales = (name) => {
    if (!name || name === 'Usuario Bravos') return 'UB'
    const parts = name.trim().split(' ')
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white selection:bg-emerald-500 selection:text-black">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="border-b border-white/10 bg-black/90 backdrop-blur-md">
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

              <nav className="hidden items-center gap-1 lg:flex">
                <Link to="/" className="px-4 py-2 text-sm font-semibold tracking-wide text-white/80 transition-colors hover:text-white">
                  INICIO
                </Link>

                {navigation.filter(item => item.name !== 'INICIO').map((item) => (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <a href={item.href} className="flex items-center gap-1 px-4 py-2 text-sm font-semibold tracking-wide text-white/80 transition-colors hover:text-white">
                      {item.name}
                      {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                    </a>

                    {item.hasDropdown && activeDropdown === item.name && (
                      <div className="absolute top-full left-0 w-48 border border-white/10 bg-black shadow-xl">
                        {item.items?.map((subItem) => (
                          <a key={subItem.name} href={subItem.href} className="block px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white">
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
                      <Button variant="ghost" className="text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white">
                        INGRESAR
                      </Button>
                    </Link>
                    <Link to="/registro">
                      <Button className="bg-accent px-6 text-sm font-bold text-accent-foreground hover:bg-accent/90">
                        UNIRSE
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-4 relative">
                    <button className="relative p-2 text-white/80 hover:text-white transition-colors">
                      <Bell className="h-5 w-5" />
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
                        3
                      </span>
                    </button>

                    <div className="relative">
                      <button 
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center gap-1 focus:outline-none"
                      >
                        <Avatar className="h-9 w-9 border border-green-600 bg-green-700 text-white">
                            <AvatarImage src={avatarUrl || null} alt={userData.nombrecompleto} />
                            <AvatarFallback className="bg-green-700 text-sm font-bold text-white tracking-wider uppercase">
                              {getIniciales(userData.nombrecompleto)}
                            </AvatarFallback>
                          </Avatar>
                        <ChevronDown className="h-4 w-4 text-white/60" />
                      </button>

                      {userMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                          <div className="absolute right-0 mt-3 w-64 rounded-md border border-zinc-800 bg-[#0c0c0e] shadow-2xl z-50 overflow-hidden">
                            <div className="border-b border-zinc-800 p-4">
                              <p className="text-sm font-bold text-white capitalize">{userData.nombrecompleto}</p>
                              <p className="text-xs text-zinc-400 truncate mt-0.5">{userData.correo}</p>
                            </div>

                            <div className="p-1">
                              <Link
                                to="/perfil"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-900 transition-colors"
                              >
                                <User className="h-4 w-4 text-zinc-400" />
                                <span>Mi Perfil</span>
                              </Link>

                              {/* ACCESO ADMIN: Condicional estricto */}
                              {tieneModulosAdmin && puedeAccederPanel && (
                                <Link
                                  to="/admin"
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-900 transition-colors"
                                >
                                  <Shield className="h-4 w-4 text-zinc-400" />
                                  <span>Panel de Control</span>
                                </Link>
                              )}
                              
                              {/* ACCESO ALUMNO: Condicional estricto */}
                              {tieneModulosAlumno && puedeAccederPanel && (
                                <Link
                                  to="/alumno"
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-900 transition-colors"
                                >
                                  <Dumbbell className="h-4 w-4 text-zinc-400" />
                                  <span>Panel de Alumno</span>
                                </Link>
                              )}

                              {/* 🟢 ACCESO PROFESOR: Inyectado dinámicamente con la estética de image_6a033d.png */}
                              {tieneModulosProfesor && puedeAccederPanel && (
                                <Link
                                  to="/profesor"
                                  onClick={() => setUserMenuOpen(false)}
                                  className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-900 transition-colors"
                                >
                                  <ClipboardCheck className="h-4 w-4 text-zinc-400" />
                                  <span>Panel de Profesor</span>
                                </Link>
                              )}

                              <button
                                onClick={() => {
                                  setUserMenuOpen(false)
                                  handleLogout()
                                }}
                                className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-red-500 hover:bg-red-950/20 transition-colors border-t border-zinc-800/60"
                              >
                                <LogOut className="h-4 w-4 text-red-500" />
                                <span className="font-medium">Cerrar Sesión</span>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button type="button" className="p-2 text-white lg:hidden" onClick={() => setMobileMenuOpen((previous) => !previous)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="border-b border-white/10 bg-black lg:hidden">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <a href={item.href} className="flex items-center justify-between py-3 text-sm font-semibold tracking-wide text-white/80 hover:text-white" onClick={() => !item.hasDropdown && setMobileMenuOpen(false)}>
                      {item.name}
                      {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                    </a>
                    {item.hasDropdown && (
                      <div className="ml-2 border-l border-white/10 pl-4">
                        {item.items?.map((subItem) => (
                          <a key={subItem.name} href={subItem.href} className="block py-2 text-sm text-white/60 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                            {subItem.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
                  {!isLoggedIn ? (
                    <>
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
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
                        <Button onClick={() => { setMobileMenuOpen(false); navigate('/admin'); }} variant="outline" className="w-full flex items-center justify-center gap-2 border-zinc-800 text-white hover:bg-white/5">
                          <Shield className="h-4 w-4 text-zinc-400" />
                          PANEL DE CONTROL
                        </Button>
                      )}
                      {tieneModulosAlumno && puedeAccederPanel && (
                        <Button onClick={() => { setMobileMenuOpen(false); navigate('/alumno'); }} variant="outline" className="w-full flex items-center justify-center gap-2 border-zinc-800 text-emerald-400 hover:bg-white/5">
                          <Dumbbell className="h-4 w-4 text-emerald-400" />
                          PANEL DE ALUMNO
                        </Button>
                      )}
                      {tieneModulosProfesor && puedeAccederPanel && (
                        <Button onClick={() => { setMobileMenuOpen(false); navigate('/profesor'); }} variant="outline" className="w-full flex items-center justify-center gap-2 border-zinc-800 text-violet-400 hover:bg-white/5">
                          <ClipboardCheck className="h-4 w-4 text-violet-400" />
                          PANEL DE PROFESOR
                        </Button>
                      )}
                      <Button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} variant="destructive" className="w-full flex items-center justify-center gap-2 font-bold bg-red-600 hover:bg-red-700 text-white">
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

      {/* SECCIÓN HERO */}
      <section className="relative flex min-h-screen items-end pb-16 sm:pb-24">
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
          <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
            <span>Argentina</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80">Formosa Capital</span>
          </div>

          <div className="mb-6 flex w-full max-w-[620px] flex-col items-start">
            <div className="flex w-full justify-start overflow-visible px-4 py-2 sm:px-6 sm:py-3">
              <div className="flex h-[120px] w-[360px] items-center justify-start overflow-hidden -ml-6 sm:-ml-8">
                {useVectorLogo ? (
                  <LogoBoxBravos className="block h-full w-full" width={360} height={104} />
                ) : (
                  <img src={`${logoUrl}${logoUrl.includes('?') ? '&' : '?'}t=${logoTs}`} alt="Box Bravos" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'left center' }} className="block" />
                )}
              </div>
            </div>
            <p className="mt-3 text-xl font-black tracking-wide text-white sm:text-2xl md:text-3xl" style={{ fontSize: tituloSize ? `${tituloSize}px` : undefined, fontFamily: tituloFont || undefined, textAlign: 'left' }}>
              {titulo}
            </p>
          </div>

          <button className="group mt-8 flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white">
            <span>MÁS INFO</span>
            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
          </button>
        </div>
      </section>

      {/* SECCIÓN FRASE MOTIVACIONAL */}
      <section className="bg-black py-20 md:py-32">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <blockquote className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            {'"EL ÚNICO ENTRENAMIENTO MALO'} <br />
            <span className="text-accent">{'ES EL QUE NO HICISTE"'}</span>
          </blockquote>
        </div>
      </section>

      {/* SECCIÓN SOBRE NOSOTROS */}
      <section id="nosotros" className="relative py-20 md:py-32">
        <div className="absolute inset-0">
          <img src="/gym-interior.jpg" alt="Interior del Box" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/80" />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">SOBRE <span className="text-accent">NOSOTROS</span></h2>
            <p className="mt-6 text-lg leading-relaxed text-white/70">Somos más que un gimnasio. Somos una comunidad de atletas comprometidos con la excelencia. Desde 2019, hemos ayudado a cientos de personas a transformar sus vidas a través del entrenamiento funcional.</p>
            <p className="mt-4 text-lg leading-relaxed text-white/70">Nuestro Box cuenta con equipamiento Rogue Fitness de primera línea y coaches certificados que te guiarán en cada paso de tu transformación.</p>
            <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[{ value: '500+', label: 'ATLETAS' }, { value: '15', label: 'COACHES' }, { value: '50+', label: 'CLASES/SEM' }, { value: '5', label: 'AÑOS' }].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-black text-accent sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-xs font-semibold tracking-wider text-white/50 sm:text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN CLASES */}
      <section id="clases" className="bg-zinc-950 py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">NUESTRAS <span className="text-accent">CLASES</span></h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[{ name: 'FUNCIONAL', image: '/hero-crossfit.jpg', description: 'Entrenamiento funcional de alta intensidad que combina levantamiento, cardio y gimnasia.', duration: '60 MIN', level: 'TODOS' },
              { name: 'WOD INTENSIVO', image: '/wod-training.jpg', description: 'Workout of the Day con ejercicios variados para maximizar rendimiento y resistencia.', duration: '45 MIN', level: 'INT/AVZ' },
              { name: 'OPEN BOX', image: '/gym-interior.jpg', description: 'Espacio libre para entrenar a tu ritmo con acceso a todo el equipamiento.', duration: '90 MIN', level: 'TODOS' }].map((clase) => (
              <div key={clase.name} className="group relative aspect-[4/5] cursor-pointer overflow-hidden">
                <img src={clase.image} alt={clase.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h3 className="text-2xl font-black text-white">{clase.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/70">{clase.description}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-semibold">
                    <span className="bg-accent px-2 py-1 text-accent-foreground">{clase.duration}</span>
                    <span className="text-white/60">{clase.level}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN HORARIOS */}
      <section id="horarios" className="relative py-20 md:py-32">
        <div className="absolute inset-0">
          <img src="/landing-hero-2.jpg" alt="Training" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/90" />
        </div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">HORARIOS <span className="text-accent">SEMANALES</span></h2>
          <p className="mb-10 max-w-2xl text-white/60">Contamos con clases de lunes a sábado. Elige el horario que mejor se adapte a tu rutina.</p>
          <div className="mb-8 flex flex-wrap gap-2">
            {['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'].map((day) => <button key={day} type="button" className="px-4 py-2 text-sm font-bold tracking-wide transition-colors bg-white/10 text-white/70 hover:bg-white/20 hover:text-white">{day}</button>)}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[{ hora: '06:00 - 07:00', clase: 'Funcional', coach: 'Carlos Martínez' }, { hora: '07:00 - 08:00', clase: 'WOD Intensivo', coach: 'Ana Rodríguez' }, { hora: '08:00 - 09:00', clase: 'Funcional', coach: 'Diego López' }, { hora: '09:00 - 10:30', clase: 'Open Box', coach: 'Staff' }, { hora: '17:00 - 18:00', clase: 'Funcional', coach: 'Carlos Martínez' }, { hora: '18:00 - 19:00', clase: 'WOD Intensivo', coach: 'Ana Rodríguez' }, { hora: '19:00 - 20:00', clase: 'Funcional', coach: 'Diego López' }].map((item) => (
              <div key={`${item.hora}-${item.clase}`} className="border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div className="text-lg font-bold text-accent">{item.hora}</div>
                <div className="mt-1 font-bold text-white">{item.clase}</div>
                <div className="mt-1 text-sm text-white/50">{item.coach}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECCIÓN CONTACTO */}
      <section id="contacto" className="bg-zinc-950 py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl"><span className="text-accent">ENCONTRANOS</span></h2>
          <div className="grid gap-12 md:grid-cols-2">
            <div className="flex items-start gap-4">
              <MapPin className="mt-1 h-6 w-6 flex-shrink-0 text-accent" />
              <div>
                <h3 className="text-lg font-bold text-white">DIRECCIÓN</h3>
                <p className="mt-1 text-white/60">Eva Perón 552</p>
                <p className="text-white/60">Formosa Capital, Argentina</p>
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-white/5 md:aspect-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="mx-auto mb-4 h-12 w-12 text-accent" />
                  <p className="text-white/60">Mapa interactivo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <span className="text-lg font-black tracking-tight text-accent">CROSSFIT BRAVOS</span>
            <p className="text-sm text-white/40">2026 CrossFit Bravos. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage;