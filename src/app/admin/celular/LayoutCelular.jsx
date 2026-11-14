import { useCallback, useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import apiClient from "@/api"
import { useTheme } from "@/components/theme-provider"
import BravoChat from "@/components/BravoChat"
import { ContextoCelular } from "./contexto"
import { sinMenuCelular } from "./rutas"
import { OSCURO, CLARO } from "./paleta"
import { Menu } from "./pantallas/MenuView"
import { Extras as Superpuestos, estilosHover as hoverSuperpuestos } from "./pantallas/NotificacionesView"
import { etiquetaDia, haceTiempo } from "@/lib/fechasNotificaciones"
import { PANELES, panelesPermitidos } from "@/lib/paneles"
import { cerrarSesionEnServidor } from "@/lib/sesion"

const I = { home: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", users: "M16 19a5 5 0 0 0-10 0M11 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM21 19a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8", cal: "M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM16 3v4M8 3v4M3 10h18", card: "M3 6h18v12H3zM3 10h18", menu: "M4 6h16M4 12h16M4 18h16" }

// Marco del admin en celular (menos de 768 px): fondo, menú inferior flotante, mascota y paso de las rutas internas
export default function LayoutCelular({ children }) {
  const { theme } = useTheme()
  const oscuro = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
  const c = oscuro ? OSCURO : CLARO
  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  // Notificaciones: el contador de la campana se renueva cada 30 s y al volver a la app
  const [notifs, setNotifs] = useState([])
  const [noLeidas, setNoLeidas] = useState(0)
  const recargarNotifs = useCallback(() => {
    apiClient.get("/notificaciones")
      .then((res) => { const d = res.data?.data || {}; setNotifs(d.notificaciones || []); setNoLeidas(d.noLeidas || 0) })
      .catch(() => {})
  }, [])
  useEffect(() => {
    recargarNotifs()
    const t = setInterval(recargarNotifs, 30000)
    const alVolver = () => { if (!document.hidden) recargarNotifs() }
    document.addEventListener("visibilitychange", alVolver)
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", alVolver) }
  }, [recargarNotifs])
  // Bandeja de notificaciones y hoja del perfil (referencia 18): se abren sobre cualquier pantalla
  const [panel, setPanel] = useState(null) // null | "n" | "p"
  const [filtroNotif, setFiltroNotif] = useState("todas")
  const [aviso, setAviso] = useState(true)
  const abrirNotif = useCallback(() => { recargarNotifs(); setPanel("n") }, [recargarNotifs])
  const abrirCuenta = useCallback(() => setPanel("p"), [])
  const cerrarPanel = useCallback(() => setPanel(null), [])
  useEffect(() => {
    if (!panel) return undefined
    const tecla = (e) => { if (e.key === "Escape") setPanel(null) }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [panel])
  // Avisos globales (toast.success, toast.error…): salen abajo, arriba del menú, y se van solos
  const [avisos, setAvisos] = useState([])
  useEffect(() => {
    const alAviso = (e) => {
      const { tipo, titulo, mensaje, guardar } = e.detail || {}
      const id = Date.now() + Math.random()
      setAvisos((p) => [...p.filter((a) => !(a.titulo === titulo && a.mensaje === mensaje)), { id, tipo, titulo, mensaje }].slice(-3))
      setTimeout(() => setAvisos((p) => p.filter((a) => a.id !== id)), tipo === "error" || tipo === "advertencia" ? 5000 : 3500)
      if (guardar) apiClient.post("/notificaciones/registro", { tipo, titulo, mensaje }).then(() => recargarNotifs()).catch(() => {})
    }
    window.addEventListener("bravos:notif", alAviso)
    return () => window.removeEventListener("bravos:notif", alAviso)
  }, [recargarNotifs])
  const [menuOculto, setMenuOculto] = useState(false) // pantallas que lo piden (formularios con botón fijo abajo)
  const sesion = useMemo(() => { try { return JSON.parse(localStorage.getItem("usuario") || "{}") } catch { return {} } }, [])

  const tabs = useMemo(() => {
    const activa = pathname === "/admin" || pathname === "/admin/" ? "Inicio" : pathname.startsWith("/admin/usuarios") ? "Usuarios" : pathname.startsWith("/admin/planes") ? "Planes" : pathname.startsWith("/admin/mas") || pathname.startsWith("/admin/perfil") || pathname.startsWith("/mi-configuracion") ? "Más" : null
    return [["Inicio", I.home, "/admin"], ["Usuarios", I.users, "/admin/usuarios"], ["Clases", I.cal, "/admin/clases", "fab"], ["Planes", I.card, "/admin/planes"], ["Más", I.menu, "/admin/mas"]].map(([label, d, href, k]) => {
      const cur = !k && activa === label, fab = k === "fab"
      return { label, d, href, cur: cur ? "page" : undefined, aria: fab ? "Clases" : undefined, fg: (cur || fab) ? c.okFg : c.muted, font: (cur || fab) ? "700 11px Archivo" : "600 11px Archivo", w: fab ? "60px" : "52px", h: fab ? "60px" : "30px", mt: fab ? "-30px" : "0", r: fab ? "50%" : "15px", bg: fab ? "#9be600" : (cur ? c.okBg : "transparent"), ic: fab ? "#0b0b0b" : "currentColor", bd: fab ? "4px solid " + c.bg : "none", sh: fab ? "0 0 0 1px rgba(155,230,0,.4), 0 8px 24px rgba(155,230,0,.25)" : "none" }
    })
  }, [pathname, c])

  const leerUna = (n) => {
    if (n.leida) return
    apiClient.patch(`/notificaciones/${n.idNotificacion}/leer`).catch(() => {})
    setNotifs((prev) => prev.map((x) => (x.idNotificacion === n.idNotificacion ? { ...x, leida: true } : x)))
    setNoLeidas((prev) => Math.max(0, prev - 1))
  }
  const leerTodas = () => {
    apiClient.patch("/notificaciones/leer-todas").catch(() => {})
    setNotifs((prev) => prev.map((x) => ({ ...x, leida: true })))
    setNoLeidas(0)
  }
  const salir = () => { cerrarSesionEnServidor(); localStorage.removeItem("usuario"); localStorage.removeItem("avatarUrl"); localStorage.removeItem("permisos"); navigate("/login", { replace: true }) }
  const icono = (n) => (n.tipo === "credito" ? I.money : n.tipo === "reserva" || n.tipo === "asistencia" ? I.cal : /nueva clase|clase creada/i.test(n.titulo || "") ? "M12 5v14M5 12h14" : I.users)
  const vSuper = useMemo(() => {
    const lista = filtroNotif === "todas" ? notifs : notifs.filter((n) => !n.leida)
    const ng = []
    lista.forEach((n) => {
      const dia = etiquetaDia(n.creadoEn).toUpperCase()
      let g = ng.find((x) => x.t === dia)
      if (!g) { g = { t: dia, items: [] }; ng.push(g) }
      const u = !n.leida
      g.items.push({ t: n.titulo, b: n.mensaje, time: haceTiempo(n.creadoEn), d: icono(n), bg: u ? (oscuro ? "#10160a" : "#f3f8e8") : "transparent", dot: u ? "#9be600" : "transparent", tf: u ? "800" : "600", aria: (u ? "Sin leer. " : "") + n.titulo + ". " + n.mensaje, open: () => { leerUna(n); if (n.link) { setPanel(null); navigate(n.link) } } })
    })
    const permitidos = panelesPermitidos()
    const etiqueta = { admin: "Admin", profesor: "Profesor", alumno: "Alumno" }
    const enIphone = /iPhone|iPad/.test(navigator.userAgent) && !window.navigator.standalone
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, nOn: panel === "n", pOn: panel === "p", closeAll: cerrarPanel, unread: noLeidas, noUn: noLeidas === 0, raFg: noLeidas ? c.okFg : c.muted, readAll: leerTodas,
      nf: [["todas", "Todas", notifs.length], ["sin", "Sin leer", noLeidas]].map(([id, l, n]) => { const p = (filtroNotif === "todas") === (id === "todas"); return { l, n, p: p ? "true" : "false", bg: p ? c.ink : "transparent", fg: p ? c.bg : c.ink, bd: p ? c.ink : c.btnLine, pick: () => setFiltroNotif(id === "todas" ? "todas" : "sin") } }),
      tipOn: aviso && enIphone, hideTip: () => setAviso(false), nEmpty: lista.length === 0, ng,
      pans: PANELES.filter((p) => permitidos[p.key]).map((p) => ({ key: p.key, l: etiqueta[p.key], ch: p.key === "admin" ? "true" : "false", bg: p.key === "admin" ? "#9be600" : "transparent", fg: p.key === "admin" ? "#0b0b0b" : c.ink, pick: () => { if (p.key !== "admin") { setPanel(null); navigate(p.href) } } })),
      iniciales: nombre.split(/s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD", nombre, correo: sesion.correo || "", hrefPerfil: "/admin/perfil", salir, toast: null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c, oscuro, panel, filtroNotif, notifs, noLeidas, aviso, sesion])

  // Los enlaces del diseño navegan dentro de la app (sin recargar); los "#" solo disparan su acción
  const alTocar = (e) => {
    const a = e.target.closest?.("a[href]")
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank") return
    const href = a.getAttribute("href")
    if (href === "#") { e.preventDefault(); return }
    if (href && href.startsWith("/") && !href.startsWith("//")) { e.preventDefault(); navigate(href) }
  }

  return (
    <ContextoCelular.Provider value={{ c, oscuro, notifs, noLeidas, recargarNotifs, setNoLeidas, setNotifs, sesion, abrirNotif, abrirCuenta, setMenuOculto }}>
      <div className="dc-pantalla" onClickCapture={alTocar} style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", position: "relative", background: c.bg, color: c.ink, fontFamily: "Archivo, sans-serif" }}>
        <style>{".dc-pantalla *, .dc-pantalla *::before, .dc-pantalla *::after { box-sizing: content-box; } .dc-pantalla img, .dc-pantalla svg { display: inline; vertical-align: baseline; } .dcx > * { pointer-events: auto; }"}</style>
        {children}
        {(sinMenuCelular(pathname) || menuOculto) ? null : <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 30 }}><Menu v={{ c, tabs }} /></div>}
        <div role="status" aria-live="polite" style={{ position: "fixed", left: "16px", right: "16px", bottom: "calc(108px + env(safe-area-inset-bottom, 0px))", zIndex: 70, display: "flex", flexDirection: "column", gap: "8px", pointerEvents: "none" }}>{avisos.map((a) => (<div key={a.id} style={{ padding: "12px 14px", borderRadius: "12px", background: "#141510", color: "#ecefe4", border: `1px solid ${a.tipo === "error" ? "#6b2a24" : "#3d5a10"}`, font: "600 14px Archivo" }}>{a.titulo}{a.mensaje ? <span style={{ display: "block", font: "400 13px Archivo", color: "#a3a698" }}>{a.mensaje}</span> : null}</div>))}</div>
        {panel ? <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60 }}><style>{hoverSuperpuestos(vSuper)}</style><Superpuestos v={vSuper} /></div> : null}
        {(sinMenuCelular(pathname) || menuOculto) ? null : <BravoChat rol="admin" />}
      </div>
    </ContextoCelular.Provider>
  )
}
