import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import apiClient from "@/api"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/CheckinView"

const MINIMO = 12
const ENLACE = window.location.hostname === "localhost" ? `${window.location.origin}/check-in` : "https://bravosbox.com.ar/check-in"
const fechaHoy = () => { const t = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }).replace(", ", " "); return t.charAt(0).toUpperCase() + t.slice(1) }
const ini = (n = "") => n.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?"

// Check-in del admin en celular (referencia 11): enlace de recepción, clases de hoy, quién se registró y la clave del equipo
export default function CheckinCelular() {
  const { c, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puedeVer = permisos.includes("configuracion:consulta") || permisos.includes("configuracion:ver")
  const puedeEditar = permisos.includes("configuracion:modificacion")
  const [estado, setEstado] = useState(null)
  const [copied, setCopied] = useState(false)
  const [ks, setKs] = useState(false)
  const [k, setK] = useState("")
  const [show, setShow] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 3000) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])

  const cargar = useCallback(() => {
    apiClient.get("/asistencia/check-in/estado").then((r) => setEstado(r.data?.data || r.data)).catch(() => { setEstado({ configurado: false, registrados: [], clasesHoy: [] }); avisar("No se pudo cargar el estado del check-in.") })
  }, [avisar])
  useEffect(() => { if (puedeVer) cargar() }, [puedeVer, cargar])

  const v = useMemo(() => {
    const regs = estado?.registrados || []
    const kl = k.length, kOk = kl >= MINIMO
    const guardar = async () => {
      if (!kOk || guardando || !puedeEditar) return
      setGuardando(true)
      try { await apiClient.post("/asistencia/check-in/clave", { clave: k.trim() }); setKs(false); setK(""); avisar("Clave actualizada."); cargar() }
      catch (err) { avisar(err.response?.data?.message || "No se pudo guardar la clave.") } finally { setGuardando(false) }
    }
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, fecha: fechaHoy(), n: String(regs.length), nLabel: regs.length === 1 ? "alumno registrado hoy" : "alumnos registrados hoy",
      enlace: ENLACE, enlaceCorto: ENLACE.replace(/^https?:\/\//, ""),
      copy: () => { try { navigator.clipboard.writeText(ENLACE) } catch { /* sin portapapeles */ } setCopied(true); avisar("Enlace copiado.") }, copyL: copied ? "Copiado" : "Copiar",
      clases: (estado?.clasesHoy || []).map((cl) => ({ n: cl.nombre, s: cl.tipo, h: `${cl.inicio} – ${cl.fin}` })),
      empty: !regs.length, hasList: regs.length > 0, list: regs.map((r, i) => ({ ini: ini(r.nombre), n: r.nombre, s: `${r.clase || "Asistencia libre"}${r.origen ? " · " + r.origen : ""}`, h: r.inicio, sep: i ? c.line2 : "transparent" })),
      ks, openK: () => { if (puedeEditar) { setKs(true); setK(""); setShow(false) } }, closeK: () => setKs(false),
      k, onK: (ev) => setK(ev.target.value), kType: show ? "text" : "password", tog: () => setShow((x) => !x), eyeL: show ? "Ocultar clave" : "Mostrar clave",
      kBd: kl && !kOk ? c.errFg : c.line, kH: kOk ? "Clave válida." : kl ? `Faltan ${MINIMO - kl} caracteres.` : `Mínimo ${MINIMO} caracteres.`, kHFg: kOk ? c.okFg : kl ? c.errFg : c.muted,
      claveTxt: estado?.configurado ? "Configurada · cambiar" : "Sin configurar · definir", kDis: !kOk || guardando, kBg: kOk ? "#9be600" : c.line2, kFg: kOk ? "#0b0b0b" : c.muted, saveK: guardar, toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
  }, [estado, copied, ks, k, show, guardando, toast, c, noLeidas, sesion, abrirNotif, abrirCuenta, puedeEditar, cargar, avisar])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver el check-in.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
