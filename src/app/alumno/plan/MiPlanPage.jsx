import { useState } from "react"
import MiPlanPagos from "../documentacion/MiPlanPagos"
import HistorialMembresias from "./HistorialMembresias"
import MiPlanMovil from "./MiPlanMovil"

export default function MiPlanPage() {
  const [verHistorial, setVerHistorial] = useState(false)

  return (
    <>
      {/* CELULAR: diseño propio (MiPlanMovil.jsx) */}
      <div className="lg:hidden">
        <MiPlanMovil />
      </div>

      {/* ESCRITORIO */}
      <div className="hidden space-y-6 lg:block">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Mi Membresía</h1>
          <p className="text-sm text-foreground/50 mt-1">Tu membresía, tus créditos y tus renovaciones.</p>
        </div>

        <MiPlanPagos onVerHistorial={() => setVerHistorial(true)} />

        <HistorialMembresias open={verHistorial} onClose={() => setVerHistorial(false)} />
      </div>
    </>
  )
}
