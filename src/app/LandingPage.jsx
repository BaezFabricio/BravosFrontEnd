import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  MapPin,
  Menu,
  X,
  LogOut, // 👈 Sumamos el ícono de Cerrar Sesión
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

const heroImages = ['/landing-hero-1.jpg', '/landing-hero-2.jpg', '/landing-hero-3.jpg']

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  // ✨ NUEVO: Estado para verificar si existe sesión activa
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Verificamos si hay un token guardado en el navegador
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)

    const interval = setInterval(() => {
      setCurrentImageIndex((previousIndex) => (previousIndex + 1) % heroImages.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // ✨ NUEVO: Función para limpiar el token y reiniciar la vista
  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.reload() // Refresca instantáneamente para actualizar el Navbar
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

              {/* ✨ MODIFICADO: Botones Desktop Condicionales */}
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
                    className="flex items-center gap-2 font-bold px-5 bg-yellow-600 hover:bg-yellow-700 text-white"
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

                {/* ✨ MODIFICADO: Botones Mobile Condicionales */}
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
              alt="Entrenamiento funcional"
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
          <div className="mb-4 flex items-center gap-2 text-sm text-white/60">
            <span>Argentina</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-white/80">Formosa Capital</span>
          </div>

          <div className="mb-6 flex flex-col items-start">
            <p className="mb-2 text-xl font-black tracking-widest text-white sm:text-2xl md:text-3xl">
              A LOS
            </p>
            <img
              src="/logo-box-bravos-final.png"
              alt="Box Bravos"
              width="400"
              height="140"
              className="object-contain"
            />
            <p className="mt-2 text-xl font-black tracking-widest text-white sm:text-2xl md:text-3xl">
              DE MALVINAS
            </p>
          </div>

          <button className="group mt-8 flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white">
            <span>MAS INFO</span>
            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
          </button>
        </div>
      </section>

      <section className="bg-black py-20 md:py-32">
        <div className="container mx-auto px-4 text-center sm:px-6 lg:px-8">
          <blockquote className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
            {'"EL UNICO ENTRENAMIENTO MALO'}
            <br />
            <span className="text-accent">{'ES EL QUE NO HICISTE"'}</span>
          </blockquote>
        </div>
      </section>

      <section id="nosotros" className="relative py-20 md:py-32">
        <div className="absolute inset-0">
          <img src="/gym-interior.jpg" alt="Interior del Box" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/80" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              SOBRE <span className="text-accent">NOSOTROS</span>
            </h2>

            <p className="mt-6 text-lg leading-relaxed text-white/70">
              Somos mas que un gimnasio. Somos una comunidad de atletas comprometidos con la excelencia.
              Desde 2019, hemos ayudado a cientos de personas a transformar sus vidas a traves del entrenamiento funcional.
            </p>

            <p className="mt-4 text-lg leading-relaxed text-white/70">
              Nuestro Box cuenta con equipamiento Rogue Fitness de primera linea y coaches certificados
              que te guiaran en cada paso de tu transformacion.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
              {[
                { value: '500+', label: 'ATLETAS' },
                { value: '15', label: 'COACHES' },
                { value: '50+', label: 'CLASES/SEM' },
                { value: '5', label: 'ANOS' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-black text-accent sm:text-4xl">{stat.value}</div>
                  <div className="mt-1 text-xs font-semibold tracking-wider text-white/50 sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="clases" className="bg-zinc-950 py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            NUESTRAS <span className="text-accent">CLASES</span>
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'FUNCIONAL',
                image: '/hero-crossfit.jpg',
                description:
                  'Entrenamiento funcional de alta intensidad que combina levantamiento, cardio y gimnasia.',
                duration: '60 MIN',
                level: 'TODOS',
              },
              {
                name: 'WOD INTENSIVO',
                image: '/wod-training.jpg',
                description:
                  'Workout of the Day con ejercicios variados para maximizar rendimiento y resistencia.',
                duration: '45 MIN',
                level: 'INT/AVZ',
              },
              {
                name: 'OPEN BOX',
                image: '/gym-interior.jpg',
                description: 'Espacio libre para entrenar a tu ritmo con acceso a todo el equipamiento.',
                duration: '90 MIN',
                level: 'TODOS',
              },
            ].map((clase) => (
              <div key={clase.name} className="group relative aspect-[4/5] cursor-pointer overflow-hidden">
                <img
                  src={clase.image}
                  alt={clase.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
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

      <section id="horarios" className="relative py-20 md:py-32">
        <div className="absolute inset-0">
          <img src="/landing-hero-2.jpg" alt="Training" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/90" />
        </div>

        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            HORARIOS <span className="text-accent">SEMANALES</span>
          </h2>
          <p className="mb-10 max-w-2xl text-white/60">
            Contamos con clases de lunes a sabado. Elige el horario que mejor se adapte a tu rutina.
          </p>

          <div className="mb-8 flex flex-wrap gap-2">
            {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'].map((day, index) => (
              <button
                key={day}
                type="button"
                className={`px-4 py-2 text-sm font-bold tracking-wide transition-colors ${
                  index === 0
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { hora: '06:00 - 07:00', clase: 'Funcional', coach: 'Carlos Martinez' },
              { hora: '07:00 - 08:00', clase: 'WOD Intensivo', coach: 'Ana Rodriguez' },
              { hora: '08:00 - 09:00', clase: 'Funcional', coach: 'Diego Lopez' },
              { hora: '09:00 - 10:30', clase: 'Open Box', coach: 'Staff' },
              { hora: '17:00 - 18:00', clase: 'Funcional', coach: 'Carlos Martinez' },
              { hora: '18:00 - 19:00', clase: 'WOD Intensivo', coach: 'Ana Rodriguez' },
              { hora: '19:00 - 20:00', clase: 'Funcional', coach: 'Diego Lopez' },
              { hora: '20:00 - 21:00', clase: 'Funcional', coach: 'Carlos Martinez' },
              { hora: '21:00 - 22:30', clase: 'Open Box', coach: 'Staff' },
            ].map((item) => (
              <div
                key={`${item.hora}-${item.clase}`}
                className="border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
              >
                <div className="text-lg font-bold text-accent">{item.hora}</div>
                <div className="mt-1 font-bold text-white">{item.clase}</div>
                <div className="mt-1 text-sm text-white/50">{item.coach}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="border border-white/10 bg-white/5 p-6">
              <h3 className="mb-2 font-bold text-accent">HORARIO DE ATENCION</h3>
              <p className="text-sm text-white/70">Lunes a Viernes: 06:00 - 22:00</p>
              <p className="text-sm text-white/70">Sabados: 08:00 - 14:00</p>
              <p className="text-sm text-white/70">Domingos: Cerrado</p>
            </div>
            <div className="border border-white/10 bg-white/5 p-6">
              <h3 className="mb-2 font-bold text-accent">DURACION DE CLASES</h3>
              <p className="text-sm text-white/70">Funcional: 60 minutos</p>
              <p className="text-sm text-white/70">WOD Intensivo: 45 minutos</p>
              <p className="text-sm text-white/70">Open Box: 90 minutos</p>
            </div>
            <div className="border border-white/10 bg-white/5 p-6">
              <h3 className="mb-2 font-bold text-accent">CAPACIDAD</h3>
              <p className="text-sm text-white/70">Funcional: 15 personas</p>
              <p className="text-sm text-white/70">WOD Intensivo: 12 personas</p>
              <p className="text-sm text-white/70">Open Box: 20 personas</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-zinc-950 py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
            <span className="text-accent">ENCONTRANOS</span>
          </h2>

          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 h-6 w-6 flex-shrink-0 text-accent" />
                <div>
                  <h3 className="text-lg font-bold text-white">DIRECCION</h3>
                  <p className="mt-1 text-white/60">Eva Peron 552</p>
                  <p className="text-white/60">Formosa Capital, Argentina</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="mb-4 text-lg font-bold text-white">HORARIOS DE ATENCION</h3>
                <div className="space-y-2 text-white/60">
                  <p>Lunes a Viernes: 6:00 - 22:00</p>
                  <p>Sabados: 8:00 - 14:00</p>
                  <p>Domingos: Cerrado</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="mb-4 text-lg font-bold text-white">CONTACTO</h3>
                <div className="space-y-2 text-white/60">
                  <p>Tel: +54 11 1234-5678</p>
                  <p>Email: info@crossfitbravos.com</p>
                </div>
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

      <footer className="border-t border-white/10 bg-black py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Bravos Gym" width="40" height="40" className="rounded" />
              <span className="text-lg font-black tracking-tight text-accent">CROSSFIT BRAVOS</span>
            </div>

            <div className="flex items-center gap-4">
              <a href="#" className="p-2 text-white/50 transition-colors hover:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-[10px] font-black leading-none">
                  IG
                </span>
              </a>
              <a href="#" className="p-2 text-white/50 transition-colors hover:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-[10px] font-black leading-none">
                  FB
                </span>
              </a>
              <a href="#" className="p-2 text-white/50 transition-colors hover:text-white">
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/30 text-[10px] font-black leading-none">
                  YT
                </span>
              </a>
            </div>

            <p className="text-sm text-white/40">2024 CrossFit Bravos. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage