import { useNavigate } from "react-router-dom"
import { TituloPagina } from "@/components/TituloPagina"
import { useEsMovil, useCabeceraMovil } from "../movil"
import { useAvisosProfesor } from "./useAvisosProfesor"
import ListaAvisos from "./ListaAvisos"

// Pantalla de avisos del celular (la abre la campanita). En escritorio el aviso va en el panel de la campanita.
export default function AvisosProfesorPage() {
  const movil = useEsMovil()
  const navigate = useNavigate()
  const { avisos, noLeidas, cargando, marcarLeido, marcarTodos } = useAvisosProfesor()

  useCabeceraMovil(movil ? { titulo: "Avisos", onVolver: () => navigate("/profesor") } : null)

  const irA = (aviso) => { if (aviso.link) navigate(aviso.link) }

  return (
    <div style={{ width: "100%" }}>
      {!movil && <TituloPagina descripcion="Reservas, rutinas y listas por tomar">Avisos</TituloPagina>}
      <ListaAvisos avisos={avisos} noLeidas={noLeidas} cargando={cargando} onLeer={marcarLeido} onLeerTodos={marcarTodos} onAbrir={irA} />
    </div>
  )
}
