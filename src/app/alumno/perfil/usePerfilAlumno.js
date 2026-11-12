import { useEffect, useState } from "react"
import { panelesPermitidos } from "@/lib/paneles"
import apiClient from "@/api"
import { toast } from "@/lib/notificar"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/vv1"

// Busca un dato en cualquier parte de la respuesta del servidor (los nombres varían entre versiones)
export function buscarValor(obj, nombres) {
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

/*
 * Datos y acciones de Mi perfil del alumno, compartidos por el escritorio y el celular: carga de /auth/me, foto,
 * edición de nombre y teléfono (validada) y cambio de contraseña. El correo y el DNI no se editan: los cambia el box.
 */
export function usePerfilAlumno() {
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
  return {
    esAlumno, usuario, cargando, setCargando, errorCarga, setIntento, avatarUrl, guardandoFoto, errorFoto, editando, setEditando,
    form, setForm, tocado, setTocado, guardando, pwAbierto, setPwAbierto, pw, setPw, pwTocado, setPwTocado, pwGuardando,
    cambiarFoto, abrirEdicion, guardar, errs, mostrar, pwErrores, pwMostrar, cerrarPw, guardarPw,
  }
}
