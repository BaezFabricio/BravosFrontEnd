import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, Trash2, Info } from 'lucide-react'
import apiClient from '@/api'
import ActivarNotificaciones from '@/components/ActivarNotificaciones'
import { ICONOS_TIPO, TOAST_COLORES, campanita } from '@/lib/avisosEstilos'
import { parsearFecha, etiquetaDia, formatearFechaNotif } from '@/lib/fechasNotificaciones'
import { Ico } from '@/components/bx/iconos'
import { IC } from '@/components/bx/trazos'
import { PanelNotificaciones, AvisosAbajo } from '@/components/bx/PanelNotificaciones'
import PanelNotificacionesAdmin from '@/components/PanelNotificacionesAdmin'
import { useAnchoPanel } from '@/lib/useEscritorio'

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

/*
 * variante "bx": diseño del módulo Alumno en escritorio (handoff, pantalla 10). Misma lógica y mismos datos;
 * cambian la campanita, el panel y los avisos (abajo en el medio, 5 s).
 */
export default function NotificacionesBell({ variante } = {}) {
  const admin = variante === 'admin'
  const escritorioAdmin = useAnchoPanel() // en escritorio el admin usa la bandeja de la referencia 14
  const estiloAdmin = { width: '44px', height: '44px', borderRadius: '10px', border: '1px solid var(--sh-btn-line)', background: 'transparent', color: 'var(--sh-ink)' }
  const estiloBadgeAdmin = { minWidth: '20px', height: '20px', lineHeight: '16px', padding: '0px 5px', borderRadius: '10px', background: 'var(--sh-badge-bg)', color: 'var(--sh-badge-ink)', border: '2px solid var(--sh-badge-line)', font: '800 11px / 16px Archivo' }
  const bx = variante === 'bx' || variante === 'bxm' || admin // bxm: la del header del celular
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
  const showToast = ({ tipo, titulo, mensaje, link = null, idNotificacion = null, accion = null }) => {
    const pid = Date.now() + Math.random()
    const dur = bx || tipo === 'error' || tipo === 'advertencia' ? 5000 : link ? 5000 : 2800
    setToasts(prev => [...prev.filter(t => !(t.tipo === tipo && t.mensaje === mensaje && t.titulo === titulo)), { tipo, titulo, mensaje, link, idNotificacion, accion, pid }].slice(-3))
    setTimeout(() => setToasts(prev => prev.filter(t => t.pid !== pid)), dur)
  }

  useEffect(() => {
    cargar()
    const interval = setInterval(cargar, 30000)
    const onVisible = () => { if (!document.hidden) cargar() }
    document.addEventListener('visibilitychange', onVisible)

    // Escuchar eventos locales del sistema (toast.success, toast.error, etc.)
    const onNotif = (e) => {
      const { tipo, titulo, mensaje, guardar, enlace } = e.detail
      showToast({ tipo, titulo, mensaje, link: enlace?.to || null, accion: enlace?.texto || null })
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

  if (bx) {
    return (
      <>
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas > 9 ? '9 o más' : noLeidas} sin leer` : ''}`}
            aria-expanded={open}
            aria-controls="panel-notif"
            data-guia="campana"
            style={admin ? { ...estiloAdmin, ...(open ? { border: '1px solid var(--sh-accent)', background: 'var(--sh-active-bg)', color: 'var(--sh-accent)' } : null) } : undefined}
            className={variante === 'bxm'
              ? "relative grid h-11 w-11 place-items-center rounded-[0.625rem] text-bx-ink transition-[background-color,transform] duration-200 active:scale-90"
              : "relative grid h-11 w-11 place-items-center rounded-[0.625rem] border border-bx-btn-line bg-bx-card text-bx-ink transition-[background-color,transform] duration-200 hover:bg-bx-surf active:scale-95"}
          >
            <Ico d={IC.bell} size={variante === 'bxm' ? 22 : admin ? 19 : 20} />
            {noLeidas > 0 && (
              <span style={admin ? estiloBadgeAdmin : undefined} className={variante === 'bxm'
                ? "absolute right-1 top-1 h-[1.125rem] min-w-[1.125rem] rounded-[0.5625rem] bg-bx-lima px-1 text-center text-[0.625rem] font-extrabold leading-[1.125rem] text-bx-negro"
                : "absolute -right-1.5 -top-1.5 h-[1.375rem] min-w-[1.375rem] rounded-[0.6875rem] bg-bx-lima px-[0.3125rem] text-center text-[0.6875rem] font-extrabold leading-[1.375rem] text-bx-negro"}>
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>
          {open && admin && escritorioAdmin && (
            <PanelNotificacionesAdmin
              notifs={notifs}
              noLeidas={noLeidas}
              limpiando={limpiando}
              onClickNotif={handleClickNotif}
              onMarcarTodas={marcarTodas}
              onBorrarTodas={limpiar}
            />
          )}
          {open && !(admin && escritorioAdmin) && (
            <PanelNotificaciones
              notifs={notifs}
              noLeidas={noLeidas}
              limpiando={limpiando}
              onCerrar={() => setOpen(false)}
              onClickNotif={handleClickNotif}
              onMarcarTodas={marcarTodas}
              onBorrarTodas={limpiar}
            />
          )}
        </div>
        <AvisosAbajo toasts={toasts} onClick={handleClickToast} />
      </>
    )
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
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-lime-400 text-[0.625rem] font-black text-black ring-2 ring-background">
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
                  <button onClick={marcarTodas} className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground hover:text-lime-700 dark:hover:text-lime-400 transition-colors font-semibold">
                    <CheckCheck className="h-3.5 w-3.5" /> Marcar todas
                  </button>
                )}
                {notifs.length > 0 && (
                  <button onClick={limpiar} disabled={limpiando} className="flex items-center gap-1 text-[0.6875rem] text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors font-semibold">
                    <Trash2 className="h-3.5 w-3.5" /> Limpiar
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[26.25rem] overflow-y-auto divide-y divide-border">
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
                      <div className="sticky top-0 z-10 border-b border-border bg-muted/90 px-4 py-1.5 text-[0.625rem] font-black uppercase tracking-widest text-muted-foreground backdrop-blur">{dia}</div>
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
                        <p className="text-[0.6875rem] text-muted-foreground mt-0.5 leading-relaxed">{n.mensaje}</p>
                        <p className="text-[0.625rem] text-muted-foreground mt-1">
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
                className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border-2 px-4 py-3.5 shadow-[0_0.875rem_2.25rem_-0.5rem_rgba(0,0,0,0.6)] animate-in slide-in-from-top-4 zoom-in-95 fade-in duration-300 ${col.caja} ${t.link ? 'cursor-pointer' : ''}`}>
                <Icono className={`mt-0.5 h-5 w-5 flex-shrink-0 ${col.icono}`} />
                <p className="text-[0.8125rem] font-bold leading-snug">
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
