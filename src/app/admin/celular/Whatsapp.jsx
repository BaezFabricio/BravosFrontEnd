import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import apiClient from "@/api"
import { enlaceWhatsApp } from "@/lib/whatsapp"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/WhatsappView"

const MOD = {
  Feriado: ["Feriado", "El box permanece cerrado por feriado. Retomamos el horario habitual al día siguiente."],
  Cuota: ["Recordatorio de cuota", "Te recordamos que tu cuota vence el día 10. Podés pagar en el box o por transferencia."],
  "Clase suspendida": ["Clase suspendida", "La clase de hoy queda suspendida. Te avisamos cuando se reprograme."],
}
const ini = (n = "") => n.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?"

// Avisos por WhatsApp del admin en celular (referencia 14): se elige a quién escribirle y se arma el aviso; se abre WhatsApp con el texto
export default function WhatsappCelular() {
  const { c, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puedeVer = permisos.includes("clases:consulta") || permisos.includes("clases:ver")
  const [usuarios, setUsuarios] = useState(null)
  const [q, setQ] = useState("")
  const [to, setTo] = useState(null)
  const [tit, setTit] = useState("")
  const [msg, setMsg] = useState("")
  const [mod, setMod] = useState(null)
  const [toast, setToast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 3000) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])
  useEffect(() => {
    if (!puedeVer) return
    apiClient.get("/usuarios").then((r) => { const l = r.data?.data || r.data; setUsuarios(Array.isArray(l) ? l : []) }).catch(() => { setUsuarios([]); avisar("No se pudieron cargar los alumnos.") })
  }, [puedeVer, avisar])

  const v = useMemo(() => {
    const A = (usuarios || []).map((u) => ({ n: u.nombre || u.nombrecompleto || "", t: u.telefono || "", dni: u.dni || "", img: u.avatarUrl || null, activo: u.estado !== "inactivo" })).filter((u) => u.n && u.t && u.activo).sort((a, b) => a.n.localeCompare(b.n))
    const busq = q.trim().toLowerCase()
    const L = A.filter((a) => !busq || (a.n + a.dni).toLowerCase().includes(busq))
    const primero = to && to.all ? "todos" : to ? (to.n.split(" ")[1] || to.n) : ""
    const vacio = !msg.trim()
    const textoAviso = (tit.trim() ? "*" + tit.trim() + "*\n" : "") + msg
    const enlace = to ? (to.all ? `https://wa.me/?text=${encodeURIComponent(textoAviso)}` : enlaceWhatsApp(to.t, textoAviso)) : null
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, lista: !to, comp: !!to, hT: to ? (to.all ? "Alumnos Bravos" : to.n) : "Avisos por WhatsApp", hS: to ? (to.all ? "Grupo o lista de difusión" : to.t) : "", back: () => setTo(null),
      q, onQ: (ev) => setQ(ev.target.value), nA: L.length, noRes: usuarios !== null && !L.length, lBd: L.length ? c.line : "transparent",
      pickAll: () => setTo({ all: true }),
      alumnos: L.map((a, i) => ({ ini: ini(a.n), img: a.img, n: a.n, t: a.t, sep: i ? c.line2 : "transparent", aria: "Escribir a " + a.n, pick: () => setTo(a) })),
      modelos: Object.keys(MOD).map((l) => { const p = mod === l; return { l, p: p ? "true" : "false", bg: p ? c.ink : "transparent", fg: p ? c.bg : c.ink, bd: p ? c.ink : c.btnLine, pick: () => { setMod(l); setTit(MOD[l][0]); setMsg(MOD[l][1]) } } }),
      tit, onTit: (ev) => setTit(ev.target.value), msg, onMsg: (ev) => { setMsg(ev.target.value); setMod(null) },
      ph: "Escribí el aviso para " + primero + "…", mN: String(msg.length), mInv: "false", mBd: c.line,
      pvTit: tit.trim() || false, pvMsg: msg || "Tu aviso aparece acá mientras lo escribís.", pvOp: msg ? 1 : 0.6,
      empty: vacio, cpFg: vacio ? c.muted : c.ink, sBg: vacio ? c.line2 : "#25d366", sFg: vacio ? c.muted : "#04210f", sL: to && to.all ? "Enviar al grupo" : "Enviar a " + primero,
      copy: () => { try { navigator.clipboard.writeText(textoAviso) } catch { /* sin portapapeles */ } avisar("Aviso copiado.") },
      send: () => { if (vacio) return; if (!enlace) { avisar("Ese número no es válido para WhatsApp."); return } avisar("Abriendo WhatsApp…"); window.open(enlace, "_blank", "noopener") },
      toast,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
    }
  }, [usuarios, q, to, tit, msg, mod, toast, c, noLeidas, sesion, abrirNotif, abrirCuenta, avisar])

  if (!puedeVer) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver los avisos.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
