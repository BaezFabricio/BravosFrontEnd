import { useEffect, useState } from 'react'
import LandingPage from './LandingPage.jsx'
import LandingPageMovil from './LandingPageMovil.jsx'

// Celular: el landing anterior al rediseño (LandingPageMovil.jsx). Escritorio: el rediseño (LandingPage.jsx).
const CONSULTA_MOVIL = '(max-width: 767px)'

export default function LandingPageSegunPantalla() {
  const [movil, setMovil] = useState(() => window.matchMedia(CONSULTA_MOVIL).matches)

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_MOVIL)
    const alCambiar = () => setMovil(consulta.matches)
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [])

  return movil ? <LandingPageMovil /> : <LandingPage />
}
