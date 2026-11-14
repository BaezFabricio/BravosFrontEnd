import NumeroAnimado from "@/components/NumeroAnimado"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ChevronLeft, CreditCard, Eye, FileText, MoreHorizontal, Pencil, Plus, Stethoscope, UserCheck, UserX, Trash2, CalendarX } from "lucide-react"
import { AdminFormSkeleton } from "@/components/AdminPageSkeleton"
import apiClient, { cambiarEstadoUsuario, eliminarUsuario, getUsuarioById } from "@/api"
import { toast } from '@/lib/notificar'
import { Cargando } from '@/components/Cargando'
import { TituloPagina } from "@/components/TituloPagina"
import FotoAmpliable from "@/components/FotoAmpliable"
import BotonWhatsApp from "@/components/BotonWhatsApp"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Ficha completa del alumno (pantalla 05 de la referencia). Colores de los tokens del tema.
const TIPOS_DOC = [
  { key: "comprobante_transferencia", label: "Comprobante de transferencia", Icon: CreditCard },
  { key: "certificado_medico", label: "Certificado médico", Icon: Stethoscope },
  { key: "declaracion_jurada", label: "Declaración jurada", Icon: FileText },
]
const ESTADOS_RESERVA = {
  proxima: { label: "Próxima", fondo: "var(--sh-track)", linea: "var(--sh-control-line)", tinta: "var(--muted-foreground)" },
  completada: { label: "Asistió", fondo: "var(--sh-active-bg)", linea: "rgba(155, 230, 0, 0.3)", tinta: "var(--primary)" },
  cancelada: { label: "Cancelada", fondo: "var(--sh-danger-bg)", linea: "var(--sh-danger-line)", tinta: "var(--sh-danger)" },
  inasistencia: { label: "No asistió", fondo: "var(--sh-warn-bg)", linea: "var(--sh-warn-line)", tinta: "var(--sh-warn)" },
}
const pastilla = (fondo, linea, tinta) => ({ padding: "3px 9px", borderRadius: 999, background: fondo, border: `1px solid ${linea}`, color: tinta, font: "700 11px Archivo", whiteSpace: "nowrap" })
const estiloBotonContorno = { display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0px 16px", borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", whiteSpace: "nowrap", textDecoration: "none", cursor: "pointer" }
const estiloBotonLima = { display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0px 16px", borderRadius: 10, border: "none", background: "var(--primary)", color: "var(--primary-foreground)", font: "800 14px Archivo", whiteSpace: "nowrap", textDecoration: "none", cursor: "pointer" }
const estiloTarjeta = { borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)" }
const estiloEtiqueta = { margin: 0, font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }

// Fechas tal como vienen de la base (AAAA-MM-DD), sin pasarlas por UTC
const partirFecha = (iso) => {
  if (!iso) return null
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number)
  return y && m && d ? new Date(y, m - 1, d) : null
}
const fechaDDMMAAAA = (iso) => { const f = partirFecha(iso); return f ? `${String(f.getDate()).padStart(2, "0")}/${String(f.getMonth() + 1).padStart(2, "0")}/${f.getFullYear()}` : "" }
const fechaDiaMes = (iso) => { const f = partirFecha(iso); return f ? `${f.getDate()} ${f.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")}` : "" }
const mesAnio = (iso) => { const f = partirFecha(iso); return f ? `${f.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")} ${f.getFullYear()}` : "" }
const edad = (iso) => {
  const f = partirFecha(iso)
  if (!f) return null
  const hoy = new Date()
  let anios = hoy.getFullYear() - f.getFullYear()
  if (hoy.getMonth() < f.getMonth() || (hoy.getMonth() === f.getMonth() && hoy.getDate() < f.getDate())) anios--
  return anios
}
const dinero = (n) => `$${Number(n || 0).toLocaleString("es-AR")}`
const leerPermisos = () => { try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] } }

export default function DetalleUsuarioPage() {
  const [permisos] = useState(leerPermisos)
  const navigate = useNavigate()
  const { id } = useParams()

  const [user, setUser] = useState(null)
  const [ficha, setFicha] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState({ open: false, action: "" })
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [error, setError] = useState("")

  const [pestana, setPestana] = useState("datos")
  const [reservas, setReservas] = useState([])
  const [cargandoReservas, setCargandoReservas] = useState(false)
  const [documentos, setDocumentos] = useState([])
  const [cargandoDocs, setCargandoDocs] = useState(false)
  const [pagos, setPagos] = useState([])
  const [cargandoPagos, setCargandoPagos] = useState(false)
  const [notaNueva, setNotaNueva] = useState("")
  const [guardandoNota, setGuardandoNota] = useState(false)

  useEffect(() => {
    if (!id) return
    setCargandoReservas(true)
    apiClient.get(`/reservas/admin/usuario/${id}`)
      .then((r) => setReservas(r.data?.data || r.data || []))
      .catch(() => toast.error("No se pudieron cargar las reservas del usuario"))
      .finally(() => setCargandoReservas(false))
    setCargandoDocs(true)
    apiClient.get(`/documentos/usuario/${id}`)
      .then((r) => setDocumentos(r.data?.data || r.data || []))
      .catch(() => toast.error("No se pudieron cargar los documentos del usuario"))
      .finally(() => setCargandoDocs(false))
    setCargandoPagos(true)
    apiClient.get(`/usuarios/${id}/pagos`)
      .then((r) => setPagos(r.data?.data || []))
      .catch(() => toast.error("No se pudieron cargar los abonos"))
      .finally(() => setCargandoPagos(false))
  }, [id])

  const cargarFicha = () => apiClient.get(`/usuarios/${id}/ficha`).then((r) => setFicha(r.data?.data || null)).catch(() => setFicha(null))

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    setError("")
    getUsuarioById(id)
      .then((respuesta) => setUser(respuesta?.data || respuesta))
      .catch(() => setError("No se pudo cargar el detalle del usuario."))
      .finally(() => setIsLoading(false))
    cargarFicha()
  }, [id])

  const handleStatusChange = async (newStatus) => {
    try {
      setIsActionLoading(true)
      await cambiarEstadoUsuario(id, newStatus)
      setUser((u) => ({ ...u, estado: newStatus }))
    } catch (statusError) {
      toast.error(statusError.response?.data?.message || "No se pudo actualizar el estado del usuario.")
    } finally {
      setIsActionLoading(false)
      setStatusDialog({ open: false, action: "" })
    }
  }

  const handleDelete = async () => {
    try {
      setIsActionLoading(true)
      await eliminarUsuario(id)
      navigate("/admin/usuarios")
    } catch (deleteError) {
      toast.error(deleteError.response?.data?.message || "No se pudo eliminar el usuario.")
    } finally {
      setIsActionLoading(false)
      setDeleteDialog(false)
    }
  }

  const guardarNota = async () => {
    const texto = notaNueva.trim()
    if (!texto) return
    setGuardandoNota(true)
    try {
      await apiClient.post(`/usuarios/${id}/notas`, { texto })
      setNotaNueva("")
      toast.success("Nota guardada", { guardar: false })
      cargarFicha()
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo guardar la nota")
    } finally {
      setGuardandoNota(false)
    }
  }

  if (isLoading) return <AdminFormSkeleton />
  if (error && !user) {
    return (
      <div className="space-y-4">
        <div style={{ ...estiloTarjeta, padding: 16, color: "var(--destructive)" }}>{error}</div>
        <Link to="/admin/usuarios" style={estiloBotonContorno}>Volver a usuarios</Link>
      </div>
    )
  }

  const puede = (p) => permisos.includes(p)
  const esMiCuenta = (() => { try { return Number(JSON.parse(localStorage.getItem("usuario") || "{}").idUsuario) === Number(id) } catch { return false } })()
  const estaInactivo = user?.estado === "inactivo"
  const esAlumno = ficha?.esAlumno !== false
  const vigente = ficha?.vigente || null
  const datosPersona = ficha?.datosPersona || {}
  const notas = ficha?.notas || []
  const docsAprobados = documentos.filter((d) => d.estado === "aprobado").length
  const docsPendientes = documentos.filter((d) => d.estado !== "aprobado").length
  const membresiaActiva = user?.membresia === "vigente" || user?.membresia === "activa"
  const estadoMembresiaTexto = membresiaActiva ? "Membresía activa" : user?.membresia === "por_vencer" ? "Por vencer" : "Vencida"
  const perfilTexto = (user?.perfil || "").trim()
  const perfilCapital = perfilTexto ? perfilTexto.charAt(0).toUpperCase() + perfilTexto.slice(1) : "Sin perfil"
  const iniciales = (nombre = "") => { const p = nombre.trim().split(/\s+/); return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase() }
  const etiquetaPestana = (activa) => ({ fontSize: 15, fontWeight: 700, fontFamily: "Archivo", padding: "0px 16px", minHeight: 48, marginBottom: -1, borderWidth: "0px 0px 3px", borderStyle: "none none solid", borderColor: `transparent transparent ${activa ? "var(--primary)" : "transparent"}`, background: "transparent", color: activa ? "var(--foreground)" : "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" })
  const contador = (n, color) => <span style={{ minWidth: 22, height: 22, padding: "0px 6px", boxSizing: "border-box", borderRadius: 11, background: color, color: "var(--foreground)", font: "700 12px / 22px Archivo", textAlign: "center" }}>{n}</span>
  const filaDato = (etiqueta, valor, color) => (
    <div key={etiqueta} style={{ display: "grid", gridTemplateColumns: "180px minmax(0, 1fr)", borderTop: "1px solid var(--sh-line)" }}>
      <dt style={{ padding: "12px 0px", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>{etiqueta}</dt>
      <dd style={{ margin: 0, padding: "12px 0px", font: "600 14px Archivo", color: color || "var(--foreground)", minWidth: 0, overflowWrap: "anywhere" }}>{valor}</dd>
    </div>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <TituloPagina descripcion={`Usuarios y abonos › ${user?.nombre || ""}`}>Ficha del alumno</TituloPagina>

      <Link to="/admin/usuarios" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6, minHeight: 40, font: "700 14px Archivo", color: "var(--sh-link)", textDecoration: "none" }}>
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Volver a Usuarios
      </Link>

      {/* Encabezado: alumno, etiquetas y acciones */}
      <section aria-label="Alumno" style={{ ...estiloTarjeta, padding: 22, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <FotoAmpliable src={user?.avatarUrl} alt={user?.nombre} className="grid h-[72px] w-[72px] shrink-0 select-none place-items-center overflow-hidden rounded-full border-2 border-[color:var(--primary)] bg-transparent font-[Archivo] text-[24px] font-extrabold text-[color:var(--primary)]">
          {user?.avatarUrl ? null : iniciales(user?.nombre || "")}
        </FotoAmpliable>
        <div style={{ flex: "1 1 0%", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 className="bv-admin-titulo" style={{ margin: 0, font: "800 24px Archivo" }}>{user?.nombre}</h2>
            <span style={membresiaActiva ? pastilla("var(--sh-active-bg)", "rgba(155, 230, 0, 0.3)", "var(--primary)") : user?.membresia === "por_vencer" ? pastilla("var(--sh-warn-bg)", "var(--sh-warn-line)", "var(--sh-warn)") : pastilla("var(--sh-danger-bg)", "var(--sh-danger-line)", "var(--sh-danger)")}>{estadoMembresiaTexto}</span>
            <span style={pastilla("transparent", "var(--sh-control-line)", "var(--sh-link)")}>{perfilCapital}</span>
            {estaInactivo && <span style={pastilla("transparent", "var(--sh-control-line)", "var(--muted-foreground)")}>Inactivo</span>}
          </div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 8, font: "500 14px Archivo", color: "var(--sh-link)" }}>
            {user?.email && <span>{user.email}</span>}
            {user?.telefono && <span>{user.telefono}</span>}
            {user?.dni && <span>{`DNI ${user.dni}`}</span>}
            {esAlumno && ficha?.alumnoDesde && <span>{`Alumna desde ${mesAnio(ficha.alumnoDesde)}`}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
          {user?.telefono && (
            <span style={{ ...estiloBotonContorno, height: 46, padding: "0px 12px" }}>
              <BotonWhatsApp telefono={user.telefono} nombre={user.nombre} />
              WhatsApp
            </span>
          )}
          {puede("usuarios:modificacion") && (
            <Link to={`/admin/usuarios/${id}/editar`} style={estiloBotonContorno}><Pencil className="h-[17px] w-[17px]" aria-hidden="true" /> Editar</Link>
          )}
          {puede("usuarios:alta") && (
            <Link to={`/admin/usuarios/abonos/carga-masiva?usuario=${id}`} style={estiloBotonLima}><Plus className="h-[17px] w-[17px]" aria-hidden="true" /> Cargar abono</Link>
          )}
          {(puede("usuarios:modificacion") || puede("usuarios:baja")) && !esMiCuenta && (
            <div style={{ position: "relative" }}>
              <button type="button" aria-label="Más acciones" aria-expanded={menuAbierto} onClick={() => setMenuAbierto((v) => !v)}
                style={{ ...estiloBotonContorno, width: 46, padding: 0, justifyContent: "center" }}>
                <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
              {menuAbierto && (
                <div role="menu" style={{ position: "absolute", right: 0, top: 52, zIndex: 20, minWidth: 220, borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", padding: 6 }}>
                  {puede("usuarios:modificacion") && (estaInactivo ? (
                    <button type="button" role="menuitem" onClick={() => { setMenuAbierto(false); setStatusDialog({ open: true, action: "activate" }) }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "var(--primary)", font: "700 14px Archivo", cursor: "pointer" }}>
                      <UserCheck className="h-4 w-4" aria-hidden="true" /> Activar
                    </button>
                  ) : (
                    <button type="button" role="menuitem" onClick={() => { setMenuAbierto(false); setStatusDialog({ open: true, action: "deactivate" }) }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", cursor: "pointer" }}>
                      <UserX className="h-4 w-4" aria-hidden="true" /> Desactivar
                    </button>
                  ))}
                  {puede("usuarios:baja") && (
                    <button type="button" role="menuitem" onClick={() => { setMenuAbierto(false); setDeleteDialog(true) }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", background: "transparent", color: "var(--destructive)", font: "700 14px Archivo", cursor: "pointer" }}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Resumen: créditos, asistencia, racha y documentos (datos reales de la base) */}
      {esAlumno && ficha && (
        <section aria-label="Resumen" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 16 }}>
          <div style={{ ...estiloTarjeta, padding: "18px 20px" }}>
            <div style={estiloEtiqueta}>Créditos</div>
            <div style={{ font: "900 40px / 1 'Big Shoulders Stencil Display', Archivo, sans-serif", color: "var(--primary)", marginTop: 10 }}><NumeroAnimado valor={Number(user?.creditos ?? 0)} /></div>
            <div style={{ font: "500 13px Archivo", color: "var(--muted-foreground)", marginTop: 6 }}>
              {vigente ? `de ${vigente.totalCreditos} · vencen el ${fechaDiaMes(vigente.vencimiento)}` : "Sin crédito vigente"}
            </div>
          </div>
          <div style={{ ...estiloTarjeta, padding: "18px 20px" }}>
            <div style={estiloEtiqueta}>Asistencia del mes</div>
            <div style={{ font: "900 40px / 1 'Big Shoulders Stencil Display', Archivo, sans-serif", color: "var(--foreground)", marginTop: 10 }}><NumeroAnimado valor={Number(ficha.asistenciaMes.asistidas)} /></div>
            <div style={{ font: "500 13px Archivo", color: "var(--muted-foreground)", marginTop: 6 }}>{`clases · ${ficha.asistenciaMes.ausencias} ${ficha.asistenciaMes.ausencias === 1 ? "ausencia" : "ausencias"}`}</div>
          </div>
          <div style={{ ...estiloTarjeta, padding: "18px 20px" }}>
            <div style={estiloEtiqueta}>Racha</div>
            <div style={{ font: "900 40px / 1 'Big Shoulders Stencil Display', Archivo, sans-serif", color: "var(--foreground)", marginTop: 10 }}><NumeroAnimado valor={Number(ficha.racha)} /></div>
            <div style={{ font: "500 13px Archivo", color: "var(--muted-foreground)", marginTop: 6 }}>semanas seguidas</div>
          </div>
          <div style={{ ...estiloTarjeta, padding: "18px 20px" }}>
            <div style={estiloEtiqueta}>Documentos</div>
            <div style={{ font: "900 40px / 1 'Big Shoulders Stencil Display', Archivo, sans-serif", color: docsPendientes > 0 ? "var(--sh-warn)" : "var(--foreground)", marginTop: 10 }}>{`${docsAprobados}/${ficha.documentos.total}`}</div>
            <div style={{ font: "500 13px Archivo", color: "var(--muted-foreground)", marginTop: 6 }}>{docsPendientes > 0 ? `${docsPendientes} por revisar` : "Todo al día"}</div>
          </div>
        </section>
      )}

      {/* Pestañas */}
      <div role="tablist" aria-label="Secciones de la ficha" style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--sh-line)" }}>
        <button type="button" role="tab" aria-selected={pestana === "datos"} onClick={() => setPestana("datos")} style={etiquetaPestana(pestana === "datos")}>Datos</button>
        <button type="button" role="tab" aria-selected={pestana === "reservas"} onClick={() => setPestana("reservas")} style={etiquetaPestana(pestana === "reservas")}>
          Reservas {reservas.length > 0 && contador(reservas.length, "var(--sh-track-strong)")}
        </button>
        <button type="button" role="tab" aria-selected={pestana === "abonos"} onClick={() => setPestana("abonos")} style={etiquetaPestana(pestana === "abonos")}>Abonos</button>
        <button type="button" role="tab" aria-selected={pestana === "documentos"} onClick={() => setPestana("documentos")} style={etiquetaPestana(pestana === "documentos")}>
          Documentos {docsPendientes > 0 && contador(docsPendientes, "var(--sh-warn-bg)")}
        </button>
        <button type="button" role="tab" aria-selected={pestana === "notas"} onClick={() => setPestana("notas")} style={etiquetaPestana(pestana === "notas")}>Notas</button>
      </div>

      {/* DATOS */}
      {pestana === "datos" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 }}>
          <section style={{ ...estiloTarjeta, padding: "20px 22px" }}>
            <h3 className="bv-admin-titulo" style={{ margin: "0px 0px 6px", font: "800 16px Archivo" }}>Datos personales</h3>
            <dl style={{ margin: 0, display: "grid" }}>
              {filaDato("Nombre", user?.nombre || "—")}
              {filaDato("DNI", user?.dni || "—")}
              {filaDato("Nacimiento", datosPersona.fechaNacimiento ? `${fechaDDMMAAAA(datosPersona.fechaNacimiento)} · ${edad(datosPersona.fechaNacimiento)} años` : "No cargado", datosPersona.fechaNacimiento ? undefined : "var(--muted-foreground)")}
              {filaDato("Correo", user?.email || "Sin correo")}
              {filaDato("Teléfono", user?.telefono || "—")}
              {filaDato("Contacto de emergencia", datosPersona.contactoEmergencia ? `${datosPersona.contactoEmergencia}${datosPersona.telefonoEmergencia ? ` · ${datosPersona.telefonoEmergencia}` : ""}` : "No cargado", datosPersona.contactoEmergencia ? undefined : "var(--muted-foreground)")}
            </dl>
          </section>
          <section style={{ ...estiloTarjeta, padding: "20px 22px" }}>
            <h3 className="bv-admin-titulo" style={{ margin: "0px 0px 6px", font: "800 16px Archivo" }}>Membresía</h3>
            <dl style={{ margin: 0, display: "grid" }}>
              {filaDato("Plan", vigente?.plan || "Sin plan vigente")}
              {filaDato("Inicio", vigente?.inicio ? fechaDDMMAAAA(vigente.inicio) : "—")}
              {filaDato("Vence", vigente?.vencimiento ? `${fechaDDMMAAAA(vigente.vencimiento)} · quedan ${vigente.diasRestantes} días` : "—")}
              {filaDato("Créditos", vigente ? `${vigente.creditos} de ${vigente.totalCreditos}` : `${user?.creditos ?? 0}`)}
              {filaDato("Último pago", pagos.find((p) => p.estadoPago === "confirmado") ? `${dinero(pagos.find((p) => p.estadoPago === "confirmado").importe)} · ${pagos.find((p) => p.estadoPago === "confirmado").formaPago || "—"}` : "Sin pagos")}
              {filaDato("Cuenta", user?.sinAcceso ? "Sin cuenta" : user?.correoVerificado === 0 ? "Sin verificar" : "Verificada", user?.sinAcceso ? "var(--muted-foreground)" : user?.correoVerificado === 0 ? "var(--sh-warn)" : "var(--primary)")}
            </dl>
          </section>
        </div>
      )}

      {/* RESERVAS */}
      {pestana === "reservas" && (
        cargandoReservas ? <Cargando filas={2} className="py-2" /> : reservas.length === 0 ? (
          <div style={{ ...estiloTarjeta, borderStyle: "dashed", padding: "40px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <CalendarX className="h-8 w-8" style={{ color: "var(--muted-foreground)" }} aria-hidden="true" />
            <p style={{ margin: 0, font: "500 14px Archivo", color: "var(--muted-foreground)" }}>No se registran reservas para este usuario.</p>
          </div>
        ) : (
          <div style={{ ...estiloTarjeta, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", font: "500 14px Archivo" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Clase", "Fecha", "Hora", "Coach", "Estado"].map((t) => <th key={t} style={{ padding: "12px 16px", textAlign: "left", ...estiloEtiqueta }}>{t}</th>)}
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => {
                  const est = ESTADOS_RESERVA[r.estadoReserva] || { label: r.estadoReserva || "—", fondo: "var(--sh-track)", linea: "var(--sh-control-line)", tinta: "var(--muted-foreground)" }
                  return (
                    <tr key={r.idReserva} style={{ borderTop: "1px solid var(--sh-line)" }}>
                      <td style={{ padding: "12px 16px", font: "700 14px Archivo" }}>{r.nombreClase}</td>
                      <td style={{ padding: "12px 16px", color: "var(--sh-link)" }}>{fechaDDMMAAAA(r.fechaReserva)}</td>
                      <td style={{ padding: "12px 16px", font: "700 14px Archivo" }}>{r.horaInicio ? `${String(r.horaInicio).slice(0, 5)} hs` : "—"}</td>
                      <td style={{ padding: "12px 16px", color: "var(--sh-link)" }}>{r.nombreProfesor || "—"}</td>
                      <td style={{ padding: "12px 16px" }}><span style={pastilla(est.fondo, est.linea, est.tinta)}>{est.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ABONOS */}
      {pestana === "abonos" && (
        cargandoPagos ? <Cargando filas={2} className="py-2" /> : pagos.length === 0 ? (
          <div style={{ ...estiloTarjeta, borderStyle: "dashed", padding: "40px 24px", textAlign: "center", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Todavía no tiene abonos cargados.</div>
        ) : (
          <div style={{ ...estiloTarjeta, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", font: "500 14px Archivo" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Fecha", "Plan", "Importe", "Forma de pago", "Vence", "Estado"].map((t) => <th key={t} style={{ padding: "12px 16px", textAlign: "left", ...estiloEtiqueta }}>{t}</th>)}
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.idPago} style={{ borderTop: "1px solid var(--sh-line)" }}>
                    <td style={{ padding: "12px 16px" }}>{fechaDDMMAAAA(p.fecha)}</td>
                    <td style={{ padding: "12px 16px", font: "700 14px Archivo" }}>{p.plan || "—"}</td>
                    <td style={{ padding: "12px 16px", font: "700 14px Archivo" }}>{dinero(p.importe)}</td>
                    <td style={{ padding: "12px 16px", color: "var(--sh-link)" }}>{p.formaPago || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "var(--sh-link)" }}>{p.vencimiento ? fechaDDMMAAAA(p.vencimiento) : "—"}</td>
                    <td style={{ padding: "12px 16px" }}><span style={pastilla("transparent", "var(--sh-control-line)", "var(--sh-link)")}>{p.estadoPago}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* DOCUMENTOS */}
      {pestana === "documentos" && (
        <div style={{ ...estiloTarjeta, overflow: "hidden" }}>
          {cargandoDocs ? <Cargando filas={2} className="py-2" /> : TIPOS_DOC.map(({ key, label, Icon }) => {
            const ultimo = documentos.find((d) => d.tipo === key)
            return (
              <div key={key} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px 18px", borderTop: "1px solid var(--sh-line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 10, border: "1px solid var(--border)", display: "grid", placeItems: "center" }}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ font: "700 15px Archivo" }}>{label}</div>
                    <div style={{ font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{ultimo ? `Subido el ${fechaDDMMAAAA(ultimo.creadoEn)}` : "Sin archivo subido"}</div>
                  </div>
                </div>
                {ultimo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={ultimo.estado === "aprobado" ? pastilla("var(--sh-active-bg)", "rgba(155, 230, 0, 0.3)", "var(--primary)") : pastilla("var(--sh-warn-bg)", "var(--sh-warn-line)", "var(--sh-warn)")}>{ultimo.estado === "aprobado" ? "Aprobado" : "En revisión"}</span>
                    <a href={ultimo.urlArchivo} target="_blank" rel="noopener noreferrer" style={{ ...estiloBotonContorno, height: 36, padding: "0px 12px" }}><Eye className="h-3.5 w-3.5" aria-hidden="true" /> Ver</a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* NOTAS */}
      {pestana === "notas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {puede("usuarios:modificacion") && esAlumno && (
            <div style={{ ...estiloTarjeta, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <label htmlFor="nota-nueva" style={{ font: "700 13px Archivo" }}>Nota interna (solo la ven los administradores)</label>
              <textarea id="nota-nueva" value={notaNueva} onChange={(e) => setNotaNueva(e.target.value)} maxLength={1000} rows={3}
                style={{ width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 10, border: "1px solid var(--input-line)", background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo", resize: "vertical" }} />
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button type="button" onClick={guardarNota} disabled={guardandoNota || !notaNueva.trim()} style={{ ...estiloBotonLima, height: 40, opacity: guardandoNota || !notaNueva.trim() ? 0.5 : 1 }}>
                  {guardandoNota ? "Guardando…" : "Guardar nota"}
                </button>
              </div>
            </div>
          )}
          {notas.length === 0 ? (
            <div style={{ ...estiloTarjeta, borderStyle: "dashed", padding: "32px 24px", textAlign: "center", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>Todavía no hay notas sobre este alumno.</div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {notas.map((n) => (
                <li key={n.idNota} style={{ ...estiloTarjeta, padding: "14px 18px" }}>
                  <div style={{ font: "500 12px Archivo", color: "var(--muted-foreground)" }}>{n.creadoEn}</div>
                  <p style={{ margin: "6px 0 0", font: "500 15px / 1.5 Archivo", whiteSpace: "pre-wrap" }}>{n.texto}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Diálogos: activar/desactivar y eliminar */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}>
        <DialogContent style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
          <DialogHeader>
            <DialogTitle className="bv-admin-titulo" style={{ font: "800 20px Archivo" }}>{statusDialog.action === "activate" ? "Activar usuario" : "Desactivar usuario"}</DialogTitle>
            <DialogDescription style={{ font: "500 14px / 1.5 Archivo", color: "var(--muted-foreground)" }}>
              {statusDialog.action === "activate" ? `¿Activar a ${user?.nombre}? Podrá volver a usar el sistema.` : `¿Desactivar a ${user?.nombre}? No podrá reservar clases ni usar sus créditos.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter style={{ gap: 10 }}>
            <button type="button" onClick={() => setStatusDialog({ open: false, action: "" })} style={estiloBotonContorno}>Cancelar</button>
            <button type="button" onClick={() => handleStatusChange(statusDialog.action === "activate" ? "activo" : "inactivo")} disabled={isActionLoading} style={estiloBotonLima}>Confirmar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 24 }}>
          <DialogHeader>
            <DialogTitle className="bv-admin-titulo" style={{ font: "800 20px Archivo", color: "var(--destructive)" }}>Eliminar usuario</DialogTitle>
            <DialogDescription style={{ font: "500 14px / 1.5 Archivo", color: "var(--muted-foreground)" }}>
              Se eliminan todos los datos de {user?.nombre}, incluidos el historial de reservas y los créditos. No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter style={{ gap: 10 }}>
            <button type="button" onClick={() => setDeleteDialog(false)} style={estiloBotonContorno}>Cancelar</button>
            <button type="button" onClick={handleDelete} disabled={isActionLoading} style={{ ...estiloBotonContorno, borderColor: "var(--sh-danger-line)", color: "var(--destructive)" }}>Eliminar</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
