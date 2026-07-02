import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Badge as BadgeIcon, Calendar, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { HelpTooltip } from '@/components/ui/help-tooltip'

export default function ProfesorPerfilPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '1234567890',
    especialidad: 'Funcional',
    experiencia: '5 años',
    certificaciones: ['CrossFit L1', 'Nutrición Deportiva'],
  })

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Cargar datos reales del usuario logueado
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("usuario") || "{}");
    setFormData(prev => ({
      ...prev,
      nombre: user.nombrecompleto || user.nombre || "",
      email: user.email || user.correo || ""
    }));
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/profesores/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Error al guardar')
      setIsEditing(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link to="/profesor" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Mi Perfil</h1>
      </div>

      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Información Personal</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Editar
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Nombre Completo</label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              disabled={!isEditing}
              className="bg-secondary"
            />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-sm font-medium text-foreground">Email</label>
              <HelpTooltip content="Tu correo de contacto para notificaciones." />
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                className="bg-secondary"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label className="text-sm font-medium text-foreground">Teléfono</label>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                disabled={!isEditing}
                className="bg-secondary"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* ... resto de tus cards de especialidades y seguridad ... */}
    </div>
  )
}