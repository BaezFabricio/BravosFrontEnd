import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import apiClient, { crearUsuario } from "@/api"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/NuevoUsuarioView"

// Contraseña al azar con mayúscula, minúscula y número (generador criptográfico del navegador)
function generar() {
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ", a = "abcdefghijkmnpqrstuvwxyz", n = "23456789"
  const buf = new Uint32Array(10); crypto.getRandomValues(buf)
  const r = (s, i) => s[buf[i] % s.length]
  let p = r(A, 0) + r(a, 1) + r(n, 2)
  for (let i = 3; i < 10; i++) p += r(A + a + n, i)
  return p
}
const PERFIL_AYUDA = { alumno: "Reserva clases, ve su membresía y sus rutinas.", profesor: "Gestiona clases, turnos y check-in.", admin: "Acceso total: usuarios, pagos, reportes y configuración." }

// Nuevo usuario del admin en celular (referencia 03): con cuenta (correo y contraseña temporal) o sin cuenta (solo registro)
export default function NuevoUsuarioCelular() {
  const { c } = useCelular()
  const [params] = useSearchParams()
  const puedeAlta = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]").includes("usuarios:alta") } catch { return false } }, [])
  const [tipo, setTipo] = useState(params.get("sin") ? "sin" : "con")
  const [perfiles, setPerfiles] = useState([])
  const [perfil, setPerfil] = useState("")
  const [vals, setVals] = useState({ nombre: "", dni: "", tel: "", email: "" })
  const [pass, setPass] = useState("")
  const [show, setShow] = useState(false)
  const [tried, setTried] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorServidor, setErrorServidor] = useState("")
  const [toast, setToast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 3500) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])

  useEffect(() => {
    apiClient.get("/perfiles").then((r) => {
      const l = r.data?.data
      if (!Array.isArray(l)) return
      setPerfiles(l)
      // Por defecto el de alumno; nunca uno con más poder
      const alumno = l.find((p) => String(p.nombrePerfil || "").toLowerCase().includes("alumno"))
      if (alumno) setPerfil(String(alumno.idPerfil))
    }).catch(() => avisar("No se pudieron cargar los perfiles."))
  }, [avisar])

  const v = useMemo(() => {
    const con = tipo === "con"
    const R = [["8 caracteres", pass.length >= 8], ["Una mayúscula", /[A-Z]/.test(pass)], ["Una minúscula", /[a-z]/.test(pass)], ["Un número", /\d/.test(pass)]]
    const E = {
      nombre: vals.nombre.trim().length < 3 ? "Escribí nombre y apellido." : "",
      dni: !/^\d{7,8}$/.test(vals.dni) ? "El DNI tiene 7 u 8 números, sin puntos." : "",
      tel: vals.tel && vals.tel.replace(/\D/g, "").length < 10 ? "Revisá el teléfono: tiene que tener 10 números." : "",
      email: con && !vals.email ? "Necesitamos el correo para que pueda entrar a la app." : (vals.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(vals.email) ? "El correo no es válido." : ""),
    }
    const passErr = con && R.some((x) => !x[1])
    const perfilErr = con && !perfil
    const nErr = Object.values(E).filter(Boolean).length + (passErr ? 1 : 0) + (perfilErr ? 1 : 0)
    const H = { nombre: "", dni: "Lo usa para el check-in en recepción.", tel: "Para avisos por WhatsApp.", email: con ? "Con este correo entra a la app." : "Le llegan los comprobantes." }
    const IM = { nombre: "text", dni: "numeric", tel: "tel", email: "email" }
    const f = {}
    Object.keys(vals).forEach((k) => {
      const err = tried && E[k]
      f[k] = { v: vals[k], im: IM[k], inv: err ? "true" : "false", bd: err ? c.errFg : c.line, h: err || H[k], hFg: err ? c.errFg : c.muted, on: (ev) => { const val = k === "dni" ? ev.target.value.replace(/\D/g, "").slice(0, 8) : ev.target.value; setVals((s) => ({ ...s, [k]: val })) } }
    })
    const enviar = async () => {
      if (sending) return
      if (nErr) { setTried(true); setTimeout(() => document.getElementById("err-sum")?.focus(), 0); return }
      setSending(true); setErrorServidor("")
      try {
        if (con) await crearUsuario({ nombre: vals.nombre.trim(), dni: vals.dni.trim(), email: vals.email.trim().toLowerCase(), telefono: vals.tel.trim(), perfil, password: pass, estado: "activo", membresia: "vencida" })
        else await apiClient.post("/usuarios/sin-cuenta", { nombrecompleto: vals.nombre.trim(), dni: vals.dni.trim(), telefono: vals.tel.trim(), correo: vals.email.trim().toLowerCase() })
        setDone(true)
      } catch (err) {
        setErrorServidor(err.response?.data?.message || "No se pudo crear el usuario. Probá de nuevo.")
        setTried(true)
      } finally { setSending(false) }
    }
    const nombrePerfil = (perfiles.find((p) => String(p.idPerfil) === perfil) || {}).nombrePerfil || ""
    return {
      c, f, done, form: !done, conCuenta: con, sinCuenta: !con, doneConCuenta: con,
      tipos: [["con", "Sí, con cuenta", "Entra con correo y contraseña."], ["sin", "No, sin cuenta", "Vos gestionás sus pagos."]].map(([id, t, s]) => { const ch = tipo === id; return { t, s, ch: ch ? "true" : "false", bd: ch ? "2px solid #9be600" : "1px solid " + c.line, bg: ch ? c.okBg : c.card, rd: ch ? "6px solid #9be600" : "2px solid " + c.btnLine, rBg: ch ? "#0b0b0b" : "transparent", pick: () => { setTipo(id); setTried(false) } } }),
      perfiles: perfiles.map((p) => { const ch = perfil === String(p.idPerfil); return { l: p.nombrePerfil, ch: ch ? "true" : "false", bg: ch ? "#9be600" : "transparent", fg: ch ? "#0b0b0b" : c.ink, pick: () => setPerfil(String(p.idPerfil)) } }),
      perfilHint: PERFIL_AYUDA[String(nombrePerfil).toLowerCase()] || "",
      pass, onPass: (ev) => setPass(ev.target.value), gen: () => { setPass(generar()); setShow(true) },
      showPass: show ? "true" : "false", passType: show ? "text" : "password", eyeLabel: show ? "Ocultar contraseña" : "Mostrar contraseña", togglePass: () => setShow((x) => !x),
      passInv: tried && passErr ? "true" : "false", passBd: tried && passErr ? c.errFg : c.line,
      reglas: R.map(([t, ok]) => ({ t, fg: ok ? c.okFg : (tried ? c.errFg : c.muted), d: ok ? "M5 12l5 5 9-10" : "M12 12h.01", sr: ok ? ": cumple" : ": falta" })),
      errors: tried && (nErr > 0 || !!errorServidor), errMsg: errorServidor || (nErr === 1 ? "Revisá 1 campo antes de continuar." : `Revisá ${nErr} campos antes de continuar.`),
      sending, subBg: sending ? "#7fbf00" : "#9be600", subLabel: sending ? "Creando…" : (con ? "CREAR USUARIO" : "REGISTRAR ALUMNO"), submit: enviar,
      doneTitle: (vals.nombre.trim() || "Usuario") + (con ? " ya tiene cuenta" : " quedó registrado"),
      doneSub: con ? `Perfil ${nombrePerfil}. Pasale su correo y esta contraseña temporal para que entre.` : "Ya podés cargarle un abono y registrar su asistencia con el DNI.",
      copy: () => { try { navigator.clipboard.writeText(pass) } catch { /* sin portapapeles */ } setCopied(true) }, copyLabel: copied ? "Copiada" : "Copiar",
      reset: () => { setVals({ nombre: "", dni: "", tel: "", email: "" }); setPass(""); setTried(false); setDone(false); setCopied(false); setShow(false); setErrorServidor("") },
      hrefAbono: "/admin/usuarios/abonos/carga-masiva", toast,
    }
  }, [tipo, perfiles, perfil, vals, pass, show, tried, sending, done, copied, errorServidor, toast, c])

  if (!puedeAlta) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para crear usuarios.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
