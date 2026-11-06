import { useEffect, useState } from "react"
import apiClient from "@/api"
import { haySesion } from "@/lib/sesion"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

/*
 * Novedades en la portada: una ventana con los comunicados vigentes, solo para quien tiene sesión iniciada.
 * Cada novedad se muestra una vez por dispositivo (el navegador recuerda cuáles ya vio). Si hay varias, se muestran de a una.
 */
const CLAVE = (id) => `bravos-novedad-vista-${id}`
const yaVista = (id) => { try { return localStorage.getItem(CLAVE(id)) === "1" } catch { return false } }
const marcarVista = (id) => { try { localStorage.setItem(CLAVE(id), "1") } catch { /* sin almacenamiento: volverá a aparecer */ } }

export default function NovedadesPortada() {
  const [pendientes, setPendientes] = useState([])

  useEffect(() => {
    if (!haySesion()) return
    let vigente = true
    apiClient.get("/novedades/vigentes")
      .then((r) => {
        const lista = r.data?.data || r.data || []
        if (vigente) setPendientes(lista.filter((n) => !yaVista(n.idNovedad)))
      })
      .catch(() => { /* sin novedades la portada se ve igual */ })
    return () => { vigente = false }
  }, [])

  const actual = pendientes[0]
  if (!actual) return null

  const cerrar = () => {
    marcarVista(actual.idNovedad)
    setPendientes((prev) => prev.slice(1))
  }

  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto) cerrar() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-700 dark:text-lime-400">Novedades del box</p>
          <DialogTitle className="text-xl font-black uppercase tracking-tight">{actual.titulo}</DialogTitle>
          <DialogDescription className="whitespace-pre-line pt-2 text-sm leading-relaxed text-foreground/80">{actual.texto}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button type="button" onClick={cerrar}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-lime-400 px-5 text-sm font-black uppercase tracking-wide text-black hover:bg-lime-300">
            {pendientes.length > 1 ? "Ver la siguiente" : "Entendido"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
