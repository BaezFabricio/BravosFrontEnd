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

const datosIniciales = (user) => ({
  nombre: user.nombre || "",
  dni: user.dni || "",
  email: user.email || user.correo || "",
  telefono: user.telefono || "",
  idPerfil: user.idPerfil ? String(user.idPerfil) : "",
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
        if (!ini.idPerfil) {
          // Si el servidor no manda el id del perfil, se busca por el nombre (igual que la pantalla de editar)
          const nombre = String(user.nombrePerfil || user.perfil || "").trim().toLowerCase()
          const encontrado = lista.find((p) => String(p.nombrePerfil || "").trim().toLowerCase() === nombre)
          if (encontrado) {
            const idEncontrado = String(encontrado.idPerfil)
            setBase((prev) => (prev ? { ...prev, idPerfil: idEncontrado } : prev))
            setForm((prev) => (prev ? { ...prev, idPerfil: idEncontrado } : prev))
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
    if (!form.idPerfil) e.idPerfil = "Elegí un perfil"
    setErrores(e)
    return Object.keys(e).length === 0
  }

  const perfilNuevo = perfiles?.find((p) => String(p.idPerfil) === form?.idPerfil)
  const cambiaPerfil = !!form && !!base && form.idPerfil !== base.idPerfil
  const desactiva = !!form && !!base && form.estado === "inactivo" && base.estado !== "inactivo"
  const requiereConfirmar = cambiaPerfil || desactiva

  const textoConfirmacion = propia && cambiaPerfil
    ? `Vas a cambiar tu propio perfil a ${perfilNuevo?.nombrePerfil}. Al guardar se cierra tu sesión y volvés a entrar con los permisos del perfil nuevo.`
    : [
      cambiaPerfil ? `${user.nombre} pasa de ${user.nombrePerfil || user.perfil || "sin perfil"} a ${perfilNuevo?.nombrePerfil}: cambian los permisos que tiene en el sistema.` : null,
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
          idPerfil: parseInt(form.idPerfil, 10),
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
        ? { description: "Se cerró la sesión del usuario para que el cambio valga en el momento." }
        : undefined)
      onGuardado({
        nombre: form.nombre.trim(),
        dni: form.dni.trim(),
        email,
        correo: email,
        telefono: form.telefono.trim(),
        idPerfil: parseInt(form.idPerfil, 10),
        nombrePerfil: perfilNuevo?.nombrePerfil ?? user.nombrePerfil,
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
