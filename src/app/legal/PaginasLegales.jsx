import LegalLayout, { H2, Lista, Destacado, Enlace, Identificacion, Contacto } from "./LegalLayout"
import { useDatosLegales } from "./datosLegales"

/*
 * Textos legales de Bravos Box (Argentina).
 * Base: Ley 25.326 de Protección de Datos Personales y su decreto 1558/2001, Ley 24.240 de Defensa
 * del Consumidor, Código Civil y Comercial (arts. 1092 a 1122) y Res. SCI 424/2020.
 * Si se modifica un texto, actualizar ACTUALIZACION_LEGAL (LegalLayout.jsx) y VERSION_LEGAL del backend.
 */

// ── POLÍTICA DE PRIVACIDAD ───────────────────────────────────────────────────
export function PrivacidadPage() {
  const d = useDatosLegales()
  return (
    <LegalLayout titulo="Política de privacidad">
      <p>
        Esta política explica qué datos personales guardamos cuando usás el sitio y el sistema de {d.nombre},
        para qué los usamos, con quién los compartimos y cómo podés ejercer tus derechos. Se rige por la
        Ley 25.326 de Protección de Datos Personales y sus normas complementarias.
      </p>

      <H2>1. Responsable de los datos</H2>
      <p>
        El responsable de la base de datos es <Identificacion d={d} />. Para cualquier consulta sobre tus
        datos podés escribirnos <Contacto d={d} />.
      </p>

      <H2>2. Qué datos guardamos</H2>
      <Lista>
        <li><strong>Datos de tu cuenta:</strong> nombre completo, DNI, correo electrónico, teléfono y contraseña. La contraseña se guarda cifrada: nadie del box puede leerla.</li>
        <li><strong>Foto de perfil</strong>, si decidís subir una.</li>
        <li><strong>Tu actividad en el box:</strong> membresías, créditos, reservas, asistencias, pagos, marcas personales y logros.</li>
        <li><strong>Documentos que subís:</strong> comprobantes de transferencia y, si los cargás, certificado médico y declaración jurada.</li>
        <li><strong>Datos técnicos:</strong> la dirección IP desde la que aceptás estas condiciones o enviás una solicitud, y los registros necesarios para proteger el sistema (por ejemplo, para frenar intentos repetidos de adivinar contraseñas).</li>
      </Lista>
      <p>
        Los datos de tu tarjeta los ingresás en el formulario de Mercado Pago y los procesa Mercado Pago:
        {" "}{d.nombre} no los ve ni los guarda.
      </p>

      <H2>3. Para qué los usamos</H2>
      <Lista>
        <li>Crear y administrar tu cuenta, tu membresía y tus créditos.</li>
        <li>Gestionar reservas, cupos y asistencia a las clases.</li>
        <li>Cobrar las membresías y enviarte el comprobante.</li>
        <li>Mandarte avisos necesarios para el servicio: verificación de correo, clases nuevas, vencimiento de la membresía y novedades de tu cuenta.</li>
        <li>Controlar la aptitud física para entrenar, cuando nos das tu certificado médico.</li>
        <li>Proteger el sistema y cumplir obligaciones legales, contables e impositivas.</li>
      </Lista>
      <p>No vendemos ni alquilamos tus datos, y no los usamos para publicidad de terceros.</p>

      <H2>4. Datos de salud</H2>
      <p>
        El certificado médico y la declaración jurada contienen datos de salud, que la ley considera datos
        sensibles (art. 7, Ley 25.326). <strong>Nadie está obligado a proporcionarlos.</strong> Solo los
        guardamos si nos das tu autorización expresa al subirlos, los usamos únicamente para evaluar tu aptitud
        para la actividad física y solo pueden verlos vos y el personal autorizado del box.
      </p>

      <H2>5. Con quién los compartimos</H2>
      <p>Solo con quienes necesitamos para prestar el servicio, y solo lo indispensable:</p>
      <Lista>
        <li><strong>Mercado Pago</strong>, para procesar los pagos online.</li>
        <li><strong>Google</strong>, que provee el servicio de correo con el que te enviamos los avisos.</li>
        <li>El proveedor del servidor donde funciona el sistema.</li>
        <li>Autoridades públicas, cuando una ley o una orden judicial lo exija.</li>
      </Lista>
      <p>
        Algunos de estos proveedores pueden guardar información en servidores fuera de Argentina, con
        niveles de protección adecuados según sus propias políticas.
      </p>

      <H2>6. Cuánto tiempo los guardamos</H2>
      <p>
        Mientras tengas una cuenta en el box. Si pedís la baja, borramos o anonimizamos tus datos, salvo
        los que debamos conservar por obligaciones legales (por ejemplo, registros de pagos durante los plazos
        que fijan las normas contables e impositivas) y las constancias de lo que aceptaste, mientras puedan
        servir de prueba ante un reclamo.
      </p>

      <H2>7. Cómo los protegemos</H2>
      <Lista>
        <li>Conexión cifrada (HTTPS) entre tu dispositivo y el sistema.</li>
        <li>Contraseñas cifradas y sesión en una cookie que el código de la página no puede leer.</li>
        <li>Acceso por permisos: cada persona del box ve solo lo que su función necesita.</li>
        <li>Tus documentos solo los podés ver vos y los administradores autorizados.</li>
      </Lista>

      <H2>8. Tus derechos</H2>
      <p>En cualquier momento podés pedirnos:</p>
      <Lista>
        <li><strong>Acceso:</strong> saber qué datos tuyos tenemos. Respondemos dentro de los 10 días corridos.</li>
        <li><strong>Rectificación y actualización:</strong> corregir datos equivocados o desactualizados.</li>
        <li><strong>Supresión:</strong> que borremos tus datos, con las excepciones del punto 6.</li>
        <li><strong>Revocar tu consentimiento</strong>, por ejemplo para que borremos tu certificado médico.</li>
      </Lista>
      <p>
        Rectificaciones y supresiones se resuelven dentro de los 5 días hábiles. Para ejercer estos derechos
        escribinos <Contacto d={d} />, indicando tu nombre y DNI. Muchos datos los podés corregir vos mismo
        desde tu perfil.
      </p>
      <Destacado>
        <p>
          El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en
          forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al
          efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326.
        </p>
        <p className="mt-3">
          La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley
          N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten
          afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de
          datos personales.
        </p>
      </Destacado>

      <H2>9. Menores de edad</H2>
      <p>
        Las personas menores de 18 años pueden registrarse solo con la autorización de su madre, padre o
        tutor, quien puede ejercer los derechos de esta política en su nombre.
      </p>

      <H2>10. Cookies</H2>
      <p>
        Lo que guardamos en tu navegador está explicado en la <Enlace to="/cookies">Política de cookies</Enlace>.
      </p>

      <H2>11. Cambios en esta política</H2>
      <p>
        Si la modificamos, publicaremos la nueva versión en esta página con su fecha. Si el cambio es
        importante, te avisaremos por correo o dentro del sistema.
      </p>
    </LegalLayout>
  )
}

// ── TÉRMINOS Y CONDICIONES ───────────────────────────────────────────────────
export function TerminosPage() {
  const d = useDatosLegales()
  return (
    <LegalLayout titulo="Términos y condiciones">
      <p>
        Estos términos regulan el uso del sitio y del sistema de {d.nombre} (reservas, pagos y seguimiento
        del entrenamiento) y la contratación de sus membresías. Al crear una cuenta o pagar una membresía
        aceptás estos términos, la <Enlace to="/privacidad">Política de privacidad</Enlace> y la{" "}
        <Enlace to="/reembolsos">Política de reembolsos</Enlace>.
      </p>

      <H2>1. Quién presta el servicio</H2>
      <p>
        El servicio lo presta <Identificacion d={d} />. Podés contactarnos <Contacto d={d} />.
      </p>

      <H2>2. Tu cuenta</H2>
      <Lista>
        <li>Tenés que dar datos verdaderos y mantenerlos actualizados. Cada cuenta es personal: no la compartas ni prestes tu contraseña.</li>
        <li>Si sos menor de 18 años, necesitás la autorización de tu madre, padre o tutor.</li>
        <li>El box revisa las cuentas nuevas y les asigna el perfil que corresponde (alumno, profesor o administración).</li>
        <li>Podemos suspender una cuenta si se usa para fraudes, para acceder a datos ajenos o para dañar el sistema, avisándote el motivo.</li>
      </Lista>

      <H2>3. Membresías y créditos</H2>
      <Lista>
        <li>Cada plan tiene un precio y una cantidad de créditos que se informan antes de pagar. Un crédito equivale a una clase.</li>
        <li>La membresía vence en la fecha que figura en tu cuenta y en el comprobante. Los créditos que no uses hasta esa fecha no se acumulan para el período siguiente.</li>
        <li>Los precios pueden cambiar, pero el cambio nunca afecta a una membresía que ya pagaste.</li>
      </Lista>

      <H2>4. Reservas y cancelaciones</H2>
      <Lista>
        <li>Reservar una clase usa un crédito. Los cupos son limitados y se asignan por orden de reserva.</li>
        <li>Si cancelás con 2 horas o más de anticipación, te devolvemos el crédito. Si cancelás con menos tiempo o no asistís, el crédito se pierde.</li>
        <li>Si el box suspende o reprograma una clase, te avisamos y te devolvemos el crédito.</li>
      </Lista>

      <H2>5. Pagos</H2>
      <Lista>
        <li>Online podés pagar con Mercado Pago (tarjeta, QR o Mercado Crédito) o por transferencia, subiendo el comprobante. En el box también podés pagar en efectivo o con tarjeta.</li>
        <li>El precio final, con los recargos que correspondan (por ejemplo, por pago con tarjeta de crédito en el box), se informa antes de pagar.</li>
        <li>Los pagos por transferencia se acreditan cuando el box verifica el comprobante.</li>
      </Lista>

      <H2>6. Salud y seguridad</H2>
      <p>
        El entrenamiento funcional y el CrossFit son actividades físicas exigentes. Antes de empezar te
        recomendamos un control médico, y el box puede pedirte un certificado de aptitud física. Avisá al
        profesor si tenés una lesión, una enfermedad o estás embarazada, y seguí sus indicaciones. Esto no
        limita la responsabilidad que la ley pone a cargo del box por la seguridad de sus instalaciones y
        de sus clases.
      </p>

      <H2>7. Uso correcto del sistema</H2>
      <p>No está permitido:</p>
      <Lista>
        <li>Intentar entrar a cuentas o datos de otras personas.</li>
        <li>Subir archivos falsos, con virus o con contenido ilegal u ofensivo.</li>
        <li>Usar el sistema para fines distintos a los del box o intentar alterar su funcionamiento.</li>
      </Lista>

      <H2>8. Propiedad intelectual</H2>
      <p>
        La marca, el logo, los textos, las imágenes y las rutinas publicadas son de {d.nombre} o de sus
        autores. Podés usarlos para tu entrenamiento personal, pero no copiarlos ni publicarlos sin permiso.
      </p>

      <H2>9. Disponibilidad del sistema</H2>
      <p>
        Hacemos lo posible para que el sistema funcione siempre, pero puede haber interrupciones por
        mantenimiento, cortes de internet o fallas de servicios de terceros como Mercado Pago. Si una falla
        te impide reservar o te genera un cobro equivocado, escribinos y lo solucionamos.
      </p>

      <H2>10. Arrepentimiento y reembolsos</H2>
      <p>
        Podés arrepentirte de una compra online dentro de los 10 días corridos, sin costo y sin dar
        explicaciones, desde el <Enlace to="/arrepentimiento">botón de arrepentimiento</Enlace>. El resto
        de los casos está en la <Enlace to="/reembolsos">Política de reembolsos</Enlace>.
      </p>

      <H2>11. Cambios en estos términos</H2>
      <p>
        Podemos actualizar estos términos. La nueva versión rige desde su publicación en esta página y no
        cambia las condiciones de una membresía ya pagada. Si el cambio es importante, te lo avisaremos.
      </p>

      <H2>12. Ley aplicable y reclamos</H2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina, en especial la Ley 24.240 de
        Defensa del Consumidor. Ninguna parte de estos términos limita los derechos que esa ley te
        reconoce. Ante un conflicto son competentes los tribunales de tu domicilio como consumidor. Antes
        de reclamar, te invitamos a escribirnos: la mayoría de los problemas se resuelven rápido.
      </p>
    </LegalLayout>
  )
}

// ── POLÍTICA DE COOKIES ──────────────────────────────────────────────────────
const FILAS_COOKIES = [
  {
    nombre: "bravos_token",
    tipo: "Cookie propia, necesaria",
    para: "Mantener tu sesión iniciada. El código de la página no puede leerla.",
    dura: "24 horas, o hasta que cerrás sesión",
  },
  {
    nombre: "usuario, permisos, avatarUrl",
    tipo: "Almacenamiento local, necesario",
    para: "Mostrar tu nombre, tu foto y el menú que corresponde a tu perfil.",
    dura: "Hasta que cerrás sesión",
  },
  {
    nombre: "vite-ui-theme",
    tipo: "Almacenamiento local, preferencia",
    para: "Recordar si elegiste el modo claro u oscuro.",
    dura: "Hasta que lo borres del navegador",
  },
  {
    nombre: "Mercado Pago",
    tipo: "De terceros, necesarias para pagar",
    para: "Procesar el pago y prevenir fraudes. Se cargan solo en la ventana de pago.",
    dura: "Las define Mercado Pago",
  },
  {
    nombre: "Google Maps",
    tipo: "De terceros, opcionales",
    para: "Mostrar el mapa del box. Se cargan solo si tocás «Ver mapa».",
    dura: "Las define Google",
  },
  {
    nombre: "YouTube",
    tipo: "De terceros, opcionales",
    para: "Videos de ejercicios en modo de privacidad mejorada: YouTube guarda datos recién cuando reproducís un video.",
    dura: "Las define Google",
  },
]

export function CookiesPage() {
  const d = useDatosLegales()
  return (
    <LegalLayout titulo="Política de cookies">
      <p>
        Las cookies y el almacenamiento local son pequeños archivos que un sitio guarda en tu navegador. En{" "}
        {d.nombre} los usamos solo para que el sistema funcione y para recordar tus preferencias.{" "}
        <strong>No usamos cookies de publicidad ni herramientas de seguimiento o analítica.</strong>
      </p>

      <H2>Qué guardamos</H2>
      {/* En celular, una tarjeta por elemento (sin scroll horizontal) */}
      <div className="space-y-3 md:hidden">
        {FILAS_COOKIES.map((f) => (
          <div key={f.nombre} className="rounded-lg border border-border p-3 text-sm">
            <p className="font-mono text-xs font-bold text-foreground">{f.nombre}</p>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wider text-foreground/50">{f.tipo}</p>
            <p className="mt-2">{f.para}</p>
            <p className="mt-1 text-foreground/60">Duración: {f.dura}</p>
          </div>
        ))}
      </div>
      <div className="hidden rounded-lg border border-border md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wider text-foreground/60">
            <tr>
              <th className="px-3 py-2.5 font-black">Nombre</th>
              <th className="px-3 py-2.5 font-black">Tipo</th>
              <th className="px-3 py-2.5 font-black">Para qué</th>
              <th className="px-3 py-2.5 font-black">Duración</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {FILAS_COOKIES.map((f) => (
              <tr key={f.nombre} className="align-top">
                <td className="px-3 py-2.5 font-mono text-xs text-foreground">{f.nombre}</td>
                <td className="px-3 py-2.5">{f.tipo}</td>
                <td className="px-3 py-2.5">{f.para}</td>
                <td className="px-3 py-2.5">{f.dura}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Además, las tipografías del sitio se descargan de Google Fonts. Ese servicio no guarda cookies, pero
        Google recibe la dirección IP de tu conexión al entregarlas.
      </p>

      <H2>¿Por qué no aparece un cartel de cookies?</H2>
      <p>
        Porque al entrar al sitio solo se guarda lo estrictamente necesario para que funcione, y eso no
        requiere un permiso aparte. Lo opcional (el mapa de Google y los videos de YouTube) recién se carga
        cuando vos lo pedís, y ese gesto es tu consentimiento. Si en el futuro sumamos herramientas de
        analítica o publicidad, te pediremos permiso antes de activarlas.
      </p>

      <H2>Cómo borrarlas</H2>
      <p>
        Al cerrar sesión se borran la cookie de sesión y los datos de tu cuenta guardados en el navegador.
        También podés borrar todo desde la configuración de privacidad de tu navegador. Si bloqueás la cookie
        de sesión, no vas a poder iniciar sesión.
      </p>

      <H2>Más información</H2>
      <p>
        Cómo tratamos tus datos personales está explicado en la{" "}
        <Enlace to="/privacidad">Política de privacidad</Enlace>.
      </p>
    </LegalLayout>
  )
}

// ── POLÍTICA DE REEMBOLSOS ───────────────────────────────────────────────────
export function ReembolsosPage() {
  const d = useDatosLegales()
  return (
    <LegalLayout titulo="Política de reembolsos">
      <p>
        Esta política explica cuándo y cómo te devolvemos el dinero de una membresía de {d.nombre}. Nada de
        lo que dice limita los derechos que te da la Ley 24.240 de Defensa del Consumidor.
      </p>

      <H2>1. Derecho de arrepentimiento (10 días)</H2>
      <p>
        Si compraste tu membresía por el sitio (con Mercado Pago o por transferencia informada desde el
        sistema), podés arrepentirte <strong>dentro de los 10 días corridos desde la compra</strong>, sin
        costo y sin tener que explicar el motivo (Ley 24.240, art. 34, y Código Civil y Comercial, arts.
        1110 a 1116).
      </p>
      <Lista>
        <li>Pedilo desde el <Enlace to="/arrepentimiento">botón de arrepentimiento</Enlace>. No necesitás iniciar sesión.</li>
        <li>Te damos en el momento un código que deja constancia de tu pedido, y te lo enviamos por correo.</li>
        <li>Te devolvemos el total por el mismo medio con el que pagaste, y se cancelan la membresía y las reservas pendientes.</li>
      </Lista>
      <Destacado>
        Los tiempos de acreditación dependen del medio de pago: en Mercado Pago suele verse en pocos días;
        con tarjeta de crédito, puede aparecer en el resumen siguiente.
      </Destacado>

      <H2>2. Cobros duplicados o equivocados</H2>
      <p>
        Si se te cobró dos veces o un monto incorrecto, te devolvemos la diferencia completa en cualquier
        momento. Escribinos con el comprobante.
      </p>

      <H2>3. Si el box no puede darte el servicio</H2>
      <p>
        Si el box cierra, suspende sus actividades o cancela clases sin reprogramarlas, te devolvemos la
        parte proporcional de los créditos que no pudiste usar, o te los reintegramos para usar más adelante,
        como prefieras.
      </p>

      <H2>4. Después de los 10 días</H2>
      <p>
        Pasado el plazo de arrepentimiento, la membresía no se reembolsa por créditos que no usaste: los
        créditos vencen en la fecha de vencimiento de la membresía. Si tenés una lesión o un problema de
        salud que te impide entrenar, escribinos con el certificado médico: evaluamos pausar tu membresía
        para que no pierdas los créditos.
      </p>

      <H2>5. Compras hechas en el box</H2>
      <p>
        Si pagaste en la recepción (efectivo, débito o tarjeta), rigen los puntos 2, 3 y 4. El derecho de
        arrepentimiento del punto 1 es para compras hechas a distancia, por el sitio.
      </p>

      <H2>6. Cómo pedir un reembolso</H2>
      <p>
        Además del botón de arrepentimiento, podés escribirnos <Contacto d={d} />. Indicá tu nombre, DNI,
        la fecha del pago y el motivo. Te respondemos a la brevedad.
      </p>
    </LegalLayout>
  )
}
