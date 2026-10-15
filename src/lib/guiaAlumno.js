/*
 * Guías del alumno (las muestra src/components/GuiaBravo.jsx, coordinadas por src/components/GuiasAlumno.jsx).
 *
 * Cómo se muestran:
 *  - "alumno-bienvenida": la primera vez que entra a su panel (se presenta Bravo, menú, campanita, Milo, avisos).
 *  - Una guía por submódulo ("alumno-<submódulo>"): la primera vez que entra a ESE submódulo, explica solo esa pantalla.
 *  - "Ver la guía de bienvenida" (Mi configuración) repite la bienvenida y vuelve a explicar cada submódulo al entrar.
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
    "Podés volver a ver estas guías desde Mi configuración.",
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
    titulo: "Tus créditos",
    texto: "Cada reserva usa un crédito. Acá ves cuántos te quedan.",
    puntos: [
      "El número en el círculo son tus créditos disponibles.",
      "Debajo, hasta cuándo vencen. Vencen junto con tu membresía.",
      "Con Comprar sumás otra membresía y más créditos.",
      "Sin créditos no se puede reservar.",
    ],
    objetivo: "creditos",
    ruta: "/alumno/reservar",
  },
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
      "Cada clase muestra el horario, el coach, el plan y cuántos lugares quedan.",
      "Si dice Completo, ya no hay cupos. Si ya la reservaste, aparece Ver mi reserva.",
      "Se descuenta 1 crédito de tu plan.",
      "Podés reservar hasta 2 horas antes de que empiece.",
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
      "El número verde de la barra de abajo cuenta tus reservas próximas.",
    ],
    objetivo: "reservas-tabs",
    ruta: "/alumno/reservas",
  },
  {
    titulo: "Cada reserva",
    texto: "Una tarjeta por clase que reservaste.",
    puntos: [
      "A la izquierda, el día. Después el tipo de clase, la hora y la clase.",
      "Abajo, tu coach.",
      "Las próximas se marcan con una franja verde.",
    ],
    objetivo: "reserva-tarjeta",
    ruta: "/alumno/reservas",
  },
  {
    titulo: "Su estado",
    texto: "Te dice en qué quedó cada reserva.",
    puntos: [
      "Confirmada: la clase todavía no se dio.",
      "Completada: asististe.",
      "No asististe: no fuiste, y el crédito se descuenta igual.",
      "Cancelada: la cancelaste y quedó en tu historial.",
    ],
    objetivo: "reserva-estado",
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
  {
    titulo: "Cancelar una reserva",
    texto: "Si no podés ir, cancelá a tiempo.",
    puntos: [
      "Con 2 horas o más de anticipación te devolvemos el crédito.",
      "Si faltan menos de 2 horas, el crédito no se devuelve.",
      "Debajo del botón te avisa cuál de los dos casos es el tuyo.",
    ],
    objetivo: "reserva-cancelar",
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
      "Tu primera marca desbloquea el logro Primer PR.",
    ],
    objetivo: "titulo",
    ruta: "/alumno/marcas",
  },
  {
    titulo: "Tus ejercicios",
    texto: "Las marcas se agrupan por ejercicio.",
    puntos: [
      "Cada ejercicio muestra cuántas marcas tenés y la fecha de la última.",
      "A la derecha va tu mejor marca.",
      "Tocá el ejercicio para abrirlo o cerrarlo.",
      "Con Ver historial completo ves las más viejas.",
    ],
    objetivo: "marcas-lista",
    ruta: "/alumno/marcas",
  },
  {
    titulo: "Cargá una marca",
    texto: "Con Nueva marca guardás un récord.",
    puntos: [
      "Elegí el ejercicio de la lista o escribí otro nuevo y su tipo: peso, repeticiones o tiempo.",
      "Series simple: todas iguales. Detallada: cargás cada serie por separado.",
      "Elegís la fecha y podés sumar una nota, por ejemplo \"con cinturón\".",
      "Una marca mal cargada se elimina desde su fila.",
    ],
    objetivo: "marcas-nueva",
    ruta: "/alumno/marcas",
  },
]

const calculadora = [
  {
    titulo: "Calculadora RM",
    texto: "Estimá tu máximo para una repetición (1RM) sin tener que probarlo.",
    puntos: [
      "Sirve para saber con qué peso trabajar en cada clase.",
      "Es una estimación: no reemplaza probar tu máximo real.",
    ],
    objetivo: "titulo",
    ruta: "/alumno/calculadora-rm",
  },
  {
    titulo: "Tus datos",
    texto: "Cargá una serie que hayas hecho.",
    puntos: [
      "Peso levantado, en kilos.",
      "Repeticiones que lograste (de 1 a 30).",
      "Con más de 10 repeticiones la estimación pierde precisión: mejor una serie pesada y corta.",
    ],
    objetivo: "calc-datos",
    ruta: "/alumno/calculadora-rm",
  },
  {
    titulo: "La fórmula",
    texto: "Podés elegir cómo se calcula.",
    puntos: [
      "Epley y Brzycki son dos fórmulas conocidas.",
      "Dan resultados parecidos; si cambiás de una a otra, comparás.",
    ],
    objetivo: "calc-formula",
    ruta: "/alumno/calculadora-rm",
  },
  {
    titulo: "Tu 1RM estimado",
    texto: "Acá aparece el resultado cuando cargás peso y repeticiones.",
    puntos: [
      "Es el peso máximo que podrías levantar una sola vez.",
      "Debajo ves con qué datos y fórmula se calculó.",
    ],
    objetivo: "calc-resultado",
    ruta: "/alumno/calculadora-rm",
  },
  {
    titulo: "Pesos por porcentaje",
    texto: "Tu 1RM convertido en pesos de trabajo.",
    puntos: [
      "Cada fila es un porcentaje de tu máximo y el peso que le corresponde.",
      "A la derecha, cuántas repeticiones se hacen más o menos con ese peso.",
      "Por ejemplo, el 80% se usa para series de unas 8 repeticiones.",
    ],
    objetivo: "calc-tabla",
    ruta: "/alumno/calculadora-rm",
  },
]

// ── Mi cuenta
const membresia = [
  {
    titulo: "Mi membresía",
    texto: "Todo sobre tu plan, en dos pestañas.",
    puntos: [
      "Membresía activa: tu plan de hoy.",
      "Historial de pagos: todo lo que pagaste.",
    ],
    objetivo: "plan-pestanas",
    ruta: "/alumno/plan",
  },
  {
    titulo: "Tu plan",
    texto: "Los datos de tu membresía vigente.",
    puntos: [
      "Cada plan que tenés contratado aparece en su propia sección.",
      "Ves hasta cuándo vence y cuántos créditos te quedan.",
      "Si no tenés membresía vigente, te lo dice acá.",
    ],
    objetivo: "plan-tarjeta",
    ruta: "/alumno/plan",
  },
  {
    titulo: "Renovar o sumar otra",
    texto: "Dos botones, según lo que necesites.",
    puntos: [
      "Renovar aparece cuando tu plan está por vencer o ya venció.",
      "Contratar otra membresía suma otro plan.",
      "Los créditos nuevos se suman a los que ya tenés y vencen con esa membresía.",
    ],
    objetivo: "plan-acciones",
    ruta: "/alumno/plan",
  },
  {
    titulo: "Gestión",
    texto: "Dos atajos relacionados con tu plan.",
    puntos: [
      "Consumo de créditos: tus clases reservadas y los créditos usados.",
      "Comprobantes: tus documentos y comprobantes de pago.",
    ],
    objetivo: "plan-gestion",
    ruta: "/alumno/plan",
  },
]

const creditos = [
  {
    titulo: "Créditos disponibles",
    texto: "Lo que te queda para reservar.",
    puntos: [
      "El número grande son tus créditos de hoy.",
      "Abajo, el porcentaje que te queda, tu plan y la fecha de vencimiento.",
      "Las barritas se van vaciando a medida que reservás.",
    ],
    objetivo: "cred-disponibles",
    ruta: "/alumno/creditos",
  },
  {
    titulo: "Total y usados",
    texto: "Cuánto trae tu plan y cuánto usaste.",
    puntos: [
      "Total del plan: los créditos que tenía al contratarlo.",
      "Usados: las clases que ya consumieron un crédito.",
    ],
    objetivo: "cred-totales",
    ruta: "/alumno/creditos",
  },
  {
    titulo: "Cómo funcionan",
    texto: "Las reglas de los créditos.",
    puntos: [
      "Cada reserva consume 1 crédito.",
      "Cancelar con 2 horas o más te lo devuelve.",
      "Si no asistís, se descuenta igual.",
      "Al sumar otra membresía, los créditos se suman.",
    ],
    objetivo: "cred-reglas",
    ruta: "/alumno/creditos",
  },
  {
    titulo: "Historial de movimientos",
    texto: "Cada vez que se carga o se usa un crédito.",
    puntos: [
      "Cargas: créditos que recibiste. Consumos: los que usaste.",
      "Con los botones de arriba filtrás por tipo.",
      "Con Ver más abrís los movimientos anteriores.",
    ],
    objetivo: "cred-historial",
    ruta: "/alumno/creditos",
  },
]

const documentos = [
  {
    titulo: "Documentos y comprobantes",
    texto: "Cargás lo que pide el gimnasio.",
    puntos: [
      "El administrador los revisa; una vez validados, tu membresía queda regularizada.",
      "Podés reemplazar cualquier documento cuando quieras.",
    ],
    objetivo: "doc-info",
    ruta: "/alumno/documentacion",
  },
  {
    titulo: "Un documento por tarjeta",
    texto: "Hay tres: certificado médico, declaración jurada y comprobante de transferencia.",
    puntos: [
      "Arriba a la derecha ves su estado: Pendiente, En revisión o Aprobado.",
      "Cuando subís uno, aparece el archivo con el botón Ver.",
      "Si ya subiste varios, Ver historial muestra los anteriores.",
    ],
    objetivo: "doc-tarjeta",
    ruta: "/alumno/documentacion",
  },
  {
    titulo: "Subí un archivo",
    texto: "Con este botón cargás cada documento.",
    puntos: [
      "Acepta PDF, JPG o PNG de hasta 10 MB.",
      "En los documentos con datos de salud, antes marcás la autorización de privacidad.",
      "Si ya subiste uno, el botón dice Reemplazar archivo.",
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
      "Acá ves tu información y el estado de tu cuenta.",
      "Y cambiás tu contraseña cuando quieras.",
    ],
    objetivo: "titulo",
    ruta: "/alumno/perfil",
  },
  {
    titulo: "Tu foto",
    texto: "Poné tu foto para que te reconozcan.",
    puntos: [
      "Tocá Cambiar foto y elegí una imagen de tu celular.",
      "Se ve en tu perfil y en el menú.",
      "La podés cambiar cuando quieras.",
    ],
    objetivo: "perfil-foto",
    ruta: "/alumno/perfil",
  },
  {
    titulo: "Créditos y estado",
    texto: "Dos datos para tener a mano.",
    puntos: [
      "Créditos disponibles: cuántas clases podés reservar.",
      "Estado: si tu cuenta está activa o suspendida.",
    ],
    objetivo: "perfil-resumen",
    ruta: "/alumno/perfil",
  },
  {
    titulo: "Información personal",
    texto: "Los datos con los que estás registrado.",
    puntos: [
      "Documento, teléfono y correo.",
      "Miembro desde: la fecha en que te sumaste al box.",
      "Si algo está mal, avisale al box.",
    ],
    objetivo: "perfil-info",
    ruta: "/alumno/perfil",
  },
  {
    titulo: "Estado de cuenta",
    texto: "El estado de tu usuario y tu membresía.",
    puntos: [
      "Usuario: activo, suspendido o inactivo.",
      "Membresía: vigente, por vencer o vencida.",
      "Si está por vencer o vencida, arriba aparece un aviso con el botón Renovar.",
    ],
    objetivo: "perfil-cuenta",
    ruta: "/alumno/perfil",
  },
  {
    titulo: "Cambiar contraseña",
    texto: "Cuidá tu cuenta.",
    puntos: [
      "Pide tu contraseña actual y la nueva dos veces.",
      "La nueva tiene que tener 8 caracteres, con mayúscula, minúscula y número.",
      "Al cambiarla se cierran tus otras sesiones abiertas.",
    ],
    objetivo: "perfil-clave",
    ruta: "/alumno/perfil",
  },
]

// Guías que se muestran solas: la bienvenida y una por submódulo (la primera vez que se entra a ese submódulo)
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

// Recorrido completo (todas las pantallas una tras otra, con navegación): hoy no tiene botón propio
export const PASOS_COMPLETOS_ALUMNO = [
  introCompleta,
  ...resumen, ...reservar, ...reservas, ...marcas, ...calculadora, ...membresia, ...creditos, ...documentos, ...perfil,
  menu, campanita, milo, avisos,
]
