import axios from 'axios'

// 🧠 URL base del backend configurada para la versión vv1
const API_BASE_URL = 'http://localhost:3001/api/vv1'

// Crear instancia de Axios con configuración por defecto
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    // ✨ SOLUCIÓN: Cambiado a 'token' para que coincida exactamente con lo que guardás en el Login
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejo de errores global
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Si el backend nos rebota por token inválido o vencido, limpiamos y mandamos a loguear
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================
// FUNCIONES DE API - USUARIOS
// ============================================

/**
 * Obtiene la lista de todos los usuarios
 * GET /usuarios
 */
export const getUsuarios = async () => {
  try {
    const response = await apiClient.get('/usuarios')
    // 🧠 Si tu backend envuelve la respuesta en { ok: true, usuarios: [...] }, adaptamos el retorno:
    return response.data.usuarios || response.data
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    throw error
  }
}

/**
 * Obtiene un usuario por ID
 * GET /usuarios/:id
 */
export const getUsuarioById = async (id) => {
  try {
    const response = await apiClient.get(`/usuarios/${id}`)
    return response.data.usuario || response.data
  } catch (error) {
    console.error(`Error al obtener usuario ${id}:`, error)
    throw error
  }
}

/**
 * Crea un nuevo usuario
 * POST /usuarios
 */
export const crearUsuario = async (usuarioData) => {
  try {
    const response = await apiClient.post('/usuarios', usuarioData)
    return response.data
  } catch (error) {
    console.error('Error al crear usuario:', error)
    throw error
  }
}

/**
 * Actualiza un usuario existente
 * PUT /usuarios/:id
 */
export const actualizarUsuario = async (id, usuarioData) => {
  try {
    const response = await apiClient.put(`/usuarios/${id}`, usuarioData)
    return response.data
  } catch (error) {
    console.error(`Error al actualizar usuario ${id}:`, error)
    throw error
  }
}

/**
 * Cambia el estado de un usuario
 * PUT /usuarios/:id/estado
 */
export const cambiarEstadoUsuario = async (id, estado) => {
  try {
    const response = await apiClient.put(`/usuarios/${id}/estado`, { estado })
    return response.data
  } catch (error) {
    console.error(`Error al cambiar estado del usuario ${id}:`, error)
    throw error
  }
}

/**
 * Elimina un usuario
 * DELETE /usuarios/:id
 */
export const eliminarUsuario = async (id) => {
  try {
    const response = await apiClient.delete(`/usuarios/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error al eliminar usuario ${id}:`, error)
    throw error
  }
}

// ============================================
// FUNCIONES DE API - AUTENTICACIÓN
// ============================================

/**
 * Registra un nuevo usuario (alumno)
 * POST /auth/registro
 */
export const registroUsuario = async (datosRegistro) => {
  try {
    const response = await apiClient.post('/auth/registro', datosRegistro)
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  } catch (error) {
    console.error('Error al registrar usuario:', error)
    throw error
  }
}

/**
 * Login de usuario
 * POST /auth/login
 */
export const loginUsuario = async (correo, password) => {
  try {
    // Ajustado a 'correo' para que coincida con tu req.body de Node.js
    const response = await apiClient.post('/auth/login', { correo, password })
    
    // Si viene la info anidada en data, guardamos el token
    const data = response.data.data || response.data;
    
    if (data.token) {
      localStorage.setItem('token', data.token)
    }
    return data
  } catch (error) {
    console.error('Error al iniciar sesión:', error)
    throw error
  }
}

/**
 * Logout del usuario
 */
export const logoutUsuario = () => {
  localStorage.removeItem('token')
  window.location.href = '/login'
}

// ============================================
// FUNCIONES DE API - RECUPERACIÓN DE CONTRASEÑA
// ============================================

/**
 * Enviar código de verificación al correo
 * POST /auth/recuperar-contrasena  { email, action: 'send_code' }
 */
export const enviarCodigoRecuperacion = async (email) => {
  try {
    const response = await apiClient.post('/auth/recuperar-contrasena', { email, action: 'send_code' })
    return response.data
  } catch (error) {
    console.error('Error al enviar código de recuperación:', error)
    throw error
  }
}

/**
 * Verificar código de recuperación
 * POST /auth/recuperar-contrasena  { email, code, action: 'verify_code' }
 */
export const verificarCodigoRecuperacion = async (email, code) => {
  try {
    const response = await apiClient.post('/auth/recuperar-contrasena', { email, code, action: 'verify_code' })
    return response.data
  } catch (error) {
    console.error('Error al verificar código de recuperación:', error)
    throw error
  }
}

/**
 * Resetear la contraseña
 * POST /auth/recuperar-contrasena  { email, code, password, action: 'reset_password' }
 */
export const resetearContrasena = async (email, code, password) => {
  try {
    const response = await apiClient.post('/auth/recuperar-contrasena', { email, code, password, action: 'reset_password' })
    return response.data
  } catch (error) {
    console.error('Error al resetear contraseña:', error)
    throw error
  }
}

// ============================================
// FUNCIONES DE API - MEMBRESÍAS
// ============================================

export const getMembresiasUsuario = async (id) => {
  try {
    const response = await apiClient.get(`/usuarios/${id}/membresias`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener membresías del usuario ${id}:`, error)
    throw error
  }
}

export const crearMembresia = async (usuarioId, membresiasData) => {
  try {
    const response = await apiClient.post(`/usuarios/${usuarioId}/membresias`, membresiasData)
    return response.data
  } catch (error) {
    console.error(`Error al crear membresía para usuario ${usuarioId}:`, error)
    throw error
  }
}

// ============================================
// FUNCIONES DE API - CRÉDITOS
// ============================================

export const getCreditosUsuario = async (id) => {
  try {
    const response = await apiClient.get(`/usuarios/${id}/creditos`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener créditos del usuario ${id}:`, error)
    throw error
  }
}

export const actualizarCreditosUsuario = async (id, creditos) => {
  try {
    const response = await apiClient.put(`/usuarios/${id}/creditos`, { creditos })
    return response.data
  } catch (error) {
    console.error(`Error al actualizar créditos del usuario ${id}:`, error)
    throw error
  }
}

export default apiClient