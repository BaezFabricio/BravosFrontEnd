import { useEffect, useState } from "react"
import apiClient from "@/api"
import { ErrorBanner, Esqueleto, Pantalla } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { toast } from "@/lib/notificar"
import { fechaCorta } from "@/lib/fechasBx"

/*
 * Documentos y comprobantes en escritorio (handoff, pantalla 08): una fila por documento con su estado, el archivo
 * cargado y la zona para subir (con clic o arrastrando).
 */

const TIPOS = [
  {
    key: "comprobante_transferencia",
    titulo: "Comprobante de transferencia",
    descripcion: "Comprobante de pago por transferencia bancaria de tu membresía.",
    icono: "M3 6h18v12H3zM3 10h18M7 15h3",
  },
  {
    key: "certificado_medico",
    titulo: "Certificado médico",
    descripcion: "Certificado médico de aptitud física para la práctica deportiva.",
    icono: "M6 3v6a4 4 0 0 0 8 0V3M10 13v2a5 5 0 0 0 10 0v-2M20 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    salud: true,
  },
  {
    key: "declaracion_jurada",
    titulo: "Declaración jurada",
    descripcion: "Declaración jurada o contrato de membresía firmado.",
    icono: "M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M8 13h8M8 17h5",
    salud: true,
  },
]

// Estado de cada documento (el servidor hoy maneja "pendiente" y "aprobado"; "rechazado" con su motivo queda listo para cuando exista)
const ESTADOS = {
  falta: { etiqueta: "Falta cargar", chip: "border-bx-btn-line bg-bx-surf text-bx-muted" },
  revision: { etiqueta: "En revisión", chip: "border-bx-warn-line bg-bx-warn-bg text-bx-warn-fg" },
  aprobado: { etiqueta: "Aprobado", chip: "border-bx-ok-line bg-bx-ok-bg text-bx-ok-fg" },
  rechazado: { etiqueta: "Rechazado", chip: "border-bx-err-line bg-bx-err-bg text-bx-err-fg" },
}

const estadoDe = (doc) => (!doc ? "falta" : doc.estado === "aprobado" ? "aprobado" : doc.estado === "rechazado" ? "rechazado" : "revision")

const MAX_BYTES = 10 * 1024 * 1024
const TIPOS_OK = ["application/pdf", "image/jpeg", "image/png"]

function Fila({ tipo, docs, subiendo, progreso, onSubir }) {
  const [consiente, setConsiente] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [historial, setHistorial] = useState(false)
  const ultimo = docs[0]
  const anteriores = docs.slice(1)
  const clave = estadoDe(ultimo)
  const est = ESTADOS[clave]
  // Datos de salud = datos sensibles (Ley 25.326, art. 7): hace falta autorización expresa en cada subida
  const bloqueado = !!tipo.salud && !consiente
  const idAyuda = `ayuda-${tipo.key}`

  const elegir = (file) => {
    if (!file) return
    if (!TIPOS_OK.includes(file.type)) { toast.error("Subí un PDF, JPG o PNG"); return }
    if (file.size > MAX_BYTES) { toast.error("El archivo no puede superar los 10 MB"); return }
    onSubir(tipo.key, file, tipo.salud ? consiente : undefined)
  }

  return (
    <li className={`grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-x-7 gap-y-[18px] rounded-2xl border bg-bx-card px-6 py-5 ${clave === "rechazado" ? "border-bx-err-line" : clave === "aprobado" ? "border-bx-ok-line" : "border-bx-line"}`}>
      <div className="flex min-w-0 gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-bx-tile text-bx-ok-fg"><Ico d={tipo.icono} size={22} /></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="m-0 text-[17px] font-bold">{tipo.titulo}</h3>
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-xs font-bold ${est.chip}`}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{est.etiqueta}
            </span>
          </div>
          <p className="mb-0 mt-1 text-[15px] leading-normal text-bx-muted">{tipo.descripcion}</p>
          {clave === "rechazado" && ultimo?.motivo && <p role="alert" className="mb-0 mt-2 text-sm font-medium leading-normal text-bx-err-fg">Motivo: {ultimo.motivo}</p>}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        {ultimo && (
          <div>
            <div className="flex items-center gap-3 rounded-[10px] border border-bx-line2 bg-bx-surf px-3.5 py-3">
              <span className="flex text-bx-muted"><Ico d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5" size={20} sw={2} /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{ultimo.nombreArchivo}</div>
                {ultimo.creadoEn && <div className="text-xs text-bx-muted">Subido el {fechaCorta(ultimo.creadoEn)}</div>}
              </div>
              <a href={ultimo.urlArchivo} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${ultimo.nombreArchivo}`} className="inline-flex min-h-11 items-center text-sm font-bold text-bx-ok-fg">Ver</a>
            </div>
            {anteriores.length > 0 && (
              <>
                <button type="button" onClick={() => setHistorial((v) => !v)} aria-expanded={historial} className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-bx-muted hover:text-bx-ink">
                  <Ico d="m6 9 6 6 6-6" size={14} sw={2} className={historial ? "rotate-180" : ""} />
                  {historial ? "Ocultar historial" : `Ver historial (${anteriores.length})`}
                </button>
                {historial && (
                  <ul className="m-0 list-none rounded-[10px] border border-dashed border-bx-line2 p-0">
                    {anteriores.map((d, i) => (
                      <li key={d.idDocumento || i} className="flex items-center gap-3 border-b border-bx-line2 px-3.5 py-1 last:border-b-0">
                        <span className="min-w-0 flex-1 truncate text-[13px] text-bx-muted">{d.nombreArchivo}</span>
                        <span className="shrink-0 text-xs text-bx-muted">{fechaCorta(d.creadoEn)}</span>
                        <a href={d.urlArchivo} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${d.nombreArchivo}`} className="inline-flex min-h-11 items-center text-[13px] font-bold text-bx-ok-fg">Ver</a>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        {tipo.salud && (
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-normal text-bx-muted">
            <input type="checkbox" checked={consiente} onChange={(e) => setConsiente(e.target.checked)} className="m-0 h-[22px] w-[22px] shrink-0 accent-[#7fbf00]" />
            <span>
              Autorizo a Bravos Box a guardar este documento con datos de mi salud para controlar mi aptitud física, según la{" "}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-bold text-bx-ink underline">Política de privacidad</a>.
            </span>
          </label>
        )}

        {subiendo ? (
          <div role="status" className="flex flex-col gap-2 rounded-[10px] border border-bx-line2 bg-bx-surf p-3.5">
            <div className="text-sm font-semibold">Subiendo {subiendo}…{progreso > 0 && progreso < 100 ? ` ${progreso}%` : ""}</div>
            <div className="h-1.5 overflow-hidden rounded-[3px] bg-bx-track"><div className="h-full rounded-[3px] bg-bx-barra transition-[width]" style={{ width: `${Math.max(progreso, 8)}%` }} /></div>
          </div>
        ) : (
          <>
            <label
              onDragOver={(e) => { if (!bloqueado) { e.preventDefault(); setArrastrando(true) } }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => { e.preventDefault(); setArrastrando(false); if (!bloqueado) elegir(e.dataTransfer.files?.[0]) }}
              className={`relative flex min-h-16 flex-wrap items-center justify-center gap-x-3.5 gap-y-2 rounded-xl border-2 border-dashed px-4 py-3 text-center ${bloqueado ? "cursor-not-allowed opacity-55" : "cursor-pointer"} ${arrastrando ? "border-bx-lima bg-bx-ok-bg text-bx-ok-fg" : "border-bx-btn-line bg-transparent text-bx-ink"}`}
            >
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={bloqueado}
                aria-describedby={idAyuda}
                onChange={(e) => { elegir(e.target.files?.[0]); e.target.value = "" }}
                className="absolute h-px w-px opacity-0"
              />
              <span className="inline-flex items-center gap-2 text-[15px] font-bold">
                <Ico d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" size={18} sw={2} />
                {clave === "rechazado" ? "Subir uno nuevo" : ultimo ? "Reemplazar archivo" : "Subir archivo"}
              </span>
              <span className="text-[13px] text-bx-muted">o arrastralo acá</span>
            </label>
            <span id={idAyuda} className="text-center text-[13px] font-medium text-bx-muted">
              {bloqueado ? "Marcá la autorización para poder subirlo." : "PDF, JPG o PNG · Máx. 10 MB"}
            </span>
          </>
        )}
      </div>
    </li>
  )
}

export default function DocumentosEscritorio() {
  const [documentos, setDocumentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [subiendo, setSubiendo] = useState(null) // { tipo, nombre }
  const [progreso, setProgreso] = useState(0)

  const cargar = () => {
    setErrorCarga(false)
    apiClient.get("/documentos/mis-documentos")
      .then((r) => setDocumentos(r.data?.data || []))
      .catch(() => setErrorCarga(true))
      .finally(() => setCargando(false))
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar() }, [])

  const subir = async (tipo, file, consienteDatosSalud) => {
    setSubiendo({ tipo, nombre: file.name })
    setProgreso(0)
    try {
      const form = new FormData()
      form.append("archivo", file)
      form.append("tipo", tipo)
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

  const porTipo = (clave) => documentos.filter((d) => d.tipo === clave)
  const estados = TIPOS.map((t) => estadoDe(porTipo(t.key)[0]))
  const aprobados = estados.filter((e) => e === "aprobado").length

  return (
    <Pantalla className="gap-5">
      {errorCarga && <ErrorBanner titulo="No pudimos cargar tus documentos" texto="Revisá tu conexión e intentá de nuevo." onReintentar={() => { setCargando(true); cargar() }} />}

      <section aria-labelledby="t-prog" className="flex flex-wrap items-center gap-x-7 gap-y-4 rounded-2xl border border-bx-line bg-bx-card px-6 py-5">
        <div className="min-w-[260px] flex-1">
          <h2 id="t-prog" className="m-0 text-lg font-bold">{aprobados === TIPOS.length ? "Tu documentación está al día" : "Tu documentación"}</h2>
          <p className="mb-0 mt-1 text-[15px] leading-normal text-bx-muted">
            Los documentos son revisados por el administrador. Una vez validados, tu membresía quedará regularizada. Podés reemplazar cualquier documento subiendo uno nuevo en cualquier momento.
          </p>
        </div>
        <div className="min-w-[200px] flex-[0_1_280px]">
          <div className="mb-2 flex justify-between text-[13px] font-semibold"><span>Aprobados</span><span className="text-bx-muted">{aprobados} de {TIPOS.length}</span></div>
          <div role="progressbar" aria-label="Documentos aprobados" aria-valuemin={0} aria-valuemax={TIPOS.length} aria-valuenow={aprobados} className="grid grid-cols-3 gap-1">
            {estados.map((e, i) => (
              <span key={i} className={`h-2 rounded ${e === "aprobado" ? "bg-bx-lima" : e === "revision" ? "bg-bx-warn-fg" : "bg-bx-track"}`} />
            ))}
          </div>
        </div>
      </section>

      {cargando ? (
        <div aria-busy="true" aria-label="Cargando documentos" className="flex flex-col gap-3.5">
          <Esqueleto alto={150} className="rounded-2xl" /><Esqueleto alto={150} className="rounded-2xl" />
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
          {TIPOS.map((t) => (
            <Fila key={t.key} tipo={t} docs={porTipo(t.key)} subiendo={subiendo?.tipo === t.key ? subiendo.nombre : null} progreso={progreso} onSubir={subir} />
          ))}
        </ul>
      )}
    </Pantalla>
  )
}
