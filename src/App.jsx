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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="/inicio" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasenaPage />} />
        <Route path="/registro" element={<RegistroPage />} />

        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/membresias" element={<AdminLayout><MembresiasPage /></AdminLayout>} />
        <Route path="/admin/perfiles" element={<AdminLayout><PerfilesPage /></AdminLayout>} />
        <Route path="/admin/usuarios" element={<AdminLayout><UsuariosPage /></AdminLayout>} />
        <Route path="/admin/usuarios/nuevo" element={<AdminLayout><NuevoUsuarioPage /></AdminLayout>} />
        <Route path="/admin/usuarios/:id" element={<AdminLayout><DetalleUsuarioPage /></AdminLayout>} />
        <Route path="/admin/usuarios/:id/editar" element={<AdminLayout><EditarUsuarioPage /></AdminLayout>} />

        <Route path="/alumno" element={<AlumnoLayout><AlumnoDashboard /></AlumnoLayout>} />
          {/* Clases */}
          <Route path="/admin/clases" element={<AdminLayout><ClasesPage /></AdminLayout>} />
          <Route path="/admin/clases/nueva" element={<AdminLayout><NuevaClasePage /></AdminLayout>} />
          <Route path="/admin/clases/:id/editar" element={<AdminLayout><EditarClasePage /></AdminLayout>} />
          <Route path="/admin/clases/turnos" element={<AdminLayout><TurnosPage /></AdminLayout>} />

        <Route path="/alumno/reservar" element={<AlumnoLayout><AlumnoReservarPage /></AlumnoLayout>} />
        <Route path="/alumno/reservas" element={<AlumnoLayout><AlumnoReservasPage /></AlumnoLayout>} />
        <Route path="/alumno/creditos" element={<AlumnoLayout><AlumnoCreditosPage /></AlumnoLayout>} />
        <Route path="/alumno/perfil" element={<AlumnoLayout><AlumnoPerfilPage /></AlumnoLayout>} />

        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App