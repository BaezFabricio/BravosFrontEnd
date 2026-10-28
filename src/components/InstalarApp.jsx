import { useState } from "react"
import { Smartphone, Share, SquarePlus, MoreVertical, Download, Check } from "lucide-react"

/*
 * Guía para instalar Bravos en el celular (PWA): pasos para iPhone (Safari) y Android (Chrome).
 * Muestra primero los pasos del aparato que se está usando y deja los del otro a un toque.
 * Si la app ya está abierta como instalada, lo avisa. La instalación es lo que permite recibir avisos con la app cerrada.
 */
const esIphone = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
const instalada = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true

const PASOS = {
  iphone: {
    titulo: "iPhone",
    navegador: "Tiene que ser Safari (no Chrome ni otro navegador).",
    pasos: [
      { icono: Share, texto: "Tocá el botón Compartir, el cuadrado con una flecha hacia arriba (abajo en el centro)." },
      { icono: SquarePlus, texto: "Bajá en el menú y elegí “Agregar a pantalla de inicio”." },
      { icono: Check, texto: "Tocá “Agregar”. Abrí Bravos desde el ícono nuevo, no desde Safari." },
    ],
  },
  android: {
    titulo: "Android",
    navegador: "Tiene que ser Chrome.",
    pasos: [
      { icono: MoreVertical, texto: "Tocá los tres puntitos de arriba a la derecha." },
      { icono: Download, texto: "Elegí “Instalar app” (o “Agregar a la pantalla principal”)." },
      { icono: Check, texto: "Confirmá. Abrí Bravos desde el ícono nuevo de tu pantalla de inicio." },
    ],
  },
}

function Pasos({ datos }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-bold text-foreground/70">{datos.navegador}</p>
      <ol className="space-y-2.5">
        {datos.pasos.map((p, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime-400/15 text-lime-700 dark:text-lime-400">
              <p.icono className="h-4 w-4" aria-hidden="true" />
            </span>
            <p className="pt-1 text-sm leading-snug text-foreground/80"><span className="font-black text-foreground">{i + 1}. </span>{p.texto}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function InstalarApp() {
  const [iphone] = useState(esIphone)
  const [yaInstalada] = useState(instalada)
  // Se elige el aparato con los botones de arriba; arranca en el que se está usando
  const [elegido, setElegido] = useState(iphone ? "iphone" : "android")

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-black"><Smartphone className="h-5 w-5" aria-hidden="true" /></span>
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-foreground">{yaInstalada ? "Ya tenés la app instalada" : "Instalá Bravos en tu celular"}</p>
          <p className="mt-0.5 text-xs leading-snug text-foreground/60">
            {yaInstalada
              ? "Si cambiás de celular, repetí estos pasos en el nuevo."
              : "Se abre como una app, sin barra del navegador, y es la forma de recibir los avisos aunque la tengas cerrada."}
          </p>
        </div>
      </div>

      {!yaInstalada && (
        <div className="space-y-3">
          <div role="tablist" aria-label="Tu celular" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-background/50 p-1">
            {Object.entries(PASOS).map(([clave, d]) => (
              <button key={clave} type="button" role="tab" aria-selected={elegido === clave} onClick={() => setElegido(clave)}
                className={`min-h-[40px] rounded-lg text-sm font-black uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
                  elegido === clave ? "bg-lime-400 text-black" : "text-foreground/60 hover:text-foreground"
                }`}>
                {d.titulo}
              </button>
            ))}
          </div>
          <div role="tabpanel" className="rounded-xl border border-border bg-background/50 p-3">
            <Pasos datos={PASOS[elegido]} />
          </div>
        </div>
      )}
    </div>
  )
}
