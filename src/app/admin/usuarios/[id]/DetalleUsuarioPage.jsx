import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { BotonVolver } from "@/components/BotonVolver"
import {
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  Eye,
  FileText,
  Stethoscope,
  CheckCircle2,
  Clock,
  Plus,
  CalendarX,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle } from "@/components/ui/dialog"

import { AdminFormSkeleton } from "@/components/AdminPageSkeleton"
import apiClient, {
  cambiarEstadoUsuario,
  eliminarUsuario,
  getUsuarioById,
} from "@/api"
import { toast } from '@/lib/notificar'
import { Cargando } from '@/components/Cargando'

const statusConfig = {
  activo:   { label: "Activo",    className: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20" },
  inactivo: { label: "Inactivo",  className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  activa:     { label: "Activa",     className: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20" },
  vigente:    { label: "Activa",     className: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20" },
  por_vencer: { label: "Por Vencer", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20" },
  vencida:    { label: "Vencida",    className: "bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20" },
}

const formatearFecha = (fechaRaw) => {
  if (!fechaRaw) return "-";
  try {
    const fechaLimpia = fechaRaw.split('T')[0];
    const [year, month, day] = fechaLimpia.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return fechaRaw;
  }
};

const TIPOS_DOC = [
  { key: "comprobante_transferencia", label: "Comprobante de Transferencia", Icon: CreditCard },
  { key: "certificado_medico",        label: "Certificado Médico",           Icon: Stethoscope },
  { key: "declaracion_jurada",        label: "Declaración Jurada",           Icon: FileText },
]

const ESTADOS_RESERVA = {
  proxima:      { label: "Próxima",    cls: "bg-foreground/5 text-foreground/60 border-border" },
  completada:   { label: "Asistió",    cls: "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/30" },
  cancelada:    { label: "Cancelada",  cls: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
  inasistencia: { label: "No asistió", cls: "bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/30" },
}
const badgeReserva = (estado) => ESTADOS_RESERVA[estado] || { label: estado || "—", cls: "bg-foreground/5 text-foreground/60 border-border" }

// Permisos guardados al iniciar sesión: solo deciden qué botones se ven; el servidor los controla en cada ruta
const leerPermisos = () => {
  try { return JSON.parse(localStorage.getItem("permisos") || "[]") } catch { return [] }
}

export default function DetalleUsuarioPage() {
  const [permisos] = useState(leerPermisos)
  const navigate = useNavigate()
  const { id } = useParams()

  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState({ open: false, action: "" })
  const [error, setError] = useState("")

  const [vistaActiva, setVistaActiva] = useState("reservas")

  const [reservasReales, setReservasReales] = useState([])
  const [cargandoReservas, setCargandoReservas] = useState(false)

  const [documentos, setDocumentos] = useState([])
  const [cargandoDocs, setCargandoDocs] = useState(false)

  useEffect(() => {
    if (!id) return
    const cargarReservas = async () => {
      try {
        setCargandoReservas(true)
        const res = await apiClient.get(`/reservas/admin/usuario/${id}`)
        setReservasReales(res.data?.data || res.data || [])
      } catch (err) {
        console.error("Error al cargar reservas del usuario:", err)
      } finally {
        setCargandoReservas(false)
      }
    }
    cargarReservas()
  }, [id])

  useEffect(() => {
    if (!id) return
    const cargarDocs = async () => {
      try {
        setCargandoDocs(true)
        const res = await apiClient.get(`/documentos/usuario/${id}`)
        setDocumentos(res.data?.data || res.data || [])
      } catch (err) {
        console.error("Error al cargar documentos del usuario:", err)
      } finally {
        setCargandoDocs(false)
      }
    }
    cargarDocs()
  }, [id])

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setIsLoading(true)
        setError("")
        const respuesta = await getUsuarioById(id)
        const datosReales = respuesta?.data || respuesta;
        setUser(datosReales)
      } catch (fetchError) {
        console.error("Error al cargar detalle del usuario:", fetchError)
        setError("No se pudo cargar el detalle del usuario.")
      } finally {
        setIsLoading(false)
      }
    }
    if (id) cargarUsuario()
  }, [id])

  const status = statusConfig[user?.estado] || statusConfig.activo

  const estadoMembresia = user?.membresia || (user?.estado === "activo" ? "activa" : "vencida");
  const membership = membershipConfig[estadoMembresia] || membershipConfig.vencida

  const handleStatusChange = async (newStatus) => {
    try {
      setIsActionLoading(true)
      await cambiarEstadoUsuario(id, newStatus)
      setUser((currentUser) => ({ ...currentUser, estado: newStatus }))
    } catch (statusError) {
      console.error("Error al actualizar estado:", statusError)
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
      console.error("Error al eliminar usuario:", deleteError)
      toast.error(deleteError.response?.data?.message || "No se pudo eliminar el usuario.")
    } finally {
      setIsActionLoading(false)
      setDeleteDialog(false)
    }
  }

  if (isLoading) {
    return <AdminFormSkeleton />
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">{error}</div>
        <Link to="/admin/usuarios"><Button variant="outline">Volver a usuarios</Button></Link>
      </div>
    )
  }

  const getIniciales = (nombre) => {
    if (!nombre) return "??"
    const p = nombre.trim().split(" ")
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase()
  }

  const puede = (p) => permisos.includes(p)
  // Sobre la propia cuenta no se ofrece desactivar ni eliminar (el servidor también lo rechaza)
  const esMiCuenta = (() => {
    try { return Number(JSON.parse(localStorage.getItem("usuario") || "{}").idUsuario) === Number(id) } catch { return false }
  })()
  const estaInactivo = user?.estado === "inactivo"
  const vigente = estadoMembresia === "vigente" || estadoMembresia === "activa"
  const claseMembresia = vigente
    ? "bg-lime-400/10 text-lime-700 dark:text-lime-400 border-lime-400/30"
    : estadoMembresia === "por_vencer"
      ? "bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border-yellow-400/30"
      : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30"

  const botonAccion = "flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest transition-colors"

  return (
    <div className="space-y-5">

      {/* VOLVER + BREADCRUMB */}
      <div className="space-y-3">
        <BotonVolver a="/admin/usuarios" texto="Volver" />
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Usuarios <span aria-hidden="true">/</span> <span className="text-foreground/70">Ficha</span>
        </p>
      </div>

      {/* ACCIONES: en el celular, grilla de 2x2. Se muestran según los permisos (el servidor vuelve a controlarlos) */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {puede("usuarios:alta") && (
          <Link to={`/admin/usuarios/abonos/carga-masiva?usuario=${id}`}
            className={`${botonAccion} border-lime-400 bg-lime-400 text-black hover:bg-lime-300`}>
            <Plus className="h-4 w-4" /> Cargar abono
          </Link>
        )}
        {puede("usuarios:modificacion") && (
          <Link to={`/admin/usuarios/${id}/editar`}
            className={`${botonAccion} border-border bg-card text-foreground/80 hover:border-foreground/30 hover:text-foreground`}>
            <Pencil className="h-4 w-4" /> Editar
          </Link>
        )}
        {puede("usuarios:modificacion") && !esMiCuenta && (
          estaInactivo ? (
            <button type="button" onClick={() => setStatusDialog({ open: true, action: "activate" })}
              className={`${botonAccion} border-lime-500/40 bg-card text-lime-700 dark:text-lime-400 hover:bg-lime-400/10`}>
              <UserCheck className="h-4 w-4" /> Activar
            </button>
          ) : (
            <button type="button" onClick={() => setStatusDialog({ open: true, action: "deactivate" })}
              className={`${botonAccion} border-border bg-card text-foreground/60 hover:border-foreground/30 hover:text-foreground`}>
              <UserX className="h-4 w-4" /> Desactivar
            </button>
          )
        )}
        {puede("usuarios:baja") && !esMiCuenta && (
          <button type="button" onClick={() => setDeleteDialog(true)}
            className={`${botonAccion} border-red-500/40 bg-card text-red-700 dark:text-red-400 hover:bg-red-500/10`}>
            <Trash2 className="h-4 w-4" /> Eliminar
          </button>
        )}
      </div>

      {/* FICHA */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5" aria-label="Datos del usuario">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-lime-400 text-lg font-black text-black">
            {user?.avatarUrl
              ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              : getIniciales(user?.nombre)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black uppercase leading-tight tracking-tight text-foreground sm:text-2xl">{user?.nombre}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${estaInactivo ? "border-border bg-foreground/5 text-foreground/55" : "border-lime-400/30 bg-lime-400/10 text-lime-700 dark:text-lime-400"}`}>
                {status.label}
              </span>
              <span className="rounded-full border border-border bg-foreground/5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-foreground/60">
                {user?.perfil || "Sin perfil"}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Créditos</p>
            <p className="mt-0.5 text-3xl font-black leading-none tabular-nums text-lime-700 dark:text-lime-400 sm:text-4xl">{user?.creditos ?? 0}</p>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
          {[
            { label: "DNI", value: user?.dni || "—", icon: CreditCard },
            { label: "Teléfono", value: user?.telefono || "—", icon: Phone, tel: user?.telefono },
            { label: "Correo", value: user?.email || "—", icon: Mail, ancho: true },
            { label: "Registro", value: formatearFecha(user?.fechaRegistro), icon: Calendar },
          ].map(({ label, value, icon: Icon, ancho, tel }) => (
            <div key={label} className={`min-w-0 rounded-xl border border-border bg-background/50 px-3 py-2.5 ${ancho ? "col-span-2 lg:col-span-1" : ""}`}>
              <dt className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <Icon className="h-3 w-3" aria-hidden="true" /> {label}
              </dt>
              <dd className="mt-1 truncate text-sm font-semibold text-foreground">
                {tel
                  ? <a href={`tel:${tel}`} className="text-lime-700 hover:underline dark:text-lime-400">{value}</a>
                  : value}
              </dd>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-background/50 px-3 py-2.5">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Membresía</dt>
            <dd className="mt-1.5">
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest ${claseMembresia}`}>{membership.label}</span>
            </dd>
          </div>
        </dl>
      </section>

      {/* PESTAÑAS */}
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1 sm:inline-grid" role="tablist">
        {[
          { key: "reservas", label: "Reservas" },
          { key: "documentos", label: "Documentos" },
        ].map(({ key, label }) => (
          <button key={key} type="button" role="tab" aria-selected={vistaActiva === key}
            className={`min-h-[40px] rounded-lg px-4 text-xs font-black uppercase tracking-widest transition-colors ${vistaActiva === key ? "bg-lime-400 text-black" : "text-foreground/55 hover:text-foreground"}`}
            onClick={() => setVistaActiva(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* PESTAÑA RESERVAS */}
      {vistaActiva === "reservas" && (
        cargandoReservas ? (
          <Cargando filas={2} className="py-2" />
        ) : reservasReales.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
            <CalendarX className="h-8 w-8 text-foreground/25" aria-hidden="true" />
            <p className="text-sm text-foreground/55">No se registran reservas para este usuario.</p>
          </div>
        ) : (
          <>
            {/* Celular: tarjetas */}
            <ul className="space-y-2 md:hidden">
              {reservasReales.map((r) => {
                const badge = badgeReserva(r.estadoReserva)
                return (
                  <li key={r.idReserva} className="rounded-xl border border-border bg-card px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 font-bold text-foreground">{r.nombreClase}</p>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <p className="mt-1 text-xs text-foreground/60">
                      {formatearFecha(r.fechaReserva)} · {r.horaInicio ? `${r.horaInicio.slice(0, 5)} hs` : "—"}
                      {r.nombreProfesor ? ` · ${r.nombreProfesor}` : ""}
                    </p>
                  </li>
                )
              })}
            </ul>

            {/* Escritorio: tabla */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border bg-card md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Clase", "Fecha", "Hora", "Coach", "Estado"].map((t) => (
                      <th key={t} className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reservasReales.map((r) => {
                    const badge = badgeReserva(r.estadoReserva)
                    return (
                      <tr key={r.idReserva} className="transition-colors hover:bg-foreground/3">
                        <td className="px-4 py-3 font-semibold text-foreground">{r.nombreClase}</td>
                        <td className="px-4 py-3 text-foreground/60">{formatearFecha(r.fechaReserva)}</td>
                        <td className="px-4 py-3 font-semibold text-foreground">{r.horaInicio ? `${r.horaInicio.slice(0, 5)} hs` : "—"}</td>
                        <td className="px-4 py-3 text-foreground/60">{r.nombreProfesor || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${badge.cls}`}>{badge.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )
      )}

      {/* PESTAÑA DOCUMENTOS */}
      {vistaActiva === "documentos" && (
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {cargandoDocs ? (
            <Cargando filas={2} className="py-2" />
          ) : (
            TIPOS_DOC.map(({ key, label, Icon }) => {
              const ultimo = documentos.find((d) => d.tipo === key)
              return (
                <div key={key} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30">
                      <Icon className="h-4 w-4 text-foreground/50" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{label}</p>
                      <p className="text-xs text-foreground/50">
                        {ultimo ? `Subido el ${formatearFecha(ultimo.creadoEn)}` : "Sin archivo subido"}
                      </p>
                    </div>
                  </div>
                  {ultimo && (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${
                        ultimo.estado === "aprobado"
                          ? "border-lime-400/30 bg-lime-400/10 text-lime-700 dark:text-lime-400"
                          : "border-yellow-400/30 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400"
                      }`}>
                        {ultimo.estado === "aprobado" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {ultimo.estado === "aprobado" ? "Aprobado" : "En revisión"}
                      </span>
                      <a href={ultimo.urlArchivo} target="_blank" rel="noopener noreferrer"
                        className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-border px-3 text-[11px] font-black uppercase tracking-widest text-foreground/70 transition-colors hover:border-foreground/30 hover:text-foreground">
                        <Eye className="h-3.5 w-3.5" /> Ver
                      </a>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* MODALES */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}>
        <DialogContent className="bg-card border-border rounded-xl">
          <DialogHeader>
            <DialogTitle className="font-semibold text-foreground tracking-tight">
              {statusDialog.action === "activate" ? "Activar Usuario" : "Desactivar Usuario"}
            </DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setStatusDialog({ open: false, action: "" })}>Cancelar</Button>
            <Button variant={statusDialog.action === "activate" ? "default" : "destructive"} size="sm"
              onClick={() => handleStatusChange(statusDialog.action === "activate" ? "activo" : "inactivo")}
              disabled={isActionLoading}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-card border-border rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-destructive font-semibold tracking-tight">Eliminar Registro</DialogTitle>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isActionLoading}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
