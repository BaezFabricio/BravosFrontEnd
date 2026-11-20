import { useEffect, useState } from 'react'
import { ETIQUETAS_HORARIO, MAX_RANGOS, NOMBRES_HORARIO, errorDeRangos, escribirHorario, estadoAhora, grupos, horaAMinutos, minutosAHora } from '@/lib/horarioAtencion'

const TEMA = {
  ink: 'var(--foreground)',
  muted: 'var(--muted-foreground)',
  line: 'var(--border)',
  card: 'var(--card)',
  campo: 'var(--input)',
  campoLinea: 'var(--input-line, var(--border))',
}

const RANGO_NUEVO = { desde: 6 * 60, hasta: 22 * 60 }

/*
 * Horarios de atención del box: por cada grupo de días se elige si abre o no y de qué hora a qué hora
 * (hasta dos horarios, por ejemplo mañana y tarde). Arriba dice si el box está abierto ahora mismo, con los horarios que se están editando.
 * "valores" son los tres textos guardados (lunes a viernes, sábado, domingo); "onChange(indice, texto)" entrega el texto nuevo
 * de un grupo ya revisado; "onValidez(true|false)" avisa si falta corregir algo antes de poder guardar.
 */
export default function EditorHorarios({ valores, onChange, onValidez, disabled = false, tema }) {
  const t = { ...TEMA, ...tema }
  const [g, setG] = useState(() => grupos(valores))
  const [ahora, setAhora] = useState(() => new Date())

  // El estado "abierto ahora" se renueva solo cada minuto
  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 60000)
    return () => clearInterval(reloj)
  }, [])

  const errores = g.map((x) => (x.abierto ? errorDeRangos(x.rangos) : ''))
  const hayError = errores.some(Boolean)
  useEffect(() => { onValidez?.(!hayError) }, [hayError]) // eslint-disable-line react-hooks/exhaustive-deps

  const cambiar = (i, siguiente) => {
    setG((prev) => prev.map((x, k) => (k === i ? siguiente : x)))
    const error = siguiente.abierto ? errorDeRangos(siguiente.rangos) : ''
    if (!error) onChange(i, escribirHorario(siguiente.etiqueta, siguiente.abierto ? siguiente.rangos : []))
  }

  const textosValidos = g.map((x, i) => escribirHorario(ETIQUETAS_HORARIO[i], x.abierto && !errores[i] ? x.rangos : []))
  const estado = estadoAhora(textosValidos, ahora)

  const campoHora = { height: 44, minWidth: 0, padding: '0 10px', borderRadius: 10, border: `1px solid ${t.campoLinea}`, background: t.campo, color: t.ink, font: '600 16px Archivo', colorScheme: 'inherit' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        role="status"
        style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 12, border: `1px solid ${t.line}`, background: t.card }}
      >
        <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: '50%', background: estado.abierto === null ? '#888' : estado.abierto ? '#9be600' : '#e5484d', boxShadow: estado.abierto ? '0 0 0 4px rgba(155,230,0,.22)' : 'none' }} />
        <span style={{ font: '800 14px Archivo', color: t.ink }}>
          {estado.abierto === null ? 'Sin horarios válidos' : `Ahora está ${estado.abierto ? 'abierto' : 'cerrado'}`}
        </span>
        {estado.detalle && <span style={{ font: '500 13px Archivo', color: t.muted }}>{estado.detalle}</span>}
        <span style={{ flexBasis: '100%', font: '500 12px/1.4 Archivo', color: t.muted }}>
          Así lo ve la gente en la web: el cartel “Abierto” o “Cerrado” sale de estos horarios.
        </span>
      </div>

      {g.map((x, i) => (
        <section key={x.etiqueta} aria-label={NOMBRES_HORARIO[i]} style={{ padding: '14px', borderRadius: 12, border: `1px solid ${errores[i] ? '#e5484d' : t.line}`, background: t.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ font: '800 15px Archivo', color: t.ink }}>{NOMBRES_HORARIO[i]}</span>
            <button
              type="button"
              role="switch"
              aria-checked={x.abierto}
              aria-label={`${NOMBRES_HORARIO[i]}: ${x.abierto ? 'abierto' : 'cerrado'}`}
              disabled={disabled}
              onClick={() => cambiar(i, { ...x, abierto: !x.abierto, rangos: !x.abierto && x.rangos.length === 0 ? [{ ...RANGO_NUEVO }] : x.rangos })}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 6px 0 12px', borderRadius: 22, border: `1px solid ${t.campoLinea}`, background: 'transparent', color: t.ink, font: '700 13px Archivo', cursor: disabled ? 'default' : 'pointer' }}
            >
              {x.abierto ? 'Abre' : 'Cerrado'}
              <span aria-hidden="true" style={{ position: 'relative', width: 44, height: 26, borderRadius: 13, background: x.abierto ? '#9be600' : 'rgba(128,128,128,.45)', transition: 'background .15s' }}>
                <span style={{ position: 'absolute', top: 3, left: x.abierto ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.4)', transition: 'left .15s' }} />
              </span>
            </button>
          </div>

          {x.abierto ? (
            <>
              {x.rangos.map((r, k) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {x.rangos.length > 1 && <span style={{ width: 62, font: '600 12px Archivo', color: t.muted }}>{k === 0 ? 'Primero' : 'Segundo'}</span>}
                  <input
                    type="time"
                    aria-label={`${NOMBRES_HORARIO[i]}, apertura${x.rangos.length > 1 ? ` del horario ${k + 1}` : ''}`}
                    disabled={disabled}
                    value={r.desde == null ? '' : minutosAHora(r.desde)}
                    onChange={(e) => cambiar(i, { ...x, rangos: x.rangos.map((q, j) => (j === k ? { ...q, desde: horaAMinutos(e.target.value) } : q)) })}
                    style={campoHora}
                  />
                  <span style={{ font: '600 14px Archivo', color: t.muted }}>a</span>
                  <input
                    type="time"
                    aria-label={`${NOMBRES_HORARIO[i]}, cierre${x.rangos.length > 1 ? ` del horario ${k + 1}` : ''}`}
                    disabled={disabled}
                    value={r.hasta == null ? '' : minutosAHora(r.hasta)}
                    onChange={(e) => cambiar(i, { ...x, rangos: x.rangos.map((q, j) => (j === k ? { ...q, hasta: horaAMinutos(e.target.value) } : q)) })}
                    style={campoHora}
                  />
                  {x.rangos.length > 1 && !disabled && (
                    <button type="button" aria-label={`Quitar el horario ${k + 1}`} onClick={() => cambiar(i, { ...x, rangos: x.rangos.filter((_, j) => j !== k) })} style={{ width: 44, height: 44, borderRadius: 10, border: `1px solid ${t.campoLinea}`, background: 'transparent', color: t.ink, font: '700 18px Archivo', cursor: 'pointer' }}>×</button>
                  )}
                </div>
              ))}
              {x.rangos.length < MAX_RANGOS && !disabled && (
                <button
                  type="button"
                  onClick={() => {
                    const ultimo = x.rangos[x.rangos.length - 1]
                    // Arranca una hora después de que cierra el anterior, para que no choquen
                    const desde = Math.min((ultimo?.hasta ?? 12 * 60) + 60, 23 * 60)
                    cambiar(i, { ...x, rangos: [...x.rangos, { desde, hasta: Math.min(desde + 120, 23 * 60 + 59) }] })
                  }}
                  style={{ alignSelf: 'flex-start', height: 38, padding: '0 12px', borderRadius: 8, border: `1px dashed ${t.campoLinea}`, background: 'transparent', color: t.ink, font: '700 12px Archivo', cursor: 'pointer' }}
                >
                  + Agregar otro horario (por ejemplo mañana y tarde)
                </button>
              )}
            </>
          ) : (
            <span style={{ font: '500 13px Archivo', color: t.muted }}>Ese día el box está cerrado.</span>
          )}
          {errores[i] && <span role="alert" style={{ font: '600 12px Archivo', color: '#e5484d' }}>{errores[i]}</span>}
        </section>
      ))}
    </div>
  )
}
