import { useEffect } from "react"

const CHISPAS = Array.from({ length: 14 }, (_, i) => {
  const ang = (i / 14) * Math.PI * 2
  const dist = 90 + (i % 3) * 22
  return { x: Math.round(Math.cos(ang) * dist), y: Math.round(Math.sin(ang) * dist), d: (i % 5) * 60 }
})

/**
 * Celebración a pantalla completa al desbloquear un logro.
 * Recibe la cola de logros nuevos y los muestra de a uno.
 */
export default function LogroCelebracion({ logros, onCerrar }) {
  const logro = logros[0]

  useEffect(() => {
    if (!logro) return
    const t = setTimeout(onCerrar, 5500)
    return () => clearTimeout(t)
  }, [logro, onCerrar])

  if (!logro) return null
  const Icono = logro.icono

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      style={{ animation: "logroFade 0.35s ease-out both" }}
      onClick={onCerrar}
      role="dialog"
      aria-label="Logro desbloqueado"
    >
      <style>{`
        @keyframes logroFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes logroCard { 0% { transform: translateY(24px) scale(.9); opacity: 0 } 100% { transform: none; opacity: 1 } }
        @keyframes logroIcon { 0% { transform: scale(0) rotate(-25deg) } 55% { transform: scale(1.25) rotate(8deg) } 100% { transform: scale(1) rotate(0) } }
        @keyframes logroRing { 0% { transform: scale(.6); opacity: .8 } 100% { transform: scale(2.4); opacity: 0 } }
        @keyframes logroSpark { 0% { transform: translate(0,0) scale(0); opacity: 1 } 100% { transform: translate(var(--x), var(--y)) scale(1); opacity: 0 } }
        @keyframes logroText { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .logro-anim, .logro-anim * { animation-duration: .01s !important; animation-delay: 0s !important } }
      `}</style>

      <div
        className="logro-anim relative w-full max-w-sm bg-card border border-lime-400/40 rounded-2xl p-8 text-center shadow-[0_0_60px_rgba(163,230,53,0.25)]"
        style={{ animation: "logroCard 0.5s cubic-bezier(.2,.9,.3,1.2) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto h-24 w-24 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-2 border-lime-400" style={{ animation: "logroRing 1.4s ease-out 0.5s infinite" }} />
          <span className="absolute inset-0 rounded-full border-2 border-lime-400" style={{ animation: "logroRing 1.4s ease-out 1.2s infinite" }} />
          {CHISPAS.map((c, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 -ml-1 -mt-1 h-2 w-2 rounded-full bg-lime-400"
              style={{ "--x": `${c.x}px`, "--y": `${c.y}px`, animation: `logroSpark 1.1s ease-out ${0.45 + c.d / 1000}s both` }}
            />
          ))}
          <div
            className="relative h-24 w-24 rounded-2xl bg-lime-400 flex items-center justify-center"
            style={{ animation: "logroIcon 0.8s cubic-bezier(.2,.9,.3,1.3) 0.25s both" }}
          >
            <Icono className="h-12 w-12 text-black" />
          </div>
        </div>

        <p className="mt-6 text-[11px] font-black uppercase tracking-[0.25em] text-lime-700 dark:text-lime-400"
          style={{ animation: "logroText 0.5s ease-out 0.7s both" }}>
          ¡Logro desbloqueado!
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-foreground"
          style={{ animation: "logroText 0.5s ease-out 0.85s both" }}>
          {logro.nombre}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground" style={{ animation: "logroText 0.5s ease-out 1s both" }}>
          {logro.descripcion}
        </p>

        <button
          onClick={onCerrar}
          className="mt-6 px-6 py-2 bg-lime-400 hover:bg-lime-300 text-black text-xs font-black uppercase tracking-widest rounded-md transition-colors"
          style={{ animation: "logroText 0.5s ease-out 1.15s both" }}
        >
          {logros.length > 1 ? `Siguiente (${logros.length - 1} más)` : "¡Genial!"}
        </button>
      </div>
    </div>
  )
}
