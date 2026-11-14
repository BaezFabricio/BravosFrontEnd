import { useEffect, useMemo, useRef, useState } from "react"
import { useConfirmar } from "@/components/useConfirmar"
import { CheckCheck, Copy, Search, ArrowRight, ArrowLeft, Check, Smartphone } from "lucide-react"
import { toast } from "@/lib/notificar"
import { TituloPagina } from "@/components/TituloPagina"
import { Link } from "react-router-dom"
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
      <div className="whitespace-pre-wrap break-words text-[0.8875rem] leading-[1.1875rem]">{children}</div>
      {hora && (
        <p className="mt-0.5 flex items-center justify-end gap-1 text-[0.6875rem] text-[#667781] dark:text-[#ffffff99]">
          {hora}
        </p>
      )}
    </div>
  )
}

function Separador({ texto }) {
  return <p className="mx-auto w-fit rounded-md bg-foreground/5 px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] text-muted-foreground">{texto}</p>
}

export default function AvisosPage() {
  const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
  const [titulo, setTitulo] = useState("")
  const [cuerpo, setCuerpo] = useState("")
  const [conTitulo, setConTitulo] = useState(false)
  const [aQuien, setAQuien] = useState("grupo") // "grupo" o el id del alumno
  const [vista, setVista] = useState(() => (window.innerWidth >= 720 ? "chat" : "lista")) // solo cuenta en celular
  const [modeloActivo, setModeloActivo] = useState(null)
  const elegirDestino = (valor) => { setAQuien(valor); setVista("chat") }
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

  const usarModelo = async (m) => {
    if (!vacio && !(await pedirConfirmacion("Se va a reemplazar lo que escribiste por el modelo. ¿Seguimos?"))) return
    setTitulo(m.titulo); setConTitulo(true); setCuerpo(m.texto); setModeloActivo(m.nombre)
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

  const itemCls = (activo) => `flex w-full items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:bg-lime-400/10 ${activo ? "border-l-[0.1875rem] border-lime-400 bg-lime-400/10" : "border-l-[0.1875rem] border-transparent hover:bg-foreground/5"}`
  const rotulo = "px-4 pb-1.5 pt-4 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground"

  return (
    <>
      {dialogoConfirmar}
    <div className="space-y-4">
      <TituloPagina descripcion={"Elegí a quién, escribí el aviso y mandalo. La vista previa muestra lo que les llega."}>
        <span className="inline-flex items-center gap-2"><IconoWhatsApp className="h-5 w-5 shrink-0 text-foreground" />Avisos por WhatsApp</span>
      </TituloPagina>

      {/* ESCRITORIO: tres tarjetas como la referencia (¿A quién? / Escribí el aviso / vista previa). Mismos datos y acciones. */}
      <div className="hidden lg:grid lg:items-start" style={{ gridTemplateColumns: "340px minmax(0, 1fr) 420px", gap: 20 }}>
        {/* ¿A quién? */}
        <section aria-label="Destinatarios" style={{ borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <h2 className="bv-admin-titulo" style={{ margin: 0, padding: "18px 20px 10px", font: "800 17px Archivo" }}>¿A quién?</h2>
          <p style={{ margin: 0, padding: "10px 20px 6px", font: "700 11px Archivo", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Para todos</p>
          <button type="button" onClick={() => elegirDestino("grupo")} aria-pressed={aQuien === "grupo"}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 20px", border: "none", borderLeft: `3px solid ${aQuien === "grupo" ? "var(--primary)" : "transparent"}`, background: aQuien === "grupo" ? "var(--sh-active-bg)" : "transparent", color: "var(--foreground)", textAlign: "left", cursor: "pointer" }}>
            <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", background: "var(--primary)", color: "var(--primary-foreground)", display: "grid", placeItems: "center", font: "800 13px Archivo" }}>AB</span>
            <span style={{ minWidth: 0, flex: "1 1 0%" }}>
              <span style={{ display: "block", font: "700 15px Archivo" }}>Alumnos Bravos</span>
              <span style={{ display: "block", font: "500 13px Archivo", color: "var(--muted-foreground)" }}>Grupo o lista de difusión</span>
            </span>
            {aQuien === "grupo" && <Check className="h-4 w-4" style={{ color: "var(--primary)" }} aria-hidden="true" />}
          </button>

          <p style={{ margin: 0, padding: "18px 20px 8px", display: "flex", justifyContent: "space-between", font: "700 11px Archivo", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            <span>A un alumno</span>
            <span style={{ textTransform: "none", letterSpacing: 0, font: "600 12px Archivo" }}>{`${conTelefono.length} con teléfono`}</span>
          </p>
          {usuarios === null ? (
            <p style={{ margin: 0, padding: "10px 20px 16px", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Cargando…</p>
          ) : conTelefono.length === 0 ? (
            <div style={{ margin: "0px 16px 16px", padding: 16, borderRadius: 12, border: "1px dashed var(--sh-control-line)" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, font: "700 15px Archivo" }}>
                <Smartphone className="h-4 w-4 shrink-0" aria-hidden="true" /> Ningún alumno tiene teléfono cargado
              </div>
              <p style={{ margin: "8px 0 0", font: "500 13px / 1.5 Archivo", color: "var(--muted-foreground)" }}>Para mandarle un aviso a un solo alumno, cargale un celular válido en su ficha.</p>
              <Link to="/admin/usuarios" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 12, font: "700 14px Archivo", color: "var(--primary)", textDecoration: "none" }}>Ir a Usuarios ›</Link>
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: "0px 0px 8px" }}>
              {conTelefono.map((u) => {
                const activo = String(aQuien) === String(u.id)
                return (
                  <li key={u.id}>
                    <button type="button" onClick={() => elegirDestino(String(u.id))} aria-pressed={activo}
                      style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", border: "none", borderLeft: `3px solid ${activo ? "var(--primary)" : "transparent"}`, background: activo ? "var(--sh-active-bg)" : "transparent", color: "var(--foreground)", textAlign: "left", cursor: "pointer" }}>
                      <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", background: "var(--primary)", color: "var(--primary-foreground)", display: "grid", placeItems: "center", font: "800 13px Archivo" }}>{iniciales(u.nombre)}</span>
                      <span style={{ minWidth: 0, flex: "1 1 0%" }}>
                        <span style={{ display: "block", font: "700 15px Archivo" }}>{u.nombre}</span>
                        <span style={{ display: "block", font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{u.telefono}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Escribí el aviso */}
        <section aria-label="Escribí el aviso" style={{ borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <h2 className="bv-admin-titulo" style={{ margin: 0, font: "800 17px Archivo" }}>Escribí el aviso</h2>
            <p style={{ margin: "4px 0 0", font: "500 13px Archivo", color: "var(--muted-foreground)" }}>
              Para: <span style={{ color: "var(--foreground)", fontWeight: 700 }}>{aQuien === "grupo" ? "Alumnos Bravos (grupo o lista de difusión)" : `${elegido?.nombre || "Alumno"} (${elegido?.telefono || ""})`}</span>
            </p>
          </div>
          <div>
            <span style={{ display: "block", marginBottom: 8, font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Empezar desde un modelo</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {MODELOS.map((m) => (
                <button key={m.nombre} type="button" onClick={() => usarModelo(m)} aria-pressed={modeloActivo === m.nombre}
                  style={{ height: 40, padding: "0px 16px", borderRadius: 999, border: `1px solid ${modeloActivo === m.nombre ? "var(--primary)" : "var(--sh-control-line)"}`, background: modeloActivo === m.nombre ? "var(--primary)" : "transparent", color: modeloActivo === m.nombre ? "var(--primary-foreground)" : "var(--foreground)", font: "700 13px Archivo", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {m.nombre}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="av-titulo" style={{ display: "block", marginBottom: 8, font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
              Título <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500 }}>(opcional · llega en negrita)</span>
            </label>
            <input id="av-titulo" value={titulo} maxLength={80} placeholder="Ej: Feriado"
              onChange={(e) => { setTitulo(e.target.value); setConTitulo(e.target.value.length > 0) }}
              style={{ width: "100%", boxSizing: "border-box", height: 46, padding: "0px 14px", borderRadius: 10, border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo" }} />
          </div>
          <div>
            <label htmlFor="av-mensaje" style={{ display: "block", marginBottom: 8, font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Mensaje *</label>
            <div style={{ borderRadius: 10, border: "1px solid var(--input-line)", background: "var(--input)", overflow: "hidden" }}>
              <textarea id="av-mensaje" ref={areaRef} value={cuerpo} maxLength={MAX} onChange={(e) => setCuerpo(e.target.value)}
                placeholder={aQuien === "grupo" ? "Escribí el aviso para todos…" : `Escribí el aviso para ${elegido ? String(elegido.nombre).split(" ")[0] : "el alumno"}…`}
                style={{ display: "block", width: "100%", boxSizing: "border-box", minHeight: 200, padding: "14px 16px", border: "none", outline: "none", background: "transparent", color: "var(--foreground)", font: "500 15px / 1.5 Archivo", resize: "vertical" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 12px", borderTop: "1px solid var(--sh-line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" onClick={() => envolver("*")} aria-label="Negrita: marcá el texto y tocá" style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "900 14px Archivo", cursor: "pointer" }}>B</button>
                  <button type="button" onClick={() => envolver("_")} aria-label="Cursiva: marcá el texto y tocá" style={{ width: 38, height: 38, borderRadius: 8, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "italic 800 14px Archivo", cursor: "pointer" }}>I</button>
                  <span style={{ font: "500 12px Archivo", color: "var(--muted-foreground)" }}>Marcá una palabra y tocá B o I.</span>
                </div>
                <span style={{ font: "600 12px Archivo", color: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}>{`${cuerpo.length} / ${MAX}`}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--sh-line)", paddingTop: 16 }}>
            <p style={{ margin: 0, font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{vacio ? "Escribí el mensaje para poder mandarlo." : (aQuien === "grupo" ? "Se abre WhatsApp con el mensaje escrito. Ahí elegís la lista o el grupo y lo enviás." : `Se abre el chat de ${String(elegido?.nombre || "este alumno").split(" ")[0]} con el mensaje.`)}</p>
            <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
              <button type="button" onClick={copiar} disabled={vacio}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0px 18px", borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", cursor: vacio ? "not-allowed" : "pointer", opacity: vacio ? 0.5 : 1 }}>
                <Copy className="h-4 w-4" aria-hidden="true" /> Copiar
              </button>
              <button type="button" onClick={abrir} disabled={vacio || !enlace}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0px 20px", borderRadius: 10, border: "none", background: !vacio && enlace ? "var(--primary)" : "var(--sh-track-strong)", color: !vacio && enlace ? "var(--primary-foreground)" : "var(--muted-foreground)", font: "800 13px Archivo", letterSpacing: "0.04em", textTransform: "uppercase", cursor: !vacio && enlace ? "pointer" : "not-allowed" }}>
                {aQuien === "grupo" ? "Abrir en WhatsApp" : `Enviar a ${String(elegido?.nombre || "").split(" ")[0]}`} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* Vista previa */}
        <section aria-label="Vista previa" style={{ borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 490 }}>
          <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: "50%", background: "var(--primary)", color: "var(--primary-foreground)", display: "grid", placeItems: "center", font: "800 13px Archivo" }}>{aQuien === "grupo" ? "AB" : iniciales(elegido?.nombre)}</span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, font: "800 15px Archivo" }}>{aQuien === "grupo" ? "Alumnos Bravos" : elegido?.nombre || "Alumno"}</p>
              <p style={{ margin: 0, font: "500 12px Archivo", color: "var(--muted-foreground)" }}>Vista previa · así les llega</p>
            </div>
          </header>
          <div className="flex flex-1 flex-col justify-end gap-3" style={{ padding: "16px 18px", background: "var(--sh-bg)" }} aria-label="Vista previa del mensaje en WhatsApp">
            <Separador texto="Hoy" />
            {vacio ? (
              <Burbuja discontinua><span className="text-sm">Tu aviso aparece acá mientras lo escribís.</span></Burbuja>
            ) : (
              <Burbuja hora={hora}>
                {titulo && <p className="font-bold">{titulo}</p>}
                <ConFormato texto={mensaje} />
              </Burbuja>
            )}
          </div>
        </section>
      </div>

      <div className="grid h-[calc(100dvh-12rem)] min-h-[32.5rem] overflow-hidden rounded-2xl border border-border bg-card min-[720px]:grid-cols-[minmax(16.25rem,21.25rem)_minmax(0,1fr)] min-[720px]:min-h-[37.5rem] lg:hidden">
        {/* Destinatarios */}
        <aside className={`min-h-0 flex-col border-border min-[720px]:flex min-[720px]:border-r ${vista === "chat" ? "hidden" : "flex"}`} aria-label="Destinatarios">
          <div className="p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar alumno por nombre o DNI" aria-label="Buscar alumno"
                className="h-11 w-full rounded-xl border border-border bg-background/60 pl-9 pr-3 text-base text-foreground outline-none placeholder:text-foreground/35 focus:border-lime-500" />
            </div>
          </div>

          <h2 id="dest-t" className="px-4 pb-1 pt-4 text-[17px] font-extrabold text-foreground">¿A quién?</h2>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className={rotulo}>Para todos</p>
            <button type="button" onClick={() => elegirDestino("grupo")} aria-pressed={aQuien === "grupo"} className={itemCls(aQuien === "grupo")}>
              <Avatar texto="AB" activo={aQuien === "grupo"} />
              <span className="min-w-0"><span className="block truncate text-sm font-bold text-foreground">Alumnos Bravos</span><span className="block truncate text-xs text-muted-foreground">Grupo o lista de difusión</span></span>
            </button>

            <p className={`${rotulo} flex items-center justify-between`}><span>A UN ALUMNO</span><span>{lista.length}</span></p>
            {usuarios === null ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">Cargando…</p>
            ) : lista.length === 0 ? (
              <div className="px-4 py-3">
                <p className="text-sm font-bold text-foreground">{conTelefono.length === 0 ? "Ningún alumno tiene teléfono cargado" : "Nadie coincide con la búsqueda."}</p>
                {conTelefono.length === 0 && (
                  <>
                    <p className="mt-1 text-[13px] text-muted-foreground">Para mandarle un aviso a un solo alumno, cargale un celular válido en su ficha.</p>
                    <Link to="/admin/usuarios" className="mt-3 inline-flex min-h-11 items-center rounded-[10px] border border-border px-4 text-[13px] font-bold text-foreground no-underline hover:bg-[rgba(128,128,128,.14)]">Ir a Usuarios</Link>
                  </>
                )}
              </div>
            ) : lista.map((u) => (
              <button key={u.id} type="button" onClick={() => elegirDestino(String(u.id))} aria-pressed={String(aQuien) === String(u.id)} className={itemCls(String(aQuien) === String(u.id))}>
                <Avatar texto={iniciales(u.nombre)} activo={String(aQuien) === String(u.id)} />
                <span className="min-w-0"><span className="block truncate text-sm font-bold text-foreground">{u.nombre}</span><span className="block truncate text-xs tabular-nums text-muted-foreground">{u.telefono}</span></span>
              </button>
            ))}
            <p className="px-4 py-4 text-[0.6875rem] text-foreground/50">Solo aparecen alumnos activos con un teléfono que se pueda usar en WhatsApp.</p>
          </div>
        </aside>

        {/* Chat */}
        <section className={`min-h-0 min-w-0 flex-col min-[720px]:flex ${vista === "lista" ? "hidden" : "flex"}`} aria-label="Chat">
          <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar texto={aQuien === "grupo" ? "AB" : iniciales(elegido?.nombre)} activo />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{aQuien === "grupo" ? "Alumnos Bravos" : elegido?.nombre || "Alumno"}</p>
                <p className="truncate text-xs text-muted-foreground">{aQuien === "grupo" ? "Grupo o lista de difusión" : elegido?.telefono}</p>
              </div>
            </div>
            <button type="button" onClick={() => setVista("lista")} className="flex min-h-[2.5rem] shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm font-semibold text-foreground/85 transition-colors hover:border-foreground/30 hover:bg-muted min-[720px]:hidden"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver</button>
            <span className="hidden shrink-0 rounded-full border border-lime-500/50 px-3 py-1 min-[720px]:inline text-[0.625rem] font-bold uppercase tracking-[0.1em] text-lime-700 dark:text-lime-400">Vista previa</span>
          </header>

          <div className="flex min-h-[7.5rem] flex-1 flex-col justify-end gap-3 overflow-y-auto bg-[#efeae2] px-4 py-4 dark:bg-[#0b141a]" aria-label="Vista previa del mensaje en WhatsApp">
            {ultimo && (
              <>
                <Separador texto={fechaLarga(ultimo.fecha)} />
                <Burbuja>
                  {ultimo.titulo && <p className="font-bold">{ultimo.titulo}</p>}
                  <ConFormato texto={ultimo.cuerpo} />
                  <span className="mt-1 flex items-center justify-end gap-1 text-[0.6875rem] text-[#667781] dark:text-[#ffffff99]">Último aviso enviado <CheckCheck className="h-3.5 w-3.5 text-[#53bdeb]" aria-hidden="true" /></span>
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
            <div className="flex items-center gap-2 overflow-x-auto min-[720px]:flex-wrap">
              <span className="shrink-0 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">Modelos</span>
              {MODELOS.map((m) => (
                <button key={m.nombre} type="button" onClick={() => usarModelo(m)}
                  aria-pressed={modeloActivo === m.nombre} className={`min-h-[2.125rem] shrink-0 rounded-full border px-3.5 text-xs font-bold transition-colors hover:border-lime-500 ${modeloActivo === m.nombre ? "border-lime-500 bg-lime-400/10 text-lime-700 dark:text-lime-400" : "border-border text-foreground/80 hover:text-foreground"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500`}>
                  {m.nombre}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pb-2"><h2 id="msg-t" className="text-[17px] font-extrabold text-foreground">Escribí el aviso</h2></div>
              <div className="rounded-xl border border-border bg-background/60 focus-within:border-lime-500">
              {conTitulo && (
                <input autoFocus value={titulo} maxLength={80} onChange={(e) => setTitulo(e.target.value)} placeholder="Título (va en negrita)" aria-label="Título del aviso"
                  className="h-11 w-full border-b border-border bg-transparent px-3.5 text-base font-bold text-foreground outline-none placeholder:font-normal placeholder:text-foreground/35" />
              )}
              <textarea ref={areaRef} value={cuerpo} maxLength={MAX} onChange={(e) => setCuerpo(e.target.value)} aria-label="Mensaje"
                placeholder={aQuien === "grupo" ? "Escribí el aviso para todos…" : `Escribí el aviso para ${elegido ? String(elegido.nombre).split(" ")[0] : "el alumno"}…`}
                className="block min-h-[6rem] w-full resize-y bg-transparent px-3.5 py-3 text-base leading-relaxed text-foreground outline-none placeholder:text-foreground/35" />
              <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-2">
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => { if (conTitulo) { setTitulo(""); setModeloActivo(null) } setConTitulo((v) => !v) }} aria-pressed={conTitulo}
                    className={`min-h-11 rounded-lg border px-3 text-xs font-bold transition-colors ${conTitulo ? "border-lime-500 text-lime-700 dark:text-lime-400" : "border-border text-foreground/75 hover:bg-foreground/5"}`}>
                    {conTitulo ? "− Quitar título" : "+ Título"}
                  </button>
                  <button type="button" onClick={() => envolver("*")} aria-label="Negrita: marcá el texto y tocá" className="h-11 w-11 rounded-lg border border-border text-sm font-black text-foreground/75 hover:bg-foreground/5">B</button>
                  <button type="button" onClick={() => envolver("_")} aria-label="Cursiva: marcá el texto y tocá" className="h-11 w-11 rounded-lg border border-border text-sm italic text-foreground/75 hover:bg-foreground/5">I</button>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">{cuerpo.length}/{MAX}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="hidden text-xs text-foreground/50 min-[720px]:block">
                {aQuien === "grupo" ? "Se abre WhatsApp con el mensaje escrito. Ahí elegís la lista o el grupo y lo enviás." : `Se abre el chat de ${String(elegido?.nombre || "este alumno").split(" ")[0]} con el mensaje escrito. Solo tocás enviar.`}
              </p>
              <div className="flex shrink-0 gap-2 max-[719px]:w-full">
                <button type="button" onClick={copiar} disabled={vacio}
                  className="flex min-h-[3rem] items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-bold text-foreground transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40">
                  <Copy className="h-4 w-4" aria-hidden="true" /> Copiar
                </button>
                <button type="button" onClick={abrir} disabled={vacio || !enlace}
                  className="flex min-h-[3rem] flex-1 items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 text-sm font-black text-black transition-colors hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">
                  {aQuien === "grupo" ? "Abrir en WhatsApp" : `Enviar a ${String(elegido?.nombre || "").split(" ")[0]}`} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
    </>
  )
}
