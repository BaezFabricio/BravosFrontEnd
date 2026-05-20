import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard, Eye, EyeOff, Loader2, Lock, Mail, Phone, User, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { HelpTooltip } from '@/components/ui/help-tooltip'
import { Input } from '@/components/ui/input'
import { registroUsuario } from '@/api'

function RegistroPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre completo es requerido'
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido'
    } else if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = 'Ingresa un DNI válido (7-8 dígitos)'
    }

    if (!formData.email) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Ingresa un correo electrónico válido'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    } else if (!/^\d{10,15}$/.test(formData.telefono.replace(/\D/g, ''))) {
      newErrors.telefono = 'Ingresa un número de teléfono válido'
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    return newErrors
  }

const handleSubmit = async (event) => {
    event.preventDefault()
    const newErrors = validateForm()

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setIsLoading(true)

    try {
      // Mapeamos los campos para que coincidan EXACTAMENTE con lo que espera tu Backend
      await registroUsuario({
        nombrecompleto: formData.nombre, // Cambiado de 'nombre' a 'nombrecompleto'
        dni: formData.dni,
        correo: formData.email,          // Cambiado de 'email' a 'correo'
        telefono: formData.telefono,
        username: formData.email,        // Usamos el email como username para que no falle el backend
        password: formData.password,
      })

      setIsSuccess(true)
    } catch (err) {
      console.error('Error al registrar:', err)
      const errorMessage = err.response?.data?.message || 'Error de conexión. Intenta de nuevo.'
      setErrors({ general: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center p-4"
        style={{
          backgroundImage: "url('/logo.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/80" />

        <div className="relative z-10 w-full max-w-md">
          <div className="space-y-6 rounded-2xl border border-border bg-card/95 p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground">Registro Exitoso</h2>

            <p className="text-muted-foreground">
              Hemos enviado un correo de verificación a{' '}
              <span className="font-medium text-primary">{formData.email}</span>
            </p>

            <div className="rounded-lg border border-border bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">
                Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.
              </p>
            </div>

            <Link to="/login">
              <Button className="h-12 w-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90">
                Volver al Inicio de Sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center p-4">
      <div
        className="absolute inset-0 flex items-center justify-center opacity-10"
        style={{
          backgroundImage: "url('/logo-box-bravos-final.png')",
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card/95 p-8 shadow-2xl backdrop-blur-sm">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver atrás
          </button>
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold text-primary">BRAVOS GYM</h1>
            <h2 className="text-xl font-semibold text-foreground">Crear Cuenta</h2>
            <p className="mt-2 text-sm text-muted-foreground">Completa tus datos para registrarte</p>
          </div>

          {errors.general && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="nombre" className="text-sm font-medium text-foreground">
                  Nombre Completo
                </label>
                <HelpTooltip content="Ingresa tu nombre y apellido completo tal como aparece en tu documento de identidad." />
              </div>
              <div className="relative">
                <User className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Juan Pérez"
                  className={`h-11 bg-secondary pl-10 ${errors.nombre ? 'border-destructive' : 'border-border'} focus:border-primary`}
                  value={formData.nombre}
                  onChange={(event) => setFormData({ ...formData, nombre: event.target.value })}
                />
              </div>
              {errors.nombre && <p className="text-sm text-destructive">{errors.nombre}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="dni" className="text-sm font-medium text-foreground">
                  DNI
                </label>
                <HelpTooltip content="Ingresa tu numero de documento sin puntos ni guiones. Solo los 7 u 8 digitos." />
              </div>
              <div className="relative">
                <CreditCard className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <Input
                  id="dni"
                  type="text"
                  placeholder="12345678"
                  className={`h-11 bg-secondary pl-10 ${errors.dni ? 'border-destructive' : 'border-border'} focus:border-primary`}
                  value={formData.dni}
                  onChange={(event) => setFormData({ ...formData, dni: event.target.value })}
                />
              </div>
              {errors.dni && <p className="text-sm text-destructive">{errors.dni}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Correo Electronico
                </label>
                <HelpTooltip content="Usaremos este correo para enviarte notificaciones sobre tus clases, pagos y novedades del gimnasio." />
              </div>
              <div className="relative">
                <Mail className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className={`h-11 bg-secondary pl-10 ${errors.email ? 'border-destructive' : 'border-border'} focus:border-primary`}
                  value={formData.email}
                  onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                />
              </div>
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="telefono" className="text-sm font-medium text-foreground">
                  Telefono
                </label>
                <HelpTooltip content="Numero de celular con codigo de area. Lo usaremos para contactarte por WhatsApp si es necesario." />
              </div>
              <div className="relative">
                <Phone className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+54 11 1234 5678"
                  className={`h-11 bg-secondary pl-10 ${errors.telefono ? 'border-destructive' : 'border-border'} focus:border-primary`}
                  value={formData.telefono}
                  onChange={(event) => setFormData({ ...formData, telefono: event.target.value })}
                />
              </div>
              {errors.telefono && <p className="text-sm text-destructive">{errors.telefono}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Contrasena
                </label>
                <HelpTooltip content="Crea una contrasena segura de al menos 8 caracteres. Te recomendamos usar letras, numeros y simbolos." />
              </div>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  className={`h-11 bg-secondary pl-10 pr-10 ${errors.password ? 'border-destructive' : 'border-border'} focus:border-primary`}
                  value={formData.password}
                  onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirmar Contrasena
                </label>
                <HelpTooltip content="Vuelve a escribir tu contrasena para confirmar que la ingresaste correctamente." />
              </div>
              <div className="relative">
                <Lock className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  className={`h-11 bg-secondary pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : 'border-border'} focus:border-primary`}
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData({ ...formData, confirmPassword: event.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="submit"
              className="mt-2 h-12 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-medium text-primary transition-colors hover:text-primary/80">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistroPage
