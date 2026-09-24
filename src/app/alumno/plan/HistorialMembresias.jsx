import { useEffect, useState } from "react"
import { History } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import apiClient from "@/api"
import { fmtFechaPlan, fmtPrecio } from "@/lib/miPlan"

const ESTADOS = {
  ACTIVO: { label: "Activo", cls: "border-lime-400/40 bg-lime-400/10 text-lime-700 dark:text-lime-400" },
  VENCIDO: { label: "Vencido", cls: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400" },
  CANCELADO: { label: "Cancelado", cls: "border-foreground/15 bg-foreground/5 text-foreground/50" },
}

function Dato({ etiqueta, valor, destacado = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-foreground/50">{etiqueta}</span>
      <span className={`text-right font-semibold tabular-nums ${destacado ? "text-lime-700 dark:text-lime-400" : "text-foreground"}`}>
        {valor}
      </span>
    </div>
  )
}

function TarjetaMembresia({ m }) {
  const estado = ESTADOS[m.estado] || ESTADOS.CANCELADO
  // En una membresía vencida los créditos que sobraron ya no se pueden usar
  const sinUsar = m.estado === "VENCIDO" ? m.disponibles : 0

  return (
    <div className={`space-y-3 border border-border bg-card p-4 ${m.estado === "CANCELADO" ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black uppercase tracking-tight text-foreground">{m.nombrePlan}</p>
          <p className="text-[11px] text-foreground/40">N.º {m.idCredito}</p>
        </div>
        <span className={`shrink-0 border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${estado.cls}`}>
          {estado.label}
        </span>
      </div>

      <div className="space-y-1.5 border-t border-border pt-3">
        <Dato etiqueta="Inicio" valor={fmtFechaPlan(m.fechaInicio)} />
        <Dato etiqueta="Vencimiento" valor={fmtFechaPlan(m.fechaVencimiento)} />
        <Dato etiqueta="Créditos" valor={m.totalCreditos} />
        <Dato etiqueta="Usados" valor={m.utilizados} />
        {m.estado === "ACTIVO" && <Dato etiqueta="Disponibles" valor={m.disponibles} destacado />}
        {sinUsar > 0 && <Dato etiqueta="Sin usar (vencieron)" valor={sinUsar} />}
        {m.importe != null && (
          <Dato etiqueta="Pagado" valor={`${fmtPrecio(m.importe)}${m.formaPago ? ` · ${m.formaPago}` : ""}`} />
        )}
      </div>
    </div>
  )
}

/**
 * Ventana con el historial de todas las membresías que compró el alumno (activas,
 * vencidas y canceladas). La lista se pide cada vez que se abre, así siempre está al día.
 */
export default function HistorialMembresias({ open, onClose }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return
    setItems(null)
    setError(false)
    apiClient
      .get("/pagos/mi-historial")
      .then((r) => setItems(r.data?.data || []))
      .catch(() => setError(true))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black uppercase tracking-tight">
            <History className="h-5 w-5 text-foreground/50" />
            Historial de membresías
          </DialogTitle>
          <DialogDescription>
            Todas las membresías que compraste, de la más nueva a la más vieja.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="py-6 text-center text-sm text-foreground/50">
            No pudimos cargar tu historial. Probá de nuevo en unos minutos.
          </p>
        ) : items === null ? (
          <p className="animate-pulse py-10 text-center text-sm text-foreground/40">Cargando historial...</p>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-foreground/50">Todavía no compraste ninguna membresía.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {items.map((m) => <TarjetaMembresia key={m.idCredito} m={m} />)}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
