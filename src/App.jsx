import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import LandingPage from './app/page.jsx'
import LoginPage from './app/login/page.jsx'
import RecuperarContrasenaPage from './app/recuperar-contraseña/page.jsx'
import AdminLayout from './app/admin/layout.jsx'
import AdminDashboard from './app/admin/page.jsx'
import MembresiasPage from './app/admin/membresias/page.jsx'
import PerfilesPage from './app/admin/perfiles/page.jsx'
import UsuariosPage from './app/admin/usuarios/page.jsx'
import DetalleUsuarioPage from './app/admin/usuarios/[id]/page.jsx'
import NuevoUsuarioPage from './app/admin/usuarios/nuevo/page.jsx'
import EditarUsuarioPage from './app/admin/usuarios/[id]/editar/page.jsx'
import AlumnoLayout from './app/alumno/layout.jsx'
import AlumnoDashboard from './app/alumno/page.jsx'
import AlumnoReservarPage from './app/alumno/reservar/page.jsx'
import AlumnoReservasPage from './app/alumno/reservas/page.jsx'
import AlumnoCreditosPage from './app/alumno/creditos/page.jsx'
import AlumnoPerfilPage from './app/alumno/perfil/page.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasenaPage />} />
        <Route path="/registro" element={<Navigate to="/login" replace />} />

        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/membresias" element={<AdminLayout><MembresiasPage /></AdminLayout>} />
        <Route path="/admin/perfiles" element={<AdminLayout><PerfilesPage /></AdminLayout>} />
        <Route path="/admin/usuarios" element={<AdminLayout><UsuariosPage /></AdminLayout>} />
        <Route path="/admin/usuarios/nuevo" element={<AdminLayout><NuevoUsuarioPage /></AdminLayout>} />
        <Route path="/admin/usuarios/:id" element={<AdminLayout><DetalleUsuarioPage /></AdminLayout>} />
        <Route path="/admin/usuarios/:id/editar" element={<AdminLayout><EditarUsuarioPage /></AdminLayout>} />

        <Route path="/alumno" element={<AlumnoLayout><AlumnoDashboard /></AlumnoLayout>} />
        <Route path="/alumno/reservar" element={<AlumnoLayout><AlumnoReservarPage /></AlumnoLayout>} />
        <Route path="/alumno/reservas" element={<AlumnoLayout><AlumnoReservasPage /></AlumnoLayout>} />
        <Route path="/alumno/creditos" element={<AlumnoLayout><AlumnoCreditosPage /></AlumnoLayout>} />
        <Route path="/alumno/perfil" element={<AlumnoLayout><AlumnoPerfilPage /></AlumnoLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App