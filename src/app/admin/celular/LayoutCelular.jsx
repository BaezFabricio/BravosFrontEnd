import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate, useNavigationType } from "react-router-dom"
import apiClient from "@/api"
import { useTheme } from "@/components/theme-provider"
import BravoChat from "@/components/BravoChat"
import BandejaMovil from "@/components/BandejaMovil"
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
  // Avisos globales (toast.success, toast.error…): los dibuja Sileo; acá solo se guarda en el historial lo importante
  useEffect(() => {
    const alAviso = (e) => {
      const { tipo, titulo, mensaje, guardar } = e.detail || {}
      if (guardar) apiClient.post("/notificaciones/registro", { tipo, titulo, mensaje }).then(() => recargarNotifs()).catch(() => {})
    }
    window.addEventListener("bravos:notif", alAviso)
    return () => window.removeEventListener("bravos:notif", alAviso)
  }, [recargarNotifs])
  const [menuOculto, setMenuOculto] = useState(false) // pantallas que lo piden (formularios con botón fijo abajo)

  // El menú de abajo se achica cuando se baja un buen tramo y vuelve a su tamaño al subir, al llegar arriba, al cambiar de pantalla
  // o al tocarlo (así el toque siempre cae en un botón grande). En pantallas cortas (sin scroll de verdad) no se achica.
  const [compacta, setCompacta] = useState(false)
  const reposo = useRef(0) // hasta cuándo se queda grande después de tocarlo
  const alTocarMenu = useCallback(() => { reposo.current = performance.now() + 2500; setCompacta(false) }, [])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setCompacta(false)
    let ultimo = window.scrollY
    let bajado = 0 // cuánto se bajó seguido (se reinicia al subir)
    const alScroll = () => {
      const y = window.scrollY
      const dy = y - ultimo
      if (Math.abs(dy) < 4) return // ignora temblores
      ultimo = y
      if (performance.now() < reposo.current) return
      const sobra = document.documentElement.scrollHeight - window.innerHeight
      if (y < 40 || dy < 0 || sobra < 160) { bajado = 0; setCompacta(false); return }
      bajado += dy
      if (bajado > 48) setCompacta(true)
    }
    window.addEventListener("scroll", alScroll, { passive: true })
    return () => window.removeEventListener("scroll", alScroll)
  }, [pathname])
  // Deslizar el dedo por el menú de abajo para elegir un módulo: la opción que queda bajo el dedo se resalta (y vibra un poquito
  // al cambiar) y al soltar se abre. Un toque normal funciona igual que siempre.
  const enlacesMenu = useRef([])
  const inicioToque = useRef(null)
  const arrastro = useRef(false)
  const ignorarClic = useRef(false)
  const tocada = useRef(-1) // opción sobre la que se apoyó el dedo (un toque se decide por ella, no por lo que quede bajo el dedo al soltar)
  const [sobre, setSobre] = useState(null)
  const [dedo, setDedo] = useState(null) // { x, y } del dedo dentro del menú, mientras lo toca
  const [ondas, setOndas] = useState([]) // ondas de agua: [{ id, x, y }]
  const ultimaOnda = useRef({ x: -999, t: 0 })
  const opcionBajo = (x) => {
    let mejor = null, distancia = Infinity
    enlacesMenu.current.forEach((el, i) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      const d = x < r.left ? r.left - x : x > r.right ? x - r.right : 0
      if (d < distancia) { distancia = d; mejor = i }
    })
    return mejor
  }
  const posicionEnMenu = (e) => { const r = e.currentTarget.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top } }
  // Efecto agua: al tocar sale una onda del dedo y, al deslizar, deja una estela de ondas a su paso
  const soltarOnda = (p) => {
    setOndas((prev) => [...prev.slice(-3), { id: performance.now() + Math.random(), x: p.x, y: p.y }])
    ultimaOnda.current = { x: p.x, t: performance.now() }
  }
  const alBajarMenu = (e) => {
    alTocarMenu()
    const p = posicionEnMenu(e)
    inicioToque.current = { x: e.clientX, y: e.clientY }
    arrastro.current = false
    tocada.current = enlacesMenu.current.findIndex((el) => el && el.contains(e.target))
    setDedo(p)
    soltarOnda(p)
  }
  const alMoverMenu = (e) => {
    if (!inicioToque.current || (e.pointerType === "mouse" && e.buttons === 0)) return
    const p = posicionEnMenu(e)
    setDedo(p)
    if (!arrastro.current && Math.hypot(e.clientX - inicioToque.current.x, e.clientY - inicioToque.current.y) > 12) arrastro.current = true
    if (arrastro.current) {
      const i = opcionBajo(e.clientX)
      setSobre((previa) => { if (previa !== i && previa !== null) navigator.vibrate?.(8); return i })
    }
    // Una onda nueva cada ~56 px recorridos (o cada 380 ms): parece una estela en el agua
    const ult = ultimaOnda.current
    if (Math.abs(p.x - ult.x) > 56 || performance.now() - ult.t > 380) soltarOnda(p)
  }
  const terminarToque = () => { inicioToque.current = null; arrastro.current = false; tocada.current = -1; setSobre(null); setDedo(null) }
  const alSoltarMenu = () => {
    // Al apoyar el dedo en el menú achicado, éste se agranda y las opciones se corren: el toque se resuelve acá con la opción donde se
    // apoyó el dedo, en vez de dejarlo al clic del navegador (que podía caer en otra opción o perderse).
    const elegida = arrastro.current ? (sobre !== null ? tabs[sobre] : null) : (inicioToque.current && tocada.current >= 0 ? tabs[tocada.current] : null)
    if (elegida) {
      ignorarClic.current = true // el navegador igual dispara un clic al soltar: se descarta
      setTimeout(() => { ignorarClic.current = false }, 350)
      if (elegida.href && elegida.href !== "#") navigate(elegida.href)
    }
    terminarToque()
  }

  // Al entrar a una pantalla desliza desde la derecha; al volver (atrás), desde la izquierda
  const tipoNavegacion = useNavigationType()
  const sesion = useMemo(() => { try { return JSON.parse(localStorage.getItem("usuario") || "{}") } catch { return {} } }, [])

  const tabs = useMemo(() => {
    const activa = pathname === "/admin" || pathname === "/admin/" ? "Inicio" : pathname.startsWith("/admin/usuarios") ? "Usuarios" : pathname.startsWith("/admin/clases") ? "Clases" : pathname.startsWith("/admin/planes") ? "Planes" : pathname.startsWith("/admin/mas") || pathname.startsWith("/admin/perfil") || pathname.startsWith("/mi-configuracion") ? "Más" : null
    return [["Inicio", I.home, "/admin"], ["Usuarios", I.users, "/admin/usuarios"], ["Clases", I.cal, "/admin/clases", "fab"], ["Planes", I.card, "/admin/planes"], ["Más", I.menu, "/admin/mas"]].map(([label, d, href, k]) => {
      const cur = activa === label, fab = k === "fab"
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
  // La hoja de notificaciones se desliza al abrir y al cerrar (al cerrar espera a que termine la salida)
  const [cerrandoNotif, setCerrandoNotif] = useState(false)
  const [nodoEncab, setNodoEncab] = useState(null) // donde la bandeja dibuja el cartel de nuevas y sus acciones
  const cerrarNotif = () => { setCerrandoNotif(true); setTimeout(() => { setPanel(null); setCerrandoNotif(false) }, 240) }
  const borrarUna = (n) => {
    setNotifs((prev) => prev.filter((x) => x.idNotificacion !== n.idNotificacion))
    if (!n.leida) setNoLeidas((prev) => Math.max(0, prev - 1))
    apiClient.delete(`/notificaciones/${n.idNotificacion}`).catch(() => recargarNotifs())
  }
  const borrarTodas = () => {
    setNotifs([]); setNoLeidas(0)
    apiClient.delete("/notificaciones").catch(() => recargarNotifs())
  }
  const abrirDeBandeja = (n) => { leerUna(n); if (n.link) { cerrarNotif(); setTimeout(() => navigate(n.link), 120) } }
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
      c, nOn: false, pOn: panel === "p", closeAll: cerrarPanel, unread: noLeidas, noUn: noLeidas === 0, raFg: noLeidas ? c.okFg : c.muted, readAll: leerTodas,
      nf: [["todas", "Todas", notifs.length], ["sin", "Sin leer", noLeidas]].map(([id, l, n]) => { const p = (filtroNotif === "todas") === (id === "todas"); return { l, n, p: p ? "true" : "false", bg: p ? c.ink : "transparent", fg: p ? c.bg : c.ink, bd: p ? c.ink : c.btnLine, pick: () => setFiltroNotif(id === "todas" ? "todas" : "sin") } }),
      tipOn: aviso && enIphone, hideTip: () => setAviso(false), nEmpty: lista.length === 0, ng,
      pans: PANELES.filter((p) => permitidos[p.key]).map((p) => ({ key: p.key, l: etiqueta[p.key], ch: p.key === "admin" ? "true" : "false", bg: p.key === "admin" ? "#9be600" : "transparent", fg: p.key === "admin" ? "#0b0b0b" : c.ink, pick: () => { if (p.key !== "admin") { setPanel(null); navigate(p.href) } } })),
      iniciales: nombre.split(/s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD", nombre, correo: sesion.correo || "", hrefPerfil: "/admin/perfil", salir, toast: null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c, oscuro, panel, filtroNotif, notifs, noLeidas, aviso, sesion])

  // Los enlaces del diseño navegan dentro de la app (sin recargar); los "#" solo disparan su acción
  const alTocar = (e) => {
    if (ignorarClic.current) { e.preventDefault(); e.stopPropagation(); return }
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
        <div key={pathname} className={tipoNavegacion === "POP" ? "bv-ruta-atras" : "bv-ruta-adelante"} style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>{children}</div>
        {(sinMenuCelular(pathname) || menuOculto) ? null : <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 30 }}><Menu v={{ c, tabs, compacta, sobre, dedo, ondas, quitarOnda: (id) => setOndas((prev) => prev.filter((o) => o.id !== id)), enlaces: enlacesMenu, alBajar: alBajarMenu, alMover: alMoverMenu, alSoltar: alSoltarMenu, alCancelar: terminarToque }} /></div>}
        {panel ? <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60 }}><style>{hoverSuperpuestos(vSuper)}</style><Superpuestos v={vSuper} /></div> : null}
        {panel === "n" ? (
          <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 61 }}>
            <style>{"@keyframes bn-hoja-entra{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}@keyframes bn-hoja-sale{from{opacity:1;transform:none}to{opacity:0;transform:translateY(32px)}}@media (prefers-reduced-motion:reduce){.bn-hoja{animation:none!important}}"}</style>
            <div className="bn-hoja" role="dialog" aria-modal="true" aria-label="Notificaciones" style={{ position: "absolute", inset: 0, background: c.bg, display: "flex", flexDirection: "column", paddingTop: "env(safe-area-inset-top, 0px)", animation: cerrandoNotif ? "bn-hoja-sale .24s ease-in forwards" : "bn-hoja-entra .38s cubic-bezier(.16,1,.3,1) both" }}>
              <div style={{ flexShrink: 0, height: 60, display: "flex", alignItems: "center", padding: "0 10px 0 6px", borderBottom: `1px solid ${c.line}` }}>
                <button onClick={cerrarNotif} aria-label="Cerrar notificaciones" style={{ width: 44, height: 44, flexShrink: 0, border: "none", background: "transparent", color: c.ink, display: "grid", placeItems: "center", cursor: "pointer" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
                <div ref={setNodoEncab} style={{ flex: 1, minWidth: 0, display: "flex" }} />
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 16px 40px" }}>
                <BandejaMovil encabezadoEn={nodoEncab} notifs={notifs} filtro={filtroNotif} onFiltro={setFiltroNotif} noLeidas={noLeidas} onAbrir={abrirDeBandeja} onLeer={leerUna} onBorrar={borrarUna} onLeerTodo={leerTodas} onBorrarTodo={borrarTodas} />
              </div>
            </div>
          </div>
        ) : null}
        {(sinMenuCelular(pathname) || menuOculto) ? null : <BravoChat rol="admin" />}
      </div>
    </ContextoCelular.Provider>
  )
}
