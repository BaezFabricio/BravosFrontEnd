import { useState, useEffect, useRef } from "react"
import {
  Banknote, Landmark, Upload, Loader2, Copy, Check,
  CheckCircle2, ChevronDown, MessageCircle, AlertCircle, X,
  ShieldCheck, Zap, QrCode, CreditCard
} from "lucide-react"
import { initMercadoPago, Payment } from "@mercadopago/sdk-react"
import QRCode from "react-qr-code"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"
import { Dialog, DialogContent } from "@/components/ui/dialog"

initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: "es-AR" })

// ── MercadoPago logo ──────────────────────────────────────────────────────────

function MPLogo({ className = "h-5 w-auto" }) {
  return (
    <img
      src="/mercadopago.webp"
      alt="MercadoPago"
      className={className}
      style={{ objectFit: "contain" }}
    />
  )
}

// ── Copiar ────────────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copiar" }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        })
      }
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground/40 hover:text-foreground/70 transition-colors whitespace-nowrap"
    >
      {copied ? (
        <><Check className="h-3 w-3 text-lime-400" /> Copiado</>
      ) : (
        <><Copy className="h-3 w-3" /> {label}</>
      )}
    </button>
  )
}

// ── Features por tier (✓ y ✗) ────────────────────────────────────────────────

function getFeaturesForTier(tier, plan) {
  // Si descripcion tiene saltos de línea, usarlos como features positivas
  if (plan.descripcion) {
    const lines = plan.descripcion.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length > 1) {
      return lines.slice(0, 5).map((text) => ({ text, ok: true }))
    }
  }

  // Defaults por tier
  const credits = plan.cantidadCreditos
  const presets = [
    // Tier 0 — Inicial
    [
      { text: `${credits} créditos para cualquier disciplina`, ok: true },
      { text: "Acceso a seminarios y talleres", ok: true },
      { text: "Reserva vía App hasta 24hs antes", ok: true },
      { text: "Sin acceso a Open Box libre", ok: false },
    ],
    // Tier 1 — Recomendado
    [
      { text: "Pase libre de límite de clases diarias", ok: true },
      { text: "Reservas prioritarias 48hs antes", ok: true },
      { text: "Acceso a Open Box en todas las sedes", ok: true },
      { text: "15%OFF en bebidas isotónicas & bar", ok: true },
    ],
    // Tier 2 — Intermedio
    [
      { text: `${credits} créditos multidisciplina`, ok: true },
      { text: "Reservas habilitadas 36hs antes", ok: true },
      { text: "Acceso a Open Box (1 crédito = 1 turno)", ok: true },
      { text: "Cancelación flexible hasta 2hs antes", ok: true },
    ],
    // Tier 3+ — Largo Plazo
    [
      { text: "Acceso 100% ilimitado x 6 meses", ok: true },
      { text: "Plan nutricional mensual personalizado", ok: true },
      { text: "Remera técnica oficial BRAVOS de regalo", ok: true },
      { text: "Opción de congelar membresía x 15 días", ok: true },
    ],
  ]
  return presets[Math.min(tier, 3)]
}

function getTierMeta(tier) {
  const meta = [
    { label: "INICIAL", sub: "Válido 30 días", subColor: "text-foreground/40" },
    { label: "RECOMENDADO", sub: "Renovación mensual", subColor: "text-lime-400" },
    { label: "INTERMEDIO", sub: "Válido 45 días", subColor: "text-foreground/40" },
    { label: "LARGO PLAZO", sub: "Ahorra 15%", subColor: "text-lime-400" },
  ]
  return meta[Math.min(tier, 3)]
}

function getSubPrice(tier, plan) {
  const precio = Number(plan.precio)
  const cred = Number(plan.cantidadCreditos)
  if (tier === 1) return "Clases ilimitadas sin cupo mensual"
  if (tier === 3) {
    const porMes = Math.round(precio / 6)
    return `Equivale a ~$${porMes.toLocaleString("es-AR")} ARS / mes`
  }
  if (cred > 0) {
    const porClase = Math.round(precio / cred)
    const ahorro = tier === 2 ? " (Ahorrás 15%)" : ""
    return `$${porClase.toLocaleString("es-AR")} ARS por clase${ahorro}`
  }
  return null
}

// ── Modal de pago ─────────────────────────────────────────────────────────────

function ModalPago({ plan, open, onClose, configBanco }) {
  const [tab, setTab]                   = useState("mp")
  const [preferenceId, setPreferenceId] = useState(null)
  const [mpUrl, setMpUrl]               = useState(null)
  const [loadingUrl, setLoadingUrl]     = useState(false)
  const [uploading, setUploading]       = useState(false)
  const [comprobante, setComprobante]   = useState(null)
  const fileRef = useRef(null)

  // Precarga la preferencia al abrir el modal
  useEffect(() => {
    if (!open || !plan) return
    setTab("mp")
    setComprobante(null)
    setPreferenceId(null)
    setMpUrl(null)
    setLoadingUrl(true)
    apiClient
      .post("/pagos/crear-preferencia", { idPlan: plan.idPlan })
      .then((r) => {
        const { id, init_point, sandbox_init_point } = r.data?.data || {}
        setPreferenceId(id || null)
        setMpUrl(init_point || sandbox_init_point || null)
      })
      .catch(() => toast.error("No se pudo cargar el formulario de pago"))
      .finally(() => setLoadingUrl(false))
  }, [open, plan?.idPlan])

  const subirComprobante = async (file) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("El archivo no puede superar 10 MB"); return }
    setUploading(true)
    try {
      const form = new FormData()
      form.append("archivo", file)
      form.append("tipo", "comprobante_transferencia")
      await apiClient.post("/documentos/subir", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      setComprobante(file.name)
      toast.success("Comprobante enviado. El administrador lo revisará pronto.")
    } catch (err) {
      toast.error("Error al subir el comprobante", { description: err?.response?.data?.message })
    } finally {
      setUploading(false)
    }
  }

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border">
          <p className="text-[10px] font-black uppercase tracking-widest text-lime-400 mb-1">
            PASARELA DE PAGO SEGURA
          </p>
          <h2 className="text-lg font-black text-foreground">
            Completar Pago — {plan.nombre}
          </h2>
        </div>

        {/* Total */}
        <div className="px-6 py-3 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2 text-sm text-foreground/50">
            <div className="h-4 w-4 rounded-full border-2 border-lime-400 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-lime-400" />
            </div>
            Total a abonar:
          </div>
          <span className="text-2xl font-black text-lime-400">
            ${Number(plan.precio).toLocaleString("es-AR")}{" "}
            <span className="text-sm font-bold text-foreground/40">ARS</span>
          </span>
        </div>

        {/* Contenido scrolleable */}
        <div className="overflow-y-auto flex-1">

        {/* Tabs método */}
        <div className="px-6 pt-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3">
            SELECCIONA MÉTODO DE PAGO
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTab("mp")}
              className={`flex items-center justify-center gap-2 py-3 text-sm font-bold border transition-colors rounded-lg ${
                tab === "mp"
                  ? "border-[#009ee3] bg-[#009ee3]/10 text-[#009ee3]"
                  : "border-border text-foreground/50 hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              <MPLogo className="h-6 w-auto shrink-0" />
            </button>
            <button
              onClick={() => setTab("transferencia")}
              className={`flex items-center justify-center gap-2 py-3 text-sm font-bold border transition-colors rounded-lg ${
                tab === "transferencia"
                  ? "border-lime-400 bg-lime-400/10 text-lime-400"
                  : "border-border text-foreground/50 hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              <Landmark className="h-4 w-4 shrink-0" />
              Transferencia Bancaria
            </button>
          </div>
        </div>

        {/* ── Tab: Mercado Pago ── */}
        {tab === "mp" && (
          <div className="px-6 py-4 space-y-4">

            {loadingUrl ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
              </div>
            ) : preferenceId ? (
              <>
                {/* QR + info + botón */}
                {(() => {
                  const qrUrl = mpUrl || (preferenceId ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}` : null)
                  return qrUrl ? (
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-4 bg-foreground/[0.03] border border-border rounded-xl p-4">
                        <div className="bg-white p-2 rounded-lg shrink-0">
                          <QRCode value={qrUrl} size={72} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <p className="text-sm font-black text-foreground">Pagá con tu cuenta de Mercado Pago</p>
                          <p className="text-[11px] text-foreground/40 leading-snug">
                            Usá tus tarjetas guardadas, dinero disponible, cuotas sin tarjeta y mucho más.
                          </p>
                          <div className="flex items-center gap-1 flex-nowrap">
                            {[
                              { label: "VISA",  color: "#fff", bg: "#1a1f71", italic: true },
                              { img: "/pm-master.svg?v=2", bg: "#fff" },
                              { img: "/pm-amex.svg", bg: "#fff", big: true },
                              { label: "NX",    color: "#fff",    bg: "#e85d04" },
                              { label: "Cabal", color: "#fff", bg: "#16a34a" },
                              { label: "OCA",   color: "#c00",    bg: "#fff" },
                              { label: "Ualá",  color: "#7c3aed", bg: "#fff" },
                            ].map((item) => (
                              <div key={item.label || item.img} className="rounded flex items-center justify-center shrink-0 px-2" style={{height:"26px", minWidth:"34px", background: item.bg}}>
                                {item.img
                                  ? <img src={item.img} alt="" className={item.big ? "h-5 w-auto" : "h-4 w-auto"} />
                                  : <span className="text-[11px] font-black leading-none" style={{color: item.color, fontStyle: item.italic ? "italic" : "normal"}}>{item.label}</span>
                                }
                              </div>
                            ))}
                          </div>
                          <a
                            href={qrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 w-full bg-[#009ee3] hover:bg-[#008ecc] text-white font-black uppercase tracking-widest text-[10px] py-2.5 rounded-lg transition-colors"
                          >
                            <MPLogo className="h-4 w-auto" />
                            PAGAR CON MERCADO PAGO
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 border-t border-border" />
                        <span className="text-[10px] text-foreground/30 uppercase tracking-widest font-bold">O PAGÁ CON TARJETA</span>
                        <div className="flex-1 border-t border-border" />
                      </div>
                    </div>
                  ) : null
                })()}
              <Payment
                initialization={{ amount: Number(plan.precio), preferenceId }}
                customization={{
                  paymentMethods: {
                    creditCard: "all",
                    debitCard: "all",
                    mercadoPago: ["onboarding_credits"],
                  },
                  visual: {
                    style: {
                      theme: "dark",
                      customVariables: {
                        baseColor: "#a3e635",
                        baseColorFirstVariant: "#84cc16",
                        baseColorSecondVariant: "#65a30d",
                      },
                    },
                  },
                }}
                onSubmit={async ({ selectedPaymentMethod, formData }) => {
                  if (selectedPaymentMethod === "bank_transfer" || selectedPaymentMethod === "atm") return
                  try {
                    const res = await apiClient.post("/pagos/procesar-tarjeta", { formData, idPlan: plan.idPlan })
                    const { status } = res.data?.data || {}
                    const frontendUrl = window.location.origin
                    if (status === "approved") window.location.href = `${frontendUrl}/alumno/pago-exitoso`
                    else if (status === "in_process" || status === "pending") window.location.href = `${frontendUrl}/alumno/pago-pendiente`
                    else { toast.error("Pago rechazado"); throw new Error("Pago rechazado") }
                  } catch (err) {
                    const msg = err?.response?.data?.message || err?.message || "Error al procesar el pago"
                    toast.error(msg)
                    throw err
                  }
                }}
                onError={(error) => {
                  console.error("MP Brick error:", error)
                  toast.error("Error en el formulario de pago")
                }}
              />
              </>
            ) : (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-foreground/40">No se pudo cargar el formulario de pago.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Transferencia ── */}
        {tab === "transferencia" && (
          <div className="px-6 py-5 space-y-4">
            {configBanco.cbu || configBanco.alias ? (
              <div className="bg-foreground/[0.03] border border-border rounded-xl overflow-hidden">
                {/* Fila 1: Banco / Entidad + Titular (2 columnas) */}
                {(configBanco.banco || configBanco.titular) && (
                  <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
                    {configBanco.banco && (
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">BANCO / ENTIDAD</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{configBanco.banco}</p>
                      </div>
                    )}
                    {configBanco.titular && (
                      <div className="px-4 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">TITULAR</p>
                        <p className="text-sm font-bold text-foreground mt-0.5">{configBanco.titular}</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Fila 2: CUIT */}
                {configBanco.cuit && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">CUIT</p>
                      <p className="text-sm font-mono font-bold text-foreground tracking-wider mt-0.5">{configBanco.cuit}</p>
                    </div>
                    <CopyBtn text={configBanco.cuit} label="Copiar CUIT" />
                  </div>
                )}
                {/* Fila 3: CBU */}
                {configBanco.cbu && (
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">CBU</p>
                      <p className="text-sm font-mono font-bold text-foreground tracking-wider mt-0.5">{configBanco.cbu}</p>
                    </div>
                    <CopyBtn text={configBanco.cbu} label="Copiar CBU" />
                  </div>
                )}
                {/* Fila 4: Alias */}
                {configBanco.alias && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">ALIAS</p>
                      <p className="text-base font-mono font-black text-lime-400 mt-0.5">{configBanco.alias}</p>
                    </div>
                    <CopyBtn text={configBanco.alias} label="Copiar Alias" />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2 bg-foreground/[0.03] border border-border rounded-lg p-4">
                <AlertCircle className="h-4 w-4 text-foreground/30 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/50">
                  El gimnasio aún no configuró los datos bancarios. Contactate con recepción.
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-2">
                CARGAR COMPROBANTE DE PAGO
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) subirComprobante(f)
                  e.target.value = ""
                }}
              />
              {comprobante ? (
                <div className="flex items-center gap-2 border border-lime-400/30 bg-lime-400/5 rounded-lg px-4 py-3">
                  <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0" />
                  <p className="text-sm text-lime-400 font-semibold truncate">{comprobante}</p>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-border rounded-lg hover:border-foreground/30 py-8 transition-colors disabled:opacity-40 group"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
                      <span className="text-xs text-foreground/40">Subiendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-foreground/30 group-hover:text-foreground/50 transition-colors" />
                      <span className="text-xs text-foreground/40">
                        Arrastrá tu comprobante aquí o{" "}
                        <span className="text-lime-400 underline underline-offset-2">haz clic para subir</span>
                      </span>
                      <span className="text-[10px] text-foreground/25">PDF, JPG, PNG hasta 10MB</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="flex items-center gap-1.5 text-[11px] text-foreground/35">
              <span className="h-3 w-3 rounded-full border border-foreground/25 inline-flex items-center justify-center shrink-0">
                <span className="h-1 w-1 rounded-full bg-foreground/25" />
              </span>
              Acreditación sujeta a verificación (demora habitual: 10-30 min).
            </p>

            <button
              onClick={comprobante ? onClose : () => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-lime-400 text-black font-black uppercase tracking-widest text-[11px] py-4 rounded-xl hover:bg-lime-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {comprobante ? (
                <><CheckCircle2 className="h-4 w-4" /> LISTO — ESPERÁ LA CONFIRMACIÓN</>
              ) : (
                <><Upload className="h-4 w-4" /> ENVIAR COMPROBANTE Y CONFIRMAR PAGO</>
              )}
            </button>
          </div>
        )}
        </div>{/* fin scroll */}
      </DialogContent>
    </Dialog>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "¿Cómo se activan mis créditos una vez realizado el pago?",
    a: "Si pagás a través de Mercado Pago, la acreditación es automática e instantánea. En caso de transferencia bancaria, adjuntá el comprobante y nuestro equipo lo revisará en un lapso de 10 a 30 minutos durante el horario de atención.",
  },
  {
    q: "¿Puedo pausar mi membresía por vacaciones o lesión?",
    a: "Contactate de forma directa con nuestro equipo de recepción para plantear casos excepcionales o personalizados.",
  },
  {
    q: "¿Qué pasa si no uso todos mis créditos a tiempo?",
    a: "Los créditos no utilizados no se acumulan al renovar el plan. Te recomendamos elegir el plan que mejor se adapte a tu frecuencia de entrenamiento.",
  },
]

const DISCIPLINAS = [
  "CrossFit & WOD Diario",
  "Open Box (Entrenamiento Libre)",
  "Funcional, HIT & Movilidad",
  "Anticipación para Reservas",
  "Seguimiento de RM & Logros en App",
]

function valorTabla(filaIdx, tier, plan) {
  if (filaIdx === 0) return tier >= 2 ? { text: "Ilimitado", ok: true } : { text: `${plan.cantidadCreditos} clases`, ok: true }
  if (filaIdx === 1) {
    if (tier === 0) return { text: "—", ok: false }
    if (tier === 1) return { text: "1 crédito/clase", ok: true }
    return { text: "Ilimitado", ok: true }
  }
  if (filaIdx === 2) return tier >= 2 ? { text: null, ok: true } : { text: "—", ok: false }
  if (filaIdx === 3) {
    const labels = ["24hs", "36hs", "48hs (Prioridad)", "72hs (VIP)"]
    return { text: labels[Math.min(tier, 3)], ok: true }
  }
  if (filaIdx === 4) return tier >= 3 ? { text: "+ Nutrición", ok: true } : { text: "—", ok: false }
  return { text: "—", ok: false }
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function RenovarMembresia({ onRenovado }) {
  const [planes, setPlanes]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [configBanco, setConfigBanco] = useState({ banco: "", titular: "", cuit: "", cbu: "", alias: "" })
  const [planModal, setPlanModal]     = useState(null)
  const [faqOpen, setFaqOpen]         = useState(null)
  const [tabActiva, setTabActiva]     = useState("mensuales")

  useEffect(() => {
    apiClient
      .get("/pagos/planes")
      .then((r) => setPlanes(r.data?.data || []))
      .catch(() => toast.error("No se pudieron cargar los planes"))
      .finally(() => setLoading(false))

    fetch("/landing/config")
      .then((r) => r.json())
      .then((d) => {
        const cfg = d?.data || d
        setConfigBanco({
          banco:   cfg.bancoEntidad       || "",
          titular: cfg.titularCuenta      || "",
          cuit:    cfg.cuitTransferencia  || "",
          cbu:     cfg.cvuTransferencia   || "",
          alias:   cfg.aliasTransferencia || "",
        })
      })
      .catch(() => {})
  }, [])

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-foreground/30" />
      </div>
    )

  const planesOrdenados = [...planes].sort((a, b) => Number(a.precio) - Number(b.precio))
  const total = planesOrdenados.length
  const idxRecomendado = total > 1 ? Math.floor(total / 2) : 0

  return (
    <div className="space-y-10">
      {/* ── Encabezado ── */}
      <div className="text-center space-y-2">
        <p className="text-[11px] font-black uppercase tracking-widest text-lime-400">
          MEMBRESÍAS & CRÉDITOS DISPONIBLES
        </p>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-foreground leading-tight">
          Elegí tu plan o pack de créditos
        </h1>
        <p className="text-sm text-foreground/50 max-w-lg mx-auto leading-relaxed">
          Seleccioná la opción que mejor se adapte a tu ritmo de entrenamiento. Flexibilidad total
          para reservar tus clases favoritas con la comunidad BRAVOS.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="flex justify-center gap-3 flex-wrap">
        <button
          onClick={() => setTabActiva("mensuales")}
          className={`px-5 py-2 text-xs font-black uppercase tracking-widest border rounded-full transition-colors ${
            tabActiva === "mensuales"
              ? "bg-lime-400 border-lime-400 text-black"
              : "border-border text-foreground/50 hover:border-foreground/40 hover:text-foreground"
          }`}
        >
          Planes Mensuales / Recurrentes
        </button>
        <button
          onClick={() => setTabActiva("packs")}
          className={`px-5 py-2 text-xs font-black uppercase tracking-widest border rounded-full transition-colors ${
            tabActiva === "packs"
              ? "bg-lime-400 border-lime-400 text-black"
              : "border-border text-foreground/50 hover:border-foreground/40 hover:text-foreground"
          }`}
        >
          Packs de Clases (sin vencimiento rápido)
        </button>
      </div>

      {/* ── Cards de planes ── */}
      <div
        className={`grid gap-4 ${
          total <= 2
            ? "grid-cols-1 sm:grid-cols-2"
            : total === 3
            ? "grid-cols-1 sm:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
        }`}
      >
        {planesOrdenados.map((p, idx) => {
          const esRec    = idx === idxRecomendado && total > 1
          const tier     = idx
          const meta     = getTierMeta(tier)
          const features = getFeaturesForTier(tier, p)
          const subprice = getSubPrice(tier, p)

          return (
            /* Wrapper con overflow-visible para que el badge flote encima */
            <div key={p.idPlan} className={`relative flex flex-col ${esRec ? "pt-4" : ""}`}>

              {/* Badge MÁS POPULAR — flota encima del borde de la card */}
              {esRec && (
                <div className="absolute top-0 inset-x-0 flex justify-center z-10">
                  <span className="inline-flex items-center gap-1.5 bg-lime-400 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                    ★ + MÁS POPULAR
                  </span>
                </div>
              )}

              {/* Card */}
              <div className={`flex-1 flex flex-col rounded-2xl border transition-all overflow-hidden ${
                esRec
                  ? "border-lime-400/60 bg-[#0d150d] shadow-[0_0_40px_rgba(163,230,53,0.18)]"
                  : "border-border bg-card"
              }`}>
                <div className="flex-1 flex flex-col p-6 gap-5 min-h-[500px]">

                  {/* Tier label */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
                      {meta.label}
                    </span>
                    <span className={`text-[10px] font-bold ${meta.subColor}`}>
                      {meta.sub}
                    </span>
                  </div>

                  {/* Nombre + descripción */}
                  <div>
                    <h3 className={`text-2xl font-black leading-tight ${esRec ? "text-lime-400" : "text-foreground"}`}>
                      {p.nombre}
                    </h3>
                    {p.descripcion && (
                      <p className="text-xs text-foreground/40 mt-1 leading-snug line-clamp-2">
                        {p.descripcion.split("\n")[0]}
                      </p>
                    )}
                  </div>

                  {/* Precio */}
                  <div>
                    <p className={`text-4xl font-black leading-none ${esRec ? "text-lime-400" : "text-foreground"}`}>
                      ${Number(p.precio).toLocaleString("es-AR")}
                      <span className="text-sm font-bold text-foreground/40 ml-1">
                        {esRec ? "ARS/MES" : "ARS"}
                      </span>
                    </p>
                    {subprice && (
                      <p className={`text-xs mt-1 ${esRec ? "text-lime-400/70" : "text-foreground/35"}`}>
                        {subprice}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border" />

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2">
                        {f.ok ? (
                          <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-lime-400" />
                        ) : (
                          <X className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground/20" />
                        )}
                        <span className={`text-xs leading-snug ${f.ok ? "text-foreground/70" : "text-foreground/30 line-through"}`}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Botón */}
                  <button
                    onClick={() => setPlanModal(p)}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black uppercase tracking-widest rounded-xl transition-colors ${
                      esRec
                        ? "bg-lime-400 text-black hover:bg-lime-300"
                        : "border border-border text-foreground hover:border-foreground/40 hover:bg-foreground/5"
                    }`}
                  >
                    ELEGIR PLAN {esRec && "→"}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Tabla comparativa ── */}
      {planesOrdenados.length > 1 && (
        <div>
          <div className="mb-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-foreground/40">
              COMPARATIVA DE DISCIPLINAS Y BENEFICIOS
            </p>
            <p className="text-xs text-foreground/30 mt-0.5">
              Conocé todo lo que incluye cada nivel de suscripción en nuestra sede.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-foreground/40 w-[28%]">
                    DISCIPLINA / BENEFICIO
                  </th>
                  {planesOrdenados.map((p) => (
                    <th key={p.idPlan} className="py-3 px-2 text-center text-[10px] font-black uppercase tracking-widest text-foreground/50">
                      {p.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DISCIPLINAS.map((disc, filaIdx) => (
                  <tr key={disc} className="border-b border-border/40 hover:bg-foreground/[0.02]">
                    <td className="py-3 pr-4 text-foreground/60 font-medium">{disc}</td>
                    {planesOrdenados.map((p, colIdx) => {
                      const val = valorTabla(filaIdx, colIdx, p)
                      return (
                        <td key={p.idPlan} className="py-3 px-2 text-center">
                          {val.ok ? (
                            <span className="font-semibold text-foreground/70">
                              {val.text || <Check className="h-3.5 w-3.5 inline text-lime-400" />}
                            </span>
                          ) : (
                            <span className="text-foreground/20">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FAQ + Medios de pago ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FAQ */}
        <div className="lg:col-span-3 space-y-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-foreground/40 mb-3">
            ? PREGUNTAS FRECUENTES
          </p>
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-foreground/[0.02] transition-colors"
              >
                <span className="text-sm font-semibold text-foreground">{faq.q}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-foreground/40 transition-transform ${faqOpen === i ? "rotate-180" : ""}`} />
              </button>
              {faqOpen === i && (
                <div className="px-4 pb-4 border-t border-border">
                  <p className="text-xs text-foreground/60 leading-relaxed pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Medios de pago + soporte */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-border rounded-xl p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
              MEDIOS DE PAGO OFICIALES
            </p>
            <div className="flex items-center gap-3 py-2 border-b border-border/50">
              <div className="h-9 w-14 shrink-0 rounded-lg bg-[#1a1169] flex items-center justify-center px-1">
                <MPLogo className="h-6 w-auto" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">Mercado Pago</p>
                <p className="text-[11px] text-foreground/40">Tarjeta, Débito, Dinero en cuenta</p>
              </div>
              <span className="shrink-0 text-[10px] bg-lime-400/10 text-lime-400 font-bold px-2 py-0.5 border border-lime-400/30 rounded-full">
                Inmediato
              </span>
            </div>
            <div className="flex items-center gap-3 py-2">
              <div className="h-9 w-14 shrink-0 rounded-lg bg-foreground/[0.06] flex items-center justify-center">
                <Banknote className="h-4 w-4 text-foreground/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">Transferencia Bancaria</p>
                {configBanco.alias || configBanco.cbu ? (
                  <p className="text-[11px] text-foreground/40 truncate">
                    {configBanco.alias ? `Alias: ${configBanco.alias}` : configBanco.cbu}
                  </p>
                ) : (
                  <p className="text-[11px] text-foreground/25">Configurar en Admin</p>
                )}
              </div>
              <span className="shrink-0 text-[10px] text-foreground/30 font-medium">10-30 min</span>
            </div>
          </div>

          <div className="border border-border rounded-xl p-4 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40">
              ATENCIÓN AL ALUMNO
            </p>
            <p className="text-xs text-foreground/50">
              ¿Tenés dudas con tu facturación? Contactate con nuestro equipo de soporte.
            </p>
            <a
              href="https://wa.me/549XXXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-lime-400 hover:text-lime-300 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WHATSAPP SOPORTE BRAVOS
            </a>
          </div>
        </div>
      </div>

      {/* Modal */}
      <ModalPago
        plan={planModal}
        open={!!planModal}
        onClose={() => setPlanModal(null)}
        configBanco={configBanco}
      />
    </div>
  )
}
