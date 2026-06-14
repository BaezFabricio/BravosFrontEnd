import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Pencil,
  UserX,
  UserCheck,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  cambiarEstadoUsuario,
  eliminarUsuario,
  getUsuarioById,
  normalizarUsuario,
  getAbonosUsuario,
  crearAbonoUsuario,
  editarAbonoUsuario,
  cancelarAbonoUsuario,
} from "@/api"

const reservas = [
  { id: "1", clase: "Funcional WOD", fecha: "2024-03-10", hora: "08:00", coach: "Pablo Ruiz" },
  { id: "2", clase: "Funcional", fecha: "2024-03-08", hora: "09:30", coach: "Maria Gomez" },
  { id: "3", clase: "Funcional WOD", fecha: "2024-03-05", hora: "18:00", coach: "Pablo Ruiz" },
  { id: "4", clase: "Open Box", fecha: "2024-03-03", hora: "11:00", coach: "Diego Torres" },
]

const planesAbono = {
  "CLASE CROSSFIT": {
    precio: 36000,
    creditos: 20,
    duracion: 30,
  },
  "PLANIFICACIÓN ATLETA": {
    precio: 43000,
    creditos: 30,
    duracion: 30,
  },
}

const statusConfig = {
  activo: { label: "Activo", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  suspendido: { label: "Suspendido", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-primary/10 text-primary border-primary/20" },
  por_vencer: { label: "Por Vencer", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20" },
}

export default function DetalleUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [statusDialog, setStatusDialog] = useState({ open: false, action: "" })
  const [error, setError] = useState("")

  const [vistaActiva, setVistaActiva] = useState("reservas")

  const [abonoDialog, setAbonoDialog] = useState({
    open: false,
    tipo: "",
    abono: null,
  })

  const [tipoAbono, setTipoAbono] = useState("CLASE CROSSFIT")
  const [metodoPago, setMetodoPago] = useState("Efectivo")
  const [abonos, setAbonos] = useState([])
  const [cargandoAbonos, setCargandoAbonos] = useState(false)
  const [formAbono, setFormAbono] = useState({
    fechaInicio: "",
    fechaVencimiento: "",
    turnos: "",
    ajuste: 0,
    estado: "ACTIVO",
    motivo: "",
  })

  const precioBase = planesAbono[tipoAbono]?.precio || 0
  const creditosAbono = planesAbono[tipoAbono]?.creditos || 0
  const precioCredito = Math.round(precioBase * 1.1)

  const precioFinal =
    metodoPago === "Tarjeta Crédito" ? precioCredito : precioBase

  const abrirAbonoDialog = (tipo, abono = null) => {
    setAbonoDialog({
      open: true,
      tipo,
      abono,
    })

    if (tipo === "cargar") {
      setFormAbono({
        fechaInicio: "",
        fechaVencimiento: "",
        turnos: "",
        ajuste: 0,
        estado: "ACTIVO",
        motivo: "",
      })
      setTipoAbono("CLASE CROSSFIT")
      setMetodoPago("Efectivo")
    }

    if ((tipo === "editar" || tipo === "cancelar") && abono) {
      setFormAbono({
        fechaInicio: abono.inicio || "",
        fechaVencimiento: abono.vencimiento || "",
        turnos: abono.turnos ?? "",
        ajuste: abono.ajuste ?? 0,
        estado: abono.estado || "ACTIVO",
        motivo: "",
      })
    }
  }

  const cerrarAbonoDialog = () => {
    setAbonoDialog({
      open: false,
      tipo: "",
      abono: null,
    })
  }

  const cargarAbonos = async () => {
    try {
      setCargandoAbonos(true)
      const data = await getAbonosUsuario(id)
      setAbonos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error al cargar abonos:", error)
      setError("No se pudieron cargar los abonos del usuario.")
      setAbonos([])
    } finally {
      setCargandoAbonos(false)
    }
  }

  useEffect(() => {
    if (id) {
      cargarAbonos()
    }
  }, [id])

  const handleConfirmarAbono = async () => {
    try {
      setIsActionLoading(true)

      if (abonoDialog.tipo === "cargar") {
        await crearAbonoUsuario(id, {
          tipoAbono,
          fechaInicio: formAbono.fechaInicio,
          fechaVencimiento: formAbono.fechaVencimiento,
          metodoPago,
          importe: precioFinal,
        })
      }

      if (abonoDialog.tipo === "editar") {
        await editarAbonoUsuario(id, abonoDialog.abono.id, {
          fechaInicio: formAbono.fechaInicio,
          fechaVencimiento: formAbono.fechaVencimiento,
          turnos: formAbono.turnos,
          ajuste: formAbono.ajuste,
          estado: formAbono.estado,
          motivo: formAbono.motivo,
        })
      }

      if (abonoDialog.tipo === "cancelar") {
        await cancelarAbonoUsuario(id, abonoDialog.abono.id)
      }

      await cargarAbonos()
      cerrarAbonoDialog()
    } catch (error) {
      console.error("Error al guardar abono:", error)
      setError("No se pudo realizar la acción del abono.")
    } finally {
      setIsActionLoading(false)
    }
  }

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        setIsLoading(true)
        setError("")
        const data = await getUsuarioById(id)
        setUser(normalizarUsuario(data))
      } catch (fetchError) {
        console.error("Error al cargar detalle del usuario:", fetchError)
        setError("No se pudo cargar el detalle del usuario.")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      cargarUsuario()
    }
  }, [id])

  const status = statusConfig[user?.estado] || statusConfig.activo
  const membership = membershipConfig[user?.membresia] || membershipConfig.vencida

  const handleStatusChange = async (newStatus) => {
    try {
      setIsActionLoading(true)
      await cambiarEstadoUsuario(id, newStatus)
      setUser((currentUser) => ({ ...currentUser, estado: newStatus }))
    } catch (statusError) {
      console.error("Error al actualizar estado:", statusError)
      setError("No se pudo actualizar el estado del usuario.")
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
      setError("No se pudo eliminar el usuario.")
    } finally {
      setIsActionLoading(false)
      setDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Cargando usuario...</p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
        <Link to="/admin/usuarios">
          <Button variant="outline">Volver a usuarios</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          <p>{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/usuarios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-foreground">{user?.nombre}</h1>
            <p className="text-muted-foreground">Detalle del usuario</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link to={`/admin/usuarios/${id}/editar`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>

          {user?.estado === "activo" ? (
            <Button
              variant="outline"
              className="text-green-500 border-green-500/50 hover:bg-green-500/10"
              onClick={() => setStatusDialog({ open: true, action: "suspend" })}
            >
              <UserX className="mr-2 h-4 w-4" />
              Suspender
            </Button>
          ) : user?.estado !== "inactivo" ? (
            <Button
              variant="outline"
              className="text-green-500 border-green-500/50 hover:bg-green-500/10"
              onClick={() => setStatusDialog({ open: true, action: "activate" })}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Activar
            </Button>
          ) : null}

          <Button
            variant="outline"
            className="text-destructive border-destructive/50 hover:bg-destructive/10"
            onClick={() => setDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Información Personal
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium text-foreground">{user?.nombre}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">DNI</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {user?.dni}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Correo Electrónico</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {user?.email}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Teléfono</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {user?.telefono}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {user?.fechaRegistro || "Sin dato"}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Último Acceso</p>
                <p className="font-medium text-foreground">
                  {user?.ultimoAcceso || "Sin dato"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Estado</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Usuario</span>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Membresía</span>
                <Badge variant="outline" className={membership.className}>
                  {membership.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Perfil</span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {user?.perfil}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Créditos</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-primary">{user?.creditos ?? 0}</p>
                <p className="text-sm text-muted-foreground">disponibles</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={vistaActiva === "reservas" ? "default" : "outline"}
          onClick={() => setVistaActiva("reservas")}
        >
          Reservas
        </Button>

        <Button
          variant={vistaActiva === "abonos" ? "default" : "outline"}
          onClick={() => setVistaActiva("abonos")}
        >
          Abonos
        </Button>
      </div>

      {vistaActiva === "reservas" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Reservas Recientes</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Clase</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Fecha</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Hora</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Coach</th>
                  </tr>
                </thead>

                <tbody>
                  {reservas.map((reserva) => (
                    <tr key={reserva.id} className="border-b border-border">
                      <td className="p-4 text-foreground">{reserva.clase}</td>
                      <td className="p-4 text-foreground">{reserva.fecha}</td>
                      <td className="p-4 text-foreground">{reserva.hora}</td>
                      <td className="p-4 text-foreground">{reserva.coach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {vistaActiva === "abonos" && (
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Abonos</CardTitle>

              <Button
                onClick={() => abrirAbonoDialog("cargar")}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Cargar Abono
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="p-4 text-left">#</th>
                    <th className="p-4 text-left">Creado</th>
                    <th className="p-4 text-left">Inicio</th>
                    <th className="p-4 text-left">Vencimiento</th>
                    <th className="p-4 text-left">Abono</th>
                    <th className="p-4 text-center">Turnos</th>
                    <th className="p-4 text-center">Ajuste</th>
                    <th className="p-4 text-center">Usados</th>
                    <th className="p-4 text-center">Disponibles</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {abonos.map((abono) => (
                    <tr key={abono.id} className="border-b border-border">
                      <td className="p-4">{abono.id}</td>
                      <td className="p-4">{abono.creado}</td>
                      <td className="p-4">{abono.inicio}</td>
                      <td className="p-4">{abono.vencimiento}</td>
                      <td className="p-4">{abono.abono}</td>
                      <td className="p-4 text-center">{abono.turnos}</td>
                      <td className="p-4 text-center">{abono.ajuste}</td>
                      <td className="p-4 text-center">{abono.usados}</td>
                      <td className="p-4 text-center text-green-500 font-bold">
                        {abono.disponibles}
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          className={
                            abono.estado === "ACTIVO"
                              ? "bg-green-500 text-white"
                              : "bg-red-500 text-white"
                          }
                        >
                          {abono.estado}
                        </Badge>
                      </td>

                      <td className="p-4 text-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => abrirAbonoDialog("editar", abono)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => abrirAbonoDialog("cancelar", abono)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={abonoDialog.open}
        onOpenChange={(open) => !open && cerrarAbonoDialog()}
      >
        <DialogContent className="bg-card border-border max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {abonoDialog.tipo === "cargar" && "Venta de Abono"}
              {abonoDialog.tipo === "editar" && "Editar Abono"}
              {abonoDialog.tipo === "cancelar" && "Cancelar Abono"}
            </DialogTitle>
          </DialogHeader>

          {abonoDialog.tipo === "cargar" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Abono</label>
                  <select
                    value={tipoAbono}
                    onChange={(e) => setTipoAbono(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md p-3"
                  >
                    <option>CLASE CROSSFIT</option>
                    <option>PLANIFICACIÓN ATLETA</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Cantidad</label>
                  <input
                    type="number"
                    defaultValue="1"
                    className="w-full bg-secondary border border-border rounded-md p-3"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Lista de precio</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md p-3"
                  >
                    <option>Efectivo</option>
                    <option>Débito</option>
                    <option>Tarjeta Crédito</option>
                    <option>Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Créditos incluidos</label>
                  <input
                    value={`${creditosAbono} Créditos - 1 Mes`}
                    readOnly
                    className="w-full bg-muted border border-border rounded-md p-3 text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Fecha de inicio</label>
                  <input
                    type="date"
                    value={formAbono.fechaInicio}
                    onChange={(e) => setFormAbono((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-md p-3"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Fecha de vencimiento</label>
                  <input
                    type="date"
                    value={formAbono.fechaVencimiento}
                    onChange={(e) => setFormAbono((prev) => ({ ...prev, fechaVencimiento: e.target.value }))}
                    className="w-full bg-secondary border border-border rounded-md p-3"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Nota</label>
                  <textarea
                    value={formAbono.motivo}
                    onChange={(e) => setFormAbono((prev) => ({ ...prev, motivo: e.target.value }))}
                    placeholder="Observaciones del abono..."
                    className="w-full bg-secondary border border-border rounded-md p-3"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Importe base</label>
                  <input
                    type="number"
                    value={precioBase}
                    readOnly
                    className="w-full bg-secondary border border-border rounded-md p-3 text-right"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Ajuste</label>
                  <input
                    type="number"
                    value={formAbono.ajuste}
                    onChange={(e) => setFormAbono((prev) => ({ ...prev, ajuste: Number(e.target.value) }))}
                    className="w-full bg-secondary border border-border rounded-md p-3 text-right"
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-right text-xl font-bold">
                    PRECIO FINAL: ${precioFinal.toLocaleString("es-AR")}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Método de pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-md p-3"
                  >
                    <option>Efectivo</option>
                    <option>Débito</option>
                    <option>Tarjeta Crédito</option>
                    <option>Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Monto efectivo</label>
                  <input
                    type="number"
                    value={precioBase}
                    readOnly
                    className="w-full bg-secondary border border-border rounded-md p-3 text-right"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Monto tarjeta crédito</label>
                  <input
                    type="number"
                    value={precioCredito}
                    readOnly
                    className="w-full bg-secondary border border-border rounded-md p-3 text-right"
                  />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">Monto débito / transferencia</label>
                  <input
                    type="number"
                    value={precioBase}
                    readOnly
                    className="w-full bg-secondary border border-border rounded-md p-3 text-right"
                  />
                </div>
              </div>
            </div>
          )}

          {abonoDialog.tipo === "editar" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Fecha de inicio</label>
                <input
                  type="date"
                  value={formAbono.fechaInicio}
                  onChange={(e) => setFormAbono((prev) => ({ ...prev, fechaInicio: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md p-3"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={formAbono.fechaVencimiento}
                  onChange={(e) => setFormAbono((prev) => ({ ...prev, fechaVencimiento: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md p-3"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Turnos</label>
                <input
                  type="number"
                  value={formAbono.turnos}
                  onChange={(e) => setFormAbono((prev) => ({ ...prev, turnos: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md p-3"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Ajuste</label>
                <input
                  type="number"
                  value={formAbono.ajuste}
                  onChange={(e) => setFormAbono((prev) => ({ ...prev, ajuste: Number(e.target.value) }))}
                  className="w-full bg-secondary border border-border rounded-md p-3"
                  placeholder="Ajuste"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Estado</label>
                <select
                  value={formAbono.estado}
                  onChange={(e) => setFormAbono((prev) => ({ ...prev, estado: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md p-3"
                >
                  <option>ACTIVO</option>
                  <option>Vencido</option>
                  <option>PAUSADO</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Motivo cambio</label>
                <textarea
                  value={formAbono.motivo}
                  onChange={(e) => setFormAbono((prev) => ({ ...prev, motivo: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md p-3"
                  placeholder="Motivo cambio"
                />
              </div>
            </div>
          )}

          {abonoDialog.tipo === "cancelar" && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Inicio</label>
                <input
                  className="w-full bg-secondary border border-border rounded-md p-3"
                  value={abonoDialog.abono?.inicio || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Vencimiento</label>
                <input
                  className="w-full bg-secondary border border-border rounded-md p-3"
                  value={abonoDialog.abono?.vencimiento || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Abono</label>
                <input
                  className="w-full bg-secondary border border-border rounded-md p-3"
                  value={abonoDialog.abono?.abono || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Motivo</label>
                <textarea
                  value={formAbono.motivo}
                  onChange={(e) => setFormAbono((prev) => ({ ...prev, motivo: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-md p-3"
                  placeholder="Motivo"
                />
              </div>

              <label className="flex items-center gap-3 text-sm text-muted-foreground">
                <input type="checkbox" />
                Cancelar abono, si existen turnos asignados serán liberados como pendiente de pago
              </label>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cerrarAbonoDialog}>
              Cerrar
            </Button>

            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleConfirmarAbono}
              disabled={isActionLoading}
            >
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {abonoDialog.tipo === "cargar" && "Cargar Abono"}
              {abonoDialog.tipo === "editar" && "Guardar Cambios"}
              {abonoDialog.tipo === "cancelar" && "Cancelar Abono"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}
      >
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>
              {statusDialog.action === "suspend" ? "Suspender Usuario" : "Activar Usuario"}
            </DialogTitle>

            <DialogDescription>
              {statusDialog.action === "suspend"
                ? `¿Estás seguro de suspender a ${user?.nombre}? El usuario no podrá reservar clases ni usar sus créditos.`
                : `¿Estás seguro de activar a ${user?.nombre}? El usuario podrá volver a usar el sistema.`}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialog({ open: false, action: "" })}
            >
              Cancelar
            </Button>

            <Button
              variant={statusDialog.action === "activate" ? "default" : "destructive"}
              onClick={() =>
                handleStatusChange(statusDialog.action === "suspend" ? "suspendido" : "activo")
              }
              disabled={isActionLoading}
            >
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              Eliminar Usuario Permanentemente
            </DialogTitle>

            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los datos del usuario.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancelar
            </Button>

            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isActionLoading}
            >
              {isActionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}