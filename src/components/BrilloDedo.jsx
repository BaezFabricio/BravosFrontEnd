import { useState } from 'react'

/*
 * Brillo verde que sigue al dedo por el menú de abajo (efecto agua). Al levantar el dedo se queda donde estaba
 * y se apaga ahí mismo: antes viajaba hasta el centro de la barra mientras se desvanecía, y se veía como un
 * puntito verde que se movía solo.
 */
export default function BrilloDedo({ dedo, tam = 56, rgb = '163,230,53', fuerte = 0.22, suave = 0.07, className = '' }) {
  const [ultimo, setUltimo] = useState(null)
  if (dedo && dedo !== ultimo) setUltimo(dedo)
  const pos = dedo || ultimo
  if (!pos) return null
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-0 rounded-full ${className}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: tam,
        height: tam,
        background: `radial-gradient(circle, rgba(${rgb},${fuerte}) 0%, rgba(${rgb},${suave}) 50%, transparent 72%)`,
        opacity: dedo ? 1 : 0,
        transform: `translate(-50%, -50%) scale(${dedo ? 1 : 0.8})`,
        transition: 'left 160ms cubic-bezier(.2,.8,.3,1), top 160ms cubic-bezier(.2,.8,.3,1), opacity 300ms ease-out, transform 300ms ease-out',
      }}
    />
  )
}
