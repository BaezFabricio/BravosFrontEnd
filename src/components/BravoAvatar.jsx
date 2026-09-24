/**
 * Cara de Bravo, el perro salchicha asistente del gimnasio (public/bravo_bot.png).
 * La imagen completa incluye el torso; acá se recorta y se acerca a la cara para
 * que se reconozca en tamaños chicos (avatar del chat y botón flotante).
 */
const ZOOM = 1.4           // cuánto se agranda la imagen respecto del círculo (más chico = se ve más completo)
const CARA_X = 0.55        // centro de la cara dentro de la imagen (0–1)
const CARA_Y = 0.36

export default function BravoAvatar({ size = 40, className = "", src = "/bravo_bot.png", nombre = "Bravo" }) {
  const ancho = size * ZOOM
  return (
    <span
      className={`relative inline-block overflow-hidden bg-white shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={nombre}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        className="absolute max-w-none select-none"
        style={{
          width: ancho,
          height: ancho,
          left: size / 2 - CARA_X * ancho,
          top: size / 2 - CARA_Y * ancho,
        }}
      />
    </span>
  )
}
