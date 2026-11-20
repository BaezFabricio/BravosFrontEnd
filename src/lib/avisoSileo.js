import { sileo } from "sileo"

/*
 * Único lugar que dibuja los avisos en pantalla (arriba en el medio, con Sileo). Lo usan:
 *  - toast.success / error / warning / info (lib/notificar.js): avisos de acciones, en todo el sistema;
 *  - la campanita: avisos de notificaciones nuevas que llegan del servidor (traen un enlace a la pantalla).
 * Un aviso igual a otro que se mostró hace un instante no se repite. Con enlace, el aviso trae un botón que abre esa pantalla.
 */
const FUNCION = { exito: "success", error: "error", advertencia: "warning", info: "info", reserva: "success", asistencia: "info", credito: "warning", sistema: "info" }
const GENERICOS = ["Éxito", "Error", "Atención", "Info"]
let ultimo = { clave: "", t: 0 }

export function mostrarAviso({ tipo, titulo, mensaje, link = null, accion = null, alAbrir = null }) {
  const clave = `${tipo}|${titulo}|${mensaje}`
  const ahora = Date.now()
  if (clave === ultimo.clave && ahora - ultimo.t < 1500) return
  ultimo = { clave, t: ahora }

  const generico = GENERICOS.includes(titulo)
  const largo = tipo === "error" || tipo === "advertencia"
  const opciones = {
    // Como en Sileo: un título corto con el estado y el detalle que se despliega debajo
    title: titulo || (generico ? "Aviso" : ""),
    description: mensaje && mensaje !== titulo ? mensaje : undefined,
    duration: largo ? 6500 : link ? 6000 : 3800,
  }
  if (link) {
    opciones.button = {
      title: accion || "Ver",
      onClick: () => {
        alAbrir?.()
        window.dispatchEvent(new CustomEvent("bravos:navegar", { detail: { to: link } }))
      },
    }
  }
  return sileo[FUNCION[tipo] || "info"](opciones)
}

export const quitarAvisos = () => sileo.clear()
