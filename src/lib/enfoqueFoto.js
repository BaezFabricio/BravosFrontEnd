/*
 * Punto de interés de una foto: dónde están las personas o lo que no se puede cortar.
 * Se guarda como texto "x,y" en porcentaje (0 a 100) y la portada deja ese punto en el medio.
 */
export const FOCO_CENTRO = { x: 50, y: 50 }

const limitar = (n) => Math.min(100, Math.max(0, n))

export function leerFoco(texto) {
  const m = /^(\d{1,3}),(\d{1,3})$/.exec(String(texto || '').trim())
  if (!m) return FOCO_CENTRO
  return { x: limitar(Number(m[1])), y: limitar(Number(m[2])) }
}

export function escribirFoco({ x, y }) {
  return `${Math.round(limitar(x))},${Math.round(limitar(y))}`
}

/*
 * object-position que deja el punto de interés en el centro de la caja, sin mostrar bordes vacíos.
 * "nat" es el tamaño real de la foto y "caja" el espacio donde se muestra (ambos en píxeles).
 */
export function posicionObjeto(foco, nat, caja) {
  const escala = Math.max(caja.w / nat.w, caja.h / nat.h)
  const ancho = nat.w * escala
  const alto = nat.h * escala
  const eje = (punto, medida, espacio) => {
    if (medida - espacio < 1) return 50 // no sobra nada de la foto en ese sentido
    const izquierda = Math.min(0, Math.max(espacio - medida, espacio / 2 - (punto / 100) * medida))
    return (izquierda / (espacio - medida)) * 100
  }
  return `${eje(foco.x, ancho, caja.w).toFixed(1)}% ${eje(foco.y, alto, caja.h).toFixed(1)}%`
}
