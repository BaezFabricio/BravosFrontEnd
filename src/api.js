import axios from 'axios'

// URL base del backend - Cambia esto según tu entorno
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Crear instancia de Axios con configuración por defecto
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token de autenticación (si lo tienes)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
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
    if (error.response?.status === 401) {
      // Redirigir a login si no autorizado
      localStorage.removeItem('authToken')
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
    return response.data
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
    return response.data
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
      localStorage.setItem('authToken', response.data.token)
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
export const loginUsuario = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password })
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token)
    }
    return response.data
  } catch (error) {
    console.error('Error al iniciar sesión:', error)
    throw error
  }
}

/**
 * Logout del usuario
 */
export const logoutUsuario = () => {
  localStorage.removeItem('authToken')
  window.location.href = '/login'
}

// ============================================
// FUNCIONES DE API - MEMBRESÍAS
// ============================================

/**
 * Obtiene las membresías de un usuario
 * GET /usuarios/:id/membresias
 */
export const getMembresiasUsuario = async (id) => {
  try {
    const response = await apiClient.get(`/usuarios/${id}/membresias`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener membresías del usuario ${id}:`, error)
    throw error
  }
}

/**
 * Crea una membresía para un usuario
 * POST /usuarios/:id/membresias
 */
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

/**
 * Obtiene los créditos de un usuario
 * GET /usuarios/:id/creditos
 */
export const getCreditosUsuario = async (id) => {
  try {
    const response = await apiClient.get(`/usuarios/${id}/creditos`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener créditos del usuario ${id}:`, error)
    throw error
  }
}

/**
 * Actualiza los créditos de un usuario
 * PUT /usuarios/:id/creditos
 */
export const actualizarCreditosUsuario = async (id, creditos) => {
  try {
    const response = await apiClient.put(`/usuarios/${id}/creditos`, { creditos })
    return response.data
  } catch (error) {
    console.error(`Error al actualizar créditos del usuario ${id}:`, error)
    throw error
  }
}

// Exportar la instancia de apiClient para casos especiales
export default apiClient
