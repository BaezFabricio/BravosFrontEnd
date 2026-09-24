// Mascotas del box que atienden el chat de ayuda. Cada día atiende una:
// lunes, miércoles, viernes y domingo, Bravo; martes, jueves y sábado, Milo.
//
// Cada mascota trae sus imágenes (PNG con fondo transparente en /public) en versión clara y oscura,
// y su ajuste de posición. Si una mascota no tiene `listo: true`, ese día atiende Bravo.

const AJUSTE_VENTANA = { width: 90, height: 90, top: -79, marginLeft: -57 }
const AJUSTE_BOTON = { width: 78, height: 78, left: -16, top: -16 }

export const MASCOTAS = {
  bravo: {
    id: "bravo",
    nombre: "Bravo",
    listo: true,
    // Sobre el borde de la ventana: camiseta negra en modo claro, blanca en modo oscuro
    ventana: {
      imagenes: [
        { src: "/bravo2.png", tema: "block dark:hidden" },
        { src: "/bravoblanco.png", tema: "hidden dark:block" },
      ],
      ajuste: AJUSTE_VENTANA,
    },
    // Dentro del botón redondo
    boton: {
      imagenes: [
        { src: "/bravo_botnegro.png", tema: "block dark:hidden" },
        { src: "/bravo_bot.png", tema: "hidden dark:block" },
      ],
      ajuste: AJUSTE_BOTON,
    },
    // Carita de los mensajes
    avatar: "/bravo_bot.png",
  },

  milo: {
    id: "milo",
    nombre: "Milo",
    listo: true,
    // Sobre el borde de la ventana: camiseta negra en modo claro, blanca en modo oscuro.
    // En estas imágenes el borde que agarra está al 83 % de la altura y Milo queda
    // centrado (centro al 50,5 % del ancho); de ahí el top y el marginLeft.
    ventana: {
      imagenes: [
        { src: "/milo_logonegro.png", tema: "block dark:hidden" },
        { src: "/milo_logoblanco.png", tema: "hidden dark:block" },
      ],
      ajuste: { width: 90, height: 90, top: -75, marginLeft: -45 },
    },
    // Busto para el botón redondo (mismo encuadre que el de Bravo)
    boton: {
      imagenes: [
        { src: "/milo_globonegro.png", tema: "block dark:hidden" },
        { src: "/milo_globoblanco.png", tema: "hidden dark:block" },
      ],
      ajuste: AJUSTE_BOTON,
    },
    avatar: "/milo_globonegro.png",
  },
}


// getDay(): 0 domingo, 1 lunes … 6 sábado. Martes (2), jueves (4) y sábado (6): Milo.
export function mascotaDeHoy(fecha = new Date()) {
  const dia = fecha.getDay()
  const toca = dia !== 0 && dia % 2 === 0 ? MASCOTAS.milo : MASCOTAS.bravo
  return toca.listo ? toca : MASCOTAS.bravo
}
