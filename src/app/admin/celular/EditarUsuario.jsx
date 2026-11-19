import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import apiClient, { getUsuarioById, logoutUsuario } from "@/api"
import { useConfirmar } from "@/components/useConfirmar"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/EditarUsuarioView"

const VACIO = { nombre: "", dni: "", email: "", tel: "", nac: "", emN: "", emT: "" }
const PERFIL_AYUDA = { alumno: "Reserva clases, ve su membresía y sus rutinas.", profesor: "Gestiona clases, turnos y check-in.", admin: "Acceso total: usuarios, pagos, reportes y configuración." }
const esMiCuenta = (id) => { try { return Number(JSON.parse(localStorage.getItem("usuario") || "{}").idUsuario) === Number(id) } catch { return false } }

// Editar usuario del admin en celular (referencia 05): datos, ficha, perfil y acceso, con el botón de guardar fijo abajo
export default function EditarUsuarioCelular() {
  const { c, oscuro } = useCelular()
  const { id } = useParams()
  const navigate = useNavigate()
  const [pedirConfirmacion, dialogoConfirmar] = useConfirmar()
  const propia = esMiCuenta(id)
  const puede = useMemo(() => { try { const p = JSON.parse(localStorage.getItem("permisos") || "[]"); return p.includes("usuarios:modificacion") } catch { return false } }, [])
  const [orig, setOrig] = useState(null)
  const [vals, setVals] = useState(null)
  const [perfiles, setPerfiles] = useState([])
  // Varios perfiles por usuario: lista de ids (texto); el primero es el principal
  const [perfil, setPerfil] = useState([])
  const [activo, setActivo] = useState(true)
  const [origPA, setOrigPA] = useState({ perfil: [], activo: true })
  const mismos = (a = [], b = []) => a.length === b.length && a.every((x) => b.includes(x))
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const [ask, setAsk] = useState(false)
  const [errorServidor, setErrorServidor] = useState("")
  const [toast, setToast] = useState(null)
  const [fallo, setFallo] = useState(false)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 4000) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])

  useEffect(() => {
    let vigente = true
    ;(async () => {
      try {
        const rp = await apiClient.get("/perfiles")
        const lista = Array.isArray(rp.data?.data) ? rp.data.data : []
        const u = await getUsuarioById(id)
        const idPerfil = u.idPerfil || lista.find((p) => p.nombrePerfil?.trim().toLowerCase() === String(u.perfil || "").trim().toLowerCase())?.idPerfil
        const datos = { nombre: u.nombre || "", dni: u.dni || "", email: u.email || "", tel: u.telefono || "", nac: "", emN: "", emT: "" }
        try {
          const rf = await apiClient.get(`/usuarios/${id}/ficha`)
          const dp = rf.data?.data?.datosPersona || {}
          datos.nac = dp.fechaNacimiento ? String(dp.fechaNacimiento).slice(0, 10) : ""
          datos.emN = dp.contactoEmergencia || ""
          datos.emT = dp.telefonoEmergencia || ""
        } catch { /* sin ficha de alumno: se editan igual los demás datos */ }
        if (!vigente) return
        setPerfiles(lista); setOrig(datos); setVals(datos)
        const ini = Array.isArray(u.perfiles) && u.perfiles.length ? u.perfiles.map((p) => String(p.idPerfil)) : (idPerfil ? [String(idPerfil)] : [])
        setPerfil(ini); setActivo((u.estado || "activo") === "activo"); setOrigPA({ perfil: ini, activo: (u.estado || "activo") === "activo" })
      } catch { if (vigente) setFallo(true) }
    })()
    return () => { vigente = false }
  }, [id])

  // Si se llegó desde la ficha, "atrás" de verdad (así la pantalla anterior entra deslizando hacia el lado correcto)
  const volver = useCallback(() => (window.history.state?.idx > 0 ? navigate(-1) : navigate(`/admin/usuarios/${id}`)), [navigate, id])

  const v = useMemo(() => {
    const V = vals || VACIO, O = orig || VACIO
    const E = {
      nombre: V.nombre.trim().length < 3 ? "Escribí nombre y apellido." : "",
      dni: !/^\d{6,10}$/.test(V.dni) ? "El DNI tiene entre 6 y 10 números, sin puntos." : "",
      email: !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(V.email) ? "El correo no es válido." : "",
      tel: V.tel && !/^[\d\s+()-]{6,30}$/.test(V.tel.trim()) ? "Solo números, espacios, + y guiones." : "",
      nac: "", emN: "",
      emT: V.emT && V.emT.replace(/\D/g, "").length < 10 ? "Tiene que tener 10 números." : "",
    }
    const nErr = Object.values(E).filter(Boolean).length + (perfil.length ? 0 : 1)
    const changed = Object.keys(O).filter((k) => V[k] !== O[k]).length + (!mismos(perfil, origPA.perfil) ? 1 : 0) + (activo !== origPA.activo ? 1 : 0)
    const H = { dni: "Lo usa para el check-in en recepción.", email: "Con este correo entra a la app y recibe los comprobantes." }
    const IM = { nombre: "text", dni: "numeric", email: "email", tel: "tel", nac: "text", emN: "text", emT: "tel" }
    const f = {}
    Object.keys(VACIO).forEach((k) => {
      const err = tried && E[k]
      f[k] = { v: V[k], im: IM[k], inv: err ? "true" : "false", bd: err ? c.errFg : (V[k] !== O[k] ? c.okLine : c.line), h: err || H[k] || false, hFg: err ? c.errFg : c.muted, on: (ev) => { const val = k === "dni" ? ev.target.value.replace(/\D/g, "").slice(0, 10) : ev.target.value; setVals((s) => ({ ...(s || VACIO), [k]: val })) } }
    })
    const noSave = saving || !changed || !puede
    const nombrePerfil = (perfiles.find((p) => String(p.idPerfil) === perfil[0]) || {}).nombrePerfil || "" // la ayuda explica el principal
    const guardar = async () => {
      if (noSave) return
      if (nErr) { setTried(true); setTimeout(() => document.getElementById("err-sum")?.focus(), 0); return }
      if (propia && !mismos(perfil, origPA.perfil) && !(await pedirConfirmacion("Vas a cambiar tu propio perfil. Al guardar se cierra tu sesión y vas a entrar con los permisos del perfil nuevo. ¿Seguimos?"))) return
      setSaving(true); setErrorServidor("")
      try {
        const email = V.email.trim().toLowerCase()
        const res = await apiClient.put(`/usuarios/${id}`, { nombre: V.nombre.trim(), dni: V.dni.trim(), email, telefono: V.tel.trim(), username: email, idPerfiles: perfil.map((n) => parseInt(n, 10)), ...(propia ? {} : { estado: activo ? "activo" : "inactivo" }) })
        await apiClient.put(`/usuarios/${id}/datos-ficha`, { fechaNacimiento: V.nac || null, contactoEmergencia: V.emN.trim() || null, telefonoEmergencia: V.emT.trim() || null })
        if (propia && res.data?.data?.sesionesCerradas) { logoutUsuario(); return }
        setOrig(V); setOrigPA({ perfil, activo }); setTried(false); avisar("Cambios guardados.")
        setTimeout(volver, 900)
      } catch (err) {
        setErrorServidor(err.response?.data?.message || "No se guardaron los cambios.")
        setTried(true)
      } finally { setSaving(false) }
    }
    return {
      c, f, scheme: oscuro ? "dark" : "light", nombreUsuario: O.nombre || (fallo ? "No se pudo cargar" : "Cargando…"),
      perfiles: perfiles.map((p) => { const id = String(p.idPerfil); const ch = perfil.includes(id); return { l: p.nombrePerfil, ch: ch ? "true" : "false", bg: ch ? "#9be600" : "transparent", fg: ch ? "#0b0b0b" : c.ink, pick: () => setPerfil((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])) } }),
      perfilHint: PERFIL_AYUDA[String(nombrePerfil).toLowerCase()] || "",
      activo: activo ? "true" : "false", toggleAct: () => { if (!propia) setActivo((x) => !x) },
      actDesc: propia ? "No podés desactivar tu propia cuenta." : activo ? "Activa: puede iniciar sesión con su correo." : "Inactiva: no puede iniciar sesión. Sus datos y pagos se conservan.",
      swBg: activo ? "#9be600" : c.btnLine, swJ: activo ? "flex-end" : "flex-start", swK: activo ? "#0b0b0b" : c.ink,
      errors: tried && (nErr > 0 || !!errorServidor), errMsg: errorServidor || (nErr === 1 ? "Revisá 1 campo antes de guardar." : `Revisá ${nErr} campos antes de guardar.`),
      dirtyLabel: changed ? (changed === 1 ? "1 cambio sin guardar" : changed + " cambios sin guardar") : "Sin cambios", nDirty: changed === 1 ? "1 cambio" : changed + " cambios",
      noSave, saving, subBg: noSave && !saving ? c.line2 : saving ? "#7fbf00" : "#9be600", subFg: noSave && !saving ? c.muted : "#0b0b0b", subCur: noSave ? "not-allowed" : "pointer",
      subLabel: saving ? "Guardando…" : "GUARDAR CAMBIOS", save: guardar,
      cancel: () => { if (changed) setAsk(true); else volver() }, ask, keep: () => setAsk(false), hrefFicha: `/admin/usuarios/${id}`, toast,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vals, orig, perfiles, perfil, activo, origPA, tried, saving, ask, errorServidor, toast, fallo, c, oscuro, propia, puede, id])

  if (!puede) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para editar usuarios.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
      {dialogoConfirmar}
    </>
  )
}
