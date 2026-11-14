import { useState } from "react"
import { Smartphone, Share, SquarePlus, MoreVertical, Download, Check } from "lucide-react"
import { toast } from "@/lib/notificar"

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

// Escritorio (Preferencias del admin, referencia 16): pestañas, pasos numerados y la dirección para abrir en el celular
function EscritorioInstalar({ elegido, setElegido, yaInstalada }) {
  const copiar = () => {
    navigator.clipboard?.writeText(window.location.origin).then(
      () => toast.success("Dirección copiada"),
      () => toast.error("No se pudo copiar la dirección"),
    )
  }
  if (yaInstalada) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <p className="text-sm font-bold text-foreground">Ya tenés la app instalada</p>
        <p className="mt-1 text-sm text-foreground/60">Si cambiás de celular, repetí estos pasos en el nuevo.</p>
      </div>
    )
  }
  const datos = PASOS[elegido]
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div role="tablist" aria-label="Tu celular" className="flex gap-7 border-b border-border px-5">
        {Object.entries(PASOS).map(([clave, d]) => (
          <button key={clave} type="button" role="tab" aria-selected={elegido === clave} onClick={() => setElegido(clave)}
            className={"-mb-px border-b-2 py-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 " + (elegido === clave ? "border-lime-400 text-foreground" : "border-transparent text-foreground/55 hover:text-foreground")}>
            {d.titulo}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="grid grid-cols-[minmax(0,1fr)_16.25rem] gap-6 p-5">
        <div className="space-y-4">
          <p className="text-sm font-bold text-foreground">{datos.navegador}</p>
          <ol className="space-y-3.5">
            {datos.pasos.map((p, n) => (
              <li key={n} className="flex items-center gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-lime-400/40 bg-lime-400/10 text-sm font-black text-lime-700 dark:text-lime-400">{n + 1}</span>
                <p className="text-[0.9375rem] text-foreground/85">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
        <aside className="flex flex-col gap-2 rounded-xl border border-border p-4">
          <Smartphone className="h-5 w-5 text-lime-700 dark:text-lime-400" aria-hidden="true" />
          <p className="text-sm font-bold text-foreground">Estás en una computadora</p>
          <p className="text-[0.8125rem] leading-snug text-foreground/60">Abrí esta dirección en el celular y seguí los pasos:</p>
          <p className="break-all text-sm font-bold text-foreground">{window.location.host}</p>
          <button type="button" onClick={copiar} className="mt-2 h-10 rounded-[0.625rem] border border-border text-sm font-bold text-foreground transition-colors hover:border-foreground/30">Copiar dirección</button>
        </aside>
      </div>
    </div>
  )
}

export default function InstalarApp({ escritorio = false } = {}) {
  const [iphone] = useState(esIphone)
  const [yaInstalada] = useState(instalada)
  // Se elige el aparato con los botones de arriba; arranca en el que se está usando
  const [elegido, setElegido] = useState(escritorio || iphone ? "iphone" : "android")
  if (escritorio) return <EscritorioInstalar elegido={elegido} setElegido={setElegido} yaInstalada={yaInstalada} />

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
                className={`min-h-[2.5rem] rounded-lg text-sm font-black uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
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
