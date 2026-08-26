import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { User, Mail, Phone, CreditCard, Calendar, Shield, AlertTriangle, Camera, Home, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { toast } from '@/lib/notificar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import apiClient from "@/api"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/vv1"

// Valores por defecto mínimos (usados mientras cargan datos reales)
const defaultUserData = {
  nombre: "",
  dni: "",
  email: "",
  telefono: "",
  perfil: "usuario",
  estado: "inactivo",
  membresia: null,
  vencimientoMembresia: "",
  fechaRegistro: "",
  creditos: 0,
}

const statusConfig = {
  activo: { label: "Activo", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  suspendido: { label: "Suspendido", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-primary/10 text-primary border-primary/20" },
  por_vencer: { label: "Por Vencer", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20" },
}

export default function PerfilPage() {
  const navigate = useNavigate()
  const storedUser = JSON.parse(localStorage.getItem("usuario") || "{}")
  const [avatarUrl, setAvatarUrl] = useState(() => {
    return localStorage.getItem("avatarUrl") || storedUser?.avatarUrl || ""
  })
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const [userData, setUserData] = useState(defaultUserData)
  const [loading, setLoading] = useState(true)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [abonoData, setAbonoData] = useState({ vencimiento: null, creditos: 0 });

  useEffect(() => {
    const handleAvatarUpdated = (event) => {
      setAvatarUrl(event.detail || "")
    }

    window.addEventListener("avatar-updated", handleAvatarUpdated)
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdated)
  }, [])

  useEffect(() => {
    let mounted = true
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await apiClient.get('/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = response.data?.data || response.data
        const usuario = data?.usuario || data

        if (usuario?.idUsuario) {
          apiClient.get(`/usuarios/${usuario.idUsuario}/abonos`)
            .then((res) => {
              const abonos = res.data?.data || res.data || []
              const activo = abonos.find(a => a.estado === 'ACTIVO')
              if (activo) {
                const creditosValue = activo.turnos !== undefined ? activo.turnos : 0
                setAbonoData({ 
                  vencimiento: activo.vencimiento, 
                  creditos: creditosValue
                })
              }
            })
            .catch(err => console.error("Error cargando abonos:", err))
        }
  
        if (mounted && usuario) {
          // Helper: buscar recursivamente posibles nombres de campo en la respuesta
          const findValue = (obj, names) => {
            if (!obj || typeof obj !== 'object') return undefined
            const lowerNames = names.map((n) => n.toLowerCase())
            let found
            const visit = (o) => {
              if (found !== undefined || o == null) return
              if (typeof o !== 'object') return
              for (const k of Object.keys(o)) {
                if (lowerNames.includes(k.toLowerCase())) {
                  found = o[k]
                  return
                }
              }
              for (const k of Object.keys(o)) {
                visit(o[k])
                if (found !== undefined) return
              }
            }
            visit(obj)
            return found
          }

          // Mapear campos desde la API a lo que usa la UI
          setUserData({
            nombre: usuario.nombrecompleto || usuario.nombre || usuario.displayName || '',
            idUsuario: usuario.idUsuario || usuario.idUsuario || null,
            dni: findValue(usuario, ['dni', 'DNI', 'documento', 'nroDocumento', 'numeroDocumento', 'rut']) || '',
            email: usuario.correo || usuario.email || '',
            telefono: findValue(usuario, ['telefono', 'phone', 'celular', 'mobile', 'cel']) || '',
            perfil: (usuario.perfil || usuario.nombrePerfil || usuario.rol || 'usuario').toLowerCase(),
            estado: (usuario.estado || 'inactivo').toLowerCase(),
            membresia: usuario.estado === 'activo' ? 'vigente' : usuario.estado,
            vencimientoMembresia: usuario.vencimiento || usuario.fecha_vencimiento || usuario.vencimientoMembresia || '',
            fechaRegistro: findValue(usuario, ['fecha_registro', 'fechaRegistro', 'miembroDesde', 'createdAt', 'created_at']) || '',  
            creditos: usuario.creditos || 0,
          })

          // actualizar avatar si viene en usuario
          if (usuario.avatarUrl) {
            setAvatarUrl(usuario.avatarUrl)
            localStorage.setItem('avatarUrl', usuario.avatarUrl)
          }
        }
      } catch (error) {
        console.error('No se pudo obtener perfil:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchProfile()
    return () => { mounted = false }
  }, [])

  const getIniciales = (name) => {
    if (!name) return "MG"

    const parts = name.trim().split(" ")
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }

    return name.substring(0, 2).toUpperCase()
  }

  const maskDNI = (dni) => {
    if (!dni) return '—'
    const s = String(dni)
    const last = s.slice(-4)
    return `****${last}`
  }

  const maskPhone = (phone) => {
    if (!phone) return '—'
    const s = String(phone)
    const last = s.slice(-4)
    return `****${last}`
  }

  const nombreVisible = storedUser?.nombrecompleto || storedUser?.nombre || userData.nombre
  const correoVisible = storedUser?.correo || storedUser?.email || userData.email
  // Priorizar el valor retornado por la API para decidir qué mostrar
  const perfilVisible = (userData.perfil || storedUser?.perfil || storedUser?.rol || storedUser?.tipo || 'usuario').toLowerCase()
  const isNormalUser = perfilVisible === 'usuario' || perfilVisible === 'cliente' || perfilVisible === ''
  const isOwner = Boolean(storedUser?.idUsuario && userData.idUsuario && Number(storedUser.idUsuario) === Number(userData.idUsuario))

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

      fetch(`${API_BASE_URL}/usuarios/${userId}/avatar`, {
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

  const status = statusConfig[userData.estado] || statusConfig.inactivo

  // Calcular estado real de membresía en base a la fecha de vencimiento del abono
  const membershipStatus = (() => {
    if (!abonoData.vencimiento) return userData.membresia
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const venc = new Date(abonoData.vencimiento)
    venc.setHours(0, 0, 0, 0)
    const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
    if (dias < 0) return 'vencida'
    if (dias <= 7) return 'por_vencer'
    return 'vigente'
  })()
  const membership = membershipConfig[membershipStatus] || null

  const handleGoHome = () => {
    navigate("/");
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    // Validaciones
    if (!passwordForm.currentPassword) {
      toast.error("Ingresa tu contraseña actual")
      return
    }
    if (!passwordForm.newPassword) {
      toast.error("Ingresa tu nueva contraseña")
      return
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setPasswordLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:3001/api/vv1/auth/cambiar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contrasenaActual: passwordForm.currentPassword,
          contrasenaNueva: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message || "No se pudo cambiar la contraseña")
        return
      }

      toast.success("Contraseña cambiada exitosamente")
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setShowChangePassword(false)
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error al cambiar la contraseña")
    } finally {
      setPasswordLoading(false)
    }
  }

  const membershipBadgeStyle = {
    vigente:   'bg-lime-400/10 text-lime-400 border border-lime-400/20',
    por_vencer:'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20',
    vencida:   'bg-red-500/10 text-red-400 border border-red-500/20',
  }
  const statusBadgeStyle = {
    activo:    'bg-lime-400/10 text-lime-400 border border-lime-400/20',
    suspendido:'bg-red-500/10 text-red-400 border border-red-500/20',
    inactivo:  'bg-foreground/5 text-muted-foreground border border-border',
  }

  return (
    <div className="space-y-6">

      {/* Título */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-foreground">Mi Perfil</h1>
        <p className="text-sm text-foreground/40 mt-1">Información personal y estado de membresía</p>
      </div>

      {/* Alertas de membresía */}
      {membershipStatus === "por_vencer" && (
        <div className="flex items-start gap-3 border border-yellow-400/20 bg-yellow-400/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-yellow-400">Membresía por vencer</p>
            <p className="text-xs text-foreground/50 mt-0.5">Vence el {abonoData.vencimiento ? new Date(abonoData.vencimiento).toLocaleDateString() : '—'}. Acercate al box para renovar.</p>
          </div>
        </div>
      )}
      {membershipStatus === "vencida" && (
        <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-red-400">Membresía vencida</p>
            <p className="text-xs text-foreground/50 mt-0.5">Venció el {abonoData.vencimiento ? new Date(abonoData.vencimiento).toLocaleDateString() : '—'}. Renovate para seguir reservando.</p>
          </div>
        </div>
      )}
      {userData.estado === "suspendido" && (
        <div className="flex items-start gap-3 border border-red-500/20 bg-red-500/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-red-400">Cuenta suspendida</p>
            <p className="text-xs text-foreground/50 mt-0.5">Regularizá tu membresía para volver a reservar clases.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Columna izquierda — datos personales */}
        <div className="lg:col-span-2 space-y-4">

          {/* Card avatar + nombre */}
          <div className="border border-border bg-card p-5">
            <div className="flex items-center gap-5">
              <div className="relative h-20 w-20 shrink-0 rounded-full overflow-hidden border-2 border-lime-400/40 bg-lime-400 flex items-center justify-center text-black font-black text-2xl select-none">
                {avatarUrl && avatarUrl.trim()
                  ? <img src={avatarUrl} alt={nombreVisible} className="h-full w-full object-cover" />
                  : getIniciales(nombreVisible)
                }
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">{perfilVisible}</span>
                <h2 className="text-xl font-black uppercase text-foreground leading-tight truncate mt-0.5">{nombreVisible}</h2>
                <p className="text-xs text-foreground/40 truncate">{correoVisible}</p>
                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-foreground/50 hover:text-foreground hover:border-foreground/30 transition-colors">
                  <Camera className="h-3.5 w-3.5" />
                  {isSavingAvatar ? "Guardando..." : "Cambiar foto"}
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>
            {avatarError && (
              <p className="mt-3 text-xs text-red-400 border border-red-500/20 bg-red-500/5 px-3 py-2">{avatarError}</p>
            )}
          </div>

          {/* Card datos */}
          <div className="border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Información Personal</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {[
                { icon: CreditCard, label: 'DNI', value: (isNormalUser && !isOwner) ? maskDNI(userData.dni) : (userData.dni || '—') },
                { icon: Mail, label: 'Correo', value: correoVisible },
                { icon: Phone, label: 'Teléfono', value: (isNormalUser && !isOwner) ? maskPhone(userData.telefono) : (userData.telefono || '—') },
                { icon: Calendar, label: 'Miembro desde', value: userData.fechaRegistro ? new Date(userData.fechaRegistro).toLocaleDateString() : '—' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="px-5 py-4">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    <Icon className="h-3 w-3" />{label}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="border border-border bg-card px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Acciones</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setShowChangePassword(true)}
                className="border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors">
                Cambiar Contraseña
              </button>
              <button onClick={handleGoHome}
                className="flex items-center gap-2 border border-border px-4 py-2 text-xs font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/30 transition-colors">
                <Home className="h-3.5 w-3.5" />Volver al inicio
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha — métricas */}
        <div className="space-y-4">

          {/* Estado cuenta */}
          <div className="border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado de Cuenta</p>
            </div>
            <div className="divide-y divide-border">
              {[
                { label: 'Usuario', badge: status.label, style: statusBadgeStyle[userData.estado] || statusBadgeStyle.inactivo },
                { label: 'Membresía', badge: membership?.label || '—', style: membershipBadgeStyle[membershipStatus] || 'text-muted-foreground border border-border' },
                { label: 'Perfil', badge: userData.perfil || 'Alumno', style: 'text-foreground/60 border border-border' },
              ].map(({ label, badge, style }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3">
                  <p className="text-xs text-foreground/40 uppercase tracking-wide font-semibold">{label}</p>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 ${style}`}>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Créditos / vencimiento */}
          {abonoData.vencimiento && (
            <div className="border border-border bg-card">
              <div className="border-b border-border px-5 py-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Membresía Activa</p>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-5 py-3">
                  <p className="text-xs text-foreground/40 uppercase tracking-wide font-semibold">Vencimiento</p>
                  <p className="text-xs font-bold text-foreground">{new Date(abonoData.vencimiento).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                  <p className="text-xs text-foreground/40 uppercase tracking-wide font-semibold">Créditos</p>
                  <p className="text-3xl font-black text-lime-400 leading-none">{abonoData.creditos || 0}</p>
                </div>
              </div>
            </div>
          )}

          {membershipStatus === "vigente" && (
            <div className="border border-lime-400/20 bg-lime-400/5 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-lime-400">Al día</p>
              <p className="text-xs text-foreground/40 mt-1">Próximo vencimiento: {abonoData.vencimiento ? new Date(abonoData.vencimiento).toLocaleDateString() : '—'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal cambiar contraseña */}
      <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>Ingresa tu contraseña actual y elige una nueva</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <div className="relative">
                <Input id="current-password" type={showPasswords.current ? "text" : "password"} value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Ingresa tu contraseña actual" className="pr-10" />
                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <div className="relative">
                <Input id="new-password" type={showPasswords.new ? "text" : "password"} value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Mínimo 6 caracteres" className="pr-10" />
                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
              <div className="relative">
                <Input id="confirm-password" type={showPasswords.confirm ? "text" : "password"} value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Confirma tu nueva contraseña" className="pr-10" />
                <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowChangePassword(false)}>Cancelar</Button>
              <Button type="submit" disabled={passwordLoading}>{passwordLoading ? "Cambiando..." : "Cambiar Contraseña"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
