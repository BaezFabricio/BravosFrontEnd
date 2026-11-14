import { lazy, Suspense } from "react"
import { useCelularActivo } from "../celular/rutas"
import AlumnoPerfilPage from "@/app/alumno/perfil/PerfilPage.jsx"
const Celular = lazy(() => import("../celular/MiPerfil.jsx"))

// En celular (menos de 768 px) el diseño nuevo; en pantallas más grandes, el de siempre.
export default function PerfilAdminPageDespacho(props) {
  const celular = useCelularActivo()
  return celular ? <Celular {...props} /> : <AlumnoPerfilPage {...props} />
}
