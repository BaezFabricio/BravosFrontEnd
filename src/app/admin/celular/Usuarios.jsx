import { useEffect, useMemo, useState } from "react"
import apiClient from "@/api"
import { enlaceWhatsApp } from "@/lib/whatsapp"
import AlumnoSinCuentaDialog from "../usuarios/AlumnoSinCuentaDialog"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/UsuariosView"

const DEF = { perfil: "", plan: "", hora: "", orden: "nombre" }
const PERFILES = ["", "Alumno", "Profesor", "Admin"]
const fechaLarga = (valor) => {
  if (!valor) return ""
  const [y, m, d] = String(valor).slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return ""
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "")
}
const perfilTexto = (u) => { const p = String(u.nombrePerfil || u.perfil || "").trim(); return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : "Sin perfil" }
const iniciales = (n = "") => n.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "?"

// Usuarios del admin en celular (referencia 02): lista, filtros y ficha corta. Los datos son los de /usuarios.
export default function UsuariosCelular() {
  const { c, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const [usuarios, setUsuarios] = useState(null)
  const [opciones, setOpciones] = useState({ planes: [], horas: [] })
  const [error, setError] = useState(false)
  const [f, setF] = useState("todos")
  const [q, setQ] = useState("")
  const [sel, setSel] = useState(null)
  const [fil, setFil] = useState(false)
  const [ap, setAp] = useState(null)
  const [dr, setDr] = useState(null)
  const [sinCuenta, setSinCuenta] = useState(false)
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const puede = (p) => permisos.includes(p) || permisos.includes(p.replace(":consulta", ":ver"))

  const cargar = () => {
    apiClient.get("/usuarios").then((r) => { const l = r.data?.data || r.data; setUsuarios(Array.isArray(l) ? l : []) }).catch(() => setError(true))
  }
  useEffect(() => {
    cargar()
    apiClient.get("/usuarios/filtros").then((r) => { const d = r.data?.data; if (d) setOpciones({ planes: d.planes || [], horas: d.horas || [] }) }).catch(() => {})
  }, [])

  // Escape: cierra los filtros o la ficha
  useEffect(() => {
    const tecla = (e) => { if (e.key === "Escape") { if (fil) { setFil(false); setDr(null) } else setSel(null) } }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [fil])

  const v = useMemo(() => {
    const loading = !usuarios && !error
    // Cada usuario como lo muestra el diseño
    const U = (usuarios || []).map((u) => {
      const id = u.idUsuario || u.id
      const nombre = u.nombre || u.nombrecompleto || ""
      const mem = String(u.membresia || "").toLowerCase()
      const vigente = mem === "vigente" || mem === "activa" || mem === "activo" || mem === "por_vencer"
      const k = u.estado === "inactivo" ? "ina" : vigente ? "act" : "pend"
      const plan = (u.planes || [])[0]
      const venc = fechaLarga(u.fechaVencimiento)
      return {
        id, name: nombre, ini: iniciales(nombre), email: u.email || u.correo || "", dni: u.dni || "—", tel: u.telefono || "—", telRaw: u.telefono || "",
        perfil: perfilTexto(u), k, cred: Number(u.creditos) || 0,
        planes: (u.planes || []).map((p) => String(p.idPlan)), horas: u.horas || [],
        plan: plan ? plan.nombre : "Sin plan activo",
        vence: venc ? `${k === "act" ? "Vence" : "Venció"} el ${venc}` : "Sin vencimiento",
        sinAcceso: Boolean(u.sinAcceso),
      }
    })
    const ST = { act: ["Activo", c.okFg, "#9be600", c.okBg, c.okLine], pend: ["Pago pendiente", c.warnFg, c.warnFg, c.warnBg, c.warnLine], ina: ["Inactivo", c.muted, c.btnLine, "transparent", c.btnLine] }
    const cnt = (k) => U.filter((u) => u.k === k).length
    const busqueda = q.trim().toLowerCase()
    const AP = ap || DEF, DR = dr || AP
    const correr = (F) => U.filter((u) => (f === "todos" || u.k === f) && (!busqueda || (u.name + u.dni + u.email).toLowerCase().includes(busqueda))
      && (!F.perfil || u.perfil === F.perfil) && (!F.plan || u.planes.includes(F.plan)) && (!F.hora || u.horas.includes(F.hora)))
      .sort((a, b) => F.orden === "activa" ? ((a.k === "act" ? 0 : 1) - (b.k === "act" ? 0 : 1)) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name))
    const lista = loading ? [] : correr(AP)
    const nBorrador = correr(DR).length
    const opt = (key, vals, etiquetas) => vals.map((val, i) => {
      const ch = DR[key] === val
      return { l: etiquetas[i], ch: ch ? "true" : "false", bg: ch ? "#9be600" : "transparent", fg: ch ? "#0b0b0b" : c.ink, bd: ch ? "#9be600" : c.btnLine, rowBg: ch ? c.okBg : c.surf, rowBd: ch ? "#9be600" : c.line2, rd: ch ? "6px solid #9be600" : "2px solid " + c.btnLine, rBg: ch ? "#0b0b0b" : "transparent", pick: () => setDr((s) => ({ ...(s || ap || DEF), [key]: val })) }
    })
    const planNombre = (id) => (opciones.planes.find((p) => String(p.idPlan) === id) || {}).nombre || ""
    const aplicados = [AP.perfil && ["perfil", "Perfil: " + AP.perfil], AP.plan && ["plan", planNombre(AP.plan)], AP.hora && ["hora", "Clase " + AP.hora], AP.orden !== "nombre" && ["orden", "Activa primero"]].filter(Boolean)
    const igual = (A, B) => ["perfil", "plan", "hora", "orden"].every((k) => A[k] === B[k])
    const deco = (u, i) => {
      const s = ST[u.k]
      return {
        ...u, sep: i ? c.line2 : "transparent", admin: u.perfil === "Admin", st: s[0], stFg: s[1], dot: s[2],
        avBg: u.k === "act" ? "#9be600" : c.surf, avFg: u.k === "act" ? "#0b0b0b" : c.ink,
        cred: u.cred === 1 ? "1 crédito" : u.cred + " créditos", credN: String(u.cred), credFg: u.cred ? c.okFg : c.muted,
        aria: `${u.name}, ${s[0]}, ${u.cred} créditos. Ver detalle`,
        stUp: s[0].toUpperCase(), chBg: s[3], chBd: s[4], mBg: u.k === "act" ? c.surf : s[3], mBd: u.k === "act" ? c.line2 : s[4],
        primary: u.k === "act" ? "VER ABONOS" : "CARGAR ABONO", second: u.k === "act" ? "Cargar abono" : "Ver abonos",
        hrefPrimario: u.k === "act" ? `/admin/usuarios/${u.id}` : `/admin/usuarios/abonos/carga-masiva?usuario=${u.id}`,
        hrefSegundo: u.k === "act" ? `/admin/usuarios/abonos/carga-masiva?usuario=${u.id}` : `/admin/usuarios/${u.id}`,
        hrefEditar: `/admin/usuarios/${u.id}/editar`,
        wa: enlaceWhatsApp(u.telRaw, "") || "#",
        open: () => setSel(u.id),
      }
    }
    const filas = lista.map(deco)
    const elegido = U.find((u) => u.id === sel)
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, loading, q, onQ: (ev) => setQ(ev.target.value),
      filtros: [["todos", "Todos", U.length], ["act", "Activos", cnt("act")], ["pend", "Pago pendiente", cnt("pend")], ["ina", "Inactivos", cnt("ina")]].map(([id, l, n]) => { const p = f === id; return { l, n, p: p ? "true" : "false", bg: p ? c.ink : "transparent", fg: p ? c.bg : c.ink, bd: p ? c.ink : c.btnLine, pick: () => setF(id) } }),
      countLabel: loading ? "CARGANDO…" : error ? "NO SE PUDO CARGAR" : lista.length === 1 ? "1 USUARIO" : lista.length + " USUARIOS",
      openFil: () => { setFil(true); setDr(AP) }, closeFil: () => { setFil(false); setDr(null); setTimeout(() => document.getElementById("btn-fil")?.focus(), 0) },
      fil, nAct: aplicados.length || false, filAria: aplicados.length ? `Filtros, ${aplicados.length} aplicados` : "Filtros",
      filBg: aplicados.length ? c.okBg : c.card, filBd: aplicados.length ? "#9be600" : c.line, filFg: aplicados.length ? c.okFg : c.ink,
      actChips: aplicados.map(([k, l]) => ({ l, aria: "Quitar filtro " + l, rm: () => setAp({ ...AP, [k]: DEF[k] }) })),
      clearFil: () => setAp(null),
      d: {
        perfil: opt("perfil", PERFILES, ["Todos", "Alumno", "Profesor", "Admin"]),
        plan: opt("plan", ["", ...opciones.planes.map((p) => String(p.idPlan))], ["Todos", ...opciones.planes.map((p) => p.nombre)]),
        hora: opt("hora", ["", ...opciones.horas], ["Todas", ...opciones.horas]),
        orden: opt("orden", ["nombre", "activa"], ["Nombre (A–Z)", "Membresía activa primero"]),
      },
      resetDraft: () => setDr(DEF), draftClean: igual(DR, DEF), rdFg: igual(DR, DEF) ? c.muted : c.ink,
      noRes: !nBorrador, apBg: nBorrador ? "#9be600" : c.line2, apFg: nBorrador ? "#0b0b0b" : c.muted,
      apLabel: nBorrador ? (nBorrador === 1 ? "Ver 1 usuario" : `Ver ${nBorrador} usuarios`) : "Sin resultados",
      applyFil: () => { setAp(DR); setDr(null); setFil(false); setTimeout(() => document.getElementById("btn-fil")?.focus(), 0) },
      users: filas, empty: !loading && !lista.length, listBd: lista.length ? c.line : "transparent", clear: () => { setQ(""); setF("todos"); setAp(null) },
      sheet: !!elegido, s: elegido ? deco(elegido, 0) : {}, close: () => setSel(null), toast: null,
      iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif, abrirCuenta,
      abrirSinCuenta: () => setSinCuenta(true),
    }
  }, [usuarios, error, opciones, c, f, q, sel, fil, ap, dr, noLeidas, sesion, abrirNotif, abrirCuenta])

  if (!puede("usuarios:consulta")) return <div style={{ padding: "32px 16px", color: c.muted, font: "500 14px Archivo" }}>No tenés permiso para ver los usuarios.</div>

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
      <AlumnoSinCuentaDialog open={sinCuenta} onOpenChange={setSinCuenta} onCreado={cargar} />
    </>
  )
}
