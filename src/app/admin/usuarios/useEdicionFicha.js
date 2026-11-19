import { useState } from "react"
import { logoutUsuario } from "@/api"
import { toast } from "@/lib/notificar"

/*
 * Edición de un usuario en su propia ficha (computadora): los mismos datos que se ven pasan a ser campos en su lugar.
 * Usa el mismo guardado y las mismas reglas que la pantalla "Editar usuario" (PUT /usuarios/:id): el servidor controla los
 * permisos, que nadie se suba de perfil a sí mismo, que no se desactive la propia cuenta y que los datos sean válidos.
 */
const esMiCuenta = (id) => {
  try { return Number(JSON.parse(localStorage.getItem("usuario") || "{}").idUsuario) === Number(id) } catch { return false }
}

// Varios perfiles por usuario: el primero de la lista es el principal
const perfilesDeUsuario = (user) => {
  if (Array.isArray(user.perfiles) && user.perfiles.length) return user.perfiles.map((p) => String(p.idPerfil))
  return user.idPerfil ? [String(user.idPerfil)] : []
}
const mismosPerfiles = (a = [], b = []) => a.length === b.length && a.every((x) => b.includes(x))

const datosIniciales = (user) => ({
  nombre: user.nombre || "",
  dni: user.dni || "",
  email: user.email || user.correo || "",
  telefono: user.telefono || "",
  idPerfiles: perfilesDeUsuario(user),
  estado: user.estado || "activo",
})

export function useEdicionFicha(user, onGuardado) {
  const id = user.idUsuario || user.id
  const propia = esMiCuenta(id)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState(null)
  const [base, setBase] = useState(null) // cómo estaba el usuario al empezar a editar
  const [errores, setErrores] = useState({})
  const [perfiles, setPerfiles] = useState(null) // null = todavía no se pidieron o están cargando
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const abrir = () => {
    const ini = datosIniciales(user)
    setForm(ini)
    setBase(ini)
    setErrores({})
    setConfirmando(false)
    setEditando(true)
    // Los perfiles salen de la base (los crea el administrador con sus permisos), no son fijos
    fetch("/api/vv1/perfiles")
      .then((r) => r.json())
      .then((r) => {
        const lista = r.success && Array.isArray(r.data) ? r.data : []
        setPerfiles(lista)
        if (ini.idPerfiles.length === 0) {
          // Si el servidor no manda el id del perfil, se busca por el nombre (igual que la pantalla de editar)
          const nombre = String(user.nombrePerfil || user.perfil || "").trim().toLowerCase()
          const encontrado = lista.find((p) => String(p.nombrePerfil || "").trim().toLowerCase() === nombre)
          if (encontrado) {
            const idEncontrado = [String(encontrado.idPerfil)]
            setBase((prev) => (prev ? { ...prev, idPerfiles: idEncontrado } : prev))
            setForm((prev) => (prev ? { ...prev, idPerfiles: idEncontrado } : prev))
          }
        }
      })
      .catch(() => setPerfiles([]))
  }

  const cancelar = () => { setEditando(false); setConfirmando(false); setErrores({}) }

  const cambiar = (campo, valor) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev))
    setConfirmando(false)
  }

  const validar = () => {
    const e = {}
    if (form.nombre.trim().length < 2) e.nombre = "Escribí el nombre completo"
    if (!/^\d{6,10}$/.test(form.dni.trim())) e.dni = "Entre 6 y 10 números, sin puntos"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "El correo no es válido"
    if (!form.telefono.trim()) e.telefono = "El teléfono es requerido"
    else if (!/^[\d\s+()-]{6,30}$/.test(form.telefono.trim())) e.telefono = "Solo números, espacios, + y guiones"
    if (form.idPerfiles.length === 0) e.idPerfiles = "Elegí al menos un perfil"
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const nombresDePerfiles = (ids = []) => ids
    .map((id) => perfiles?.find((p) => String(p.idPerfil) === id)?.nombrePerfil)
    .filter(Boolean)
    .join(" ")
  const perfilNuevo = nombresDePerfiles(form?.idPerfiles)
  const cambiaPerfil = !!form && !!base && !mismosPerfiles(form.idPerfiles, base.idPerfiles)
  const desactiva = !!form && !!base && form.estado === "inactivo" && base.estado !== "inactivo"
  const requiereConfirmar = cambiaPerfil || desactiva

  const textoConfirmacion = propia && cambiaPerfil
    ? `Vas a cambiar tu propio perfil a ${perfilNuevo}. Al guardar se cierra tu sesión y volvés a entrar con los permisos del perfil nuevo.`
    : [
      cambiaPerfil ? `${user.nombre} pasa de ${user.nombrePerfil || user.perfil || "sin perfil"} a ${perfilNuevo}: cambian los permisos que tiene en el sistema.` : null,
      desactiva ? `${user.nombre} queda inactivo: no podrá entrar ni reservar, y se cierra su sesión.` : null,
    ].filter(Boolean).join(" ")

  const guardar = async () => {
    if (!validar()) return
    if (requiereConfirmar && !confirmando) { setConfirmando(true); return }
    setGuardando(true)
    try {
      const email = form.email.trim().toLowerCase()
      const res = await fetch(`/api/vv1/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          dni: form.dni.trim(),
          email,
          telefono: form.telefono.trim(),
          username: email,
          idPerfiles: form.idPerfiles.map((n) => parseInt(n, 10)),
          // El estado de la propia cuenta no se manda (el servidor igual lo rechaza)
          ...(propia ? {} : { estado: form.estado }),
        }),
      })
      const resultado = await res.json()
      if (!res.ok) throw new Error(resultado.message || "Error al actualizar")
      if (propia && resultado.data?.sesionesCerradas) {
        toast.success("Perfil cambiado. Volvé a iniciar sesión.")
        logoutUsuario()
        return
      }
      toast.success("Cambios guardados", resultado.data?.sesionesCerradas
        ? { description: "Se cerró la sesión del usuario para que el cambio valga en el momento.", guardar: false }
        : { guardar: false })
      onGuardado({
        nombre: form.nombre.trim(),
        dni: form.dni.trim(),
        email,
        correo: email,
        telefono: form.telefono.trim(),
        idPerfil: parseInt(form.idPerfiles[0], 10),
        perfiles: form.idPerfiles.map((id) => ({
          idPerfil: parseInt(id, 10),
          nombrePerfil: perfiles?.find((p) => String(p.idPerfil) === id)?.nombrePerfil || "",
        })),
        nombrePerfil: perfilNuevo || user.nombrePerfil,
        ...(propia ? {} : { estado: form.estado }),
      })
      setEditando(false)
      setConfirmando(false)
    } catch (err) {
      toast.error("No se guardaron los cambios", { description: err.message })
      setConfirmando(false)
    } finally {
      setGuardando(false)
    }
  }

  return { editando, abrir, cancelar, form, errores, perfiles, guardando, confirmando, cambiar, guardar, textoConfirmacion, propia }
}
