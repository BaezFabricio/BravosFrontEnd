import { avisarTexto } from "@/lib/avisoSileo"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "@/api"
import { cerrarSesionEnServidor } from "@/lib/sesion"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/MiPerfilView"

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const fecha = (f) => { const [y, m, d] = String(f || "").slice(0, 10).split("-").map(Number); return y ? `${d} ${MESES[m - 1].slice(0, 3)} ${y}` : "" }

// Mi perfil del admin en celular (referencia 19): datos, foto, contraseña y cierre de sesión
export default function MiPerfilCelular() {
  const { c, sesion } = useCelular()
  const navigate = useNavigate()
  const [u, setU] = useState(null)
  const [mem, setMem] = useState(null)
  const [sh, setSh] = useState(null) // "e" editar · "p" contraseña · "o" salir
  const [e, setE] = useState(null)
  const [p, setP] = useState({ a: "", b: "", c: "" })
  const [show, setShow] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [toast] = useState(null)
  const reloj = useRef(null)
  const archivo = useRef(null)
  const avisar = useCallback((t) => { avisarTexto(t) }, []) // los avisos los dibuja Sileo
  useEffect(() => () => clearTimeout(reloj.current), [])

  useEffect(() => {
    apiClient.get("/auth/me").then((r) => {
      const d = r.data?.data || r.data; const x = d?.usuario || d
      if (x) setU({ id: x.idUsuario, n: x.nombrecompleto || x.nombre || "", t: x.telefono || "", m: x.correo || x.email || "", dni: x.dni || "—", perfil: String(x.perfil || x.nombrePerfil || "Admin").trim(), desde: x.fecha_registro || x.fechaRegistro || x.createdAt || "" })
    }).catch(() => avisar("No se pudieron cargar tus datos."))
    apiClient.get("/pagos/mi-plan").then((r) => { const d = r.data?.data; if (d?.vigente) setMem(d) }).catch(() => {})
  }, [avisar])

  useEffect(() => {
    const tecla = (ev) => { if (ev.key === "Escape") setSh(null) }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [])

  const subirFoto = (ev) => {
    const f = ev.target.files?.[0]
    ev.target.value = ""
    if (!f || !u?.id) return
    const l = new FileReader()
    l.onload = async () => {
      try {
        const r = await apiClient.put(`/usuarios/${u.id}/avatar`, { avatarData: l.result })
        const url = r.data?.data?.avatarUrl || l.result
        localStorage.setItem("avatarUrl", url)
        const g = JSON.parse(localStorage.getItem("usuario") || "{}"); localStorage.setItem("usuario", JSON.stringify({ ...g, avatarUrl: url }))
        window.dispatchEvent(new CustomEvent("avatar-updated", { detail: url }))
        avisar("Foto actualizada.")
      } catch (err) { avisar(err.response?.data?.message || "No se pudo guardar la foto.") }
    }
    l.readAsDataURL(f)
  }

  const v = useMemo(() => {
    const V = u || { n: sesion.nombrecompleto || "", t: "", m: "", dni: "—", perfil: "Admin", desde: "" }
    const E = e || V
    const mOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(E.m || "")
    const R = [["8 caracteres", p.b.length >= 8], ["Una mayúscula", /[A-Z]/.test(p.b)], ["Una minúscula", /[a-z]/.test(p.b)], ["Un número", /\d/.test(p.b)]]
    const pOk = p.a && R.every((x) => x[1]) && p.b === p.c
    const cErr = p.c && p.b !== p.c
    const upd = (k) => (ev) => { const val = ev.target.value; setE((s) => ({ ...(s || V), [k]: val })) }
    const updP = (k) => (ev) => { const val = ev.target.value; setP((s) => ({ ...s, [k]: val })) }
    const salir = () => { cerrarSesionEnServidor(); localStorage.removeItem("usuario"); localStorage.removeItem("avatarUrl"); localStorage.removeItem("permisos"); navigate("/login", { replace: true }) }
    const d = V.desde ? new Date(V.desde) : null
    const desde = d && !Number.isNaN(d.getTime()) ? `Miembro desde ${MESES[d.getMonth()]} ${d.getFullYear()}` : ""
    return {
      c, v: { n: V.n }, foto: () => archivo.current?.click(), ini: (V.n || "").trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD", desde, rolTxt: String(V.perfil || "Admin").toUpperCase(),
      mem: mem ? { t: `${mem.planes?.[0]?.nombrePlan || "Plan"} · Vigente`, s: mem.proximoVencimiento ? `Vence el ${fecha(mem.proximoVencimiento)}` : "", n: String(mem.totalDisponibles ?? 0) } : null,
      rows: [["DNI", V.dni], ["Teléfono", V.t || "—"], ["Correo", V.m || "—"], ["Perfil", V.perfil]].map(([k, val], i) => ({ k, v: val, sep: i ? c.line2 : "transparent" })),
      sh: !!sh, shT: sh === "e" ? "Editar datos" : sh === "p" ? "Cambiar contraseña" : "¿Cerrar sesión?", isE: sh === "e", isP: sh === "p", isO: sh === "o",
      close: () => { setSh(null); setE(null); setP({ a: "", b: "", c: "" }) }, openE: () => { setSh("e"); setE({ ...V }) }, openP: () => setSh("p"), askOut: () => setSh("o"),
      e: E, on: { n: upd("n"), t: upd("t"), m: upd("m") },
      mInv: "false", mBd: c.line, mH: "El correo no se cambia desde acá.", mHFg: c.muted,
      saveE: async () => {
        if (!(E.n || "").trim() || ocupado) return
        setOcupado(true)
        try {
          await apiClient.put(`/usuarios/${u.id}`, { nombrecompleto: E.n.trim(), telefono: (E.t || "").trim() })
          setU((x) => ({ ...x, n: E.n.trim(), t: (E.t || "").trim() }))
          const g = JSON.parse(localStorage.getItem("usuario") || "{}"); localStorage.setItem("usuario", JSON.stringify({ ...g, nombrecompleto: E.n.trim() })); window.dispatchEvent(new CustomEvent("usuario-actualizado"))
          setSh(null); setE(null); avisar("Datos actualizados.")
        } catch (err) { avisar(err.response?.data?.message || "No se pudieron guardar tus datos.") } finally { setOcupado(false) }
      },
      p, onP: { a: updP("a"), b: updP("b"), c: updP("c") }, pt: show ? "text" : "password", togP: () => setShow((x) => !x), eyeL: show ? "Ocultar contraseñas" : "Mostrar contraseñas",
      reglas: R.map(([t, ok]) => ({ t, i: ok ? "✓" : "·", fg: ok ? c.okFg : c.muted })),
      cErr: !!cErr, cInv: cErr ? "true" : "false", cBd: cErr ? c.errFg : c.line,
      pDis: !pOk || ocupado, pBg: pOk ? "#9be600" : c.line2, pFg: pOk ? "#0b0b0b" : c.muted,
      saveP: async () => {
        if (!pOk || ocupado) return
        setOcupado(true)
        try { await apiClient.post("/auth/cambiar-contrasena", { contrasenaActual: p.a, contrasenaNueva: p.b }); setSh(null); setP({ a: "", b: "", c: "" }); avisar("Contraseña actualizada.") }
        catch (err) { avisar(err.response?.data?.message || "No se pudo cambiar la contraseña.") } finally { setOcupado(false) }
      },
      salir, toast,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [u, mem, sh, e, p, show, ocupado, toast, c, sesion])

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
      <input ref={archivo} type="file" accept="image/*" onChange={subirFoto} style={{ display: "none" }} />
    </>
  )
}
