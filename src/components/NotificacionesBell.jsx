import { useEffect, useRef, useState } from 'react'
import { Bell, Calendar, CheckCheck, CreditCard, Dumbbell, Info, X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
import apiClient from '@/api'

const ICONOS_TIPO = {
  reserva: Calendar,
  asistencia: Dumbbell,
  credito: CreditCard,
  sistema: Info,
  exito: CheckCircle,
  error: AlertCircle,
  advertencia: AlertTriangle,
  info: Info,
}

const COLORES_TIPO = {
  reserva:     'text-lime-400',
  asistencia:  'text-blue-400',
  credito:     'text-yellow-400',
  sistema:     'text-muted-foreground',
  exito:       'text-lime-400',
  error:       'text-red-400',
  advertencia: 'text-yellow-400',
  info:        'text-blue-400',
}

const BG_POPUP = {
  exito:       'border-lime-400/30 bg-lime-400/5',
  error:       'border-red-400/30 bg-red-400/5',
  advertencia: 'border-yellow-400/30 bg-yellow-400/5',
  info:        'border-blue-400/30 bg-blue-400/5',
  reserva:     'border-lime-400/30 bg-lime-400/5',
  asistencia:  'border-blue-400/30 bg-blue-400/5',
  credito:     'border-yellow-400/30 bg-yellow-400/5',
  sistema:     'border-zinc-600/30 bg-muted',
}

function parsearFecha(raw) {
  if (!raw) return new Date()
  // MySQL manda "2026-08-25T03:00:00.000Z" o "2026-08-25 03:00:00" sin Z
  // Si no tiene Z ni offset lo tratamos como UTC agregando Z
  const s = String(raw).replace(' ', 'T')
  return new Date(s.endsWith('Z') || s.includes('+') ? s : s + 'Z')
}

function tiempoRelativo(raw) {
  const fecha = parsearFecha(raw)
  const diff = Date.now() - fecha.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min}m`
  const hs = Math.floor(min / 60)
  if (hs < 24) return `hace ${hs}h`
  return `hace ${Math.floor(hs / 24)}d`
}

function formatearFechaNotif(raw) {
  const fecha = parsearFecha(raw)
  const hoy = new Date()
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  if (fecha.toDateString() === hoy.toDateString()) return `Hoy ${hora}`
  if (fecha.toDateString() === ayer.toDateString()) return `Ayer ${hora}`
  return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) + ' ' + hora
}

export default function NotificacionesBell() {
  const [notifs, setNotifs] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [open, setOpen] = useState(false)
  const [popups, setPopups] = useState([])
  const ref = useRef(null)
  const prevNoLeidas = useRef(0)

  const cargar = () => {
    apiClient.get('/notificaciones')
      .then(res => {
        const data = res.data?.data || {}
        const lista = data.notificaciones || []
        const count = data.noLeidas || 0
        setNotifs(lista)
        setNoLeidas(count)
        // Mostrar popup si llegaron nuevas del backend
        if (count > prevNoLeidas.current && lista.length > 0) {
          const nueva = lista.find(n => !n.leida)
          if (nueva) showPopup(nueva)
        }
        prevNoLeidas.current = count
      })
      .catch(() => {})
  }

  const showPopup = (notif) => {
    const pid = Date.now()
    setPopups(prev => [...prev, { ...notif, pid }])
    setTimeout(() => setPopups(prev => prev.filter(p => p.pid !== pid)), 5000)
  }

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 30000)
    const onVisible = () => { if (!document.hidden) cargar() }
    document.addEventListener('visibilitychange', onVisible)

    // Escuchar eventos locales del sistema (toast.success, toast.error, etc.)
    const onNotif = (e) => {
      const { tipo, titulo, mensaje, id } = e.detail
      const nueva = { idNotificacion: id, tipo, titulo, mensaje, leida: 0, creadoEn: new Date().toISOString(), local: true }
      setNotifs(prev => [nueva, ...prev])
      setNoLeidas(prev => prev + 1)
      showPopup(nueva)
    }
    window.addEventListener('bravos:notif', onNotif)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('bravos:notif', onNotif)
    }
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const marcarLeida = (id, local) => {
    if (!local) apiClient.patch(`/notificaciones/${id}/leer`).catch(() => {})
    setNotifs(prev => prev.map(n => n.idNotificacion === id ? { ...n, leida: 1 } : n))
    setNoLeidas(prev => Math.max(0, prev - 1))
  }

  const marcarTodas = () => {
    apiClient.patch('/notificaciones/leer-todas').catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, leida: 1 })))
    setNoLeidas(0)
  }

  const dismissPopup = (pid) => setPopups(prev => prev.filter(p => p.pid !== pid))

  return (
    <>
      {/* Bell + Dropdown + Popups */}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="relative p-2 rounded-full hover:bg-muted transition-colors"
        >
          <Bell className={`h-5 w-5 transition-colors ${noLeidas > 0 ? 'text-lime-400' : 'text-muted-foreground'}`} />
          {noLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-lime-400 text-[10px] font-black text-black ring-2 ring-background">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>

        {/* Popups — salen desde la campanita, se apilan hacia abajo */}
        {popups.length > 0 && !open && (
          <div className="absolute right-0 mt-3 z-[100] flex flex-col gap-2 w-72">
            {popups.map(p => {
              const Icono = ICONOS_TIPO[p.tipo] || Info
              const color = COLORES_TIPO[p.tipo] || 'text-muted-foreground'
              const bg = BG_POPUP[p.tipo] || 'border-zinc-600/30 bg-muted'
              return (
                <div
                  key={p.pid}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-sm animate-in slide-in-from-top-2 fade-in duration-300 ${bg}`}
                >
                  <Icono className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground">{p.titulo}</p>
                    <p className="text-[11px] text-foreground/60 mt-0.5 leading-relaxed">{p.mensaje}</p>
                  </div>
                  <button onClick={() => dismissPopup(p.pid)} className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {open && (
          <div className="absolute right-0 mt-3 w-80 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold text-foreground uppercase tracking-wide">Notificaciones</span>
              {noLeidas > 0 && (
                <button onClick={marcarTodas} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-lime-400 transition-colors font-semibold">
                  <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">Sin notificaciones</p>
                </div>
              ) : (
                notifs.map(n => {
                  const Icono = ICONOS_TIPO[n.tipo] || Info
                  const color = COLORES_TIPO[n.tipo] || 'text-muted-foreground'
                  return (
                    <div
                      key={n.idNotificacion}
                      onClick={() => !n.leida && marcarLeida(n.idNotificacion, n.local)}
                      className={`flex gap-3 px-4 py-3 transition-colors ${n.leida ? 'opacity-40' : 'cursor-pointer hover:bg-muted'}`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 ${color}`}>
                        <Icono className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-bold text-foreground leading-tight">{n.titulo}</p>
                          {!n.leida && <span className="flex-shrink-0 mt-0.5 h-2 w-2 rounded-full bg-lime-400" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{n.mensaje}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatearFechaNotif(n.creadoEn)}
                          <span className="text-muted-foreground/40 ml-1">· {tiempoRelativo(n.creadoEn)}</span>
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
