import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Trash2, Info } from 'lucide-react'
import apiClient from '@/api'
import ActivarNotificaciones from '@/components/ActivarNotificaciones'
import { ICONOS_TIPO, TOAST_COLORES, campanita } from '@/lib/avisosEstilos'

const COLORES_TIPO = {
  reserva:     'text-lime-700 dark:text-lime-400',
  asistencia:  'text-blue-700 dark:text-blue-400',
  credito:     'text-yellow-700 dark:text-yellow-400',
  sistema:     'text-muted-foreground',
  exito:       'text-lime-700 dark:text-lime-400',
  error:       'text-red-700 dark:text-red-400',
  advertencia: 'text-yellow-700 dark:text-yellow-400',
  info:        'text-blue-700 dark:text-blue-400',
}

// Avisos de acciones del propio usuario: se muestran en el momento y además quedan en la bandeja
const TIPOS_DE_ACCION = ['exito', 'error', 'advertencia', 'info']

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

// Encabezado del grupo: "Hoy", "Ayer" o el día ("martes 6 de octubre"). Se usa el día en hora local.
function etiquetaDia(raw) {
  const fecha = parsearFecha(raw)
  const hoy = new Date()
  const ayer = new Date(); ayer.setDate(ayer.getDate() - 1)
  if (fecha.toDateString() === hoy.toDateString()) return 'Hoy'
  if (fecha.toDateString() === ayer.toDateString()) return 'Ayer'
  const texto = fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', ...(fecha.getFullYear() !== hoy.getFullYear() ? { year: 'numeric' } : {}) })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
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
  const navigate = useNavigate()
  const [notifs, setNotifs] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const [open, setOpen] = useState(false)
  const [limpiando, setLimpiando] = useState(false) // animación de salida al vaciar la bandeja
  const [toasts, setToasts] = useState([]) // avisos que salen arriba en el medio: de acciones y de notificaciones nuevas
  const ref = useRef(null)
  const prevNoLeidas = useRef(null)
  const vistas = useRef(null) // ids de notificaciones que ya conocemos: solo las que aparecen después salen como aviso

  const cargar = () => {
    apiClient.get('/notificaciones')
      .then(res => {
        const data = res.data?.data || {}
        const lista = data.notificaciones || []
        const count = data.noLeidas || 0
        setNotifs(lista)
        setNoLeidas(count)
        // Solo sale el aviso si llegó una notificación NUEVA (no en la carga inicial). Las de acciones propias
        // (éxito/error/advertencia/info) no: esas ya se mostraron en el momento.
        if (vistas.current !== null) {
          const nueva = lista.find(n => !n.leida && !vistas.current.has(n.idNotificacion) && !TIPOS_DE_ACCION.includes(n.tipo))
          if (nueva) showToast({ tipo: nueva.tipo, titulo: nueva.titulo, mensaje: nueva.mensaje, link: nueva.link, idNotificacion: nueva.idNotificacion })
        }
        vistas.current = new Set(lista.map(n => n.idNotificacion))
        prevNoLeidas.current = count
      })
      .catch(() => {})
  }

  // Todo aviso sale arriba en el medio: máximo 3 a la vez, uno igual al que ya está no se repite, y se van solos.
  // Los de notificaciones reales traen un link (al tocarlos abren esa pantalla).
  const showToast = ({ tipo, titulo, mensaje, link = null, idNotificacion = null }) => {
    const pid = Date.now() + Math.random()
    const dur = tipo === 'error' || tipo === 'advertencia' ? 5000 : link ? 5000 : 2800
    setToasts(prev => [...prev.filter(t => !(t.tipo === tipo && t.mensaje === mensaje && t.titulo === titulo)), { tipo, titulo, mensaje, link, idNotificacion, pid }].slice(-3))
    setTimeout(() => setToasts(prev => prev.filter(t => t.pid !== pid)), dur)
  }

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 30000)
    const onVisible = () => { if (!document.hidden) cargar() }
    document.addEventListener('visibilitychange', onVisible)

    // Escuchar eventos locales del sistema (toast.success, toast.error, etc.)
    const onNotif = (e) => {
      const { tipo, titulo, mensaje, guardar } = e.detail
      showToast({ tipo, titulo, mensaje })
      // Lo importante queda registrado en el historial de la campanita (en el servidor, como no leído: suma al contador, sin repetir el aviso)
      if (guardar) apiClient.post('/notificaciones/registro', { tipo, titulo, mensaje }).then(() => cargar()).catch(() => {})
    }
    window.addEventListener('bravos:notif', onNotif)
    campanita.montadas += 1

    return () => {
      campanita.montadas -= 1
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

  // Vacía la bandeja: borra todas las del usuario en el servidor (solo las propias)
  // Las notificaciones salen una tras otra (se deslizan y se desvanecen) y recién después se vacía la lista
  const limpiar = () => {
    if (limpiando) return
    setLimpiando(true)
    setToasts([])
    prevNoLeidas.current = 0
    const pedido = apiClient.delete('/notificaciones')
    const animacion = new Promise(r => setTimeout(r, Math.min(notifs.length, 8) * 60 + 380))
    Promise.allSettled([pedido, animacion]).then(([resultado]) => {
      setLimpiando(false)
      if (resultado.status === 'fulfilled') {
        setNotifs([])
        setNoLeidas(0)
      } else {
        cargar() // si el servidor no pudo borrarlas, se vuelven a mostrar tal como están
      }
    })
  }

  const dismissToast = (pid) => setToasts(prev => prev.filter(t => t.pid !== pid))

  const handleClickNotif = (n) => {
    if (!n.leida) marcarLeida(n.idNotificacion, n.local)
    if (n.link) {
      setOpen(false)
      navigate(n.link)
    }
  }

  const handleClickToast = (t) => {
    dismissToast(t.pid)
    if (t.idNotificacion) marcarLeida(t.idNotificacion, false)
    if (t.link) navigate(t.link)
  }

  return (
    <>
      {/* Campanita + bandeja */}
      <div className="relative" ref={ref}>
        <button
          data-guia="campana"
          onClick={() => setOpen(o => !o)}
          className="relative p-2 rounded-full hover:bg-muted transition-colors"
        >
          <Bell className={`h-5 w-5 transition-colors ${noLeidas > 0 ? 'text-lime-700 dark:text-lime-400' : 'text-muted-foreground'}`} />
          {noLeidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-lime-400 text-[10px] font-black text-black ring-2 ring-background">
              {noLeidas > 9 ? '9+' : noLeidas}
            </span>
          )}
        </button>


        {open && (
          <div className="fixed inset-x-3 top-[4.25rem] w-auto sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-3 sm:w-80 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold text-foreground uppercase tracking-wide">Notificaciones</span>
              <div className="flex items-center gap-3">
                {noLeidas > 0 && (
                  <button onClick={marcarTodas} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-lime-700 dark:hover:text-lime-400 transition-colors font-semibold">
                    <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
                  </button>
                )}
                {notifs.length > 0 && (
                  <button onClick={limpiar} disabled={limpiando} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors font-semibold">
                    <Trash2 className="h-3.5 w-3.5" /> Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-border">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground">Sin notificaciones</p>
                </div>
              ) : (
                notifs.map((n, idx) => {
                  const Icono = ICONOS_TIPO[n.tipo] || Info
                  const color = COLORES_TIPO[n.tipo] || 'text-muted-foreground'
                  const dia = etiquetaDia(n.creadoEn)
                  const nuevoDia = idx === 0 || dia !== etiquetaDia(notifs[idx - 1].creadoEn)
                  return (
                    <Fragment key={n.idNotificacion}>
                    {nuevoDia && (
                      <div className="sticky top-0 z-10 border-b border-border bg-muted/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground backdrop-blur">{dia}</div>
                    )}
                    <div
                      onClick={() => handleClickNotif(n)}
                      style={limpiando ? { transitionDelay: `${Math.min(idx, 8) * 60}ms` } : undefined}
                      className={`flex gap-3 px-4 py-3 transition-all duration-300 ease-in ${limpiando ? 'translate-x-12 opacity-0' : n.leida ? 'opacity-40' : 'cursor-pointer hover:bg-muted'} ${n.link && !n.leida ? 'group' : ''}`}
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
                    </Fragment>
                  )
                })
              )}
            </div>

            {/* Avisos en el celular (notificaciones push) para este dispositivo */}
            <ActivarNotificaciones />
          </div>
        )}
      </div>

      {/* Avisos arriba en el medio: de acciones y de notificaciones nuevas (todo queda en la bandeja) */}
      {toasts.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 top-[4.25rem] z-[110] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
          {toasts.map(t => {
            const Icono = ICONOS_TIPO[t.tipo] || Info
            const col = TOAST_COLORES[t.tipo] || TOAST_COLORES.info
            const generico = ['Éxito', 'Error', 'Atención', 'Info'].includes(t.titulo)
            return (
              <div key={t.pid} onClick={() => handleClickToast(t)}
                className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border-2 px-4 py-3.5 shadow-[0_14px_36px_-8px_rgba(0,0,0,0.6)] animate-in slide-in-from-top-4 zoom-in-95 fade-in duration-300 ${col.caja} ${t.link ? 'cursor-pointer' : ''}`}>
                <Icono className={`mt-0.5 h-5 w-5 flex-shrink-0 ${col.icono}`} />
                <p className="text-[13px] font-bold leading-snug">
                  {!generico && <span className="font-black">{t.titulo}. </span>}{t.mensaje}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
