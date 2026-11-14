import { Navigate } from "react-router-dom"
import { useCelularActivo } from "../celular/rutas"
import Mas from "../celular/Mas.jsx"

// "Más" existe solo en el celular (menos de 768 px); en pantallas más grandes el menú ya lo trae todo
export default function MasPage() {
  const celular = useCelularActivo()
  return celular ? <Mas /> : <Navigate to="/admin" replace />
}
