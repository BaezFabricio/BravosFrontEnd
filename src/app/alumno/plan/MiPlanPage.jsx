import { TituloPagina } from "@/components/TituloPagina"
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
        <TituloPagina descripcion={"Tu membresía, tus créditos y tus renovaciones."}>Mi Membresía</TituloPagina>

        <MiPlanPagos onVerHistorial={() => setVerHistorial(true)} />

        <HistorialMembresias open={verHistorial} onClose={() => setVerHistorial(false)} />
      </div>
    </>
  )
}
