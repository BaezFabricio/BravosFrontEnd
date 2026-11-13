import { useContext, useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { AlertTriangle, Calendar, Camera, CreditCard, Eye, EyeOff, KeyRound, Lock, LogOut, Mail, Phone } from "lucide-react"
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
import { LayoutBxContext } from "@/lib/layoutBx"
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
        <TituloPagina descripcion={esAlumno ? "Información personal y estado de membresía" : "Información personal y estado de cuenta"}>Mi Perfil</TituloPagina>
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

      <div className="grid grid-cols-[minmax(0,1fr)_440px] items-start gap-6">

        {/* Columna izquierda: identidad, datos personales y contraseña */}
        <div className="flex flex-col gap-6">

          {/* Identidad */}
          <section aria-label="Identidad" className="flex items-center gap-6 rounded-2xl border border-border bg-card p-6">
            <FotoAmpliable src={avatarUrl} alt={nombreVisible} className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-lime-400 bg-lime-400/15 text-[28px] font-black text-lime-700 dark:bg-[#1f2a0e] dark:text-lime-400">
              {getIniciales(nombreVisible)}
            </FotoAmpliable>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[28px] font-extrabold leading-tight text-foreground">{nombreVisible}</h2>
                <span className="inline-flex items-center rounded-md border border-lime-600/40 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-lime-700 dark:border-lime-400/50 dark:text-lime-400">{perfilVisible}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{correoVisible}</p>
              <label className="mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-[10px] border border-border px-4 text-[13px] font-bold text-foreground transition-colors hover:bg-[rgba(128,128,128,.14)] focus-within:ring-2 focus-within:ring-ring">
                <Camera className="h-4 w-4" aria-hidden="true" />
                {isSavingAvatar ? "Guardando..." : "Subir foto"}
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              </label>
              <p className="mt-2 text-xs text-muted-foreground">JPG o PNG, hasta 5 MB. Se recorta en círculo.</p>
            </div>
          </section>
          {avatarError && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-[#ff8a80]">{avatarError}</p>
          )}

          {/* Datos personales */}
          <section aria-label="Datos personales" className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-6 py-5">
              <h2 className="text-[17px] font-extrabold text-foreground">Datos personales</h2>
            </div>
            <dl className="grid grid-cols-2">
              {[
                { label: "DNI", value: (isNormalUser && !isOwner) ? maskDNI(userData.dni) : (userData.dni || "—") },
                { label: "Teléfono", value: (isNormalUser && !isOwner) ? maskPhone(userData.telefono) : (userData.telefono || "—") },
                { label: "Correo", value: correoVisible },
                { label: "Nombre y apellido", value: nombreVisible },
              ].map(({ label, value }, i) => (
                <div key={label} className={`px-6 py-4 ${i % 2 ? "border-l border-border" : ""} ${i >= 2 ? "border-t border-border" : ""}`}>
                  <dt className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-[16px] font-bold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Contraseña */}
          <section aria-label="Contraseña" className="flex items-center gap-4 rounded-2xl border border-border bg-card px-6 py-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-lime-400/15 text-lime-700 dark:bg-[#1f2a0e] dark:text-lime-400" aria-hidden="true">
              <KeyRound className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-extrabold text-foreground">Contraseña</p>
              <p className="text-sm text-muted-foreground">Usá una que no uses en otras cuentas.</p>
            </div>
            <button onClick={() => setShowChangePassword(true)}
              className="inline-flex h-11 items-center rounded-[10px] border border-border px-5 text-[14px] font-bold text-foreground transition-colors hover:bg-[rgba(128,128,128,.14)]">
              Cambiar contraseña
            </button>
          </section>
        </div>

        {/* Columna derecha: membresía (solo alumnos) y cuenta */}
        <div className="flex flex-col gap-6">
          {esAlumno && (
            <section aria-label="Membresía" className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border px-6 py-5">
                <h2 className="text-[17px] font-extrabold text-foreground">Tu membresía como alumno</h2>
                <p className="mt-1 text-sm text-muted-foreground">Para reservar clases desde el panel de alumno.</p>
              </div>
              <div className="divide-y divide-border">
                <div className="flex items-center justify-between px-6 py-4">
                  <p className="text-[15px] font-bold text-foreground">Estado</p>
                  <span className="inline-flex items-center rounded-md border border-lime-600/40 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-lime-700 dark:text-lime-400">{membership?.label || "—"}</span>
                </div>
                {abonoData.vencimiento && (
                  <div className="flex items-center justify-between px-6 py-4">
                    <p className="text-sm text-muted-foreground">Vence</p>
                    <p className="text-sm font-bold text-foreground">{new Date(abonoData.vencimiento).toLocaleDateString()}</p>
                  </div>
                )}
                <div className="flex items-center justify-between px-6 py-4">
                  <p className="text-sm text-muted-foreground">Créditos</p>
                  <p className="text-[40px] font-black leading-none tabular-nums text-lime-700 dark:text-lime-400" style={{ fontFamily: "'Big Shoulders Stencil Display', Archivo, sans-serif" }}>{abonoData.creditos || 0}</p>
                </div>
              </div>
            </section>
          )}

          <section aria-label="Tu cuenta" className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-6 py-5">
              <h2 className="text-[17px] font-extrabold text-foreground">Tu cuenta</h2>
            </div>
            <div className="divide-y divide-border">
              <div className="flex items-center justify-between px-6 py-4">
                <p className="text-sm text-muted-foreground">Estado</p>
                <span className="inline-flex items-center rounded-md border border-lime-600/40 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-lime-700 dark:text-lime-400">{status.label}</span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <p className="text-sm text-muted-foreground">Perfil</p>
                <p className="text-sm font-bold text-lime-700 dark:text-lime-400">{userData.perfil || "Alumno"}</p>
              </div>
            </div>
          </section>
        </div>
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
  if (enMarcoAlumno) return escritorio ? <PerfilEscritorio /> : <PerfilMovilNuevo />
  return <PerfilClasico />
}
