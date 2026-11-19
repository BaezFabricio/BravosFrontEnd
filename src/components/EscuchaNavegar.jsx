import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

/*
 * Los avisos (Sileo) viven fuera del router: cuando uno trae un botón que abre una pantalla, avisa con el evento
 * "bravos:navegar" y esta pieza hace la navegación. Solo se aceptan rutas internas (empiezan con una sola "/").
 */
export default function EscuchaNavegar() {
  const navigate = useNavigate()
  useEffect(() => {
    const ir = (e) => {
      const to = e.detail?.to
      if (typeof to === "string" && to.startsWith("/") && !to.startsWith("//")) navigate(to)
    }
    window.addEventListener("bravos:navegar", ir)
    return () => window.removeEventListener("bravos:navegar", ir)
  }, [navigate])
  return null
}
