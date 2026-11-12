import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Check, CalendarDays, Info } from 'lucide-react'
import apiClient from '@/api'
import ActivarNotificaciones from '@/components/ActivarNotificaciones'
import { parsearFecha, etiquetaDia } from '@/lib/fechasNotificaciones'

// Campanita de la portada (diseño "Bravos Landing"): panel de 420 px con las notificaciones del usuario.
// Usa los mismos datos que la campanita del panel (GET /notificaciones).

const ICONO_TIPO = { reserva: CalendarDays, exito: Check, asistencia: Check, sistema: Info, info: Info, advertencia: Info, error: Info, credito: Info }

// Hace cuánto llegó, en formato corto: "23 min", "5 h", "2 d"
function tiempoCorto(raw) {
  const min = Math.max(0, Math.floor((Date.now() - parsearFecha(raw).getTime()) / 60000))
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h`
  return `${Math.floor(h / 24)} d`
}

export default function CampanaPortada({ verTodasHref = null }) {
  const navigate = useNavigate()
  const [lista, setLista] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  const cargar = () => {
    apiClient.get('/notificaciones')
      .then((res) => {
        const data = res.data?.data || {}
        setLista(data.notificaciones || [])
        setNoLeidas(data.noLeidas || 0)
      })
      .catch(() => {})
  }

  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 30000)
    return () => clearInterval(intervalo)
  }, [])

  // Cierra al tocar afuera o con Esc
  useEffect(() => {
    if (!abierto) return
    const alTocar = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false) }
    const alTeclear = (e) => { if (e.key === 'Escape') setAbierto(false) }
    document.addEventListener('mousedown', alTocar)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('mousedown', alTocar)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  const marcarLeida = (n) => {
    if (n.leida) return
    apiClient.patch(`/notificaciones/${n.idNotificacion}/leer`).catch(() => {})
    setLista((prev) => prev.map((x) => (x.idNotificacion === n.idNotificacion ? { ...x, leida: 1 } : x)))
    setNoLeidas((prev) => Math.max(0, prev - 1))
  }

  const marcarTodas = () => {
    apiClient.patch('/notificaciones/leer-todas').catch(() => {})
    setLista((prev) => prev.map((x) => ({ ...x, leida: 1 })))
    setNoLeidas(0)
  }

  const abrirNotificacion = (n) => {
    marcarLeida(n)
    if (n.link) {
      setAbierto(false)
      navigate(n.link)
    }
  }

  // Agrupa en HOY y ANTERIORES
  const hoy = lista.filter((n) => etiquetaDia(n.creadoEn) === 'Hoy')
  const anteriores = lista.filter((n) => etiquetaDia(n.creadoEn) !== 'Hoy')

  const fila = (n) => {
    const Icono = ICONO_TIPO[n.tipo] || Bell
    return (
      <button
        key={n.idNotificacion}
        type="button"
        onClick={() => abrirNotificacion(n)}
        className={`flex w-full items-start gap-3 border-t border-[#1f1f1f] px-[1.125rem] py-3 text-left transition-colors hover:bg-[#1b1b1b] ${n.leida ? '' : 'bg-[#121a0a]'}`}
      >
        <span className={`grid h-[2.125rem] w-[2.125rem] shrink-0 place-items-center rounded-full ${n.leida ? 'bg-[#1d1d1d] text-[#c9ccbf]' : 'bg-[#1f2a0e] text-[#9be600]'}`}>
          <Icono className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className={`flex-1 text-sm leading-tight text-[#ecefe4] ${n.leida ? 'font-semibold' : 'font-extrabold'}`}>{n.titulo}</span>
            <span className="shrink-0 text-xs font-medium text-[#a3a698]">{tiempoCorto(n.creadoEn)}</span>
          </span>
          <span className="mt-[3px] block text-[0.8125rem] leading-snug text-[#a3a698]">{n.mensaje}</span>
        </span>
        <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.leida ? 'bg-transparent' : 'bg-[#9be600]'}`} />
      </button>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        aria-label={noLeidas ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'}
        className={`relative grid h-11 w-11 place-items-center rounded-[10px] text-[#ecefe4] transition-colors hover:bg-[#161616] focus-visible:outline-2 focus-visible:outline-[#9be600] ${abierto ? 'bg-[#1d1d1d]' : ''}`}
      >
        <Bell className="h-[22px] w-[22px]" aria-hidden="true" />
        {noLeidas > 0 && (
          <span className="absolute top-[5px] right-[3px] grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-[#0b0b0b] bg-[#9be600] px-1 text-[10px] font-extrabold leading-none text-[#0b0b0b]">
            {noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div role="dialog" aria-label="Notificaciones" className="absolute top-[calc(100%+12px)] right-0 z-50 w-[26.25rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#141414] shadow-[0_20px_50px_rgba(0,0,0,.55)]">
          <div className="flex items-center gap-2 border-b border-[#262626] py-3.5 pr-3 pl-[1.125rem]">
            <h2 className="m-0 flex-1 font-[Archivo]! text-base font-extrabold text-[#ecefe4]">Notificaciones</h2>
            <button
              type="button"
              onClick={marcarTodas}
              disabled={!noLeidas}
              className="h-9 rounded-lg px-2.5 text-[0.8125rem] font-bold text-[#9be600] transition-colors hover:bg-[#1d1d1d] disabled:text-[#6b6b6b] disabled:hover:bg-transparent"
            >
              Marcar todas como leídas
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {lista.length === 0 && <p className="m-0 px-[1.125rem] py-6 text-center text-sm text-[#a3a698]">No tenés notificaciones.</p>}
            {hoy.length > 0 && (
              <>
                <p className="m-0 px-[1.125rem] pt-3 pb-1 text-[0.6875rem] font-semibold tracking-[.1em] text-[#a3a698]">HOY</p>
                {hoy.map(fila)}
              </>
            )}
            {anteriores.length > 0 && (
              <>
                <p className="m-0 px-[1.125rem] pt-3 pb-1 text-[0.6875rem] font-semibold tracking-[.1em] text-[#a3a698]">ANTERIORES</p>
                {anteriores.map(fila)}
              </>
            )}
          </div>

          <div className="flex items-center gap-3 border-t border-[#262626] bg-[#101010] px-[1.125rem] py-3">
            <ActivarNotificaciones variante="pie" />
          </div>

          {verTodasHref && (
            <Link to={verTodasHref} onClick={() => setAbierto(false)} className="flex h-[2.875rem] items-center justify-center border-t border-[#262626] text-[0.8125rem] font-bold text-[#9be600] no-underline hover:bg-[#1d1d1d]">
              Ver todas
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
