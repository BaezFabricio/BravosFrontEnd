import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import { ICONOS_TIPO, TOAST_COLORES, campanita } from '@/lib/avisosEstilos'

/*
 * Avisos en pantalla para las páginas SIN campanita (login, registro, recuperar contraseña, verificar cuenta…).
 * Antes los mensajes de error ("Ese correo ya está en uso", "Verificá tu correo para iniciar sesión") no se veían ahí.
 * Dentro del panel los sigue dibujando la campanita; si hay una en pantalla, este componente no hace nada (no se duplican).
 */
export default function AvisosPublicos() {
  const [avisos, setAvisos] = useState([])

  useEffect(() => {
    const alRecibir = (e) => {
      if (campanita.montadas > 0) return
      const { tipo, titulo, mensaje } = e.detail || {}
      const pid = Date.now() + Math.random()
      const dur = tipo === 'error' || tipo === 'advertencia' ? 6000 : 3000
      setAvisos((prev) => [...prev.filter((a) => !(a.tipo === tipo && a.mensaje === mensaje)), { tipo, titulo, mensaje, pid }].slice(-3))
      setTimeout(() => setAvisos((prev) => prev.filter((a) => a.pid !== pid)), dur)
    }
    window.addEventListener('bravos:notif', alRecibir)
    return () => window.removeEventListener('bravos:notif', alRecibir)
  }, [])

  if (avisos.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[110] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      {avisos.map((a) => {
        const Icono = ICONOS_TIPO[a.tipo] || Info
        const col = TOAST_COLORES[a.tipo] || TOAST_COLORES.info
        const generico = ['Éxito', 'Error', 'Atención', 'Info'].includes(a.titulo)
        return (
          <div key={a.pid}
            className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border-2 px-4 py-3.5 shadow-[0_14px_36px_-8px_rgba(0,0,0,0.6)] animate-in slide-in-from-top-4 zoom-in-95 fade-in duration-300 ${col.caja}`}>
            <Icono className={`mt-0.5 h-5 w-5 flex-shrink-0 ${col.icono}`} />
            <p className="text-[13px] font-bold leading-snug">
              {!generico && <span className="font-black">{a.titulo}. </span>}{a.mensaje}
            </p>
          </div>
        )
      })}
    </div>
  )
}
