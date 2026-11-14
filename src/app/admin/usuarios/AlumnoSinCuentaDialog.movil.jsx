import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, CheckCircle2, UserRound } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/*
 * Alumno sin cuenta: para quien va al gimnasio pero no usa el sistema (por ejemplo, personas mayores).
 * Se registra solo con sus datos personales, sin contraseña ni acceso. El administrador le gestiona
 * membresías y pagos como a cualquier alumno, así no se pierde su registro ni lo que paga.
 * El servidor lo guarda siempre con el perfil Alumno y sin contraseña (el cliente no puede cambiarlo).
 */
const VACIO = { nombrecompleto: "", dni: "", telefono: "", correo: "" }

function Campo({ id, etiqueta, opcional, children }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-black uppercase tracking-widest text-foreground/70">
        {etiqueta} {opcional && <span className="font-medium normal-case tracking-normal text-foreground/50">(opcional)</span>}
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
      <DialogContent className="max-w-md">
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
          <form onSubmit={guardar} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" aria-hidden="true" /> Alumno sin cuenta</DialogTitle>
              <DialogDescription>
                Para quien va al gimnasio pero no usa el sistema. Queda registrado con sus datos, sin contraseña ni acceso, y vos le gestionás las membresías y los pagos.
              </DialogDescription>
            </DialogHeader>

            <Campo id="sc-nombre" etiqueta="Nombre y apellido">
              <Input id="sc-nombre" value={form.nombrecompleto} onChange={cambiar("nombrecompleto")} maxLength={100} autoComplete="off" autoFocus placeholder="Ej: Rosa Gómez" />
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="sc-dni" etiqueta="DNI">
                <Input id="sc-dni" value={form.dni} onChange={cambiar("dni")} inputMode="numeric" maxLength={10} autoComplete="off" placeholder="Sin puntos" />
              </Campo>
              <Campo id="sc-tel" etiqueta="Teléfono" opcional>
                <Input id="sc-tel" value={form.telefono} onChange={cambiar("telefono")} inputMode="tel" maxLength={30} autoComplete="off" placeholder="Ej: 3704 123456" />
              </Campo>
            </div>
            <Campo id="sc-correo" etiqueta="Correo" opcional>
              <Input id="sc-correo" type="email" value={form.correo} onChange={cambiar("correo")} maxLength={100} autoComplete="off" placeholder="Le llegan los comprobantes y puede activar su cuenta" aria-describedby="sc-correo-ayuda" />
              <p id="sc-correo-ayuda" className="text-xs leading-snug text-foreground/60">
                Con este correo la persona puede activar su propia cuenta cuando quiera: en el inicio de sesión toca "Olvidé mi contraseña" y le llega un enlace para crear su contraseña. Conserva sus membresías.
                <strong className="font-bold text-foreground/80"> Poné solo el correo de la persona misma.</strong> Si no usa correo, dejalo vacío.
              </p>
            </Campo>

            {error && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">{error}</p>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => cerrar(false)} disabled={enviando}>Cancelar</Button>
              <Button type="submit" disabled={enviando} className="bg-lime-400 font-black uppercase tracking-wide text-black hover:bg-lime-300">
                {enviando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Registrando...</> : "Registrar alumno"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
