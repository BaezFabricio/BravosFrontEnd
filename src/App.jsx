import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import LandingPage from './app/LandingPage.jsx'
import LoginPage from './app/login/LoginPage.jsx'
import RegistroPage from './app/registro/RegistroPage.jsx'
import RecuperarContrasenaPage from './app/recuperar-contraseña/RecuperarContrasenaPage.jsx'

import AdminLayout from './app/admin/layout.jsx'
import AdminDashboard from './app/admin/AdminDashboard.jsx'
import MembresiasPage from './app/admin/membresias/MembresiasPage.jsx'
import PerfilesPage from './app/admin/perfiles/PerfilesPage.jsx'
import UsuariosPage from './app/admin/usuarios/UsuariosPage.jsx'
import DetalleUsuarioPage from './app/admin/usuarios/[id]/DetalleUsuarioPage.jsx'
import NuevoUsuarioPage from './app/admin/usuarios/nuevo/NuevoUsuarioPage.jsx'
import EditarUsuarioPage from './app/admin/usuarios/[id]/editar/EditarUsuarioPage.jsx'
import ConfiguracionLandingPage from './app/admin/configuracion/ConfiguracionLandingPage.jsx'

import ClasesPage from './app/admin/clases/ClasesPage.jsx'
import NuevaClasePage from './app/admin/clases/NuevaClasePage.jsx'
import EditarClasePage from './app/admin/clases/EditarClasePage.jsx'
import TurnosPage from './app/admin/clases/TurnosPage.jsx'

import AlumnoLayout from './app/alumno/layout.jsx'
import AlumnoDashboard from './app/alumno/AlumnoDashboard.jsx'
import AlumnoReservarPage from './app/alumno/reservar/ReservarPage.jsx'
import AlumnoReservasPage from './app/alumno/reservas/ReservasPage.jsx'
import AlumnoCreditosPage from './app/alumno/creditos/CreditosPage.jsx'
import AlumnoPerfilPage from './app/alumno/perfil/PerfilPage.jsx'

import VerificarCuentaPage from './app/verificar-cuenta/VerificarCuentaPage.jsx'

function RequireAuth({ children, allowedRoles }) {
  const token = localStorage.getItem('token')
  const usuarioRaw = localStorage.getItem('usuario')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return children
  }

  try {
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null
    const perfil = (usuario?.perfil || usuario?.rol || usuario?.tipo || '').toLowerCase()

    if (allowedRoles.includes(perfil)) {
      return children
    }
  } catch (error) {
    console.error('Error al validar el usuario autenticado:', error)
  }

  return <Navigate to="/inicio" replace />
}

function SharedProfileRoute({ children }) {
  const usuarioRaw = localStorage.getItem('usuario')

  try {
    const usuario = usuarioRaw ? JSON.parse(usuarioRaw) : null
    const perfil = (usuario?.perfil || usuario?.rol || usuario?.tipo || '').toLowerCase()

    if (perfil === 'admin' || perfil === 'administrador') {
      return <AdminLayout>{children}</AdminLayout>
    }

    if (perfil === 'alumno') {
      return <AlumnoLayout>{children}</AlumnoLayout>
    }

    return (
      <div className="min-h-screen bg-background">
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    )
  } catch (error) {
    console.error('Error al resolver el layout del perfil:', error)

    return (
      <div className="min-h-screen bg-background">
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    )
  }
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS PÚBLICAS */}
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="/inicio" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasenaPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/verificar-cuenta" element={<VerificarCuentaPage />} />
        <Route path="/verificar-cuenta/:token" element={<VerificarCuentaPage />} />

        {/* RUTAS DE ADMINISTRADOR */}
        <Route
          path="/admin"
          element={
            <RequireAuth allowedRoles={["admin", "administrador"]}>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/membresias"
          element={
            <RequireAuth allowedRoles={["admin", "administrador"]}>
              <AdminLayout>
                <MembresiasPage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/perfiles"
          element={
            <RequireAuth allowedRoles={["admin", "administrador"]}>
              <AdminLayout>
                <PerfilesPage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/usuarios"
          element={
            <RequireAuth allowedRoles={["admin", "administrador"]}>
              <AdminLayout>
                <UsuariosPage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/usuarios/nuevo"
          element={
            <RequireAuth allowedRoles={["admin", "administrador"]}>
              <AdminLayout>
                <NuevoUsuarioPage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/usuarios/:id"
          element={
            <RequireAuth allowedRoles={["admin", "administrador"]}>
              <AdminLayout>
                <DetalleUsuarioPage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/usuarios/:id/editar"
          element={
            <RequireAuth allowedRoles={["admin", "administrador"]}>
              <AdminLayout>
                <EditarUsuarioPage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/admin/configuracion"
          element={
            <RequireAuth allowedRoles={["admin", "administrador"]}>
              <AdminLayout>
                <ConfiguracionLandingPage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        {/* RUTAS DE CLASES - ADMIN */}
        

        <Route
          path="/admin/clases/turnos"
          element={
            <RequireAuth allowedRoles={["admin", "administrador"]}>
              <AdminLayout>
                <TurnosPage />
              </AdminLayout>
            </RequireAuth>
          }
        />

        <Route
  path="/admin/clases"
  element={
    <RequireAuth allowedRoles={["admin", "administrador"]}>
      <AdminLayout>
        <ClasesPage />
      </AdminLayout>
    </RequireAuth>
  }
/>

<Route
  path="/admin/clases/nueva"
  element={
    <RequireAuth allowedRoles={["admin", "administrador"]}>
      <AdminLayout>
        <NuevaClasePage />
      </AdminLayout>
    </RequireAuth>
  }
/>


<Route
  path="/admin/clases/:id/editar"
  element={
    <RequireAuth allowedRoles={["admin", "administrador"]}>
      <AdminLayout>
        <EditarClasePage />
      </AdminLayout>
    </RequireAuth>
  }
/>

        {/* RUTAS DE ALUMNO */}
        <Route
          path="/alumno"
          element={
            <RequireAuth allowedRoles={["alumno"]}>
              <AlumnoLayout>
                <AlumnoDashboard />
              </AlumnoLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/alumno/reservar"
          element={
            <RequireAuth allowedRoles={["alumno"]}>
              <AlumnoLayout>
                <AlumnoReservarPage />
              </AlumnoLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/alumno/reservas"
          element={
            <RequireAuth allowedRoles={["alumno"]}>
              <AlumnoLayout>
                <AlumnoReservasPage />
              </AlumnoLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/alumno/creditos"
          element={
            <RequireAuth allowedRoles={["alumno"]}>
              <AlumnoLayout>
                <AlumnoCreditosPage />
              </AlumnoLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/alumno/perfil"
          element={
            <RequireAuth allowedRoles={["alumno"]}>
              <AlumnoLayout>
                <AlumnoPerfilPage />
              </AlumnoLayout>
            </RequireAuth>
          }
        />

        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <SharedProfileRoute>
                <AlumnoPerfilPage />
              </SharedProfileRoute>
            </RequireAuth>
          }
        />

        {/* RUTA POR DEFECTO */}
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App