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
  // Siempre texto: un objeto como título o detalle hacía fallar el dibujo de toda la app
  const aTexto = (x) => (x == null ? "" : typeof x === "string" ? x : typeof x === "number" ? String(x) : x?.message ? String(x.message) : "")
  titulo = aTexto(titulo)
  mensaje = aTexto(mensaje)
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

/*
 * Un guardado con aviso de carga: la burbuja arranca con el icono girando ("Guardando…") y, cuando termina, la misma burbuja
 * se transforma en éxito o en error. Devuelve la promesa original (si falla, sigue fallando para que quien llama lo maneje).
 *   conCarga(apiClient.post(...), { cargando: "Guardando abono…", exito: { titulo, mensaje }, error: (err) => ({ titulo, mensaje }) })
 * "exito" y "error" pueden ser un objeto o una función que recibe el resultado / el error.
 */
export function conCarga(promesa, { cargando, exito, error }) {
  const armar = (x, dato, duration) => { const r = (typeof x === "function" ? x(dato) : x) || {}; return { title: r.titulo, description: r.mensaje, duration } }
  return sileo.promise(promesa, {
    loading: { title: cargando },
    success: (dato) => armar(exito, dato, 3800),
    error: (err) => armar(error, err, 6500),
  })
}

// Las pantallas nuevas del admin en celular avisan con un texto suelto ("Abono cargado.", "No se pudo guardar."):
// acá se decide el tipo según cómo empieza el texto y se muestra con Sileo, igual que el resto del sistema.
export function avisarTexto(texto) {
  const t = String(texto || "").trim()
  if (!t) return
  const error = /(no se pudo|no pod[eé]s|no tienes|no ten[eé]s permiso|error|fall[oó]|no se guard|no se carg)/i.test(t)
  const atencion = !error && /^(complet|eleg|ingres|escrib|revis|falta|sum|agreg|seleccion|ya |no hay)/i.test(t)
  mostrarAviso({ tipo: error ? "error" : atencion ? "advertencia" : "exito", titulo: error ? "Error" : atencion ? "Atención" : "Éxito", mensaje: t })
}
