import { Link } from "react-router-dom"

export default function PagoPendientePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 px-4">
      <style>{`
        @keyframes pop-in-pend {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes spin-clock {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .circle-pop-pend { animation: pop-in-pend 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .clock-hand { transform-origin: 50% 50%; animation: spin-clock 2s linear infinite; }
      `}</style>

      <div className="circle-pop-pend w-24 h-24 rounded-full bg-yellow-500/10 border-2 border-yellow-500 flex items-center justify-center">
        <svg viewBox="0 0 52 52" className="w-12 h-12" fill="none">
          <circle cx="26" cy="26" r="18" stroke="#eab308" strokeWidth="3"/>
          <line className="clock-hand" x1="26" y1="26" x2="26" y2="13" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="26" y1="26" x2="34" y2="30" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Pago pendiente</h1>
        <p className="text-sm text-foreground/50 mt-2 max-w-xs">
          Tu pago está siendo procesado. Te avisaremos cuando se confirme y tu membresía quede activa.
        </p>
      </div>

      <Link
        to="/alumno/creditos"
        className="inline-flex items-center gap-2 border border-border text-foreground font-black uppercase tracking-widest text-xs px-5 py-3 hover:border-foreground/40 transition-colors"
      >
        Volver a mis créditos
      </Link>
    </div>
  )
}
