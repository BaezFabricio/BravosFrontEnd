import { User, Mail, Phone, CreditCard, Calendar, Shield, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

const userData = {
  nombre: "María García",
  dni: "32456789",
  email: "maria@email.com",
  telefono: "+54 11 1234 5678",
  perfil: "Alumno",
  estado: "activo",
  membresia: "vigente",
  vencimientoMembresia: "15 de Abril, 2024",
  fechaRegistro: "15 de Enero, 2024",
  creditos: 12,
}

const statusConfig = {
  activo: { label: "Activo", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  suspendido: { label: "Suspendido", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-primary/10 text-primary border-primary/20" },
  por_vencer: { label: "Por Vencer", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20" },
}

export default function PerfilPage() {
  const status = statusConfig[userData.estado]
  const membership = membershipConfig[userData.membresia]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground">Consulta tu información personal y estado de membresía</p>
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
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">MG</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{userData.nombre}</h3>
                <p className="text-muted-foreground">{userData.perfil}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  DNI
                </p>
                <p className="font-medium text-foreground">{userData.dni}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Correo Electrónico
                </p>
                <p className="font-medium text-foreground">{userData.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </p>
                <p className="font-medium text-foreground">{userData.telefono}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Miembro desde
                </p>
                <p className="font-medium text-foreground">{userData.fechaRegistro}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Estado de Cuenta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estado Usuario</span>
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
                <span className="text-sm text-muted-foreground">Vencimiento</span>
                <span className="text-sm font-medium text-foreground">{userData.vencimientoMembresia}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Créditos</span>
                <span className="text-lg font-bold text-primary">{userData.creditos}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {userData.membresia === "vigente" && (
        <Alert className="bg-primary/10 border-primary/20">
          <Shield className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary">Tu membresía está al día</AlertTitle>
          <AlertDescription className="text-primary/80">
            Tu próximo pago vence el {userData.vencimientoMembresia}. Recuerda que si no pagas antes del día 10, tu cuenta será suspendida automáticamente.
          </AlertDescription>
        </Alert>
      )}

      {userData.estado === "suspendido" && (
        <Alert className="bg-yellow-500/10 border-yellow-500/20">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-500">Cuenta Suspendida</AlertTitle>
          <AlertDescription className="text-yellow-500/80">
            Tu cuenta está suspendida por falta de pago. Regulariza tu membresía para volver a reservar clases y usar tus créditos.
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Acciones</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">Cambiar Contraseña</Button>
            <Button variant="outline">Actualizar Datos</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
