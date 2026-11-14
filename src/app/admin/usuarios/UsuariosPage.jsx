import { EstadoVacio } from "@/components/admin/kit"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Search,
  Plus,
  UserRound,
  MoreHorizontal,
  Eye,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  Download,
  AlertCircle,
  Loader2,
  CreditCard,
  SlidersHorizontal,
  ChevronRight,
  CalendarDays,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { HelpTooltip } from "@/components/ui/help-tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import apiClient, { cambiarEstadoUsuario, eliminarUsuario, normalizarUsuario } from "@/api"
import { toast } from '@/lib/notificar'
import { Cargando } from '@/components/Cargando'
import AlumnoSinCuentaDialog from "./AlumnoSinCuentaDialog"
import { useEdicionFicha } from "./useEdicionFicha"
import { TituloPagina } from "@/components/TituloPagina"
import BotonWhatsApp from "@/components/BotonWhatsApp"
import { descargarExcel, fechaHoyArchivo, fechaHoyLegible, PALETA } from "@/lib/exportarExcel"

const getIniciales = (name) => {
  if (!name) return "??"
  const parts = name.trim().split(" ")
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase()
}

const statusConfig = {
  activo: { label: "Activo", className: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  // Cuenta recién registrada: espera que el admin le asigne un perfil
  pendiente: { label: "Pendiente", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20" },
  suspendido: { label: "Suspendido", className: "bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20" },
}

const membershipConfig = {
  activa:     { label: "Activa",     className: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20" },
  vigente:    { label: "Activa",     className: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20" },
  por_vencer: { label: "Por Vencer", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20" },
  vencida:    { label: "Vencida",    className: "bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20" },
}

// Acciones sobre un usuario. Se muestran según los permisos del perfil (el servidor vuelve a
// controlarlos en cada ruta: ocultar una opción no es la protección).
function MenuAcciones({ user, permisos, navigate, onCambiarEstado, onEliminar, children, variante }) {
  const id = user.idUsuario || user.id
  const ir = (e, ruta) => { e.stopPropagation(); navigate(ruta) }
  if (variante === "ficha") {
    const item = "min-h-[40px] gap-3 px-3 text-[14px] font-bold"
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[232px] p-1.5" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px" }}>
          {permisos.includes("usuarios:modificacion") && (
            user.estado === "inactivo" ? (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCambiarEstado(user, "activate") }} className={item}>
                <UserCheck className="h-4 w-4" aria-hidden="true" /> Activar usuario
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onCambiarEstado(user, "deactivate") }} className={item}>
                <UserX className="h-4 w-4" aria-hidden="true" /> Desactivar usuario
              </DropdownMenuItem>
            )
          )}
          {permisos.includes("usuarios:baja") && (
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEliminar(user) }} className={item} style={{ color: "var(--sh-danger)" }}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar usuario
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {(permisos.includes("usuarios:consulta") || permisos.includes("usuarios:ver")) && (
          <DropdownMenuItem onClick={(e) => ir(e, `/admin/usuarios/${id}`)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalle
          </DropdownMenuItem>
        )}
        {permisos.includes("usuarios:modificacion") && (
          <DropdownMenuItem onClick={(e) => ir(e, `/admin/usuarios/${id}/editar`)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}
        {permisos.includes("usuarios:alta") && (
          <DropdownMenuItem onClick={(e) => ir(e, `/admin/usuarios/abonos/carga-masiva?usuario=${id}`)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Cargar Abono
          </DropdownMenuItem>
        )}
        {permisos.includes("usuarios:modificacion") && (
          <>
            <DropdownMenuSeparator />
            {user.estado === "inactivo" ? (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onCambiarEstado(user, "activate") }}
                className="text-green-700 dark:text-green-500 px-4 py-2"
              >
                <UserCheck className="mr-3 h-5 w-5" />
                Activar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onCambiarEstado(user, "deactivate") }}
                className="text-gray-500 px-4 py-2"
              >
                <UserX className="mr-3 h-5 w-5" />
                Desactivar
              </DropdownMenuItem>
            )}
          </>
        )}
        {permisos.includes("usuarios:baja") && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onEliminar(user) }}
              className="text-destructive px-4 py-2"
            >
              <Trash2 className="mr-3 h-5 w-5" />
              Eliminar Permanente
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const claseEstado = (estado) =>
  estado === "activo" ? "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/30"
    : estado === "suspendido" ? "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"
    : estado === "pendiente" ? "bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/30"
    : "bg-foreground/5 text-foreground/55 border-border"

const claseMembresia = (m) =>
  m === "vigente" || m === "activa" ? "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/20"
    : m === "por_vencer" ? "bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/20"
    : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"

const FILTROS_ESTADO = [
  { id: "all", label: "Todos" },
  { id: "activo", label: "Activos" },
  { id: "inactivo", label: "Inactivos" },
  { id: "suspendido", label: "Suspendidos" },
  { id: "pendiente", label: "Pendientes" },
]
const FILTROS_PERFIL = [
  { id: "all", label: "Todos los perfiles" },
  { id: "admin", label: "Administrador" },
  { id: "profesor", label: "Profesor" },
  { id: "alumno", label: "Alumno" },
]

// Orden de la lista: alfabético, o primero las membresías activas (después por vencer y vencidas)
const PESO_MEMBRESIA = { vigente: 0, activa: 0, por_vencer: 1, vencida: 2 }
const porNombre = (a, b) => String(a.nombre || "").localeCompare(String(b.nombre || ""), "es", { sensitivity: "base" })
function ordenarUsuarios(lista, orden) {
  const copia = [...lista]
  if (orden === "membresia") {
    return copia.sort((a, b) => ((PESO_MEMBRESIA[a.membresia] ?? 3) - (PESO_MEMBRESIA[b.membresia] ?? 3)) || porNombre(a, b))
  }
  return copia.sort(porNombre)
}

const ORDENES = [
  { id: "alfabetico", label: "Nombre (A–Z)" },
  { id: "membresia", label: "Membresía activa primero" },
]

const fechaCorta = (valor) => {
  const d = new Date(valor)
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

const ESTADO_RESERVA = {
  proxima: { label: "Próxima", clase: "border-lime-500/40 bg-lime-400/10 text-lime-700 dark:text-lime-400" },
  completada: { label: "Completada", clase: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-500" },
  cancelada: { label: "Cancelada", clase: "border-border bg-foreground/5 text-foreground/60" },
  inasistencia: { label: "No asistió", clase: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-500" },
}

// Últimas reservas de la persona (solo para perfiles con permiso de ver reservas; el servidor lo vuelve a controlar)
function UltimasReservas({ idUsuario }) {
  const [reservas, setReservas] = useState(null) // null = cargando

  useEffect(() => {
    let vigente = true
    apiClient.get(`/reservas/admin/usuario/${idUsuario}`)
      .then((r) => r.data)
      .then((r) => { if (vigente) setReservas(Array.isArray(r.data) ? r.data.slice(0, 5) : []) })
      .catch(() => { if (vigente) setReservas([]) })
    return () => { vigente = false }
  }, [idUsuario])

  if (reservas === null) return <Cargando filas={2} className="py-2" />
  if (reservas.length === 0) return <p className="flex items-center gap-3 rounded-xl border border-dashed border-border px-[18px] py-[18px] text-[14px] font-medium text-muted-foreground"><CalendarDays className="h-5 w-5 shrink-0" aria-hidden="true" />Todavía no reservó ninguna clase.</p>
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
      {reservas.map((r) => {
        const est = ESTADO_RESERVA[r.estadoReserva] || ESTADO_RESERVA.cancelada
        return (
          <li key={r.idReserva} className="flex items-center gap-3 bg-background/40 px-4 py-2.5">
            <div className="w-24 shrink-0">
              <p className="text-sm font-black tabular-nums text-foreground">{fechaCorta(r.fechaReserva)}</p>
              <p className="text-xs tabular-nums text-foreground/60">{String(r.horaInicio || "").slice(0, 5)} h</p>
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{r.nombreClase}</p>
            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[0.625rem] font-black uppercase tracking-wider ${est.clase}`}>{est.label}</span>
          </li>
        )
      })}
    </ul>
  )
}

// Estilos de la referencia 04 (colores de los tokens del tema)
const pastilla = (fondo, linea, tinta) => ({ padding: "3px 9px", borderRadius: 999, background: fondo, border: `1px solid ${linea}`, color: tinta, font: "700 11px Archivo", whiteSpace: "nowrap" })
const estiloMembresiaPastilla = (m) => (m === "vigente" || m === "activa"
  ? pastilla("var(--sh-active-bg)", "rgba(155, 230, 0, 0.3)", "var(--primary)")
  : m === "por_vencer"
    ? pastilla("var(--sh-warn-bg)", "var(--sh-warn-line)", "var(--sh-warn)")
    : pastilla("var(--sh-danger-bg)", "var(--sh-danger-line)", "var(--sh-danger)"))
const estiloSinVerificar = pastilla("var(--sh-warn-bg)", "var(--sh-warn-line)", "var(--sh-warn)")
const estiloSinCuenta = pastilla("transparent", "var(--sh-control-line)", "var(--muted-foreground)")
// "10 nov 2026" a partir de la fecha de la base (sin pasarla por UTC)
const fechaLarga = (valor) => {
  if (!valor) return ""
  const [y, m, d] = String(valor).slice(0, 10).split("-").map(Number)
  if (!y || !m || !d) return ""
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })
}
const perfilTexto = (u) => { const p = String(u.nombrePerfil || u.perfil || "").trim(); return p ? p.charAt(0).toUpperCase() + p.slice(1) : "Sin perfil" }
const estiloBotonContorno = { display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0px 16px", borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo", whiteSpace: "nowrap", textDecoration: "none", cursor: "pointer" }
const estiloBotonLima = { display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0px 20px", borderRadius: 10, border: "none", background: "var(--primary)", color: "var(--primary-foreground)", font: "800 13px Archivo", letterSpacing: "0.04em", whiteSpace: "nowrap", textDecoration: "none", cursor: "pointer" }

// Ficha del usuario elegido en la lista (computadora), como la referencia 04. "Editar" convierte los datos en campos en su lugar.
function FichaUsuario({ user, permisos, navigate, onCambiarEstado, onEliminar, onGuardado }) {
  const id = user.idUsuario || user.id
  const ed = useEdicionFicha(user, onGuardado)
  const { editando, form, errores } = ed
  const membresia = membershipConfig[user.membresia] || membershipConfig.vencida
  const planes = Array.isArray(user.planes) ? user.planes : []
  const puedeVerReservas = permisos.includes("reservas:consulta")
  const puedeVerDetalle = permisos.includes("usuarios:consulta") || permisos.includes("usuarios:ver")
  const fechaVencimientoTexto = fechaLarga(user.fechaVencimiento)
  const [reenviando, setReenviando] = useState(false)
  const reenviarVerificacion = async () => {
    setReenviando(true)
    try {
      await apiClient.post(`/usuarios/${id}/reenviar-verificacion`)
      toast.success("Reenviamos el correo de verificación", { guardar: false })
    } catch (err) {
      toast.error(err.response?.data?.message || "No se pudo reenviar el correo")
    } finally {
      setReenviando(false)
    }
  }

  const campo = (error) => `w-full border-0 border-b ${error ? "border-red-600/60 dark:border-red-500/60" : "border-lime-500/60"} bg-transparent p-0 pr-6 text-sm font-bold leading-5 text-foreground outline-none transition-colors focus:border-lime-500`
  const conLapiz = (input) => (
    <div className="relative">
      {input}
      <Pencil className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-lime-700 dark:text-lime-400" aria-hidden="true" />
    </div>
  )
  const lista = (etiqueta, valor, alCambiar, opciones, { deshabilitada = false, ancho = "" } = {}) => (
    <div className={`relative ${ancho}`}>
      <Pencil className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-lime-700 dark:text-lime-400" aria-hidden="true" />
      <select aria-label={etiqueta} value={valor} disabled={deshabilitada} onChange={(e) => alCambiar(e.target.value)}
        className="h-7 w-full cursor-pointer rounded-md border border-lime-500/60 bg-card pl-7 pr-2 text-xs font-bold text-foreground outline-none transition-colors focus:border-lime-500 disabled:opacity-60">
        {opciones.map((o) => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
      </select>
    </div>
  )
  const mensaje = (texto) => texto && <p className="mt-1 text-xs text-red-700 dark:text-red-400">{texto}</p>

  const celdaContacto = (titulo, valor, primera = false) => (
    <div style={{ minWidth: 0, padding: "14px 18px", borderLeft: primera ? "none" : "1px solid var(--border)" }}>
      <p style={{ margin: 0, font: "600 12px Archivo", color: "var(--muted-foreground)" }}>{titulo}</p>
      <div style={{ marginTop: 3, font: "700 15px Archivo", color: "var(--foreground)" }}>{valor}</div>
    </div>
  )
  // Edición: los mismos campos con su lápiz (sin cambiar de pantalla)
  const datoEdicion = (titulo, valor, primera = false) => (
    <div className={`min-w-0 px-[18px] py-3.5 ${primera ? "" : "border-l border-border"}`}>
      <p className="text-[0.625rem] font-black uppercase tracking-widest text-foreground/60">{titulo}</p>
      <div className="mt-0.5 text-sm font-bold text-foreground">{valor}</div>
    </div>
  )

  const avatar = (
    <span style={{ width: 68, height: 68, flexShrink: 0, borderRadius: 18, background: "var(--primary)", color: "var(--primary-foreground)", display: "grid", placeItems: "center", overflow: "hidden", font: "900 30px 'Big Shoulders Stencil Display', Archivo, sans-serif" }}>
      {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : getIniciales(user.nombre)}
    </span>
  )

  return (
    <section aria-label={`Ficha de ${user.nombre}`} style={{ borderRadius: 16, background: "var(--card)", border: `1px solid ${editando ? "var(--primary)" : "var(--border)"}`, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
        {avatar}
        <div style={{ minWidth: 0, flex: "1 1 0%" }}>
          {editando ? (
            <div>
              <div className="relative">
                <input aria-label="Nombre completo" maxLength={100} autoComplete="off" value={form.nombre} onChange={(e) => ed.cambiar("nombre", e.target.value)}
                  className={`w-full border-0 border-b-2 ${errores.nombre ? "border-red-600/60" : "border-lime-500/60"} bg-transparent p-0 pr-7 text-base font-black leading-tight text-foreground outline-none focus:border-lime-500`} />
                <Pencil className="pointer-events-none absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 text-lime-700 dark:text-lime-400" aria-hidden="true" />
              </div>
              {mensaje(errores.nombre)}
              <div className="mt-1.5 max-w-[15rem]">
                {lista(
                  "Perfil de acceso",
                  form.idPerfil,
                  (v) => ed.cambiar("idPerfil", v),
                  ed.perfiles === null
                    ? [{ valor: form.idPerfil, texto: "Cargando perfiles…" }]
                    : [{ valor: "", texto: "Elegí un perfil" }, ...ed.perfiles.map((p) => ({ valor: String(p.idPerfil), texto: p.nombrePerfil }))],
                  { deshabilitada: ed.perfiles === null },
                )}
              </div>
              {mensaje(errores.idPerfil)}
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h2 className="bv-admin-titulo" style={{ margin: 0, font: "800 22px Archivo" }}>{user.nombre}</h2>
                <span style={{ padding: "3px 9px", borderRadius: 999, border: "1px solid var(--sh-control-line)", color: "var(--muted-foreground)", font: "700 11px Archivo", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  {(user.nombrePerfil || user.perfil || "Sin perfil").trim()}
                </span>
              </div>
              <p style={{ margin: "4px 0 0", font: "500 14px Archivo", color: "var(--muted-foreground)" }}>{user.email || "Sin correo"}</p>
            </>
          )}
        </div>
        {!editando && (
          <MenuAcciones variante="ficha" user={user} permisos={permisos} navigate={navigate} onCambiarEstado={onCambiarEstado} onEliminar={onEliminar}>
            <button type="button" aria-label={`Más acciones para ${user.nombre}`}
              style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </MenuAcciones>
        )}
      </div>

      {!editando && !user.sinAcceso && user.correoVerificado === 0 && (
        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, borderRadius: 12, border: "1px solid var(--sh-warn-line)", background: "var(--sh-warn-bg)", padding: "12px 16px" }}>
          <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, font: "600 14px Archivo", color: "var(--sh-warn)" }}>
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Todavía no verificó su correo. La cuenta se activa sola cuando lo haga.
          </p>
          {permisos.includes("usuarios:modificacion") && (
            <button type="button" onClick={reenviarVerificacion} disabled={reenviando}
              style={{ minHeight: 36, padding: "0px 12px", borderRadius: 8, border: "1px solid var(--sh-warn-line)", background: "transparent", color: "var(--sh-warn)", font: "800 12px Archivo", textTransform: "uppercase", letterSpacing: "0.04em", cursor: "pointer", opacity: reenviando ? 0.5 : 1 }}>
              {reenviando ? "Enviando…" : "Reenviar correo"}
            </button>
          )}
        </div>
      )}

      {!editando && (
        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button type="button" onClick={() => navigate(`/admin/usuarios/abonos/carga-masiva?usuario=${id}`)} style={estiloBotonLima}>
            <Plus className="h-4 w-4" aria-hidden="true" /> CARGAR ABONO
          </button>
          <button type="button" onClick={() => navigate(`/admin/usuarios/abonos/carga-masiva?usuario=${id}`)} style={estiloBotonContorno}>
            <CreditCard className="h-4 w-4" aria-hidden="true" /> Ver abonos
          </button>
          {puedeVerDetalle && (
            <button type="button" onClick={() => navigate(`/admin/usuarios/${id}`)} style={estiloBotonContorno}>
              <Eye className="h-4 w-4" aria-hidden="true" /> Ficha completa
            </button>
          )}
          {permisos.includes("usuarios:modificacion") && (
            <button type="button" onClick={ed.abrir} style={estiloBotonContorno}>
              <Pencil className="h-4 w-4" aria-hidden="true" /> Editar
            </button>
          )}
        </div>
      )}

      {editando && (
        <div className="mt-6 grid grid-cols-3 gap-3.5">
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted px-[18px] py-4">
            <p className="text-[12px] font-bold uppercase tracking-[.1em] text-muted-foreground">Membresía</p>
            <span className={`mt-1.5 inline-block rounded-md border px-2 py-0.5 text-xs font-black uppercase tracking-wider ${claseMembresia(user.membresia)}`}>{membresia.label}</span>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted px-[18px] py-4">
            <p className="text-[12px] font-bold uppercase tracking-[.1em] text-muted-foreground">Créditos disponibles</p>
            <p className="text-[40px] font-black leading-none tabular-nums text-lime-700 dark:text-lime-400" style={{ fontFamily: "'Big Shoulders Stencil Display', Archivo, sans-serif" }}>{Number(user.creditos) || 0}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted px-[18px] py-4">
            <p className="text-[12px] font-bold uppercase tracking-[.1em] text-muted-foreground">{!ed.propia ? "Estado general" : "Plan vigente"}</p>
            {!ed.propia ? (
              <div className="mt-1.5">
                {lista(
                  "Estado de la cuenta",
                  form.estado,
                  (v) => ed.cambiar("estado", v),
                  [
                    ...(form.estado === "pendiente" || form.estado === "suspendido" ? [{ valor: form.estado, texto: (statusConfig[form.estado] || statusConfig.activo).label }] : []),
                    { valor: "activo", texto: "Activo" },
                    { valor: "inactivo", texto: "Inactivo" },
                  ],
                )}
              </div>
            ) : (
              <span className="mt-1.5 block text-[17px] font-extrabold text-foreground">{planes.length ? planes.map((p) => p.nombre).join(", ") : "Ninguno"}</span>
            )}
          </div>
        </div>
      )}
      {editando && ed.propia && <p className="mt-2 text-xs text-foreground/60">Es tu cuenta: podés pasarte a un perfil igual o con menos permisos que el tuyo, nunca a uno con más. El estado lo cambia otro administrador.</p>}

      {!editando && (
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--muted)", padding: "16px 18px" }}>
            <p style={{ margin: 0, font: "700 12px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Membresía</p>
            <span style={{ ...estiloMembresiaPastilla(user.membresia), display: "inline-block", marginTop: 10 }}>{membresia.label}</span>
            {fechaVencimientoTexto && <p style={{ margin: "10px 0 0", font: "500 13px Archivo", color: "var(--muted-foreground)" }}>{`${user.membresia === "vencida" ? "Venció" : "Vence"} el ${fechaVencimientoTexto}`}</p>}
          </div>
          <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--muted)", padding: "16px 18px" }}>
            <p style={{ margin: 0, font: "700 12px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Créditos disponibles</p>
            <p style={{ margin: "8px 0 0", font: "900 56px / 1 'Big Shoulders Stencil Display', Archivo, sans-serif", fontVariantNumeric: "tabular-nums", color: Number(user.creditos) > 0 ? "var(--primary)" : "var(--destructive)" }}>{Number(user.creditos) || 0}</p>
          </div>
          <div style={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--muted)", padding: "16px 18px" }}>
            <p style={{ margin: 0, font: "700 12px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Plan vigente</p>
            <span style={{ display: "block", marginTop: 10, font: "800 17px Archivo", color: "var(--foreground)" }}>{planes.length ? planes.map((p) => p.nombre).join(", ") : "Ninguno"}</span>
          </div>
        </div>
      )}

      <p style={{ margin: "24px 0 0", font: "700 12px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Datos de contacto</p>
      {editando ? (
        <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-xl border border-border">
          {datoEdicion("DNI", <>{conLapiz(<input aria-label="DNI" inputMode="numeric" maxLength={10} value={form.dni} onChange={(e) => ed.cambiar("dni", e.target.value.replace(/\D/g, ""))} className={campo(errores.dni)} />)}{mensaje(errores.dni)}</>, true)}
          {datoEdicion("Teléfono", <>{conLapiz(<input aria-label="Teléfono" type="tel" inputMode="tel" maxLength={30} value={form.telefono} onChange={(e) => ed.cambiar("telefono", e.target.value)} className={campo(errores.telefono)} />)}{mensaje(errores.telefono)}</>)}
          {datoEdicion("Correo electrónico", <>{conLapiz(<input aria-label="Correo electrónico" type="email" autoComplete="off" maxLength={100} value={form.email} onChange={(e) => ed.cambiar("email", e.target.value)} className={campo(errores.email)} />)}{mensaje(errores.email)}</>)}
        </div>
      ) : (
        <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", overflow: "hidden", borderRadius: 12, border: "1px solid var(--border)" }}>
          {celdaContacto("DNI", user.dni || "—", true)}
          {celdaContacto("Teléfono", user.telefono ? <span style={{ display: "flex", alignItems: "center", gap: 10 }}><a href={`tel:${user.telefono}`} className="underline-offset-2 hover:underline">{user.telefono}</a><BotonWhatsApp telefono={user.telefono} nombre={user.nombre} /></span> : "—")}
          {celdaContacto("Correo electrónico", <span className="block truncate">{user.email || "Sin correo"}</span>)}
        </div>
      )}

      {editando ? (
        <div className="mt-6">
          {ed.confirmando && (
            <p role="alert" className="mb-3 rounded-xl border border-yellow-400/40 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-900 dark:text-yellow-200">
              <strong>¿Confirmás?</strong> {ed.textoConfirmacion}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={ed.guardar} disabled={ed.guardando || ed.perfiles === null}
              className="inline-flex min-h-[2.75rem] items-center gap-1.5 rounded-xl bg-lime-400 px-5 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:opacity-50">
              {ed.guardando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {ed.confirmando ? "Sí, guardar" : "Guardar cambios"}
            </button>
            <button type="button" onClick={ed.cancelar} disabled={ed.guardando}
              className="inline-flex min-h-[2.75rem] items-center rounded-xl border border-border px-5 text-xs font-black uppercase tracking-widest text-foreground transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 disabled:opacity-50">
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {puedeVerReservas && (
        <>
          <p style={{ margin: "24px 0 0", font: "700 12px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Últimas reservas</p>
          <div className="mt-2">
            <UltimasReservas key={id} idUsuario={id} />
          </div>
        </>
      )}
    </section>
  )
}

// Un grupo del panel de filtros: título y, abajo, las opciones como botones
function GrupoFiltros({ titulo, children }) {
  return (
    <div className="space-y-3 border-border [&:not(:first-child)]:border-t [&:not(:first-child)]:pt-3 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-t-0 md:[&:not(:first-child)]:pl-4 md:[&:not(:first-child)]:pt-0">
      <p className="text-[0.6875rem] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">{titulo}</p>
      {children}
    </div>
  )
}

// Fila de botones para elegir una opción de un filtro
function ChipsFiltro({ titulo, opciones, valor, onChange }) {
  return (
    <div>
      <p className="pb-1.5 text-[0.625rem] font-black uppercase tracking-widest text-foreground/55">{titulo}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={titulo}>
        {opciones.map((o) => (
          <button key={o.id} type="button" onClick={() => onChange(o.id)} aria-pressed={valor === o.id}
            className={`min-h-[2.25rem] rounded-full border px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${valor === o.id ? "border-lime-500 bg-lime-400 text-black" : "border-border bg-background text-foreground/70 hover:border-foreground/30"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function UsuariosPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [horaFilter, setHoraFilter] = useState("all")
  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null, action: "" })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [verFiltros, setVerFiltros] = useState(false)
  const [sinCuentaAbierto, setSinCuentaAbierto] = useState(false) // ventana para registrar un alumno sin cuenta
  const [orden, setOrden] = useState("alfabetico")
  const [seleccionadoId, setSeleccionadoId] = useState(null) // usuario elegido en la lista de computadora
  // Todos los planes del módulo Planes y todas las horas de clase cargadas (no solo las de quienes ya tienen algo)
  const [opciones, setOpciones] = useState({ planes: [], horas: [] })

  // 🟢 ESTADO PARA LOS PERMISOS DEL USUARIO LOGUEADO
  const [permisos, setPermisos] = useState([])

  // Cargar usuarios y permisos al montar el componente
  useEffect(() => {
    cargarUsuarios()
    apiClient.get("/usuarios/filtros")
      .then((r) => r.data)
      .then((j) => { if (j?.data) setOpciones({ planes: j.data.planes || [], horas: j.data.horas || [] }) })
      .catch(() => { /* sin opciones: los filtros de plan y hora quedan vacíos */ })

    // 🟢 CARGAMOS LOS PERMISOS DESDE EL LOCALSTORAGE
    const storedPermisos = localStorage.getItem("permisos")
    if (storedPermisos) {
      try {
        setPermisos(JSON.parse(storedPermisos))
      } catch (err) {
        console.error("Error al parsear permisos en UsuariosPage:", err)
      }
    }
  }, [])

  const cargarUsuarios = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // 🟢 FETCH DIRECTO AL BACKEND: Saltamos getUsuarios() para evitar filtros fantasmas
      const res = await apiClient.get("/usuarios")
      const resultado = res.data
      
      const listaReal = resultado.data || resultado;
      setUsers(Array.isArray(listaReal) ? listaReal : [])
    } catch (err) {
      setError("No se pudieron cargar los usuarios. Por favor, intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // ✨ FILTRO BLINDADO CONTRA CAMPOS NULOS O MAYÚSCULAS DE LA BASE DE DATOS
  const usuariosNormalizados = users
    .map((user) => {
      const normalized = normalizarUsuario ? normalizarUsuario(user) : user
      
      // 🟢 CAPTURA DIRECTA DE SQL: Si el backend manda nombrePerfil, lo usamos directo sin intermediarios
      const nombrePerfilReal = user.nombrePerfil || normalized.nombrePerfil || user.perfil || "";
      const idPerfilReal = user.idPerfil !== undefined ? user.idPerfil : normalized.idPerfil;
      const idReal = user.idUsuario || normalized.idUsuario || user.id || normalized.id;

      // 🟢 TRATAMIENTO DE MEMBRESÍA: Evita strings vacíos o roturas por mayúsculas
      let membresiaBackend = String(user.membresia || normalized.membresia || "").toLowerCase().trim();

      // Homologamos términos del backend al tipado del objeto de configuración local
      if (membresiaBackend === "activa" || membresiaBackend === "activo") {
        membresiaBackend = "vigente";
      }

      // Si viene nula o no coincide con los badges visuales, deducimos según el estado base del alumno
      if (!membershipConfig[membresiaBackend]) {
        membresiaBackend = (user.estado === "activo" || normalized.estado === "activo") ? "vigente" : "vencida";
      }

      return {
        ...normalized,
        ...user, // Inyectamos las propiedades crudas encima
        idUsuario: idReal,
        idPerfil: idPerfilReal,
        nombrePerfil: nombrePerfilReal, // Forzamos que se guarde el texto real que viene de la query
        estado: statusConfig[user.estado || normalized.estado] ? (user.estado || normalized.estado) : "activo",
        membresia: membresiaBackend
      }
    })

  // Filtros activos (para el contador del botón) y cómo volver a mostrar a todos
  const filtrosActivos = [statusFilter, roleFilter, planFilter, horaFilter].filter((f) => f !== "all").length
  const limpiarFiltros = () => { setStatusFilter("all"); setRoleFilter("all"); setPlanFilter("all"); setHoraFilter("all") }

  // Panel de filtros agrupado: persona, plan, clase y orden. Se usa igual en celular y en computadora.
  const panelFiltros = (
    <div className="grid gap-3 md:grid-cols-4 md:gap-4">
      <GrupoFiltros titulo="Persona">
        <div className="hidden md:block">
          <ChipsFiltro titulo="Estado" opciones={FILTROS_ESTADO} valor={statusFilter} onChange={setStatusFilter} />
        </div>
        <ChipsFiltro titulo="Perfil" opciones={FILTROS_PERFIL} valor={roleFilter} onChange={setRoleFilter} />
      </GrupoFiltros>
      <GrupoFiltros titulo="Plan">
        {opciones.planes.length > 0 && (
          <ChipsFiltro titulo="Plan" valor={planFilter} onChange={setPlanFilter}
            opciones={[{ id: "all", label: "Todos los planes" }, ...opciones.planes.map((p) => ({ id: String(p.idPlan), label: p.nombre }))]} />
        )}
      </GrupoFiltros>
      <GrupoFiltros titulo="Clase">
        {opciones.horas.length > 0 ? (
          <ChipsFiltro titulo="Hora de su clase reservada" valor={horaFilter} onChange={setHoraFilter}
            opciones={[{ id: "all", label: "Todas" }, ...opciones.horas.map((h) => ({ id: h, label: h }))]} />
        ) : (
          <p className="text-xs text-foreground/55">Todavía no hay clases cargadas.</p>
        )}
      </GrupoFiltros>
      <GrupoFiltros titulo="Orden">
        <ChipsFiltro titulo="Ordenar por" opciones={ORDENES} valor={orden} onChange={setOrden} />
      </GrupoFiltros>
    </div>
  )

  const filteredUsers = ordenarUsuarios(usuariosNormalizados
    .filter((user) => {
      const nombreUser = (user.nombre || user.nombrecompleto || "").toLowerCase()
      const dniUser = user.dni || ""
      const emailUser = (user.email || user.correo || "").toLowerCase()

      const matchesSearch =
        nombreUser.includes(search.toLowerCase()) ||
        dniUser.includes(search) ||
        emailUser.includes(search.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || user.estado === statusFilter
      
      // Filtro de roles por ID numérico o texto
      const stringPerfil = String(user.nombrePerfil || user.idPerfil || "").toLowerCase()
      const matchesRole = roleFilter === "all" || stringPerfil.includes(roleFilter.toLowerCase())
      
      // Plan y hora: miran la membresía vigente y las clases reservadas que vienen en cada usuario
      const matchesPlan = planFilter === "all" || (user.planes || []).some((p) => String(p.idPlan) === planFilter)
      const matchesHora = horaFilter === "all" || (user.horas || []).includes(horaFilter)

      return matchesSearch && matchesStatus && matchesRole && matchesPlan && matchesHora
    }), orden)

  // Si el elegido ya no está en la lista (por un filtro o una búsqueda), se muestra el primero
  // Exporta a Excel la lista tal como se ve (con los filtros y el orden aplicados)
  const exportarUsuarios = () => {
    const legible = (s) => (s ? String(s).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : "")
    descargarExcel(`usuarios-bravos-${fechaHoyArchivo()}.xlsx`, {
      titulo: "Usuarios de Bravos",
      subtitulo: `Exportado el ${fechaHoyLegible()} · ${filteredUsers.length} ${filteredUsers.length === 1 ? "usuario" : "usuarios"}`,
      hojas: [{
        nombre: "Usuarios",
        encabezados: ["Nombre", "DNI", "Correo", "Teléfono", "Perfil", "Membresía", "Estado"],
        filas: filteredUsers.map((u) => [
          u.nombre || "", u.dni || "", u.email || "", u.telefono || "",
          u.nombrePerfil || u.perfil || "", legible(u.membresia), legible(u.estado),
        ]),
        anchos: [30, 14, 32, 18, 16, 16, 14],
        // Colores según la membresía y el estado de cada usuario
        estilo: (valor, j) => {
          const v = String(valor)
          if (j === 5) {
            if (v === "Vigente") return PALETA.verde
            if (v === "Por vencer") return PALETA.ambar
            if (v === "Vencida") return PALETA.rojo
          }
          if (j === 6) {
            if (v === "Activo") return PALETA.verde
            if (v === "Pendiente") return PALETA.ambar
            if (v === "Inactivo") return PALETA.rojo
          }
          return null
        },
      }],
    })
  }

  const seleccionado = filteredUsers.find((u) => (u.idUsuario || u.id) === seleccionadoId) || filteredUsers[0] || null

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await cambiarEstadoUsuario(userId, newStatus)
      setUsers(users.map((u) => ((u.idUsuario || u.id) === userId ? { ...u, estado: newStatus } : u)))
    } catch (err) {
      toast.error("Error al cambiar el estado del usuario")
    }
    setConfirmDialog({ open: false, user: null, action: "" })
  }

  const handleDeleteUser = async (userId) => {
    setIsDeleting(true)
    try {
      await eliminarUsuario(userId)
      setUsers(prev => prev.filter((u) => (u.idUsuario || u.id) !== userId))
      toast.success("Usuario eliminado correctamente")
    } catch (err) {
      toast.error("Error al eliminar el usuario", { description: err?.response?.data?.message || err.message })
    } finally {
      setIsDeleting(false)
      setDeleteDialog({ open: false, user: null })
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <TituloPagina descripcion={"Alumnos, profesores y administradores del box"}>Usuarios y abonos</TituloPagina>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 md:hidden">
          {permisos.includes("usuarios:alta") && (
            <Link
              to="/admin/usuarios/nuevo"
              className="inline-flex min-h-[2.75rem] justify-center shrink-0 items-center gap-2 rounded-full bg-lime-400 px-4 py-2 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-lime-300 md:min-h-0 md:rounded-full"
            >
              <Plus className="h-4 w-4" />
              <span className="md:hidden">Nuevo</span>
              <span className="hidden md:inline">Nuevo Usuario</span>
            </Link>
          )}
          {permisos.includes("usuarios:alta") && (
            <button
              type="button"
              onClick={() => setSinCuentaAbierto(true)}
              title="Para quien no usa el sistema: se registra sin contraseña y vos le gestionás las membresías"
              className="inline-flex min-h-[2.75rem] justify-center shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground transition-colors hover:border-lime-500 md:min-h-0 md:rounded-full"
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span className="md:hidden">Sin cuenta</span>
              <span className="hidden md:inline">Alumno sin cuenta</span>
            </button>
          )}
        </div>
      </div>

      {/* ── CELULAR ── */}
      <div className="space-y-4 md:hidden">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar por nombre, DNI o email..."
              aria-label="Buscar usuarios"
              className="h-11 rounded-xl bg-card pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setVerFiltros((v) => !v)}
            aria-expanded={verFiltros}
            aria-label="Filtros y orden"
            className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
              verFiltros || filtrosActivos > 0 || orden !== "alfabetico" ? "border-lime-500 bg-lime-400/10 text-lime-700 dark:text-lime-400" : "border-border bg-card text-foreground/70"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {(filtrosActivos > 0 || orden !== "alfabetico") && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-lime-400" aria-hidden="true" />}
          </button>
        </div>

        {/* Filtros y orden agrupados: se abren con el botón de al lado del buscador */}
        {verFiltros && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-3">
            {panelFiltros}
            {filtrosActivos > 0 && (
              <button type="button" onClick={limpiarFiltros} className="min-h-[2.25rem] text-xs font-bold text-lime-700 underline-offset-2 hover:underline dark:text-lime-400">
                Quitar los filtros
              </button>
            )}
          </div>
        )}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Estado">
          {FILTROS_ESTADO.map((e) => {
            const cantidad = e.id === "all" ? usuariosNormalizados.length : usuariosNormalizados.filter((u) => u.estado === e.id).length
            if (cantidad === 0 && !["all", "activo", "inactivo"].includes(e.id)) return null
            const activo = statusFilter === e.id
            return (
              <button key={e.id} type="button" onClick={() => setStatusFilter(e.id)} aria-pressed={activo}
                className={`flex min-h-[2.25rem] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-black uppercase tracking-wide transition-colors ${
                  activo ? "border-lime-500 bg-lime-400 text-black" : "border-border bg-card text-foreground/70"
                }`}>
                {e.label}
                <span className={`rounded-full px-1.5 text-[0.625rem] ${activo ? "bg-black/15" : "bg-foreground/10"}`}>{cantidad}</span>
              </button>
            )
          })}
        </div>

        <p className="text-[0.6875rem] font-black uppercase tracking-widest text-foreground/55">Lista de usuarios ({filteredUsers.length})</p>

        {isLoading ? (
          <Cargando filas={3} className="py-4" />
        ) : filteredUsers.length === 0 ? (
          <p className="rounded-2xl border border-border bg-card px-4 py-8 text-center text-sm text-foreground/60">No hay usuarios con esos filtros.</p>
        ) : (
          <ul className="space-y-3">
            {filteredUsers.map((user) => {
              const id = user.idUsuario || user.id
              const activo = user.estado === "activo"
              const membresia = membershipConfig[user.membresia] || membershipConfig.vencida
              return (
                <li key={id} className={`overflow-hidden rounded-2xl border bg-card ${activo ? "border-border border-l-4 border-l-lime-400" : "border-border"}`}>
                  <div className="flex items-start gap-3 p-4 pb-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-lime-400 text-sm font-black text-black">
                      {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : getIniciales(user.nombre)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black text-foreground">{user.nombre}</p>
                      <p className="truncate text-xs text-foreground/60">{user.email || "Sin correo"}</p>
                      {user.sinAcceso && <span className="mt-1 inline-block rounded border border-border px-1.5 py-0.5 text-[0.625rem] font-black uppercase tracking-widest text-foreground/60">Sin cuenta</span>}
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[0.625rem] font-black uppercase tracking-widest ${claseEstado(user.estado)}`}>
                      {(statusConfig[user.estado] || statusConfig.activo).label}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border px-4 py-3 text-xs">
                    <div className="min-w-0">
                      <dt className="text-foreground/50">DNI</dt>
                      <dd className="truncate font-semibold text-foreground">{user.dni || "—"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-foreground/50">Teléfono</dt>
                      <dd className="truncate font-semibold text-foreground">
                        {user.telefono ? <span className="flex items-center gap-2"><a href={`tel:${user.telefono}`} className="truncate underline-offset-2 hover:underline">{user.telefono}</a><BotonWhatsApp telefono={user.telefono} nombre={user.nombre} /></span> : "—"}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-foreground/50">Perfil</dt>
                      <dd className="truncate font-semibold text-foreground">{user.nombrePerfil || user.perfil || "Sin perfil"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-foreground/50">Membresía</dt>
                      <dd className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-md border px-1.5 py-0.5 text-[0.625rem] font-black uppercase tracking-wider ${claseMembresia(user.membresia)}`}>{membresia.label}</span>
                        <span className="font-semibold tabular-nums text-foreground/70">{Number(user.creditos) || 0} créd.</span>
                      </dd>
                    </div>
                  </dl>

                  <div className="flex items-center gap-2 border-t border-border px-4 py-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/admin/usuarios/abonos/carga-masiva?usuario=${id}`)}
                      className={`flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                        activo ? "bg-lime-400 text-black hover:bg-lime-300" : "border border-lime-500/50 bg-lime-400/5 text-lime-700 dark:text-lime-400"
                      }`}
                    >
                      Ver abonos <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <MenuAcciones
                      user={user}
                      permisos={permisos}
                      navigate={navigate}
                      onCambiarEstado={(u, action) => setConfirmDialog({ open: true, user: u, action })}
                      onEliminar={(u) => setDeleteDialog({ open: true, user: u })}
                    >
                      <button type="button" aria-label={`Más acciones para ${user.nombre}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground/70 transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </MenuAcciones>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── COMPUTADORA Y TABLET ── */}
      <div className="hidden md:block">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ position: "relative", flex: "1 1 0%", minWidth: 220, display: "block" }}>
            <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0px, 0px, 0px, 0px)" }}>Buscar usuario</span>
            <span style={{ position: "absolute", left: 14, top: 15, color: "var(--muted-foreground)", display: "flex" }}>
              <Search className="h-[17px] w-[17px]" aria-hidden="true" />
            </span>
            <input type="search" placeholder="Buscar por nombre, DNI o correo" value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", height: 46, padding: "0px 14px 0px 42px", borderRadius: 10, border: "1px solid var(--border)", background: "var(--card)", color: "var(--foreground)", font: "500 15px Archivo" }} />
          </label>
          <button type="button" onClick={() => setVerFiltros((v) => !v)} aria-expanded={verFiltros} aria-controls="filtros" style={verFiltros ? { ...estiloBotonContorno, border: "1px solid var(--primary)" } : estiloBotonContorno}>
            <SlidersHorizontal className="h-[17px] w-[17px]" aria-hidden="true" />
            Filtros
            {filtrosActivos > 0 && <span style={{ borderRadius: 999, background: "var(--primary)", color: "var(--primary-foreground)", padding: "0px 6px", font: "800 11px Archivo" }}>{filtrosActivos}</span>}
          </button>
          {(permisos.includes("usuarios:consulta") || permisos.includes("usuarios:ver")) && (
            <button type="button" onClick={exportarUsuarios} style={estiloBotonContorno}>
              <Download className="h-[17px] w-[17px]" aria-hidden="true" />
              Exportar
            </button>
          )}
          {permisos.includes("usuarios:alta") && (
            <button type="button" onClick={() => setSinCuentaAbierto(true)} title="Para quien no usa el sistema: se registra sin contraseña y vos le gestionás las membresías" style={estiloBotonContorno}>
              <UserRound className="h-[17px] w-[17px]" aria-hidden="true" />
              Alumno sin cuenta
            </button>
          )}
          {permisos.includes("usuarios:alta") && (
            <Link to="/admin/usuarios/nuevo" style={estiloBotonLima}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              NUEVO USUARIO
            </Link>
          )}
        </div>

        {verFiltros && (
          <div id="filtros" className="mt-4 space-y-3 border-t border-border pt-4 lg:hidden">
            {panelFiltros}
            {filtrosActivos > 0 && (
              <button type="button" onClick={limpiarFiltros} className="text-xs font-bold text-lime-700 underline-offset-2 hover:underline dark:text-lime-400">
                Quitar los filtros
              </button>
            )}
          </div>
        )}
        {verFiltros && (
          <section id="filtros-escritorio" aria-label="Filtros" className="hidden lg:block" style={{ marginTop: 20, borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)", padding: "22px 24px" }}>
            {(() => {
              const grupo = (titulo, opciones, valor, onChange) => (
                <div role="group" aria-label={titulo} style={{ minWidth: 0 }}>
                  <div style={{ marginBottom: 12, font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>{titulo}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {opciones.map((o) => {
                      const elegido = valor === o.id
                      return (
                        <button key={o.id} type="button" aria-pressed={elegido} onClick={() => onChange(o.id)}
                          style={{ height: 36, padding: "0px 14px", borderRadius: 999, border: `1px solid ${elegido ? "var(--primary)" : "var(--sh-control-line)"}`, background: elegido ? "var(--primary)" : "transparent", color: elegido ? "var(--primary-foreground)" : "var(--foreground)", font: "700 13px Archivo", whiteSpace: "nowrap", cursor: "pointer" }}>
                          {o.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
              return (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 340px) minmax(0, 200px) minmax(0, 230px) minmax(0, 1fr) minmax(0, 220px)", gap: 40 }}>
                    {grupo("Estado", FILTROS_ESTADO, statusFilter, setStatusFilter)}
                    {grupo("Perfil", FILTROS_PERFIL.map((o) => (o.id === "all" ? { ...o, label: "Todos" } : o)), roleFilter, setRoleFilter)}
                    {grupo("Plan", [{ id: "all", label: "Todos" }, ...opciones.planes.map((p) => ({ id: String(p.idPlan), label: p.nombre }))], planFilter, setPlanFilter)}
                    {grupo("Horario de su clase", [{ id: "all", label: "Todos" }, ...opciones.horas.map((h) => ({ id: h, label: h }))], horaFilter, setHoraFilter)}
                    {grupo("Ordenar por", ORDENES, orden, setOrden)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
                    <span style={{ font: "500 14px Archivo", color: "var(--muted-foreground)" }}>{filteredUsers.length + (filteredUsers.length === 1 ? " usuario" : " usuarios")}</span>
                    <button type="button" onClick={() => { limpiarFiltros(); setOrden("alfabetico") }} style={{ border: "none", background: "transparent", color: "var(--muted-foreground)", font: "600 14px Archivo", cursor: "pointer" }}>Limpiar filtros</button>
                  </div>
                </>
              )
            })()}
          </section>
        )}
      </div>

      <div className="hidden border border-border bg-card md:block lg:hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-2.5">
          <p className="text-[0.625rem] font-black uppercase tracking-widest text-muted-foreground">Usuarios ({filteredUsers.length})</p>
        </div>
        <div>
          {isLoading ? (
            <Cargando filas={3} className="py-4" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Usuario</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground hidden md:table-cell">DNI</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground hidden lg:table-cell">Teléfono</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground hidden sm:table-cell">Perfil</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Estado</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground hidden sm:table-cell">Membresía</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground hidden lg:table-cell">Créditos</th>
                    <th className="text-right px-4 py-3 text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.idUsuario || user.id} className="group hover:bg-foreground/3 transition-colors cursor-pointer" onClick={(e) => { if (!e.target.closest('[data-no-navigate]')) navigate(`/admin/usuarios/abonos/carga-masiva?usuario=${user.idUsuario || user.id}`) }}>
                      <td className="relative px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 shrink-0 bg-lime-400 rounded-full flex items-center justify-center text-black font-black text-xs overflow-hidden">
                            {user.avatarUrl
                              ? <img src={user.avatarUrl} alt={user.nombre} className="h-full w-full object-cover" />
                              : getIniciales(user.nombre)
                            }
                          </div>
                          <div>
                            <p className="max-w-[10.625rem] truncate font-semibold text-sm text-foreground sm:max-w-none">
                              {user.nombre}
                              {user.sinAcceso && <span className="ml-2 rounded border border-border px-1.5 py-0.5 align-middle text-[0.625rem] font-black uppercase tracking-widest text-foreground/60">Sin cuenta</span>}
                            </p>
                            <p className="max-w-[10.625rem] truncate text-xs text-foreground/40 sm:max-w-none">{user.email}</p>
                            {/* En celular y tablet no hay "pasar el mouse": el acceso a los abonos se ve siempre */}
                            <span className="mt-1.5 inline-block whitespace-nowrap border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-[0.625rem] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400 xl:hidden">
                              Ver Abonos →
                            </span>
                          </div>
                          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 xl:block">
                            <span className="whitespace-nowrap text-[0.625rem] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400 border border-lime-400/30 bg-lime-400/8 px-2 py-0.5">
                              Ver Abonos →
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-foreground">{user.dni}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="flex items-center gap-2 text-sm text-foreground">{user.telefono}<BotonWhatsApp telefono={user.telefono} nombre={user.nombre} /></span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm font-semibold text-foreground">
                          {user.nombrePerfil || user.perfil || "Sin Perfil"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const cfg = statusConfig[user.estado] || statusConfig.activo
                          const isActivo = user.estado === "activo"
                          const isSuspendido = user.estado === "suspendido"
                          return (
                            <span className={`text-[0.625rem] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md ${isActivo ? "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/20" : isSuspendido ? "bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/20" : "bg-foreground/5 text-foreground/50 border-border"}`}>
                              {cfg.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {(() => {
                          const cfg = membershipConfig[user.membresia] || membershipConfig.vencida
                          const isVigente = user.membresia === "vigente" || user.membresia === "activa"
                          const isPorVencer = user.membresia === "por_vencer"
                          return (
                            <span className={`text-[0.625rem] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md ${isVigente ? "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/20" : isPorVencer ? "bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/20" : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"}`}>
                              {cfg.label}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="font-semibold text-sm text-foreground">{user.creditos}</span>
                      </td>
                      <td className="px-4 py-3 text-right" data-no-navigate>
                        <MenuAcciones
                          user={user}
                          permisos={permisos}
                          navigate={navigate}
                          onCambiarEstado={(u, action) => setConfirmDialog({ open: true, user: u, action })}
                          onEliminar={(u) => setDeleteDialog({ open: true, user: u })}
                        >
                          <button type="button" aria-label={`Acciones para ${user.nombre}`} className="p-2 text-foreground/40 hover:text-foreground transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </MenuAcciones>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── COMPUTADORA: lista a la izquierda y ficha del usuario elegido a la derecha ── */}
      <div className="hidden lg:grid lg:grid-cols-[460px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <section aria-label="Lista de usuarios" style={{ borderRadius: 16, background: "var(--card)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
            <h2 className="bv-admin-titulo" style={{ margin: 0, font: "800 17px Archivo" }}>Usuarios</h2>
            <span style={{ font: "600 13px Archivo", color: "var(--muted-foreground)" }}>{`${filteredUsers.length} ${filteredUsers.length === 1 ? "usuario" : "usuarios"}`}</span>
          </div>
          {isLoading ? (
            <Cargando filas={4} className="p-4" />
          ) : filteredUsers.length === 0 ? (
            <EstadoVacio titulo="No hay usuarios con estos filtros" accion={<button type="button" onClick={limpiarFiltros} style={estiloBotonContorno}>Limpiar filtros</button>} />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: "calc(100vh - 17rem)", overflowY: "auto" }}>
              {filteredUsers.map((user) => {
                const id = user.idUsuario || user.id
                const elegido = seleccionado && (seleccionado.idUsuario || seleccionado.id) === id
                return (
                  <li key={id} style={{ borderTop: "1px solid var(--border)" }}>
                    <button type="button" onClick={() => setSeleccionadoId(id)} aria-current={elegido ? "true" : undefined}
                      style={{ width: "100%", display: "grid", gridTemplateColumns: "44px minmax(0px, 1fr) auto", alignItems: "center", gap: 14, padding: "14px 18px 14px 16px", borderWidth: "0px 0px 0px 3px", borderStyle: "solid", borderColor: elegido ? "var(--primary)" : "transparent", background: elegido ? "var(--sh-active-bg)" : "transparent", color: "var(--foreground)", textAlign: "left", cursor: "pointer" }}>
                      <span style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary)", color: "var(--primary-foreground)", display: "grid", placeItems: "center", overflow: "hidden", font: "800 14px Archivo" }}>
                        {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : getIniciales(user.nombre)}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: "block", font: "700 15px Archivo" }}>{user.nombre}</span>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", font: "400 13px Archivo", color: "var(--muted-foreground)" }}>{user.email || "Sin correo"}</span>
                        <span style={{ display: "block", marginTop: 3, font: "500 12px Archivo", color: "var(--muted-foreground)" }}>{`${perfilTexto(user)} · ${Number(user.creditos) || 0} ${Number(user.creditos) === 1 ? "crédito" : "créditos"}`}</span>
                      </span>
                      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
                        <span style={estiloMembresiaPastilla(user.membresia)}>{(membershipConfig[user.membresia] || membershipConfig.vencida).label}</span>
                        {!user.sinAcceso && user.correoVerificado === 0 && <span style={estiloSinVerificar}>Sin verificar</span>}
                        {user.sinAcceso && <span style={estiloSinCuenta}>Sin cuenta</span>}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <div className="sticky top-4">
          {seleccionado ? (
            <FichaUsuario
              key={seleccionado.idUsuario || seleccionado.id}
              user={seleccionado}
              permisos={permisos}
              navigate={navigate}
              onCambiarEstado={(u, action) => setConfirmDialog({ open: true, user: u, action })}
              onEliminar={(u) => setDeleteDialog({ open: true, user: u })}
              onGuardado={(cambios) => {
                const idEditado = seleccionado.idUsuario || seleccionado.id
                setUsers((prev) => prev.map((u) => ((u.idUsuario || u.id) === idEditado ? { ...u, ...cambios } : u)))
              }}
            />
          ) : (
            !isLoading && <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-sm text-foreground/60">Elegí un usuario de la lista para ver su ficha.</p>
          )}
        </div>
      </div>

      {/* Alumno sin cuenta: al registrarlo se vuelve a cargar la lista */}
      <AlumnoSinCuentaDialog open={sinCuentaAbierto} onOpenChange={setSinCuentaAbierto} onCreado={() => cargarUsuarios()} />

      {/* Diálogos de Confirmación de Estado */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "activate" ? "Activar Usuario" : "Desactivar Usuario"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "activate"
                ? `¿Activar a ${confirmDialog.user?.nombre}? Podrá volver a usar el sistema.`
                : `¿Desactivar a ${confirmDialog.user?.nombre}? No podrá reservar clases ni usar sus créditos.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog({ open: false, user: null, action: "" })}>
              Cancelar
            </Button>
            <Button
              variant={confirmDialog.action === "activate" ? "default" : "destructive"}
              onClick={() => {
                if (confirmDialog.user) {
                  const newStatus = confirmDialog.action === "activate" ? "activo" : "inactivo"
                  handleStatusChange(confirmDialog.user.idUsuario || confirmDialog.user.id, newStatus)
                  setConfirmDialog({ open: false, user: null, action: null })
                }
              }}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Eliminación Permanente */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar Usuario Permanentemente</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>{`¿Estás seguro de eliminar permanentemente a ${deleteDialog.user?.nombre}?`}</p>
              <p className="font-semibold text-destructive">
                Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario, incluyendo historial de reservas y créditos.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteDialog.user) {
                  handleDeleteUser(deleteDialog.user.idUsuario || deleteDialog.user.id)
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar Permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
