import { useEffect, useState } from 'react'
import { Loader2, Save, Landmark, AlertCircle, Info, Check } from 'lucide-react'
import { toast } from '@/lib/notificar'
import { Cargando } from '@/components/Cargando'

// Datos de la cuenta del gimnasio para que los alumnos paguen por transferencia.
// Tienen su propia ruta en el servidor: se leen con sesión (ya no viajan en la web pública)
// y solo los guarda quien tiene permiso de modificar la configuración.
const VACIO = { bancoEntidad: '', titularCuenta: '', cuitTransferencia: '', cvuTransferencia: '', aliasTransferencia: '' }

// Mismas reglas que controla el servidor (todos opcionales, pero hace falta CBU/CVU o alias)
function validar(d) {
  const e = {}
  if (d.bancoEntidad.trim().length > 60) e.bancoEntidad = 'Hasta 60 caracteres'
  if (d.titularCuenta.trim().length > 100) e.titularCuenta = 'Hasta 100 caracteres'
  if (d.cuitTransferencia.trim() && !/^\d{2}-?\d{8}-?\d$/.test(d.cuitTransferencia.trim())) e.cuitTransferencia = '11 números, con o sin guiones'
  if (d.cvuTransferencia.trim() && !/^\d{22}$/.test(d.cvuTransferencia.trim())) e.cvuTransferencia = `Tiene que tener 22 números (tiene ${d.cvuTransferencia.trim().length})`
  if (d.aliasTransferencia.trim() && !/^[A-Za-z0-9.-]{6,20}$/.test(d.aliasTransferencia.trim())) e.aliasTransferencia = 'Entre 6 y 20 caracteres: letras, números, puntos o guiones'
  const algo = Object.values(d).some((v) => v.trim())
  if (algo && !d.cvuTransferencia.trim() && !d.aliasTransferencia.trim()) e.cvuTransferencia = 'Cargá el CBU/CVU o el alias'
  return e
}

const inputCls = (error) =>
  `h-12 w-full rounded-xl border ${error ? 'border-red-600/50 dark:border-red-500/50' : 'border-border'} bg-background/60 px-3.5 text-base font-semibold text-foreground placeholder:font-normal placeholder:text-foreground/35 outline-none transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-400/25 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm`

function Campo({ id, label, hint, error, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[0.6875rem] font-black uppercase tracking-widest text-foreground/55">{label}</label>
      {children}
      {error
        ? <p className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400"><AlertCircle className="h-3 w-3" /> {error}</p>
        : hint && <p className="text-xs text-foreground/50">{hint}</p>}
    </div>
  )
}

export default function DatosBancarios({ puedeModificar }) {
  const [datos, setDatos] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  // Si no se pudieron leer, no se muestra el formulario: guardarlo vacío borraría los datos reales
  const [fallo, setFallo] = useState(false)
  const [intento, setIntento] = useState(0)
  // Copia de lo guardado: sirve para saber si hay cambios sin guardar y para descartarlos
  const [base, setBase] = useState(null)

  useEffect(() => {
    fetch('/landing/banco')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((r) => { const d = { ...VACIO, ...(r.data || {}) }; setDatos(d); setBase(d); setFallo(false) })
      .catch(() => setFallo(true))
      .finally(() => setCargando(false))
  }, [intento])

  const cambiar = (campo, valor) => {
    setDatos((d) => ({ ...d, [campo]: valor }))
    setErrores((e) => (e[campo] ? { ...e, [campo]: undefined } : e))
  }

  const hayCambios = base !== null && Object.keys(VACIO).some((k) => datos[k] !== base[k])
  const descartar = () => { if (base) { setDatos(base); setErrores({}) } }

  const guardar = async (e) => {
    e.preventDefault()
    if (!puedeModificar) return
    const e2 = validar(datos)
    setErrores(e2)
    if (Object.keys(e2).length) return
    const limpio = Object.fromEntries(Object.entries(datos).map(([k, v]) => [k, v.trim()]))
    try {
      setGuardando(true)
      const res = await fetch('/landing/banco', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limpio),
      })
      const r = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (r.campo) setErrores({ [r.campo]: r.message })
        throw new Error(r.message || 'No se pudieron guardar los datos bancarios')
      }
      setDatos(limpio)
      setBase(limpio)
      toast.success('Datos bancarios guardados')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return <Cargando filas={2} className="py-2" />
  }

  if (fallo) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/5 px-6 py-8 text-center">
        <AlertCircle className="h-7 w-7 text-red-600 dark:text-red-400" aria-hidden="true" />
        <p className="text-sm text-foreground/75">No se pudieron cargar los datos bancarios. Para no borrarlos por error, no se pueden editar hasta que carguen.</p>
        <button type="button" onClick={() => { setCargando(true); setIntento((n) => n + 1) }}
          className="min-h-[2.75rem] rounded-xl border border-border px-5 text-xs font-black uppercase tracking-widest text-foreground/75 hover:border-foreground/30 hover:text-foreground">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={guardar} noValidate className="space-y-4 lg:flex lg:flex-col lg:min-h-[calc(var(--bv-vh,100dvh)-13.5rem)]">
      {/* ESCRITORIO: Datos bancarios como el prototipo de referencia */}
      <div className="hidden lg:grid lg:items-start" style={{ gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 20 }}>
        <section style={{ borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', padding: '22px 24px' }}>
          <h2 className="bv-admin-titulo" style={{ margin: 0, font: '800 17px Archivo' }}>Cuenta para transferencias</h2>
          <p style={{ margin: '4px 0 18px', font: '500 13px Archivo', color: 'var(--muted-foreground)' }}>Los alumnos la ven al pagar por transferencia.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {[
              { id: 'banco', label: 'Banco o billetera *', campo: 'bancoEntidad', ph: 'Ej: Banco Galicia', max: 60, err: errores.bancoEntidad },
              { id: 'titular', label: 'Titular de la cuenta *', campo: 'titularCuenta', ph: 'Ej: Bravos Fitness S.R.L.', max: 100, err: errores.titularCuenta },
              { id: 'cbu', label: 'CBU o CVU *', campo: 'cvuTransferencia', ph: '22 números', max: 22, err: errores.cvuTransferencia, mono: true, pista: `${datos.cvuTransferencia.length} de 22 números`, solo: /\D/g },
              { id: 'alias', label: 'Alias *', campo: 'aliasTransferencia', ph: 'BRAVOS.BOX.FSA', max: 20, err: errores.aliasTransferencia, pista: 'Entre 6 y 20 caracteres: letras, números, puntos o guiones.', solo: /\s/g },
              { id: 'cuit', label: 'CUIT (opcional)', campo: 'cuitTransferencia', ph: '30-71649283-9', max: 13, err: errores.cuitTransferencia, pista: '11 números. Los guiones se ponen solos.', solo: /[^\d-]/g },
            ].map((c) => (
              <div key={c.id}>
                <label htmlFor={`d-${c.id}`} style={{ display: 'block', marginBottom: 8, font: '700 11px Archivo', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>{c.label}</label>
                <input id={`d-${c.id}`} disabled={!puedeModificar} maxLength={c.max} value={datos[c.campo]} placeholder={c.ph}
                  onChange={(e) => cambiar(c.campo, c.solo ? e.target.value.replace(c.solo, '') : e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', height: 46, padding: '0px 14px', borderRadius: 10, border: `1px solid ${c.err ? 'var(--destructive)' : 'var(--input-line)'}`, background: 'var(--input)', color: 'var(--foreground)', font: c.mono ? '500 15px ui-monospace, monospace' : '500 15px Archivo', letterSpacing: c.mono ? '0.05em' : undefined }} />
                {c.err ? <p style={{ margin: '6px 0 0', font: '500 12px Archivo', color: 'var(--destructive)' }}>{c.err}</p> : c.pista && <p style={{ margin: '6px 0 0', font: '500 12px Archivo', color: 'var(--muted-foreground)' }}>{c.pista}</p>}
              </div>
            ))}
          </div>
        </section>

        <aside aria-label="Así lo ven los alumnos" style={{ borderRadius: 16, background: 'var(--card)', border: '1px solid var(--border)', padding: '20px 22px' }}>
          <div style={{ font: '700 11px Archivo', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-foreground)' }}>Así lo ven los alumnos</div>
          <div style={{ marginTop: 14, borderRadius: 12, border: '1px solid var(--border)', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ font: '500 12px Archivo', color: 'var(--muted-foreground)' }}>Banco o billetera</div>
              <div style={{ font: '700 15px Archivo' }}>{datos.bancoEntidad || 'Sin cargar'}</div>
            </div>
            <div>
              <div style={{ font: '500 12px Archivo', color: 'var(--muted-foreground)' }}>Titular</div>
              <div style={{ font: '700 15px Archivo' }}>{[datos.titularCuenta, datos.cuitTransferencia && `CUIT ${datos.cuitTransferencia}`].filter(Boolean).join(' · ') || 'Sin cargar'}</div>
            </div>
            <div>
              <div style={{ font: '500 12px Archivo', color: 'var(--muted-foreground)' }}>CBU / CVU</div>
              <div style={{ font: '600 14px ui-monospace, monospace', color: datos.cvuTransferencia ? 'var(--foreground)' : 'var(--sh-warn)' }}>{datos.cvuTransferencia || 'Sin cargar'}</div>
            </div>
            <div>
              <div style={{ font: '500 12px Archivo', color: 'var(--muted-foreground)' }}>Alias</div>
              <div style={{ font: '700 15px Archivo' }}>{datos.aliasTransferencia || 'Sin cargar'}</div>
            </div>
          </div>
          <p style={{ margin: '14px 0 0', display: 'flex', alignItems: 'flex-start', gap: 8, font: '500 13px / 1.5 Archivo', color: 'var(--muted-foreground)' }}>
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Revisalo bien: es la cuenta a la que transfieren los alumnos. Si borrás un dato, deja de mostrarse.
          </p>
        </aside>
      </div>

      {/* Escritorio: barra de abajo como la referencia */}
      <div style={{ marginTop: 'auto' }} className="hidden lg:flex sticky bottom-0 z-10 items-center justify-between gap-4 border-t border-border bg-background/95 py-4 backdrop-blur lg:pr-24 lg:-mb-[48px] lg:-ml-[22rem] lg:-mr-8 lg:pl-8">
        <span className="text-sm font-semibold text-muted-foreground">{guardando ? 'Guardando…' : hayCambios ? 'Cambios sin guardar' : 'Todo guardado'}</span>
        <div className="flex gap-3">
          <button type="button" onClick={descartar} disabled={guardando}
            className="inline-flex h-[46px] items-center rounded-[10px] border border-border px-5 text-[14px] font-bold text-foreground transition-colors hover:bg-[rgba(128,128,128,.14)] disabled:opacity-50">
            Descartar cambios
          </button>
          {puedeModificar && (
            <button type="submit" disabled={guardando || !hayCambios}
              className="flex h-[46px] items-center justify-center gap-2 rounded-[10px] px-6 text-[13px] font-black uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-60 bg-lime-400 text-black hover:bg-lime-300 disabled:bg-[rgba(128,128,128,.22)] disabled:text-muted-foreground">
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          )}
        </div>
      </div>

      {/* Celular y tableta: como antes */}
      <div className="lg:hidden space-y-4">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400/15 text-lime-700 dark:text-lime-400">
            <Landmark className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Datos bancarios</h2>
            <p className="text-xs text-foreground/55">Los ven los alumnos al pagar por transferencia.</p>
          </div>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-2">
          <Campo id="banco" label="Banco o billetera" error={errores.bancoEntidad}>
            <input id="banco" disabled={!puedeModificar} maxLength={60} value={datos.bancoEntidad} onChange={(e) => cambiar('bancoEntidad', e.target.value)}
              placeholder="Ej: Banco Galicia" className={inputCls(errores.bancoEntidad)} />
          </Campo>
          <Campo id="titular" label="Titular de la cuenta" error={errores.titularCuenta}>
            <input id="titular" disabled={!puedeModificar} maxLength={100} value={datos.titularCuenta} onChange={(e) => cambiar('titularCuenta', e.target.value)}
              placeholder="Ej: Bravos Fitness S.R.L." className={inputCls(errores.titularCuenta)} />
          </Campo>
          <Campo id="cbu" label="CBU o CVU" hint="22 números, sin espacios." error={errores.cvuTransferencia}>
            <input id="cbu" disabled={!puedeModificar} inputMode="numeric" maxLength={22} value={datos.cvuTransferencia}
              onChange={(e) => cambiar('cvuTransferencia', e.target.value.replace(/\D/g, ''))}
              placeholder="0000003100012345678901" className={`${inputCls(errores.cvuTransferencia)} font-mono tracking-wide`} />
          </Campo>
          <Campo id="alias" label="Alias" error={errores.aliasTransferencia}>
            <input id="alias" disabled={!puedeModificar} maxLength={20} value={datos.aliasTransferencia}
              onChange={(e) => cambiar('aliasTransferencia', e.target.value.replace(/\s/g, ''))}
              placeholder="BRAVOS.BOX.FSA" className={inputCls(errores.aliasTransferencia)} />
          </Campo>
          <Campo id="cuit" label="CUIT" hint="Opcional. 11 números, con o sin guiones." error={errores.cuitTransferencia}>
            <input id="cuit" disabled={!puedeModificar} inputMode="numeric" maxLength={13} value={datos.cuitTransferencia}
              onChange={(e) => cambiar('cuitTransferencia', e.target.value.replace(/[^\d-]/g, ''))}
              placeholder="30-71649283-9" className={inputCls(errores.cuitTransferencia)} />
          </Campo>
        </div>

        <p className="mx-4 mb-4 flex items-start gap-2 rounded-xl border border-border bg-background/50 px-3 py-2.5 text-xs text-foreground/60">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Revisalos bien antes de guardar: es la cuenta a la que los alumnos van a transferir. Si borrás un dato, deja de mostrarse.
        </p>
      </section>

      {puedeModificar && (
        <div className="flex justify-end">
          <button type="submit" disabled={guardando}
            className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-lime-300 disabled:opacity-50 sm:w-auto">
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {guardando ? 'Guardando…' : 'Guardar datos bancarios'}
          </button>
        </div>
      )}
      </div>
    </form>
  )
}
