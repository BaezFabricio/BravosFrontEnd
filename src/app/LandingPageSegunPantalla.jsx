import { useEffect, useLayoutEffect, useState } from 'react'
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

  // En escritorio la landing se agranda con la pantalla desde 1920 px (ver index.css, html.bv-landing)
  useLayoutEffect(() => {
    if (movil) return undefined
    document.documentElement.classList.add('bv-landing')
    return () => document.documentElement.classList.remove('bv-landing')
  }, [movil])

  return movil ? <LandingPageMovil /> : <LandingPage />
}
