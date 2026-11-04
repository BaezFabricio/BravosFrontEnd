import { useNavigate } from "react-router-dom"
import { PANELES, panelesPermitidos } from "@/lib/paneles"
import { cerrarSesionEnServidor } from "@/lib/sesion"
import { ultimaRutaPublica } from "@/lib/ultimaRutaPublica"
import "@/components/acceso/estadosAcceso.css"
import "@/components/acceso/estadosAccesoMovil.css"

// Foto de cada tarjeta en la pantalla ancha (estados-referencia, 5e)
const FOTO_PANEL = {
  admin: { archivo: "grupo-c.png", posicion: "45% 55%" },
  alumno: { archivo: "barra.png", posicion: "50% 40%" },
  profesor: { archivo: "hookgrip-c.png", posicion: "50% 15%" },
}

export default function SeleccionarPanelPage() {
  const navigate = useNavigate()
  const permitidos = panelesPermitidos()
  const usuario = (() => {
    try { return JSON.parse(localStorage.getItem("usuario") || "{}") } catch { return {} }
  })()

  const disponibles = PANELES.filter(p => permitidos[p.key])
  const nombre = usuario.nombrecompleto || usuario.nombre || ""
  const activa = !usuario.estado || usuario.estado === "activo"

  // Mismo cierre de sesión que el menú de los paneles
  const cerrarSesion = () => {
    cerrarSesionEnServidor()
    localStorage.clear()
    navigate("/login", { replace: true })
  }

  return (
      <div className="ea">
        <section className="screen modulos">
          <div className="m-top">
            <div className="brand"><img src="/acceso/brvs.png" alt="" /><span>BRAVOS BOX</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "calc(36 * var(--u))" }}>
              <span className={`m-chip${activa ? "" : " warn"}`}>{activa ? "CUENTA ACTIVA" : "CUENTA PENDIENTE"}</span>
              <button type="button" className="m-btn" onClick={() => navigate(ultimaRutaPublica())}>Volver</button>
            </div>
          </div>
          <div className="m-head">
            <div>
              <div className="hi">Hola{nombre ? `, ${nombre}` : ""}</div>
              <h2>¿A qué módulo<br />querés <i>ingresar?</i></h2>
            </div>
            <img src="/acceso/dog-t.png" alt="" />
          </div>
          <nav className="m-grid" aria-label="Elegir módulo">
            {disponibles.map((panel, i) => {
              const foto = FOTO_PANEL[panel.key] || FOTO_PANEL.admin
              return (
                <button key={panel.key} type="button" className="tile" onClick={() => navigate(panel.href, { replace: true })}>
                  <img src={`/acceso/${foto.archivo}`} alt="" style={{ objectPosition: foto.posicion }} />
                  <span className="n">{String(i + 1).padStart(2, "0")}</span>
                  <div className="info">
                    <div><div className="name">{panel.label}</div><div className="sub">{panel.descripcion}</div></div>
                    <span className="go" aria-hidden="true">→</span>
                  </div>
                </button>
              )
            })}
            {disponibles.length === 0 && (
              <p className="m-aviso">Tu cuenta todavía no tiene un perfil asignado. El administrador del box te lo va a asignar pronto.</p>
            )}
          </nav>
          <div className="m-foot">
            <span>BRAVOS BOX · FORMOSA · EVA PERÓN 552</span>
            <button type="button" className="m-btn out" onClick={cerrarSesion}>Cerrar sesión</button>
          </div>
        </section>
      </div>
    )
}
