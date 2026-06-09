import { useState } from "react"
import { CreditCard, Search, Filter, AlertTriangle, CheckCircle2, Clock, Download, MoreHorizontal, UserCheck, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const membresias = [
  { id: "1", usuario: "María García", email: "maria@email.com", plan: "Plan Mensual", estado: "vigente", fechaInicio: "01/03/2024", fechaVencimiento: "31/03/2024", diasRestantes: 21, monto: 15000 },
  { id: "2", usuario: "Juan Pérez", email: "juan@email.com", plan: "Plan Mensual", estado: "vigente", fechaInicio: "05/03/2024", fechaVencimiento: "04/04/2024", diasRestantes: 25, monto: 15000 },
  { id: "3", usuario: "Carlos López", email: "carlos@email.com", plan: "Plan Mensual", estado: "vencida", fechaInicio: "01/02/2024", fechaVencimiento: "28/02/2024", diasRestantes: -10, monto: 15000 },
  { id: "4", usuario: "Ana Martínez", email: "ana@email.com", plan: "Plan Mensual", estado: "por_vencer", fechaInicio: "15/02/2024", fechaVencimiento: "14/03/2024", diasRestantes: 4, monto: 15000 },
  { id: "5", usuario: "Laura Fernández", email: "laura@email.com", plan: "Plan Trimestral", estado: "vencida", fechaInicio: "01/12/2023", fechaVencimiento: "28/02/2024", diasRestantes: -10, monto: 40000 },
  { id: "6", usuario: "Roberto Díaz", email: "roberto@email.com", plan: "Plan Mensual", estado: "vencida", fechaInicio: "01/02/2024", fechaVencimiento: "28/02/2024", diasRestantes: -10, monto: 15000 },
  { id: "7", usuario: "Sofía Torres", email: "sofia@email.com", plan: "Plan Anual", estado: "vigente", fechaInicio: "01/01/2024", fechaVencimiento: "31/12/2024", diasRestantes: 296, monto: 120000 },
  { id: "8", usuario: "Diego Ruiz", email: "diego@email.com", plan: "Plan Mensual", estado: "por_vencer", fechaInicio: "10/02/2024", fechaVencimiento: "09/03/2024", diasRestantes: -1, monto: 15000 },
]

const estadoConfig = {
  vigente: { label: "Vigente", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  por_vencer: { label: "Por Vencer", className: "bg-green-500/10 text-green-500 border-green-500/20", icon: Clock },
  vencida: { label: "Vencida", className: "bg-red-500/10 text-red-500 border-red-500/20", icon: AlertTriangle },
}

export default function MembresiasPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const stats = {
    vigentes: membresias.filter((m) => m.estado === "vigente").length,
    porVencer: membresias.filter((m) => m.estado === "por_vencer").length,
    vencidas: membresias.filter((m) => m.estado === "vencida").length,
  }

  const filteredMembresias = membresias.filter((m) => {
    const matchesSearch =
      m.usuario.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || m.estado === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Membresías y Pagos</h1>
          <p className="text-muted-foreground">Gestiona el estado de las membresías</p>
        </div>
        <Button variant="outline" className="border-border">
          <Download className="mr-2 h-4 w-4" />
          Exportar Reporte
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vigentes</p>
                <p className="text-2xl font-bold text-green-500">{stats.vigentes}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Vencer</p>
                <p className="text-2xl font-bold text-green-500">{stats.porVencer}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidas</p>
                <p className="text-2xl font-bold text-red-500">{stats.vencidas}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o email..."
                className="pl-9 bg-secondary border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-secondary border-border">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="vigente">Vigentes</SelectItem>
                <SelectItem value="por_vencer">Por Vencer</SelectItem>
                <SelectItem value="vencida">Vencidas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Membresías ({filteredMembresias.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Usuario</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Plan</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Vencimiento</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Días Rest.</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembresias.map((membresia) => {
                  const config = estadoConfig[membresia.estado]
                  const Icon = config.icon
                  return (
                    <tr key={membresia.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-foreground">{membresia.usuario}</p>
                          <p className="text-sm text-muted-foreground">{membresia.email}</p>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-foreground">{membresia.plan}</span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={config.className}>
                          <Icon className="mr-1 h-3 w-3" />
                          {config.label}
                        </Badge>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-foreground">{membresia.fechaVencimiento}</span>
                      </td>
                      <td className="p-4 hidden sm:table-cell">
                        <span
                          className={`font-medium ${
                            membresia.diasRestantes < 0
                              ? "text-red-500"
                              : membresia.diasRestantes <= 5
                              ? "text-green-500"
                              : "text-foreground"
                          }`}
                        >
                          {membresia.diasRestantes < 0 ? membresia.diasRestantes : `+${membresia.diasRestantes}`}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Registrar Pago
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Renovar Membresía
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar Recordatorio
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
