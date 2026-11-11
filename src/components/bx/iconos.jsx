// Ícono del diseño del módulo Alumno. Los trazos están en trazos.js
// Dibuja un ícono a partir de su trazo (`d`). Decorativo: aria-hidden.
export function Ico({ d, size = 20, sw = 1.8, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className} style={style}>
      <path d={d} />
    </svg>
  )
}
