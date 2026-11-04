import { Link } from "react-router-dom"
import "./estadosAcceso.css"
import "./estadosAccesoMovil.css"

/*
 * Marco de las pantallas de estado del acceso (ver estadosAcceso.css): foto con corte diagonal a la derecha,
 * logo arriba a la izquierda, botón de salida arriba a la derecha y la columna de contenido a la izquierda.
 * foto: nombre del archivo en /acceso; posicion: object-position de la foto.
 */
export default function PantallaEstado({ foto, posicion, volverA = "/inicio", volverTexto = "Volver al sitio", children }) {
  return (
    <div className="ea">
      <section className="screen">
        <div className="photo"><img src={`/acceso/${foto}`} alt="" style={{ objectPosition: posicion }} /></div>
        <div className="brand"><img src="/acceso/brvs.png" alt="" /><span>BRAVOS BOX</span></div>
        <div className="topright"><Link to={volverA} className="btn-top">{volverTexto}</Link></div>
        <div className="content">{children}</div>
      </section>
    </div>
  )
}
