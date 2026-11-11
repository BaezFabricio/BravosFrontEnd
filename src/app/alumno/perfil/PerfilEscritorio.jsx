import { useEffect, useState } from "react"
import apiClient from "@/api"
import { Boton, Campo, ErrorBanner, Esqueleto, HeroCard, Pantalla, Tarjeta } from "@/components/bx"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import FotoAmpliable from "@/components/FotoAmpliable"
import { panelesPermitidos } from "@/lib/paneles"
import { useMiPlan } from "@/lib/miPlan"
import { toast } from "@/lib/notificar"
import { fechaCorta } from "@/lib/fechasBx"

/*
 * Mi perfil en escritorio (handoff, pantalla 09): foto y estado de la membresía, datos personales y seguridad.
 * El alumno puede cambiar su nombre y su teléfono; el correo y el DNI los cambia el box (el servidor no acepta
 * que una persona los cambie sola: son sus datos de identidad).
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/vv1"

const CHIP_HERO = {
  ok: "border-[#3d5a10] bg-[#16220a] text-bx-lima",
  warn: "border-[#5a4a12] bg-[#2a230a] text-[#e6c200]",
  err: "border-[#6b2a24] bg-[#2a1210] text-[#ffb4aa]",
  neutral: "border-[#4a4d42] bg-transparent text-[#c9ccbe]",
}

// Busca un dato en cualquier parte de la respuesta del servidor (los nombres varían entre versiones)
function buscarValor(obj, nombres) {
  const minus = nombres.map((n) => n.toLowerCase())
  let hallado
  const visitar = (o) => {
    if (hallado !== undefined || o == null || typeof o !== "object") return
    for (const k of Object.keys(o)) { if (minus.includes(k.toLowerCase())) { hallado = o[k]; return } }
    for (const k of Object.keys(o)) { visitar(o[k]); if (hallado !== undefined) return }
  }
  visitar(obj)
  return hallado
}

const iniciales = (nombre) => {
  const partes = (nombre || "").trim().split(" ").filter(Boolean)
  return partes.length > 1 ? (partes[0][0] + partes[1][0]).toUpperCase() : (partes[0] || "BR").substring(0, 2).toUpperCase()
}

// "2026-12-10" → "10/12/2026"
const ddmmaaaa = (ymd) => { const [y, m, d] = String(ymd || "").slice(0, 10).split("-"); return y && m && d ? `${d}/${m}/${y}` : "—" }

// Chips de la membresía (solo para quien es alumno): salen del mismo dato que el resumen, /pagos/mi-plan
function ChipsMembresia() {
  const { data } = useMiPlan()
  if (!data) return null
  const { vigente, porVencer, planes, proximoVencimiento, ultimoPlan } = data
  if (!vigente) {
    return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${CHIP_HERO.err}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{ultimoPlan ? "Membresía vencida" : "Sin membresía"}</span>
  }
  const nombres = [...new Set(planes.map((p) => p.nombrePlan))].join(" + ")
  return (
    <>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${porVencer ? CHIP_HERO.warn : CHIP_HERO.ok}`}>
        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{porVencer ? "Membresía por vencer" : "Membresía activa"} · {nombres}
      </span>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${porVencer ? CHIP_HERO.warn : CHIP_HERO.ok}`}>
        {!porVencer && <Ico d={IC.check} size={12} sw={2.6} />}{porVencer ? "Vence" : "Al día · Próximo vencimiento"} {ddmmaaaa(proximoVencimiento)}
      </span>
    </>
  )
}

export default function PerfilEscritorio() {
  const esAlumno = panelesPermitidos().alumno
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(false)
  const [intento, setIntento] = useState(0)
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem("avatarUrl") || "")
  const [guardandoFoto, setGuardandoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState("")
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({ nombre: "", tel: "" })
  const [tocado, setTocado] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [pwAbierto, setPwAbierto] = useState(false)
  const [pw, setPw] = useState({ actual: "", nueva: "", rep: "" })
  const [pwTocado, setPwTocado] = useState({})
  const [pwGuardando, setPwGuardando] = useState(false)

  useEffect(() => {
    const alCambiarFoto = (e) => setAvatarUrl(e.detail || "")
    window.addEventListener("avatar-updated", alCambiarFoto)
    return () => window.removeEventListener("avatar-updated", alCambiarFoto)
  }, [])

  useEffect(() => {
    let vigente = true
    apiClient.get("/auth/me")
      .then((res) => {
        if (!vigente) return
        const data = res.data?.data || res.data
        const u = data?.usuario || data
        if (!u) { setErrorCarga(true); return }
        setErrorCarga(false)
        setUsuario({
          idUsuario: u.idUsuario || null,
          nombre: u.nombrecompleto || u.nombre || u.displayName || "",
          correo: u.correo || u.email || "",
          dni: buscarValor(u, ["dni", "documento", "nroDocumento", "numeroDocumento"]) || "",
          tel: buscarValor(u, ["telefono", "phone", "celular", "mobile", "cel"]) || "",
          perfil: String(u.perfil || u.nombrePerfil || u.rol || "alumno"),
          estado: String(u.estado || "").toLowerCase(),
          desde: buscarValor(u, ["fecha_registro", "fechaRegistro", "miembroDesde", "createdAt", "created_at"]) || "",
        })
        if (u.avatarUrl) { setAvatarUrl(u.avatarUrl); localStorage.setItem("avatarUrl", u.avatarUrl) }
      })
      .catch(() => { if (vigente) setErrorCarga(true) })
      .finally(() => { if (vigente) setCargando(false) })
    return () => { vigente = false }
  }, [intento])

  const cambiarFoto = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const lector = new FileReader()
    lector.onload = () => {
      const valor = lector.result
      const guardado = JSON.parse(localStorage.getItem("usuario") || "{}")
      setErrorFoto("")
      if (!guardado?.idUsuario) { setErrorFoto("No pudimos identificar tu usuario para guardar la foto."); return }
      setGuardandoFoto(true)
      fetch(`${API_BASE_URL}/usuarios/${guardado.idUsuario}/avatar`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarData: valor }),
      })
        .then(async (r) => {
          const d = await r.json()
          if (!r.ok) throw new Error(d?.message || "No se pudo guardar la foto")
          const url = d?.data?.avatarUrl || valor
          setAvatarUrl(url)
          localStorage.setItem("avatarUrl", url)
          localStorage.setItem("usuario", JSON.stringify({ ...guardado, avatarUrl: url }))
          window.dispatchEvent(new CustomEvent("avatar-updated", { detail: url }))
          toast.success("Actualizamos tu foto de perfil.", { guardar: false })
        })
        .catch((err) => setErrorFoto(err.message || "No se pudo guardar la foto."))
        .finally(() => setGuardandoFoto(false))
    }
    lector.readAsDataURL(file)
  }

  /* ───── Datos personales ───── */
  const errores = (f) => ({
    nombre: f.nombre.trim().length < 2 ? "Ingresá tu nombre." : f.nombre.trim().length > 100 ? "El nombre es demasiado largo." : "",
    tel: !f.tel.trim()
      ? (usuario?.tel ? "Ingresá tu teléfono: no se puede dejar vacío." : "")
      : !/^[\d\s+()-]{6,30}$/.test(f.tel.trim()) || f.tel.replace(/\D/g, "").length < 8
        ? "Revisá el número: incluí la característica."
        : "",
  })
  const errs = errores(form)
  const mostrar = (k) => (tocado[k] ? errs[k] : "")

  const abrirEdicion = () => { setForm({ nombre: usuario.nombre, tel: String(usuario.tel || "") }); setTocado({}); setEditando(true) }

  const guardar = async (ev) => {
    ev.preventDefault()
    if (guardando) return
    setTocado({ nombre: true, tel: true })
    const primero = ["nombre", "tel"].find((k) => errs[k])
    if (primero) { document.getElementById(`f-${primero}`)?.focus(); return }
    setGuardando(true)
    try {
      // Solo nombre y teléfono: lo demás no lo puede cambiar el alumno (y el servidor tampoco lo aceptaría)
      await apiClient.put(`/usuarios/${usuario.idUsuario}`, { nombrecompleto: form.nombre.trim(), telefono: form.tel.trim() })
      setUsuario((u) => ({ ...u, nombre: form.nombre.trim(), tel: form.tel.trim() }))
      const guardado = JSON.parse(localStorage.getItem("usuario") || "{}")
      localStorage.setItem("usuario", JSON.stringify({ ...guardado, nombrecompleto: form.nombre.trim() }))
      window.dispatchEvent(new CustomEvent("usuario-actualizado"))
      setEditando(false)
      toast.success("Guardamos tus datos.", { guardar: false })
    } catch (err) {
      toast.error("No se pudieron guardar tus datos", { description: err?.response?.data?.message || "Probá de nuevo en un momento." })
    } finally {
      setGuardando(false)
    }
  }

  /* ───── Seguridad ───── */
  const pwErrores = {
    actual: !pw.actual ? "Ingresá tu contraseña actual." : "",
    nueva: pw.nueva.length < 8 || !/[A-Z]/.test(pw.nueva) || !/[a-z]/.test(pw.nueva) || !/[0-9]/.test(pw.nueva)
      ? "Usá al menos 8 caracteres, con una mayúscula, una minúscula y un número." : "",
    rep: !pw.rep || pw.rep !== pw.nueva ? "Las contraseñas no coinciden." : "",
  }
  const pwMostrar = (k) => (pwTocado[k] ? pwErrores[k] : "")
  const cerrarPw = () => { setPwAbierto(false); setPw({ actual: "", nueva: "", rep: "" }); setPwTocado({}) }

  const guardarPw = async (ev) => {
    ev.preventDefault()
    if (pwGuardando) return
    setPwTocado({ actual: true, nueva: true, rep: true })
    const primero = ["actual", "nueva", "rep"].find((k) => pwErrores[k])
    if (primero) { document.getElementById(`f-${primero}`)?.focus(); return }
    setPwGuardando(true)
    try {
      const r = await fetch("/api/vv1/auth/cambiar-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contrasenaActual: pw.actual, contrasenaNueva: pw.nueva }),
      })
      const d = await r.json()
      if (!r.ok) { toast.error(d.message || "No se pudo cambiar la contraseña"); return }
      toast.success("Contraseña cambiada", { description: "Se cerraron las sesiones abiertas en otros dispositivos." })
      cerrarPw()
    } catch {
      toast.error("Error al cambiar la contraseña")
    } finally {
      setPwGuardando(false)
    }
  }

  if (cargando) {
    return <Pantalla className="gap-5"><div aria-busy="true" aria-label="Cargando perfil" className="flex flex-col gap-5"><Esqueleto alto={180} className="rounded-[1.25rem]" /><Esqueleto alto={200} className="rounded-2xl" /></div></Pantalla>
  }
  if (errorCarga || !usuario) {
    return <Pantalla className="gap-5"><ErrorBanner titulo="No pudimos cargar tu perfil" texto="Revisá tu conexión e intentá de nuevo." onReintentar={() => { setCargando(true); setIntento((n) => n + 1) }} /></Pantalla>
  }

  const sinDni = !String(usuario.dni).trim()
  const sinTel = !String(usuario.tel).trim()
  const incompleto = (sinDni || sinTel) && !editando
  const perfilTxt = usuario.perfil.charAt(0).toUpperCase() + usuario.perfil.slice(1).toLowerCase()
  const datos = [
    ["NOMBRE", usuario.nombre],
    ["DNI", String(usuario.dni)],
    ["TELÉFONO", String(usuario.tel)],
    ["MIEMBRO DESDE", usuario.desde ? fechaCorta(usuario.desde) : ""],
  ]

  return (
    <Pantalla className="gap-5">
      <HeroCard aria-labelledby="t-name" logo={false} className="!p-[clamp(1.25rem,3vw,2rem)]">
        <img src="/bravos-logo.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[15.3125rem] w-[47.5rem] max-w-none -translate-y-1/2 -rotate-6 opacity-[0.05] [filter:grayscale(1)_brightness(1.4)]" />
        <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
          <div className="relative shrink-0">
            <FotoAmpliable
              src={avatarUrl}
              alt={usuario.nombre}
              className="bx-num grid h-[6.5rem] w-[6.5rem] select-none place-items-center overflow-hidden rounded-full border-[0.1875rem] border-bx-lima bg-[#2a2c24] text-4xl text-bx-lima"
            >
              {iniciales(usuario.nombre)}
            </FotoAmpliable>
            <label title="Cambiar foto" className="absolute -bottom-1 -right-1 grid h-11 w-11 cursor-pointer place-items-center rounded-full border-[0.1875rem] border-bx-hero bg-[#ecefe4] text-bx-negro focus-within:outline focus-within:outline-[0.1875rem] focus-within:outline-bx-lima">
              <input type="file" accept="image/*" onChange={cambiarFoto} aria-label="Cambiar foto de perfil" className="absolute h-px w-px opacity-0" />
              {guardandoFoto ? <span className="text-[0.625rem] font-bold">…</span> : <Ico d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={18} sw={2} />}
            </label>
          </div>
          <div className="flex min-w-[15rem] flex-1 flex-col gap-2">
            <h2 id="t-name" className="bx-num m-0 text-[clamp(2rem,3.4vw,2.75rem)] uppercase leading-none">{usuario.nombre}</h2>
            <div className="text-[0.9375rem] text-[#b9bcae]">{usuario.correo}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {esAlumno && <ChipsMembresia />}
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${CHIP_HERO.neutral}`}>{perfilTxt}</span>
            </div>
          </div>
        </div>
      </HeroCard>

      {errorFoto && <p role="alert" className="m-0 rounded-xl border border-bx-err-line bg-bx-err-bg px-4 py-3 text-sm font-medium text-bx-err-fg">{errorFoto}</p>}

      {esAlumno && usuario.estado === "suspendido" && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-bx-err-line bg-bx-err-bg px-5 py-4 text-bx-err-fg">
          <Ico d={IC.warn} size={22} sw={2} />
          <div><div className="text-[0.9375rem] font-bold">Cuenta suspendida</div><div className="text-sm">Regularizá tu membresía para volver a reservar clases.</div></div>
        </div>
      )}

      {incompleto && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-bx-warn-line bg-bx-warn-bg px-5 py-4">
          <div className="min-w-[15rem] flex-1">
            <div className="text-[0.9375rem] font-bold text-bx-ink">Completá tu perfil</div>
            <div className="text-sm text-bx-muted">
              {sinTel && sinDni ? "Te falta cargar el teléfono y el DNI. El teléfono lo cargás vos; el DNI lo carga el box: pasáselo en recepción."
                : sinTel ? "Te falta cargar el teléfono. Lo usamos para identificarte en el box."
                : "Te falta el DNI. Lo carga el box: pasáselo en recepción."}
            </div>
          </div>
          {sinTel && <button type="button" onClick={abrirEdicion} className="h-[2.875rem] rounded-lg border border-bx-btn-line bg-transparent px-[1.125rem] text-sm font-bold text-bx-ink hover:border-bx-lima">Completar datos</button>}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-5">
        <Tarjeta aria-labelledby="t-datos" className="flex min-w-0 flex-[2_1_32.5rem] flex-col gap-[1.125rem]">
          <div className="flex items-center justify-between gap-3">
            <h2 id="t-datos" className="m-0 text-lg font-bold">Datos personales</h2>
            {!editando && (
              <button type="button" onClick={abrirEdicion} className="inline-flex h-[2.875rem] items-center gap-2 rounded-lg border border-bx-btn-line bg-transparent px-[1.125rem] text-sm font-bold text-bx-ink hover:border-bx-lima">
                <Ico d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" size={16} sw={2} />Editar
              </button>
            )}
          </div>

          {!editando ? (
            <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(min(100%,13.75rem),1fr))] gap-x-6 gap-y-[1.125rem]">
              {datos.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold tracking-[0.1em] text-bx-muted">{k}</dt>
                  <dd className={`m-0 mt-1.5 ${v ? "text-base font-semibold text-bx-ink" : "text-[0.9375rem] italic text-bx-muted"}`}>{v || "Sin cargar"}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <form noValidate onSubmit={guardar} className="flex flex-col gap-4">
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-x-5 gap-y-3.5">
                <Campo id="f-nombre" etiqueta="Nombre y apellido *" value={form.nombre} autoComplete="name" error={mostrar("nombre")}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })} onBlur={() => setTocado((t) => ({ ...t, nombre: true }))} inputClassName="h-12" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-bx-ink">DNI</span>
                  <div className="flex h-12 items-center rounded-[0.625rem] border border-bx-line2 bg-bx-surf px-3.5 text-[0.9375rem] font-medium text-bx-muted">{String(usuario.dni) || "Sin cargar"}</div>
                  <span className="text-[0.8125rem] text-bx-muted">Lo carga el box. Si hay un error, avisá en recepción.</span>
                </div>
                <Campo id="f-tel" etiqueta="Teléfono" type="tel" value={form.tel} autoComplete="tel" ayuda="Con característica, por ejemplo 3794 123456." error={mostrar("tel")}
                  onChange={(e) => setForm({ ...form, tel: e.target.value })} onBlur={() => setTocado((t) => ({ ...t, tel: true }))} inputClassName="h-12" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-bx-ink">Correo</span>
                  <div className="flex h-12 items-center truncate rounded-[0.625rem] border border-bx-line2 bg-bx-surf px-3.5 text-[0.9375rem] font-medium text-bx-muted">{usuario.correo}</div>
                  <span className="text-[0.8125rem] text-bx-muted">Para cambiarlo, escribile a soporte.</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2.5">
                <Boton variante="secundario" onClick={() => setEditando(false)} className="h-[2.875rem] text-bx-ink">Cancelar</Boton>
                <Boton type="submit" disabled={guardando} aria-busy={guardando} className="h-[2.875rem] px-5">{guardando ? "Guardando…" : "Guardar cambios"}</Boton>
              </div>
            </form>
          )}
        </Tarjeta>

        <Tarjeta aria-labelledby="t-seg" className="flex min-w-0 flex-[1_1_20rem] flex-col gap-3.5">
          <h2 id="t-seg" className="m-0 text-lg font-bold">Seguridad</h2>
          {!pwAbierto ? (
            <>
              <p className="m-0 text-[0.9375rem] text-bx-muted">Te recomendamos usar una contraseña que no uses en otros sitios.</p>
              <button type="button" onClick={() => setPwAbierto(true)} className="h-[2.875rem] self-start rounded-lg border border-bx-btn-line bg-transparent px-[1.125rem] text-sm font-bold text-bx-ink hover:border-bx-lima">Cambiar contraseña</button>
            </>
          ) : (
            <form noValidate onSubmit={guardarPw} className="flex flex-col gap-3.5">
              <Campo id="f-actual" etiqueta="Contraseña actual" type="password" value={pw.actual} autoComplete="current-password" error={pwMostrar("actual")}
                onChange={(e) => setPw({ ...pw, actual: e.target.value })} onBlur={() => setPwTocado((t) => ({ ...t, actual: true }))} inputClassName="h-12" />
              <Campo id="f-nueva" etiqueta="Nueva contraseña" type="password" value={pw.nueva} autoComplete="new-password" ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número." error={pwMostrar("nueva")}
                onChange={(e) => setPw({ ...pw, nueva: e.target.value })} onBlur={() => setPwTocado((t) => ({ ...t, nueva: true }))} inputClassName="h-12" />
              <Campo id="f-rep" etiqueta="Repetí la nueva contraseña" type="password" value={pw.rep} autoComplete="new-password" error={pwMostrar("rep")}
                onChange={(e) => setPw({ ...pw, rep: e.target.value })} onBlur={() => setPwTocado((t) => ({ ...t, rep: true }))} inputClassName="h-12" />
              <div className="flex flex-wrap gap-2.5">
                <Boton type="submit" disabled={pwGuardando} aria-busy={pwGuardando} className="h-[2.875rem] px-5">{pwGuardando ? "Guardando…" : "Guardar contraseña"}</Boton>
                <Boton variante="secundario" onClick={cerrarPw} className="h-[2.875rem] text-bx-ink">Cancelar</Boton>
              </div>
            </form>
          )}
        </Tarjeta>
      </div>
    </Pantalla>
  )
}
