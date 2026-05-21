import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function VerificarCuentaPage() {
  const { token } = useParams(); // Agarramos el token de la URL de React
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [mensaje, setMensaje] = useState('');

useEffect(() => {
    let unmounted = false;

    const verificarToken = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/vv1/auth/verificar/${token}`);
        
        if (!unmounted && response.data.status === 'success') {
          setStatus('success');
          setMensaje('¡Tu cuenta ha sido activada con éxito!');
        }
      } catch (error) {
        if (!unmounted) {
          if (error.response?.status === 400 || error.response?.data?.errorCode === 'INVALID_TOKEN') {
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', letterSpacing: '1px' }}>BRAVOS GYM 🏋️‍♂️</h1>

        {status === 'loading' && (
          <div>
            <div style={{ border: '4px solid #333', borderTop: '4px solid #2e7d32', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '20px auto' }}></div>
            <p style={{ color: '#aaa' }}>Procesando tu activación, aguardá un instante...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ fontSize: '50px', color: '#4caf50', marginBottom: '15px' }}>✓</div>
            <h2 style={{ color: '#4caf50', marginBottom: '10px' }}>¡Cuenta Activada!</h2>
            <p style={{ color: '#ccc', marginBottom: '25px', fontSize: '14px' }}>{mensaje}</p>
            <Link to="/login" style={{ display: 'inline-block', backgroundColor: '#2e7d32', color: '#fff', padding: '12px 30px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold', uppercase: 'true', width: '80%' }}>
              Iniciar Sesión
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ fontSize: '50px', color: '#f44336', marginBottom: '15px' }}>✕</div>
            <h2 style={{ color: '#f44336', marginBottom: '10px' }}>Hubo un problema</h2>
            <p style={{ color: '#ccc', marginBottom: '25px', fontSize: '14px' }}>{mensaje}</p>
            <Link to="/registro" style={{ display: 'inline-block', backgroundColor: '#333', color: '#fff', padding: '12px 30px', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold', width: '80%' }}>
              Volver al Registro
            </Link>
          </div>
        )}
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