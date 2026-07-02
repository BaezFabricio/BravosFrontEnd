import axios from 'axios'

// URL base configurable para evitar hardcodear localhost (soporta móvil/LAN)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/vv1'

const normalizeText = (value, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback
  }

  const text = String(value).trim()
  return text || fallback
}

export const normalizarUsuario = (usuario = {}) => {
  const perfil = normalizeText(usuario.perfil ?? usuario.rol ?? usuario.tipo, 'alumno').toLowerCase()
  const estado = normalizeText(usuario.estado, 'activo').toLowerCase()
  const membresia = normalizeText(usuario.membresia, 'vencida').toLowerCase()
  const idNormalizado =
    usuario.id ??
    usuario.idUsuario ??
    usuario.id_usuario ??
    usuario.usuarioId ??
    usuario.usuario_id ??
    usuario._id ??
    normalizeText(usuario.email ?? usuario.correo ?? usuario.dni, 'sin-id')

  return {
    ...usuario,
    id: idNormalizado,
    nombre: normalizeText(usuario.nombre ?? usuario.nombrecompleto ?? usuario.fullName ?? usuario.username),
    dni: normalizeText(usuario.dni ?? usuario.documento),
    email: normalizeText(usuario.email ?? usuario.correo),
    telefono: normalizeText(usuario.telefono ?? usuario.celular ?? usuario.phone),
    perfil,
    estado,
    membresia,
    creditos: Number(usuario.creditos ?? usuario.creditosDisponibles ?? 0),
  }
}

const normalizarRespuestaUsuarios = (data) => {
  const usuarios = data?.usuarios ?? data?.data?.usuarios ?? data?.rows ?? data?.data?.rows ?? data?.data ?? data

  if (!Array.isArray(usuarios)) {
    return []
  }

  return usuarios.map(normalizarUsuario)
}

const construirPayloadUsuario = (usuarioData = {}) => ({
  nombre: usuarioData.nombre,
  nombrecompleto: usuarioData.nombre,
  dni: usuarioData.dni,
  email: usuarioData.email,
  correo: usuarioData.email,
  telefono: usuarioData.telefono,
  perfil: usuarioData.perfil,
  rol: usuarioData.perfil,
  tipo: usuarioData.perfil,
  password: usuarioData.password,
  creditos: usuarioData.creditos,
  estado: usuarioData.estado,
  membresia: usuarioData.membresia,
})

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

    if (error.response?.status === 401) {
      console.warn("Sesión expirada o token inválido, redirigiendo al login...");
      localStorage.clear();
      window.location.href = '/login';
    }
    
    
    if (error.response?.status === 403) {
      console.warn("Acceso denegado: No tienes permiso para esta acción.");
      
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
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
    const response = await apiClient.get('/usuarios', {
      params: { _ts: Date.now() },
    })
    return normalizarRespuestaUsuarios(response.data)
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
    const usuario = response.data?.data || response.data?.usuario || response.data
    return normalizarUsuario(usuario)
  } catch (error) {
    console.error(`Error al obtener usuario ${id}:`, error)
    throw error
  }
}

/**
 * Crea un nuevo usuario
 * POST /auth/registro (fallback: /usuarios)
 */
export const crearUsuario = async (usuarioData) => {
  try {
    const payloadRegistro = {
      nombrecompleto: usuarioData.nombre,
      dni: usuarioData.dni,
      correo: usuarioData.email,
      telefono: usuarioData.telefono,
      username: usuarioData.email,
      password: usuarioData.password,
    }

    try {
      const responseRegistro = await apiClient.post('/auth/registro', payloadRegistro)
      const idUsuario =
        responseRegistro?.data?.data?.usuario?.idUsuario ??
        responseRegistro?.data?.usuario?.idUsuario ??
        responseRegistro?.data?.idUsuario

      if (idUsuario && (usuarioData.perfil || usuarioData.creditos !== undefined || usuarioData.estado || usuarioData.membresia)) {
        try {
          await apiClient.put(`/usuarios/${idUsuario}`, construirPayloadUsuario(usuarioData))
        } catch (syncError) {
          console.warn('Usuario creado en auth, pero no se pudieron sincronizar campos extra:', syncError)
        }
      }

      return responseRegistro.data
    } catch (errorRegistro) {
      if (errorRegistro.response?.status === 404 || errorRegistro.response?.status === 405) {
        const responseFallback = await apiClient.post('/usuarios', {
          nombrecompleto: usuarioData.nombre,
          nombre: usuarioData.nombre,
          dni: usuarioData.dni,
          correo: usuarioData.email,
          email: usuarioData.email,
          username: usuarioData.email,
          telefono: usuarioData.telefono,
          password: usuarioData.password,
          perfil: usuarioData.perfil,
          rol: usuarioData.perfil,
          creditos: usuarioData.creditos,
          estado: usuarioData.estado,
          membresia: usuarioData.membresia,
        })
        return responseFallback.data
      }

      throw errorRegistro
    }
  } catch (error) {
    if (error.response?.status !== 409) {
      console.error('Error al crear usuario:', error)
    }
    throw error
  }
}

/**
 * Actualiza un usuario existente
 * PUT /usuarios/:id
 */
export const actualizarUsuario = async (id, usuarioData) => {
  try {
    const response = await apiClient.put(`/usuarios/${id}`, construirPayloadUsuario(usuarioData))
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
 * Reenvía el correo de verificación para una cuenta existente o recién creada
 * POST /auth/reenviar-verificacion
 */
export const reenviarVerificacionCuenta = async ({ idUsuario, correo, nuevoCorreo } = {}) => {
  try {
    const payload = {}

    if (idUsuario !== undefined && idUsuario !== null && idUsuario !== '') {
      payload.idUsuario = idUsuario
    }

    if (correo !== undefined && correo !== null && correo !== '') {
      payload.correo = correo
    }

    if (nuevoCorreo !== undefined && nuevoCorreo !== null && nuevoCorreo !== '') {
      payload.nuevoCorreo = nuevoCorreo
    }

    const response = await apiClient.post('/auth/reenviar-verificacion', payload)
    return response.data
  } catch (error) {
    console.error('Error al reenviar verificación de cuenta:', error)
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

const buildApiRoute = (endpoint) => `http://localhost:3001/api/vv1${endpoint}`

export const getAbonosUsuario = async (idUsuario) => {
  const token = localStorage.getItem('token')

  const response = await fetch(buildApiRoute(`/usuarios/${idUsuario}/abonos`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return []
    }
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Error al obtener abonos')
  }

  const data = await response.json().catch(() => ({}))
  const result = data.data ?? data
  return Array.isArray(result) ? result : []
}

export const crearAbonoUsuario = async (idUsuario, abono) => {
  const token = localStorage.getItem('token')

  const response = await fetch(buildApiRoute(`/usuarios/${idUsuario}/abonos`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(abono),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Error al crear abono')
  }

  return data
}

export const editarAbonoUsuario = async (idUsuario, idCredito, abono) => {
  const token = localStorage.getItem('token')

  const response = await fetch(buildApiRoute(`/usuarios/${idUsuario}/abonos/${idCredito}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(abono),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Error al editar abono')
  }

  return data
}

export const cancelarAbonoUsuario = async (idUsuario, idCredito) => {
  const token = localStorage.getItem('token')

  const response = await fetch(buildApiRoute(`/usuarios/${idUsuario}/abonos/${idCredito}`), {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || 'Error al cancelar abono')
  }

  return data
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


// ============================================
// FUNCIONES DE API - MEMBRESÍAS
// ====

export const getClasesProfesor = (idProfesor) => {
    return apiClient.get(`/profesores/${idProfesor}/clases`);
};

export default apiClient