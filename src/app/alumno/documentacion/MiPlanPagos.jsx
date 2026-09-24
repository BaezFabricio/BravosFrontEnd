import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import { CreditCard, Plus, AlertCircle, CalendarClock } from "lucide-react"
import { Button } from "@/components/ui/button"
import RenovarMembresia, { PagarPlanModal } from "@/components/RenovarMembresia"
import { useMiPlan, fmtFechaPlan, fmtPrecio } from "@/lib/miPlan"

/**
 * Sección "Mi membresía y pagos" de la pantalla de documentación:
 * muestra el/los plan(es) vigentes, permite pagar el mes cuando está por vencer
 * (o ya venció) y contratar otro plan, cuyos créditos se suman a los actuales.
 */
export default function MiPlanPagos() {
  const { data, cargando, recargar } = useMiPlan()
  const [pagando, setPagando] = useState(false)
  const [verPlanes, setVerPlanes] = useState(false)
  const { hash } = useLocation()

  // Llegando con #pagos en la URL: bajar hasta esta sección
  // recién cuando cargó, porque antes no existe en pantalla.
  useEffect(() => {
    if (cargando || hash !== "#pagos") return
    document.getElementById("pagos")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [cargando, hash])

  if (cargando) return null
  if (!data) {
    return (
      <div id="pagos" className="border border-border bg-card px-5 py-4 text-sm text-foreground/50">
        No pudimos cargar la información de tu membresía. Probá recargar la página en unos minutos.
      </div>
    )
  }

  const { planes, vigente, porVencer, ultimoPlan, totalDisponibles, totalCreditos } = data
  // Se renueva el plan que vence primero; si ya no hay vigentes, el último que pagó.
  const planARenovar = vigente
    ? { idPlan: planes[0].idPlan, nombre: planes[0].nombrePlan, precio: planes[0].precio }
    : ultimoPlan
  const puedePagarMes = (porVencer || !vigente) && !!planARenovar

  return (
    <div id="pagos" className="scroll-mt-20 space-y-4">
      <div className="border border-border bg-card">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Mi membresía y pagos</p>
          {vigente && (
            <span className="text-[10px] font-bold text-foreground/40">
              {totalDisponibles} de {totalCreditos} créditos disponibles
            </span>
          )}
        </div>

        {vigente ? (
          <div className="divide-y divide-border">
            {planes.map((p) => (
              <div key={p.idCredito} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-black uppercase tracking-tight text-foreground">{p.nombrePlan}</p>
                  <p className="text-xs text-foreground/50 mt-0.5 flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Vence el {fmtFechaPlan(p.fechaVencimiento)}
                    {p.diasRestantes <= 7 && (
                      <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-yellow-700 dark:text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-px">
                        {p.diasRestantes === 0 ? "Vence hoy" : `Vence en ${p.diasRestantes} ${p.diasRestantes === 1 ? "día" : "días"}`}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-black text-lime-700 dark:text-lime-400 tabular-nums">
                    {p.disponibles}<span className="text-sm text-foreground/40"> / {p.totalCreditos}</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">créditos</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Sin membresía vigente</p>
              <p className="text-xs text-foreground/50 mt-0.5">
                {ultimoPlan ? `Tu última membresía fue ${ultimoPlan.nombrePlan}.` : "Todavía no contrataste una membresía."}
              </p>
            </div>
          </div>
        )}

        <div className="px-5 py-4 border-t border-border flex flex-wrap gap-3">
          {puedePagarMes && (
            <Button onClick={() => setPagando(true)}
              className="bg-lime-400 hover:bg-lime-300 text-black font-black uppercase tracking-wide">
              <CreditCard className="h-4 w-4 mr-2" />
              Renovar membresía{planARenovar?.precio ? ` · ${fmtPrecio(planARenovar.precio)}` : ""}
            </Button>
          )}
          <Button variant="outline" onClick={() => setVerPlanes((v) => !v)}
            className="font-bold uppercase tracking-wide">
            <Plus className="h-4 w-4 mr-2" />
            {verPlanes ? "Ocultar membresías" : "Contratar otra membresía"}
          </Button>
        </div>
        {vigente && (
          <p className="px-5 pb-4 text-[11px] text-foreground/40 -mt-1">
            Si contratás otra membresía, sus créditos se suman a los que ya tenés y vencen junto con esa membresía.
          </p>
        )}
      </div>

      {verPlanes && (
        <div className="border border-border bg-card p-4 sm:p-6">
          <RenovarMembresia onRenovado={recargar} />
        </div>
      )}

      <PagarPlanModal
        idPlan={planARenovar?.idPlan}
        open={pagando}
        onClose={() => setPagando(false)}
        onRenovado={recargar}
      />
    </div>
  )
}
