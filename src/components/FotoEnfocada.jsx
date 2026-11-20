import { useEffect, useRef, useState } from 'react'
import { leerFoco, posicionObjeto } from '@/lib/enfoqueFoto'

/*
 * Foto que llena su caja (como object-cover) pero deja el punto de interés en el medio.
 * Sin punto guardado queda centrada, igual que antes.
 */
export default function FotoEnfocada({ src, foco, alt = '', className = '', style, ...resto }) {
  const ref = useRef(null)
  const [natural, setNatural] = useState(null)
  const [caja, setCaja] = useState(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    if (el.complete && el.naturalWidth) setNatural({ w: el.naturalWidth, h: el.naturalHeight })
    if (typeof ResizeObserver === 'undefined') return undefined
    const observador = new ResizeObserver(([e]) => setCaja({ w: e.contentRect.width, h: e.contentRect.height }))
    observador.observe(el)
    return () => observador.disconnect()
  }, [src])

  const posicion = natural && caja && caja.w > 0 && caja.h > 0 ? posicionObjeto(leerFoco(foco), natural, caja) : '50% 50%'

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={`object-cover ${className}`}
      style={{ ...style, objectPosition: posicion }}
      onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      {...resto}
    />
  )
}
