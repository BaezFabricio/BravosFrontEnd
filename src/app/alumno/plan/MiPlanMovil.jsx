import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, AlertTriangle, ChevronRight, CreditCard, FileText, History, Loader2, Plus, ReceiptText, Zap } from "lucide-react"
import { ElegirMembresiaDialog, PagarPlanModal } from "@/components/RenovarMembresia"
import { useMiPlan, fmtFechaPlan, fmtPrecio } from "@/lib/miPlan"
import { TarjetaMembresia } from "./HistorialMembresias"
import apiClient from "@/api"
import { Cargando } from '@/components/Cargando'

/*
 * Mi membresía en el celular (debajo de lg). La versión de escritorio sigue en MiPlanPagos.jsx.
 * Dos pestañas: la membresía activa (con renovar y contratar otra) y el historial de pagos.
 */

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"

// Anillo con los créditos disponibles sobre el total
function AnilloCreditos({ disponibles, total }) {
  const r = 30
  const c = 2 * Math.PI * r
  const prop = total > 0 ? Math.min(disponibles / total, 1) : 0
  return (
    <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center" role="img" aria-label={`${disponibles} de ${total} créditos disponibles`}>
      <svg viewBox="0 0 72 72" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" className="stroke-foreground/10" />
        <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
          className="stroke-lime-500 transition-[stroke-dashoffset] duration-700 dark:stroke-lime-400"
          strokeDasharray={c} strokeDashoffset={c * (1 - prop)} />
      </svg>
      <div className="text-center leading-none" aria-hidden="true">
        <p className="text-xl font-black tabular-nums text-foreground">{disponibles}</p>
        <p className="mt-0.5 text-[10px] font-bold text-foreground/50">/ {total}</p>
      </div>
    </div>
  )
}

function TarjetaPlan({ p }) {
  const vencePronto = p.diasRestantes <= 3
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-lime-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">Plan activo</span>
        <span className="text-[11px] font-semibold text-foreground/50">N.º {p.idCredito}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Tipo de plan</p>
          <p className="mt-0.5 text-xl font-black uppercase leading-tight tracking-tight text-foreground">{p.nombrePlan}</p>
          <p className={`mt-2 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-bold ${
            vencePronto
              ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
              : "border-border text-foreground/70"
          }`}>
            {vencePronto && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
            {p.diasRestantes <= 0 ? "Vence hoy" : `Vence en ${p.diasRestantes} ${p.diasRestantes === 1 ? "día" : "días"}`}
            <span className="font-medium text-foreground/50">· {fmtFechaPlan(p.fechaVencimiento)}</span>
          </p>
        </div>
        <div className="flex flex-col items-center">
          <AnilloCreditos disponibles={p.disponibles} total={p.totalCreditos} />
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-foreground/50">Créditos</p>
        </div>
      </div>
    </div>
  )
}

function Opcion({ to, icon: Icon, titulo, sub }) {
  return (
    <Link to={to} className={`flex min-h-[60px] items-center gap-3 px-4 py-3 active:bg-foreground/5 ${FOCO}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-lime-400/15 text-lime-700 dark:text-lime-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{titulo}</span>
        <span className="block text-xs text-foreground/60">{sub}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-foreground/40" aria-hidden="true" />
    </Link>
  )
}

function HistorialPagos() {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    apiClient.get("/pagos/mi-historial")
      .then((r) => setItems(r.data?.data || []))
      .catch(() => setError(true))
  }, [])
  if (error) return <p className="py-8 text-center text-sm text-foreground/60">No pudimos cargar tu historial. Probá de nuevo en unos minutos.</p>
  if (items === null) return <Cargando filas={3} className="py-4" />
  if (items.length === 0) return <p className="py-8 text-center text-sm text-foreground/60">Todavía no compraste ninguna membresía.</p>
  return <div className="space-y-3">{items.map((m) => <TarjetaMembresia key={m.idCredito} m={m} />)}</div>
}

export default function MiPlanMovil() {
  const { data, cargando, recargar } = useMiPlan()
  const [pestana, setPestana] = useState("activa")
  const [pagando, setPagando] = useState(false)
  const [verPlanes, setVerPlanes] = useState(false)

  const planes = data?.planes || []
  const vigente = !!data?.vigente
  // Se renueva el plan que vence primero; si ya no hay vigentes, el último que pagó (igual que en escritorio)
  const planARenovar = vigente
    ? { idPlan: planes[0].idPlan, nombre: planes[0].nombrePlan, precio: planes[0].precio }
    : data?.ultimoPlan
  const puedeRenovar = (data?.porVencer || !vigente) && !!planARenovar

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-black uppercase leading-none tracking-tight text-foreground">Mi membresía</h1>
        <p className="mt-1.5 text-sm text-foreground/60">Tu membresía, tus créditos y tus renovaciones.</p>
      </div>

      {/* Pestañas */}
      <div role="tablist" aria-label="Mi membresía" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-card p-1">
        {[
          { id: "activa", label: "Membresía activa", icon: CreditCard },
          { id: "historial", label: "Historial de pagos", icon: History },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={pestana === t.id}
            onClick={() => setPestana(t.id)}
            className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-colors ${FOCO} ${
              pestana === t.id ? "bg-foreground/10 text-foreground" : "text-foreground/60"
            }`}
          >
            <t.icon className="h-4 w-4" aria-hidden="true" /> {t.label}
          </button>
        ))}
      </div>

      {pestana === "historial" ? (
        <HistorialPagos />
      ) : cargando ? (
        <Cargando filas={3} className="py-4" />
      ) : !data ? (
        <p className="rounded-xl border border-border bg-card px-4 py-4 text-sm text-foreground/60">
          No pudimos cargar la información de tu membresía. Probá recargar la página en unos minutos.
        </p>
      ) : (
        <>
          {/* Membresía */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            {vigente ? (
              <div className="space-y-4 divide-y divide-border [&>*+*]:pt-4">
                {planes.map((p) => <TarjetaPlan key={p.idCredito} p={p} />)}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700 dark:text-red-400" aria-hidden="true" />
                <div>
                  <p className="text-base font-black text-red-700 dark:text-red-400">Sin membresía vigente</p>
                  <p className="mt-0.5 text-sm text-foreground/60">
                    {data.ultimoPlan ? `Tu última membresía fue ${data.ultimoPlan.nombrePlan}.` : "Todavía no contrataste una membresía."}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-2.5 border-t border-border pt-4">
              {puedeRenovar && (
                <button
                  type="button"
                  onClick={() => setPagando(true)}
                  className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-lime-400 text-sm font-black uppercase tracking-wide text-black active:bg-lime-300 ${FOCO}`}
                >
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                  Renovar membresía{planARenovar?.precio ? ` · ${fmtPrecio(planARenovar.precio)}` : ""}
                </button>
              )}
              <button
                type="button"
                onClick={() => setVerPlanes(true)}
                aria-haspopup="dialog"
                // Si es la única acción va en verde lleno; si también está "Renovar", con borde verde
                className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-wide ${FOCO} ${
                  puedeRenovar
                    ? "border-2 border-lime-500 bg-lime-400/10 text-lime-700 active:bg-lime-400/20 dark:border-lime-400 dark:text-lime-400"
                    : "bg-lime-400 text-black shadow-lg shadow-lime-500/20 active:bg-lime-300"
                }`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Contratar otra membresía
              </button>
              {vigente && (
                <p className="flex items-start gap-1.5 pt-1 text-xs leading-snug text-foreground/60">
                  <Zap className="mt-px h-3.5 w-3.5 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />
                  Si contratás otra membresía, sus créditos se suman a los que ya tenés y vencen junto con esa nueva membresía.
                </p>
              )}
            </div>
          </div>

          <ElegirMembresiaDialog open={verPlanes} onClose={() => setVerPlanes(false)} onRenovado={recargar} />

          {/* Gestión */}
          <section className="space-y-2.5" aria-labelledby="titulo-gestion">
            <h2 id="titulo-gestion" className="text-xs font-black uppercase tracking-widest text-foreground/60">Gestión</h2>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              <Opcion to="/alumno/creditos" icon={ReceiptText} titulo="Consumo de créditos" sub="Clases reservadas y créditos usados" />
              <Opcion to="/alumno/documentacion" icon={FileText} titulo="Comprobantes" sub="Tus comprobantes de pago y documentos" />
            </div>
          </section>

          {/* Consejo de Bravo */}
          <div className="flex items-center gap-3 rounded-2xl border border-lime-500/30 bg-lime-400/10 p-3">
            <img src="/bravo_asomado.webp" alt="" className="h-14 w-14 shrink-0 object-contain" />
            <p className="text-sm leading-snug text-foreground/80">
              <span className="font-black text-lime-700 dark:text-lime-400">Consejo de Bravo: </span>
              renová antes del vencimiento y seguís reservando sin cortes.
            </p>
          </div>

          <PagarPlanModal idPlan={planARenovar?.idPlan} open={pagando} onClose={() => setPagando(false)} onRenovado={recargar} />
        </>
      )}
    </div>
  )
}
