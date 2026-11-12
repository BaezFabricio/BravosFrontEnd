import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import apiClient from "@/api"
import { BottomSheet } from "@/components/bx/BottomSheet"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { useTheme } from "@/components/theme-provider"
import { cerrarSesionEnServidor } from "@/lib/sesion"

/*
 * "Más" en el celular (handoff móvil, Prompt 5): tarjeta de perfil → Mi perfil; Entrenamiento (Mis RM, Calculadora);
 * Mi cuenta (Mis créditos, Documentos con aviso de pendientes); App (modo claro como switch, Mi configuración, Página principal,
 * cerrar sesión con confirmación). No repite lo que ya está en el menú de abajo (Inicio, Reservas, Reservar y Membresía).
 */

const FILA = "flex min-h-[3.5rem] w-full items-center gap-3.5 px-4 text-left text-[0.9375rem] font-semibold text-bx-ink transition-colors duration-200 active:bg-bx-surf"

function Seccion({ titulo, children }) {
  return (
    <section aria-label={titulo} className="flex flex-col gap-2">
      <h2 className="m-0 text-xs font-semibold tracking-[0.1em] text-bx-muted">{titulo.toUpperCase()}</h2>
      <ul className="m-0 flex list-none flex-col overflow-hidden rounded-2xl border border-bx-line bg-bx-card p-0">{children}</ul>
    </section>
  )
}

function Item({ to, d, texto, aviso, onClick }) {
  const inner = (
    <>
      <Ico d={d} size={20} sw={1.8} className="shrink-0 text-bx-muted" />
      <span className="flex-1">{texto}</span>
      {aviso ? <span className="rounded-full bg-bx-lima px-2 py-0.5 text-[0.6875rem] font-extrabold text-bx-negro">{aviso}</span> : null}
      <Ico d={IC.chevRight} size={18} sw={2.2} className="shrink-0 text-bx-muted" />
    </>
  )
  return (
    <li className="border-t border-bx-line2 first:border-t-0">
      {to ? <Link to={to} className={FILA}>{inner}</Link> : <button type="button" onClick={onClick} className={FILA}>{inner}</button>}
    </li>
  )
}

export default function MasMovilNuevo() {
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const oscuro = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches)
  const [pendientes, setPendientes] = useState(0)
  const [confirmarSalida, setConfirmarSalida] = useState(false)
  const sesion = (() => { try { return JSON.parse(localStorage.getItem("usuario") || "{}") } catch { return {} } })()
  const nombre = sesion.nombrecompleto || sesion.nombre || "Alumno"
  const iniciales = nombre.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase()

  // Documentos pendientes de revisar o de cargar (aviso en la fila)
  useEffect(() => {
    let vigente = true
    apiClient.get("/documentos/mis-documentos")
      .then((r) => {
        if (!vigente) return
        const docs = r.data?.data || []
        const tipos = ["comprobante_transferencia", "certificado_medico", "declaracion_jurada"]
        const sinAprobar = tipos.filter((t) => { const ult = docs.find((d) => d.tipo === t); return !ult || ult.estado !== "aprobado" })
        setPendientes(sinAprobar.length)
      })
      .catch(() => {})
    return () => { vigente = false }
  }, [])

  const cerrarSesion = () => {
    cerrarSesionEnServidor()
    localStorage.clear()
    navigate("/login", { replace: true })
  }

  return (
    <div className="bx bx-entrada flex flex-col gap-4">
      <h1 className="m-0 text-[1.375rem] font-extrabold">Más</h1>

      <Link to="/alumno/perfil" className="flex items-center gap-3.5 rounded-2xl border border-bx-line bg-bx-card p-4 active:border-bx-ok-line">
        <span className="bx-num grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-bx-lima bg-bx-tile text-[1.125rem] text-bx-ok-fg">{iniciales}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[1rem] font-extrabold">{nombre}</span>
          <span className="block text-[0.8125rem] font-bold text-bx-ok-fg">Ver mi perfil</span>
        </span>
        <Ico d={IC.chevRight} size={18} sw={2.2} className="shrink-0 text-bx-muted" />
      </Link>

      <Seccion titulo="Entrenamiento">
        <Item to="/alumno/marcas" d={IC.trophy} texto="Mis RM" />
        <Item to="/alumno/calculadora-rm" d={IC.calc} texto="Calculadora RM" />
      </Seccion>

      <Seccion titulo="Mi cuenta">
        <Item to="/alumno/creditos" d={IC.card} texto="Mis créditos" />
        <Item to="/alumno/documentacion" d={IC.folder} texto="Documentos" aviso={pendientes > 0 ? `${pendientes} pendiente${pendientes === 1 ? "" : "s"}` : null} />
      </Seccion>

      <Seccion titulo="App">
        <li className="border-t-0">
          <button type="button" role="switch" aria-checked={!oscuro} onClick={() => setTheme(oscuro ? "light" : "dark")} className={FILA}>
            <Ico d={oscuro ? IC.moon : IC.sun} size={20} sw={1.8} className="shrink-0 text-bx-muted" />
            <span className="flex-1">Modo claro</span>
            <span aria-hidden="true" className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${!oscuro ? "bg-bx-lima" : "bg-bx-line2"}`}>
              <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-300 ${!oscuro ? "left-[1.375rem]" : "left-0.5"}`} />
            </span>
          </button>
        </li>
        <Item to="/alumno/configuracion" d={IC.settings} texto="Mi configuración" />
        <Item to="/inicio" d={IC.globe} texto="Página principal" />
        <li className="border-t border-bx-line2">
          <button type="button" onClick={() => setConfirmarSalida(true)} className={`${FILA} text-bx-err-fg`}>
            <Ico d={IC.logout} size={20} sw={1.8} className="shrink-0" />
            <span className="flex-1">Cerrar sesión</span>
          </button>
        </li>
      </Seccion>

      <p className="m-0 text-center text-xs text-bx-muted">Bravos Box · versión 2.4</p>

      <BottomSheet abierto={confirmarSalida} onCerrar={() => setConfirmarSalida(false)} titulo="¿Cerrar sesión?" alerta descripcion="Vas a tener que volver a ingresar con tu correo y contraseña."
        pie={<div className="flex w-full flex-col gap-2.5"><button type="button" autoFocus onClick={() => setConfirmarSalida(false)} className="h-[3.25rem] rounded-xl border border-bx-btn-line text-[0.9375rem] font-bold text-bx-ink">Seguir conectado</button><button type="button" onClick={cerrarSesion} className="h-[3.25rem] rounded-xl bg-bx-err-fg text-[0.9375rem] font-bold text-bx-card active:scale-[0.98]">Sí, cerrar sesión</button></div>} />
    </div>
  )
}
