import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { cerrarSesionEnServidor } from "@/lib/sesion"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/MasView"

// Íconos y permisos de cada opción (los mismos del menú de siempre)
const GRUPOS = [
  ["GESTIÓN", [
    ["Reportes", "M4 20V10M10 20V4M16 20v-7M22 20H2", "/admin/reportes", "dashboard:consulta"],
    ["Check-in", "M16 19a5 5 0 0 0-10 0M11 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 11l2 2 4-4", "/admin/check-in", "configuracion:consulta"],
    ["Novedades", "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0", "/admin/novedades", "configuracion:consulta"],
    ["Ejercicios", "M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12", "/admin/ejercicios-rm", "configuracion:consulta"],
    ["Avisos por WhatsApp", "M3 21l1.6-4.6A8.5 8.5 0 1 1 8 19.6z", "/admin/avisos", "clases:consulta"],
  ]],
  ["SISTEMA", [
    ["Perfiles y permisos", "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "/admin/perfiles", "perfiles:consulta"],
    ["Configuración del box", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z", "/admin/configuracion", "configuracion:consulta"],
  ]],
]

// "Más" del admin en celular (referencia 17)
export default function MasCelular() {
  const { c, oscuro, noLeidas, sesion, abrirNotif, abrirCuenta } = useCelular()
  const { setTheme } = useTheme()
  const navigate = useNavigate()
  const [out, setOut] = useState(false)
  const permisos = useMemo(() => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }, [])
  const tiene = (p) => permisos.includes(p) || permisos.includes(p.replace(":consulta", ":ver"))

  const v = useMemo(() => {
    const nombre = (sesion.nombrecompleto || "").trim()
    return {
      c, dkA: oscuro ? "true" : "false", togDk: () => setTheme(oscuro ? "light" : "dark"),
      swBg: oscuro ? "#9be600" : c.btnLine, swJ: oscuro ? "flex-end" : "flex-start", swK: oscuro ? "#0b0b0b" : c.ink,
      grupos: GRUPOS.map(([t, its]) => ({ t, items: its.filter((i) => tiene(i[3])).map(([tt, d, href], i) => ({ t: tt, d, href, sep: i ? c.line2 : "transparent" })) })).filter((g) => g.items.length),
      out, askOut: () => setOut(true), stay: () => setOut(false),
      salir: () => { cerrarSesionEnServidor(); localStorage.removeItem("usuario"); localStorage.removeItem("avatarUrl"); localStorage.removeItem("permisos"); navigate("/login", { replace: true }) },
      toast: null,
      nombre, rol: (sesion.perfil || "Admin").trim(), iniciales: nombre.split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "AD",
      hrefPerfil: "/admin/perfil",
      noLeidas, ariaNotif: `Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`, abrirNotif,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c, oscuro, out, noLeidas, sesion, navigate, setTheme, permisos])

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
