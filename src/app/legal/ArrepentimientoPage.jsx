import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import LegalLayout, { Enlace, Contacto } from "./LegalLayout"
import { useDatosLegales } from "./datosLegales"

const CAMPO = "h-11 w-full rounded-md border border-border bg-muted/50 px-3 text-sm text-foreground outline-none focus:border-lime-600 dark:focus:border-lime-400"
const ETIQUETA = "text-xs font-bold uppercase tracking-wider text-foreground/60"

/**
 * Botón de arrepentimiento (Res. SCI 424/2020): sin registro, y con un código de
 * constancia que se entrega en el momento.
 */
export default function ArrepentimientoPage() {
  const d = useDatosLegales()
  const [form, setForm] = useState({ nombre: "", dni: "", correo: "", telefono: "", fechaCompra: "", detalle: "" })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")
  const [codigo, setCodigo] = useState("")

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const enviar = async (e) => {
    e.preventDefault()
    setError("")
    if (form.nombre.trim().length < 3) return setError("Ingresá tu nombre completo.")
    if (!/^\d{7,10}$/.test(form.dni.replace(/\D/g, ""))) return setError("Ingresá un DNI válido, solo números.")
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) return setError("Ingresá un correo válido.")
    setEnviando(true)
    try {
      const r = await fetch("/api/vv1/arrepentimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(j.message || "No se pudo enviar la solicitud")
      setCodigo(j.data?.codigo || "")
    } catch (err) {
      setError(err.message || "No se pudo enviar la solicitud. Probá de nuevo.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <LegalLayout titulo="Botón de arrepentimiento">
      <p>
        Si compraste una membresía por el sitio, podés revocar la compra dentro de los{" "}
        <strong>10 días corridos</strong> desde que pagaste, sin costo y sin explicar el motivo. Completá
        este formulario: no hace falta iniciar sesión. Más detalles en la{" "}
        <Enlace to="/reembolsos">Política de reembolsos</Enlace>.
      </p>

      {codigo ? (
        <div className="!mt-8 rounded-xl border border-lime-600/40 bg-lime-400/10 p-6 text-center dark:border-lime-400/40">
          <CheckCircle2 className="mx-auto h-10 w-10 text-lime-700 dark:text-lime-400" />
          <p className="mt-3 text-lg font-black text-foreground">Recibimos tu solicitud</p>
          <p className="mt-1 text-sm">Tu código de constancia es:</p>
          <p className="mt-2 font-mono text-2xl font-black tracking-widest text-foreground">{codigo}</p>
          <p className="mt-4 text-sm">
            Te lo enviamos también a <strong>{form.correo}</strong>. Te vamos a contactar para hacer el
            reintegro por el mismo medio con el que pagaste.
          </p>
        </div>
      ) : (
        <form onSubmit={enviar} className="!mt-8 space-y-4 rounded-xl border border-border p-5 sm:p-6" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="arr-nombre" className={ETIQUETA}>Nombre completo *</label>
            <input id="arr-nombre" className={CAMPO} value={form.nombre} onChange={set("nombre")} autoComplete="name" maxLength={150} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="arr-dni" className={ETIQUETA}>DNI *</label>
              <input id="arr-dni" className={CAMPO} value={form.dni} onChange={set("dni")} inputMode="numeric" maxLength={10} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="arr-fecha" className={ETIQUETA}>Fecha de la compra</label>
              <input id="arr-fecha" type="date" className={CAMPO} value={form.fechaCompra} onChange={set("fechaCompra")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="arr-correo" className={ETIQUETA}>Correo electrónico *</label>
              <input id="arr-correo" type="email" className={CAMPO} value={form.correo} onChange={set("correo")} autoComplete="email" maxLength={150} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="arr-tel" className={ETIQUETA}>Teléfono</label>
              <input id="arr-tel" type="tel" className={CAMPO} value={form.telefono} onChange={set("telefono")} autoComplete="tel" maxLength={30} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="arr-detalle" className={ETIQUETA}>Plan o detalle de la compra</label>
            <textarea id="arr-detalle" rows={3} className={`${CAMPO} h-auto py-2`} value={form.detalle} onChange={set("detalle")} maxLength={500}
              placeholder="Por ejemplo: Plan 12 clases, pagado con Mercado Pago" />
          </div>

          <p className="text-xs text-foreground/50">
            Usamos estos datos solo para identificar tu compra y hacer el reintegro, según la{" "}
            <Enlace to="/privacidad">Política de privacidad</Enlace>.
          </p>

          {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-lime-400 text-sm font-black uppercase tracking-wider text-black transition-colors hover:bg-lime-300 disabled:opacity-60"
          >
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            Enviar solicitud de arrepentimiento
          </button>
        </form>
      )}

      <p className="text-sm">
        También podés pedirlo <Contacto d={d} />.
      </p>
    </LegalLayout>
  )
}
