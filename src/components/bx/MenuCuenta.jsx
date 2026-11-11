import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { PANELES, panelesPermitidos } from "@/lib/paneles"

/*
 * Menú de cuenta del módulo Alumno en escritorio (handoff, pantalla 11): avatar con nombre y correo,
 * "Cambiar de panel" con la lista visible (solo los paneles a los que la persona puede entrar),
 * Mi perfil, Mi configuración y Cerrar sesión. Flechas ↑↓ para moverse y Escape para cerrar.
 */

const ICONO_PANEL = { admin: IC.admin, alumno: IC.dumb, profesor: IC.profe }

function iniciales(nombre) {
  const partes = (nombre || "").trim().split(" ").filter(Boolean)
  if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase()
  return (partes[0] || "BR").substring(0, 2).toUpperCase()
}

export function AvatarBx({ nombre, url, tam = 40, className = "", estilo }) {
  return (
    <span
      style={{ width: `${tam / 16}rem`, height: `${tam / 16}rem`, fontSize: tam >= 48 ? "1rem" : "0.875rem", ...estilo }}
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-bx-lateral font-bold text-bx-lima ${className}`}
    >
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : iniciales(nombre)}
    </span>
  )
}

export function MenuCuenta({ userData, avatarUrl, onLogout, rutaPerfil, rutaConfiguracion, panelActual = "alumno" }) {
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [saliendo, setSaliendo] = useState(false)
  const raiz = useRef(null)
  const boton = useRef(null)

  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => { if (raiz.current && !raiz.current.contains(e.target)) setAbierto(false) }
    const tecla = (e) => {
      if (e.key === "Escape") { setAbierto(false); boton.current?.focus() }
    }
    document.addEventListener("mousedown", fuera)
    window.addEventListener("keydown", tecla)
    return () => {
      document.removeEventListener("mousedown", fuera)
      window.removeEventListener("keydown", tecla)
    }
  }, [abierto])

  const permitidos = panelesPermitidos()
  const paneles = PANELES.filter((p) => permitidos[p.key])

  const onKey = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    e.preventDefault()
    const els = Array.from(e.currentTarget.querySelectorAll('[role^="menuitem"]'))
    const i = els.indexOf(document.activeElement)
    const n = e.key === "ArrowDown" ? (i + 1) % els.length : (i - 1 + els.length) % els.length
    els[n]?.focus()
  }

  const itemClase = "flex min-h-11 items-center gap-3 rounded-[0.625rem] px-3 text-[0.9375rem] font-semibold text-bx-ink hover:bg-bx-surf"

  return (
    <div className="relative" ref={raiz}>
      <button
        ref={boton}
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-label={`Menú de cuenta de ${userData.nombrecompleto}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls="menu-cuenta"
        className="flex h-11 items-center gap-1.5 bg-transparent pl-0.5 pr-1.5 text-bx-ink transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <AvatarBx nombre={userData.nombrecompleto} url={avatarUrl} className={`box-border border-2 ${abierto ? "border-bx-lima" : "border-transparent"}`} />
        <Ico d={IC.chevDown} size={16} sw={2} className={`transition-transform duration-300 ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div
          id="menu-cuenta"
          role="menu"
          aria-label="Cuenta"
          onKeyDown={onKey}
          className="bx-pop absolute right-0 top-14 z-50 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-bx-line bg-bx-card shadow-[0_1rem_2.5rem_rgba(0,0,0,.35)]"
        >
          <div className="flex items-center gap-3 p-4">
            <AvatarBx nombre={userData.nombrecompleto} url={avatarUrl} tam={48} />
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-bx-ink">{userData.nombrecompleto}</div>
              <div className="truncate text-[0.8125rem] text-bx-muted">{userData.correo}</div>
            </div>
          </div>

          {paneles.length > 1 && (
            <div role="group" aria-labelledby="lbl-panel" className="px-4 pb-4">
              <div id="lbl-panel" className="mb-2 text-xs font-semibold tracking-[0.1em] text-bx-muted">CAMBIAR DE PANEL</div>
              <div className="flex flex-col gap-0.5">
                {paneles.map((p) => {
                  const actual = p.key === panelActual
                  return (
                    <button
                      key={p.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={actual}
                      onClick={() => { setAbierto(false); if (!actual) navigate(p.href) }}
                      className={`flex min-h-11 items-center gap-3 rounded-[0.625rem] border px-3 text-left text-[0.9375rem] text-bx-ink ${actual ? "border-bx-ok-line bg-bx-ok-bg font-bold" : "border-transparent font-semibold hover:bg-bx-surf"}`}
                    >
                      <Ico d={ICONO_PANEL[p.key]} className={actual ? "text-bx-ok-fg" : "text-bx-muted"} />
                      <span className="flex-1">{p.label}</span>
                      {actual && <Ico d={IC.check} size={18} sw={2.4} className="text-bx-lima" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div role="separator" className="h-px bg-bx-line" />
          <div className="p-2">
            <Link to={rutaPerfil} role="menuitem" onClick={() => setAbierto(false)} className={itemClase}>
              <Ico d={IC.user} className="text-bx-muted" />Mi perfil
            </Link>
            <Link to={rutaConfiguracion} role="menuitem" onClick={() => setAbierto(false)} className={itemClase}>
              <Ico d={IC.settings} className="text-bx-muted" />Mi configuración
            </Link>
          </div>
          <div role="separator" className="h-px bg-bx-line" />
          <div className="p-2">
            <button
              type="button"
              role="menuitem"
              disabled={saliendo}
              onClick={() => { setSaliendo(true); onLogout() }}
              className="flex min-h-11 w-full items-center gap-3 rounded-[0.625rem] px-3 text-left text-[0.9375rem] font-semibold text-bx-err-fg hover:bg-bx-err-bg"
            >
              <Ico d={IC.logout} />{saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
