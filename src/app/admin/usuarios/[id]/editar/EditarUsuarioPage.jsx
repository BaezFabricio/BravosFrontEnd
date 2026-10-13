import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { BotonVolver, useVolver } from "@/components/BotonVolver"
import {
  Loader2,
  Check,
  User,
  Mail,
  Phone,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Info,
  Sparkles,
  Power,
} from "lucide-react"
import { getUsuarioById, logoutUsuario } from "@/api"
import { AdminFormSkeleton } from "@/components/AdminPageSkeleton"
import { toast } from '@/lib/notificar'

const emptyForm = {
  nombre: "",
  dni: "",
  email: "",
  telefono: "",
  idPerfil: "",
  estado: "activo",
  avatarUrl: "",
}

const inputCls = (error) =>
  `h-12 w-full rounded-xl border ${error ? "border-red-600/50 dark:border-red-500/50" : "border-border"} bg-background/60 pl-10 pr-3.5 text-base font-semibold text-foreground placeholder:font-normal placeholder:text-foreground/35 outline-none transition-colors focus:border-lime-500 focus:ring-2 focus:ring-lime-400/25 sm:text-sm`

const etiqueta = "text-[11px] font-black uppercase tracking-widest text-foreground/55"

const Field = ({ id, label, icon: Icon, error, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className={`flex items-center gap-1.5 ${etiqueta}`}>{label}</label>
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" aria-hidden="true" />}
      {children}
    </div>
    {error && (
      <p className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400">
        <AlertCircle className="h-3 w-3" /> {error}
      </p>
    )}
  </div>
)

// Encabezado de cada bloque del formulario
const Bloque = ({ icon: Icon, titulo, nota, children }) => (
  <section className="overflow-hidden rounded-2xl border border-border bg-card">
    <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
      <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lime-400/15 text-lime-700 dark:text-lime-400">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        {titulo}
      </h2>
      {nota && <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">{nota}</span>}
    </div>
    <div className="space-y-4 p-4">{children}</div>
  </section>
)

const getIniciales = (name) => {
  if (!name) return "??"
  const parts = name.trim().split(" ")
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const esMiCuenta = (id) => {
  try { return Number(JSON.parse(localStorage.getItem("usuario") || "{}").idUsuario) === Number(id) } catch { return false }
}

export default function EditarUsuarioPage() {
  const { id } = useParams()
  // Volver / Cancelar / después de guardar: a la pantalla anterior, o al detalle del usuario si se entró directo
  const volver = useVolver(`/admin/usuarios/${id}`)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [original, setOriginal] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [perfilesBD, setPerfilesBD] = useState([])
  // En la propia cuenta se puede cambiar el perfil (a uno igual o menor) pero no el estado
  const propia = esMiCuenta(id)

  // Al corregir un campo se borra su error
  const cambiar = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }
  const set = (field) => (e) => cambiar(field, e.target.value)

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        setIsLoading(true)

        const resPerfiles = await fetch("/api/vv1/perfiles")
        const datosPerfiles = await resPerfiles.json()
        const perfiles = datosPerfiles.success && Array.isArray(datosPerfiles.data) ? datosPerfiles.data : []
        setPerfilesBD(perfiles)

        const usuarioReal = await getUsuarioById(id)
        // Si el servidor no manda el id del perfil, se busca por el nombre
        const idPerfil = usuarioReal.idPerfil
          || perfiles.find((p) => p.nombrePerfil?.trim().toLowerCase() === String(usuarioReal.perfil || "").trim().toLowerCase())?.idPerfil
        const datos = {
          nombre: usuarioReal.nombre || "",
          dni: usuarioReal.dni || "",
          email: usuarioReal.email || "",
          telefono: usuarioReal.telefono || "",
          idPerfil: String(idPerfil || ""),
          estado: usuarioReal.estado || "activo",
          avatarUrl: usuarioReal.avatarUrl || "",
        }
        setFormData(datos)
        setOriginal(datos)
      } catch {
        toast.error("No se pudo cargar la información del usuario.")
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargarTodo()
  }, [id])

  // Mismas reglas que controla el servidor
  const validateForm = () => {
    const e = {}
    const nombre = formData.nombre.trim()
    if (nombre.length < 2) e.nombre = "Escribí el nombre completo"
    if (!/^\d{6,10}$/.test(formData.dni.trim())) e.dni = "Entre 6 y 10 números, sin puntos"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) e.email = "El correo no es válido"
    if (!formData.telefono.trim()) e.telefono = "El teléfono es requerido"
    else if (!/^[\d\s+()-]{6,30}$/.test(formData.telefono.trim())) e.telefono = "Solo números, espacios, + y guiones"
    if (!formData.idPerfil) e.idPerfil = "Elegí un perfil"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!validateForm()) return
    const cambiaMiPerfil = propia && formData.idPerfil !== original.idPerfil
    if (cambiaMiPerfil && !window.confirm("Vas a cambiar tu propio perfil. Al guardar se cierra tu sesión y vas a entrar con los permisos del perfil nuevo. ¿Seguimos?")) return
    setIsSaving(true)
    try {
      const email = formData.email.trim().toLowerCase()
      const payload = {
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim(),
        email,
        telefono: formData.telefono.trim(),
        username: email,
        idPerfil: parseInt(formData.idPerfil),
        // El estado de la propia cuenta no se manda (el servidor igual lo rechaza)
        ...(propia ? {} : { estado: formData.estado }),
      }
      const res = await fetch(`/api/vv1/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const resultado = await res.json()
      if (!res.ok) throw new Error(resultado.message || "Error al actualizar")
      // Si cambié mi propio perfil, el servidor ya cerró mi sesión: vuelvo a entrar
      if (propia && resultado.data?.sesionesCerradas) {
        toast.success("Perfil cambiado. Volvé a iniciar sesión.")
        logoutUsuario()
        return
      }
      toast.success("Cambios guardados", resultado.data?.sesionesCerradas
        ? { description: "Se cerró la sesión del usuario para que el cambio valga en el momento." }
        : undefined)
      volver()
    } catch (err) {
      toast.error("No se guardaron los cambios", { description: err.message })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <AdminFormSkeleton />
  }

  const perfilSeleccionado = perfilesBD.find((p) => String(p.idPerfil) === formData.idPerfil)
  const activo = formData.estado === "activo"
  const cambioAcceso = formData.idPerfil !== original.idPerfil || (formData.estado === "inactivo" && original.estado !== "inactivo")

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 pb-24 lg:pb-0">

      {/* ENCABEZADO */}
      <div className="flex items-start justify-between gap-3">
        <BotonVolver a={`/admin/usuarios/${id}`} texto="Volver" />
        <div className="text-right">
          <h1 className="text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl">Editar usuario</h1>
          <p className="text-xs text-foreground/55">Datos personales, perfil y acceso</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* VISTA PREVIA */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime-400 ring-2 ring-lime-400/40 ring-offset-2 ring-offset-card">
                {formData.avatarUrl
                  ? <img src={formData.avatarUrl} alt="" className="h-full w-full object-cover" />
                  : <span className="text-xl font-black text-black">{getIniciales(formData.nombre)}</span>}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-lg font-black leading-tight text-foreground">{formData.nombre || "Sin nombre"}</p>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${activo
                    ? "border-lime-400/30 bg-lime-400/10 text-lime-700 dark:text-lime-400"
                    : "border-border bg-foreground/5 text-foreground/55"}`}>
                    {activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-foreground/55">{formData.email || "Sin correo"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Resumen
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Vista previa</p>
            </div>
            <dl className="grid grid-cols-3 gap-2">
              {[
                { label: "DNI", value: formData.dni, icon: CreditCard },
                { label: "Tel", value: formData.telefono, icon: Phone },
                { label: "Perfil", value: perfilSeleccionado?.nombrePerfil, icon: ShieldCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="min-w-0 rounded-xl border border-border bg-background/50 px-2.5 py-2">
                  <dt className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-foreground/45">
                    <Icon className="h-3 w-3" aria-hidden="true" /> {label}
                  </dt>
                  <dd className="mt-0.5 truncate text-sm font-bold text-foreground">{value || "—"}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="space-y-4 lg:col-span-2">

          <Bloque icon={User} titulo="Datos personales" nota="Obligatorio">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="nombre" label="Nombre completo" icon={User} error={errors.nombre}>
                <input id="nombre" type="text" autoComplete="off" maxLength={100} value={formData.nombre} onChange={set("nombre")}
                  placeholder="Ej: Juan Pérez" className={inputCls(errors.nombre)} />
              </Field>
              <Field id="dni" label="DNI" icon={CreditCard} error={errors.dni}>
                <input id="dni" type="text" inputMode="numeric" maxLength={10} value={formData.dni}
                  onChange={(e) => cambiar("dni", e.target.value.replace(/\D/g, ""))}
                  placeholder="Ej: 30123456" className={inputCls(errors.dni)} />
              </Field>
              <Field id="email" label="Correo electrónico" icon={Mail} error={errors.email}>
                <input id="email" type="email" autoComplete="off" maxLength={100} value={formData.email} onChange={set("email")}
                  placeholder="correo@ejemplo.com" className={inputCls(errors.email)} />
              </Field>
              <Field id="telefono" label="Teléfono" icon={Phone} error={errors.telefono}>
                <input id="telefono" type="tel" inputMode="tel" maxLength={30} value={formData.telefono} onChange={set("telefono")}
                  placeholder="Ej: 3704123456" className={inputCls(errors.telefono)} />
              </Field>
            </div>
            {formData.email.trim().toLowerCase() !== original.email.trim().toLowerCase() && (
              <p className="flex items-start gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-2.5 text-xs text-yellow-800 dark:text-yellow-300">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                El correo también es el usuario para iniciar sesión: desde ahora va a entrar con el nuevo.
              </p>
            )}
          </Bloque>

          <Bloque icon={ShieldCheck} titulo="Acceso y permisos" nota="Seguridad">
            <>
                <div className="space-y-1.5">
                  <p className={etiqueta} id="etiqueta-perfil">Perfil de acceso</p>
                  {/* Los perfiles salen de la base (los crea el admin con sus permisos), no son fijos */}
                  {perfilesBD.length === 0 ? (
                    <p className="text-sm text-foreground/55">No se pudieron cargar los perfiles.</p>
                  ) : (
                    <div role="radiogroup" aria-labelledby="etiqueta-perfil" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {perfilesBD.map((p) => {
                        const elegido = formData.idPerfil === String(p.idPerfil)
                        return (
                          <button key={p.idPerfil} type="button" role="radio" aria-checked={elegido}
                            onClick={() => cambiar("idPerfil", String(p.idPerfil))}
                            className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3 text-left text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                              elegido
                                ? "border-lime-500 bg-lime-400/15 text-foreground"
                                : "border-border bg-background/50 text-foreground/65 hover:border-foreground/30 hover:text-foreground"
                            }`}>
                            <span className="min-w-0 truncate">{p.nombrePerfil}</span>
                            {elegido && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-400 text-black">
                                <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {errors.idPerfil && (
                    <p className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400"><AlertCircle className="h-3 w-3" /> {errors.idPerfil}</p>
                  )}
                </div>

                {/* El estado de la propia cuenta no se toca: desactivarse dejaría a la persona afuera */}
                {!propia && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className={etiqueta} id="etiqueta-estado">Estado de la cuenta</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${activo ? "text-lime-700 dark:text-lime-400" : "text-foreground/50"}`}>
                      {activo ? "Puede entrar" : "No puede entrar"}
                    </span>
                  </div>
                  <div role="radiogroup" aria-labelledby="etiqueta-estado" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background/50 p-1">
                    {[
                      { valor: "activo", texto: "Activo" },
                      { valor: "inactivo", texto: "Inactivo" },
                    ].map(({ valor, texto }) => {
                      const elegido = formData.estado === valor
                      return (
                        <button key={valor} type="button" role="radio" aria-checked={elegido} onClick={() => cambiar("estado", valor)}
                          className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg text-sm font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                            elegido
                              ? valor === "activo" ? "bg-lime-400 text-black" : "bg-foreground/80 text-background"
                              : "text-foreground/55 hover:text-foreground"
                          }`}>
                          <Power className="h-3.5 w-3.5" aria-hidden="true" /> {texto}
                        </button>
                      )
                    })}
                  </div>
                </div>
                )}

                {propia ? (
                  <p className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${cambioAcceso
                    ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-800 dark:text-yellow-300"
                    : "border-border bg-background/50 text-foreground/60"}`}>
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {cambioAcceso
                      ? "Es tu cuenta: al guardar se cierra tu sesión y volvés a entrar con los permisos del perfil nuevo."
                      : "Es tu cuenta: podés pasarte a un perfil igual o con menos permisos que el tuyo, nunca a uno con más. El estado lo cambia otro administrador."}
                  </p>
                ) : (
                  <p className="flex items-start gap-2 text-xs text-foreground/55">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {cambioAcceso
                      ? "Al guardar se cierra la sesión que el usuario tenga abierta, para que el cambio valga en el momento."
                      : "Los permisos los define el perfil. Los cambios se aplican al guardar."}
                  </p>
                )}
              </>
          </Bloque>

          {/* Botones: en el celular quedan fijos arriba de la barra de navegación, con lugar a la derecha para la mascota del chat */}
          <div className="fixed inset-x-0 bottom-[64px] z-20 border-t border-border bg-background/95 py-3 pl-4 pr-[76px] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
            <div className="flex gap-2 lg:justify-end">
              <button type="button" onClick={volver} disabled={isSaving}
                className="min-h-[48px] rounded-xl border border-border px-5 text-xs font-black uppercase tracking-widest text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={isSaving}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-lime-500/20 transition-colors hover:bg-lime-300 disabled:opacity-50 lg:flex-none">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={3} />}
                {isSaving ? "Guardando…" : <>Guardar<span className="hidden sm:inline">&nbsp;cambios</span></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
