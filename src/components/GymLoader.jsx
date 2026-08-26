export function GymLoader({ text = 'Cargando...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <img
        src="/gym-loader.gif.gif"
        alt="Cargando..."
        className="w-24 h-auto"
        style={{ imageRendering: 'pixelated' }}
      />
      {text && (
        <p className="text-xs font-bold tracking-widest uppercase animate-pulse"
           style={{ color: '#d4a017', letterSpacing: '0.18em' }}>
          {text}
        </p>
      )}
    </div>
  )
}
