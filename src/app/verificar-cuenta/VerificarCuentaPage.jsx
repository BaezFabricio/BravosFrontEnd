import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/vv1';

function VerificarCuentaPage() {
  const { token: tokenEnRuta } = useParams();
  const [searchParams] = useSearchParams();
  const token = tokenEnRuta || searchParams.get('token') || '';
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [mensaje, setMensaje] = useState('');

useEffect(() => {
    let unmounted = false;

    const verificarToken = async () => {
      if (!token) {
        if (!unmounted) {
          setStatus('error');
          setMensaje('No encontramos un token de verificación en el enlace.');
        }
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/auth/verificar/${token}`);

        if (!unmounted) {
          setStatus('success');
          setMensaje(response?.data?.message || '¡Tu cuenta ha sido activada con éxito!');
        }
      } catch (error) {
        if (!unmounted) {
          const statusCode = error.response?.status;
          const errorCode = error.response?.data?.errorCode;

          if (statusCode === 400 || statusCode === 409 || errorCode === 'INVALID_TOKEN') {
            setStatus('success');
            setMensaje('¡Tu cuenta ya se encuentra verificada y lista para usar!');
          } else {
            setStatus('error');
            setMensaje(error.response?.data?.message || 'El enlace de verificación es inválido o ya expiró.');
          }
        }
      }
    };

    verificarToken();

    return () => {
      unmounted = true;
    };
  }, [token]);

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
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-4xl text-destructive">
              ✕
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Hubo un problema</h2>
            <p className="text-sm text-muted-foreground">{mensaje}</p>
            <Link to="/registro" className="inline-flex h-12 w-full items-center justify-center rounded-md bg-secondary px-6 font-semibold text-foreground transition-colors hover:bg-secondary/80">
              Volver al registro
            </Link>
          </div>
        )}
        </div>
      </div>

      {/* Mini estilo para la animación del spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default VerificarCuentaPage;