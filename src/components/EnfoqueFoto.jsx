import { useRef } from 'react'
import FotoEnfocada from '@/components/FotoEnfocada'
import { escribirFoco, leerFoco } from '@/lib/enfoqueFoto'

/*
 * Para acomodar una foto de la portada: se toca (o se arrastra) el punto que no se puede cortar,
 * por ejemplo la cara de las personas, y a la derecha se ve cómo queda en un celular.
 * "valor" es el texto "x,y" que se guarda (ver lib/enfoqueFoto).
 */
export default function EnfoqueFoto({ src, valor, onChange, disabled = false }) {
  const caja = useRef(null)
  const arrastrando = useRef(false)
  const foco = leerFoco(valor)

  const poner = (e) => {
    const r = caja.current?.getBoundingClientRect()
    if (!r || !r.width || !r.height) return
    onChange(escribirFoco({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }))
  }
  const alBajar = (e) => {
    if (disabled) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    arrastrando.current = true
    poner(e)
  }
  const alMover = (e) => { if (arrastrando.current && !disabled) poner(e) }
  const alSoltar = () => { arrastrando.current = false }
  const alTeclear = (e) => {
    if (disabled) return
    const paso = e.shiftKey ? 10 : 2
    const mov = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }[e.key]
    if (!mov) return
    e.preventDefault()
    onChange(escribirFoco({ x: foco.x + mov[0], y: foco.y + mov[1] }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
      <span style={{ font: '700 13px Archivo' }}>Acomodar la foto en el celular</span>
      <span style={{ font: '500 12px/1.4 Archivo', opacity: 0.7 }}>
        Tocá la foto donde están las personas. En el celular la portada se recorta, y así queda siempre en el medio.
      </span>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          ref={caja}
          role="group"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Punto de la foto: ${Math.round(foco.x)} % desde la izquierda y ${Math.round(foco.y)} % desde arriba. Usá las flechas para moverlo.`}
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onKeyDown={alTeclear}
          style={{ position: 'relative', flex: 1, minWidth: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(128,128,128,.45)', cursor: disabled ? 'default' : 'crosshair', touchAction: 'none', userSelect: 'none', lineHeight: 0 }}
        >
          <img src={src} alt="" draggable={false} style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }} />
          <span
            aria-hidden="true"
            style={{ position: 'absolute', left: `${foco.x}%`, top: `${foco.y}%`, width: 30, height: 30, marginLeft: -15, marginTop: -15, borderRadius: '50%', border: '3px solid #9be600', boxShadow: '0 0 0 2px rgba(0,0,0,.65), inset 0 0 0 2px rgba(0,0,0,.65)', pointerEvents: 'none' }}
          >
            <span style={{ position: 'absolute', left: '50%', top: '50%', width: 6, height: 6, marginLeft: -3, marginTop: -3, borderRadius: '50%', background: '#9be600', boxShadow: '0 0 0 1.5px rgba(0,0,0,.65)' }} />
          </span>
        </div>
        <div style={{ width: 92, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', aspectRatio: '9 / 14', borderRadius: 14, overflow: 'hidden', border: '2px solid rgba(128,128,128,.6)', background: '#0b0b0b' }}>
            <FotoEnfocada src={src} foco={valor} className="absolute inset-0 h-full w-full" />
          </div>
          <span style={{ font: '600 11px Archivo', opacity: 0.7 }}>Así se ve</span>
        </div>
      </div>
      {!disabled && (
        <button type="button" onClick={() => onChange('50,50')} style={{ alignSelf: 'flex-start', height: 34, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(128,128,128,.45)', background: 'transparent', color: 'inherit', font: '700 12px Archivo', cursor: 'pointer' }}>
          Centrar la foto
        </button>
      )}
    </div>
  )
}
