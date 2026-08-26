import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard, Eye, EyeOff, Loader2, Lock, Mail, Phone, User, ArrowLeft, Dumbbell, Star, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { registroUsuario, reenviarVerificacionCuenta } from '@/api'
import { toast } from '@/lib/notificar'

const STEPS = [
  { icon: Dumbbell, text: "Accedé a todas las clases del Box" },
  { icon: Star,    text: "Gestioná tus créditos y pagos" },
  { icon: Trophy,  text: "Seguí tu progreso semana a semana" },
]

function RegistroPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [usuarioId, setUsuarioId] = useState(null)
  const [isEditingEmail, setIsEditingEmail] = useState(false)
  const [newEmailInput, setNewEmailInput] = useState('')
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '', dni: '', email: '', telefono: '', password: '', confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }))

  const validateForm = () => {
    const e = {}
    if (!formData.nombre.trim()) e.nombre = 'El nombre es requerido'
    if (!formData.dni.trim()) e.dni = 'El DNI es requerido'
    else if (!/^\d{7,8}$/.test(formData.dni)) e.dni = 'DNI inválido (7-8 dígitos)'
    if (!formData.email) e.email = 'El correo es requerido'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Correo inválido'
    if (!formData.telefono.trim()) e.telefono = 'El teléfono es requerido'
    else if (!/^\d{10,15}$/.test(formData.telefono.replace(/\D/g, ''))) e.telefono = 'Teléfono inválido'
    if (!formData.password) e.password = 'La contraseña es requerida'
    else if (formData.password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (!formData.confirmPassword) e.confirmPassword = 'Confirmá tu contraseña'
    else if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden'
    return e
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    setIsLoading(true)
    try {
      const response = await registroUsuario({
        nombrecompleto: formData.nombre,
        dni: formData.dni,
        correo: formData.email,
        telefono: formData.telefono,
        username: formData.email,
        password: formData.password,
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
      await reenviarVerificacionCuenta({ idUsuario: usuarioId, nuevoCorreo: newEmailInput })
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0c0d09]">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "url('/logo-box-bravos-final.png')", backgroundSize: '50%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
        />
        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-2xl border border-lime-400/20 bg-background p-8 shadow-2xl text-center space-y-5">
            <div className="mx-auto h-20 w-20 rounded-full bg-lime-400/10 border border-lime-400/30 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-lime-400" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-foreground tracking-tight">¡Cuenta creada!</h2>
              <p className="text-muted-foreground text-sm mt-1">Verificá tu correo para activarla</p>
            </div>

            <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Enviamos el link a</p>
              {!isEditingEmail ? (
                <div className="space-y-1">
                  <p className="font-bold text-lime-400 text-base">{formData.email}</p>
                  <button
                    onClick={() => { setIsEditingEmail(true); setNewEmailInput(formData.email) }}
                    className="text-xs text-muted-foreground underline hover:text-foreground transition-colors"
                  >
                    ¿Te equivocaste? Cambiar correo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 mt-1">
                  <Input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="h-9 text-center bg-background text-sm"
                    placeholder="tu@correo.com"
                  />
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => setIsEditingEmail(false)} disabled={isUpdatingEmail}>
                      Cancelar
                    </Button>
                    <Button size="sm" className="bg-lime-400 text-black hover:bg-lime-300 font-bold" onClick={handleUpdateEmail} disabled={isUpdatingEmail}>
                      {isUpdatingEmail ? 'Guardando...' : 'Confirmar y Reenviar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Revisá tu bandeja de entrada y hacé clic en el enlace para activar tu cuenta.
            </p>

            <Link to="/login" className="block">
              <Button className="w-full h-11 bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wider text-sm">
                Ir al inicio de sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Formulario ──
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0c0d09]">

      {/* Panel izquierdo — branding */}
      <div className="relative hidden lg:flex lg:w-5/12 flex-col justify-between p-12 overflow-hidden flex-shrink-0 anim-from-left">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "url('/logo-box-bravos-final.png')", backgroundSize: '60%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-lime-400/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-lime-400/40 to-transparent" />

        <div className="relative z-10 flex items-center gap-4">
          <img src="/logo.jpg" alt="Bravos Gym" className="h-12 w-12 rounded-xl" />
          <div>
            <p className="text-xs font-bold tracking-[0.3em] text-lime-400 uppercase">Bravos</p>
            <p className="text-[10px] tracking-[0.2em] text-white/40 uppercase">Box & Gym</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-5xl font-black text-white leading-none tracking-tight">
              UNITE AL<br />
              <span className="text-lime-400">BOX</span>
            </h1>
            <p className="mt-4 text-white/50 text-base leading-relaxed max-w-xs">
              Creá tu cuenta y empezá a gestionar tus clases, créditos y progreso desde el día uno.
            </p>
          </div>

          <div className="space-y-3">
            {STEPS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-lime-400/10 border border-lime-400/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-lime-400" />
                </div>
                <span className="text-sm text-white/60 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-[11px] text-white/20 tracking-widest uppercase">© 2026 Bravos Box</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col bg-background min-h-screen lg:min-h-0 anim-from-right">
        {/* Header mobile */}
        <div className="flex items-center justify-between p-5 lg:hidden border-b border-border">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Bravos" className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-black tracking-widest text-foreground">BRAVOS</span>
          </div>
          <div className="w-16" />
        </div>

        {/* Formulario scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-start justify-center p-6 lg:p-12 min-h-full">
            <div className="w-full max-w-sm py-2">

              {/* Volver — solo desktop */}
              <button
                onClick={() => navigate(-1)}
                className="hidden lg:flex mb-8 items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al sitio
              </button>

              <div className="mb-7 anim-fade-up anim-delay-150">
                <h2 className="text-3xl font-black text-foreground tracking-tight">Crear cuenta</h2>
                <p className="mt-1 text-muted-foreground text-sm">Completá tus datos para registrarte</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Nombre */}
                <div className="space-y-1.5">
                  <label htmlFor="nombre" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="nombre" type="text" placeholder="Juan Pérez"
                      autoComplete="name"
                      className={`pl-10 h-11 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 ${errors.nombre ? 'border-destructive' : ''}`}
                      value={formData.nombre} onChange={set('nombre')}
                    />
                  </div>
                  {errors.nombre && <p className="text-xs text-destructive">{errors.nombre}</p>}
                </div>

                {/* DNI + Teléfono en fila */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="dni" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">DNI</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="dni" type="text" placeholder="12345678"
                        className={`pl-10 h-11 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 ${errors.dni ? 'border-destructive' : ''}`}
                        value={formData.dni} onChange={set('dni')}
                      />
                    </div>
                    {errors.dni && <p className="text-xs text-destructive">{errors.dni}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="telefono" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="telefono" type="tel" placeholder="1123456789"
                        autoComplete="tel"
                        className={`pl-10 h-11 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 ${errors.telefono ? 'border-destructive' : ''}`}
                        value={formData.telefono} onChange={set('telefono')}
                      />
                    </div>
                    {errors.telefono && <p className="text-xs text-destructive">{errors.telefono}</p>}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email" type="email" placeholder="tu@email.com"
                      autoComplete="email"
                      className={`pl-10 h-11 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 ${errors.email ? 'border-destructive' : ''}`}
                      value={formData.email} onChange={set('email')}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                {/* Contraseña */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      className={`pl-10 pr-10 h-11 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 ${errors.password ? 'border-destructive' : ''}`}
                      value={formData.password} onChange={set('password')}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>

                {/* Confirmar contraseña */}
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Repetí tu contraseña"
                      autoComplete="new-password"
                      className={`pl-10 pr-10 h-11 bg-muted/50 border-border focus-visible:ring-lime-400/50 focus-visible:border-lime-400 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                      value={formData.confirmPassword} onChange={set('confirmPassword')}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 mt-1 bg-lime-400 hover:bg-lime-300 text-black font-black tracking-wider uppercase text-sm transition-all active:scale-[0.98]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...</>
                  ) : 'Crear mi cuenta'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground">¿Ya tenés cuenta?</span>
                </div>
              </div>

              <Link
                to="/login"
                className="flex items-center justify-center w-full h-11 rounded-lg border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistroPage
