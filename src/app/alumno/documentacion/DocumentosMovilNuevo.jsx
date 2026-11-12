import { useEffect, useState } from "react"
import apiClient from "@/api"
import { ErrorBanner, Esqueleto, Progreso } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { toast } from "@/lib/notificar"
import { fechaCorta } from "@/lib/fechasBx"

/*
 * Documentos y comprobantes en el celular (handoff móvil, Prompt 4). Progreso "X de 3 validados", estado por documento
 * (falta cargar, en revisión, aprobado, rechazado con motivo). La autorización de datos de salud va solo en el certificado
 * médico y sin ella el botón de subir queda deshabilitado con el aviso. Misma lógica de subida que el escritorio.
 */

const TIPOS = [
  { key: "comprobante_transferencia", titulo: "Comprobante de transferencia", descripcion: "Comprobante de pago por transferencia bancaria de tu membresía.", icono: "M3 6h18v12H3zM3 10h18M7 15h3" },
  { key: "certificado_medico", titulo: "Certificado médico", descripcion: "Certificado médico de aptitud física para la práctica deportiva.", icono: "M6 3v6a4 4 0 0 0 8 0V3M10 13v2a5 5 0 0 0 10 0v-2M20 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", salud: true },
  { key: "declaracion_jurada", titulo: "Declaración jurada", descripcion: "Declaración jurada o contrato de membresía firmado.", icono: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5", salud: true },
]

const MAX_BYTES = 10 * 1024 * 1024
const TIPOS_OK = ["application/pdf", "image/jpeg", "image/png"]

const ESTADO = {
  falta: { texto: "Falta cargar", clase: "border-bx-btn-line bg-bx-surf text-bx-muted" },
  revision: { texto: "En revisión", clase: "border-bx-warn-line bg-bx-warn-bg text-bx-warn-fg" },
  aprobado: { texto: "Aprobado", clase: "border-bx-ok-line bg-bx-ok-bg text-bx-ok-fg" },
  rechazado: { texto: "Rechazado", clase: "border-bx-err-line bg-bx-err-bg text-bx-err-fg" },
}
const estadoDe = (doc) => (!doc ? "falta" : doc.estado === "aprobado" ? "aprobado" : doc.estado === "rechazado" ? "rechazado" : "revision")

function Tarjeta({ tipo, docs, subiendo, progreso, onSubir }) {
  const [consiente, setConsiente] = useState(false)
  const ultimo = docs[0]
  const clave = estadoDe(ultimo)
  const est = ESTADO[clave]
  const bloqueado = !!tipo.salud && !consiente
  const subirTxt = clave === "rechazado" ? "Subir uno nuevo" : ultimo ? "Reemplazar archivo" : "Subir archivo"

  const elegir = (file) => {
    if (!file) return
    if (!TIPOS_OK.includes(file.type)) { toast.error("Subí un PDF, JPG o PNG"); return }
    if (file.size > MAX_BYTES) { toast.error("El archivo no puede superar los 10 MB"); return }
    onSubir(tipo.key, file, tipo.salud ? consiente : undefined)
  }

  return (
    <li className="bx-lift flex flex-col gap-3 rounded-2xl border border-bx-line bg-bx-card p-4">
      <div className="flex gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-bx-tile text-bx-ok-fg"><Ico d={tipo.icono} size={21} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="m-0 text-[0.9375rem] font-bold">{tipo.titulo}</h2>
            <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[0.6875rem] font-bold ${est.clase}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{est.texto}</span>
          </div>
          <p className="m-0 mt-1 text-[0.8125rem] leading-normal text-bx-muted">{tipo.descripcion}</p>
        </div>
      </div>

      {clave === "rechazado" && ultimo?.motivo && (
        <div role="alert" className="flex gap-2 rounded-xl border border-bx-err-line bg-bx-err-bg p-3 text-[0.8125rem] leading-normal text-bx-err-fg">
          <Ico d={IC.warn} size={16} sw={2} className="mt-px shrink-0" /><span><strong>Motivo:</strong> {ultimo.motivo}</span>
        </div>
      )}

      {ultimo && (
        <div className="flex items-center gap-3 rounded-xl border border-bx-line2 bg-bx-surf px-3 py-2.5">
          <Ico d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5" size={18} sw={1.8} className="shrink-0 text-bx-muted" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{ultimo.nombreArchivo}</span>
            {ultimo.creadoEn && <span className="block text-xs text-bx-muted">Subido el {fechaCorta(ultimo.creadoEn)}</span>}
          </span>
          <a href={ultimo.urlArchivo} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${ultimo.nombreArchivo}`} className="inline-flex min-h-11 items-center text-sm font-bold text-bx-ok-fg">Ver</a>
        </div>
      )}

      {subiendo ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-2 rounded-xl border border-bx-line2 bg-bx-surf p-3">
          <div className="flex justify-between text-sm font-semibold"><span>Subiendo archivo…</span><span>{progreso}%</span></div>
          <Progreso valor={progreso} max={100} etiqueta="Progreso de la subida" alto={6} color="bg-bx-barra" />
        </div>
      ) : (
        <>
          {tipo.salud && (
            <label className="flex cursor-pointer items-start gap-3 text-[0.8125rem] leading-normal text-bx-muted">
              <input type="checkbox" checked={consiente} onChange={(e) => setConsiente(e.target.checked)} className="mt-0.5 h-[1.375rem] w-[1.375rem] shrink-0 accent-[#7fbf00]" />
              <span>Autorizo a Bravos Box a guardar este documento con datos de mi salud para controlar mi aptitud física, según la <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-bold text-bx-ink underline">Política de privacidad</a>.</span>
            </label>
          )}
          <label className={`relative flex h-[3.25rem] items-center justify-center gap-2 rounded-xl border text-sm font-extrabold tracking-[0.02em] ${bloqueado ? "cursor-not-allowed border-bx-line2 bg-bx-surf text-bx-muted opacity-60" : "cursor-pointer border-bx-ok-fg bg-transparent text-bx-ok-fg active:bg-bx-ok-bg"}`}>
            <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={bloqueado} onChange={(e) => { elegir(e.target.files?.[0]); e.target.value = "" }} className="absolute h-px w-px opacity-0" aria-describedby={`ayuda-${tipo.key}`} />
            <Ico d={IC.plus} size={18} sw={2} className="rotate-0" />{subirTxt}
          </label>
          <span id={`ayuda-${tipo.key}`} className="text-center text-[0.75rem] text-bx-muted">{bloqueado ? "Marcá la autorización para poder subirlo." : "PDF, JPG o PNG · máximo 10 MB"}</span>
        </>
      )}
    </li>
  )
}

export default function DocumentosMovilNuevo() {
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [subiendo, setSubiendo] = useState(null)
  const [progreso, setProgreso] = useState(0)

  const cargar = () => {
    setErrorCarga(false)
    apiClient.get("/documentos/mis-documentos").then((r) => setDocumentos(r.data?.data || [])).catch(() => setErrorCarga(true)).finally(() => setCargando(false))
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar() }, [])

  const subir = async (tipo, file, consienteDatosSalud) => {
    setSubiendo(tipo); setProgreso(0)
    try {
      const form = new FormData()
      form.append("archivo", file); form.append("tipo", tipo)
      if (consienteDatosSalud !== undefined) form.append("consienteDatosSalud", String(consienteDatosSalud))
      const r = await apiClient.post("/documentos/subir", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => { if (ev.total) setProgreso(Math.round((ev.loaded / ev.total) * 100)) },
      })
      const nuevo = r.data?.data
      if (nuevo) setDocumentos((prev) => [nuevo, ...prev])
      toast.success("Documento cargado correctamente")
    } catch (err) {
      toast.error("Error al subir el documento", { description: err?.response?.data?.message || err.message })
    } finally {
      setSubiendo(null)
    }
  }

  const porTipo = (k) => documentos.filter((d) => d.tipo === k)
  const estados = TIPOS.map((t) => estadoDe(porTipo(t.key)[0]))
  const aprobados = estados.filter((e) => e === "aprobado").length

  return (
    <div className="bx bx-entrada flex flex-col gap-4">
      <h1 className="m-0 text-[1.375rem] font-extrabold">Documentos</h1>

      {errorCarga && <ErrorBanner titulo="No pudimos cargar tus documentos" texto="Revisá tu conexión e intentá de nuevo." onReintentar={() => { setCargando(true); cargar() }} />}

      <section aria-labelledby="t-prog-m" className="flex flex-col gap-3 rounded-2xl border border-bx-line bg-bx-card p-4">
        <div className="flex items-baseline gap-2">
          <span className="bx-num text-[2rem] leading-none text-bx-ok-fg">{aprobados}</span>
          <span className="text-sm font-bold text-bx-muted">de {TIPOS.length} validados</span>
        </div>
        <div aria-hidden="true" className="grid grid-cols-3 gap-1">
          {estados.map((e, i) => <span key={i} className={`h-1.5 rounded ${e === "aprobado" ? "bg-bx-lima" : e === "revision" ? "bg-bx-warn-fg" : "bg-bx-track"}`} />)}
        </div>
        <h2 id="t-prog-m" className="m-0 text-[0.9375rem] font-bold">{aprobados === TIPOS.length ? "Tu documentación está al día" : "Tu documentación"}</h2>
        <p className="m-0 text-[0.8125rem] leading-normal text-bx-muted">Los documentos son revisados por el administrador. Una vez validados, tu membresía quedará regularizada. Podés reemplazar cualquier documento subiendo uno nuevo en cualquier momento.</p>
      </section>

      {cargando ? (
        <div aria-busy="true" aria-label="Cargando documentos" className="flex flex-col gap-3"><Esqueleto alto={170} className="rounded-2xl" /></div>
      ) : (
        <ul className="bx-lista m-0 flex list-none flex-col gap-3 p-0">
          {TIPOS.map((t) => <Tarjeta key={t.key} tipo={t} docs={porTipo(t.key)} subiendo={subiendo === t.key} progreso={progreso} onSubir={subir} />)}
        </ul>
      )}
    </div>
  )
}
