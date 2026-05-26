import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Menu,
  X,
  LogOut,
} from 'lucide-react'

import { Button } from '@/components/ui/button'

const navigation = [
  {
    name: 'INICIO',
    href: '#',
    hasDropdown: false,
  },
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
  {
    name: 'HORARIOS',
    href: '#horarios',
    hasDropdown: false,
  },
  {
    name: 'NOSOTROS',
    href: '#nosotros',
    hasDropdown: false,
  },
  {
    name: 'CONTACTO',
    href: '#contacto',
    hasDropdown: false,
  },
]

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  
  // ESTADOS QUE SE CARGARÁN DESDE EL BACKEND
  const [heroImages, setHeroImages] = useState([])
  const [titulo, setTitulo] = useState("Centro de Entrenamiento")

  useEffect(() => {
    // 1. Gestión de sesión
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)

    // 2. Traer configuración desde el backend
    fetch('http://localhost:3001/landing/config')
      .then(res => res.json())
      .then(data => {
      if (data.tituloHero) setTitulo(data.tituloHero);
    
    // Esta es la parte que recibe el objeto de tu backend y lo convierte a lista
    if (data.heroImages) {
      setHeroImages(Object.values(data.heroImages));
    }
  })
      .catch(err => console.error("Error al cargar config desde el admin:", err))
  }, [])

  // 3. Intervalo del carrusel (depende de las imágenes cargadas)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((previousIndex) => (previousIndex + 1) % heroImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [heroImages])

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.reload()
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-black">
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="border-b border-white/10 bg-black">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link to="/inicio" className="flex items-center">
                <img
                  src="/logo-box-bravos-final.png"
                  alt="Box Bravos"
                  width="180"
                  height="60"
                  className="object-contain"
                />
              </Link>

              <nav className="hidden items-center gap-1 lg:flex">
                {navigation.map((item) => (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => item.hasDropdown && setActiveDropdown(item.name)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <a
                      href={item.href}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-semibold tracking-wide text-white/80 transition-colors hover:text-white"
                    >
                      {item.name}
                      {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                    </a>

                    {item.hasDropdown && activeDropdown === item.name && (
                      <div className="absolute top-full left-0 w-48 border border-white/10 bg-black shadow-xl">
                        {item.items?.map((subItem) => (
                          <a
                            key={subItem.name}
                            href={subItem.href}
                            className="block px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                          >
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
                      <Button
                        variant="ghost"
                        className="text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                      >
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
                  <Button 
                    onClick={handleLogout}
                    variant="destructive" 
                    className="flex items-center gap-2 font-bold px-5 bg-green-500 hover:bg-green-600 text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    CERRAR SESIÓN
                  </Button>
                )}
              </div>

              <button
                type="button"
                className="p-2 text-white lg:hidden"
                onClick={() => setMobileMenuOpen((previous) => !previous)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-b border-white/10 bg-black lg:hidden">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-1">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <a
                      href={item.href}
                      className="flex items-center justify-between py-3 text-sm font-semibold tracking-wide text-white/80 hover:text-white"
                      onClick={() => !item.hasDropdown && setMobileMenuOpen(false)}
                    >
                      {item.name}
                      {item.hasDropdown && <ChevronDown className="h-4 w-4" />}
                    </a>
                    {item.hasDropdown && (
                      <div className="ml-2 border-l border-white/10 pl-4">
                        {item.items?.map((subItem) => (
                          <a
                            key={subItem.name}
                            href={subItem.href}
                            className="block py-2 text-sm text-white/60 hover:text-white"
                            onClick={() => setMobileMenuOpen(false)}
                          >
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
                    <Button 
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      variant="destructive" 
                      className="w-full flex items-center justify-center gap-2 font-bold bg-red-600 hover:bg-red-700 text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      CERRAR SESIÓN
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <section className="relative flex min-h-screen items-end pb-16 sm:pb-24">
        {heroImages.map((imageSource, index) => (
          <div
            key={imageSource}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={imageSource}
              alt="Entrenamiento"
              className="h-full w-full object-cover"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
          </div>
        ))}

        <div className="absolute right-8 bottom-8 z-20 flex gap-2">
          {heroImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentImageIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentImageIndex ? 'w-6 bg-accent' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col items-start">
            <img
              src="/logo-box-bravos-final.png"
              alt="Box Bravos"
              width="400"
              height="140"
              className="object-contain"
            />
            <p className="mt-3 text-xl font-black tracking-wide text-white sm:text-2xl md:text-3xl">
              {titulo}
            </p>
          </div>
        </div>
      </section>

      {/* Resto del contenido omitido para brevedad, mantener igual ... */}
    </div>
  )
}

export default LandingPage
