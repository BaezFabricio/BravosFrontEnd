import { useEffect, useState, useRef } from "react"
import { Upload, FileText, Stethoscope, CreditCard, CheckCircle2, Clock, Eye, AlertCircle, ChevronDown } from "lucide-react"
import { toast } from "@/lib/notificar"
import apiClient from "@/api"

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
    accept: "image/*,application/pdf",
  },
  {
    key: "declaracion_jurada",
    label: "Declaración Jurada",
    descripcion: "Declaración jurada o contrato de membresía firmado.",
    Icon: FileText,
    accept: "image/*,application/pdf",
  },
]

function EstadoBadge({ ultimo }) {
  if (!ultimo) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 border border-border text-foreground/40 rounded-md">
        <Clock className="h-3.5 w-3.5" />
        Pendiente
      </span>
    )
  }
  if (ultimo.estado === "aprobado") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 border border-lime-400/50 bg-lime-400/10 text-lime-400 rounded-md">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Aprobado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 border border-yellow-500/40 bg-yellow-500/8 text-yellow-400 rounded-md">
      <Clock className="h-3.5 w-3.5" />
      En revisión
    </span>
  )
}

function DocCard({ tipo, documentos, onUpload, uploading }) {
  const fileRef = useRef(null)
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const docs = documentos.filter(d => d.tipo === tipo.key)
  const ultimo = docs[0]
  const anteriores = docs.slice(1)
  const { Icon } = tipo

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede superar los 10 MB")
      return
    }
    await onUpload(tipo.key, file)
    e.target.value = ""
  }

  return (
    <div className="border border-border bg-card flex flex-col">
      {/* Header */}
      <div className="p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 border border-border flex items-center justify-center text-foreground/50">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-base uppercase tracking-tight text-foreground leading-tight">
              {tipo.label}
            </h3>
            <p className="text-sm text-foreground/50 mt-1 leading-snug">{tipo.descripcion}</p>
          </div>
        </div>
        <div className="shrink-0 mt-0.5">
          <EstadoBadge ultimo={ultimo} />
        </div>
      </div>

      {/* Archivo más reciente */}
      {ultimo && (
        <div className="border-t border-border bg-foreground/[0.02]">
          <div className="px-5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="h-3.5 w-3.5 text-foreground/35 shrink-0" />
              <span className="text-sm text-foreground/70 truncate">{ultimo.nombreArchivo}</span>
              {ultimo.creadoEn && (
                <span className="text-xs text-foreground/35 shrink-0">
                  {new Date(ultimo.creadoEn).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {ultimo.estado === "aprobado" && (
                <span className="shrink-0 text-[10px] font-bold text-lime-400">✓</span>
              )}
            </div>
            <a
              href={ultimo.urlArchivo}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-foreground/40 hover:text-foreground transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Ver
            </a>
          </div>

          {/* Toggle historial anterior */}
          {anteriores.length > 0 && (
            <>
              <button
                onClick={() => setHistorialAbierto(v => !v)}
                className="w-full px-5 py-1.5 flex items-center gap-1.5 text-xs text-foreground/30 hover:text-foreground/50 transition-colors border-t border-dashed border-border"
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${historialAbierto ? "rotate-180" : ""}`} />
                {historialAbierto ? "Ocultar" : `Ver historial (${anteriores.length})`}
              </button>
              {historialAbierto && (
                <div className="divide-y divide-border border-t border-dashed border-border">
                  {anteriores.map((doc, i) => (
                    <div key={doc.idDocumento || i} className="px-5 py-2 flex items-center justify-between gap-3 opacity-50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-foreground/35 shrink-0" />
                        <span className="text-xs text-foreground/60 truncate">{doc.nombreArchivo}</span>
                        {doc.creadoEn && (
                          <span className="text-xs text-foreground/30 shrink-0">
                            {new Date(doc.creadoEn).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <a
                        href={doc.urlArchivo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-1 text-xs text-foreground/30 hover:text-foreground/60 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Botón subir */}
      <div className="px-5 py-4 border-t border-border mt-auto">
        <input ref={fileRef} type="file" accept={tipo.accept} className="hidden" onChange={handleFile} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading === tipo.key}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-border hover:border-foreground/40 py-4 text-sm font-bold uppercase tracking-wide text-foreground/40 hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {uploading === tipo.key ? (
            <span className="animate-pulse text-foreground/50">Subiendo...</span>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Subir archivo
            </>
          )}
        </button>
        <p className="text-xs text-foreground/30 text-center mt-2">PDF, JPG o PNG · Máx. 10 MB</p>
      </div>
    </div>
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

  const handleUpload = async (tipo, file) => {
    setUploading(tipo)
    try {
      const form = new FormData()
      form.append("archivo", file)
      form.append("tipo", tipo)
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
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Documentación</h1>
        <p className="text-sm text-foreground/50 mt-1">Cargá los documentos requeridos por el gimnasio.</p>
      </div>

      <div className="border border-border bg-card px-5 py-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-foreground/40 shrink-0 mt-0.5" />
        <p className="text-sm text-foreground/50 leading-relaxed">
          Los documentos son revisados por el administrador. Una vez validados, tu membresía quedará regularizada.
          Podés reemplazar cualquier documento subiendo uno nuevo en cualquier momento.
        </p>
      </div>

      {cargando ? (
        <div className="text-center py-16 text-foreground/30 text-sm">Cargando...</div>
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
