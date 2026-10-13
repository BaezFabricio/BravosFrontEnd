import { Cargando } from '@/components/Cargando'

// Se mantiene el nombre para las pantallas que ya lo usan, pero ahora es la animación de skeleton
export function GymLoader({ className = '' }) {
  return <Cargando filas={3} className={`w-full ${className}`} />
}
