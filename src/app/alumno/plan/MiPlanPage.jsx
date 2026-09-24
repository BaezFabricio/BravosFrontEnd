import { useState } from "react"
import MiPlanPagos from "../documentacion/MiPlanPagos"
import HistorialMembresias from "./HistorialMembresias"

export default function MiPlanPage() {
  const [verHistorial, setVerHistorial] = useState(false)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Mi Membresía</h1>
        <p className="text-sm text-foreground/50 mt-1">Tu membresía, tus créditos y tus renovaciones.</p>
      </div>

      <MiPlanPagos onVerHistorial={() => setVerHistorial(true)} />

      <HistorialMembresias open={verHistorial} onClose={() => setVerHistorial(false)} />
    </div>
  )
}
