import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BottomSheet } from "@/components/bx/BottomSheet"
import { Ico } from "@/components/bx/iconos"
import { IC } from "@/components/bx/trazos"
import { ErrorBanner, Esqueleto, Campo } from "@/components/bx"
import { panelesPermitidos } from "@/lib/paneles"
import FotoAmpliable from "@/components/FotoAmpliable"
import { useMiPlan, fmtFechaPlan } from "@/lib/miPlan"
import { cerrarSesionEnServidor } from "@/lib/sesion"
import { usePerfilAlumno } from "./usePerfilAlumno"

/*
 * Mi perfil en el celular (handoff móvil, Prompt 5). Tarjeta oscura con foto (botón de cámara), nombre, correo, chips de rol y estado,
 * y la fila de créditos y membresía (lleva a Mis créditos). Datos con etiqueta arriba y valor abajo. "Editar" (nombre y teléfono, validados)
 * y cambio de contraseña en BottomSheet. Cerrar sesión con confirmación. Misma lógica que el escritorio (usePerfilAlumno).
 */

export default function PerfilMovilNuevo() {
  const navigate = useNavigate()
  const { data: plan } = useMiPlan()
  const p = usePerfilAlumno()
  const [hojaEditar, setHojaEditar] = useState(false)
  const [hojaPw, setHojaPw] = useState(false)
  const [confirmarSalida, setConfirmarSalida] = useState(false)

  const cerrarSesion = () => {
    cerrarSesionEnServidor()
    localStorage.clear()
    navigate("/login", { replace: true })
  }

  if (p.cargando) return <div aria-busy="true" aria-label="Cargando perfil" className="flex flex-col gap-3"><Esqueleto alto={170} className="rounded-2xl" /><Esqueleto alto={180} className="rounded-2xl" /></div>
  if (p.errorCarga || !p.usuario) return <ErrorBanner titulo="No pudimos cargar tu perfil" texto="Revisá tu conexión e intentá de nuevo." onReintentar={() => { p.setCargando(true); p.setIntento((n) => n + 1) }} />

  const u = p.usuario
  const iniciales = (u.nombre || "").trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("").toUpperCase() || "BR"
  const rolTxt = String(u.perfil || "alumno").toUpperCase()
  const esAdmin = panelesPermitidos().admin
  const vigente = !!plan?.vigente
  const creditos = vigente ? plan.totalDisponibles : 0

  const abrirEditar = () => { p.abrirEdicion(); setHojaEditar(true) }
  const guardarEditar = async (ev) => { await p.guardar(ev); if (!p.editando) setHojaEditar(false) }

  return (
    <div className="bx bx-entrada flex flex-col gap-4">
      <h1 className="m-0 text-[1.375rem] font-extrabold">Mi perfil</h1>

      {/* Tarjeta oscura: foto, nombre, correo y chips */}
      <section aria-labelledby="t-nombre-m" className="flex flex-col gap-4 rounded-2xl border border-bx-hero-line bg-bx-hero p-5 text-[#ecefe4]">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <FotoAmpliable src={p.avatarUrl} alt={u.nombre} className="bx-num grid h-20 w-20 select-none place-items-center overflow-hidden rounded-full border-[3px] border-bx-lima bg-[#1f2a0e] text-[1.875rem] text-bx-lima">
              {iniciales}
            </FotoAmpliable>
            <label title="Cambiar foto" className="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full border-[3px] border-bx-hero bg-bx-lima text-bx-negro focus-within:outline focus-within:outline-[3px] focus-within:outline-bx-lima">
              <input type="file" accept="image/*" onChange={p.cambiarFoto} aria-label="Cambiar foto de perfil" className="absolute h-px w-px opacity-0" />
              {p.guardandoFoto ? <span className="text-[0.625rem] font-bold">…</span> : <Ico d="M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" size={16} sw={2} />}
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="t-nombre-m" className="m-0 truncate text-[1.0625rem] font-extrabold">{u.nombre}</h2>
            <div className="mt-0.5 break-all text-[0.8125rem] text-[#b9bcae]">{u.correo}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Rol: sólido en lima para administradores, contorno para el resto (como en la referencia) */}
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[0.6875rem] font-extrabold tracking-[0.06em] ${esAdmin ? "bg-bx-lima text-bx-negro" : "border border-[#4a4d42] text-[#c9ccbe]"}`}>{rolTxt}</span>
          {/* Estado de la membresía (reemplaza el de usuario) */}
          {plan && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold ${!vigente ? "border-[#6b2a24] bg-[#2a1210] text-[#ffb4aa]" : plan.porVencer ? "border-[#5a4a12] bg-[#2a230a] text-[#e6c200]" : "border-[#3d5a10] bg-[#16220a] text-bx-lima"}`}>
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{!vigente ? "Sin membresía" : plan.porVencer ? "Membresía por vencer" : "Membresía activa"}
            </span>
          )}
        </div>
        {p.errorFoto && <p role="alert" className="m-0 text-sm font-medium text-[#ffb4aa]">{p.errorFoto}</p>}
      </section>

      {/* Créditos y membresía: lleva a Mis créditos */}
      {p.esAlumno && (
        <Link to="/alumno/creditos" className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl border border-bx-line bg-bx-card px-4 py-3 text-bx-ink active:border-bx-ok-line">
          <Ico d={IC.card} size={20} sw={1.8} className="shrink-0 text-bx-ok-fg" />
          <span className="min-w-0 flex-1 text-sm">
            <strong className="text-base font-extrabold">{creditos} {creditos === 1 ? "crédito" : "créditos"}</strong>
            <span className="text-bx-muted"> · {vigente ? (plan.porVencer ? "Membresía por vencer" : "Membresía vigente") : "Sin membresía vigente"}</span>
          </span>
          <Ico d={IC.chevRight} size={18} sw={2.2} className="shrink-0 text-bx-muted" />
        </Link>
      )}

      {/* Información personal: etiqueta arriba, valor abajo */}
      <section aria-labelledby="t-info-m" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 id="t-info-m" className="m-0 text-xs font-semibold tracking-[0.1em] text-bx-muted">INFORMACIÓN PERSONAL</h2>
          <button type="button" onClick={abrirEditar} className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-bold text-bx-ok-fg"><Ico d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" size={16} sw={1.8} />Editar</button>
        </div>
        <dl className="m-0 overflow-hidden rounded-2xl border border-bx-line bg-bx-card">
          {[["Nombre", u.nombre], ["DNI", String(u.dni || "")], ["Teléfono", String(u.tel || "")], ["Correo", u.correo], ["Miembro desde", u.desde ? fmtFechaPlan(String(u.desde).slice(0, 10)) : ""]].map(([k, v]) => (
            <div key={k} className="border-t border-bx-line2 px-4 py-3 first:border-t-0">
              <dt className="text-xs font-medium text-bx-muted">{k}</dt>
              <dd className={`m-0 mt-0.5 break-words text-[0.9375rem] font-bold ${v ? "" : "italic font-normal text-bx-muted"}`}>{v || "Sin cargar"}</dd>
            </div>
          ))}
        </dl>
        {!String(u.tel || "").trim() && <p className="m-0 text-[0.8125rem] text-bx-muted">Completá tu teléfono para que te identifiquemos en el box. El DNI lo carga el box.</p>}
      </section>

      {/* Seguridad y salida */}
      <section aria-labelledby="t-seg-m" className="flex flex-col gap-2">
        <h2 id="t-seg-m" className="m-0 text-xs font-semibold tracking-[0.1em] text-bx-muted">SEGURIDAD</h2>
        <div className="overflow-hidden rounded-2xl border border-bx-line bg-bx-card">
          <button type="button" onClick={() => setHojaPw(true)} className="flex min-h-[3.75rem] w-full items-center gap-3 px-4 text-left active:bg-bx-surf">
            <Ico d="M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3" size={18} sw={1.8} className="text-bx-muted" />
            <span className="flex-1 text-[0.9375rem] font-bold">Cambiar contraseña</span>
            <Ico d={IC.chevRight} size={18} sw={2.2} className="text-bx-muted" />
          </button>
        </div>
        <button type="button" onClick={() => setConfirmarSalida(true)} className="flex min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl border border-bx-err-line text-[0.9375rem] font-bold text-bx-err-fg active:bg-bx-err-bg">
          <Ico d={IC.logout} size={18} sw={1.8} />Cerrar sesión
        </button>
      </section>

      {/* Editar nombre y teléfono */}
      <BottomSheet abierto={hojaEditar} onCerrar={() => setHojaEditar(false)} titulo="Editar mis datos" descripcion="Podés cambiar tu nombre y tu teléfono. El correo y el DNI los cambia el box."
        pie={<div className="flex w-full flex-col gap-2.5"><button type="submit" form="form-perfil-m" disabled={p.guardando} className="h-[3.25rem] rounded-xl bg-bx-lima text-[0.9375rem] font-extrabold text-bx-negro active:scale-[0.98] disabled:opacity-60">{p.guardando ? "Guardando…" : "Guardar cambios"}</button><button type="button" onClick={() => setHojaEditar(false)} className="h-11 text-sm font-bold text-bx-ink">Cancelar</button></div>}>
        <form id="form-perfil-m" noValidate onSubmit={guardarEditar} className="flex flex-col gap-3.5">
          <Campo id="f-nombre" etiqueta="Nombre y apellido *" value={p.form.nombre} autoComplete="name" error={p.mostrar("nombre")}
            onChange={(e) => p.setForm({ ...p.form, nombre: e.target.value })} onBlur={() => p.setTocado((t) => ({ ...t, nombre: true }))} inputClassName="h-[3.25rem]" />
          <Campo id="f-tel" etiqueta="Teléfono" type="tel" value={p.form.tel} autoComplete="tel" ayuda="Con característica, por ejemplo 3794 123456." error={p.mostrar("tel")}
            onChange={(e) => p.setForm({ ...p.form, tel: e.target.value })} onBlur={() => p.setTocado((t) => ({ ...t, tel: true }))} inputClassName="h-[3.25rem]" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold">Correo</span>
            <span className="break-all rounded-[0.625rem] border border-bx-line2 bg-bx-surf px-3.5 py-3 text-sm text-bx-muted">{u.correo} · para cambiarlo, escribile a soporte</span>
          </div>
        </form>
      </BottomSheet>

      {/* Cambiar contraseña */}
      <BottomSheet abierto={hojaPw} onCerrar={() => { p.cerrarPw(); setHojaPw(false) }} titulo="Cambiar contraseña" descripcion="Ingresá tu contraseña actual y elegí una nueva."
        pie={<div className="flex w-full flex-col gap-2.5"><button type="submit" form="form-pw-m" disabled={p.pwGuardando} className="h-[3.25rem] rounded-xl bg-bx-lima text-[0.9375rem] font-extrabold text-bx-negro active:scale-[0.98] disabled:opacity-60">{p.pwGuardando ? "Guardando…" : "Guardar contraseña"}</button><button type="button" onClick={() => { p.cerrarPw(); setHojaPw(false) }} className="h-11 text-sm font-bold text-bx-ink">Cancelar</button></div>}>
        <form id="form-pw-m" noValidate onSubmit={async (ev) => { await p.guardarPw(ev); }} className="flex flex-col gap-3.5">
          <Campo id="f-actual" etiqueta="Contraseña actual" type="password" value={p.pw.actual} autoComplete="current-password" error={p.pwMostrar("actual")}
            onChange={(e) => p.setPw({ ...p.pw, actual: e.target.value })} onBlur={() => p.setPwTocado((t) => ({ ...t, actual: true }))} inputClassName="h-[3.25rem]" />
          <Campo id="f-nueva" etiqueta="Nueva contraseña" type="password" value={p.pw.nueva} autoComplete="new-password" ayuda="Mínimo 8 caracteres, con mayúscula, minúscula y número." error={p.pwMostrar("nueva")}
            onChange={(e) => p.setPw({ ...p.pw, nueva: e.target.value })} onBlur={() => p.setPwTocado((t) => ({ ...t, nueva: true }))} inputClassName="h-[3.25rem]" />
          <Campo id="f-rep" etiqueta="Repetí la nueva contraseña" type="password" value={p.pw.rep} autoComplete="new-password" error={p.pwMostrar("rep")}
            onChange={(e) => p.setPw({ ...p.pw, rep: e.target.value })} onBlur={() => p.setPwTocado((t) => ({ ...t, rep: true }))} inputClassName="h-[3.25rem]" />
        </form>
      </BottomSheet>

      {/* Confirmar cerrar sesión */}
      <BottomSheet abierto={confirmarSalida} onCerrar={() => setConfirmarSalida(false)} titulo="¿Cerrar sesión?" alerta descripcion="Vas a tener que volver a ingresar con tu correo y contraseña."
        pie={<div className="flex w-full flex-col gap-2.5"><button type="button" autoFocus onClick={() => setConfirmarSalida(false)} className="h-[3.25rem] rounded-xl border border-bx-btn-line text-[0.9375rem] font-bold text-bx-ink">Seguir conectado</button><button type="button" onClick={cerrarSesion} className="h-[3.25rem] rounded-xl bg-bx-err-fg text-[0.9375rem] font-bold text-bx-card active:scale-[0.98]">Sí, cerrar sesión</button></div>} />
    </div>
  )
}
