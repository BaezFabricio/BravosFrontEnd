/*
 * Guías del alumno (las muestra src/components/GuiaBravo.jsx, coordinadas por src/components/GuiasAlumno.jsx).
 *
 * Cómo se muestran:
 *  - "alumno-bienvenida": la primera vez que entra a su panel (se presenta Bravo, menú, campanita, Milo, avisos).
 *  - Una guía por módulo ("alumno-<módulo>"): la primera vez que entra a ESE módulo, explica solo esa pantalla.
 *  - "alumno": el recorrido completo, que se repite a pedido desde Mi configuración.
 * Qué guías vio cada persona se guarda en su cuenta (el servidor acepta solo las claves de GUIAS_VALIDAS).
 *
 * Cada paso: objetivo = valor de data-guia del elemento real que se ilumina (null = ninguno);
 * ruta = pantalla donde está (solo se usa en el recorrido completo, que lleva de una a otra);
 * soloAvisos = el paso de los avisos del celular, que solo aparece si se pueden activar en este dispositivo.
 * Los textos describen lo que hace la app: si cambia una pantalla, se actualiza acá.
 */

const introBienvenida = {
  titulo: "¡Bienvenido!",
  texto: "Soy Bravo y te acompaño en tus primeros pasos.",
  puntos: [
    "Con tus créditos reservás clases en el horario que quieras.",
    "En cada pantalla te explico lo importante la primera vez que entres.",
    "Repetís el recorrido completo desde Mi configuración.",
  ],
  objetivo: null,
}

const introCompleta = {
  ...introBienvenida,
  puntos: [
    "Con tus créditos reservás clases en el horario que quieras.",
    "Te muestro cada pantalla de la app, una por una.",
    "Podés saltar la guía cuando quieras.",
  ],
}

const menu = {
  titulo: "Todo está en el menú",
  texto: "Desde acá llegás a cada pantalla.",
  puntos: [
    "Entrenamiento: Resumen, Reservar clase, Mis reservas, Mis marcas y Calculadora RM.",
    "Mi cuenta: membresía, créditos, documentos y perfil.",
    "Además: Página principal, Mi configuración y Cerrar sesión.",
  ],
  objetivo: "menu",
}

const campanita = {
  titulo: "La campanita",
  texto: "Acá llegan los avisos de la app.",
  puntos: [
    "Reservas, pagos y vencimientos, ordenados por día.",
    "Tocá uno para ir a esa pantalla.",
    "Marcar todas los deja leídos y Limpiar vacía la bandeja.",
  ],
  objetivo: "campana",
}

const milo = {
  titulo: "Milo, tu ayudante",
  texto: "Tocalo cuando tengas una duda.",
  puntos: [
    "Te responde sobre reservas, créditos y tu membresía.",
    "Si no sabe algo, te dice cómo hablar con el box.",
    "Está abajo a la derecha, en todas las pantallas.",
  ],
  objetivo: "chat",
}

const avisos = {
  titulo: "¿Te aviso en el celu?",
  texto: "Activá los avisos y te llegan aunque la app esté cerrada.",
  puntos: [
    "Si se cancela una clase que reservaste.",
    "Cuando se acredita tu pago.",
    "Cuando tu membresía está por vencer.",
    "Lo cambiás en Mi configuración.",
  ],
  objetivo: null,
  soloAvisos: true,
}

// ── Resumen
const resumen = [
  {
    titulo: "Tu resumen",
    texto: "Esta es tu pantalla de inicio.",
    puntos: [
      "Arriba está tu racha: los días seguidos que fuiste a entrenar.",
      "Con Reservar clase vas directo a la agenda.",
    ],
    objetivo: "res-hero",
    ruta: "/alumno",
  },
  {
    titulo: "Créditos y clases",
    texto: "Dos números para tener a mano.",
    puntos: [
      "Créditos: cuántas clases podés reservar. Cada clase usa uno.",
      "Clases: las que reservaste y todavía no se dieron.",
      "Tocá el signo de pregunta de cada tarjeta para ver qué significa.",
    ],
    objetivo: "res-numeros",
    ruta: "/alumno",
  },
  {
    titulo: "Tu membresía",
    texto: "Tu plan de un vistazo.",
    puntos: [
      "Ves si está activa y hasta cuándo vence.",
      "Con Contratar otra membresía sumás otro plan; con Renovar, seguís entrenando.",
      "Sin membresía vigente no se pueden reservar clases.",
    ],
    objetivo: "res-membresia",
    ruta: "/alumno",
  },
  {
    titulo: "Tus logros",
    texto: "Medallas que ganás por entrenar.",
    puntos: [
      "Se desbloquean al asistir y al cargar tus marcas.",
      "Tocá uno para ver qué pide.",
      "Arriba ves cuántos completaste.",
    ],
    objetivo: "res-logros",
    ruta: "/alumno",
  },
  {
    titulo: "Accesos rápidos",
    texto: "Atajos a lo que más usás.",
    puntos: [
      "Mis rutinas: las de tus clases reservadas.",
      "Mis reservas, Mis marcas, Calculadora RM y Mis créditos.",
      "Un toque y estás ahí.",
    ],
    objetivo: "res-accesos",
    ruta: "/alumno",
  },
  {
    titulo: "Tu progreso",
    texto: "Cuánto entrenaste.",
    puntos: [
      "Clases completadas esta semana y este mes.",
      "Te ayuda a mantener el ritmo.",
    ],
    objetivo: "res-progreso",
    ruta: "/alumno",
  },
]

// ── Reservar clase
const reservar = [
  {
    titulo: "Elegí el día",
    texto: "Arriba están los próximos días. Tocá el que te sirva.",
    puntos: [
      "El puntito verde marca los días con clases.",
      "Solo ves las clases del plan que tenés contratado.",
      "Si no hay clases, probá otro día: las flechas pasan a la semana siguiente.",
    ],
    objetivo: "dias",
    ruta: "/alumno/reservar",
  },
  {
    titulo: "Elegí el turno",
    texto: "Filtrá las clases por momento del día.",
    puntos: [
      "Mañana: de 5 a 12. Tarde: de 12 a 17. Noche: de 17 a 22.",
      "Todas muestra todas las clases del día.",
      "Ojo: \"Mañana\" es el turno de la mañana, no el día de mañana.",
    ],
    objetivo: "turnos",
    ruta: "/alumno/reservar",
  },
  {
    titulo: "Reservá tu clase",
    texto: "Tocá Reservar en la clase que querés.",
    puntos: [
      "Ves el horario, el coach y cuántos cupos quedan.",
      "Se descuenta 1 crédito de tu plan.",
      "Podés reservar hasta 2 horas antes de que empiece.",
      "La reserva aparece enseguida en Reservas.",
    ],
    objetivo: "reservar",
    ruta: "/alumno/reservar",
  },
]

// ── Mis reservas
const reservas = [
  {
    titulo: "Tus reservas",
    texto: "Reservas es tu agenda de entrenamientos.",
    puntos: [
      "Próximas: las que vienen. Historial: las que ya pasaron.",
      "Cancelás con 2 horas o más y te devolvemos el crédito.",
      "Si cancelás más tarde, el crédito no se devuelve.",
      "El número verde de la barra de abajo cuenta tus reservas próximas.",
    ],
    objetivo: "reservas-tabs",
    ruta: "/alumno/reservas",
  },
  {
    titulo: "La rutina del día",
    texto: "Tocá Ver rutina y mirá qué vas a entrenar.",
    puntos: [
      "Está dentro de cada reserva que hagas.",
      "Se muestra cuando tu coach la publica.",
      "Podés abrirla antes de ir para prepararte.",
    ],
    objetivo: "rutina",
    ruta: "/alumno/reservas",
  },
]

// ── Mis marcas y calculadora
const marcas = [
  {
    titulo: "Mis marcas",
    texto: "Tu cuaderno de récords personales.",
    puntos: [
      "Registrás tus marcas y ves cómo progresás.",
      "Elegís el ejercicio, el peso y las repeticiones.",
      "Tu primera marca desbloquea el logro Primer PR.",
    ],
    objetivo: "titulo",
    ruta: "/alumno/marcas",
  },
  {
    titulo: "Cargá una marca",
    texto: "Con Nueva marca guardás un récord.",
    puntos: [
      "Elegí el ejercicio de la lista o escribí otro.",
      "Cargás peso y repeticiones, y notas si querés.",
      "Si es tu primera marca en ese ejercicio, te lo avisamos.",
    ],
    objetivo: "marcas-nueva",
    ruta: "/alumno/marcas",
  },
]

const calculadora = [
  {
    titulo: "Calculadora RM",
    texto: "Estimá tu máximo para una repetición.",
    puntos: [
      "Ingresá el peso que levantaste y cuántas repeticiones hiciste.",
      "Te muestra tu 1RM estimado.",
      "Debajo, los pesos de trabajo por porcentaje.",
    ],
    objetivo: "titulo",
    ruta: "/alumno/calculadora-rm",
  },
]

// ── Mi cuenta
const membresia = [
  {
    titulo: "Mi membresía",
    texto: "Todo sobre tu plan.",
    puntos: [
      "Tu membresía activa y el historial de tus pagos.",
      "Abajo, accesos al consumo de créditos y a tus comprobantes.",
      "Desde acá renovás o contratás otra membresía.",
    ],
    objetivo: "titulo",
    ruta: "/alumno/plan",
  },
]

const creditos = [
  {
    titulo: "Mis créditos",
    texto: "El estado de tu cuenta y tus movimientos.",
    puntos: [
      "Disponibles: lo que te queda de tu plan.",
      "Cada reserva usa 1 crédito; si cancelás con 2 horas o más, vuelve.",
      "Si no asistís, el crédito se descuenta igual.",
      "Más abajo está el historial de movimientos.",
    ],
    objetivo: "titulo",
    ruta: "/alumno/creditos",
  },
]

const documentos = [
  {
    titulo: "Documentos y comprobantes",
    texto: "Cargás lo que pide el gimnasio.",
    puntos: [
      "Certificado médico, declaración jurada y comprobante de transferencia.",
      "Cada documento muestra su estado: pendiente, en revisión o aprobado.",
      "Formatos PDF, JPG o PNG de hasta 10 MB.",
    ],
    objetivo: "titulo",
    ruta: "/alumno/documentacion",
  },
  {
    titulo: "Subí un archivo",
    texto: "Con este botón cargás cada documento.",
    puntos: [
      "Antes marcá la autorización de privacidad.",
      "Podés reemplazar un archivo si te equivocaste.",
      "El administrador lo revisa y lo aprueba.",
    ],
    objetivo: "doc-subir",
    ruta: "/alumno/documentacion",
  },
]

const perfil = [
  {
    titulo: "Mi perfil",
    texto: "Tus datos y tu seguridad.",
    puntos: [
      "Ves tus datos, el estado de tu membresía y desde cuándo sos miembro.",
      "Cambiás tu contraseña cuando quieras: 8 caracteres, con mayúscula, minúscula y número.",
      "Al cambiarla se cierran tus otras sesiones abiertas.",
    ],
    objetivo: "titulo",
    ruta: "/alumno/perfil",
  },
  {
    titulo: "Tu foto",
    texto: "Poné tu foto para que te reconozcan.",
    puntos: [
      "Se ve en tu perfil y en el menú.",
      "La cambiás cuando quieras.",
    ],
    objetivo: "perfil-foto",
    ruta: "/alumno/perfil",
  },
]

// Guías que se muestran solas: la bienvenida y una por módulo (la primera vez que se entra a ese módulo)
export const GUIAS_ALUMNO = {
  "alumno-bienvenida": [introBienvenida, menu, campanita, milo, avisos],
  "alumno-resumen": resumen,
  "alumno-reservar": reservar,
  "alumno-reservas": reservas,
  "alumno-marcas": marcas,
  "alumno-calculadora": calculadora,
  "alumno-membresia": membresia,
  "alumno-creditos": creditos,
  "alumno-documentos": documentos,
  "alumno-perfil": perfil,
}

// Qué guía corresponde a cada pantalla
export const GUIA_POR_RUTA = {
  "/alumno": "alumno-resumen",
  "/alumno/reservar": "alumno-reservar",
  "/alumno/reservas": "alumno-reservas",
  "/alumno/marcas": "alumno-marcas",
  "/alumno/calculadora-rm": "alumno-calculadora",
  "/alumno/plan": "alumno-membresia",
  "/alumno/creditos": "alumno-creditos",
  "/alumno/documentacion": "alumno-documentos",
  "/alumno/perfil": "alumno-perfil",
}

// Recorrido completo, para repetirlo desde Mi configuración: lleva de una pantalla a otra
export const PASOS_COMPLETOS_ALUMNO = [
  introCompleta,
  ...resumen, ...reservar, ...reservas, ...marcas, ...calculadora, ...membresia, ...creditos, ...documentos, ...perfil,
  menu, campanita, milo, avisos,
]
