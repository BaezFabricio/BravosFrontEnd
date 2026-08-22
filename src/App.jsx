import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import LandingPage from './app/LandingPage.jsx'
import LoginPage from './app/login/LoginPage.jsx'
import RegistroPage from './app/registro/RegistroPage.jsx'
import RecuperarContrasenaPage from './app/recuperar-contraseña/RecuperarContrasenaPage.jsx'
import AdminLayout from './app/admin/layout.jsx'
import AdminDashboard from './app/admin/AdminDashboard.jsx'
import PerfilesPage from './app/admin/perfiles/PerfilesPage.jsx'
import UsuariosPage from './app/admin/usuarios/UsuariosPage.jsx'
import DetalleUsuarioPage from './app/admin/usuarios/[id]/DetalleUsuarioPage.jsx'
import NuevoUsuarioPage from './app/admin/usuarios/nuevo/NuevoUsuarioPage.jsx'
import EditarUsuarioPage from './app/admin/usuarios/[id]/editar/EditarUsuarioPage.jsx'
import ConfiguracionLandingPage from './app/admin/configuracion/ConfiguracionLandingPage.jsx' 
import ClasesPage from './app/admin/clases/ClasesPage.jsx'
import EditarClasePage from './app/admin/clases/EditarClasePage.jsx'
import NuevaClasePage from './app/admin/clases/NuevaClasePage.jsx'
import TurnosPage from "./app/admin/clases/TurnosPage.jsx";
import PlanesPage from "./app/admin/planes/PlanesPage.jsx";
import ReportesPage from "./app/admin/reportes/ReportesPage.jsx";


import AlumnoLayout from './app/alumno/layout.jsx'
import AlumnoDashboard from './app/alumno/AlumnoDashboard.jsx'
import AlumnoReservarPage from './app/alumno/reservar/ReservarPage.jsx'
import AlumnoReservasPage from './app/alumno/reservas/ReservasPage.jsx'
import AlumnoCreditosPage from './app/alumno/creditos/CreditosPage.jsx'
import AlumnoPerfilPage from './app/alumno/perfil/PerfilPage.jsx'
import VerificarCuentaPage from './app/verificar-cuenta/VerificarCuentaPage.jsx'

import ProfesorLayout from './app/profesor/ProfesorLayout.jsx'
import ProfesorDashboard from "./app/profesor/ProfesorDashboard"
import ProfesorPerfilPage from './app/profesor/perfil/ProfesorPerfilPage.jsx'
import RutinasPage from "./app/profesor/rutinas/RutinasPage"
import NuevaRutinaPage from './app/profesor/rutinas/nueva/NuevaRutinaPage.jsx'
import DetalleRutinaPage from './app/profesor/rutinas/[id]/DetalleRutinaPage.jsx'

// 🟢 GUARDIÁN DE RUTAS DINÁMICO POR PERMISOS
function RequireAuth({ children, allowedRoles }) {
  const token = localStorage.getItem('token')
  const permisosRaw = localStorage.getItem('permisos')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles || allowedRoles.length === 0) {
    return children
  }

  try {
    const permisos = permisosRaw ? JSON.parse(permisosRaw) : []
    
    const tieneModulosAdmin = permisos.some(p => 
      p.startsWith('usuarios:') || p.startsWith('dashboard:') || 
      p.startsWith('perfiles:') || p.startsWith('membresias:') ||
      p.startsWith('clases:') || p.startsWith('reservas:') ||
      p.startsWith('creditos:') || p.startsWith('configuracion:')
    );
    
    const tieneModulosAlumno = permisos.some(p => p.startsWith('alumno'));
    const tieneModulosProfesor = permisos.some(p => p.startsWith('profesor'));

    if (allowedRoles.includes('admin') || allowedRoles.includes('administrador')) {
      if (tieneModulosAdmin) return children
    }

    if (allowedRoles.includes('alumno')) {
      if (tieneModulosAlumno) return children
    }

    if (allowedRoles.includes('profesor')) {
      if (tieneModulosProfesor) return children
    }
  } catch (error) {
    console.error('Error al validar el usuario autenticado:', error)
  }

  return <Navigate to="/inicio" replace />
}

// 🟢 LAYOUT COMPARTIDO DINÁMICO POR PERMISOS
function SharedProfileRoute({ children }) {
  const permisosRaw = localStorage.getItem('permisos')

  try {
    const permisos = permisosRaw ? JSON.parse(permisosRaw) : []
    const tieneModulosAdmin = permisos.some(p => p.startsWith('usuarios:') || p.startsWith('dashboard:') || p.startsWith('perfiles:'));
    const tieneModulosAlumno = permisos.some(p => p.startsWith('alumno'));
    const tieneModulosProfesor = permisos.some(p => p.startsWith('profesor'));

    if (tieneModulosAdmin) {
      return <AdminLayout>{children}</AdminLayout>
    }

    if (tieneModulosAlumno) {
      return <AlumnoLayout>{children}</AlumnoLayout>
    }

    if (tieneModulosProfesor) {
      return <ProfesorLayout>{children}</ProfesorLayout>
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
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="/inicio" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasenaPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/verificar-cuenta" element={<VerificarCuentaPage />} />
        <Route path="/verificar-cuenta/:token" element={<VerificarCuentaPage />} />

        {/* RUTAS DE ADMINISTRADOR */}
        <Route path="/admin" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><AdminDashboard /></AdminLayout></RequireAuth>} />
        <Route path="/admin/perfiles" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><PerfilesPage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/usuarios" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><UsuariosPage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/usuarios/nuevo" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><NuevoUsuarioPage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/usuarios/:id" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><DetalleUsuarioPage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/usuarios/:id/editar" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><EditarUsuarioPage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/configuracion" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><ConfiguracionLandingPage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/clases" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><ClasesPage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/clases/nueva" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><NuevaClasePage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/clases/editar/:id" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><EditarClasePage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/clases/turnos" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><TurnosPage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/planes" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><PlanesPage /></AdminLayout></RequireAuth>} />
        <Route path="/admin/reportes" element={<RequireAuth allowedRoles={["admin"]}><AdminLayout><ReportesPage /></AdminLayout></RequireAuth>} />
        {/* RUTAS DE ALUMNO */}
        <Route path="/alumno" element={<RequireAuth allowedRoles={["alumno"]}><AlumnoLayout><AlumnoDashboard /></AlumnoLayout></RequireAuth>} />
        <Route path="/alumno/reservar" element={<RequireAuth allowedRoles={["alumno"]}><AlumnoLayout><AlumnoReservarPage /></AlumnoLayout></RequireAuth>} />
        <Route path="/alumno/reservas" element={<RequireAuth allowedRoles={["alumno"]}><AlumnoLayout><AlumnoReservasPage /></AlumnoLayout></RequireAuth>} />
        <Route path="/alumno/creditos" element={<RequireAuth allowedRoles={["alumno"]}><AlumnoLayout><AlumnoCreditosPage /></AlumnoLayout></RequireAuth>} />
        <Route path="/alumno/perfil" element={<RequireAuth allowedRoles={["alumno"]}><AlumnoLayout><AlumnoPerfilPage /></AlumnoLayout></RequireAuth>} />
        <Route path="/perfil" element={<RequireAuth><SharedProfileRoute><AlumnoPerfilPage /></SharedProfileRoute></RequireAuth>} />

        {/* RUTAS DE PROFESOR CORREGIDAS */}
        <Route path="/profesor" element={<RequireAuth allowedRoles={["profesor"]}><ProfesorLayout><ProfesorDashboard /></ProfesorLayout></RequireAuth>} />
        <Route path="/profesor/perfil" element={<RequireAuth allowedRoles={["profesor"]}><ProfesorLayout><ProfesorPerfilPage /></ProfesorLayout></RequireAuth>} />
        <Route path="/profesor/rutinas" element={<RequireAuth allowedRoles={["profesor"]}><ProfesorLayout><RutinasPage /></ProfesorLayout></RequireAuth>} />
        <Route path="/profesor/rutinas/nueva" element={<RequireAuth allowedRoles={["profesor"]}><ProfesorLayout><NuevaRutinaPage /></ProfesorLayout></RequireAuth>} />
        <Route path="/profesor/rutinas/:id" element={<RequireAuth allowedRoles={["profesor"]}><ProfesorLayout><DetalleRutinaPage /></ProfesorLayout></RequireAuth>} />
        
        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;