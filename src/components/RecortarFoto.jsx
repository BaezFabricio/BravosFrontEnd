import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'

// Recorte manual de una foto a cuadrado (la proporción de las tarjetas de clases de la landing).
// La persona arrastra la foto para moverla y usa el zoom para acercarla. Lo que queda dentro del
// cuadro es lo que se guarda: se exporta un JPEG de 800 × 800.
const VISTA = 280   // lado del cuadro en pantalla (px)
const SALIDA = 800  // lado del archivo final (px)

const limitar = (p, zoom, dims) => {
  if (!dims) return p
  const escala = Math.max(VISTA / dims.w, VISTA / dims.h) * zoom
  const maxX = Math.max(0, (dims.w * escala - VISTA) / 2)
  const maxY = Math.max(0, (dims.h * escala - VISTA) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, p.x)),
    y: Math.min(maxY, Math.max(-maxY, p.y)),
  }
}

export default function RecortarFoto({ archivo, onAceptar, onCancelar }) {
  const url = useMemo(() => URL.createObjectURL(archivo), [archivo])
  useEffect(() => () => URL.revokeObjectURL(url), [url])

  const imgRef = useRef(null)
  const arrastre = useRef(null)
  const [dims, setDims] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [exportando, setExportando] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)

  // Esc cierra sin guardar
  useEffect(() => {
    const alTeclear = (e) => { if (e.key === 'Escape' && !exportando) onCancelar() }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [exportando, onCancelar])

  const p = limitar(pos, zoom, dims)
  const escala = dims ? Math.max(VISTA / dims.w, VISTA / dims.h) * zoom : 1
  const anchoMostrado = dims ? dims.w * escala : VISTA
  const altoMostrado = dims ? dims.h * escala : VISTA

  const alPresionar = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    arrastre.current = { x: e.clientX - p.x, y: e.clientY - p.y }
    setArrastrando(true)
  }
  const alMover = (e) => {
    if (!arrastre.current) return
    setPos(limitar({ x: e.clientX - arrastre.current.x, y: e.clientY - arrastre.current.y }, zoom, dims))
  }
  const alSoltar = () => { arrastre.current = null; setArrastrando(false) }

  const aceptar = () => {
    const img = imgRef.current
    if (!img || !dims) return
    setExportando(true)
    const canvas = document.createElement('canvas')
    canvas.width = SALIDA
    canvas.height = SALIDA
    const ctx = canvas.getContext('2d')
    // Zona de la foto original que queda dentro del cuadro
    const lado = VISTA / escala
    const sx = dims.w / 2 - lado / 2 - p.x / escala
    const sy = dims.h / 2 - lado / 2 - p.y / escala
    ctx.drawImage(img, sx, sy, lado, lado, 0, 0, SALIDA, SALIDA)
    canvas.toBlob((blob) => {
      if (blob) onAceptar(blob)
      else setExportando(false)
    }, 'image/jpeg', 0.9)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Ajustar la foto de la tarjeta">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Ajustá la foto</h2>
          <p className="mt-1 text-xs text-foreground/55">Arrastrá la foto para moverla y usá el zoom para acercarla. Lo que se ve dentro del cuadro es lo que se publica.</p>
        </div>

        <div className="mx-auto overflow-hidden rounded-xl border border-border bg-muted" style={{ width: VISTA, height: VISTA, maxWidth: '100%', touchAction: 'none', cursor: arrastrando ? 'grabbing' : 'grab' }}
          onPointerDown={alPresionar} onPointerMove={alMover} onPointerUp={alSoltar} onPointerCancel={alSoltar}>
          <div className="relative h-full w-full">
            <img
              ref={imgRef}
              src={url}
              alt=""
              draggable={false}
              onLoad={(e) => setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
              className="pointer-events-none absolute max-w-none select-none"
              style={{ width: anchoMostrado, height: altoMostrado, left: (VISTA - anchoMostrado) / 2 + p.x, top: (VISTA - altoMostrado) / 2 + p.y }}
            />
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="block text-[0.6875rem] font-black uppercase tracking-widest text-foreground/60">Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-lime-500" aria-label="Zoom de la foto" />
        </label>

        <div className="flex gap-2">
          <button type="button" onClick={onCancelar} disabled={exportando}
            className="min-h-[2.75rem] flex-1 rounded-xl border border-border px-4 text-sm font-bold text-foreground/80 transition-colors hover:bg-foreground/5 disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={aceptar} disabled={!dims || exportando}
            className="flex min-h-[2.75rem] flex-1 items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 text-sm font-black text-black transition-colors hover:bg-lime-300 disabled:opacity-50">
            {exportando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Usar esta foto
          </button>
        </div>
      </div>
    </div>
  )
}
