import { useContext, useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { AlertTriangle, Calendar, Camera, CreditCard, Eye, EyeOff, Lock, LogOut, Mail, Phone } from "lucide-react"
import { cerrarSesionEnServidor } from "@/lib/sesion"
import { panelesPermitidos } from "@/lib/paneles"
import { fmtFechaPlan } from "@/lib/miPlan"
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
import { TituloPagina } from "@/components/TituloPagina"
import FotoAmpliable from "@/components/FotoAmpliable"
import { useAnchoPanel } from "@/lib/useEscritorio"
import { LayoutBxContext, LayoutAdminContext } from "@/lib/layoutBx"
import PerfilAdminEscritorio from "@/app/admin/perfil/PerfilAdminEscritorio"
import PerfilEscritorio from "./PerfilEscritorio"
import PerfilMovilNuevo from "./PerfilMovilNuevo"

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
  activo: { label: "Activo", className: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20" },
  suspendido: { label: "Suspendido", className: "bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20" },
  inactivo: { label: "Inactivo", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

const membershipConfig = {
  vigente: { label: "Vigente", className: "bg-primary/10 text-primary border-primary/20" },
  por_vencer: { label: "Por Vencer", className: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20" },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-700 dark:text-red-500 border-red-500/20" },
  sin_membresia: { label: "Sin membresía", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

// Diseño de siempre: celular y otros paneles (admin, profesor) que comparten esta pantalla
function PerfilClasico() {
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
  // Hasta que no responde /abonos no se sabe si hay membresía: sin esto, el
  // perfil mostraba "Vigente" un instante (o para siempre si el pedido fallaba).
  const [abonoCargado, setAbonoCargado] = useState(false);

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
        const response = await apiClient.get('/auth/me', {
                  })
        const data = response.data?.data || response.data
        const usuario = data?.usuario || data

        if (usuario?.idUsuario) {
          apiClient.get(`/usuarios/${usuario.idUsuario}/abonos`)
            .then((res) => {
              const abonos = res.data?.data || res.data || []
              const activo = abonos.find(a => a.estado === 'ACTIVO')
              if (activo) {
                // Créditos que le quedan (no el total que trae el plan): se suman los de todas sus membresías activas
                // Solo las que siguen vigentes: una membresía vencida puede figurar todavía como ACTIVO en la base
                const d = new Date()
                const hoyLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                const creditosValue = abonos
                  .filter(a => a.estado === 'ACTIVO' && (!a.vencimiento || String(a.vencimiento).slice(0, 10) >= hoyLocal))
                  .reduce((suma, a) => suma + (Number(a.disponibles) || 0), 0)
                setAbonoData({
                  vencimiento: activo.vencimiento,
                  creditos: creditosValue
                })
              } else {
                setAbonoData({ vencimiento: null, creditos: 0 })
              }
              setAbonoCargado(true)
            })
            .catch(() => {})
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
      } catch {
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
    if (!abonoCargado) return null
    if (!abonoData.vencimiento) return 'sin_membresia'
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

  // Mismo cierre de sesión que el menú de los paneles
  const handleLogout = () => {
    cerrarSesionEnServidor()
    localStorage.clear()
    navigate("/login", { replace: true })
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
    // Misma regla que exige el servidor
    const nueva = passwordForm.newPassword
    if (nueva.length < 8 || !/[A-Z]/.test(nueva) || !/[a-z]/.test(nueva) || !/[0-9]/.test(nueva)) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setPasswordLoading(true)
    try {
      const response = await fetch("/api/vv1/auth/cambiar-contrasena", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

      toast.success("Contraseña cambiada", { description: "Se cerraron las sesiones abiertas en otros dispositivos." })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setShowChangePassword(false)
    } catch {
      toast.error("Error al cambiar la contraseña")
    } finally {
      setPasswordLoading(false)
    }
  }

  const membershipBadgeStyle = {
    vigente:   'bg-lime-400/10 text-lime-700 dark:text-lime-400 border border-lime-400/20',
    por_vencer:'bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 border border-yellow-400/20',
    vencida:   'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
  }
  const statusBadgeStyle = {
    activo:    'bg-lime-400/10 text-lime-700 dark:text-lime-400 border border-lime-400/20',
    suspendido:'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
    inactivo:  'bg-foreground/5 text-muted-foreground border border-border',
  }

  // Fechas "AAAA-MM-DD…" mostradas sin pasar por la zona horaria (evita que se corran un día)
  const fechaCorta = (f) => (f ? fmtFechaPlan(String(f).slice(0, 10)) : "—")
  // Sin permiso de alumno (ej. un admin que no es alumno) no se muestra nada de membresía
  const esAlumno = panelesPermitidos().alumno
  const puedeRenovar = esAlumno

  return (
    <div className="space-y-6">

      {/* ── CELULAR ─────────────────────────────────────────────────────────── */}
      <div className="space-y-4 lg:hidden">
        <div>
          <h1 data-guia="titulo" className="titulo-app text-3xl font-black uppercase leading-none tracking-tight text-foreground">Mi perfil</h1>
        </div>

        {esAlumno && (membershipStatus === "por_vencer" || membershipStatus === "vencida") && (
          <div className={`flex items-center gap-3 rounded-2xl border p-3 ${
            membershipStatus === "vencida" ? "border-red-500/40 bg-red-500/10" : "border-yellow-500/40 bg-yellow-500/10"
          }`}>
            <AlertTriangle className={`h-5 w-5 shrink-0 ${membershipStatus === "vencida" ? "text-red-700 dark:text-red-400" : "text-yellow-700 dark:text-yellow-400"}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-black uppercase tracking-wide ${membershipStatus === "vencida" ? "text-red-700 dark:text-red-400" : "text-yellow-700 dark:text-yellow-400"}`}>
                {membershipStatus === "vencida" ? "Membresía vencida" : "Membresía por vencer"}
              </p>
              <p className="text-xs text-foreground/70">{membershipStatus === "vencida" ? "Venció" : "Vence"} el {fechaCorta(abonoData.vencimiento)}</p>
            </div>
            {puedeRenovar && (
              <button type="button" onClick={() => navigate("/alumno/plan")}
                className={`min-h-[2.5rem] shrink-0 rounded-lg border border-yellow-600/50 px-3 text-xs font-black uppercase text-yellow-800 dark:border-yellow-400/50 dark:text-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background`}>
                Renovar
              </button>
            )}
          </div>
        )}
        {esAlumno && userData.estado === "suspendido" && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700 dark:text-red-400" aria-hidden="true" />
            <p className="text-sm text-foreground/80"><span className="font-black text-red-700 dark:text-red-400">Cuenta suspendida.</span> Regularizá tu membresía para volver a reservar clases.</p>
          </div>
        )}

        {/* Foto, nombre y correo */}
        <div data-guia="perfil-cabecera" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
          <FotoAmpliable src={avatarUrl} alt={nombreVisible} className="flex h-20 w-20 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-lime-400 text-2xl font-black text-black ring-4 ring-lime-400/25">
            {getIniciales(nombreVisible)}
          </FotoAmpliable>
          <div className="min-w-0 flex-1">
            <span className="rounded bg-lime-400/15 px-1.5 py-0.5 text-[0.625rem] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">{perfilVisible}</span>
            <h2 className="mt-1 truncate text-xl font-black uppercase leading-tight text-foreground">{nombreVisible}</h2>
            <p className="truncate text-xs text-foreground/60">{correoVisible}</p>
            <label data-guia="perfil-foto" className={`mt-2 inline-flex min-h-[2.25rem] cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-[0.6875rem] font-bold uppercase tracking-wide text-foreground/80 focus-within:ring-2 focus-within:ring-lime-500`}>
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              {isSavingAvatar ? "Guardando..." : "Cambiar foto"}
              <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
            </label>
          </div>
        </div>
        {avatarError && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{avatarError}</p>}

        {/* Créditos y estado */}
        <div data-guia="perfil-resumen" className={`grid gap-3 ${esAlumno ? "grid-cols-2" : "grid-cols-1"}`}>
          {esAlumno && (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[0.625rem] font-black uppercase tracking-widest text-foreground/60">Créditos disponibles</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black tabular-nums text-lime-700 dark:text-lime-400">{abonoData.vencimiento ? abonoData.creditos || 0 : 0}</span>
              <span className="text-xs font-bold text-foreground/55">clases</span>
            </p>
          </div>
          )}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[0.625rem] font-black uppercase tracking-widest text-foreground/60">Estado</p>
            <p className="mt-1 flex items-center gap-2">
              <span className="text-xl font-black uppercase text-foreground">{status.label}</span>
              <span className={`h-2.5 w-2.5 rounded-full ${userData.estado === "activo" ? "bg-lime-500" : userData.estado === "suspendido" ? "bg-red-500" : "bg-foreground/30"}`} aria-hidden="true" />
            </p>
          </div>
        </div>

        {/* Información personal */}
        <section data-guia="perfil-info" className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="titulo-info-personal">
          <h2 id="titulo-info-personal" className="border-b border-border px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground/60">Información personal</h2>
          <dl className="divide-y divide-border">
            {[
              { icon: CreditCard, label: "Documento", value: (isNormalUser && !isOwner) ? maskDNI(userData.dni) : (userData.dni || "—") },
              { icon: Phone, label: "Teléfono", value: (isNormalUser && !isOwner) ? maskPhone(userData.telefono) : (userData.telefono || "—") },
              { icon: Mail, label: "Correo", value: correoVisible || "—" },
              { icon: Calendar, label: "Miembro desde", value: fechaCorta(userData.fechaRegistro) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="flex shrink-0 items-center gap-2 text-sm text-foreground/65"><Icon className="h-4 w-4" aria-hidden="true" />{label}</dt>
                <dd className="min-w-0 truncate text-right text-sm font-bold text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Estado de la cuenta */}
        <section data-guia="perfil-cuenta" className="overflow-hidden rounded-2xl border border-border bg-card" aria-labelledby="titulo-estado-cuenta">
          <h2 id="titulo-estado-cuenta" className="border-b border-border px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground/60">Estado de cuenta</h2>
          <dl className="divide-y divide-border">
            {[
              { label: "Usuario", badge: status.label, style: statusBadgeStyle[userData.estado] || statusBadgeStyle.inactivo },
              { label: "Membresía", badge: membership?.label || "—", style: membershipBadgeStyle[membershipStatus] || "text-foreground/60 border border-border" },
              { label: "Perfil", badge: userData.perfil || perfilVisible, style: "text-foreground/70 border border-border" },
            ].filter((f) => esAlumno || f.label !== "Membresía").map(({ label, badge, style }) => (
              <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-sm text-foreground/65">{label}</dt>
                <dd><span className={`rounded-full px-2.5 py-0.5 text-[0.625rem] font-black uppercase tracking-widest ${style}`}>{badge}</span></dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="space-y-2.5">
          <button type="button" data-guia="perfil-clave" onClick={() => setShowChangePassword(true)}
            className={`flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-black uppercase tracking-wide text-foreground active:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background`}>
            <Lock className="h-4 w-4" aria-hidden="true" /> Cambiar contraseña
          </button>
          <button type="button" onClick={handleLogout}
            className={`flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 text-sm font-black uppercase tracking-wide text-red-700 active:bg-red-500/20 dark:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background`}>
            <LogOut className="h-4 w-4" aria-hidden="true" /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* ── ESCRITORIO ──────────────────────────────────────────────────────── */}
      <div className="hidden space-y-6 lg:block">

      {/* Título */}
      <div>
        <TituloPagina descripcion={"Tus datos, tu contraseña y el estado de tu membresía"}>Mi perfil</TituloPagina>
      </div>

      {/* Alertas de membresía */}
      {esAlumno && membershipStatus === "por_vencer" && (
        <div className="flex items-start gap-3 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-700 dark:text-yellow-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Membresía por vencer</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Vence el {abonoData.vencimiento ? new Date(abonoData.vencimiento).toLocaleDateString() : "—"}. Acercate al box para renovar.</p>
          </div>
        </div>
      )}
      {esAlumno && membershipStatus === "vencida" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-[#ff8a80]" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-[#ff8a80]">Membresía vencida</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Venció el {abonoData.vencimiento ? new Date(abonoData.vencimiento).toLocaleDateString() : "—"}. Renovate para seguir reservando.</p>
          </div>
        </div>
      )}
      {esAlumno && userData.estado === "suspendido" && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-700 dark:text-[#ff8a80]" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-red-700 dark:text-[#ff8a80]">Cuenta suspendida</p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Regularizá tu membresía para volver a reservar clases.</p>
          </div>
        </div>
      )}

      <div style={{ padding: "24px 32px 48px", width: "100%", maxWidth: "1720px", boxSizing: "border-box" }}><div style={{ display: "grid", gridTemplateColumns: "minmax(0px, 1fr) 440px", gap: "20px", alignItems: "start" }}><div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: "0px" }}><section aria-label="Tu foto y nombre" style={{ borderRadius: "16px", background: "rgb(22, 22, 22)", border: "1px solid rgb(38, 38, 38)", padding: "24px", display: "flex", alignItems: "center", gap: "22px" }}><div style={{ position: "relative", width: "96px", height: "96px", flexShrink: "0" }}><div aria-hidden="true" style={{ width: "96px", height: "96px", borderRadius: "50%", border: "3px solid rgb(155, 230, 0)", background: "url(\"about:blank\") center center / cover rgb(31, 42, 14)", display: "grid", placeItems: "center", font: "800 30px Archivo", color: "rgb(155, 230, 0)", boxSizing: "border-box" }}>{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <span>{getIniciales(nombreVisible)}</span>}</div></div><div style={{ flex: "1 1 0%", minWidth: "0px" }}><div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}><h2 style={{ margin: "0px", font: "800 26px Archivo" }} className="dch34"><span>{nombreVisible}</span></h2><span style={{ padding: "3px 9px", borderRadius: "6px", background: "rgb(22, 34, 10)", border: "1px solid rgb(61, 90, 16)", color: "rgb(155, 230, 0)", font: "700 12px Archivo" }}>{perfilVisible.charAt(0).toUpperCase() + perfilVisible.slice(1)}</span></div><div style={{ font: "500 14px Archivo", color: "rgb(163, 166, 152)", marginTop: "4px" }}>{userData.fechaRegistro ? `Miembro desde el ${new Date(userData.fechaRegistro).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}` : ""}</div><div style={{ display: "flex", gap: "8px", marginTop: "14px" }}><label style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "44px", padding: "0px 16px", borderRadius: "10px", border: "1px solid rgb(51, 51, 51)", background: "transparent", color: "rgb(236, 239, 228)", font: "700 14px Archivo", whiteSpace: "nowrap", cursor: "pointer", textDecoration: "none" }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" /></svg><span>{"Subir foto"}</span><input type="file" accept="image/*" aria-label="Subir foto" onChange={handleAvatarChange} style={{ position: "absolute", width: "1px", height: "1px", opacity: "0" }} /></label></div><div style={{ font: "500 12px Archivo", color: "rgb(163, 166, 152)", marginTop: "8px" }}>{"JPG o PNG, hasta 5 MB. Se recorta en círculo."}</div></div></section><section aria-labelledby="dp-t" style={{ borderRadius: "16px", background: "rgb(22, 22, 22)", border: "1px solid rgb(38, 38, 38)", overflow: "hidden" }}><div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 24px", borderBottom: "1px solid rgb(38, 38, 38)" }}><h2 id="dp-t" style={{ flex: "1 1 0%", margin: "0px", font: "800 17px Archivo" }} className="dch35">{"Datos personales"}</h2></div><dl style={{ margin: "0px", display: "grid", gridTemplateColumns: "repeat(2, minmax(0px, 1fr))" }}><div style={{ padding: "18px 24px", borderTop: "1px solid transparent", borderLeft: "1px solid transparent" }}><dt style={{ display: "block", font: "700 12px Archivo", letterSpacing: "0.1em", color: "rgb(163, 166, 152)" }}><span>{"DNI"}</span></dt><dd style={{ margin: "6px 0px 0px", fontStyle: "normal", fontVariant: "tabular-nums", fontSizeAdjust: "none", fontLanguageOverride: "normal", fontKerning: "auto", fontOpticalSizing: "auto", fontFeatureSettings: "normal", fontVariationSettings: "normal", fontWeight: "700", fontStretch: "normal", fontSize: "16px", lineHeight: "normal", fontFamily: "Archivo", wordBreak: "break-word" }}><span>{(isNormalUser && !isOwner) ? maskDNI(userData.dni) : (userData.dni || "—")}</span></dd></div><div style={{ padding: "18px 24px", borderTop: "1px solid transparent", borderLeft: "1px solid rgb(34, 34, 34)" }}><dt style={{ display: "block", font: "700 12px Archivo", letterSpacing: "0.1em", color: "rgb(163, 166, 152)" }}><span>{"TELÉFONO"}</span></dt><dd style={{ margin: "6px 0px 0px", fontStyle: "normal", fontVariant: "tabular-nums", fontSizeAdjust: "none", fontLanguageOverride: "normal", fontKerning: "auto", fontOpticalSizing: "auto", fontFeatureSettings: "normal", fontVariationSettings: "normal", fontWeight: "700", fontStretch: "normal", fontSize: "16px", lineHeight: "normal", fontFamily: "Archivo", wordBreak: "break-word" }}><span>{(isNormalUser && !isOwner) ? maskPhone(userData.telefono) : (userData.telefono || "—")}</span></dd></div><div style={{ padding: "18px 24px", borderTop: "1px solid rgb(34, 34, 34)", borderLeft: "1px solid transparent" }}><dt style={{ display: "block", font: "700 12px Archivo", letterSpacing: "0.1em", color: "rgb(163, 166, 152)" }}><span>{"CORREO"}</span></dt><dd style={{ margin: "6px 0px 0px", fontStyle: "normal", fontVariant: "tabular-nums", fontSizeAdjust: "none", fontLanguageOverride: "normal", fontKerning: "auto", fontOpticalSizing: "auto", fontFeatureSettings: "normal", fontVariationSettings: "normal", fontWeight: "700", fontStretch: "normal", fontSize: "16px", lineHeight: "normal", fontFamily: "Archivo", wordBreak: "break-word" }}><span>{correoVisible}</span></dd></div><div style={{ padding: "18px 24px", borderTop: "1px solid rgb(34, 34, 34)", borderLeft: "1px solid rgb(34, 34, 34)" }}><dt style={{ display: "block", font: "700 12px Archivo", letterSpacing: "0.1em", color: "rgb(163, 166, 152)" }}><span>{"NOMBRE Y APELLIDO"}</span></dt><dd style={{ margin: "6px 0px 0px", fontStyle: "normal", fontVariant: "tabular-nums", fontSizeAdjust: "none", fontLanguageOverride: "normal", fontKerning: "auto", fontOpticalSizing: "auto", fontFeatureSettings: "normal", fontVariationSettings: "normal", fontWeight: "700", fontStretch: "normal", fontSize: "16px", lineHeight: "normal", fontFamily: "Archivo", wordBreak: "break-word" }}><span>{nombreVisible}</span></dd></div></dl></section><section aria-labelledby="sg-t" style={{ borderRadius: "16px", background: "rgb(22, 22, 22)", border: "1px solid rgb(38, 38, 38)", overflow: "hidden" }}><div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 24px" }}><span style={{ width: "40px", height: "40px", flexShrink: "0", borderRadius: "10px", background: "rgb(31, 42, 14)", color: "rgb(155, 230, 0)", display: "grid", placeItems: "center" }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 7a4 4 0 1 1-3.9 4.9L3 20v-3h3v-3h3l2.1-2.1A4 4 0 0 1 15 7z" /></svg></span><div style={{ flex: "1 1 0%" }}><h2 id="sg-t" style={{ margin: "0px", font: "800 17px Archivo" }} className="dch36">{"Contraseña"}</h2><div style={{ font: "500 14px Archivo", color: "rgb(163, 166, 152)", marginTop: "2px" }}>{"Usá una que no uses en otras cuentas."}</div></div><button style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "44px", padding: "0px 16px", borderRadius: "10px", border: "1px solid rgb(51, 51, 51)", background: "transparent", color: "rgb(236, 239, 228)", font: "700 14px Archivo", whiteSpace: "nowrap", cursor: "pointer", textDecoration: "none" }} onClick={() => setShowChangePassword(true)}>{"Cambiar contraseña"}</button></div></section></div><aside style={{ display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "96px" }}>{esAlumno && <section aria-labelledby="mm-t" style={{ borderRadius: "16px", background: "rgb(22, 22, 22)", border: "1px solid rgb(38, 38, 38)", overflow: "hidden" }}><div style={{ padding: "18px 22px", borderBottom: "1px solid rgb(38, 38, 38)" }}><h2 id="mm-t" style={{ margin: "0px", font: "800 17px Archivo" }} className="dch37">{"Tu membresía como alumno"}</h2><div style={{ font: "500 13px Archivo", color: "rgb(163, 166, 152)", marginTop: "3px" }}>{"Para reservar clases desde el panel de alumno."}</div></div><div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: "16px" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}><span style={{ font: "800 17px Archivo" }}>{""}</span><span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "999px", background: "rgb(22, 34, 10)", border: "1px solid rgb(61, 90, 16)", color: "rgb(155, 230, 0)", font: "700 12px Archivo" }}><span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "rgb(155, 230, 0)" }} />{membership?.label || "—"}</span></div><div><div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}><span style={{ display: "block", font: "700 12px Archivo", letterSpacing: "0.1em", color: "rgb(163, 166, 152)" }}>{"CRÉDITOS"}</span><span><strong style={{ font: "900 34px / 1 \"Big Shoulders Stencil Display\"", color: "rgb(155, 230, 0)" }}>{abonoData.vencimiento ? abonoData.creditos || 0 : 0}</strong><span style={{ font: "600 14px Archivo", color: "rgb(163, 166, 152)" }}>{""}</span></span></div><div role="progressbar" aria-label="Créditos disponibles" aria-valuemin="0" aria-valuemax="20" aria-valuenow="17" style={{ marginTop: "8px", height: "8px", borderRadius: "4px", background: "rgb(42, 42, 42)", overflow: "hidden" }}><div style={{ width: "85%", height: "100%", background: "rgb(155, 230, 0)" }} /></div></div><div style={{ display: "flex", justifyContent: "space-between", gap: "12px", paddingTop: "14px", borderTop: "1px solid rgb(34, 34, 34)" }}><span style={{ font: "500 14px Archivo", color: "rgb(163, 166, 152)" }}>{"Vence"}</span><span style={{ font: "700 14px Archivo" }}>{abonoData.vencimiento ? new Date(abonoData.vencimiento).toLocaleDateString() : "—"}</span></div><span style={{ display: "inline-flex", alignItems: "center", justifyContent: "space-between", gap: "8px", height: "44px", padding: "0px 16px", borderRadius: "10px", border: "1px solid rgb(51, 51, 51)", background: "transparent", color: "rgb(236, 239, 228)", font: "700 14px Archivo", whiteSpace: "nowrap", cursor: "pointer", textDecoration: "none" }}>{"Ver mi membresía"}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></span></div></section>}<section aria-labelledby="cu-t" style={{ borderRadius: "16px", background: "rgb(22, 22, 22)", border: "1px solid rgb(38, 38, 38)", padding: "18px 22px", display: "flex", flexDirection: "column", gap: "12px" }}><h2 id="cu-t" style={{ margin: "0px", font: "800 17px Archivo" }} className="dch38">{"Tu cuenta"}</h2><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ font: "500 14px Archivo", color: "rgb(163, 166, 152)" }}>{"Estado"}</span><span style={{ padding: "3px 10px", borderRadius: "999px", background: "rgb(22, 34, 10)", border: "1px solid rgb(61, 90, 16)", color: "rgb(155, 230, 0)", font: "700 12px Archivo" }}>{status.label}</span></div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ font: "500 14px Archivo", color: "rgb(163, 166, 152)" }}>{"Perfil"}</span><span style={{ display: "flex", alignItems: "center", gap: "4px", minHeight: "36px", font: "700 14px Archivo", color: "rgb(155, 230, 0)", textDecoration: "none" }}>{perfilVisible}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg></span></div></section></aside></div></div>
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
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="8+ caracteres, mayúscula, minúscula y número" className="pr-10" />
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

// En escritorio, dentro del marco del alumno: diseño nuevo (PerfilEscritorio). En el resto, el de siempre.
export default function PerfilPage() {
  const escritorio = useAnchoPanel()
  const enMarcoAlumno = useContext(LayoutBxContext)
  const enPanelAdmin = useContext(LayoutAdminContext)
  if (enPanelAdmin) return escritorio ? <PerfilAdminEscritorio /> : <PerfilClasico />
  if (enMarcoAlumno) return escritorio ? <PerfilEscritorio /> : <PerfilMovilNuevo />
  return <PerfilClasico />
}
