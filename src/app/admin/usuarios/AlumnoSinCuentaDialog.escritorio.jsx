import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { CheckCircle2, Info } from "lucide-react"
import PanelLateral, { Campo, Seccion, Divisor, estiloInput, botonSecundario, botonPrincipal } from "@/components/PanelLateral"

/*
 * Alumno sin cuenta: para quien va al gimnasio pero no usa el sistema (por ejemplo, personas mayores).
 * Se registra solo con sus datos personales, sin contraseña ni acceso. El administrador le gestiona
 * membresías y pagos como a cualquier alumno, así no se pierde su registro ni lo que paga.
 * El servidor lo guarda siempre con el perfil Alumno y sin contraseña (el cliente no puede cambiarlo).
 * Se abre como panel lateral sobre la lista de usuarios.
 */
const VACIO = { nombrecompleto: "", dni: "", telefono: "", correo: "" }

export default function AlumnoSinCuentaDialog({ open, onOpenChange, onCreado }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState("")
  const [creado, setCreado] = useState(null)

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }))
    setErrores((x) => (x[campo] ? { ...x, [campo]: undefined } : x))
  }

  const cerrar = (abierto) => {
    onOpenChange(abierto)
    if (!abierto) { setForm(VACIO); setErrores({}); setError(""); setCreado(null) }
  }

  const guardar = async (e) => {
    e?.preventDefault()
    setError("")
    const nuevos = {}
    if (form.nombrecompleto.trim().length < 2) nuevos.nombrecompleto = "Escribí el nombre y apellido."
    if (!/^\d{6,10}$/.test(form.dni.trim())) nuevos.dni = "Entre 6 y 10 números, sin puntos."
    if (form.correo.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) nuevos.correo = "El correo no es válido."
    setErrores(nuevos)
    if (Object.keys(nuevos).length) return
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

  const pie = creado ? (
    <>
      <button type="button" onClick={() => cerrar(false)} style={botonSecundario}>Listo</button>
      <button type="button" onClick={() => { cerrar(false); navigate(`/admin/usuarios/abonos/carga-masiva?usuario=${creado.idUsuario}`) }} style={botonPrincipal(false)}>
        Cargar membresía
      </button>
    </>
  ) : (
    <>
      <button type="button" onClick={() => cerrar(false)} disabled={enviando} style={botonSecundario}>Cancelar</button>
      <button type="submit" form="form-alumno-sin-cuenta" disabled={enviando} style={botonPrincipal(enviando)}>
        {enviando ? "Registrando…" : "Registrar alumno"}
      </button>
    </>
  )

  return (
    <PanelLateral
      open={open}
      onOpenChange={cerrar}
      titulo={creado ? "Alumno registrado" : "Alumno sin cuenta"}
      descripcion={creado ? undefined : "Entrena en el box pero no usa la app. Queda sin contraseña y vos gestionás sus membresías y pagos."}
      pie={pie}
    >
      {creado ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "32px 0", textAlign: "center" }}>
          <CheckCircle2 size={48} className="text-lime-600 dark:text-lime-400" aria-hidden="true" />
          <p style={{ margin: 0, font: "500 15px/1.55 Archivo, sans-serif", color: "var(--muted-foreground)", maxWidth: 360 }}>
            <strong style={{ color: "var(--foreground)" }}>{creado.nombrecompleto}</strong> ya figura en la lista de usuarios como alumno sin cuenta. Ahora le podés cargar su membresía.
            {creado.correo ? " Si más adelante quiere usar el sistema, puede activar su cuenta con su correo y te vamos a avisar." : ""}
          </p>
        </div>
      ) : (
        <form id="form-alumno-sin-cuenta" onSubmit={guardar} noValidate>
          <Seccion titulo="Datos personales">
            <Campo id="sc-nombre" etiqueta="Nombre y apellido" error={errores.nombrecompleto}>
              <input id="sc-nombre" value={form.nombrecompleto} onChange={cambiar("nombrecompleto")} maxLength={100} autoComplete="off" autoFocus placeholder="Ej: Rosa Gómez" style={estiloInput(errores.nombrecompleto)} />
            </Campo>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", alignItems: "start" }}>
              <Campo id="sc-dni" etiqueta="DNI" ayuda="Con el DNI hace check-in en recepción." error={errores.dni}>
                <input id="sc-dni" value={form.dni} onChange={cambiar("dni")} inputMode="numeric" maxLength={10} autoComplete="off" placeholder="Sin puntos" style={estiloInput(errores.dni)} />
              </Campo>
              <Campo id="sc-tel" etiqueta="Teléfono" opcional ayuda="Para avisos por WhatsApp.">
                <input id="sc-tel" value={form.telefono} onChange={cambiar("telefono")} inputMode="tel" maxLength={30} autoComplete="off" placeholder="3704 123456" style={estiloInput(false)} />
              </Campo>
            </div>
          </Seccion>

          <Divisor />

          <Seccion titulo="Comprobantes por correo">
            <Campo id="sc-correo" etiqueta="Correo" opcional ayuda="Le llegan los comprobantes de pago. Solo el correo de la persona." error={errores.correo}>
              <input id="sc-correo" type="email" value={form.correo} onChange={cambiar("correo")} maxLength={100} autoComplete="off" placeholder="nombre@correo.com" style={estiloInput(errores.correo)} />
            </Campo>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", borderRadius: 10, border: "1px solid var(--border)", font: "500 13px/1.5 Archivo, sans-serif" }}>
              <Info size={16} aria-hidden="true" style={{ flex: "none", marginTop: 2, color: "var(--muted-foreground)" }} />
              <span>Si algún día quiere usar la app, toca «Olvidé mi contraseña» con este correo y conserva sus membresías.</span>
            </div>
          </Seccion>

          {error && (
            <p role="alert" style={{ margin: "20px 0 0", borderRadius: 10, border: "1px solid var(--sh-danger-line)", background: "var(--sh-danger-bg)", padding: "10px 14px", font: "600 13px Archivo, sans-serif", color: "var(--sh-danger)" }}>{error}</p>
          )}
        </form>
      )}
    </PanelLateral>
  )
}
