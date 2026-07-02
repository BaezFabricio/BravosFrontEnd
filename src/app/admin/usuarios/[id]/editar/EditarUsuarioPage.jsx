import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { actualizarUsuario, getUsuarioById, normalizarUsuario } from "@/api"

const emptyForm = {
  nombre: "",
  dni: "",
  email: "",
  telefono: "",
  idPerfil: "", 
  estado: "activo",
}

export default function EditarUsuarioPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [perfilesBD, setPerfilesBD] = useState([])

  useEffect(() => {
    const cargarTodo = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("token")

        // 1. Traemos los perfiles para el desplegable
        const resPerfiles = await fetch("http://localhost:3001/api/vv1/perfiles", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        const datosPerfiles = await resPerfiles.json()
        if (datosPerfiles.success && Array.isArray(datosPerfiles.data)) {
          setPerfilesBD(datosPerfiles.data)
        }

        // 2. Traemos los datos del usuario por ID
        const usuarioReal = await getUsuarioById(id)
        console.log("Datos del backend en edición:", usuarioReal)

        const idPerfilDetectado = usuarioReal.idPerfil || usuarioReal.id_perfil || usuarioReal.perfil || usuarioReal.rol || usuarioReal.tipo || "";

        // 3. RELLENADO DE INPUTS CORRECTO
        setFormData({
          nombre: usuarioReal.nombre || usuarioReal.nombrecompleto || usuarioReal.fullName || "",
          dni: usuarioReal.dni || usuarioReal.documento || "",
          email: usuarioReal.email || usuarioReal.correo || usuarioReal.username || "",
          telefono: usuarioReal.telefono || usuarioReal.celular || usuarioReal.phone || "",
          idPerfil: String(idPerfilDetectado), 
          estado: usuarioReal.estado || "activo",
        })

      } catch (error) {
        console.error("Error al cargar datos en edición:", error)
        setErrors({ general: "No se pudo cargar la información del usuario." })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      cargarTodo()
    }
  }, [id])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre?.trim()) newErrors.nombre = "El nombre es requerido"
    if (!formData.dni?.trim()) newErrors.dni = "El DNI es requerido"
    if (!formData.email?.trim()) newErrors.email = "El email es requerido"
    if (!formData.telefono?.trim()) newErrors.telefono = "El teléfono es requerido"
    if (!formData.idPerfil) newErrors.idPerfil = "El perfil es requerido"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!validateForm()) {
      console.log("🛑 El formulario local no es válido:", formData)
      return
    }

    setIsSaving(true)

    // 🟢 ADAPTACIÓN MÁGICA: Mandamos las variables como las pide tu 'validateUpdateUser'
    const payload = {
      nombre: formData.nombre.trim(),
      dni: formData.dni.trim(),
      email: formData.email.trim().toLowerCase(),
      telefono: formData.telefono.trim(),
      username: formData.email.trim().toLowerCase(), 
      idPerfil: formData.idPerfil ? parseInt(formData.idPerfil) : null, 
      estado: formData.estado,
    }

    try {
      const token = localStorage.getItem("token")
      
      const response = await fetch(`http://localhost:3001/api/vv1/usuarios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const resultado = await response.json()
      console.log("Respuesta del servidor al actualizar:", resultado)

      if (!response.ok) {
        throw new Error(resultado.message || "Error al actualizar en el servidor")
      }

      // Si todo sale bien, volvemos triunfantes a la lista
      window.location.href = "/admin/usuarios"

    } catch (error) {
      console.error("💥 ERROR CRÍTICO EN EL SUBMIT:", error)
      setErrors({ general: error.message || "Error al guardar los cambios. Intenta de nuevo." })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Cargando usuario y roles...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button 
          type="button" 
          onClick={() => navigate("/admin/usuarios")} 
          className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Usuario</h1>
          <p className="text-sm text-muted-foreground">Modifica los datos y el perfil asignado</p>
        </div>
      </div>

      {errors.general && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Datos del Usuario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Fila 1: Nombre y DNI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo *</Label>
                <Input
                  id="nombre"
                  className="bg-secondary border-border focus-visible:ring-primary"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                />
                {errors.nombre && <p className="text-destructive text-xs">{errors.nombre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dni">DNI *</Label>
                {/* 🟢 CORREGIDO: Antes apuntaba por error a formData.email */}
                <Input
                  id="dni"
                  className="bg-secondary border-border focus-visible:ring-primary"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })} 
                />
                {errors.dni && <p className="text-destructive text-xs">{errors.dni}</p>}
              </div>
            </div>

            {/* Fila 2: Correo y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  type="email"
                  className="bg-secondary border-border focus-visible:ring-primary"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  className="bg-secondary border-border focus-visible:ring-primary"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
                {errors.telefono && <p className="text-destructive text-xs">{errors.telefono}</p>}
              </div>
            </div>

            {/* Fila 3: Perfil y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idPerfil">Perfil *</Label>
                <select
                  id="idPerfil"
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                  value={formData.idPerfil}
                  onChange={(e) => setFormData({ ...formData, idPerfil: e.target.value })}
                >
                  <option value="">Selecciona un perfil</option>
                  {perfilesBD && perfilesBD.map((p) => (
                    <option key={p.idPerfil} value={String(p.idPerfil)}>
                      {p.nombrePerfil || p.nombre}
                    </option>
                  ))}
                </select>
                {errors.idPerfil && <p className="text-destructive text-xs">{errors.idPerfil}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <select
                  id="estado"
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                >
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
                {errors.estado && <p className="text-destructive text-xs">{errors.estado}</p>}
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Botonera inferior */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate("/admin/usuarios")}
            disabled={isSaving}
            className="border-border bg-background hover:bg-accent text-foreground"
          >
            Cancelar
          </Button>
          
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </div>
  )
}