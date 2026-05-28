import { useEffect, useState } from "react"
import { User, Mail, Phone, CreditCard, Calendar, Shield, AlertTriangle, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  suspendido: { label: "Suspendido", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-primary/10 text-primary border-primary/20" },
  por_vencer: { label: "Por Vencer", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20" },
}

export default function PerfilPage() {
  const storedUser = JSON.parse(localStorage.getItem("usuario") || "{}")
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem("avatarUrl") || storedUser?.avatarUrl || ""
  })
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState("")

  useEffect(() => {
    const handleAvatarUpdated = (event) => {
      setAvatarUrl(event.detail || "")
    }

    window.addEventListener("avatar-updated", handleAvatarUpdated)
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdated)
  }, [])

  const getIniciales = (name) => {
    if (!name) return "MG"

    const parts = name.trim().split(" ")
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }

    return name.substring(0, 2).toUpperCase()
  }

  const nombreVisible = storedUser?.nombrecompleto || storedUser?.nombre || userData.nombre
  const correoVisible = storedUser?.correo || storedUser?.email || userData.email
  const perfilVisible = storedUser?.perfil || storedUser?.rol || storedUser?.tipo || userData.perfil

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const value = reader.result
      const storedUser = JSON.parse(localStorage.getItem("usuario") || "{}")
      const userId = storedUser?.idUsuario
      setAvatarError("")

      if (!userId) {
        setAvatarError("No pude identificar tu usuario para guardar la foto en la base de datos.")
        return
      }

      setIsSavingAvatar(true)

      fetch(`http://localhost:3001/api/vv1/usuarios/${userId}/avatar`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ avatarData: value }),
      })
        .then(async (response) => {
          const data = await response.json()
          if (!response.ok) throw new Error(data?.message || "No se pudo guardar la foto")

          const persistedAvatar = data?.data?.avatarUrl || value
          setAvatarUrl(persistedAvatar)
          localStorage.setItem("avatarUrl", persistedAvatar)
          localStorage.setItem(
            "usuario",
            JSON.stringify({ ...storedUser, avatarUrl: persistedAvatar })
          )
          window.dispatchEvent(new CustomEvent("avatar-updated", { detail: persistedAvatar }))
        })
        .catch((error) => {
          console.error("Error al guardar el avatar:", error)
          setAvatarError(error.message || "No se pudo guardar la foto en la base de datos.")
        })
        .finally(() => {
          setIsSavingAvatar(false)
        })
    }
    reader.readAsDataURL(file)
  }

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
              <Avatar className="h-20 w-20 border border-border bg-background">
                <AvatarImage src={avatarUrl} alt={userData.nombre} />
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                  {getIniciales(nombreVisible)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-bold text-foreground">{nombreVisible}</h3>
                <p className="text-muted-foreground">{perfilVisible}</p>
              </div>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50">
                <Camera className="h-4 w-4" />
                {isSavingAvatar ? "Guardando..." : "Cambiar foto"}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
              <p className="text-xs text-muted-foreground">Se guarda en la base de datos si el backend responde bien.</p>
            </div>

            {avatarError && (
              <p className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {avatarError}
              </p>
            )}
            
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
                <p className="font-medium text-foreground">{correoVisible}</p>
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
        <Alert className="bg-green-500/10 border-green-500/20">
          <AlertTriangle className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-500">Cuenta Suspendida</AlertTitle>
          <AlertDescription className="text-green-500/80">
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
