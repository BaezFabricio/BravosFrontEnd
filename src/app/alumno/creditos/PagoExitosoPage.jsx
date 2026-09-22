import { Link } from "react-router-dom"

export default function PagoExitosoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 px-4">
      <style>{`
        @keyframes pop-in {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes draw-check {
          0%   { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
        .circle-pop { animation: pop-in 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .check-draw {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: draw-check 0.4s ease-out 0.35s both;
        }
      `}</style>

      <div className="circle-pop w-24 h-24 rounded-full bg-lime-400/10 border-2 border-lime-400 flex items-center justify-center">
        <svg viewBox="0 0 52 52" className="w-12 h-12" fill="none">
          <polyline
            className="check-draw"
            points="10,28 22,40 42,16"
            stroke="#a3e635"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Pago confirmado</h1>
        <p className="text-sm text-foreground/50 mt-2">Tu membresía fue activada. Ya podés reservar clases.</p>
      </div>

      <Link
        to="/alumno/creditos"
        className="inline-flex items-center gap-2 bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-5 py-3 hover:bg-lime-300 transition-colors"
      >
        Ver mis créditos
      </Link>
    </div>
  )
}
