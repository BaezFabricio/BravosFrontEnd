import { useEffect, useState, useRef } from "react"
import { Upload, FileText, Stethoscope, CreditCard, CheckCircle2, Clock, Eye, Info, ChevronDown, Hourglass } from "lucide-react"
import { toast } from "@/lib/notificar"
import apiClient from "@/api"
import { Cargando } from '@/components/Cargando'

const TIPOS = [
  {
    key: "comprobante_transferencia",
    label: "Comprobante de Transferencia",
    descripcion: "Comprobante de pago por transferencia bancaria de tu membresía.",
    Icon: CreditCard,
    accept: "image/*,application/pdf",
  },
  {
    key: "certificado_medico",
    label: "Certificado Médico",
    descripcion: "Certificado médico de aptitud física para la práctica deportiva.",
    Icon: Stethoscope,
    salud: true,
    accept: "image/*,application/pdf",
  },
  {
    key: "declaracion_jurada",
    label: "Declaración Jurada",
    descripcion: "Declaración jurada o contrato de membresía firmado.",
    Icon: FileText,
    salud: true,
    accept: "image/*,application/pdf",
  },
]

// Estado del documento: sin subir, subido y esperando revisión, o aprobado por el administrador
function EstadoBadge({ ultimo }) {
  const base = "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide"
  if (!ultimo) {
    return <span className={`${base} border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400`}><Clock className="h-3.5 w-3.5" aria-hidden="true" /> Pendiente</span>
  }
  if (ultimo.estado === "aprobado") {
    return <span className={`${base} border-lime-500/50 bg-lime-400/10 text-lime-700 dark:text-lime-400`}><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Aprobado</span>
  }
  return <span className={`${base} border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400`}><Hourglass className="h-3.5 w-3.5" aria-hidden="true" /> En revisión</span>
}

const fechaCorta = (f) => f ? new Date(f).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }) : ""

function DocCard({ tipo, documentos, onUpload, uploading }) {
  // Datos de salud = datos sensibles (Ley 25.326, art. 7): hace falta autorización expresa
  const [consiente, setConsiente] = useState(false)
  const bloqueado = tipo.salud && !consiente
  const fileRef = useRef(null)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const docs = documentos.filter(d => d.tipo === tipo.key)
  const ultimo = docs[0]
  const anteriores = docs.slice(1)
  const { Icon } = tipo
  const subiendo = uploading === tipo.key
  const idHistorial = `historial-${tipo.key}`

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede superar los 10 MB")
      return
    }
    await onUpload(tipo.key, file, tipo.salud ? consiente : undefined)
    e.target.value = ""
  }

  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card" aria-labelledby={`titulo-${tipo.key}`}>
      {/* Encabezado */}
      <div className="flex items-start gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-700 dark:text-lime-400">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 id={`titulo-${tipo.key}`} className="text-base font-black uppercase leading-tight tracking-tight text-foreground">{tipo.label}</h3>
            <EstadoBadge ultimo={ultimo} />
          </div>
          <p className="mt-1 text-sm leading-snug text-foreground/60">{tipo.descripcion}</p>
        </div>
      </div>

      {/* Archivo más reciente */}
      {ultimo && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-border bg-foreground/[0.03] px-3 py-2.5">
            <FileText className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{ultimo.nombreArchivo}</p>
              {ultimo.creadoEn && <p className="text-xs text-foreground/55">Subido el {fechaCorta(ultimo.creadoEn)}</p>}
            </div>
            <a
              href={ultimo.urlArchivo}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ver ${ultimo.nombreArchivo}`}
              className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-black uppercase tracking-wide text-foreground/80 active:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" /> Ver
            </a>
          </div>

          {anteriores.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setHistorialAbierto(v => !v)}
                aria-expanded={historialAbierto}
                aria-controls={idHistorial}
                className={`mt-2 flex min-h-[36px] items-center gap-1.5 rounded-md text-xs font-bold text-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card`}
              >
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${historialAbierto ? "rotate-180" : ""}`} aria-hidden="true" />
                {historialAbierto ? "Ocultar historial" : `Ver historial (${anteriores.length})`}
              </button>
              {historialAbierto && (
                <ul id={idHistorial} className="mt-1 divide-y divide-border rounded-xl border border-dashed border-border">
                  {anteriores.map((doc, i) => (
                    <li key={doc.idDocumento || i} className="flex items-center gap-2.5 px-3 py-2">
                      <FileText className="h-3.5 w-3.5 shrink-0 text-foreground/40" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-xs text-foreground/70">{doc.nombreArchivo}</span>
                      <span className="shrink-0 text-[11px] text-foreground/50">{fechaCorta(doc.creadoEn)}</span>
                      <a href={doc.urlArchivo} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${doc.nombreArchivo}`}
                        className={`shrink-0 rounded p-1.5 text-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card`}>
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* Subir o reemplazar */}
      <div className="mt-auto border-t border-border p-4">
        <input ref={fileRef} type="file" accept={tipo.accept} className="hidden" onChange={handleFile} />
        {tipo.salud && (
          <label className="mb-3 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={consiente}
              onChange={(e) => setConsiente(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-lime-500"
            />
            <span className="text-xs leading-snug text-foreground/70">
              Autorizo a Bravos Box a guardar este documento con datos de mi salud para controlar mi aptitud física,
              según la{" "}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground underline underline-offset-2">Política de privacidad</a>.
            </span>
          </label>
        )}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          data-guia="doc-subir"
          disabled={subiendo || bloqueado}
          title={bloqueado ? "Primero marcá la autorización" : undefined}
          className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border text-sm font-black uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
            ultimo
              ? "border-border text-foreground/80 active:bg-foreground/5"
              : "border-lime-500/50 bg-lime-400/10 text-lime-700 active:bg-lime-400/20 dark:text-lime-400"
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card`}
        >
          {subiendo ? (
            <span className="animate-pulse">Subiendo...</span>
          ) : (
            <><Upload className="h-5 w-5" aria-hidden="true" /> {ultimo ? "Reemplazar archivo" : "Subir archivo"}</>
          )}
        </button>
        <p className="mt-2 text-center text-xs text-foreground/55">
          {bloqueado ? "Marcá la autorización para poder subirlo" : "PDF, JPG o PNG · Máx. 10 MB"}
        </p>
      </div>
    </section>
  )
}

export default function DocumentacionPage() {
  const [documentos, setDocumentos] = useState([])
  const [uploading, setUploading] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    apiClient.get("/documentos/mis-documentos")
      .then(r => setDocumentos(r.data?.data || []))
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  const handleUpload = async (tipo, file, consienteDatosSalud) => {
    setUploading(tipo)
    try {
      const form = new FormData()
      form.append("archivo", file)
      form.append("tipo", tipo)
      if (consienteDatosSalud !== undefined) form.append("consienteDatosSalud", String(consienteDatosSalud))
      const r = await apiClient.post("/documentos/subir", form, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      const nuevo = r.data?.data
      if (nuevo) {
        setDocumentos(prev => [nuevo, ...prev])
      }
      toast.success("Documento cargado correctamente")
    } catch (err) {
      toast.error("Error al subir el documento", { description: err?.response?.data?.message || err.message })
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 data-guia="titulo" className="text-3xl font-black uppercase leading-none tracking-tight text-foreground lg:text-2xl">Documentos y comprobantes</h1>
        <p className="mt-1.5 text-sm text-foreground/60">Cargá los documentos que pide el gimnasio.</p>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-foreground/70">
          Los documentos son revisados por el administrador. Una vez validados, tu membresía quedará regularizada.
          Podés reemplazar cualquier documento subiendo uno nuevo en cualquier momento.
        </p>
      </div>

      {cargando ? (
        <Cargando filas={2} className="py-2" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIPOS.map(tipo => (
            <DocCard
              key={tipo.key}
              tipo={tipo}
              documentos={documentos}
              onUpload={handleUpload}
              uploading={uploading}
            />
          ))}
        </div>
      )}
    </div>
  )
}
