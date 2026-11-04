import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCheck, Copy, Search, ArrowRight } from "lucide-react"
import { toast } from "@/lib/notificar"
import { TituloPagina } from "@/components/TituloPagina"
import IconoWhatsApp from "@/components/IconoWhatsApp"
import { getUsuarios } from "@/api"
import { enlaceWhatsApp, numeroWhatsApp } from "@/lib/whatsapp"

/*
 * Avisos por WhatsApp. A la izquierda se elige a quién (el grupo o difusión, o un alumno con teléfono cargado);
 * a la derecha está el "chat": lo último que se mandó, la vista previa de lo que se escribe y el cuadro para escribir.
 * El sistema no manda nada por su cuenta: abre WhatsApp con el mensaje ya escrito.
 */

const MAX = 1000
const CLAVE_ULTIMOS = "bravos-avisos-ultimos"

// Modelos opcionales: solo cargan un texto de base en el mensaje, que después se edita libremente.
// Lo que está entre [corchetes] es para reemplazar.
const MODELOS = [
  { nombre: "Feriado", titulo: "Horarios de feriado", texto: "El [día] el box abre de [hora] a [hora] hs.\n_BravosBox_" },
  { nombre: "Cuota", titulo: "Recordatorio de membresía", texto: "Te recordamos renovar tu membresía antes del día 10 para seguir entrenando sin cortes.\n\nPodés pagar desde el sistema, en *Mi Membresía*.\n_BravosBox_" },
  { nombre: "Clase suspendida", titulo: "Clase suspendida", texto: "Hoy no hay clase de [clase] de las [hora] hs.\n\nDisculpen las molestias. ¡Nos vemos en la próxima!\n_BravosBox_" },
  { nombre: "Cambio de horario", titulo: "Cambio de horario", texto: "La clase de [clase] del [día] cambia de las [hora anterior] a las [hora nueva] hs.\n\nSi ya reservaste y no podés en el nuevo horario, cancelá tu reserva desde el sistema.\n_BravosBox_" },
  { nombre: "Gimnasio cerrado", titulo: "Aviso", texto: "El [día] el gimnasio permanecerá cerrado.\n\n¡Gracias por entender!\n_BravosBox_" },
  { nombre: "Evento", titulo: "Evento en el box", texto: "El [día] a las [hora] hs tenemos [evento].\n\n¡Te esperamos!\n_BravosBox_" },
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

const iniciales = (nombre) => String(nombre || "?").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "?"
const leerUltimos = () => { try { return JSON.parse(localStorage.getItem(CLAVE_ULTIMOS) || "{}") } catch { return {} } }
const fechaLarga = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "long" }).toUpperCase()

function Avatar({ texto, activo }) {
  return (
    <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${activo ? "bg-lime-400 text-black" : "bg-foreground/10 text-foreground/80"}`}>
      {texto}
    </span>
  )
}

function Burbuja({ children, hora, discontinua = false }) {
  return (
    <div className={`relative ml-auto w-fit max-w-[88%] rounded-xl rounded-tr-sm px-3 pb-1.5 pt-2 text-[#111b21] shadow-sm dark:text-[#e9edef] ${discontinua ? "border border-dashed border-border bg-transparent text-muted-foreground shadow-none dark:text-muted-foreground" : "bg-[#d9fdd3] dark:bg-[#005c4b]"}`}>
      <div className="whitespace-pre-wrap break-words text-[14.2px] leading-[19px]">{children}</div>
      {hora && (
        <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[#667781] dark:text-[#ffffff99]">
          {hora}
        </p>
      )}
    </div>
  )
}

function Separador({ texto }) {
  return <p className="mx-auto w-fit rounded-md bg-foreground/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{texto}</p>
}

export default function AvisosPage() {
  const [titulo, setTitulo] = useState("")
  const [cuerpo, setCuerpo] = useState("")
  const [conTitulo, setConTitulo] = useState(false)
  const [aQuien, setAQuien] = useState("grupo") // "grupo" o el id del alumno
  const [usuarios, setUsuarios] = useState(null) // null = cargando, [] = sin acceso o sin datos
  const [busqueda, setBusqueda] = useState("")
  const [ultimos, setUltimos] = useState(leerUltimos)
  const areaRef = useRef(null)

  // El servidor decide quién puede ver los teléfonos: si este perfil no tiene acceso a Usuarios, la lista llega vacía
  useEffect(() => {
    let vigente = true
    getUsuarios().then((lista) => { if (vigente) setUsuarios(lista) }).catch(() => { if (vigente) setUsuarios([]) })
    return () => { vigente = false }
  }, [])

  const conTelefono = useMemo(() => (usuarios || [])
    .filter((u) => u.estado !== "inactivo" && numeroWhatsApp(u.telefono))
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es")), [usuarios])
  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return q ? conTelefono.filter((u) => String(u.nombre).toLowerCase().includes(q) || String(u.dni || "").includes(q)) : conTelefono
  }, [conTelefono, busqueda])

  const elegido = aQuien === "grupo" ? null : conTelefono.find((u) => String(u.id) === String(aQuien)) || null
  const clave = aQuien === "grupo" ? "grupo" : `u${aQuien}`
  const ultimo = ultimos[clave]

  // El título (opcional) va en negrita en la primera línea; se le quitan los asteriscos para no romper la negrita
  const tituloLimpio = conTitulo ? titulo.replace(/\*/g, "").trim() : ""
  const mensaje = [tituloLimpio ? `*${tituloLimpio}*` : "", cuerpo.trim()].filter(Boolean).join("\n\n")
  const vacio = mensaje.length === 0
  const ahora = new Date()
  const hora = `${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`

  const usarModelo = (m) => {
    if (!vacio && !window.confirm("Se va a reemplazar lo que escribiste por el modelo. ¿Seguimos?")) return
    setTitulo(m.titulo); setConTitulo(true); setCuerpo(m.texto)
  }

  // B / I: envuelven la selección (o dejan los símbolos listos para escribir entre ellos)
  const envolver = (simbolo) => {
    const el = areaRef.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b } = el
    const nuevo = cuerpo.slice(0, a) + simbolo + cuerpo.slice(a, b) + simbolo + cuerpo.slice(b)
    if (nuevo.length > MAX) return
    setCuerpo(nuevo)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + 1, b + 1) })
  }

  const enlace = aQuien === "grupo" ? `https://wa.me/?text=${encodeURIComponent(mensaje)}` : (elegido ? enlaceWhatsApp(elegido.telefono, mensaje) : null)
  const abrir = () => {
    if (vacio || !enlace) return
    window.open(enlace, "_blank", "noopener,noreferrer")
    // Se recuerda lo último que se mandó a cada destinatario, solo en este navegador (el sistema no lo envía ni lo guarda en el servidor)
    const nuevo = { ...ultimos, [clave]: { titulo: tituloLimpio, cuerpo: cuerpo.trim(), fecha: new Date().toISOString() } }
    setUltimos(nuevo)
    try { localStorage.setItem(CLAVE_ULTIMOS, JSON.stringify(nuevo)) } catch { /* sin almacenamiento: no se recuerda */ }
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

  const itemCls = (activo) => `flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:bg-lime-400/10 ${activo ? "border-l-[3px] border-lime-400 bg-lime-400/10" : "border-l-[3px] border-transparent hover:bg-foreground/5"}`
  const rotulo = "px-4 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground"

  return (
    <div className="space-y-4">
      <TituloPagina descripcion={"Elegí a quién, escribí abajo y mandalo. Lo que ves en el chat es lo que les llega."}>
        <span className="inline-flex items-center gap-2"><IconoWhatsApp className="h-5 w-5 shrink-0 text-foreground" />Avisos por WhatsApp</span>
      </TituloPagina>

      <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:h-[calc(100dvh-13rem)] lg:min-h-[560px] lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Destinatarios */}
        <aside className="flex max-h-[320px] min-h-0 flex-col border-b border-border lg:max-h-none lg:border-b-0 lg:border-r" aria-label="Destinatarios">
          <div className="p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alumno por nombre o DNI" aria-label="Buscar alumno"
                className="h-11 w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 text-base text-foreground outline-none placeholder:text-foreground/35 focus:border-lime-500 sm:text-sm" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className={rotulo}>Para todos</p>
            <button type="button" onClick={() => setAQuien("grupo")} aria-pressed={aQuien === "grupo"} className={itemCls(aQuien === "grupo")}>
              <Avatar texto="AB" activo={aQuien === "grupo"} />
              <span className="min-w-0"><span className="block truncate text-sm font-bold text-foreground">Alumnos Bravos</span><span className="block truncate text-xs text-muted-foreground">Grupo o lista de difusión</span></span>
            </button>

            <p className={`${rotulo} flex items-center justify-between`}><span>Un alumno</span><span>{lista.length}</span></p>
            {usuarios === null ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Cargando…</p>
            ) : lista.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                {conTelefono.length === 0 ? "No hay usuarios con un teléfono válido cargado (o tu perfil no puede ver los usuarios)." : "Nadie coincide con la búsqueda."}
              </p>
            ) : lista.map((u) => (
              <button key={u.id} type="button" onClick={() => setAQuien(String(u.id))} aria-pressed={String(aQuien) === String(u.id)} className={itemCls(String(aQuien) === String(u.id))}>
                <Avatar texto={iniciales(u.nombre)} activo={String(aQuien) === String(u.id)} />
                <span className="min-w-0"><span className="block truncate text-sm font-bold text-foreground">{u.nombre}</span><span className="block truncate text-xs tabular-nums text-muted-foreground">{u.telefono}</span></span>
              </button>
            ))}
            <p className="px-4 py-4 text-[11px] text-foreground/50">Solo aparecen alumnos activos con un teléfono que se pueda usar en WhatsApp.</p>
          </div>
        </aside>

        {/* Chat */}
        <section className="flex min-h-0 min-w-0 flex-col" aria-label="Chat">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar texto={aQuien === "grupo" ? "AB" : iniciales(elegido?.nombre)} activo />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{aQuien === "grupo" ? "Alumnos Bravos" : elegido?.nombre || "Alumno"}</p>
                <p className="truncate text-xs text-muted-foreground">{aQuien === "grupo" ? "Grupo o lista de difusión" : elegido?.telefono}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-lime-500/50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-lime-700 dark:text-lime-400">Vista previa</span>
          </header>

          <div className="flex min-h-[220px] flex-1 flex-col justify-end gap-3 overflow-y-auto bg-[#efeae2] px-4 py-4 dark:bg-[#0b141a]" aria-label="Vista previa del mensaje en WhatsApp">
            {ultimo && (
              <>
                <Separador texto={fechaLarga(ultimo.fecha)} />
                <Burbuja>
                  {ultimo.titulo && <p className="font-bold">{ultimo.titulo}</p>}
                  <ConFormato texto={ultimo.cuerpo} />
                  <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#667781] dark:text-[#ffffff99]">Último aviso enviado <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" aria-hidden="true" /></span>
                </Burbuja>
              </>
            )}
            <Separador texto="Hoy" />
            {vacio ? (
              <Burbuja discontinua><span className="text-sm">Tu aviso va a aparecer acá mientras lo escribís.</span></Burbuja>
            ) : (
              <Burbuja hora={hora}><ConFormato texto={mensaje} /></Burbuja>
            )}
          </div>

          {/* Escribir */}
          <div className="space-y-3 border-t border-border p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">Modelos</span>
              {MODELOS.map((m) => (
                <button key={m.nombre} type="button" onClick={() => usarModelo(m)}
                  className="min-h-[34px] rounded-full border border-border px-3.5 text-xs font-bold text-foreground/80 transition-colors hover:border-lime-500 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
                  {m.nombre}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-background/60 focus-within:border-lime-500">
              {conTitulo && (
                <input value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (va en negrita)" aria-label="Título del aviso"
                  className="h-11 w-full border-b border-border bg-transparent px-3.5 text-base font-bold text-foreground outline-none placeholder:font-normal placeholder:text-foreground/35 sm:text-sm" />
              )}
              <textarea ref={areaRef} value={cuerpo} maxLength={MAX} onChange={(e) => setCuerpo(e.target.value)} aria-label="Mensaje"
                placeholder={aQuien === "grupo" ? "Escribí el aviso para todos…" : `Escribí el aviso para ${elegido ? String(elegido.nombre).split(" ")[0] : "el alumno"}…`}
                className="block min-h-[96px] w-full resize-y bg-transparent px-3.5 py-3 text-base leading-relaxed text-foreground outline-none placeholder:text-foreground/35 sm:text-sm" />
              <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => setConTitulo((v) => !v)} aria-pressed={conTitulo}
                    className={`h-8 rounded-lg border px-3 text-xs font-bold transition-colors ${conTitulo ? "border-lime-500 text-lime-700 dark:text-lime-400" : "border-border text-foreground/75 hover:bg-foreground/5"}`}>
                    + Título
                  </button>
                  <button type="button" onClick={() => envolver("*")} aria-label="Negrita" className="h-8 w-8 rounded-lg border border-border text-sm font-black text-foreground/75 hover:bg-foreground/5">B</button>
                  <button type="button" onClick={() => envolver("_")} aria-label="Cursiva" className="h-8 w-8 rounded-lg border border-border text-sm italic text-foreground/75 hover:bg-foreground/5">I</button>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">{cuerpo.length}/{MAX}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-foreground/50">
                {aQuien === "grupo" ? "Se abre WhatsApp con el mensaje escrito. Ahí elegís la lista o el grupo y lo enviás." : "Se abre el chat de este alumno con el mensaje escrito. Ahí lo enviás."}
              </p>
              <div className="flex shrink-0 gap-2">
                <button type="button" onClick={copiar} disabled={vacio}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40">
                  <Copy className="h-4 w-4" aria-hidden="true" /> Copiar
                </button>
                <button type="button" onClick={abrir} disabled={vacio || !enlace}
                  className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 text-sm font-black text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">
                  Abrir en WhatsApp <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
