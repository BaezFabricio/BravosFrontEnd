import { ShieldAlert, Check, MessageCircle, ArrowDown } from "lucide-react"
import { useMiPlan } from "@/lib/miPlan"
import { useDatosPago, numeroWhatsapp } from "@/components/RenovarMembresia"

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

// "2026-11-10" → "10 nov" (sin Date para no correr el día por zona horaria)
function diaMes(ymd) {
  if (!ymd) return null
  const [, m, d] = String(ymd).slice(0, 10).split("-").map(Number)
  return `${d} ${MESES[m - 1]}`
}

// Referencia 03/04 "Sin membresía": la tarjeta oscura que reemplaza el aviso rojo.
// Escritorio: dos columnas con botones y el panel "Mientras tanto". Celular: solo el aviso con la fecha.
export default function SinMembresiaHero() {
  const { data: miPlan } = useMiPlan()
  const { configBanco } = useDatosPago()
  const venc = diaMes(miPlan?.ultimoVencimiento)
  const wa = numeroWhatsapp(configBanco?.whatsapp)

  return (
    <section aria-labelledby="t-sin-membresia" className="relative overflow-hidden rounded-[20px] border border-[#5a2622] bg-[#0e0e0e] p-5 text-[#ecefe4] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] lg:items-center lg:gap-10 lg:p-8">
      <img src="/logo.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute left-[45%] top-1/2 w-[760px] max-w-none -translate-y-1/2 -rotate-6 opacity-[0.05] grayscale brightness-[1.4]" />

      <div className="relative flex min-w-0 flex-col gap-2.5 lg:gap-2.5">
        <span role="status" className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#6b2a24] bg-[#2a1210] px-2.5 py-1 text-[0.6875rem] font-bold tracking-[0.06em] text-[#ff8a80]">
          <ShieldAlert className="h-[0.8125rem] w-[0.8125rem]" aria-hidden="true" />
          SIN MEMBRESÍA VIGENTE
        </span>
        <h2 id="t-sin-membresia" className="text-[1.875rem] font-black uppercase leading-none tracking-tight lg:text-[2.75rem]">
          <span className="lg:hidden">{venc ? `Venció el ${venc}` : "Tu membresía venció"}</span>
          <span className="hidden lg:inline">{venc ? `Tu membresía venció el ${venc}` : "Tu membresía venció"}</span>
        </h2>
        <p className="text-sm leading-relaxed text-[#b9bcae] lg:max-w-[520px] lg:text-[0.9375rem]">
          <span className="lg:hidden">Para reservar clases necesitás un plan activo. Tus RM, tu historial y tus documentos siguen disponibles.</span>
          <span className="hidden lg:inline">Para reservar clases necesitás un plan activo. Elegilo abajo y lo activamos apenas se acredita el pago.</span>
        </p>
        <div className="mt-2 hidden flex-wrap gap-2.5 lg:flex">
          <a href="#planes" className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-lg bg-lime-400 px-5 text-[0.9375rem] font-bold text-black transition-colors hover:bg-lime-300">
            Elegir plan <ArrowDown className="h-4 w-4" aria-hidden="true" />
          </a>
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-lg border border-[#4a4d42] px-[1.125rem] text-[0.9375rem] font-bold text-[#ecefe4] transition-colors hover:border-lime-400 hover:text-lime-400">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Hablar con el box
            </a>
          )}
        </div>
      </div>

      <div className="relative mt-5 hidden flex-col gap-3 rounded-[14px] border border-[#262626] bg-[#1a1a1a] p-5 lg:mt-0 lg:flex">
        <span className="text-xs font-semibold tracking-[0.1em] text-[#a3a698]">MIENTRAS TANTO, SEGUÍS TENIENDO</span>
        <ul className="flex flex-col gap-2.5 text-[0.9375rem] font-medium">
          {["Tus RM y tu progreso", "El historial de clases y pagos", "Tus documentos y comprobantes"].map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <Check className="h-4 w-4 shrink-0 text-lime-400" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>
        <div className="border-t border-[#262626] pt-3 text-[0.8125rem] font-medium text-[#a3a698]">Reservar clases se habilita cuando activás un plan.</div>
      </div>
    </section>
  )
}
