/**
 * Cerebro del chat de ayuda (Bravo / Milo) — NIVEL 1: preguntas frecuentes sin IA.
 *
 * `responder(pregunta, contexto)` es el ÚNICO punto que usa el chat para obtener una respuesta.
 * Devuelve una promesa con { texto, enlaces?, sugerencias? }. Por eso, cuando se active la IA de
 * Claude alcanza con reemplazar la implementación de esta función (o llamar a un endpoint del
 * backend y usar este motor como respaldo si la IA falla): el chat no cambia.
 *
 * Cómo funciona el nivel 1:
 *  1. Se normaliza la pregunta (minúsculas, sin tildes ni signos).
 *  2. Cada tema tiene palabras clave. "reserv*" = cualquier palabra que empiece así;
 *     una palabra sin asterisco debe aparecer entera ("pr", "rm"); las frases ("cuanto me queda")
 *     se buscan completas. Gana el tema con más puntaje.
 *  3. Los temas dinámicos consultan al sistema (créditos, vencimiento, clases de hoy, reservas)
 *     para responder con datos reales de quien pregunta.
 *
 * Para agregar un tema nuevo: sumar un objeto a TEMAS (ver ejemplos abajo).
 */
import apiClient from "@/api"
import { fmtFechaPlan, fmtPrecio } from "@/lib/miPlan"

// ── Normalización y búsqueda ────────────────────────────────────────────────

const normalizar = (t) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

/** Puntaje de una clave dentro de la pregunta normalizada (0 = no aparece). */
function puntajeClave(pregunta, clave) {
  const c = normalizar(clave.replace(/\*$/, ""))
  if (!c) return 0
  const prefijo = clave.endsWith("*")
  const palabras = c.split(" ").length
  const re = prefijo ? new RegExp(`(^| )${c}`) : new RegExp(`(^| )${c}( |$)`)
  return re.test(pregunta) ? 1 + palabras : 0
}

const DIAS_BD = { 0: "DOMINGO", 1: "LUNES", 2: "MARTES", 3: "MIERCOLES", 4: "JUEVES", 5: "VIERNES", 6: "SABADO" }
const hoyISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
const lista = (items) => items.map((i) => `• ${i}`).join("\n")
const pasos = (items) => items.map((i, n) => `${n + 1}. ${i}`).join("\n")
const fmtHora = (h) => String(h || "").slice(0, 5)

// ── Enlaces reutilizables ──────────────────────────────────────────────────

const LINK = {
  reservar: { texto: "Ir a Reservar Clase", ruta: "/alumno/reservar" },
  reservas: { texto: "Ver Mis Reservas", ruta: "/alumno/reservas" },
  membresia: { texto: "Ir a Mi Membresía", ruta: "/alumno/plan" },
  creditos: { texto: "Ver Mis Créditos", ruta: "/alumno/creditos" },
  marcas: { texto: "Ir a Mis Marcas", ruta: "/alumno/marcas" },
  calculadora: { texto: "Abrir la Calculadora RM", ruta: "/alumno/calculadora-rm" },
  documentos: { texto: "Ir a Documentos y Comprobantes", ruta: "/alumno/documentacion" },
  perfilAlumno: { texto: "Ir a Mi Perfil", ruta: "/alumno/perfil" },
  asistencia: { texto: "Ir a Asistencia", ruta: "/profesor" },
  rutinas: { texto: "Ir a Mis Rutinas", ruta: "/profesor/rutinas" },
  perfilProfesor: { texto: "Ir a mi Perfil", ruta: "/profesor/perfil" },
  usuarios: { texto: "Ir a Usuarios y Abonos", ruta: "/admin/usuarios" },
  cargaAbonos: { texto: "Ir a Gestión de Abonos", ruta: "/admin/usuarios/abonos/carga-masiva" },
  clases: { texto: "Ir a Clases", ruta: "/admin/clases" },
  nuevaClase: { texto: "Crear una clase", ruta: "/admin/clases/nueva" },
  planes: { texto: "Ir a Planes", ruta: "/admin/planes" },
  reportes: { texto: "Ir a Reportes", ruta: "/admin/reportes" },
  perfiles: { texto: "Ir a Perfiles", ruta: "/admin/perfiles" },
  configuracion: { texto: "Ir a Configuración", ruta: "/admin/configuracion" },
  resumen: { texto: "Ir al Resumen", ruta: "/admin" },
}

// ── Temas comunes a todos los paneles ──────────────────────────────────────

const TEMAS_COMUNES = [
  {
    id: "saludo",
    titulo: "Saludar",
    claves: ["hola*", "buenas*", "buen dia", "buenos dias", "buenas tardes", "buenas noches", "que tal", "hey"],
    respuesta: ({ nombre, mascota }) => ({
      texto: `¡Hola${nombre ? `, ${nombre.split(" ")[0]}` : ""}! 🐾 Soy ${mascota}. Contame qué necesitás y te ayudo. También podés tocar alguno de los temas de abajo.`,
    }),
  },
  {
    id: "gracias",
    titulo: "Agradecer",
    claves: ["gracias", "muchas gracias", "genial", "perfecto", "excelente", "buenisimo", "joya", "dale gracias"],
    respuesta: ({ mascota }) => ({
      texto: `¡De nada! 🐾 Si te queda alguna otra duda, acá estoy. — ${mascota}`,
    }),
  },
  {
    id: "quien",
    titulo: "Qué podés hacer",
    claves: ["quien sos", "como te llamas", "que sos", "que podes hacer", "que haces", "para que servis", "ayuda", "ayudame", "que sabes"],
    respuesta: ({ mascota, rol }) => ({
      texto:
        `Soy ${mascota}, el asistente de Bravos Box 🐾. Todavía estoy aprendiendo, pero ya puedo explicarte cómo usar el sistema` +
        (rol === "alumno" ? " y consultar tus créditos, tu membresía, tus reservas y los horarios de hoy" : "") +
        `.\n\nPreguntame lo que quieras con tus palabras. Por ejemplo:\n` +
        lista(EJEMPLOS[rol] || EJEMPLOS.alumno),
    }),
  },
  {
    id: "contacto",
    titulo: "Hablar con una persona",
    claves: ["whatsapp", "contacto", "telefono", "llamar", "hablar con", "recepcion", "persona", "humano", "encargado", "administrador", "soporte", "no me sirve", "no me ayudaste"],
    respuesta: () => ({
      texto:
        `Si necesitás hablar con una persona, la forma más rápida es acercarte a la recepción del box o escribir por WhatsApp al gimnasio.\n\n` +
        `Yo no tengo un número para pasarte desde acá, pero en la página de inicio de Bravos Box figuran los datos de contacto. ` +
        `Si es algo del sistema, contame qué te pasa y lo intentamos resolver juntos.`,
    }),
  },
  {
    id: "notificaciones",
    titulo: "Notificaciones",
    claves: ["notificacion*", "campanita", "campana", "aviso*", "me avisa", "alertas"],
    respuesta: ({ rol }) => ({
      texto:
        `La campanita 🔔 de arriba a la derecha junta tus avisos del sistema y se actualiza sola cada 30 segundos.\n\n` +
        (rol === "alumno"
          ? `Como alumno te avisa cuando:\n` +
            lista(["se confirma un pago y se activa tu membresía", "se confirma o se cancela una reserva", "desbloqueás un logro", "hay novedades de una clase que reservaste"]) +
            `\n\nAdemás, cuando un pago se acredita te llega un correo con el comprobante.`
          : `Ahí ves los avisos que te genera el sistema. Los que no leíste aparecen con un número verde arriba de la campana.`),
    }),
  },
  {
    id: "tema",
    titulo: "Modo claro y oscuro",
    claves: ["modo oscuro", "modo claro", "tema", "oscuro", "claro", "luna", "colores", "cambiar el color"],
    respuesta: () => ({
      texto: `Podés cambiar entre modo claro y modo oscuro con el botón de la luna 🌙 (o el sol) que está arriba a la derecha, al lado de la campanita. Se guarda solo para la próxima vez que entres.`,
    }),
  },
  {
    id: "contrasena",
    titulo: "Contraseña o acceso",
    claves: ["contrasena", "clave", "password", "olvide", "no puedo entrar", "no me deja entrar", "iniciar sesion", "login", "recuperar"],
    respuesta: () => ({
      texto:
        `Si no recordás tu contraseña:\n` +
        pasos([
          `En la pantalla de inicio de sesión tocá "¿La olvidaste?" (debajo del campo de contraseña).`,
          `Escribí el correo con el que te registraste.`,
          `Te llega un correo con el enlace para crear una contraseña nueva. Revisá también la carpeta de spam.`,
        ]) +
        `\n\nSi ya iniciaste sesión y querés cambiar tus datos, entrá a tu Perfil desde el menú.`,
    }),
  },
  {
    id: "posturas",
    titulo: "Corrección de posturas",
    claves: ["postura*", "tecnica", "corregir", "correccion", "como hago el ejercicio", "forma correcta", "lesion*"],
    respuesta: () => ({
      texto:
        `La corrección de posturas todavía no está disponible 🙈. Estoy en entrenamiento y es una de las cosas que voy a aprender más adelante.\n\n` +
        `Por ahora, si tenés dudas sobre la técnica de un ejercicio o una molestia, consultale al profesor en la clase: es lo más seguro.`,
    }),
  },
]

const EJEMPLOS = {
  alumno: [
    `"¿Cuántos créditos me quedan?"`,
    `"¿Cuándo vence mi membresía?"`,
    `"¿Qué clases hay hoy?"`,
    `"¿Cómo cancelo una reserva?"`,
    `"¿Cómo pago mi cuota?"`,
  ],
  profesor: [`"¿Cómo tomo asistencia?"`, `"¿Cómo cargo una rutina?"`, `"Perdí mi contraseña"`],
  admin: [`"¿Cómo cargo un abono?"`, `"¿Cómo apruebo un comprobante?"`, `"¿Cómo creo una clase?"`, `"¿Cómo doy permisos a un perfil?"`],
}

// ── Temas del ALUMNO ───────────────────────────────────────────────────────

const TEMAS_ALUMNO = [
  {
    id: "reservar",
    titulo: "Cómo reservar una clase",
    claves: ["reserv*", "anotar*", "agendar", "sacar turno", "turno*", "como me anoto", "inscrib*", "cupo*"],
    excluir: ["cancel*", "anular"],
    respuesta: () => ({
      texto:
        `Para reservar una clase:\n` +
        pasos([
          `Entrá a "Reservar Clase" desde el menú.`,
          `Elegí el día y el horario que te convenga. Cada clase muestra el profesor y cuántos cupos quedan.`,
          `Tocá "Reservar" y confirmá. Listo, te llega la confirmación.`,
        ]) +
        `\n\nTené en cuenta:\n` +
        lista([
          `Cada reserva consume 1 crédito.`,
          `Necesitás una membresía vigente con créditos disponibles.`,
          `Si la clase está completa no vas a poder reservarla: probá con otro horario.`,
          `Podés ver o cancelar tus reservas en "Mis Reservas".`,
        ]),
      enlaces: [LINK.reservar, LINK.reservas],
      sugerencias: ["¿Cómo cancelo una reserva?", "¿Cuántos créditos me quedan?"],
    }),
  },
  {
    id: "cancelar",
    titulo: "Cancelar una reserva",
    claves: ["cancel*", "anular*", "no puedo ir", "no voy a poder ir", "borrar reserva", "dar de baja", "devuelven el credito", "devolucion"],
    respuesta: () => ({
      texto:
        `Para cancelar una reserva entrá a "Mis Reservas", buscá la clase en tus próximas reservas y tocá "Cancelar Reserva".\n\n` +
        `Lo importante es la anticipación:\n` +
        lista([
          `Con más de 2 horas de anticipación: el crédito se te devuelve.`,
          `Con menos de 2 horas: la reserva se cancela pero el crédito NO se devuelve.`,
        ]) +
        `\n\nCuando cancelás, el cupo se libera para que otro alumno pueda usarlo. En ambos casos te llega una notificación con lo que pasó.`,
      enlaces: [LINK.reservas],
      sugerencias: ["¿Qué pasa si falto a una clase?", "¿Cómo reservo una clase?"],
    }),
  },
  {
    id: "falto",
    titulo: "Qué pasa si falto",
    claves: ["falto", "faltar", "no asisto", "no asisti", "no fui", "ausente", "ausencia", "me olvide de ir", "no fui a clase", "pierdo el credito"],
    respuesta: () => ({
      texto:
        `Si reservaste y no asistís, el crédito se descuenta igual: el profesor te marca como ausente y el crédito no se devuelve.\n\n` +
        `Para no perderlo, cancelá la reserva con más de 2 horas de anticipación desde "Mis Reservas". Ahí sí se te devuelve.`,
      enlaces: [LINK.reservas],
      sugerencias: ["¿Cómo cancelo una reserva?"],
    }),
  },
  {
    id: "creditos",
    titulo: "Mis créditos",
    dinamico: true,
    claves: ["credito*", "cuantas clases me quedan", "cuantas me quedan", "cuanto me queda", "cuantos me quedan", "saldo", "disponibles", "clases disponibles", "me quedan"],
    excluir: ["cancel*", "devuelven", "devolucion", "no puedo reservar"],
    respuesta: async () => {
      const mp = await traerMiPlan()
      if (!mp.vigente) {
        return {
          texto:
            `Ahora mismo no tenés créditos disponibles porque no hay una membresía vigente.` +
            (mp.ultimoPlan ? ` Tu último plan fue ${mp.ultimoPlan.nombrePlan}.` : "") +
            `\n\nPodés renovarla desde "Mi Membresía": elegís cómo pagar y los créditos se acreditan solos apenas se confirma el pago.`,
          enlaces: [LINK.membresia],
          sugerencias: ["¿Cómo pago mi cuota?", "¿Qué planes hay y cuánto cuestan?"],
        }
      }
      const detalle = mp.planes.map((p) => `${p.nombrePlan}: ${p.disponibles} de ${p.totalCreditos} créditos (vence el ${fmtFechaPlan(p.fechaVencimiento)})`)
      return {
        texto:
          `Tenés ${mp.totalDisponibles} ${mp.totalDisponibles === 1 ? "crédito disponible" : "créditos disponibles"} (de ${mp.totalCreditos} en total).\n\n` +
          lista(detalle) +
          `\n\nRecordá que cada reserva consume 1 crédito y que los créditos de cada membresía vencen junto con ella: no pasan al mes siguiente.`,
        enlaces: [LINK.creditos, LINK.reservar],
        sugerencias: ["¿Cuándo vence mi membresía?", "¿Cómo reservo una clase?"],
      }
    },
  },
  {
    id: "vencimiento",
    titulo: "Vencimiento de mi membresía",
    dinamico: true,
    claves: ["vence*", "vencimiento", "vencio", "vencida", "por vencer", "cuando vence", "hasta cuando", "dia 10", "fecha de vencimiento", "caduca*", "renovacion", "cuanto dura", "duracion", "hasta que dia"],
    respuesta: async () => {
      const mp = await traerMiPlan()
      const regla =
        `\n\nCómo funciona: todas las membresías vencen el día 10 de cada mes. Si pagás cuando faltan menos de 10 días para ese 10, el vencimiento pasa al 10 del mes siguiente, para que nadie pague un mes completo por unos pocos días.`
      if (!mp.vigente) {
        return {
          texto:
            `No tenés una membresía vigente en este momento${mp.ultimoPlan ? ` (la última fue ${mp.ultimoPlan.nombrePlan})` : ""}.` +
            `\n\nPara volver a reservar clases renovala desde "Mi Membresía".` + regla,
          enlaces: [LINK.membresia],
          sugerencias: ["¿Cómo pago mi cuota?"],
        }
      }
      const filas = mp.planes.map((p) => {
        const d = p.diasRestantes
        const cuando = d === 0 ? "vence hoy" : d === 1 ? "vence mañana" : `vence en ${d} días`
        return `${p.nombrePlan}: ${fmtFechaPlan(p.fechaVencimiento)} (${cuando})`
      })
      return {
        texto:
          `Tu membresía vigente:\n` + lista(filas) +
          (mp.porVencer ? `\n\n⚠️ Está por vencer. Podés renovarla desde "Mi Membresía" y los créditos nuevos se suman a los que te queden.` : "") +
          regla,
        enlaces: [LINK.membresia],
        sugerencias: ["¿Cómo pago mi cuota?", "¿Cuántos créditos me quedan?"],
      }
    },
  },
  {
    id: "pagar",
    titulo: "Cómo pagar o renovar",
    claves: ["pagar", "pago", "pagos", "renovar*", "abonar", "cuota", "mensualidad", "como pago", "cobro", "comprar", "contratar", "cambiar de plan", "cambiar plan", "otro plan", "sumar un plan", "segundo plan"],
    respuesta: () => ({
      texto:
        `Para renovar o contratar una membresía:\n` +
        pasos([
          `Entrá a "Mi Membresía" (o tocá el botón "Renovar" del inicio).`,
          `Tocá "Renovar membresía" para pagar el mes de tu plan, o "Contratar otra membresía" para elegir otro.`,
          `Se abre la ventana de pago con el importe y el vencimiento de ese momento. Elegí cómo pagar.`,
          `Apenas se confirma el pago, la membresía y los créditos se acreditan solos y te llega un correo con el comprobante.`,
        ]) +
        `\n\nSi contratás otra membresía, sus créditos se SUMAN a los que ya tenés, y cada una deja de valer cuando vence la suya.`,
      enlaces: [LINK.membresia],
      sugerencias: ["¿Con qué medios puedo pagar?", "¿Qué planes hay y cuánto cuestan?"],
    }),
  },
  {
    id: "medios",
    titulo: "Medios de pago",
    claves: ["medio*", "tarjeta*", "credito o debito", "debito", "qr", "billetera*", "mercado pago", "mercadopago", "mercado credito", "transferencia*", "efectivo", "cuotas", "en cuotas", "sin interes", "como puedo pagar", "con que pago", "con que puedo pagar", "con que se paga", "como se paga", "formas de pago", "forma de pago", "metodo*", "naranja", "uala", "arq"],
    respuesta: () => ({
      texto:
        `Podés pagar de estas formas:\n` +
        lista([
          `Tarjeta de crédito o débito: cargás los datos en la ventana de pago.`,
          `Mercado Crédito: para pagar en cuotas sin usar tarjeta.`,
          `Código QR: lo escaneás con la app de cualquier billetera o banco (Mercado Pago, Naranja X, Ualá, ARQ, etc.).`,
          `Transferencia bancaria: transferís a los datos del gimnasio y subís el comprobante en "Documentos y Comprobantes"; un administrador lo revisa y lo aprueba.`,
          `Efectivo: se paga en recepción y el administrador carga tu membresía.`,
        ]) +
        `\n\nCon tarjeta, Mercado Crédito y QR el pago se acredita automáticamente. Con transferencia o efectivo puede demorar hasta que un administrador lo apruebe.`,
      enlaces: [LINK.membresia, LINK.documentos],
      sugerencias: ["Pagué y no se acreditó", "¿Cómo subo un comprobante?"],
    }),
  },
  {
    id: "no_acredito",
    titulo: "Pagué y no se acreditó",
    claves: ["no se acredito", "no se acredita", "pague y no", "no me llego", "no aparece mi pago", "no impacto", "no se reflejo", "pago no", "acreditar*", "acredito", "impacta*"],
    respuesta: () => ({
      texto:
        `Con tarjeta, Mercado Crédito o QR la acreditación es automática y tarda unos segundos. Si ya pasaron unos minutos, revisá:\n` +
        pasos([
          `"Mi Membresía" y "Mis Créditos": a veces solo hace falta recargar la página.`,
          `La campanita 🔔 y tu correo: al confirmarse te llega un aviso con el comprobante.`,
          `Si pagaste por transferencia o en efectivo, no es automático: un administrador tiene que aprobar tu comprobante o cargar el pago.`,
        ]) +
        `\n\nSi pasó más de una hora y sigue sin aparecer, acercate a la recepción con el comprobante de tu pago para que lo revisen.`,
      enlaces: [LINK.membresia, LINK.creditos],
    }),
  },
  {
    id: "planes",
    titulo: "Planes y precios",
    dinamico: true,
    claves: ["planes", "precio*", "cuanto sale", "cuanto cuesta", "cuanto cuestan", "cuesta*", "valor*", "tarifa*", "cuanto es", "cuanto pago", "que planes", "cuales son los planes", "cuanto tengo que pagar", "cuanto pago por mes", "pagar por mes", "cuanto es por mes", "cuanto sale el pase"],
    respuesta: async () => {
      const r = await apiClient.get("/pagos/planes")
      const planes = (r.data?.data || []).slice().sort((a, b) => Number(a.precio) - Number(b.precio))
      if (!planes.length) return { texto: `Ahora mismo no puedo ver los planes. Podés consultarlos en "Mi Membresía".`, enlaces: [LINK.membresia] }
      const filas = planes.map((p) => {
        const porClase = p.cantidadCreditos > 0 ? ` (≈ ${fmtPrecio(Number(p.precio) / p.cantidadCreditos)} por clase)` : ""
        return `${p.nombre}${p.masPopular ? " ⭐ el más elegido" : ""}: ${fmtPrecio(p.precio)} — ${p.cantidadCreditos} créditos${porClase}`
      })
      return {
        texto:
          `Estos son los planes de Bravos Box:\n` + lista(filas) +
          `\n\nTodos vencen el día 10 de cada mes. Para contratar uno entrá a "Mi Membresía".`,
        enlaces: [LINK.membresia],
        sugerencias: ["¿Cómo pago mi cuota?"],
      }
    },
  },
  {
    id: "horarios",
    titulo: "Clases de hoy y horarios",
    dinamico: true,
    claves: ["horario*", "clases hoy", "que clases hay", "clases de hoy", "a que hora", "hay clase", "que hay hoy", "hoy que", "grilla", "cronograma", "disponibles hoy", "clase de hoy"],
    respuesta: async () => {
      const r = await apiClient.get("/clases/disponibles")
      const todas = r.data?.data || r.data || []
      const hoy = hoyISO()
      const diaBD = DIAS_BD[new Date().getDay()]
      const deHoy = todas
        .filter((c) => {
          if (c.estado !== "Activo") return false
          if (c.fechaEspecifica) return String(c.fechaEspecifica).split("T")[0] === hoy
          return (c.dia || "").toUpperCase().trim() === diaBD
        })
        .sort((a, b) => (a.horaInicio || "").localeCompare(b.horaInicio || ""))
      if (!deHoy.length) {
        return {
          texto: `Hoy no encuentro clases disponibles. Podés ver los otros días en "Reservar Clase".`,
          enlaces: [LINK.reservar],
        }
      }
      const filas = deHoy.slice(0, 10).map((c) => {
        const nombre = c.nombre || c.nombreClase || "Clase"
        const prof = c.nombreProfesor ? ` con ${c.nombreProfesor}` : ""
        const cupos = c.cupoDisponible != null ? ` — ${c.cupoDisponible} ${c.cupoDisponible === 1 ? "cupo" : "cupos"}` : ""
        return `${fmtHora(c.horaInicio)} · ${nombre}${prof}${cupos}`
      })
      return {
        texto: `Las clases de hoy son:\n` + lista(filas) + `\n\nPara ver otros días o reservar, entrá a "Reservar Clase".`,
        enlaces: [LINK.reservar],
        sugerencias: ["¿Cómo reservo una clase?"],
      }
    },
  },
  {
    id: "mis_reservas",
    titulo: "Mis próximas reservas",
    dinamico: true,
    claves: ["mis reservas", "proxima clase", "proximas clases", "que reserve", "tengo reserva", "tengo clase", "cuando es mi clase", "a que clase voy", "mi proxima"],
    respuesta: async () => {
      const r = await apiClient.get("/reservas/mis-reservas")
      const todas = r.data?.data || r.data || []
      const proximas = todas
        .filter((x) => x.estadoReserva === "proxima")
        .sort((a, b) => String(a.fechaReserva).localeCompare(String(b.fechaReserva)) || String(a.horaInicio).localeCompare(String(b.horaInicio)))
      if (!proximas.length) {
        return {
          texto: `No tenés reservas próximas. Cuando quieras, reservá una desde "Reservar Clase".`,
          enlaces: [LINK.reservar],
        }
      }
      const filas = proximas.slice(0, 6).map((x) => {
        const f = fmtFechaPlan(String(x.fechaReserva).slice(0, 10))
        return `${f} · ${fmtHora(x.horaInicio)} · ${x.nombreClase || x.clase || "Clase"}`
      })
      return {
        texto: `Tus próximas reservas:\n` + lista(filas) + `\n\nPodés cancelarlas desde "Mis Reservas" (con más de 2 horas de anticipación te devuelven el crédito).`,
        enlaces: [LINK.reservas],
        sugerencias: ["¿Cómo cancelo una reserva?"],
      }
    },
  },
  {
    id: "no_puedo_reservar",
    titulo: "No puedo reservar",
    dinamico: true,
    claves: ["no puedo reservar", "no me deja reservar", "no me deja anotar", "error al reservar", "no reserva", "no me permite", "sin creditos", "acceso denegado", "no funciona la reserva"],
    respuesta: async () => {
      const mp = await traerMiPlan()
      const causas = [
        mp.vigente
          ? mp.totalDisponibles > 0
            ? `✔ Tu membresía está vigente y tenés ${mp.totalDisponibles} créditos: por ahí no es.`
            : `✖ Tu membresía está vigente pero no te quedan créditos disponibles.`
          : `✖ No tenés una membresía vigente: hay que renovarla para poder reservar.`,
        `La clase puede estar completa (sin cupos).`,
        `El horario puede ya haber pasado o estar por comenzar.`,
        `Ya podrías tener una reserva en esa misma clase.`,
        `Si el mensaje dice "acceso denegado", tu perfil no tiene permiso para esa sección: consultá en recepción.`,
      ]
      return {
        texto: `Si no te deja reservar, estas son las causas más comunes:\n` + lista(causas),
        enlaces: mp.vigente ? [LINK.reservar] : [LINK.membresia],
        sugerencias: mp.vigente ? ["¿Cuántos créditos me quedan?"] : ["¿Cómo pago mi cuota?"],
      }
    },
  },
  {
    id: "rutina_alumno",
    titulo: "Rutina del día",
    claves: ["rutina*", "wod", "ejercicios de hoy", "que se entrena", "que entrenamos", "entrenamiento del dia"],
    respuesta: () => ({
      texto:
        `Para ver la rutina de una clase entrá a "Mis Reservas" y tocá "Ver rutina del día" en la clase que reservaste.\n\n` +
        `Si aparece "Esta clase todavía no tiene una rutina asignada", es que el profesor aún no la cargó: suele estar lista más cerca del horario de la clase.`,
      enlaces: [LINK.reservas],
    }),
  },
  {
    id: "marcas",
    titulo: "Mis marcas y PR",
    claves: ["marca*", "pr", "prs", "record*", "personal record", "mejor marca", "registrar peso", "cargar peso", "series", "historial de marcas"],
    respuesta: () => ({
      texto:
        `"Mis Marcas" sirve para registrar tus marcas personales (PR) y ver cómo progresás.\n\n` +
        `Para cargar una:\n` +
        pasos([
          `Tocá "Nueva marca".`,
          `Elegí el ejercicio de la lista, o "Otro" para escribir uno propio (y decir si se mide en peso, repeticiones o tiempo).`,
          `Cargá las series: en modo "Simple" (ej. 3 series × 5 reps × 80 kg) o "Detallada" si cada serie cambia.`,
          `Guardá. Si superaste tu mejor marca anterior, te avisa "¡Nuevo PR!".`,
        ]) +
        `\n\nCada ejercicio muestra tu mejor marca y su historial. Registrar marcas también desbloquea logros.`,
      enlaces: [LINK.marcas],
      sugerencias: ["¿Qué logros hay?", "¿Cómo funciona la calculadora de RM?"],
    }),
  },
  {
    id: "calculadora",
    titulo: "Calculadora de RM",
    claves: ["rm", "1rm", "repeticion maxima", "repeticiones maximas", "calculadora*", "peso maximo", "maximo", "epley", "brzycki", "porcentaje*"],
    respuesta: () => ({
      texto:
        `La Calculadora RM estima tu 1RM (el peso máximo que podrías levantar en una sola repetición) sin que tengas que probar tu máximo real, que cansa y puede ser riesgoso.\n\n` +
        `Cómo usarla:\n` +
        pasos([
          `Ingresá el peso que levantaste y las repeticiones que lograste (por ejemplo 80 kg × 5).`,
          `Elegí la fórmula: Epley o Brzycki.`,
          `Al instante ves tu 1RM estimado y una tabla con el peso de trabajo para cada porcentaje (del 100 % al 50 %).`,
        ]) +
        `\n\nEs una estimación: funciona mejor con pocas repeticiones (hasta 10 aprox.).`,
      enlaces: [LINK.calculadora],
    }),
  },
  {
    id: "logros",
    titulo: "Logros",
    claves: ["logro*", "medalla*", "insignia*", "racha", "trofeo*", "desbloque*"],
    respuesta: () => ({
      texto:
        `Los logros se desbloquean solos y los ves como íconos en el banner del inicio (pasá el mouse o tocalos para ver el detalle):\n` +
        lista([
          `Primera Clase: completar tu primera clase.`,
          `Racha 5 días: entrenar 5 días seguidos.`,
          `Primer PR: registrar tu primera marca.`,
          `Superándote: superar tus marcas 5 veces.`,
          `Todoterreno: tener marcas en 5 ejercicios distintos.`,
          `Club de los 100: levantar 100 kg o más en una serie.`,
        ]) +
        `\n\nCada vez que desbloqueás uno aparece un festejo y te llega una notificación.`,
      enlaces: [LINK.marcas],
    }),
  },
  {
    id: "documentos",
    titulo: "Documentos y comprobantes",
    claves: ["document*", "comprobante*", "certificado*", "medico", "declaracion*", "jurada", "subir*", "subo", "donde subo", "cargar comprobante", "comprobante de transferencia", "adjuntar", "archivo*", "aprobado", "en revision", "revision"],
    respuesta: () => ({
      texto:
        `En "Documentos y Comprobantes" subís tres tipos de archivo:\n` +
        lista([
          `Comprobante de transferencia: si pagaste por transferencia bancaria.`,
          `Certificado médico: de aptitud física para entrenar.`,
          `Declaración jurada o contrato de membresía firmado.`,
        ]) +
        `\n\nAceptamos PDF, JPG o PNG de hasta 10 MB. Cada documento aparece "En revisión" hasta que un administrador lo aprueba; ahí pasa a "Aprobado". Podés reemplazar cualquiera subiendo uno nuevo, y se conserva el historial.`,
      enlaces: [LINK.documentos],
    }),
  },
  {
    id: "perfil_alumno",
    titulo: "Mi perfil",
    claves: ["perfil", "mis datos", "cambiar datos", "cambiar mi nombre", "foto", "avatar", "correo", "email", "telefono"],
    excluir: ["contrasena", "recuperar", "olvide"],
    respuesta: () => ({
      texto:
        `En "Mi Perfil" podés ver y actualizar tus datos personales y tu foto. También ahí ves el estado de tu membresía.\n\n` +
        `Tocá tu foto o tus iniciales arriba a la derecha para abrir el menú del usuario, que también te deja cambiar de panel o cerrar sesión.`,
      enlaces: [LINK.perfilAlumno],
    }),
  },
]

// ── Temas del PROFESOR ─────────────────────────────────────────────────────

const TEMAS_PROFESOR = [
  {
    id: "asistencia",
    titulo: "Cómo tomo asistencia",
    claves: ["asistencia*", "tomar lista", "lista", "presente*", "ausente*", "pasar lista", "marcar", "alumnos de mi clase", "quien vino"],
    respuesta: () => ({
      texto:
        `Para tomar asistencia:\n` +
        pasos([
          `Entrá a "Asistencia" (es la pantalla de inicio del panel de profesor).`,
          `Elegí la clase y la fecha.`,
          `Tocá "Tomar Lista": aparecen los alumnos que reservaron.`,
          `Marcá a cada uno como "Presente" o "Ausente". Una barra te muestra el progreso de la lista.`,
        ]) +
        `\n\nSi aparece "Sin reservas para esta clase", nadie reservó para esa fecha. Ojo: un alumno marcado como ausente pierde el crédito de esa reserva.`,
      enlaces: [LINK.asistencia],
    }),
  },
  {
    id: "rutinas_prof",
    titulo: "Cargar una rutina",
    claves: ["rutina*", "nueva rutina", "crear rutina", "cargar rutina", "ejercicio*", "video*", "wod", "planificar"],
    respuesta: () => ({
      texto:
        `En "Mis Rutinas" armás las rutinas de tus clases:\n` +
        pasos([
          `Tocá para crear una rutina nueva.`,
          `Cargá los ejercicios con su nombre y, si querés, un video de demostración.`,
          `Guardá. Los alumnos la ven desde "Mis Reservas" con el botón "Ver rutina del día".`,
        ]) +
        `\n\nDesde el listado podés abrir cada rutina para ver su detalle. Si una clase no tiene rutina asignada, el alumno ve el aviso de que todavía no fue cargada.`,
      enlaces: [LINK.rutinas],
    }),
  },
  {
    id: "perfil_prof",
    titulo: "Mi perfil",
    claves: ["perfil", "mis datos", "foto", "avatar", "cambiar datos", "correo", "email"],
    excluir: ["contrasena", "recuperar", "olvide"],
    respuesta: () => ({
      texto: `En "Perfil" podés ver y actualizar tus datos y tu foto. También desde el menú de usuario de arriba a la derecha podés cambiar de panel o cerrar sesión.`,
      enlaces: [LINK.perfilProfesor],
    }),
  },
]

// ── Temas del ADMINISTRADOR ────────────────────────────────────────────────

const TEMAS_ADMIN = [
  {
    id: "cargar_abono",
    titulo: "Cargar un abono",
    claves: ["abono*", "cargar abono", "cargar membresia", "asignar plan", "dar de alta membresia", "carga masiva", "cargar un pago", "membresia*", "nuevo abono", "registrar pago"],
    respuesta: () => ({
      texto:
        `Los abonos se cargan en "Usuarios y Abonos" → "Gestión de Abonos" (Nueva carga):\n` +
        pasos([
          `Escribí el alumno y elegilo de la lista.`,
          `Completá plan, créditos, horario (opcional), fecha de inicio, método de pago y monto. El vencimiento se calcula solo: el día 10 del mes siguiente.`,
          `Si el método es "Transferencia" aparece debajo una fila con los comprobantes que el alumno ya subió.`,
          `Podés agregar más filas y tocar "Guardar todo" para cargarlas de una vez.`,
        ]) +
        `\n\nMás abajo, en "Membresías", ves los abonos agrupados por mes de inicio, con botones para editar o cancelar cada uno.`,
      enlaces: [LINK.cargaAbonos],
      sugerencias: ["¿Cómo apruebo un comprobante?", "¿Cómo cancelo un abono?"],
    }),
  },
  {
    id: "comprobantes",
    titulo: "Aprobar comprobantes",
    claves: ["comprobante*", "aprobar*", "aprobacion", "transferencia*", "revisar comprobante", "validar", "documentos del alumno"],
    respuesta: () => ({
      texto:
        `Los comprobantes de transferencia se revisan en "Gestión de Abonos", en la tabla de "Membresías":\n` +
        pasos([
          `Con las flechas ‹ › (o los botones "Ir a:") elegí el mes: se muestran los comprobantes subidos en ese mes.`,
          `En la columna "Comprobante" tocá el botón "N comprobantes" para desplegar la lista, del más nuevo al más viejo.`,
          `Tocá la fecha para abrir el archivo y revisarlo, y luego "Aprobar".`,
        ]) +
        `\n\nAl guardar un abono por transferencia, si el alumno ya tenía un comprobante desde la fecha de inicio, se aprueba automáticamente el primero.`,
      enlaces: [LINK.cargaAbonos],
    }),
  },
  {
    id: "cancelar_abono",
    titulo: "Cancelar un abono",
    claves: ["cancelar abono", "cancelar un abono", "anular un abono", "eliminar un abono", "borrar un abono", "cancelar una membresia", "anular abono", "anular pago", "cancelar membresia", "borrar abono", "eliminar abono", "papelera", "pago duplicado", "cargue mal"],
    respuesta: () => ({
      texto:
        `En la tabla de "Membresías" de "Gestión de Abonos", cada fila tiene un ícono de papelera para cancelar la membresía y un lápiz para editarla.\n\n` +
        `Al cancelar, el crédito de ese pago deja de valer. Además el sistema entiende que ese pago "no cuenta": si el alumno intenta volver a pagar el mismo plan el mismo día, ya se lo permite (sin esto, un pago del día bloquea otro igual).`,
      enlaces: [LINK.cargaAbonos],
    }),
  },
  {
    id: "usuarios",
    titulo: "Usuarios",
    claves: ["usuario*", "alta de usuario", "crear usuario", "nuevo usuario", "nuevo alumno", "crear alumno", "registrar alumno", "editar usuario", "bloquear", "dar de baja usuario"],
    respuesta: () => ({
      texto:
        `En "Usuarios y Abonos" ves el listado de usuarios. Desde ahí podés:\n` +
        lista([
          `Crear un usuario nuevo (botón de nuevo usuario).`,
          `Entrar a la ficha de uno para ver su detalle y sus abonos.`,
          `Editar sus datos y su perfil de acceso.`,
        ]) +
        `\n\nEl "perfil de acceso" define qué módulos puede usar cada persona (alumno, profesor, administrador u otro perfil personalizado).`,
      enlaces: [LINK.usuarios],
    }),
  },
  {
    id: "clases_admin",
    titulo: "Crear o editar clases",
    claves: ["clase*", "crear clase", "nueva clase", "editar clase", "turno*", "horario*", "cupo*", "profesor asignado", "grilla"],
    respuesta: () => ({
      texto:
        `En "Clases" gestionás la grilla del box:\n` +
        lista([
          `Crear una clase nueva: nombre, días y horarios, cupos y profesor.`,
          `Editar una clase existente desde su fila.`,
          `Ver los turnos y las reservas de cada horario.`,
        ]) +
        `\n\nAsegurate de que la clase tenga un plan compatible si querés que solo lo puedan reservar alumnos de ese plan.`,
      enlaces: [LINK.nuevaClase, LINK.clases],
    }),
  },
  {
    id: "planes_admin",
    titulo: "Planes",
    claves: ["plan*", "precio*", "crear plan", "editar plan", "cambiar precio", "creditos del plan", "tarifa*"],
    respuesta: () => ({
      texto:
        `En "Planes" administrás las membresías que ven los alumnos: nombre, precio y cantidad de créditos.\n\n` +
        `Los cambios se reflejan en el catálogo de "Mi Membresía" de los alumnos. Además el sistema marca automáticamente como "más popular" al plan que más compran los clientes.`,
      enlaces: [LINK.planes],
    }),
  },
  {
    id: "perfiles",
    titulo: "Perfiles y permisos",
    claves: ["perfil*", "permiso*", "rol*", "acceso*", "modulo*", "que puede ver", "restringir", "denegado"],
    respuesta: () => ({
      texto:
        `El sistema usa perfiles con permisos granulares (no roles fijos). En "Perfiles":\n` +
        pasos([
          `Creá un perfil o abrí uno existente.`,
          `Marcá, módulo por módulo, qué acciones puede hacer (por ejemplo consulta de clases, creación, edición).`,
          `Asigná ese perfil a los usuarios desde "Usuarios y Abonos".`,
        ]) +
        `\n\nCada persona ve solo los paneles y módulos para los que tiene permiso. Si alguien recibe "Acceso denegado por permisos insuficientes", falta activarle ese permiso en su perfil.`,
      enlaces: [LINK.perfiles],
    }),
  },
  {
    id: "resumen",
    titulo: "Resumen e ingresos",
    claves: ["resumen", "dashboard", "ingreso*", "reporte*", "estadistica*", "metricas", "cuanto se recaudo", "por vencer", "activos"],
    respuesta: () => ({
      texto:
        `El "Resumen" (inicio del panel) muestra de un vistazo:\n` +
        lista([
          `Total de usuarios y usuarios activos.`,
          `Ingresos del mes actual.`,
          `Membresías que vencen en los próximos 7 días.`,
        ]) +
        `\n\nPara un análisis más detallado entrá a "Reportes".`,
      enlaces: [LINK.resumen, LINK.reportes],
    }),
  },
  {
    id: "mercadopago",
    titulo: "Pagos con Mercado Pago",
    claves: ["mercado pago", "mercadopago", "mp", "tarjeta*", "qr", "webhook*", "pago automatico", "pagos online", "acreditacion"],
    respuesta: () => ({
      texto:
        `Los pagos con tarjeta, Mercado Crédito y QR se acreditan solos: cuando Mercado Pago confirma el cobro se crea el pago y los créditos del alumno, sin que hagas nada. El alumno recibe una notificación y un correo.\n\n` +
        `Hay protecciones para que un mismo pago nunca se acredite dos veces, y todos vencen el día 10.\n\n` +
        `Los pagos por transferencia y en efectivo sí los cargás o aprobás vos desde "Gestión de Abonos".`,
      enlaces: [LINK.cargaAbonos],
    }),
  },
  {
    id: "configuracion",
    titulo: "Configuración",
    claves: ["configuracion*", "cbu", "cvu", "alias", "datos bancarios", "banco", "landing", "pagina web", "sitio web", "titular", "cuit"],
    respuesta: () => ({
      texto:
        `En "Configuración" cargás los datos que se muestran en el sitio y en las pantallas de pago, como los datos bancarios para transferencias (banco, titular, CUIT, CBU/CVU y alias).\n\n` +
        `Mantenelos actualizados: los alumnos los ven al elegir pagar por transferencia.`,
      enlaces: [LINK.configuracion],
    }),
  },
]

// ── Datos dinámicos ────────────────────────────────────────────────────────

let cacheMiPlan = null
async function traerMiPlan() {
  // Se cachea unos segundos para no repetir la consulta si el alumno hace varias preguntas seguidas
  if (cacheMiPlan && Date.now() - cacheMiPlan.t < 15000) return cacheMiPlan.data
  const r = await apiClient.get("/pagos/mi-plan")
  const data = r.data?.data || r.data
  cacheMiPlan = { t: Date.now(), data }
  return data
}

// ── Motor ──────────────────────────────────────────────────────────────────

function buscarTema(pregunta, temas) {
  let mejor = null
  let mejorPuntaje = 0
  for (const tema of temas) {
    if (tema.excluir?.some((x) => puntajeClave(pregunta, x) > 0)) continue
    const puntaje = tema.claves.reduce((acc, c) => acc + puntajeClave(pregunta, c), 0)
    if (puntaje > mejorPuntaje) {
      mejor = tema
      mejorPuntaje = puntaje
    }
  }
  return mejor
}

const TEMAS_POR_ROL = {
  alumno: TEMAS_ALUMNO,
  profesor: TEMAS_PROFESOR,
  admin: TEMAS_ADMIN,
}

/** Temas que se ofrecen cuando no se entiende la pregunta. */
const TITULOS_AYUDA = {
  alumno: ["¿Cuántos créditos me quedan?", "¿Cuándo vence mi membresía?", "¿Qué clases hay hoy?", "¿Cómo cancelo una reserva?", "¿Cómo pago mi cuota?"],
  profesor: ["¿Cómo tomo asistencia?", "¿Cómo cargo una rutina?"],
  admin: ["¿Cómo cargo un abono?", "¿Cómo apruebo un comprobante?", "¿Cómo creo una clase?", "¿Cómo doy permisos a un perfil?"],
}

/**
 * @param {string} pregunta  texto que escribió la persona
 * @param {{rol: "alumno"|"profesor"|"admin", nombre?: string, mascota: string}} contexto
 * @returns {Promise<{texto: string, enlaces?: {texto: string, ruta: string}[], sugerencias?: string[]}>}
 */
export async function responder(pregunta, contexto) {
  const rol = contexto.rol in TEMAS_POR_ROL ? contexto.rol : "alumno"
  const q = normalizar(pregunta)

  // Los temas del rol van primero: si empatan con uno común, gana el del rol
  const tema = buscarTema(q, [...TEMAS_POR_ROL[rol], ...TEMAS_COMUNES])

  if (!tema) {
    return {
      texto:
        `No estoy seguro de haber entendido tu pregunta 🤔. Todavía estoy aprendiendo.\n\n` +
        `Probá con otras palabras, o elegí alguna de estas:`,
      sugerencias: TITULOS_AYUDA[rol],
    }
  }

  try {
    return await tema.respuesta({ ...contexto, rol })
  } catch {
    return {
      texto:
        `Quise consultar tus datos, pero en este momento no pude 😕. Probá de nuevo en unos segundos` +
        (tema.dinamico ? ` o mirá directamente en el menú de la izquierda.` : `.`),
    }
  }
}
