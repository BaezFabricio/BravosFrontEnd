import { useEffect, useState } from "react"
import { actualizarAhora } from "@/lib/actualizacion"

/* Barra que aparece cuando hay una versión nueva de Bravos. "Actualizar" la activa y recarga; si no se toca, no pasa nada. */
export default function AvisoVersionNueva() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const mostrar = () => setVisible(true)
    window.addEventListener("bravos:version-nueva", mostrar)
    return () => window.removeEventListener("bravos:version-nueva", mostrar)
  }, [])

  if (!visible) return null

  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white shadow-2xl">
      <p className="text-sm font-bold">Hay una versión nueva de Bravos</p>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={() => setVisible(false)} className="h-9 rounded-xl px-3 text-xs font-black uppercase tracking-[0.1em] text-white/60 hover:text-white">Después</button>
        <button type="button" onClick={actualizarAhora} className="h-9 rounded-xl bg-[#9be600] px-4 text-xs font-black uppercase tracking-[0.1em] text-black hover:bg-[#b5ff1a]">Actualizar</button>
      </div>
    </div>
  )
}
