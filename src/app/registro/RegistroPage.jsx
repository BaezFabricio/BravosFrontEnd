import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, CreditCard, Eye, EyeOff, Lock, Mail, Phone, User, XCircle } from 'lucide-react'
import { registroUsuario, reenviarVerificacionCuenta } from '@/api'
import { toast } from '@/lib/notificar'
import { useEscritorio } from '@/lib/useEscritorio'
import PantallaEstado from '@/components/acceso/PantallaEstado'
import { ESTILOS_MOVIL, FICHA_FLOTANTE } from '@/lib/estilosMovil'

const PASSWORD_RULES = [
  { id: 'len',   label: 'Mínimo 8 caracteres',      test: (p) => p.length >= 8 },
  { id: 'upper', label: 'Una letra mayúscula (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Una letra minúscula (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'num',   label: 'Un número (0-9)',           test: (p) => /[0-9]/.test(p) },
]

function validateField(field, value, formData) {
  switch (field) {
    case 'nombre':
      return value.trim() ? '' : 'El nombre es requerido'
    case 'dni':
      if (!value.trim()) return 'El DNI es requerido'
      if (!/^\d{7,8}$/.test(value)) return 'DNI inválido (7-8 dígitos)'
      return ''
    case 'email':
      if (!value) return 'El correo es requerido'
      if (!/\S+@\S+\.\S+/.test(value)) return 'Ingresá un email válido'
      return ''
    case 'telefono':
      if (!value.trim()) return 'El teléfono es requerido'
      if (!/^\d{10,15}$/.test(value.replace(/\D/g, ''))) return 'Teléfono inválido'
      return ''
    case 'password':
      if (!value) return 'La contraseña es requerida'
      if (PASSWORD_RULES.some(r => !r.test(value))) return 'La contraseña no cumple los requisitos'
      return ''
    case 'confirmPassword':
      if (!value) return 'Confirmá tu contraseña'
      if (value !== formData.password) return 'Las contraseñas no coinciden'
      return ''
    default:
      return ''
  }
}

// Estilos de la pantalla de escritorio, acotados a ella
const ESTILOS_REF = `
.lr a{color:#9be600}.lr a:hover{color:#c4ff3d}
.lr input::placeholder{color:#6b705e}.lr input:focus{outline:none}
.lr button.pri:hover{background:#c4ff3d!important}
.lr .campo{width:100%;height:calc(38 * var(--u));padding:0 calc(36 * var(--u)) 0 calc(40 * var(--u));background:rgba(255,255,255,.04);border:calc(1 * var(--u)) solid #3a3d32;border-radius:calc(8 * var(--u));color:#ecefe4;font:500 calc(16 * var(--u)) Barlow,Archivo,sans-serif;transition:border-color .15s,box-shadow .15s}
.lr .campo:focus{border-color:#9be600;box-shadow:0 0 0 calc(2 * var(--u)) rgba(155,230,0,.25)}
.lr .campo.ok{border-color:rgba(155,230,0,.5)}
.lr .campo.error{border-color:#ff6b4a}
.lr button.ojo:hover{background:transparent!important;color:#ecefe4!important}
.lr .ficha-flota{transition:transform .25s ease-out;will-change:transform;transform:translateY(-4px)}
.lr .ficha-flota:hover{transition:transform .08s linear}
@media (prefers-reduced-motion: reduce){.lr .ficha-flota{transition:none}}
@keyframes lr-in{from{opacity:0}to{opacity:1}}
@keyframes lr-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(-4px)}}
.lr{animation:lr-in .4s ease both}
.lr.sale{opacity:0;transition:opacity .22s ease}
.lr .ficha-flota{animation:lr-up .5s cubic-bezier(.22,1,.36,1) .05s backwards}
@media (prefers-reduced-motion: reduce){.lr,.lr .ficha-flota{animation:none}.lr.sale{transition:none}}
`

function RegistroPage() {
  const escritorio = useEscritorio()
  // Al pasar al login: la pantalla se desvanece y recién ahí navega (el login entra con su propia animación)
  const [saliendo, setSaliendo] = useState(false)
  const irA = (destino) => (e) => {
    e.preventDefault()
    setSaliendo(true)
    setTimeout(() => navigate(destino), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220)
  }
  const fichaRef = useRef(null)
  // En celular, al abrir el registro se baja solo hasta el formulario (la foto de arriba queda como encabezado).
  // Se hace siempre, aunque la página venga con scroll de la pantalla anterior (el login en celulares chicos).
  useEffect(() => {
    if (escritorio) return
    const ir = () => {
      const el = fichaRef.current
      if (!el) return
      const arriba = el.getBoundingClientRect().top + window.scrollY - 96 // deja a la vista al perro que asoma sobre la ficha
      const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: Math.max(0, arriba), behavior: sinMovimiento ? 'auto' : 'smooth' })
    }
    const t1 = setTimeout(ir, 450)
    // Segundo intento por si las fuentes o las imágenes movieron el diseño después del primero
    const t2 = setTimeout(() => {
      const el = fichaRef.current
      if (el && Math.abs(el.getBoundingClientRect().top - 96) > 24) ir()
    }, 1300)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [escritorio])
  // Efecto flotante: la ficha se inclina un poco hacia donde está el cursor
  const inclinar = (e) => {
    const el = fichaRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1100px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`
  }
  const soltar = () => { if (fichaRef.current) fichaRef.current.style.transform = '' }
  const navigate = useNavigate()
  // "Volver al sitio" lleva siempre a la página principal (no al login, que es la pantalla hermana)
  const volver = () => navigate("/inicio")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [touched, setTouched] = useState({})

  const [usuarioId, setUsuarioId] = useState(null)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [newEmailInput, setNewEmailInput] = useState('')
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [espera, setEspera] = useState(0)
  const [reenvio, setReenvio] = useState(null)

  // Cuenta regresiva para no poder pedir el enlace muchas veces seguidas
  useEffect(() => {
    if (espera <= 0) return undefined
    const t = setTimeout(() => setEspera((e) => e - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  const handleReenviar = async () => {
    if (espera > 0) return
    setEspera(60)
    setReenvio(null)
    try {
      await reenviarVerificacionCuenta({ correo: formData.email.trim().toLowerCase() })
      setReenvio('ok')
    } catch {
      setReenvio('error')
    }
  }

  const [formData, setFormData] = useState({
    nombre: '', dni: '', email: '', telefono: '', password: '', confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [errorTerminos, setErrorTerminos] = useState('')

  const set = (field) => (e) => {
    const value = e.target.value
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      if (touched[field]) {
        setErrors(errs => ({ ...errs, [field]: validateField(field, value, next) }))
      }
      // revalidar confirmPassword si cambia la password
      if (field === 'password' && touched.confirmPassword) {
        setErrors(errs => ({ ...errs, confirmPassword: validateField('confirmPassword', next.confirmPassword, next) }))
      }
      return next
    })
  }

  const onBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(prev => ({ ...prev, [field]: validateField(field, formData[field], formData) }))
  }

  // Mensaje de error de un campo (solo después de que la persona lo tocó)
  const error = (field) => (touched[field] ? errors[field] : '')
  // Campo correcto: ya lo tocó, no tiene error y no está vacío
  const valido = (field) => !!touched[field] && !errors[field] && !!formData[field]

  const handleSubmit = async (event) => {
    event.preventDefault()
    // Marcar todos como tocados y validar
    const allTouched = Object.fromEntries(Object.keys(formData).map(k => [k, true]))
    setTouched(allTouched)
    const newErrors = Object.fromEntries(
      Object.keys(formData).map(k => [k, validateField(k, formData[k], formData)])
    )
    setErrors(newErrors)
    if (!aceptaTerminos) setErrorTerminos('Tenés que aceptar los términos y la política de privacidad')
    if (Object.values(newErrors).some(Boolean) || !aceptaTerminos) return

    setIsLoading(true)
    try {
      const response = await registroUsuario({
        nombrecompleto: formData.nombre,
        dni: formData.dni,
        correo: formData.email,
        telefono: formData.telefono,
        username: formData.email,
        password: formData.password,
        aceptaTerminos: true,
      })
      const idAsignado = response?.data?.usuario?.idUsuario || response?.usuario?.idUsuario || response?.idUsuario
      setUsuarioId(idAsignado)
      setIsSuccess(true)
    } catch (err) {
      console.error('Error al registrar:', err)
      toast.error("Error al registrar", { description: err.response?.data?.message || 'Error de conexión. Intenta de nuevo.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmailInput || !/\S+@\S+\.\S+/.test(newEmailInput)) {
      toast.error("Ingresá un correo válido.")
      return
    }
    setIsUpdatingEmail(true)
    try {
      await reenviarVerificacionCuenta({ idUsuario: usuarioId, nuevoCorreo: newEmailInput, password: formData.password })
      setFormData(prev => ({ ...prev, email: newEmailInput }))
      setIsEditingEmail(false)
      toast.success("Correo modificado y nuevo código enviado")
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo actualizar el correo.")
    } finally {
      setIsUpdatingEmail(false)
    }
  }


  // ── Pantalla de éxito ──
  if (isSuccess) {
    // Diseño de estados del acceso (estados-referencia, 5a): cuenta creada
    return (
      <PantallaEstado foto="grupo-c.png" posicion="40% 60%">
        <div className="status"><span className="tag">ALTA DE SOCIO</span><span className="sep"></span><span className="chip ok">CUENTA CREADA</span></div>
        <h1>¡Cuenta creada<i>.</i></h1>
        <p className="lead">Verificá tu correo para activarla.</p>
        <div className="okbox" role="status">
          <div className="chk">✓</div>
          <div className="body">
            <div className="t">Tu cuenta se creó con éxito.</div>
            <div className="l">ENVIAMOS EL LINK A</div>
            {!isEditingEmail ? (
              <>
                <div className="mail">{formData.email}</div>
                <button type="button" className="btn-mini" onClick={() => { setIsEditingEmail(true); setNewEmailInput(formData.email) }}>¿Te equivocaste? Cambiar correo</button>
              </>
            ) : (
              <>
                <div className="cell" style={{ marginTop: 'calc(8 * var(--u))' }}>
                  <label htmlFor="nuevo-correo">Nuevo correo</label>
                  <input id="nuevo-correo" type="email" value={newEmailInput} onChange={(e) => setNewEmailInput(e.target.value)} placeholder="tu@correo.com" />
                </div>
                <div className="row2">
                  <button type="button" className="btn-sec" onClick={() => setIsEditingEmail(false)} disabled={isUpdatingEmail}>Cancelar</button>
                  <button type="button" className="btn-sec" onClick={handleUpdateEmail} disabled={isUpdatingEmail}>{isUpdatingEmail ? 'Guardando…' : 'Confirmar y reenviar'}</button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="small">
          Revisá tu bandeja de entrada y hacé clic en el enlace para activar tu cuenta. ¿No lo ves? Mirá en spam o correo no deseado.{' '}
          <button type="button" className="btn-mini" onClick={handleReenviar} disabled={espera > 0}>{espera > 0 ? `Reenviar enlace (${espera}s)` : 'Reenviar enlace'}</button>
          {reenvio === 'ok' && <span style={{ color: 'var(--lime)' }}> Listo, te enviamos un nuevo enlace.</span>}
          {reenvio === 'error' && <span style={{ color: 'var(--err)' }}> No pudimos reenviarlo. Probá de nuevo en un rato.</span>}
        </div>
        <div className="acciones"><Link to="/login" className="btn">Ir al inicio de sesión →</Link></div>
      </PantallaEstado>
    )
  }


  // ── Formulario ──
  const msjErrorM = { margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '5px', font: '500 13px Archivo', color: '#ff6b4a' }
  // Símbolo a la derecha del campo (X roja si hay error, tilde lima si está bien) y el aviso debajo
  // Campo del celular: igual que el de escritorio (rótulo arriba, ícono a la izquierda, borde redondeado, ✓ / ✕ a la derecha)
  const campoM = (campo, { id, texto, Icono, tipo, auto, modo, ph, ojo }) => (
    <div className="mf">
      <label className="lbl" htmlFor={id}>{texto}</label>
      <div className="mfw">
        <Icono className="ic" aria-hidden="true" />
        <input id={id} className={`campo${error(campo) ? ' error' : valido(campo) ? ' ok' : ''}`} type={tipo} autoComplete={auto} inputMode={modo} placeholder={ph}
          value={formData[campo]} onChange={set(campo)} onBlur={onBlur(campo)} />
        {error(campo) && <span aria-hidden="true" className={`estado${ojo ? ' con-ojo' : ''}`} style={{ color: '#ff6b4a' }}><XCircle size={18} /></span>}
        {valido(campo) && <span role="img" aria-label="Dato correcto" className={`estado${ojo ? ' con-ojo' : ''}`} style={{ color: '#9be600' }}><CheckCircle2 size={18} /></span>}
        {ojo && (
          <button type="button" className="ojo" onClick={ojo[1]} aria-label={ojo[0] ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}>
            {ojo[0] ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error(campo) && <p role="alert" style={{ ...msjErrorM, margin: 0 }}>{error(campo)}</p>}
      {campo === 'confirmPassword' && valido(campo) && <p style={{ ...msjErrorM, color: '#9be600', margin: 0 }}>Las contraseñas coinciden</p>}
    </div>
  )
  const vistaMovil = (
    <div className={`lm${saliendo ? ' sale' : ''}`} style={{ margin: 0, background: '#0e100a', color: '#ecefe4', fontFamily: 'Archivo,sans-serif', lineHeight: 'normal', minHeight: '100dvh' }}>
      <style>{ESTILOS_MOVIL}</style>
      <div style={{ position: 'relative', width: '100%', maxWidth: '30rem', margin: '0 auto', minHeight: '100dvh', overflowX: 'hidden', background: '#0e100a' }}>
        <div style={{ position: 'relative', height: '15.625rem', overflow: 'hidden' }}>
          <img src="/acceso/hookgrip-c.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%', filter: 'grayscale(1) contrast(1.1) brightness(0.85)' }} />
          <div style={{ position: 'absolute', inset: 0, background: '#4a5626', mixBlendMode: 'multiply', opacity: 0.35 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(14,16,10,0.55) 0%,rgba(14,16,10,0) 30%,rgba(14,16,10,0.25) 60%,#0e100a 100%)' }} />
          <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 1rem)', left: '1.25rem', right: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}><img src="/acceso/brvs.png" alt="" style={{ width: '2.125rem', height: '2.125rem', borderRadius: '0.5rem' }} /><span style={{ font: "900 0.9375rem 'Big Shoulders Stencil Display'", letterSpacing: '0.3em', color: '#9be600', whiteSpace: 'nowrap' }}>BRAVOS BOX</span></div>
            <Link to="/inicio" style={{ font: "600 0.875rem Archivo, sans-serif", textDecoration: 'none', whiteSpace: 'nowrap', color: '#ecefe4', display: 'inline-flex', alignItems: 'center', minHeight: '2.75rem', padding: '0 1rem', border: '1px solid rgba(236,239,228,.28)', borderRadius: '62.4375rem', background: 'rgba(14,16,10,.5)', margin: '-0.25rem -0.375rem -0.25rem 0' }}>Sitio</Link>
          </div>
          <div style={{ position: 'absolute', left: '1.25rem', right: '1.25rem', bottom: '1.875rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div role="heading" aria-level={1} style={{ font: "900 2.875rem/0.9 'Big Shoulders Stencil Display'", textTransform: 'uppercase' }}>Sumate al<br /><span style={{ color: '#9be600' }}>equipo.</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', paddingBottom: '0.25rem' }}><img src="/acceso/malvinas.png" alt="" style={{ width: '3.625rem', filter: 'saturate(0.8)' }} /><span style={{ font: "600 0.625rem/1.4 Archivo, sans-serif", letterSpacing: '0.08em', color: '#ecefe4', textAlign: 'right' }}>MALVINAS<br /><span style={{ color: '#9be600' }}>51°41′S</span></span></div>
          </div>
        </div>

        <div style={{ position: 'relative', margin: '5rem 1.25rem 0', paddingBottom: '2.5rem' }}>
          <div ref={fichaRef} onMouseMove={inclinar} onMouseLeave={soltar} className="flota" style={{ position: 'relative', borderRadius: '0.875rem', padding: '1.25rem 1.125rem 1.125rem', ...FICHA_FLOTANTE }}>
            <img src="/acceso/dog-t.png" alt="" style={{ position: 'absolute', left: '1.125rem', bottom: 'calc(100% - 2px)', width: '5.25rem', height: '5.25rem' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', font: '600 0.6875rem Archivo, sans-serif', letterSpacing: '0.08em', color: '#8a8f7a', paddingBottom: '0.625rem', borderBottom: '1px dashed #3a3d32' }}><span style={{ color: '#9be600' }}>ALTA DE SOCIO</span></div>
            <div role="heading" aria-level={2} style={{ font: "900 2.625rem/0.9 'Big Shoulders Stencil Display'", textTransform: 'uppercase', margin: '0.875rem 0 0.25rem' }}>Crear cuenta<span style={{ color: '#9be600' }}>.</span></div>
            <div style={{ color: '#8a8f7a', fontSize: '0.8125rem', marginBottom: '1rem' }}>Completá tus datos para registrarte.</div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {campoM('nombre', { id: 'nombre-m', texto: 'Nombre completo', Icono: User, tipo: 'text', auto: 'name', ph: 'Juan Pérez' })}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {campoM('dni', { id: 'dni-m', texto: 'DNI', Icono: CreditCard, tipo: 'text', modo: 'numeric', ph: '12345678' })}
                  {campoM('telefono', { id: 'telefono-m', texto: 'Teléfono', Icono: Phone, tipo: 'tel', auto: 'tel', ph: '1123456789' })}
                </div>
                {campoM('email', { id: 'email-m', texto: 'Correo electrónico', Icono: Mail, tipo: 'email', auto: 'email', ph: 'tu@email.com' })}
                {campoM('password', { id: 'password-m', texto: 'Contraseña', Icono: Lock, tipo: showPassword ? 'text' : 'password', auto: 'new-password', ph: 'Mínimo 8 caracteres', ojo: [showPassword, () => setShowPassword(!showPassword)] })}
                {campoM('confirmPassword', { id: 'confirm-m', texto: 'Confirmar contraseña', Icono: Lock, tipo: showConfirmPassword ? 'text' : 'password', auto: 'new-password', ph: 'Repetí tu contraseña', ojo: [showConfirmPassword, () => setShowConfirmPassword(!showConfirmPassword)] })}
              </div>

              {/* Requisitos de la contraseña: aparecen cuando empieza a escribir */}
              {formData.password.length > 0 && (
                <ul aria-label="Requisitos de la contraseña" style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 0.75rem', font: "600 0.75rem Archivo, sans-serif" }}>
                  {PASSWORD_RULES.map(rule => {
                    const ok = rule.test(formData.password)
                    return (
                      <li key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: ok ? '#9be600' : '#8a8f7a' }}>
                        <span aria-hidden="true">{ok ? '✓' : '○'}</span>{rule.label}
                      </li>
                    )
                  })}
                </ul>
              )}

              <label htmlFor="aceptaTerminos-m" style={{ display: 'flex', gap: '0.625rem', marginTop: '0.875rem', fontSize: '0.7188rem', lineHeight: 1.5, color: '#8a8f7a' }}>
                <input id="aceptaTerminos-m" type="checkbox" checked={aceptaTerminos}
                  onChange={(e) => { setAceptaTerminos(e.target.checked); if (e.target.checked) setErrorTerminos('') }}
                  style={{ accentColor: '#9be600', width: '1.25rem', height: '1.25rem', flex: 'none', margin: 0 }} />
                <span>Leí y acepto los <Link to="/terminos" target="_blank">Términos y condiciones</Link> y la <Link to="/privacidad" target="_blank">Política de privacidad</Link>. Si soy menor de 18 años, cuento con la autorización de mi madre, padre o tutor.</span>
              </label>
              {errorTerminos && <p role="alert" style={{ ...msjErrorM, margin: '0.375rem 0 0' }}><XCircle size={15} aria-hidden="true" style={{ flexShrink: 0 }} />{errorTerminos}</p>}
              <button type="submit" disabled={isLoading} className="boton" style={{ marginTop: '1rem' }}>{isLoading ? 'Creando…' : 'Crear mi cuenta'}</button>
            </form>
          </div>
          <div style={{ marginTop: '0.875rem', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
            <span style={{ textAlign: 'center', font: '600 0.6875rem Archivo, sans-serif', letterSpacing: '0.08em', color: '#8a8f7a' }}>¿YA TENÉS CUENTA?</span>
            <Link to="/login" onClick={irA('/login')} className="btn2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '2.75rem', border: '1px solid rgba(155,230,0,.55)', borderRadius: '0.625rem', textDecoration: 'none', color: '#9be600', font: "900 1rem 'Big Shoulders Stencil Display'", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Iniciar sesión →</Link>
          </div>
        </div>
      </div>
    </div>
  )

  if (!escritorio) return vistaMovil

  // Referencia (registro): todas las medidas son calc(N * var(--u)) con --u = min(100vw / 1280, 100vh / 880)
  const U = (n) => `calc(${n} * var(--u))`
  const MONO_REF = "'JetBrains Mono'"
  const BIG_REF = "'Big Shoulders Stencil Display'"
  // Formulario de campos sueltos (rótulo arriba, ícono a la izquierda, campo redondeado).
  // El mensaje de error va en la línea del rótulo (no agrega alto) y el símbolo de estado dentro del campo.
  const msjError = { position: 'absolute', top: 0, right: 0, margin: 0, font: `500 ${U(13)} Archivo`, color: '#ff6b4a' }
  const msjTerminos = { position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: U(4), margin: `${U(2)} 0 0`, font: `500 ${U(14)} Archivo`, color: '#ff6b4a' }
  const etiqueta = { display: 'block', font: `700 ${U(10.5)} Barlow, Archivo, sans-serif`, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a8f7a' }
  const iconoIzq = { position: 'absolute', left: U(12), top: '50%', transform: 'translateY(-50%)', width: U(16), height: U(16), color: '#8a8f7a', pointerEvents: 'none' }
  const ojo = { position: 'absolute', right: U(12), top: '50%', transform: 'translateY(-50%)', display: 'flex', padding: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a8f7a' }
  const estado = (campo, conOjo) => {
    const pos = { position: 'absolute', right: conOjo ? U(38) : U(12), top: '50%', transform: 'translateY(-50%)', display: 'flex' }
    if (error(campo)) return <span aria-hidden="true" style={{ ...pos, color: '#ff6b4a' }}><XCircle style={{ width: U(16), height: U(16) }} /></span>
    if (valido(campo)) return <span role="img" aria-label="Dato correcto" style={{ ...pos, color: '#9be600' }}><CheckCircle2 style={{ width: U(16), height: U(16) }} /></span>
    return null
  }
  const clase = (campo) => `campo${error(campo) ? ' error' : valido(campo) ? ' ok' : ''}`
  // Un campo completo: rótulo + mensaje, y debajo el ícono, el campo y el símbolo de estado
  const fila = ({ id, texto, Icono, input, botonOjo, mensaje, extra }) => (
    <div style={{ position: 'relative', minWidth: 0 }}>
      <label htmlFor={id} style={etiqueta}>{texto}</label>
      {error(id) && <p role="alert" style={msjError}>{mensaje ?? error(id)}</p>}
      {id === 'confirmPassword' && valido(id) && <p style={{ ...msjError, color: '#9be600' }}>Las contraseñas coinciden</p>}
      {extra && !error(id) && <span style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: U(8), font: `500 ${U(11)} Archivo` }}>{extra}</span>}
      <div style={{ position: 'relative', marginTop: U(5) }}>
        <Icono style={iconoIzq} aria-hidden="true" />
        {input}
        {estado(id, !!botonOjo)}
        {botonOjo}
      </div>
    </div>
  )

  return (
    <div className={`lr${saliendo ? ' sale' : ''}`} style={{ margin: 0, color: '#ecefe4', fontFamily: 'Archivo,sans-serif', '--u': 'min(100vw / 1280, 100vh / 880)' }}>
      <style>{ESTILOS_REF}</style>
      <div style={{ display: 'grid', gridTemplateColumns: 'min(calc(100vh * 873 / 1140), 52vw) 1fr', position: 'fixed', inset: 0, width: '100%', height: '100%', overflow: 'hidden', background: '#0b0c09' }}>

        {/* PANEL IZQUIERDO */}
        <div style={{ position: 'relative', overflow: 'hidden', background: '#0e100a' }}>
          <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: 'linear-gradient(90deg,#000 94%,transparent 100%)', maskImage: 'linear-gradient(90deg,#000 94%,transparent 100%)' }}>
            <img src="/acceso/hookgrip-c.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%', filter: 'grayscale(1) contrast(1.1) brightness(.85)' }} />
            <div style={{ position: 'absolute', inset: 0, background: '#4a5626', mixBlendMode: 'multiply', opacity: 0.35 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(14,16,10,.95) 0%,rgba(14,16,10,.2) 45%,rgba(14,16,10,.55) 100%)' }} />
          </div>
          <div style={{ position: 'absolute', top: U(30), left: U(36), display: 'flex', alignItems: 'center', gap: U(14) }}><img src="/acceso/brvs.png" alt="" style={{ width: U(44), height: U(44), borderRadius: U(8) }} /><span style={{ font: `900 ${U(20)} ${BIG_REF}`, letterSpacing: '0.3em', color: '#9be600', whiteSpace: 'nowrap' }}>BRAVOS BOX</span></div>
          <div style={{ position: 'absolute', top: U(32), right: U(36), display: 'flex', alignItems: 'center', gap: U(10) }}><img src="/acceso/malvinas.png" alt="" style={{ width: U(84), filter: 'saturate(0.8)' }} /><span style={{ font: `500 ${U(10)}/1.6 ${MONO_REF}`, letterSpacing: '0.16em', color: '#ecefe4' }}>MALVINAS<br /><span style={{ color: '#9be600' }}>51°41′S</span></span></div>
          <div style={{ position: 'absolute', left: U(36), right: U(36), bottom: U(40) }}><div role="heading" aria-level={1} style={{ font: `900 ${U(74)}/0.92 ${BIG_REF}`, textTransform: 'uppercase', maxWidth: U(430) }}>Sumate al <span style={{ color: '#9be600' }}>equipo.</span></div></div>
        </div>

        {/* PANEL DERECHO */}
        <div style={{ position: 'relative', padding: `${U(40)} 0 ${U(28)}`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', overflowY: 'auto', background: '#0e100a', paddingLeft: `max(0px, calc(min(${U(800)}, 52vw) - min(100vh * 873 / 1140, 52vw)))` }}>
          <a href="#volver" onClick={(e) => { e.preventDefault(); volver() }} style={{ position: 'absolute', top: U(46), right: U(59), font: `600 ${U(14)} Archivo, sans-serif`, display: 'inline-flex', alignItems: 'center', height: U(39), padding: `0 ${U(16)}`, border: `${U(1)} solid #4b5233`, borderRadius: '62.4375rem', background: 'rgba(14,16,10,.55)', whiteSpace: 'nowrap', textDecoration: 'none', color: '#ecefe4' }}>Volver al sitio</a>
          {/* La referencia centra el bloque; acá se fija desde arriba en la posición centrada para que no salte al aparecer errores */}
          <div style={{ width: U(480), flexShrink: 0, margin: 'auto 0' }}>
            <div ref={fichaRef} onMouseMove={inclinar} onMouseLeave={soltar} className="ficha-flota" style={{ position: 'relative', border: `${U(1)} solid #4a4e3f`, borderRadius: U(16), padding: `${U(22)} ${U(30)}`, background: 'linear-gradient(160deg, #16190f 0%, #0e100a 60%)', boxShadow: '0 1px 0 rgba(236,239,228,.08) inset, 0 1.875rem 3.75rem -0.75rem rgba(0,0,0,.75), 0 0.75rem 1.5rem -0.5rem rgba(0,0,0,.6), 0 0 3.75rem -1.25rem rgba(155,230,0,.18)' }}>
              <img src="/acceso/dog-t.png" alt="" style={{ position: 'absolute', left: U(30), bottom: `calc(100% - 2 * var(--u))`, width: U(110), height: U(110) }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 ${U(10.5)} ${MONO_REF}`, letterSpacing: '0.16em', color: '#8a8f7a', paddingBottom: U(12), borderBottom: `${U(1)} dashed #3a3d32` }}><span style={{ color: '#9be600', whiteSpace: 'nowrap' }}>ALTA DE SOCIO</span></div>
              <div role="heading" aria-level={2} style={{ font: `900 ${U(54)}/0.9 ${BIG_REF}`, textTransform: 'uppercase', margin: `${U(16)} 0 ${U(4)}` }}>Crear cuenta<span style={{ color: '#9be600' }}>.</span></div>
              <div style={{ color: '#8a8f7a', fontSize: U(14), marginBottom: U(14) }}>Completá tus datos para registrarte.</div>

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: U(8) }}>
                  {fila({ id: 'nombre', texto: 'Nombre completo', Icono: User,
                    input: <input id="nombre" type="text" placeholder="Juan Pérez" autoComplete="name" className={clase('nombre')} value={formData.nombre} onChange={set('nombre')} onBlur={onBlur('nombre')} /> })}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: U(12) }}>
                    {fila({ id: 'dni', texto: 'DNI', Icono: CreditCard,
                      input: <input id="dni" type="text" inputMode="numeric" placeholder="12345678" className={clase('dni')} value={formData.dni} onChange={set('dni')} onBlur={onBlur('dni')} /> })}
                    {fila({ id: 'telefono', texto: 'Teléfono', Icono: Phone, mensaje: error('telefono') === 'El teléfono es requerido' ? 'Requerido' : undefined,
                      input: <input id="telefono" type="tel" placeholder="1123456789" autoComplete="tel" className={clase('telefono')} value={formData.telefono} onChange={set('telefono')} onBlur={onBlur('telefono')} /> })}
                  </div>
                  {fila({ id: 'email', texto: 'Correo electrónico', Icono: Mail,
                    input: <input id="email" type="email" placeholder="tu@email.com" autoComplete="email" className={clase('email')} value={formData.email} onChange={set('email')} onBlur={onBlur('email')} /> })}
                  {fila({ id: 'password', texto: 'Contraseña', Icono: Lock,
                    extra: formData.password.length > 0 ? PASSWORD_RULES.map(rule => <span key={rule.id} title={rule.label} style={{ color: rule.test(formData.password) ? '#9be600' : '#8a8f7a' }}>{rule.test(formData.password) ? '✓' : '○'} {{ len: '8+', upper: 'A-Z', lower: 'a-z', num: '0-9' }[rule.id]}</span>) : null,
                    input: <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" autoComplete="new-password" className={clase('password')} value={formData.password} onChange={set('password')} onBlur={onBlur('password')} />,
                    botonOjo: <button type="button" className="ojo" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} style={ojo}>{showPassword ? <EyeOff style={{ width: U(16), height: U(16) }} /> : <Eye style={{ width: U(16), height: U(16) }} />}</button> })}
                  {fila({ id: 'confirmPassword', texto: 'Confirmar contraseña', Icono: Lock,
                    input: <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repetí tu contraseña" autoComplete="new-password" className={clase('confirmPassword')} value={formData.confirmPassword} onChange={set('confirmPassword')} onBlur={onBlur('confirmPassword')} />,
                    botonOjo: <button type="button" className="ojo" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} style={ojo}>{showConfirmPassword ? <EyeOff style={{ width: U(16), height: U(16) }} /> : <Eye style={{ width: U(16), height: U(16) }} />}</button> })}
                </div>

                {/* Consentimiento: el servidor también lo exige y guarda la constancia */}
                <div style={{ position: 'relative' }}>
                  <label htmlFor="aceptaTerminos" style={{ display: 'flex', gap: U(10), marginTop: U(14), fontSize: U(11), lineHeight: 1.5, color: '#8a8f7a' }}>
                    <input id="aceptaTerminos" type="checkbox" checked={aceptaTerminos}
                      onChange={(e) => { setAceptaTerminos(e.target.checked); if (e.target.checked) setErrorTerminos('') }}
                      style={{ accentColor: '#9be600', width: U(16), height: U(16), flex: 'none', margin: `${U(1)} 0 0` }} />
                    <span>
                      Leí y acepto los <Link to="/terminos" target="_blank">Términos y condiciones</Link> y la <Link to="/privacidad" target="_blank">Política de privacidad</Link>. Si soy menor de 18 años, cuento con la autorización de mi madre, padre o tutor.
                    </span>
                  </label>
                  {errorTerminos && <p role="alert" style={msjTerminos}><XCircle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />{errorTerminos}</p>}
                </div>

                <button type="submit" disabled={isLoading} className="pri" style={{ marginTop: U(14), width: '100%', height: U(48), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: U(6), border: 'none', cursor: 'pointer', background: '#9be600', color: '#0b0c09', font: `900 ${U(15)} Barlow, Archivo, sans-serif`, letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: U(8), boxShadow: `0 ${U(8)} ${U(20)} ${U(-6)} rgba(155,230,0,.45)`, opacity: isLoading ? 0.7 : 1 }}>{isLoading ? 'Creando…' : <>Crear mi cuenta <ChevronRight style={{ width: U(16), height: U(16) }} aria-hidden="true" /></>}</button>
              </form>
            </div>
            <div style={{ marginTop: U(18), fontSize: U(13), color: '#8a8f7a' }}>¿Ya tenés cuenta? <Link to="/login" onClick={irA('/login')} style={{ fontWeight: 600 }}>Iniciá sesión</Link></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistroPage
