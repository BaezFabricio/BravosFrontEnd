import { useMemo, useState } from "react"
import { MessageCircle, Copy, Send } from "lucide-react"
import { toast } from "@/lib/notificar"

// Fecha "YYYY-MM-DD" → "lunes 28/09" (sin pasar por new Date("YYYY-MM-DD"), que en Argentina corre un día)
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]
const fechaCorta = (iso) => {
  if (!iso) return ""
  const d = new Date(`${iso}T12:00:00`)
  const [, m, dd] = iso.split("-")
  return `${DIAS[d.getDay()]} ${dd}/${m}`
}

const hoyISO = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Cada plantilla define los datos que se piden y cómo se arma el texto con ellos.
const PLANTILLAS = [
  {
    id: "suspendida",
    nombre: "Clase suspendida",
    campos: [
      { key: "clase", label: "Clase", placeholder: "CrossFit" },
      { key: "fecha", label: "Fecha", tipo: "date" },
      { key: "horario", label: "Horario", placeholder: "19:00" },
      { key: "detalle", label: "Motivo (opcional)", placeholder: "Por mantenimiento del local" },
    ],
    texto: (v) =>
      `🚫 *Clase suspendida*\n\n${v.fecha && v.fecha !== hoyISO() ? `El ${fechaCorta(v.fecha)}` : "Hoy"} no hay clase${v.clase ? ` de ${v.clase}` : ""}${v.horario ? ` de las ${v.horario} hs` : ""}.${v.detalle ? `\n${v.detalle}.` : ""}\n\nDisculpen las molestias. ¡Nos vemos en la próxima! 💪\n_BravosBox_`,
  },
  {
    id: "horario",
    nombre: "Cambio de horario",
    campos: [
      { key: "clase", label: "Clase", placeholder: "CrossFit" },
      { key: "fecha", label: "Fecha", tipo: "date" },
      { key: "horarioViejo", label: "Horario anterior", placeholder: "19:00" },
      { key: "horarioNuevo", label: "Horario nuevo", placeholder: "20:00" },
    ],
    texto: (v) =>
      `🕒 *Cambio de horario*\n\nLa clase${v.clase ? ` de ${v.clase}` : ""}${v.fecha ? ` del ${fechaCorta(v.fecha)}` : ""} cambia${v.horarioViejo ? ` de las ${v.horarioViejo} hs` : ""}${v.horarioNuevo ? ` a las ${v.horarioNuevo} hs` : ""}.\n\nSi ya reservaste y no podés en el nuevo horario, cancelá tu reserva desde el sistema.\n_BravosBox_`,
  },
  {
    id: "cerrado",
    nombre: "Feriado / gimnasio cerrado",
    campos: [
      { key: "fecha", label: "Fecha", tipo: "date" },
      { key: "detalle", label: "Detalle (opcional)", placeholder: "Feriado nacional. Retomamos el martes." },
    ],
    texto: (v) =>
      `📅 *Aviso*\n\n${v.fecha ? `El ${fechaCorta(v.fecha)}` : "Ese día"} el gimnasio permanecerá cerrado.${v.detalle ? `\n${v.detalle}` : ""}\n\n¡Gracias por entender! 🙌\n_BravosBox_`,
  },
  {
    id: "pago",
    nombre: "Recordatorio de pago",
    campos: [
      { key: "fecha", label: "Fecha límite", tipo: "date" },
      { key: "detalle", label: "Detalle (opcional)", placeholder: "Recordá que después del día 10 hay recargo." },
    ],
    texto: (v) =>
      `💳 *Recordatorio de membresía*\n\nTe recordamos renovar tu membresía${v.fecha ? ` antes del ${fechaCorta(v.fecha)}` : " este mes"} para seguir entrenando sin cortes.${v.detalle ? `\n${v.detalle}` : ""}\n\nPodés pagar desde el sistema, en *Mi Membresía*.\n_BravosBox_`,
  },
  {
    id: "libre",
    nombre: "Mensaje libre",
    campos: [],
    texto: () => "",
  },
]

const inp =
  "w-full bg-card border border-border text-base sm:text-sm text-foreground px-3 py-2.5 outline-none focus:border-foreground/40 transition-colors placeholder:text-foreground/25"
const label = "mb-1.5 block text-[10px] font-black uppercase tracking-widest text-muted-foreground"

export default function AvisosPage() {
  const [plantillaId, setPlantillaId] = useState(PLANTILLAS[0].id)
  const [valores, setValores] = useState({ fecha: hoyISO() })
  const [mensaje, setMensaje] = useState(() => PLANTILLAS[0].texto({ fecha: hoyISO() }))

  const plantilla = useMemo(() => PLANTILLAS.find((p) => p.id === plantillaId), [plantillaId])

  const elegirPlantilla = (id) => {
    const p = PLANTILLAS.find((x) => x.id === id)
    const v = { fecha: hoyISO() }
    setPlantillaId(id)
    setValores(v)
    setMensaje(p.texto(v))
  }

  // Al completar un dato, el texto se vuelve a armar con la plantilla
  const cambiarCampo = (key, valor) => {
    const v = { ...valores, [key]: valor }
    setValores(v)
    setMensaje(plantilla.texto(v))
  }

  const vacio = mensaje.trim().length === 0

  const enviar = () => {
    if (vacio) return
    // Abre WhatsApp con el texto ya escrito; el administrador elige su lista de difusión o grupo y envía
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer")
  }

  const copiar = async () => {
    if (vacio) return
    try {
      await navigator.clipboard.writeText(mensaje)
      toast.success("Mensaje copiado")
    } catch {
      toast.error("No se pudo copiar el mensaje")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Avisos por WhatsApp</h1>
        <p className="mt-0.5 text-sm text-foreground/50">
          Armá el mensaje acá y envialo a tu lista de difusión o grupo desde WhatsApp.
        </p>
      </div>

      {/* Plantillas */}
      <div>
        <p className={label}>Tipo de aviso</p>
        <div className="flex flex-wrap gap-2">
          {PLANTILLAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => elegirPlantilla(p.id)}
              className={`border px-3 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
                plantillaId === p.id
                  ? "border-lime-500 bg-lime-400/15 text-lime-700 dark:text-lime-400"
                  : "border-border text-foreground/50 hover:bg-foreground/5"
              }`}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos + texto */}
        <div className="space-y-4 border border-border bg-card p-4">
          {plantilla.campos.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {plantilla.campos.map((c) => (
                <div key={c.key} className={c.key === "detalle" ? "sm:col-span-2" : ""}>
                  <label className={label}>{c.label}</label>
                  <input
                    type={c.tipo || "text"}
                    className={inp}
                    placeholder={c.placeholder}
                    value={valores[c.key] || ""}
                    onChange={(e) => cambiarCampo(c.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className={label}>Mensaje</label>
            <textarea
              className={`${inp} min-h-[180px] resize-y leading-relaxed`}
              placeholder="Escribí tu mensaje..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
            <p className="mt-1 text-xs text-foreground/40">
              Podés editarlo a mano. Si cambiás un dato de arriba, el texto se arma de nuevo con la plantilla.
              Usá *texto* para negrita y _texto_ para cursiva.
            </p>
          </div>
        </div>

        {/* Vista previa + acciones */}
        <div className="space-y-4">
          <div>
            <p className={label}>Así lo van a ver</p>
            <div className="border border-border bg-muted/30 p-4">
              <div className="ml-auto max-w-[92%] whitespace-pre-wrap break-words rounded-lg rounded-tr-none bg-lime-400/15 px-3 py-2 text-sm leading-relaxed text-foreground">
                {vacio ? <span className="text-foreground/30">El mensaje aparece acá.</span> : mensaje}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={enviar}
              disabled={vacio}
              className="flex flex-1 items-center justify-center gap-2 bg-lime-400 px-5 py-3.5 text-sm font-black uppercase tracking-widest text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
              Enviar por WhatsApp
            </button>
            <button
              type="button"
              onClick={copiar}
              disabled={vacio}
              className="flex items-center justify-center gap-2 border border-border px-5 py-3.5 text-sm font-black uppercase tracking-widest text-foreground/70 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Copy className="h-4 w-4" />
              Copiar
            </button>
          </div>

          <p className="flex items-start gap-2 text-xs text-foreground/40">
            <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Al tocar "Enviar por WhatsApp" se abre WhatsApp con el mensaje ya escrito. Ahí elegís la lista de difusión o
            el grupo y lo enviás. El sistema no manda nada por su cuenta.
          </p>
        </div>
      </div>
    </div>
  )
}
