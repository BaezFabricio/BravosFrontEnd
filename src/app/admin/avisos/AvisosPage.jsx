import { useState } from "react"
import { Copy, ChevronDown, CheckCheck, Users } from "lucide-react"
import { toast } from "@/lib/notificar"
import { TituloPagina } from "@/components/TituloPagina"
import IconoWhatsApp from "@/components/IconoWhatsApp"

// Modelos opcionales: solo cargan un texto de base en el mensaje, que después se edita libremente.
// Lo que está entre [corchetes] es para reemplazar.
const MODELOS = [
  {
    nombre: "Clase suspendida",
    titulo: "Clase suspendida",
    texto: "Hoy no hay clase de [clase] de las [hora] hs.\n\nDisculpen las molestias. ¡Nos vemos en la próxima!\n_BravosBox_",
  },
  {
    nombre: "Cambio de horario",
    titulo: "Cambio de horario",
    texto: "La clase de [clase] del [día] cambia de las [hora anterior] a las [hora nueva] hs.\n\nSi ya reservaste y no podés en el nuevo horario, cancelá tu reserva desde el sistema.\n_BravosBox_",
  },
  {
    nombre: "Gimnasio cerrado",
    titulo: "Aviso",
    texto: "El [día] el gimnasio permanecerá cerrado.\n\n¡Gracias por entender!\n_BravosBox_",
  },
  {
    nombre: "Recordatorio de pago",
    titulo: "Recordatorio de membresía",
    texto: "Te recordamos renovar tu membresía antes del día 10 para seguir entrenando sin cortes.\n\nPodés pagar desde el sistema, en *Mi Membresía*.\n_BravosBox_",
  },
]

// Vista previa con el formato de WhatsApp: *negrita* y _cursiva_ (se arma con elementos, sin HTML)
function ConFormato({ texto }) {
  const partes = texto.split(/(\*[^*\n]+\*|_[^_\n]+_)/g)
  return partes.map((p, i) =>
    /^\*[^*\n]+\*$/.test(p) ? <strong key={i}>{p.slice(1, -1)}</strong>
      : /^_[^_\n]+_$/.test(p) ? <em key={i}>{p.slice(1, -1)}</em>
      : <span key={i}>{p}</span>
  )
}

export default function AvisosPage() {
  const [titulo, setTitulo] = useState("")
  const [cuerpo, setCuerpo] = useState("")
  const [verModelos, setVerModelos] = useState(false)

  // El título (opcional) va en negrita en la primera línea; se le quitan los asteriscos para no romper la negrita
  const tituloLimpio = titulo.replace(/\*/g, "").trim()
  const mensaje = [tituloLimpio ? `*${tituloLimpio}*` : "", cuerpo.trim()].filter(Boolean).join("\n\n")
  const vacio = mensaje.length === 0
  const ahora = new Date()
  const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`

  const usarModelo = (m) => {
    if (!vacio && !window.confirm("Se va a reemplazar lo que escribiste por el modelo. ¿Seguimos?")) return
    setTitulo(m.titulo)
    setCuerpo(m.texto)
    setVerModelos(false)
  }

  const enviar = () => {
    if (vacio) return
    // Abre WhatsApp con el texto ya escrito; el administrador elige su lista de difusión o grupo y envía
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer")
  }

  const copiar = async () => {
    if (vacio) return
    try {
      await navigator.clipboard.writeText(mensaje)
      toast.success("Mensaje copiado", { guardar: false })
    } catch {
      toast.error("No se pudo copiar el mensaje")
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <TituloPagina descripcion={"Escribí el mensaje y envialo a tu lista de difusión o grupo."}><span className="inline-flex items-center gap-2"><IconoWhatsApp className="h-5 w-5 shrink-0 text-foreground" />Avisos por WhatsApp</span></TituloPagina>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Mensaje */}
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4" aria-label="Mensaje">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase tracking-wide text-foreground">Tu aviso</h2>
            <button type="button" onClick={() => setVerModelos((v) => !v)} aria-expanded={verModelos}
              className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 text-xs font-bold text-foreground/75 hover:border-lime-500">
              Usar un modelo
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${verModelos ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
          </div>

          {verModelos && (
            <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border p-2.5">
              {MODELOS.map((m) => (
                <button key={m.nombre} type="button" onClick={() => usarModelo(m)}
                  className="min-h-[36px] rounded-full border border-lime-500/40 bg-lime-400/10 px-3 text-xs font-bold text-lime-700 dark:text-lime-400">
                  {m.nombre}
                </button>
              ))}
              <p className="w-full text-[11px] text-foreground/50">Carga un texto de base. Cambiá lo que está entre [corchetes].</p>
            </div>
          )}

          <div>
            <label htmlFor="titulo-aviso" className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-foreground/55">
              Título <span className="font-bold normal-case tracking-normal text-foreground/45">(opcional, va en negrita)</span>
            </label>
            <input id="titulo-aviso" value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Horarios de feriado"
              className="h-11 w-full rounded-xl border border-border bg-background/60 px-3.5 text-base font-bold text-foreground outline-none transition-colors placeholder:font-normal placeholder:text-foreground/35 focus:border-lime-500 sm:text-sm" />
          </div>

          <div>
            <label htmlFor="mensaje-aviso" className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-foreground/55">Mensaje</label>
            <textarea
              id="mensaje-aviso"
              className="min-h-[200px] w-full resize-y rounded-xl border border-border bg-background/60 px-3.5 py-3 text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-foreground/35 focus:border-lime-500 sm:text-sm"
              placeholder="Escribí lo que quieras avisar…"
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
            />
          </div>
          <p className="text-xs text-foreground/50">Usá *texto* para negrita y _texto_ para cursiva.</p>
        </section>

        {/* Vista previa + enviar */}
        <section className="space-y-3" aria-label="Vista previa">
          <p className="text-sm font-black uppercase tracking-wide text-foreground">Así lo van a ver</p>
          {/* Vista previa con el aspecto de un chat de WhatsApp (colores de WhatsApp, modo claro y oscuro) */}
          <div className="overflow-hidden rounded-2xl border border-border shadow-sm" aria-label="Vista previa del mensaje en WhatsApp">
            <div className="flex items-center gap-3 bg-[#008069] px-3 py-2.5 text-white dark:bg-[#202c33]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 dark:bg-[#6a7175]" aria-hidden="true">
                <Users className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">Alumnos Bravos</p>
                <p className="truncate text-[11px] text-white/75 dark:text-[#8696a0]">Tu grupo o lista de difusión</p>
              </div>
            </div>
            <div className="min-h-[150px] bg-[#efeae2] px-3 py-4 dark:bg-[#0b141a]">
              {vacio ? (
                <p className="mx-auto w-fit rounded-lg bg-white/80 px-3 py-1.5 text-center text-xs text-[#54656f] shadow-sm dark:bg-[#182229] dark:text-[#8696a0]">
                  Escribí el aviso y lo vas a ver acá
                </p>
              ) : (
                <div className="relative ml-auto w-fit max-w-[88%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-2.5 pb-1.5 pt-1.5 text-[#111b21] shadow-sm dark:bg-[#005c4b] dark:text-[#e9edef]">
                  {/* Colita de la burbuja */}
                  <span className="absolute -right-2 top-0 h-0 w-0 border-l-[8px] border-t-[10px] border-l-transparent border-t-[#d9fdd3] dark:border-t-[#005c4b]" aria-hidden="true" />
                  <p className="whitespace-pre-wrap break-words pr-1 text-[14.2px] leading-[19px]">
                    <ConFormato texto={mensaje} />
                    {/* Espacio reservado para que la hora no tape la última línea */}
                    <span className="inline-block w-[62px]" aria-hidden="true" />
                  </p>
                  <span className="absolute bottom-1 right-2 flex items-center gap-0.5 text-[11px] text-[#667781] dark:text-[#ffffff99]">
                    {horaActual}
                    <CheckCheck className="h-4 w-4 text-[#53bdeb]" aria-label="Leído" />
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={enviar} disabled={vacio}
              className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 text-sm font-black uppercase tracking-widest text-black shadow-lg shadow-lime-500/20 transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40">
              <IconoWhatsApp className="h-4 w-4" /> Enviar por WhatsApp
            </button>
            <button type="button" onClick={copiar} disabled={vacio}
              className="flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-black uppercase tracking-widest text-foreground/75 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40">
              <Copy className="h-4 w-4" /> Copiar
            </button>
          </div>

          <p className="flex items-start gap-2 text-xs text-foreground/50">
            <IconoWhatsApp className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Se abre WhatsApp con el mensaje ya escrito. Ahí elegís la lista de difusión o el grupo y lo enviás. El sistema no manda nada por su cuenta.
          </p>
        </section>
      </div>
    </div>
  )
}
