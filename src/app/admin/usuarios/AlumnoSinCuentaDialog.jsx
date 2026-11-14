import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

/*
 * Alumno sin cuenta: para quien va al gimnasio pero no usa el sistema (por ejemplo, personas mayores).
 * Se registra solo con sus datos personales, sin contraseña ni acceso. El administrador le gestiona
 * membresías y pagos como a cualquier alumno, así no se pierde su registro ni lo que paga.
 * El servidor lo guarda siempre con el perfil Alumno y sin contraseña (el cliente no puede cambiarlo).
 */
const VACIO = { nombrecompleto: "", dni: "", telefono: "", correo: "" }

const estiloInput = { width: "100%", boxSizing: "border-box", height: 46, padding: "0px 14px", borderRadius: 10, border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo" }

function Campo({ id, etiqueta, opcional, obligatorio, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} style={{ font: "700 13px Archivo", color: "var(--foreground)" }}>
        {etiqueta}{obligatorio && " *"} {opcional && <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}>(opcional)</span>}
      </label>
      {children}
    </div>
  )
}

export default function AlumnoSinCuentaDialog({ open, onOpenChange, onCreado }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(VACIO)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")
  const [creado, setCreado] = useState(null)

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  const cerrar = (abierto) => {
    onOpenChange(abierto)
    if (!abierto) { setForm(VACIO); setError(""); setCreado(null) }
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError("")
    if (!form.nombrecompleto.trim()) return setError("Escribí el nombre y apellido.")
    if (!form.dni.trim()) return setError("Escribí el DNI.")
    setEnviando(true)
    try {
      const res = await fetch("/api/vv1/usuarios/sin-cuenta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) return setError(json.message || "No se pudo registrar al alumno. Probá de nuevo.")
      setCreado(json.data)
      onCreado?.(json.data)
    } catch {
      setError("No hay conexión con el servidor. Probá de nuevo.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      <DialogContent className="max-w-md" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
        {creado ? (
          <div className="space-y-4 py-2 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-lime-600 dark:text-lime-400" aria-hidden="true" />
            <DialogHeader className="text-center sm:text-center">
              <DialogTitle>Alumno registrado</DialogTitle>
              <DialogDescription>
                {creado.nombrecompleto} ya figura en la lista de usuarios como alumno sin cuenta. Ahora le podés cargar su membresía.{creado.correo ? " Si más adelante quiere usar el sistema, puede activar su cuenta con su correo y te vamos a avisar." : ""}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={() => { cerrar(false); navigate(`/admin/usuarios/abonos/carga-masiva?usuario=${creado.idUsuario}`) }}
                className="bg-lime-400 font-black uppercase tracking-wide text-black hover:bg-lime-300">
                Cargar membresía
              </Button>
              <Button variant="outline" onClick={() => cerrar(false)}>Listo</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={guardar} style={{ display: "flex", flexDirection: "column", gap: 16 }} noValidate>
            <DialogHeader>
              <DialogTitle className="bv-admin-titulo" style={{ font: "800 20px Archivo", margin: 0 }}>Alumno sin cuenta</DialogTitle>
              <DialogDescription style={{ font: "500 14px / 1.5 Archivo", color: "var(--muted-foreground)" }}>
                Para quien entrena en el box pero no usa la app. Queda registrado sin contraseña y vos gestionás las membresías y los pagos.
              </DialogDescription>
            </DialogHeader>

            <Campo id="sc-nombre" etiqueta="Nombre y apellido" obligatorio>
              <input id="sc-nombre" value={form.nombrecompleto} onChange={cambiar("nombrecompleto")} maxLength={100} autoComplete="off" autoFocus placeholder="Ej: Rosa Gómez" style={estiloInput} />
            </Campo>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
              <Campo id="sc-dni" etiqueta="DNI" obligatorio>
                <input id="sc-dni" value={form.dni} onChange={cambiar("dni")} inputMode="numeric" maxLength={10} autoComplete="off" placeholder="Sin puntos" style={estiloInput} />
              </Campo>
              <Campo id="sc-tel" etiqueta="Teléfono" opcional>
                <input id="sc-tel" value={form.telefono} onChange={cambiar("telefono")} inputMode="tel" maxLength={30} autoComplete="off" placeholder="Ej: 3704 123456" style={estiloInput} />
              </Campo>
            </div>
            <Campo id="sc-correo" etiqueta="Correo" opcional>
              <input id="sc-correo" type="email" value={form.correo} onChange={cambiar("correo")} maxLength={100} autoComplete="off" placeholder="correo@ejemplo.com" aria-describedby="sc-correo-ayuda" style={estiloInput} />
              <p id="sc-correo-ayuda" style={{ margin: 0, font: "500 12px / 1.5 Archivo", color: "var(--muted-foreground)" }}>
                Le llegan los comprobantes. Si algún día quiere usar la app, toca "Olvidé mi contraseña" con este correo y conserva sus membresías. Poné solo el correo de la persona.
              </p>
            </Campo>

            {error && <p role="alert" style={{ margin: 0, borderRadius: 10, border: "1px solid var(--sh-danger-line)", background: "var(--sh-danger-bg)", padding: "8px 12px", font: "600 13px Archivo", color: "var(--sh-danger)" }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" onClick={() => cerrar(false)} disabled={enviando}
                style={{ height: 40, padding: "0px 16px", borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", cursor: "pointer" }}>
                Cancelar
              </button>
              <button type="submit" disabled={enviando}
                style={{ height: 40, padding: "0px 18px", borderRadius: 10, border: "none", background: "var(--primary)", color: "var(--primary-foreground)", font: "800 13px Archivo", letterSpacing: "0.04em", textTransform: "uppercase", cursor: enviando ? "not-allowed" : "pointer", opacity: enviando ? 0.6 : 1 }}>
                {enviando ? "Registrando…" : "Registrar alumno"}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
