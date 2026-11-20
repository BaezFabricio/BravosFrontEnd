/*
 * Las pantallas del admin se cargan "a pedido" (cada una es un archivo aparte). Para que al tocar una no haya que esperar
 * a que llegue (la pantalla quedaba vacía 1 o 2 segundos), apenas se abre el panel se descargan todas en segundo plano,
 * cuando el navegador está libre. Después, abrirlas es instantáneo. Se descargan solo las del tamaño de pantalla en uso.
 */
const CELULAR = [
  () => import("./celular/Resumen.jsx"), () => import("./celular/Usuarios.jsx"), () => import("./celular/Ficha.jsx"),
  () => import("./celular/EditarUsuario.jsx"), () => import("./celular/NuevoUsuario.jsx"), () => import("./celular/Abonos.jsx"),
  () => import("./celular/Clases.jsx"), () => import("./celular/CrearClase.jsx"), () => import("./celular/Planes.jsx"),
  () => import("./celular/Mas.jsx"), () => import("./celular/Checkin.jsx"), () => import("./celular/Reportes.jsx"),
  () => import("./celular/Novedades.jsx"), () => import("./celular/Ejercicios.jsx"), () => import("./celular/Whatsapp.jsx"),
  () => import("./celular/Perfiles.jsx"), () => import("./celular/Configuracion.jsx"), () => import("./celular/MiPerfil.jsx"),
  () => import("./celular/Preferencias.jsx"),
]
const ESCRITORIO = [
  () => import("./AdminDashboard.escritorio.jsx"), () => import("./usuarios/UsuariosPage.escritorio.jsx"),
  () => import("./usuarios/[id]/DetalleUsuarioPage.escritorio.jsx"), () => import("./usuarios/[id]/editar/EditarUsuarioPage.escritorio.jsx"),
  () => import("./usuarios/abonos/CargaMasivaAbonosPage.escritorio.jsx"), () => import("./clases/ClasesPage.escritorio.jsx"),
  () => import("./clases/NuevaClasePage.escritorio.jsx"), () => import("./clases/TurnosPage.escritorio.jsx"),
  () => import("./planes/PlanesPage.escritorio.jsx"), () => import("./reportes/ReportesPage.escritorio.jsx"),
  () => import("./checkin/CheckinAdminPage.escritorio.jsx"), () => import("./novedades/NovedadesPage.escritorio.jsx"),
  () => import("./avisos/AvisosPage.escritorio.jsx"), () => import("./perfiles/PerfilesPage.escritorio.jsx"),
  () => import("./configuracion/ConfiguracionLandingPage.escritorio.jsx"), () => import("./ejercicios/EjerciciosRMPage.escritorio.jsx"),
]

let hecho = false
export function precargarPantallasAdmin() {
  if (hecho || typeof window === "undefined") return
  hecho = true
  // Sin ahorro de datos ni conexión muy lenta: ahí no se descarga nada por adelantado
  const conexion = navigator.connection
  if (conexion && (conexion.saveData || /(^|-)2g$/.test(conexion.effectiveType || ""))) return
  const lista = window.innerWidth >= 1024 ? ESCRITORIO : window.innerWidth < 768 ? CELULAR : []
  // Una pantalla cada tanto (no todas juntas) para no competir con lo que la persona está haciendo
  const libre = (f) => setTimeout(f, 350)
  let i = 0
  const siguiente = () => {
    if (i >= lista.length) return
    lista[i++]().catch(() => {})
    libre(siguiente)
  }
  libre(siguiente)
}
