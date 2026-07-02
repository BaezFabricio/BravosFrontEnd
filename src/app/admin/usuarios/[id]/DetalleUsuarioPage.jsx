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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  cambiarEstadoUsuario,
  eliminarUsuario,
  getUsuarioById,
  getAbonosUsuario,
  crearAbonoUsuario,
  cancelarAbonoUsuario,
} from "@/api"

const reservas = [
  { id: "1", clase: "Funcional WOD", fecha: "2024-03-10", hora: "08:00", coach: "Pablo Ruiz" },
  { id: "2", clase: "Funcional", fecha: "2024-03-08", hora: "09:30", coach: "Maria Gomez" },
  { id: "3", clase: "Funcional WOD", fecha: "2024-03-05", hora: "18:00", coach: "Pablo Ruiz" },
  { id: "4", clase: "Open Box", fecha: "2024-03-03", hora: "11:00", coach: "Diego Torres" },
]

const planesAbono = {
  "CLASE CROSSFIT": { precio: 36000, creditos: 20, duracion: 30 },
  "PLANIFICACIÓN ATLETA": { precio: 43000, creditos: 30, duracion: 30 },
}

const statusConfig = {
  activo: { label: "Activo", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  suspendido: { label: "Suspendido", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-primary/10 text-primary border-primary/20" },
  activa: { label: "Activa", className: "bg-green-500/10 text-green-500 border-green-500/20" }, 
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20" },
}

const formatearFecha = (fechaRaw) => {
  if (!fechaRaw) return "-";
  try {
    const fechaLimpia = fechaRaw.split('T')[0]; 
    const [year, month, day] = fechaLimpia.split('-');
    return `${day}/${month}/${year}`;
  } catch (e) {
    return fechaRaw;
  }
};

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

  const [abonoDialog, setAbonoDialog] = useState({ open: false, tipo: "", abono: null })
  const [tipoAbono, setTipoAbono] = useState("")
  const [metodoPago, setMetodoPago] = useState("Efectivo")
  const [abonos, setAbonos] = useState([])
  const [cargandoAbonos, setCargandoAbonos] = useState(false)

  const [cobrarCCDialog, setCobrarCCDialog] = useState(false)
  const [ajusteCCDialog, setAjusteCCDialog] = useState(false)
  const [formCobrarCC, setFormCobrarCC] = useState({ efectivo: 0, tarjeta: 0, tipoTarjeta: "Tarjeta" })
  const [formAjusteCC, setFormAjusteCC] = useState({ importe: 0, aclaracion: "" })
  
  const [formAbono, setFormAbono] = useState({
    fechaInicio: "",
    fechaVencimiento: "",
    turnos: "",
    ajuste: 0,
    estado: "ACTIVO",
    motivo: "",
  })

  const precioBase = tipoAbono ? (planesAbono[tipoAbono]?.precio || 0) : 0
  const creditosAbono = tipoAbono ? (planesAbono[tipoAbono]?.creditos || 0) : 0
  const precioCredito = Math.round(precioBase * 1.1)
  const precioFinal = metodoPago === "Tarjeta Crédito" ? precioCredito : precioBase


  const cargarAbonos = async () => {
    try {
      setCargandoAbonos(true)
      const data = await getAbonosUsuario(id)
      
      if (Array.isArray(data)) {
        
        const dataNormalizada = data.map(abono => ({
          ...abono,
          id: abono.idAbono || abono.id_abono || abono.id
        }));

        // Ordenamos descendentemente (lo nuevo arriba) basado en el ID numérico
        const ordenadosDesc = dataNormalizada.sort((a, b) => Number(b.id) - Number(a.id));
        setAbonos(ordenadosDesc);
      } else {
        setAbonos([]);
      }
    } catch (error) {
      console.error("Error al cargar abonos:", error)
      setError("No se pudieron cargar los abonos del usuario.")
      setAbonos([])
    } finally {
      setCargandoAbonos(false)
    }
  }

  useEffect(() => {
    if (id) cargarAbonos()
  }, [id])

  const abrirAbonoDialog = (tipo, abono = null) => {
    setAbonoDialog({ open: true, tipo, abono })

    if (tipo === "cargar") {
      setFormAbono({
        fechaInicio: "",
        fechaVencimiento: "",
        turnos: "",
        ajuste: 0,
        estado: "ACTIVO",
        motivo: "",
      })
      setTipoAbono("") 
      setMetodoPago("Efectivo")
    }

    if ((tipo === "editar" || tipo === "cancelar") && abono) {
      setFormAbono({
        fechaInicio: abono.inicio ? abono.inicio.split('T')[0] : "",
        fechaVencimiento: abono.vencimiento ? abono.vencimiento.split('T')[0] : "",
        turnos: abono.turnos ?? "",
        ajuste: abono.ajuste ?? 0,
        estado: abono.estado || "ACTIVO",
        motivo: "",
      })
    }
  }

  const cerrarAbonoDialog = () => {
    setAbonoDialog({ open: false, tipo: "", abono: null })
  }

  useEffect(() => {
    if (abonoDialog.open && abonoDialog.tipo === "cargar" && tipoAbono) {
      const hoyLocal = new Date();
      const offset = hoyLocal.getTimezoneOffset() * 60000;
      const hoyString = new Date(hoyLocal.getTime() - offset).toISOString().split('T')[0];

      const diasDuracion = planesAbono && planesAbono[tipoAbono]?.duracion ? planesAbono[tipoAbono].duracion : 30;
      const creditosPlan = planesAbono && planesAbono[tipoAbono]?.creditos ? planesAbono[tipoAbono].creditos : 20;

      const fechaAux = new Date(hoyString + 'T12:00:00');
      fechaAux.setDate(fechaAux.getDate() + diasDuracion);
      const vencimientoString = fechaAux.toISOString().split('T')[0];

      setFormAbono(prev => ({
        ...prev,
        fechaInicio: hoyString,
        fechaVencimiento: vencimientoString,
        turnos: creditosPlan
      }));
    }
  }, [tipoAbono, abonoDialog.open, abonoDialog.tipo]);

  // 🟢 LOGICA DE CONFIRMACIÓN CORREGIDA CON EL CASO DE CANCELAR
  const handleConfirmarAbono = async () => {
    try {
      setIsActionLoading(true)

      // 1. CASO: CARGAR ABONO NUEVO
      if (abonoDialog.tipo === "cargar") {
        const sesion = JSON.parse(localStorage.getItem("usuario") || localStorage.getItem("user") || "{}");
        
        await crearAbonoUsuario(id, {
          tipoAbono,
          fechaInicio: formAbono.fechaInicio,
          fechaVencimiento: formAbono.fechaVencimiento,
          metodoPago,
          importe: precioFinal,
          idUsuarioOperador: sesion.idUsuario,
        })
      }

      // 2. CASO: CANCELACIÓN / REVOCACIÓN
      if (abonoDialog.tipo === "cancelar" && abonoDialog.abono) {
        const idAbonoReal = abonoDialog.abono.idAbono || abonoDialog.abono.id_abono || abonoDialog.abono.id;
        
        if (!idAbonoReal) {
          console.error("❌ ERROR CRÍTICO: No se encontró ningún identificador en:", abonoDialog.abono);
          setError("No se pudo identificar el ID del abono para proceder a la cancelación.");
          setIsActionLoading(false);
          return;
        }

        const token = localStorage.getItem("token");

        const responseDirect = await fetch(`http://localhost:3001/api/vv1/usuarios/${id}/abonos/${idAbonoReal}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!responseDirect.ok) {
          const errorData = await responseDirect.json().catch(() => ({}));
          throw new Error(errorData.message || "Error al eliminar el abono en el servidor.");
        }
      }

      // 3. CASO: EDITAR PARÁMETROS DEL ABONO 🟢 (¡Faltaba este bloque!)
      if (abonoDialog.tipo === "editar" && abonoDialog.abono) {
        const idAbonoReal = abonoDialog.abono.idAbono || abonoDialog.abono.id_abono || abonoDialog.abono.id;

        if (!idAbonoReal) {
          setError("No se pudo identificar el ID del abono.");
          setIsActionLoading(false);
          return;
        }

        const token = localStorage.getItem("token");

        
        const cuerpoPeticion = {
          fechaInicio: formAbono.fechaInicio,
          fechaVencimiento: formAbono.fechaVencimiento,
          turnos: Number(formAbono.turnos),
          ajuste: Number(formAbono.ajuste || 0),
          estado: formAbono.estado 
        };

        console.log("=== ENVIANDO AL BACKEND PARA EDITAR ===");
        console.log("URL:", `http://localhost:3001/api/vv1/usuarios/${id}/abonos/${idAbonoReal}`);
        console.log("BODY:", JSON.stringify(cuerpoPeticion, null, 2));

        const responseEdit = await fetch(`http://localhost:3001/api/vv1/usuarios/${id}/abonos/${idAbonoReal}`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(cuerpoPeticion)
        });

        // 🚀 LEEMOS LA RESPUESTA REAL DEL SERVIDOR
        const respuestaServidor = await responseEdit.json().catch(() => ({}));
        console.log("=== RESPUESTA DEL BACKEND ===");
        console.log("Status Code:", responseEdit.status);
        console.log("Payload:", respuestaServidor);

        if (!responseEdit.ok) {
          throw new Error(respuestaServidor.message || "Error al actualizar los parámetros del abono.");
        }
      }

      // Sincronización general de grillas y usuario
      await cargarAbonos(); 
      
      const respuestaUsuario = await getUsuarioById(id);
      const datosRealesUpdate = respuestaUsuario?.data || respuestaUsuario;
      setUser(datosRealesUpdate); 

      if (abonoDialog.tipo === "cargar") {
        setVistaActiva("pagos");
      }

      cerrarAbonoDialog();
    } catch (error) {
      console.error("Error al gestionar abono:", error);
      setError("No se pudo procesar la solicitud del abono.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCobrarCC = async () => {
    console.log("Cobrando CC:", formCobrarCC)
    setCobrarCCDialog(false)
  }

  const handleAjustarCC = async () => {
    console.log("Ajustando CC:", formAjusteCC)
    setAjusteCCDialog(false)
  }

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
  
  // 🟢 MAPEAMOS LA MEMBRESÍA DINÁMICA DE LA RESPUESTA
  const estadoMembresia = user?.membresia || (user?.estado === "activo" ? "activa" : "vencida");
  const membership = membershipConfig[estadoMembresia] || membershipConfig.vencida

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
        <p className="text-muted-foreground">Sincronizando ficha del usuario...</p>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">{error}</div>
        <Link to="/admin/usuarios"><Button variant="outline">Volver a usuarios</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">{error}</div>
      )}

      {/* PANEL SUPERIOR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card p-4 border border-border rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Link to="/admin/usuarios">
            <Button variant="ghost" size="icon" className="hover:bg-secondary rounded-lg">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-medium tracking-tight text-foreground uppercase">{user?.nombre}</h1>
            <p className="text-xs text-muted-foreground">ID Gestión de Usuario Base</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/admin/usuarios/${id}/editar`}>
            <Button variant="outline" size="sm" className="font-medium text-xs h-9">
              <Pencil className="mr-1.5 h-3.5 w-3.5 text-primary" /> Editar Perfil
            </Button>
          </Link>

          {user?.estado === "activo" ? (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 font-medium text-xs h-9"
              onClick={() => setStatusDialog({ open: true, action: "suspend" })}
            >
              <UserX className="mr-1.5 h-3.5 w-3.5" /> Suspender
            </Button>
          ) : user?.estado !== "inactivo" ? (
            <Button
              variant="outline"
              size="sm"
              className="text-green-500 border-green-500/30 hover:bg-green-500/10 font-medium text-xs h-9"
              onClick={() => setStatusDialog({ open: true, action: "activate" })}
            >
              <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Activar
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 font-medium text-xs h-9"
            onClick={() => setDeleteDialog(true)}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar
          </Button>
        </div>
      </div>

      {/* SECCIÓN DE DATOS PERSONALES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border lg:col-span-2 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Nombre Completo</p>
                <p className="font-medium text-foreground mt-0.5">{user?.nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">DNI</p>
                <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" /> {user?.dni}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> {user?.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Teléfono</p>
                <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> {user?.telefono || "Sin registrar"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fecha de Registro</p>
                <p className="font-medium text-foreground mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> {formatearFecha(user?.fechaRegistro)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Último Acceso</p>
                <p className="font-medium text-foreground mt-0.5">{formatearFecha(user?.ultimoAcceso)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-card border-border shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Métricas de Ficha</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Usuario</span>
                <Badge variant="outline" className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${status.className}`}>{status.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Membresía</span>
                <Badge variant="outline" className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${membership.className}`}>{membership.label}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Perfil Calculado</span>
                <span className="font-medium text-foreground capitalize bg-secondary/60 px-2 py-0.5 rounded text-xs">{user?.perfil || "Alumno"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Créditos de Reserva</p>
                <p className="text-xs text-muted-foreground mt-0.5">Disponibles en cuenta</p>
              </div>
              <div className="bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 text-center min-w-[70px]">
                <p className="text-2xl font-semibold text-primary">{user?.creditos ?? 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MENÚ DE PESTAÑAS */}
      <div className="flex gap-2 border-b border-border pb-px">
        <button
          className={`px-4 py-2 font-semibold text-xs tracking-wider uppercase border-b-2 transition-colors ${vistaActiva === "abonos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setVistaActiva("abonos")}
        >
          Control Abonos
        </button>
        <button
          className={`px-4 py-2 font-semibold text-xs tracking-wider uppercase border-b-2 transition-colors ${vistaActiva === "pagos" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setVistaActiva("pagos")}
        >
          Pagos Contables
        </button>
      </div>

      {/* HISTORIAL RESERVAS */}
      {vistaActiva === "reservas" && (
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30 text-muted-foreground font-medium text-xs tracking-wider uppercase">
                    <th className="text-left p-4">Clase</th>
                    <th className="text-left p-4">Fecha</th>
                    <th className="text-left p-4">Hora</th>
                    <th className="text-left p-4">Coach Asignado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reservas.map((reserva) => (
                    <tr key={reserva.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-medium text-foreground">{reserva.clase}</td>
                      <td className="p-4 text-muted-foreground">{formatearFecha(reserva.fecha)}</td>
                      <td className="p-4 font-medium text-foreground">{reserva.hora} hs</td>
                      <td className="p-4 text-muted-foreground">{reserva.coach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CONTROL ABONOS */}
      {vistaActiva === "abonos" && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="py-4 border-b border-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground tracking-tight uppercase">Historial de Abonos Adquiridos</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Visualización dinámica de créditos y transacciones</p>
              </div>
              <Button onClick={() => abrirAbonoDialog("cargar")} size="sm" className="bg-green-600 hover:bg-green-700 text-white font-medium text-xs"><Plus className="mr-1 h-4 w-4" /> Cargar Abono</Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-secondary/30 text-muted-foreground font-medium text-xs tracking-wider uppercase border-b border-border">
                    <th className="p-4 text-left w-12">#</th>
                    <th className="p-4 text-left">Creado</th>
                    <th className="p-4 text-left">Inicio</th>
                    <th className="p-4 text-left">Vencimiento</th>
                    <th className="p-4 text-left">Plan / Item</th>
                    <th className="p-4 text-center">Turnos</th>
                    <th className="p-4 text-center">Ajuste</th>
                    <th className="p-4 text-center">Usados</th>
                    <th className="p-4 text-center">Disponibles</th>
                    <th className="p-4 text-center">Estado</th>
                    <th className="p-4 text-center w-28">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cargandoAbonos ? (
                    <tr><td colSpan="11" className="p-8 text-center text-muted-foreground animate-pulse">Sincronizando grilla de abonos...</td></tr>
                  ) : abonos.length > 0 ? (
                    abonos.map((abono) => (
                      <tr key={abono.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="p-4 font-mono text-xs text-muted-foreground">{abono.id}</td>
                        <td className="p-4 text-muted-foreground">{formatearFecha(abono.creado)}</td>
                        <td className="p-4 font-medium text-foreground">{formatearFecha(abono.inicio)}</td>
                        <td className="p-4 font-medium text-foreground">{formatearFecha(abono.vencimiento)}</td>
                        <td className="p-4 font-medium text-foreground">{abono.abono}</td>
                        <td className="p-4 text-center text-muted-foreground">{abono.turnos}</td>
                        <td className="p-4 text-center font-mono text-xs text-muted-foreground">{abono.ajuste || 0}</td>
                        <td className="p-4 text-center text-muted-foreground">{abono.usados || 0}</td>
                        <td className="p-4 text-center font-semibold text-green-500">{abono.disponibles}</td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className={`font-medium text-[10px] rounded px-2 py-0.5 tracking-wider ${abono.estado === 'CANCELADO' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                            {abono.estado}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md" 
                                onClick={() => {
                                  // Aseguramos que el ID real viaje dentro del abono que va al formulario
                                  const idRealParaEditar = abono.idAbono || abono.id_abono || abono.id;
                                  abrirAbonoDialog("editar", { ...abono, id: idRealParaEditar });
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            {abono.estado !== 'CANCELADO' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md" 
                                onClick={() => {
                                  // 🚀 CAPTURA DIRECTA: Forzamos el ID real de la fila antes de abrir el modal
                                  const idRealParaCancelar = abono.idAbono || abono.id_abono || abono.id;
                                  abrirAbonoDialog("cancelar", { ...abono, id: idRealParaCancelar });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="11" className="p-8 text-center text-muted-foreground text-xs">No se registran abonos vigentes ni históricos cargados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PAGOS CONTABLES */}
      {vistaActiva === "pagos" && (
        <Card className="bg-card border-border shadow-sm">
          <CardHeader className="p-0 border-b border-border">
            <div className="grid grid-cols-3 text-center border-b border-border font-medium text-xs uppercase">
              <button onClick={() => setCobrarCCDialog(true)} className="p-3 bg-[#1e293b] text-teal-400 hover:bg-[#334155] border-r border-border font-semibold tracking-wider transition-colors">Cobrar Cuenta Corriente</button>

            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-secondary/30 text-muted-foreground font-medium text-xs tracking-wider uppercase border-b border-border">
                    <th className="p-4 text-left">Venta #</th>
                    <th className="p-4 text-left">Fecha</th>
                    <th className="p-4 text-left">Tipo</th>
                    <th className="p-4 text-left">Operador</th>
                    <th className="p-4 text-left">Item</th>
                    <th className="p-4 text-right">P. Venta</th>
                    <th className="p-4 text-right">Efectivo</th>
                    <th className="p-4 text-right">Otros</th>
                    <th className="p-4 text-right">C. Corriente</th>
                    <th className="p-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                    {abonos.length > 0 ? (
                      abonos.map((abono) => {
                        const esTarjeta = abono.ajuste > 0; 
                        return (
                          <tr key={`pago-${abono.id}`} className="hover:bg-secondary/20 transition-colors text-xs text-foreground/90">
                            <td className="p-4 font-mono text-muted-foreground">{1300000 + Number(abono.id)}</td>
                            <td className="p-4 text-muted-foreground">{formatearFecha(abono.creado)}</td>
                            <td className="p-4">Abono</td>
                            <td className="p-4 text-muted-foreground uppercase">{abono.operadorReal || "-"}</td>
                            <td className="p-4">-</td>
                            <td className="p-4 font-semibold text-foreground">{abono.abono}</td>
                            <td className="p-4 text-right font-mono">${(abono.turnos * 1800).toLocaleString("es-AR")}</td>
                            <td className="p-4 text-right font-mono text-green-500">${!esTarjeta ? (abono.turnos * 1800).toLocaleString("es-AR") : 0}</td>
                            <td className="p-4 text-right font-mono text-teal-400">${esTarjeta ? (abono.turnos * 1800).toLocaleString("es-AR") : 0}</td>
                            <td className="p-4 text-right font-mono text-red-400">$0</td>
                            <td className="p-4 text-center">
                              <Badge variant="outline" className={`font-medium text-[10px] rounded px-2 py-0.5 uppercase tracking-wider ${abono.estado === 'CANCELADO' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
                                {abono.estado}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="11" className="p-8 text-center text-muted-foreground text-xs">No se registran transacciones contables.</td></tr>
                    )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* MODAL GESTIÓN DE ABONO */}
      <Dialog open={abonoDialog.open} onOpenChange={(open) => !open && cerrarAbonoDialog()}>
        <DialogContent className="bg-[#1c1c1e] border border-border rounded-xl p-8 focus:outline-none shadow-2xl flex flex-col tracking-normal text-foreground !max-w-[950px] !w-[950px]">
          <DialogHeader className="mb-6 shrink-0 border-b border-border/60 pb-3">
            <DialogTitle className="font-medium text-lg text-foreground tracking-tight uppercase">
              {abonoDialog.tipo === "cargar" && "Venta de Abono 2"}
              {abonoDialog.tipo === "editar" && "Editar Parámetros de Abono"}
              {abonoDialog.tipo === "cancelar" && "Revocar Abono Alumno"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-row gap-10 w-full min-h-0 pb-2">
            <div className="w-1/2 space-y-4">
              {abonoDialog.tipo === "cargar" && (
                <>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0">Abono:</span>
                    <div className="flex gap-2 flex-1">
                      <select value={tipoAbono} onChange={(e) => setTipoAbono(e.target.value)} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground font-medium outline-none text-xs focus:border-muted-foreground">
                        <option value="" disabled hidden>Seleccione un abono...</option>
                        <option value="CLASE CROSSFIT">CLASE CROSSFIT</option>
                        <option value="PLANIFICACIÓN ATLETA">PLANIFICACIÓN ATLETA</option>
                      </select>
                      <input type="number" defaultValue="1" className="w-14 bg-[#2c2c2e] border border-border rounded p-2 text-center text-foreground font-medium outline-none text-xs" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0">L.Precio:</span>
                    <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground font-medium outline-none text-xs">
                      <option>Efectivo</option>
                      <option>Débito</option>
                      <option>Tarjeta Crédito</option>
                      <option>Transferencia</option>
                    </select>
                  </div>
                  <div className="flex items-center"><span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0">Ajustes:</span><select className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-muted-foreground outline-none text-xs" disabled><option>No disponible</option></select></div>
                  <div className="flex items-center pt-1"><div className="w-28 shrink-0"></div><div className="flex-1 bg-[#27272a] border border-border rounded p-2.5 text-center text-xs font-medium text-primary tracking-wide">{creditosAbono} Créditos — 1 Mes</div></div>
                  <div className="flex items-center pt-1"><span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0">Comienzo:</span><input type="date" value={formAbono.fechaInicio || ""} onChange={(e) => setFormAbono((prev) => ({ ...prev, fechaInicio: e.target.value }))} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground outline-none text-xs" /></div>
                  <div className="flex items-center"><span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0">Vencimiento:</span><input type="date" value={formAbono.fechaVencimiento || ""} onChange={(e) => setFormAbono((prev) => ({ ...prev, fechaVencimiento: e.target.value }))} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground outline-none text-xs" /></div>
                </>
              )}

              {abonoDialog.tipo === "editar" && (
                <>
                  <div className="flex items-center"><span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0">Comienzo:</span><input type="date" value={formAbono.fechaInicio || ""} onChange={(e) => setFormAbono((prev) => ({ ...prev, fechaInicio: e.target.value }))} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground outline-none text-xs" /></div>
                  <div className="flex items-center"><span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0">Vencimiento:</span><input type="date" value={formAbono.fechaVencimiento || ""} onChange={(e) => setFormAbono((prev) => ({ ...prev, fechaVencimiento: e.target.value }))} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground outline-none text-xs" /></div>
                  <div className="flex items-center"><span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0">Turnos:</span><input type="number" value={formAbono.turnos} onChange={(e) => setFormAbono((prev) => ({ ...prev, turnos: e.target.value }))} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground outline-none text-xs" /></div>
                  <div className="flex items-center">
                  <span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0">Estado:</span>
                  <select 
                    value={formAbono.estado} 
                    onChange={(e) => setFormAbono((prev) => ({ ...prev, estado: e.target.value }))} 
                    className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground outline-none text-xs"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="CANCELADO">CANCELADO</option> {/* 🚀 Clave para que mapee el estado inicial */}
                    <option value="VENCIDO">VENCIDO</option>
                    <option value="PAUSADO">PAUSADO</option>
                  </select>
                </div>
              </>
              )}

              {abonoDialog.tipo === "cancelar" && (
                <div className="space-y-4">
                  <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-xs font-medium uppercase">⚠️ Dará de baja los créditos comerciales del alumno.</div>
                  <div className="space-y-2 bg-[#2c2c2e]/60 border border-border rounded p-3 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Plan Base:</span><span className="font-bold text-foreground">{abonoDialog.abono?.abono}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Expiración:</span><span className="font-mono text-foreground">{formatearFecha(abonoDialog.abono?.vencimiento)}</span></div>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <span className="text-xs font-semibold uppercase text-muted-foreground w-28 shrink-0 mt-2">Nota:</span>
                <textarea value={formAbono.motivo} onChange={(e) => setFormAbono((prev) => ({ ...prev, motivo: e.target.value }))} placeholder="Observaciones..." className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-xs outline-none h-16 resize-none" />
              </div>
            </div>

            <div className="w-1/2 space-y-4 border-l border-border/40 pl-8 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground w-32 shrink-0">Importe:</span>
                <input type="number" value={abonoDialog.tipo === "cargar" ? precioBase : (abonoDialog.abono?.importe || 0)} readOnly className="w-40 bg-[#2c2c2e]/40 border border-border rounded p-2 text-right font-mono text-foreground text-xs outline-none" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-muted-foreground w-32 shrink-0">Ajuste:</span>
                <div className="flex gap-2 w-40 justify-end">
                  <input type="number" value={formAbono.ajuste} onChange={(e) => setFormAbono((prev) => ({ ...prev, ajuste: Number(e.target.value) }))} className="w-full bg-[#2c2c2e] border border-border rounded p-2 text-right font-mono text-foreground outline-none text-xs" disabled={abonoDialog.tipo === "cancelar"} />
                  <Button variant="secondary" size="icon" className="h-9 w-9 border border-border bg-[#2c2c2e] hover:bg-[#3a3a3c] text-foreground font-bold text-sm rounded shrink-0">-</Button>
                </div>
              </div>
              <div className="text-right py-3 border-b border-border/60">
                <p className="text-xs font-semibold text-muted-foreground uppercase">
                  PRECIO FINAL : <span className="font-bold text-sm text-foreground ml-1 font-mono">${abonoDialog.tipo === "cargar" ? precioFinal.toLocaleString("es-AR") : (abonoDialog.abono?.importe || 0).toLocaleString("es-AR")}</span>
                </p>
              </div>
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase text-muted-foreground w-32 shrink-0">Efectivo:</span><input type="number" value={abonoDialog.tipo === "cargar" && metodoPago === "Efectivo" ? precioFinal : 0} readOnly className="w-40 bg-[#2c2c2e] border border-border rounded p-2 text-right font-mono text-foreground text-xs" /></div>
                <div className="flex items-center justify-between"><select className="text-xs font-semibold uppercase text-foreground bg-[#2c2c2e] border border-border rounded p-1.5 outline-none w-32 shrink-0"><option>Tarjeta</option></select><input type="number" value={abonoDialog.tipo === "cargar" && metodoPago === "Tarjeta Crédito" ? precioFinal : 0} readOnly className="w-40 bg-[#2c2c2e] border border-border rounded p-2 text-right font-mono text-foreground text-xs" /></div>
                <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase text-muted-foreground w-32 shrink-0">Cuenta Corriente:</span><input type="number" defaultValue="0" readOnly className="w-40 bg-[#2c2c2e] border border-border rounded p-2 text-right font-mono text-foreground text-xs" /></div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 border-t border-border pt-4 flex sm:justify-end gap-3 shrink-0">
            <Button variant="outline" size="sm" onClick={cerrarAbonoDialog} className="font-medium text-xs bg-transparent border-border hover:bg-secondary text-foreground px-5 h-9 rounded uppercase">Cerrar</Button>
            <Button onClick={handleConfirmarAbono} size="sm" disabled={isActionLoading} className={`font-medium text-xs px-5 h-9 rounded uppercase tracking-wider transition-colors shadow-sm text-white ${abonoDialog.tipo === "cancelar" ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"}`}>
              {isActionLoading && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
              {abonoDialog.tipo === "cargar" && "CARGAR ABONO"}
              {abonoDialog.tipo === "editar" && "Guardar Cambios"}
              {abonoDialog.tipo === "cancelar" && "REVOCAR ABONO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL COBRAR SALDO */}
      <Dialog open={cobrarCCDialog} onOpenChange={setCobrarCCDialog}>
        <DialogContent className="bg-[#1c1c1e] border border-border rounded-xl p-6 max-w-[600px] text-foreground">
          <DialogHeader className="border-b border-border/60 pb-3"><DialogTitle className="font-medium text-base text-foreground uppercase tracking-tight">Cobrar saldo cuenta corriente</DialogTitle></DialogHeader>
          <div className="py-6 space-y-4 text-sm">
            <div className="flex items-center"><span className="text-xs font-semibold uppercase text-muted-foreground w-36 shrink-0">Importe Efectivo:</span><input type="number" value={formCobrarCC.efectivo} onChange={(e) => setFormCobrarCC(prev => ({ ...prev, efectivo: Number(e.target.value) }))} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground font-mono text-xs outline-none" /></div>
            <div className="flex items-center"><select value={formCobrarCC.tipoTarjeta} onChange={(e) => setFormCobrarCC(prev => ({ ...prev, tipoTarjeta: e.target.value }))} className="text-xs font-semibold uppercase text-foreground bg-[#2c2c2e] border border-border rounded p-2 w-36 shrink-0 mr-4 outline-none"><option>Tarjeta</option></select><input type="number" value={formCobrarCC.tarjeta} onChange={(e) => setFormCobrarCC(prev => ({ ...prev, tarjeta: Number(e.target.value) }))} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground font-mono text-xs outline-none" /></div>
          </div>
          <DialogFooter className="border-t border-border/60 pt-4 gap-2"><Button variant="outline" size="sm" onClick={() => setCobrarCCDialog(false)} className="uppercase text-xs px-4 h-9">Cerrar</Button><Button onClick={handleCobrarCC} size="sm" className="bg-green-600 hover:bg-green-700 text-white uppercase text-xs px-4 h-9 font-medium tracking-wide">Cargar Abono</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL AJUSTE SALDO */}
      <Dialog open={ajusteCCDialog} onOpenChange={setAjusteCCDialog}>
        <DialogContent className="bg-[#1c1c1e] border border-border rounded-xl p-6 max-w-[600px] text-foreground">
          <DialogHeader className="border-b border-border/60 pb-3"><DialogTitle className="font-medium text-base text-foreground uppercase tracking-tight">Ajuste saldo cuenta corriente</DialogTitle></DialogHeader>
          <div className="py-6 space-y-4 text-sm">
            <div className="flex items-center"><span className="text-xs font-semibold uppercase text-muted-foreground w-32 shrink-0">Importe Ajuste:</span><input type="number" value={formAjusteCC.importe} onChange={(e) => setFormAjusteCC(prev => ({ ...prev, importe: Number(e.target.value) }))} className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-foreground font-mono text-xs outline-none" /></div>
            <div className="flex items-start"><span className="text-xs font-semibold uppercase text-muted-foreground w-32 shrink-0 mt-2">Aclaración:</span><textarea value={formAjusteCC.aclaracion} onChange={(e) => setFormAjusteCC(prev => ({ ...prev, aclaracion: e.target.value }))} placeholder="Indique el motivo del ajuste contable..." className="flex-1 bg-[#2c2c2e] border border-border rounded p-2 text-xs text-foreground outline-none h-20 resize-none" /></div>
          </div>
          <DialogFooter className="border-t border-border/60 pt-4 gap-2"><Button variant="outline" size="sm" onClick={() => setAjusteCCDialog(false)} className="uppercase text-xs px-4 h-9">Cerrar</Button><Button onClick={handleAjustarCC} size="sm" className="bg-green-600 hover:bg-green-700 text-white uppercase text-xs px-4 h-9 font-medium tracking-wide">Cargar Abono</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODALES ADICIONALES */}
      <Dialog open={statusDialog.open} onOpenChange={(open) => setStatusDialog({ ...statusDialog, open })}>
        <DialogContent className="bg-card border-border rounded-xl"><DialogHeader><DialogTitle className="font-semibold text-foreground tracking-tight">{statusDialog.action === "suspend" ? "Suspender Acceso" : "Restablecer Acceso"}</DialogTitle></DialogHeader><DialogFooter className="gap-2"><Button variant="outline" size="sm" onClick={() => setStatusDialog({ open: false, action: "" })}>Cancelar</Button><Button variant={statusDialog.action === "activate" ? "default" : "destructive"} size="sm" onClick={() => handleStatusChange(statusDialog.action === "suspend" ? "suspendido" : "activo")} disabled={isActionLoading}>Confirmar</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="bg-card border-border rounded-xl"><DialogHeader><DialogTitle className="text-destructive font-semibold tracking-tight">Eliminar Registro</DialogTitle></DialogHeader><DialogFooter className="gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteDialog(false)}>Cancelar</Button><Button variant="destructive" size="sm" onClick={handleDelete} disabled={isActionLoading}>Eliminar</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}