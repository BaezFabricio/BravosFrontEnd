import { Link } from "react-router-dom"
import { Camera, ChevronRight, KeyRound, Pencil } from "lucide-react"
import { TituloPagina } from "@/components/TituloPagina"
import FotoAmpliable from "@/components/FotoAmpliable"
import { usePerfilAlumno } from "@/app/alumno/perfil/usePerfilAlumno"
import { useMiPlan } from "@/lib/miPlan"
import { fechaDeTexto, hoyTexto } from "@/lib/fechasBx"

// Mi perfil en el panel admin, escritorio (referencia 15). Mismos datos y acciones que el perfil del alumno
// (usePerfilAlumno). La membresía se muestra solo si la cuenta también es de alumno.

const tarjeta = { borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)", padding: "22px 24px" }
const titulo = { margin: 0, font: "800 17px Archivo" }
const sub = { margin: "4px 0 0", font: "500 13px Archivo", color: "var(--muted-foreground)" }
const etiqueta = { display: "block", font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }
const boton = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, height: 44, padding: "0px 16px", borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", cursor: "pointer", textDecoration: "none" }
const botonPrincipal = { ...boton, background: "var(--primary)", border: "none", color: "var(--primary-foreground)" }
const campo = { width: "100%", boxSizing: "border-box", height: 46, padding: "0px 14px", borderRadius: 10, border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo" }
const ayuda = { margin: "6px 0 0", font: "500 12px Archivo", color: "var(--muted-foreground)" }
const chip = (color) => ({ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 6, background: color === "ok" ? "var(--sh-active-bg)" : color === "warn" ? "var(--sh-warn-bg)" : color === "err" ? "var(--sh-danger-bg)" : "transparent", border: `1px solid ${color === "ok" ? "var(--sh-accent)" : color === "warn" ? "var(--sh-warn-line)" : color === "err" ? "var(--sh-danger-line)" : "var(--border)"}`, color: color === "ok" ? "var(--sh-accent)" : color === "warn" ? "var(--sh-warn)" : color === "err" ? "var(--sh-danger)" : "var(--foreground)", font: "700 11px Archivo", letterSpacing: "0.06em", whiteSpace: "nowrap" })

const iniciales = (nombre) => {
  const partes = (nombre || "").trim().split(" ").filter(Boolean)
  return partes.length > 1 ? (partes[0][0] + partes[1][0]).toUpperCase() : (partes[0] || "BR").substring(0, 2).toUpperCase()
}

const fechaLarga = (f) => fechaDeTexto(f).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })

const ESTADOS = { activo: "Activa", suspendido: "Suspendida", inactivo: "Inactiva" }

function TarjetaMembresia({ idUsuario }) {
  const { data } = useMiPlan()
  return (
    <section style={tarjeta} aria-labelledby="t-membresia">
      <h2 id="t-membresia" className="bv-admin-titulo" style={titulo}>Tu membresía como alumno</h2>
      <p style={sub}>Para reservar clases desde el panel de alumno.</p>
      {!data ? (
        <p style={{ ...sub, marginTop: 16 }}>Cargando membresía…</p>
      ) : (() => {
        const { vigente, porVencer, planes = [], proximoVencimiento, ultimoPlan } = data
        const nombres = [...new Set(planes.map((p) => p.nombrePlan))].join(" + ")
        const estado = !vigente ? (ultimoPlan ? ["Vencida", "err"] : ["Sin membresía", "neutral"]) : porVencer ? ["Por vencer", "warn"] : ["Al día", "ok"]
        const dias = proximoVencimiento ? Math.round((fechaDeTexto(proximoVencimiento) - fechaDeTexto(hoyTexto())) / 86400000) : null
        const quedan = dias === null ? "" : dias > 1 ? `quedan ${dias} días` : dias === 1 ? "queda 1 día" : dias === 0 ? "vence hoy" : ""
        return (
          <>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <span style={{ font: "700 15px Archivo" }}>{vigente && nombres ? nombres : "Sin plan activo"}</span>
              <span style={chip(estado[1])}>{estado[0]}</span>
            </div>
            {vigente && proximoVencimiento && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, font: "500 14px Archivo" }}>
                <span style={{ color: "var(--muted-foreground)" }}>Vence</span>
                <span style={{ font: "700 14px Archivo", textAlign: "right" }}>{fechaLarga(proximoVencimiento)}{quedan ? ` · ${quedan}` : ""}</span>
              </div>
            )}
            {idUsuario && (
              <Link to={`/admin/usuarios/${idUsuario}`} style={{ ...boton, width: "100%", justifyContent: "space-between", marginTop: 16, boxSizing: "border-box" }}>Ver mi membresía<ChevronRight className="h-4 w-4" aria-hidden="true" /></Link>
            )}
          </>
        )
      })()}
    </section>
  )
}

export default function PerfilAdminEscritorio() {
  const {
    esAlumno, usuario, cargando, setCargando, errorCarga, setIntento, avatarUrl, guardandoFoto, errorFoto, editando, setEditando,
    form, setForm, setTocado, guardando, pwAbierto, setPwAbierto, pw, setPw, setPwTocado, pwGuardando,
    cambiarFoto, abrirEdicion, guardar, mostrar, pwMostrar, cerrarPw, guardarPw,
  } = usePerfilAlumno()

  if (cargando) {
    return (
      <>
        <TituloPagina descripcion="Tus datos, tu contraseña y el estado de tu membresía">Mi perfil</TituloPagina>
        <p aria-busy="true" style={sub}>Cargando tu perfil…</p>
      </>
    )
  }
  if (errorCarga || !usuario) {
    return (
      <>
        <TituloPagina descripcion="Tus datos, tu contraseña y el estado de tu membresía">Mi perfil</TituloPagina>
        <div style={{ ...tarjeta, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={titulo}>No pudimos cargar tu perfil</div>
            <p style={sub}>Revisá tu conexión e intentá de nuevo.</p>
          </div>
          <button type="button" onClick={() => { setCargando(true); setIntento((n) => n + 1) }} style={boton}>Reintentar</button>
        </div>
      </>
    )
  }

  const perfilTxt = usuario.perfil.charAt(0).toUpperCase() + usuario.perfil.slice(1).toLowerCase()
  const estadoTxt = ESTADOS[usuario.estado] || (usuario.estado ? usuario.estado.charAt(0).toUpperCase() + usuario.estado.slice(1) : "Sin dato")
  const estadoColor = usuario.estado === "activo" ? "ok" : usuario.estado === "suspendido" ? "err" : "neutral"
  const datos = [
    ["DNI", String(usuario.dni || "")],
    ["Teléfono", String(usuario.tel || "")],
    ["Correo", usuario.correo || ""],
    ["Nombre y apellido", usuario.nombre || ""],
  ]

  return (
    <>
      <TituloPagina descripcion="Tus datos, tu contraseña y el estado de tu membresía">Mi perfil</TituloPagina>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 380px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <section style={{ ...tarjeta, display: "flex", alignItems: "center", gap: 24 }} aria-label="Foto y nombre">
            <FotoAmpliable
              src={avatarUrl}
              alt={usuario.nombre}
              className="grid h-24 w-24 shrink-0 select-none place-items-center overflow-hidden rounded-full border-[3px] border-[var(--sh-accent)] bg-[var(--sh-avatar)] text-[30px] font-extrabold text-[var(--sh-accent)]"
            >
              {iniciales(usuario.nombre)}
            </FotoAmpliable>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 className="bv-admin-titulo" style={{ margin: 0, font: "800 26px Archivo" }}>{usuario.nombre}</h2>
                <span style={chip("ok")}>{perfilTxt}</span>
              </div>
              {usuario.desde && <p style={{ ...sub, marginTop: 4, font: "500 14px Archivo" }}>Miembro desde el {fechaLarga(usuario.desde)}</p>}
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
                <label style={{ ...boton, cursor: "pointer" }}>
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  {guardandoFoto ? "Guardando…" : "Subir foto"}
                  <input type="file" accept="image/*" onChange={cambiarFoto} aria-label="Subir foto de perfil" className="sr-only" />
                </label>
              </div>
              <p style={ayuda}>JPG o PNG, hasta 5 MB. Se recorta en círculo.</p>
              {errorFoto && <p role="alert" style={{ ...ayuda, color: "var(--destructive)" }}>{errorFoto}</p>}
            </div>
          </section>

          <section style={tarjeta} aria-labelledby="t-datos">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 id="t-datos" className="bv-admin-titulo" style={titulo}>Datos personales</h2>
              {!editando && (
                <button type="button" onClick={abrirEdicion} style={boton}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar
                </button>
              )}
            </div>

            {!editando ? (
              <dl style={{ margin: "16px 0 0", display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                {datos.map(([k, v], i) => (
                  <div key={k} style={{ padding: "16px 18px", borderTop: i > 1 ? "1px solid var(--border)" : 0, borderLeft: i % 2 ? "1px solid var(--border)" : 0 }}>
                    <dt style={etiqueta}>{k}</dt>
                    <dd style={{ margin: "6px 0 0", font: v ? "700 15px Archivo" : "500 15px Archivo", fontStyle: v ? "normal" : "italic", color: v ? "var(--foreground)" : "var(--muted-foreground)" }}>{v || "Sin cargar"}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <form noValidate onSubmit={guardar} style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div>
                    <label htmlFor="pa-nombre" style={etiqueta}>Nombre y apellido *</label>
                    <input id="pa-nombre" type="text" autoComplete="name" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} onBlur={() => setTocado((t) => ({ ...t, nombre: true }))} style={{ ...campo, marginTop: 8 }} />
                    {mostrar("nombre") && <p style={{ ...ayuda, color: "var(--destructive)" }}>{mostrar("nombre")}</p>}
                  </div>
                  <div>
                    <span style={etiqueta}>DNI</span>
                    <div style={{ ...campo, marginTop: 8, display: "flex", alignItems: "center", color: "var(--muted-foreground)" }}>{String(usuario.dni || "") || "Sin cargar"}</div>
                    <p style={ayuda}>Lo carga el box. Si hay un error, avisá en recepción.</p>
                  </div>
                  <div>
                    <label htmlFor="pa-tel" style={etiqueta}>Teléfono</label>
                    <input id="pa-tel" type="tel" autoComplete="tel" value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} onBlur={() => setTocado((t) => ({ ...t, tel: true }))} style={{ ...campo, marginTop: 8 }} />
                    {mostrar("tel") ? <p style={{ ...ayuda, color: "var(--destructive)" }}>{mostrar("tel")}</p> : <p style={ayuda}>Con característica, por ejemplo 3794 123456.</p>}
                  </div>
                  <div>
                    <span style={etiqueta}>Correo</span>
                    <div style={{ ...campo, marginTop: 8, display: "flex", alignItems: "center", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis" }}>{usuario.correo}</div>
                    <p style={ayuda}>Para cambiarlo, escribile a soporte.</p>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button type="button" onClick={() => setEditando(false)} style={boton}>Cancelar</button>
                  <button type="submit" disabled={guardando} aria-busy={guardando} style={{ ...botonPrincipal, opacity: guardando ? 0.6 : 1 }}>{guardando ? "Guardando…" : "Guardar cambios"}</button>
                </div>
              </form>
            )}
          </section>

          <section style={tarjeta} aria-labelledby="t-pass">
            {!pwAbierto ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                  <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 10, background: "var(--sh-active-bg)", color: "var(--sh-accent)", flexShrink: 0 }}>
                    <KeyRound className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 id="t-pass" className="bv-admin-titulo" style={titulo}>Contraseña</h2>
                    <p style={sub}>Usá una que no uses en otras cuentas.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPwAbierto(true)} style={boton}>Cambiar contraseña</button>
              </div>
            ) : (
              <form noValidate onSubmit={guardarPw} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h2 id="t-pass" className="bv-admin-titulo" style={titulo}>Cambiar contraseña</h2>
                <div>
                  <label htmlFor="pa-actual" style={etiqueta}>Contraseña actual</label>
                  <input id="pa-actual" type="password" autoComplete="current-password" value={pw.actual} onChange={(e) => setPw({ ...pw, actual: e.target.value })} onBlur={() => setPwTocado((t) => ({ ...t, actual: true }))} style={{ ...campo, marginTop: 8 }} />
                  {pwMostrar("actual") && <p style={{ ...ayuda, color: "var(--destructive)" }}>{pwMostrar("actual")}</p>}
                </div>
                <div>
                  <label htmlFor="pa-nueva" style={etiqueta}>Nueva contraseña</label>
                  <input id="pa-nueva" type="password" autoComplete="new-password" value={pw.nueva} onChange={(e) => setPw({ ...pw, nueva: e.target.value })} onBlur={() => setPwTocado((t) => ({ ...t, nueva: true }))} style={{ ...campo, marginTop: 8 }} />
                  {pwMostrar("nueva") ? <p style={{ ...ayuda, color: "var(--destructive)" }}>{pwMostrar("nueva")}</p> : <p style={ayuda}>Mínimo 8 caracteres, con mayúscula, minúscula y número.</p>}
                </div>
                <div>
                  <label htmlFor="pa-rep" style={etiqueta}>Repetí la nueva contraseña</label>
                  <input id="pa-rep" type="password" autoComplete="new-password" value={pw.rep} onChange={(e) => setPw({ ...pw, rep: e.target.value })} onBlur={() => setPwTocado((t) => ({ ...t, rep: true }))} style={{ ...campo, marginTop: 8 }} />
                  {pwMostrar("rep") && <p style={{ ...ayuda, color: "var(--destructive)" }}>{pwMostrar("rep")}</p>}
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button type="button" onClick={cerrarPw} style={boton}>Cancelar</button>
                  <button type="submit" disabled={pwGuardando} aria-busy={pwGuardando} style={{ ...botonPrincipal, opacity: pwGuardando ? 0.6 : 1 }}>{pwGuardando ? "Guardando…" : "Guardar contraseña"}</button>
                </div>
              </form>
            )}
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          {esAlumno && <TarjetaMembresia idUsuario={usuario.idUsuario} />}

          <section style={tarjeta} aria-labelledby="t-cuenta">
            <h2 id="t-cuenta" className="bv-admin-titulo" style={titulo}>Tu cuenta</h2>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Estado</span>
                <span style={chip(estadoColor)}>{estadoTxt}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Perfil</span>
                <span style={{ font: "700 14px Archivo" }}>
                  {perfilTxt} · <Link to="/admin/perfiles" style={{ color: "var(--sh-accent)", textDecoration: "none" }}>ver permisos</Link>
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
