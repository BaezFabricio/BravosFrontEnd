import { useEffect, useState } from "react"
import { BellRing, Loader2 } from "lucide-react"
import { estadoPush, activarPush, sincronizarPush } from "@/lib/push"
import { toast } from "@/lib/notificar"

/*
 * La primera vez que se abre la app instalada, invita a activar los avisos en el celular.
 * El permiso del sistema solo se puede pedir después de un toque de la persona (en iPhone es
 * obligatorio), por eso se pregunta con esta tarjeta y no de golpe.
 * Se pregunta una sola vez por dispositivo: "Ahora no" no vuelve a molestar; después se
 * activan desde Mi configuración o la campanita.
 */
const CLAVE = "bravos-invitacion-avisos"

const esAppInstalada = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true

export default function InvitacionAvisos() {
  const [visible, setVisible] = useState(false)
  const [trabajando, setTrabajando] = useState(false)

  // Si ya estaban activados en este dispositivo, se reconfirma al servidor en silencio
  useEffect(() => { sincronizarPush().catch(() => {}) }, [])

  useEffect(() => {
    let vigente = true
    let yaPreguntada = true
    try { yaPreguntada = localStorage.getItem(CLAVE) === "respondida" } catch { /* sin almacenamiento: no se pregunta */ }
    if (yaPreguntada || !esAppInstalada() || !("Notification" in window) || Notification.permission !== "default") return
    // Un momento después de abrir, para no tapar la carga de la pantalla
    const t = setTimeout(() => {
      estadoPush().then((e) => { if (vigente && e === "inactivas") setVisible(true) }).catch(() => {})
    }, 1500)
    return () => { vigente = false; clearTimeout(t) }
  }, [])

  const cerrar = () => {
    try { localStorage.setItem(CLAVE, "respondida") } catch { /* nada */ }
    setVisible(false)
  }

  const activar = async () => {
    setTrabajando(true)
    try {
      await activarPush()
      toast.success("Listo: te vamos a avisar en este celular", { guardar: false })
    } catch (err) {
      toast.error("No se pudieron activar los avisos", { description: err.response?.data?.message || err.message })
    } finally {
      setTrabajando(false)
      cerrar()
    }
  }

  if (!visible) return null

  return (
    <>
    {/* Fondo atenuado: el aviso es lo primero que se ve y no se confunde con la pantalla de atrás */}
    <div className="fixed inset-0 z-[89] bg-black/60" aria-hidden="true" />
    <div className="fixed inset-x-0 bottom-0 z-[90] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] hoja-movil" role="dialog" aria-labelledby="invitacion-avisos-titulo">
      <div className="mx-auto max-w-md rounded-2xl border border-border border-t-[5px] border-t-lime-400 bg-card p-4 text-foreground shadow-[0_-14px_44px_-6px_rgba(0,0,0,0.7)]">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime-400 text-black">
            <BellRing className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p id="invitacion-avisos-titulo" className="text-base font-black">¿Te avisamos en el celular?</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">
              Por ejemplo, si se cancela una clase que reservaste, cuando se acredita tu pago o cuando tu membresía está por vencer. Aunque la app esté cerrada.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={cerrar} disabled={trabajando}
            className="min-h-[48px] rounded-xl border border-border text-xs font-black uppercase tracking-wide text-foreground/75 disabled:opacity-50">
            Ahora no
          </button>
          <button type="button" onClick={activar} disabled={trabajando}
            className="flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl bg-lime-400 text-xs font-black uppercase tracking-wide text-black hover:bg-lime-300 disabled:opacity-50">
            {trabajando && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            Activar avisos
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-foreground/45">Podés cambiarlo cuando quieras en Mi configuración.</p>
      </div>
    </div>
    </>
  )
}
