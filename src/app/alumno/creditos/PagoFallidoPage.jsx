import { Link } from "react-router-dom"

export default function PagoFallidoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6 px-4">
      <style>{`
        @keyframes pop-in-err {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes draw-x-1 {
          0%   { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes draw-x-2 {
          0%   { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        .circle-pop-err { animation: pop-in-err 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .x-line-1 {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: draw-x-1 0.3s ease-out 0.35s both;
        }
        .x-line-2 {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: draw-x-2 0.3s ease-out 0.55s both;
        }
      `}</style>

      <div className="circle-pop-err w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-600 dark:border-red-500 flex items-center justify-center">
        <svg viewBox="0 0 52 52" className="w-12 h-12" fill="none">
          <line className="x-line-1" x1="14" y1="14" x2="38" y2="38" stroke="#f87171" strokeWidth="4.5" strokeLinecap="round"/>
          <line className="x-line-2" x1="38" y1="14" x2="14" y2="38" stroke="#f87171" strokeWidth="4.5" strokeLinecap="round"/>
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">Pago fallido</h1>
        <p className="text-sm text-foreground/50 mt-2 max-w-xs">
          No se pudo procesar el pago. Podés intentarlo nuevamente o usar otro método.
        </p>
      </div>

      <Link
        to="/alumno/creditos"
        className="inline-flex items-center gap-2 bg-lime-400 text-black font-black uppercase tracking-widest text-xs px-5 py-3 hover:bg-lime-300 transition-colors"
      >
        Intentar de nuevo
      </Link>
    </div>
  )
}
