import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { reenviarVerificacionCuenta } from '@/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/vv1'

function VerificarCuentaPage() {
  const { token: tokenEnRuta } = useParams()
  const [searchParams] = useSearchParams()
  const token = tokenEnRuta || searchParams.get('token') || ''
  const [status, setStatus] = useState(token ? 'ready' : 'error')
  const [mensaje, setMensaje] = useState('')
  const [isVerificando, setIsVerificando] = useState(false)
  const [correo, setCorreo] = useState('')
  const [isReenviando, setIsReenviando] = useState(false)
  const [reenviadoMensaje, setReenviadoMensaje] = useState('')
  const [reenviadoError, setReenviadoError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMensaje('No encontramos un token de verificación en el enlace.')
      return
    }

    setStatus('ready')
    setMensaje('Para evitar verificaciones automáticas del correo, confirmá manualmente tu cuenta con el botón de abajo.')
  }, [token]);

  const handleVerificar = async () => {
    if (!token || isVerificando) {
      return
    }

    setIsVerificando(true)
    setMensaje('')

    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verificar/${token}`)
      setStatus('success')
      setMensaje(response?.data?.message || '¡Tu cuenta ha sido activada con éxito!')
    } catch (error) {
      setStatus('error')
      setMensaje(error.response?.data?.message || 'El enlace de verificación es inválido, ya expiró o ya fue utilizado.')
    } finally {
      setIsVerificando(false)
    }
  }

  const handleReenviar = async (event) => {
    event.preventDefault()

    const correoNormalizado = correo.trim().toLowerCase()

    if (!correoNormalizado || !/\S+@\S+\.\S+/.test(correoNormalizado)) {
      setReenviadoError('Ingresá un correo válido para reenviar la verificación.')
      setReenviadoMensaje('')
      return
    }

    setIsReenviando(true)
    setReenviadoError('')
    setReenviadoMensaje('')

    try {
      const response = await reenviarVerificacionCuenta({ correo: correoNormalizado })
      setReenviadoMensaje(response?.message || 'Te enviamos un nuevo enlace de verificación a tu correo.')
    } catch (error) {
      setReenviadoError(error.response?.data?.message || 'No pudimos reenviar el enlace. Revisá el correo e intentá otra vez.')
    } finally {
      setIsReenviando(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
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
        <div className="rounded-2xl border border-border bg-card/95 p-8 text-center shadow-2xl backdrop-blur-sm">
          <h1 className="mb-2 text-3xl font-bold text-primary">BRAVOS BOX</h1>

          {status === 'loading' && (
            <div>
              <div className="mx-auto my-5 h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
              <p className="text-sm text-muted-foreground">Procesando tu activación, aguardá un instante...</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-4xl text-primary">
                !
              </div>
              <h2 className="text-2xl font-semibold text-foreground">Confirmar verificación</h2>
              <p className="text-sm text-muted-foreground">{mensaje}</p>
              <Button type="button" className="h-12 w-full" onClick={handleVerificar} disabled={isVerificando}>
                {isVerificando ? 'Verificando...' : 'Confirmar mi cuenta'}
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-4xl text-primary">
                ✓
              </div>
              <h2 className="text-2xl font-semibold text-foreground">¡Cuenta Activada!</h2>
              <p className="text-sm text-muted-foreground">{mensaje}</p>
              <Link to="/login" className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                Iniciar sesión
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5 text-left">
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-4xl text-destructive">
                  ✕
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Hubo un problema</h2>
                <p className="text-sm text-muted-foreground">{mensaje}</p>
              </div>

              <form className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4" onSubmit={handleReenviar}>
                <div className="space-y-1 text-left">
                  <label htmlFor="correo-reenvio" className="text-sm font-medium text-foreground">
                    Correo para reenviar el enlace
                  </label>
                  <Input
                    id="correo-reenvio"
                    type="email"
                    value={correo}
                    onChange={(event) => setCorreo(event.target.value)}
                    placeholder="tu-correo@ejemplo.com"
                    autoComplete="email"
                  />
                </div>

                {reenviadoError && <p className="text-sm text-destructive">{reenviadoError}</p>}
                {reenviadoMensaje && <p className="text-sm text-emerald-600">{reenviadoMensaje}</p>}

                <Button type="submit" className="h-12 w-full" disabled={isReenviando}>
                  {isReenviando ? 'Reenviando...' : 'Reenviar nuevo enlace'}
                </Button>
              </form>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link to="/registro" className="inline-flex h-12 items-center justify-center rounded-md bg-secondary px-6 font-semibold text-foreground transition-colors hover:bg-secondary/80">
                  Volver al registro
                </Link>
                <Link to="/login" className="inline-flex h-12 items-center justify-center rounded-md border border-border px-6 font-semibold text-foreground transition-colors hover:bg-secondary/50">
                  Ir al login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default VerificarCuentaPage