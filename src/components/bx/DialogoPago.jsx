import { useState } from "react"
import { Payment } from "@mercadopago/sdk-react"
import QRCode from "react-qr-code"
import { Boton, Dialogo } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { useTheme } from "@/components/theme-provider"
import { toast } from "@/lib/notificar"

/*
 * Pago de una membresía en escritorio (handoff, pantalla 06): un solo diálogo con el total, el método de pago
 * (Mercado Pago o transferencia) y los términos fijos al pie. Los botones de pago quedan deshabilitados hasta
 * aceptar los términos. La lógica (preferencia, detección del pago, tarjeta, comprobante) es la de ModalPago
 * en RenovarMembresia.jsx, que le pasa su estado en `e`.
 */

const TARJETAS = [
  { label: "VISA", cls: "bg-white text-[#1a1f71] italic" },
  { img: "/pm-master.svg?v=2" },
  { img: "/pm-amex.svg" },
  { label: "NX", cls: "bg-[#e85d04] text-white" },
  { label: "Cabal", cls: "bg-[#16a34a] text-white" },
  { label: "OCA", cls: "bg-white text-[#c00]" },
  { label: "Ualá", cls: "bg-white text-[#7c3aed]" },
]

const precio = (p) => `$${Number(p).toLocaleString("es-AR")}`

export function Copiar({ texto, etiqueta = "Copiar" }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(texto).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000) }).catch(() => toast.error("No se pudo copiar", { guardar: false }))}
      className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-bx-btn-line bg-bx-card px-3.5 text-sm font-bold text-bx-ink hover:border-bx-lima"
    >
      <Ico d="M9 9h11v11H9zM5 15H4V4h11v1" size={16} sw={2} />{copiado ? "Copiado" : etiqueta}
    </button>
  )
}

function Estado({ icono, titulo, texto, children }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-8 py-12 text-center">
      {icono}
      <div>
        <p className="m-0 text-lg font-bold">{titulo}</p>
        <p className="mb-0 mt-1 max-w-xs text-sm text-bx-muted">{texto}</p>
      </div>
      {children}
    </div>
  )
}

export function DialogoPago({ plan, open, onClose, onRenovado, configBanco, e }) {
  const { theme } = useTheme()
  const oscuro = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
  const {
    tab, setTab, preferenceId, mpUrl, qrData, loadingUrl, setLoadingUrl, uploading, comprobante, pagando,
    pagoConfirmado, yaPagadoAntes, acepto, setAcepto, fileRef, procesarPago, subirComprobante,
  } = e

  if (!plan) return null
  const qrUrl = mpUrl || (preferenceId ? `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}` : null)
  const qrValor = qrData || qrUrl
  const hayBanco = configBanco.cbu || configBanco.alias
  const metodo = (id, texto) => (
    <button
      key={id}
      type="button"
      aria-pressed={tab === id}
      onClick={() => setTab(id)}
      className={`flex h-[3.75rem] items-center justify-center gap-2.5 rounded-xl text-[0.9375rem] font-bold text-bx-ink transition-colors hover:border-bx-lima ${tab === id ? "border-2 border-bx-lima bg-bx-ok-bg" : "border border-bx-btn-line bg-bx-surf"}`}
    >
      {texto}
    </button>
  )

  const pie = !pagoConfirmado && !yaPagadoAntes && (
    <div className="flex w-full flex-col items-stretch gap-2">
      <label className="flex cursor-pointer items-start gap-3.5 py-1 text-[0.9375rem] leading-normal text-bx-muted">
        <input
          type="checkbox"
          checked={acepto}
          onChange={(ev) => { setAcepto(ev.target.checked); if (ev.target.checked && !preferenceId) setLoadingUrl(true) }}
          className="mt-px h-[1.375rem] w-[1.375rem] shrink-0 accent-[#7fbf00]"
        />
        <span>
          Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer" className="font-bold text-bx-ink underline">Términos y condiciones</a>{" "}
          y la <a href="/reembolsos" target="_blank" rel="noopener noreferrer" className="font-bold text-bx-ink underline">Política de reembolsos</a>.
          {" "}Puedo arrepentirme de la compra dentro de los 10 días.
        </span>
      </label>
      {!acepto && <span id="terms-help" className="text-[0.8125rem] font-medium text-bx-muted">Aceptá los términos para habilitar el pago.</span>}
    </div>
  )

  return (
    <Dialogo
      abierto={open}
      onCerrar={onClose}
      sobretitulo="PASARELA DE PAGO SEGURA"
      titulo={`Completar pago · ${plan.nombre}`}
      ancho={920}
      cuerpoClassName="p-0"
      pie={pie || undefined}
      pieClassName="block px-8 py-4"
    >
      {/* Mismo tiempo que PAGO_EXITO_MS en RenovarMembresia: pop-in 0,9 s + dibujo del check 1,1 s + pausa */}
      <style>{`
        @keyframes pago-pop-in { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
        @keyframes pago-draw-check { 0% { stroke-dashoffset: 60; } 100% { stroke-dashoffset: 0; } }
        .pago-circle-pop { animation: pago-pop-in 0.9s cubic-bezier(0.22,1,0.36,1) both; }
        .pago-check-draw { stroke-dasharray: 60; stroke-dashoffset: 60; animation: pago-draw-check 1.1s ease-out 0.7s both; }
      `}</style>

      <div className="flex items-center justify-between gap-3 border-y border-bx-line bg-bx-surf px-8 py-4">
        <span className="text-base font-medium text-bx-muted">Total a abonar</span>
        <span><span className="bx-num text-4xl leading-none text-bx-ok-fg">{precio(plan.precio)}</span><span className="text-sm font-bold text-bx-muted"> ARS</span></span>
      </div>

      {yaPagadoAntes ? (
        <Estado
          icono={<span className="grid h-16 w-16 place-items-center rounded-full border border-bx-line bg-bx-surf text-bx-muted"><Ico d={IC.check} size={32} /></span>}
          titulo="Ya pagaste este plan hoy"
          texto="Tu membresía ya está activa. Si necesitás otro plan, escribinos."
        >
          <Boton variante="secundario" onClick={onClose}>Cerrar</Boton>
        </Estado>
      ) : pagoConfirmado ? (
        <Estado
          icono={
            <span className="pago-circle-pop grid h-16 w-16 place-items-center rounded-full border-2 border-bx-ok-fg bg-bx-ok-bg">
              <svg viewBox="0 0 52 52" className="h-8 w-8 text-bx-ok-fg" fill="none" aria-hidden="true">
                <polyline className="pago-check-draw" points="10,28 22,40 42,16" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          }
          titulo="¡Pago confirmado!"
          texto="Tu membresía ya está activa."
        >
          <Boton onClick={() => { onRenovado?.(); onClose() }}>Listo</Boton>
        </Estado>
      ) : (
        <div className="flex flex-col gap-5 px-8 pb-7 pt-6">
          <fieldset className="m-0 border-0 p-0">
            <legend className="mb-2.5 text-xs font-semibold tracking-[0.1em] text-bx-muted">ELEGÍ EL MÉTODO DE PAGO</legend>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,12.5rem),1fr))] gap-2.5">
              {metodo("mp", "Mercado Pago")}
              {metodo("transferencia", "Transferencia")}
            </div>
          </fieldset>

          {tab === "mp" && (
            <>
              <div className="flex flex-col gap-4 rounded-[0.875rem] border border-bx-line2 bg-bx-surf p-5">
                <div className="flex flex-wrap items-center gap-[1.125rem]">
                  <div role="img" aria-label="Código QR de Mercado Pago" className="grid h-[7.5rem] w-[7.5rem] shrink-0 place-items-center rounded-[0.625rem] border border-dashed border-[#b9bcae] bg-white p-2 text-center text-xs font-semibold text-[#5f6156]">
                    {acepto && qrValor ? <QRCode value={qrValor} size={104} /> : acepto && loadingUrl ? "Preparando…" : <>QR de<br />Mercado Pago</>}
                  </div>
                  <div className="flex min-w-[13.75rem] flex-1 flex-col gap-2">
                    <strong className="text-base font-bold">{qrData ? "Pagá con cualquier billetera" : "Pagá con tu cuenta de Mercado Pago"}</strong>
                    <span className="text-sm text-bx-muted">
                      {qrData ? "Escaneá el QR desde la app de tu banco o billetera favorita." : "Usá tus tarjetas guardadas, dinero disponible y cuotas sin tarjeta."}
                    </span>
                    <div aria-label="Tarjetas aceptadas" className="flex flex-wrap gap-1.5">
                      {TARJETAS.map((t) => (
                        <span key={t.label || t.img} className={`inline-flex h-7 items-center rounded-md border border-[#e2e2da] px-2.5 text-[0.6875rem] font-extrabold ${t.cls || "bg-white"}`}>
                          {t.img ? <img src={t.img} alt="" className="h-4 w-auto" /> : t.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                {acepto && qrUrl ? (
                  <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="flex h-[3.25rem] items-center justify-center rounded-[0.625rem] bg-[#009ee3] text-[0.9375rem] font-bold tracking-[0.04em] text-white hover:bg-[#008ecc]">
                    Pagar con Mercado Pago
                  </a>
                ) : (
                  <button type="button" disabled aria-describedby="terms-help" className="h-[3.25rem] cursor-not-allowed rounded-[0.625rem] bg-bx-line2 text-[0.9375rem] font-bold tracking-[0.04em] text-bx-muted">
                    Pagar con Mercado Pago
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold tracking-[0.1em] text-bx-muted">
                <span className="h-px flex-1 bg-bx-line2" />O PAGÁ CON TARJETA<span className="h-px flex-1 bg-bx-line2" />
              </div>

              {acepto && preferenceId ? (
                <>
                  <div className="rounded-[0.875rem] border border-bx-line2 bg-bx-surf p-5">
                    <Payment
                      initialization={{ amount: Number(plan.precio), preferenceId }}
                      customization={{
                        paymentMethods: { creditCard: "all", debitCard: "all", mercadoPago: ["onboarding_credits"] },
                        visual: {
                          hidePaymentButton: true,
                          style: {
                            theme: oscuro ? "dark" : "default",
                            customVariables: { baseColor: "#7fbf00", baseColorFirstVariant: "#6aa300", baseColorSecondVariant: "#5a8a00" },
                          },
                        },
                      }}
                      onError={(error) => { console.error("MP Brick error:", error); toast.error("Error en el formulario de pago") }}
                    />
                  </div>
                  <Boton tamano="lg" onClick={procesarPago} disabled={pagando} aria-busy={pagando} className="h-14 gap-2 tracking-[0.04em]">
                    <Ico d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" size={18} sw={2} />
                    {pagando ? "Procesando…" : `Pagar ${precio(plan.precio)}`}
                  </Boton>
                </>
              ) : acepto && loadingUrl ? (
                <div aria-busy="true" className="bx-sk h-40 rounded-[0.875rem] bg-bx-skeleton" />
              ) : acepto ? (
                <p className="m-0 rounded-[0.875rem] border border-dashed border-bx-btn-line p-5 text-sm text-bx-muted">No se pudo cargar el formulario de pago. Cerrá esta ventana y volvé a intentarlo.</p>
              ) : (
                <button type="button" disabled aria-describedby="terms-help" className="h-14 cursor-not-allowed rounded-[0.625rem] bg-bx-line2 text-[0.9375rem] font-bold tracking-[0.04em] text-bx-muted">
                  Elegí un medio de pago
                </button>
              )}
            </>
          )}

          {tab === "transferencia" && (
            <div className="flex flex-col gap-3.5 rounded-[0.875rem] border border-bx-line2 bg-bx-surf p-5">
              {hayBanco ? (
                <dl className="m-0 flex flex-col gap-3">
                  {[["Banco / entidad", configBanco.banco], ["Titular", configBanco.titular], ["CUIT", configBanco.cuit, "Copiar CUIT"], ["CBU", configBanco.cbu, "Copiar CBU"], ["Alias", configBanco.alias, "Copiar alias", true]]
                    .filter(([, v]) => v)
                    .map(([k, v, copiar, grande]) => (
                      <div key={k} className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <dt className="text-[0.8125rem] font-medium text-bx-muted">{k}</dt>
                          <dd className={`m-0 ${grande ? "text-xl font-extrabold" : "text-[0.9375rem] font-bold"} ${copiar ? "font-mono tracking-wide" : ""}`}>{v}</dd>
                        </div>
                        {copiar && <Copiar texto={v} etiqueta={copiar} />}
                      </div>
                    ))}
                </dl>
              ) : (
                <p className="m-0 text-sm text-bx-muted">El gimnasio aún no configuró los datos bancarios. Contactate con recepción.</p>
              )}
              <div className="text-sm leading-normal text-bx-muted">Transferí exactamente {precio(plan.precio)}. Los créditos se acreditan en 10–30 min, cuando verificamos el comprobante.</div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(ev) => { const f = ev.target.files?.[0]; if (f) subirComprobante(f); ev.target.value = "" }}
              />
              {comprobante && (
                <div className="flex items-center gap-2 rounded-lg border border-bx-ok-line bg-bx-ok-bg px-4 py-3 text-sm font-semibold text-bx-ok-fg">
                  <Ico d={IC.check} size={16} sw={2.4} /><span className="truncate">{comprobante}</span>
                </div>
              )}
              <button
                type="button"
                disabled={!acepto || uploading}
                aria-describedby="terms-help"
                onClick={comprobante ? onClose : () => fileRef.current?.click()}
                className={`h-[3.25rem] rounded-[0.625rem] text-[0.9375rem] font-bold ${acepto && !uploading ? "cursor-pointer bg-bx-lima text-bx-negro hover:bg-bx-lima-hover" : "cursor-not-allowed bg-bx-line2 text-bx-muted"}`}
              >
                {uploading ? "Subiendo comprobante…" : comprobante ? "Listo: esperá la confirmación" : "Ya transferí: adjuntar comprobante"}
              </button>
              <span className="text-[0.8125rem] text-bx-muted">PDF, JPG o PNG de hasta 10 MB.</span>
            </div>
          )}
        </div>
      )}
    </Dialogo>
  )
}
