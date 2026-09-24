import { useNavigate } from "react-router-dom"
import { LayoutDashboard, Dumbbell, GraduationCap } from "lucide-react"
import { panelesPermitidos } from "@/lib/paneles"

const PANELES = [
  { key: "admin", label: "Administrador", descripcion: "Gestión del gimnasio", icon: LayoutDashboard, href: "/admin" },
  { key: "alumno", label: "Alumno", descripcion: "Tu panel de clases y abonos", icon: Dumbbell, href: "/alumno" },
  { key: "profesor", label: "Profesor", descripcion: "Tus rutinas y clases", icon: GraduationCap, href: "/profesor" },
]

export default function SeleccionarPanelPage() {
  const navigate = useNavigate()
  const permitidos = panelesPermitidos()
  const usuario = (() => {
    try { return JSON.parse(localStorage.getItem("usuario") || "{}") } catch { return {} }
  })()

  const disponibles = PANELES.filter(p => permitidos[p.key])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <img src="/logo.jpg" alt="Bravos" className="w-12 h-12 rounded-lg mx-auto mb-3" />
          <h1 className="text-xl font-black tracking-widest uppercase text-foreground">BRAVOS</h1>
          <p className="text-sm text-muted-foreground">
            Hola, <span className="text-foreground font-medium">{usuario.nombrecompleto || "usuario"}</span>. ¿A qué módulo querés ingresar?
          </p>
        </div>

        <div className="space-y-3">
          {disponibles.map((panel) => (
            <button
              key={panel.key}
              onClick={() => navigate(panel.href, { replace: true })}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-lg border border-border bg-card hover:border-lime-400/50 hover:bg-lime-400/5 transition-all text-left group"
            >
              <div className="h-10 w-10 rounded-lg bg-lime-400/10 flex items-center justify-center shrink-0 group-hover:bg-lime-400/20 transition-colors">
                <panel.icon className="h-5 w-5 text-lime-700 dark:text-lime-400" />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{panel.label}</p>
                <p className="text-xs text-muted-foreground">{panel.descripcion}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
