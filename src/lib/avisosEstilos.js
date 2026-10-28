import { Calendar, CreditCard, Dumbbell, Info, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'

/*
 * Aspecto de los avisos que salen arriba en el medio (toast). Lo usan la campanita (dentro del panel, con sesión) y
 * AvisosPublicos (login, registro y demás páginas sin campanita).
 */
export const ICONOS_TIPO = {
  reserva: Calendar,
  asistencia: Dumbbell,
  credito: CreditCard,
  sistema: Info,
  exito: CheckCircle,
  error: AlertCircle,
  advertencia: AlertTriangle,
  info: Info,
}

export const TOAST_COLORES = {
  exito:       { caja: 'bg-lime-100 border-lime-500 text-lime-950 dark:bg-lime-950 dark:border-lime-400 dark:text-lime-50',             icono: 'text-lime-700 dark:text-lime-300' },
  error:       { caja: 'bg-red-100 border-red-500 text-red-950 dark:bg-red-950 dark:border-red-400 dark:text-red-50',                    icono: 'text-red-700 dark:text-red-300' },
  advertencia: { caja: 'bg-yellow-100 border-yellow-500 text-yellow-950 dark:bg-yellow-950 dark:border-yellow-400 dark:text-yellow-50',   icono: 'text-yellow-700 dark:text-yellow-300' },
  info:        { caja: 'bg-blue-100 border-blue-500 text-blue-950 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-50',               icono: 'text-blue-700 dark:text-blue-300' },
  reserva:     { caja: 'bg-lime-100 border-lime-500 text-lime-950 dark:bg-lime-950 dark:border-lime-400 dark:text-lime-50',             icono: 'text-lime-700 dark:text-lime-300' },
  asistencia:  { caja: 'bg-blue-100 border-blue-500 text-blue-950 dark:bg-blue-950 dark:border-blue-400 dark:text-blue-50',               icono: 'text-blue-700 dark:text-blue-300' },
  credito:     { caja: 'bg-yellow-100 border-yellow-500 text-yellow-950 dark:bg-yellow-950 dark:border-yellow-400 dark:text-yellow-50',   icono: 'text-yellow-700 dark:text-yellow-300' },
  sistema:     { caja: 'bg-zinc-100 border-zinc-400 text-zinc-950 dark:bg-zinc-900 dark:border-zinc-500 dark:text-zinc-50',               icono: 'text-zinc-600 dark:text-zinc-300' },
}

/*
 * Cuántas campanitas hay en pantalla. Los avisos los dibuja la campanita, pero solo existe dentro del panel; en las páginas
 * públicas (login, registro…) no hay ninguna y los avisos no se veían. Si no hay campanita, AvisosPublicos los dibuja.
 */
export const campanita = { montadas: 0 }
