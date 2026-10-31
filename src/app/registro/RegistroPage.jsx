import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import { registroUsuario, reenviarVerificacionCuenta } from '@/api'
import { toast } from '@/lib/notificar'
import { useEscritorio } from '@/lib/useEscritorio'
import { ARCH, BIG, COLOR, MONO } from '@/lib/accesoEstilos'
import { ESTILOS_MOVIL, FICHA_FLOTANTE } from '@/lib/estilosMovil'
import { Ficha } from '@/components/AccesoDiseno'

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
    return (
      <div className="min-h-screen px-6 pb-10 pt-6 text-[#ecefe4]" style={{ ...ARCH, background: COLOR.form }}>
        <div className="mx-auto w-full max-w-[480px]">
          <Ficha margenSuperior={100} arriba={100} tagIzq="ALTA DE SOCIO" tagDer="CUENTA CREADA" titulo="¡Cuenta creada" subtitulo="Verificá tu correo para activarla.">
            <div className="mb-4 flex items-center gap-3" role="status">
              <CheckCircle2 className="h-9 w-9 shrink-0" style={{ color: COLOR.lima }} aria-hidden="true" />
              <p className="text-[15px] font-semibold">Tu cuenta se creó con éxito.</p>
            </div>
            <div className="border p-4" style={{ borderColor: COLOR.linea }}>
              <p className="text-[9.5px] uppercase tracking-[0.16em]" style={{ ...MONO, color: COLOR.apagado }}>Enviamos el link a</p>
              {!isEditingEmail ? (
                <div className="mt-1 space-y-1">
                  <p className="break-all text-base font-semibold" style={{ color: COLOR.lima }}>{formData.email}</p>
                  <button onClick={() => { setIsEditingEmail(true); setNewEmailInput(formData.email) }}
                    className="text-xs underline transition-colors hover:text-white" style={{ color: COLOR.apagado }}>
                    ¿Te equivocaste? Cambiar correo
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex flex-col gap-3">
                  <input type="email" value={newEmailInput} onChange={(e) => setNewEmailInput(e.target.value)} placeholder="tu@correo.com" aria-label="Nuevo correo"
                    className="w-full border bg-transparent px-3 py-2 text-[16px] outline-none placeholder:text-[#6b705e] focus:border-[#9be600]" style={{ borderColor: COLOR.linea }} />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setIsEditingEmail(false)} disabled={isUpdatingEmail}
                      className="border px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:text-white disabled:opacity-60" style={{ borderColor: COLOR.linea, color: COLOR.apagado }}>
                      Cancelar
                    </button>
                    <button type="button" onClick={handleUpdateEmail} disabled={isUpdatingEmail}
                      className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors hover:!bg-[#c4ff3d] disabled:opacity-60" style={{ background: COLOR.lima, color: COLOR.base }}>
                      {isUpdatingEmail ? 'Guardando…' : 'Confirmar y reenviar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="mt-4 text-[13px] leading-relaxed" style={{ color: COLOR.apagado }}>
              Revisá tu bandeja de entrada y hacé clic en el enlace para activar tu cuenta.
            </p>
            <Link to="/login"
              className="mt-[18px] flex w-full items-center justify-center px-3 py-3 text-[22px] uppercase tracking-[0.12em] transition-colors hover:!bg-[#c4ff3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4ff3d]"
              style={{ ...BIG, background: COLOR.lima, color: COLOR.base }}>
              Ir al inicio de sesión →
            </Link>
          </Ficha>
        </div>
      </div>
    )
  }

  // ── Formulario ──
  const msjErrorM = { margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '5px', font: '500 13px Archivo', color: '#ff6b4a' }
  // Símbolo a la derecha del campo (X roja si hay error, tilde lima si está bien) y el aviso debajo
  const iconoM = { position: 'absolute', top: '29px', right: '14px', display: 'flex' }
  const avisoM = (campo) => (
    <>
      {error(campo) && <p role="alert" style={msjErrorM}>{error(campo)}</p>}
      {error(campo) && <span aria-hidden="true" style={{ ...iconoM, color: '#ff6b4a' }}><XCircle size={18} /></span>}
      {valido(campo) && <span role="img" aria-label="Dato correcto" style={{ ...iconoM, color: '#9be600' }}><CheckCircle2 size={18} /></span>}
      {campo === 'confirmPassword' && valido(campo) && <p style={{ ...msjErrorM, color: '#9be600' }}>Las contraseñas coinciden</p>}
    </>
  )
  const vistaMovil = (
    <div className={`lm${saliendo ? ' sale' : ''}`} style={{ margin: 0, background: '#0e100a', color: '#ecefe4', fontFamily: 'Archivo,sans-serif', lineHeight: 'normal', minHeight: '100dvh' }}>
      <style>{ESTILOS_MOVIL}</style>
      <div style={{ position: 'relative', width: '100%', maxWidth: '480px', margin: '0 auto', minHeight: '100dvh', overflowX: 'hidden', background: '#0e100a' }}>
        <div style={{ position: 'relative', height: '250px', overflow: 'hidden' }}>
          <img src="/acceso/hookgrip-c.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 12%', filter: 'grayscale(1) contrast(1.1) brightness(0.85)' }} />
          <div style={{ position: 'absolute', inset: 0, background: '#4a5626', mixBlendMode: 'multiply', opacity: 0.35 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(14,16,10,0.55) 0%,rgba(14,16,10,0) 30%,rgba(14,16,10,0.25) 60%,#0e100a 100%)' }} />
          <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 16px)', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><img src="/acceso/brvs.png" alt="" style={{ width: '34px', height: '34px', borderRadius: '8px' }} /><span style={{ font: "900 15px 'Big Shoulders Stencil Display'", letterSpacing: '0.3em', color: '#9be600', whiteSpace: 'nowrap' }}>BRAVOS BOX</span></div>
            <Link to="/inicio" style={{ font: "500 12px 'JetBrains Mono'", letterSpacing: '0.14em', textDecoration: 'none', whiteSpace: 'nowrap', color: '#ecefe4', display: 'inline-flex', alignItems: 'center', minHeight: '44px', padding: '0 16px', border: '1px solid rgba(236,239,228,.28)', borderRadius: '999px', background: 'rgba(14,16,10,.5)', margin: '-4px -6px -4px 0' }}>← SITIO</Link>
          </div>
          <div style={{ position: 'absolute', left: '20px', right: '20px', bottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div role="heading" aria-level={1} style={{ font: "900 46px/0.9 'Big Shoulders Stencil Display'", textTransform: 'uppercase' }}>Sumate al<br /><span style={{ color: '#9be600' }}>equipo.</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', paddingBottom: '4px' }}><img src="/acceso/malvinas.png" alt="" style={{ width: '58px', filter: 'saturate(0.8)' }} /><span style={{ font: "500 9px/1.4 'JetBrains Mono'", letterSpacing: '0.14em', color: '#ecefe4', textAlign: 'right' }}>MALVINAS<br /><span style={{ color: '#9be600' }}>51°41′S</span></span></div>
          </div>
        </div>

        <div style={{ position: 'relative', margin: '80px 20px 0', paddingBottom: '40px' }}>
          <div ref={fichaRef} onMouseMove={inclinar} onMouseLeave={soltar} className="flota" style={{ position: 'relative', borderRadius: '14px', padding: '20px 18px 18px', ...FICHA_FLOTANTE }}>
            <img src="/acceso/dog-t.png" alt="" style={{ position: 'absolute', left: '18px', bottom: 'calc(100% - 2px)', width: '84px', height: '84px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', font: "500 10px 'JetBrains Mono'", letterSpacing: '0.16em', color: '#8a8f7a', paddingBottom: '10px', borderBottom: '1px dashed #3a3d32' }}><span style={{ color: '#9be600' }}>ALTA DE SOCIO</span></div>
            <div role="heading" aria-level={2} style={{ font: "900 42px/0.9 'Big Shoulders Stencil Display'", textTransform: 'uppercase', margin: '14px 0 4px' }}>Crear cuenta<span style={{ color: '#9be600' }}>.</span></div>
            <div style={{ color: '#8a8f7a', fontSize: '13px', marginBottom: '16px' }}>Completá tus datos para registrarte.</div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #3a3d32', borderRadius: '10px', overflow: 'hidden' }}>
                <div className="cell" style={{ gridColumn: '1/3' }}>
                  <label className="lbl" htmlFor="nombre-m">NOMBRE COMPLETO</label>
                  <input id="nombre-m" className="inp" type="text" autoComplete="name" placeholder="Juan Pérez" value={formData.nombre} onChange={set('nombre')} onBlur={onBlur('nombre')} />
                  {avisoM('nombre')}
                </div>
                <div className="cell" style={{ borderRight: '1px solid #3a3d32' }}>
                  <label className="lbl" htmlFor="dni-m">DNI</label>
                  <input id="dni-m" className="inp" type="text" inputMode="numeric" placeholder="12345678" value={formData.dni} onChange={set('dni')} onBlur={onBlur('dni')} />
                  {avisoM('dni')}
                </div>
                <div className="cell">
                  <label className="lbl" htmlFor="telefono-m">TELÉFONO</label>
                  <input id="telefono-m" className="inp" type="tel" autoComplete="tel" placeholder="1123456789" value={formData.telefono} onChange={set('telefono')} onBlur={onBlur('telefono')} />
                  {avisoM('telefono')}
                </div>
                <div className="cell" style={{ gridColumn: '1/3' }}>
                  <label className="lbl" htmlFor="email-m">CORREO ELECTRÓNICO</label>
                  <input id="email-m" className="inp" type="email" autoComplete="email" placeholder="tu@email.com" value={formData.email} onChange={set('email')} onBlur={onBlur('email')} />
                  {avisoM('email')}
                </div>
                <div className="cell" style={{ gridColumn: '1/3' }}>
                  <label className="lbl" htmlFor="password-m">CONTRASEÑA</label>
                  <input id="password-m" className="inp" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" value={formData.password} onChange={set('password')} onBlur={onBlur('password')} />
                  {avisoM('password')}
                </div>
                <div className="cell" style={{ gridColumn: '1/3', borderBottom: 'none' }}>
                  <label className="lbl" htmlFor="confirm-m">CONFIRMAR CONTRASEÑA</label>
                  <input id="confirm-m" className="inp" type="password" autoComplete="new-password" placeholder="Repetí tu contraseña" value={formData.confirmPassword} onChange={set('confirmPassword')} onBlur={onBlur('confirmPassword')} />
                  {avisoM('confirmPassword')}
                </div>
              </div>

              {/* Requisitos de la contraseña: aparecen cuando empieza a escribir */}
              {formData.password.length > 0 && (
                <ul aria-label="Requisitos de la contraseña" style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', font: "500 11px 'JetBrains Mono'" }}>
                  {PASSWORD_RULES.map(rule => {
                    const ok = rule.test(formData.password)
                    return (
                      <li key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: ok ? '#9be600' : '#8a8f7a' }}>
                        <span aria-hidden="true">{ok ? '✓' : '○'}</span>{rule.label}
                      </li>
                    )
                  })}
                </ul>
              )}

              <label htmlFor="aceptaTerminos-m" style={{ display: 'flex', gap: '10px', marginTop: '14px', fontSize: '11.5px', lineHeight: 1.5, color: '#8a8f7a' }}>
                <input id="aceptaTerminos-m" type="checkbox" checked={aceptaTerminos}
                  onChange={(e) => { setAceptaTerminos(e.target.checked); if (e.target.checked) setErrorTerminos('') }}
                  style={{ accentColor: '#9be600', width: '20px', height: '20px', flex: 'none', margin: 0 }} />
                <span>Leí y acepto los <Link to="/terminos" target="_blank">Términos y condiciones</Link> y la <Link to="/privacidad" target="_blank">Política de privacidad</Link>. Si soy menor de 18 años, cuento con la autorización de mi madre, padre o tutor.</span>
              </label>
              {errorTerminos && <p role="alert" style={{ ...msjErrorM, margin: '6px 0 0' }}><XCircle size={15} aria-hidden="true" style={{ flexShrink: 0 }} />{errorTerminos}</p>}
              <button type="submit" disabled={isLoading} style={{ marginTop: '16px', width: '100%', height: '54px', border: 'none', borderRadius: '10px', cursor: 'pointer', background: '#9be600', color: '#0b0c09', font: "900 22px 'Big Shoulders Stencil Display'", letterSpacing: '0.12em', textTransform: 'uppercase', boxShadow: 'rgba(155,230,0,0.28) 0 0 28px', opacity: isLoading ? 0.7 : 1 }}>{isLoading ? 'CREANDO…' : 'Crear mi cuenta →'}</button>
            </form>
          </div>
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
            <span style={{ textAlign: 'center', font: "500 10px 'JetBrains Mono'", letterSpacing: '0.16em', color: '#8a8f7a' }}>¿YA TENÉS CUENTA?</span>
            <Link to="/login" onClick={irA('/login')} className="btn2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '44px', border: '1px solid rgba(155,230,0,.55)', borderRadius: '10px', textDecoration: 'none', color: '#9be600', font: "900 16px 'Big Shoulders Stencil Display'", letterSpacing: '0.12em', textTransform: 'uppercase' }}>Iniciar sesión →</Link>
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
  const msjError = { position: 'absolute', top: U(8), right: U(12), margin: 0, display: 'inline-flex', alignItems: 'center', gap: U(4), font: `500 ${U(14)} Archivo`, color: '#ff6b4a' }
  // Símbolo a la derecha del campo: X roja si hay error, tilde lima si está bien (en las contraseñas, a la izquierda del ojo)
  const posIcono = (campo) => ({ position: 'absolute', top: U(21), right: campo === 'password' || campo === 'confirmPassword' ? U(44) : U(12), display: 'flex' })
  const aviso = (campo, texto) => (
    <>
      {error(campo) && <p role="alert" style={msjError}>{texto ?? error(campo)}</p>}
      {error(campo) && <span aria-hidden="true" style={{ ...posIcono(campo), color: '#ff6b4a' }}><XCircle size={16} /></span>}
      {valido(campo) && <span role="img" aria-label="Dato correcto" style={{ ...posIcono(campo), color: '#9be600' }}><CheckCircle2 size={16} /></span>}
      {campo === 'confirmPassword' && valido(campo) && <p style={{ ...msjError, color: '#9be600' }}>Las contraseñas coinciden</p>}
    </>
  )
  const msjTerminos = { position: 'absolute', top: '100%', left: 0, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: U(4), margin: `${U(2)} 0 0`, font: `500 ${U(14)} Archivo`, color: '#ff6b4a' }
  const etiqueta = { font: `500 ${U(9.5)} ${MONO_REF}`, letterSpacing: '0.16em', color: '#8a8f7a' }
  const campo = { display: 'block', width: '100%', background: 'transparent', border: 'none', color: '#ecefe4', font: `500 ${U(16)} Archivo`, padding: `${U(4)} 0` }
  const celda = (cols, campo) => ({ position: 'relative', gridColumn: cols, padding: `${U(8)} ${U(12)} ${U(6)}`, border: `${U(1)} solid ${campo && error(campo) ? '#ff6b4a' : campo && valido(campo) ? 'rgba(155,230,0,.55)' : '#3a3d32'}`, margin: U(-0.5) })
  const ojo = { flexShrink: 0, background: 'transparent', border: 'none', cursor: 'pointer', color: '#8a8f7a', padding: U(4), display: 'flex' }

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
        <div style={{ position: 'relative', padding: `${U(40)} 0 ${U(28)}`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', overflowY: 'auto', background: '#0e100a' }}>
          <a href="#volver" onClick={(e) => { e.preventDefault(); volver() }} style={{ position: 'absolute', top: U(32), right: U(40), font: `500 ${U(12)} ${MONO_REF}`, letterSpacing: '0.14em', textDecoration: 'none', whiteSpace: 'nowrap', color: '#8a8f7a' }}>← VOLVER AL SITIO</a>
          {/* La referencia centra el bloque; acá se fija desde arriba en la posición centrada para que no salte al aparecer errores */}
          <div style={{ width: U(512), flexShrink: 0, marginTop: `max(0px, calc((100vh - ${U(762)}) / 2 - ${U(48)}))` }}>
            <div ref={fichaRef} onMouseMove={inclinar} onMouseLeave={soltar} className="ficha-flota" style={{ position: 'relative', border: `${U(1)} solid #4a4e3f`, borderRadius: U(16), padding: `${U(24)} ${U(30)}`, marginTop: U(70), background: 'linear-gradient(160deg, #16190f 0%, #0e100a 60%)', boxShadow: '0 1px 0 rgba(236,239,228,.08) inset, 0 30px 60px -12px rgba(0,0,0,.75), 0 12px 24px -8px rgba(0,0,0,.6), 0 0 60px -20px rgba(155,230,0,.18)' }}>
              <img src="/acceso/dog-t.png" alt="" style={{ position: 'absolute', left: U(30), bottom: `calc(100% - 2 * var(--u))`, width: U(110), height: U(110) }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', font: `500 ${U(10.5)} ${MONO_REF}`, letterSpacing: '0.16em', color: '#8a8f7a', paddingBottom: U(12), borderBottom: `${U(1)} dashed #3a3d32` }}><span style={{ color: '#9be600', whiteSpace: 'nowrap' }}>ALTA DE SOCIO</span></div>
              <div role="heading" aria-level={2} style={{ font: `900 ${U(54)}/0.9 ${BIG_REF}`, textTransform: 'uppercase', margin: `${U(16)} 0 ${U(4)}` }}>Crear cuenta<span style={{ color: '#9be600' }}>.</span></div>
              <div style={{ color: '#8a8f7a', fontSize: U(14), marginBottom: U(18) }}>Completá tus datos para registrarte.</div>

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: `${U(1)} solid #3a3d32`, borderRadius: U(12), overflow: 'hidden' }}>
                  <div style={celda('1 / 3', 'nombre')}>
                    <label htmlFor="nombre" style={etiqueta}>NOMBRE COMPLETO</label>
                    <input id="nombre" type="text" placeholder="Juan Pérez" autoComplete="name" style={campo} value={formData.nombre} onChange={set('nombre')} onBlur={onBlur('nombre')} />
                    {aviso('nombre')}
                  </div>
                  <div style={celda('auto', 'dni')}>
                    <label htmlFor="dni" style={etiqueta}>DNI</label>
                    <input id="dni" type="text" inputMode="numeric" placeholder="12345678" style={campo} value={formData.dni} onChange={set('dni')} onBlur={onBlur('dni')} />
                    {aviso('dni')}
                  </div>
                  <div style={celda('auto', 'telefono')}>
                    <label htmlFor="telefono" style={etiqueta}>TELÉFONO</label>
                    <input id="telefono" type="tel" placeholder="1123456789" autoComplete="tel" style={campo} value={formData.telefono} onChange={set('telefono')} onBlur={onBlur('telefono')} />
                    {aviso('telefono', error('telefono') === 'El teléfono es requerido' ? 'Requerido' : undefined)}
                  </div>
                  <div style={celda('1 / 3', 'email')}>
                    <label htmlFor="email" style={etiqueta}>CORREO ELECTRÓNICO</label>
                    <input id="email" type="email" placeholder="tu@email.com" autoComplete="email" style={campo} value={formData.email} onChange={set('email')} onBlur={onBlur('email')} />
                    {aviso('email')}
                  </div>
                  <div style={celda('1 / 3', 'password')}>
                    <label htmlFor="password" style={etiqueta}>CONTRASEÑA</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: U(8) }}>
                      <input id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" autoComplete="new-password" style={campo} value={formData.password} onChange={set('password')} onBlur={onBlur('password')} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} style={ojo}>
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {aviso('password')}
                  </div>
                  <div style={celda('1 / 3', 'confirmPassword')}>
                    <label htmlFor="confirmPassword" style={etiqueta}>CONFIRMAR CONTRASEÑA</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: U(8) }}>
                      <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repetí tu contraseña" autoComplete="new-password" style={campo} value={formData.confirmPassword} onChange={set('confirmPassword')} onBlur={onBlur('confirmPassword')} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Ocultar la contraseña' : 'Mostrar la contraseña'} style={ojo}>
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {aviso('confirmPassword')}
                  </div>
                </div>

                {/* Requisitos de la contraseña: aparecen cuando empieza a escribir */}
                {formData.password.length > 0 && (
                  <ul aria-label="Requisitos de la contraseña" style={{ listStyle: 'none', margin: `${U(12)} 0 0`, padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: `${U(4)} ${U(16)}`, font: `500 ${U(11)} ${MONO_REF}` }}>
                    {PASSWORD_RULES.map(rule => {
                      const ok = rule.test(formData.password)
                      return (
                        <li key={rule.id} style={{ display: 'flex', alignItems: 'center', gap: U(6), color: ok ? '#9be600' : '#8a8f7a' }}>
                          <span aria-hidden="true">{ok ? '✓' : '○'}</span>{rule.label}
                        </li>
                      )
                    })}
                  </ul>
                )}

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

                <button type="submit" disabled={isLoading} className="pri" style={{ marginTop: U(18), width: '100%', border: 'none', cursor: 'pointer', background: '#9be600', color: '#0b0c09', font: `900 ${U(26)} ${BIG_REF}`, letterSpacing: '0.12em', textTransform: 'uppercase', padding: U(12), borderRadius: U(12), boxShadow: `0 ${U(8)} ${U(20)} ${U(-6)} rgba(155,230,0,.45)`, opacity: isLoading ? 0.7 : 1 }}>{isLoading ? 'CREANDO…' : 'Crear mi cuenta →'}</button>
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
