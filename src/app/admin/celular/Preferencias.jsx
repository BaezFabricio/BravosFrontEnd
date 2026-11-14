import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "@/components/theme-provider"
import { estadoPush, activarPush } from "@/lib/push"
import { useCelular } from "./contexto"
import { Cabecera, Cuerpo, Extras, estilosHover } from "./pantallas/PreferenciasView"

const W = ["#f6f6f1", "#141510"], B = ["#0b0b0b", "#ecefe4"]

// Preferencias del admin en celular (referencia 20): apariencia, avisos en este celular e instalar la app
export default function PreferenciasCelular() {
  const { c } = useCelular()
  const { theme, setTheme } = useTheme()
  const [push, setPush] = useState(null)
  const [ins, setIns] = useState(false)
  const [os, setOs] = useState(/iPhone|iPad/.test(navigator.userAgent) ? "ios" : "and")
  const [toast, setToast] = useState(null)
  const reloj = useRef(null)
  const avisar = useCallback((t) => { setToast(t); clearTimeout(reloj.current); reloj.current = setTimeout(() => setToast(null), 3000) }, [])
  useEffect(() => () => clearTimeout(reloj.current), [])
  useEffect(() => { estadoPush().then(setPush).catch(() => setPush("no-soportado")) }, [])

  const v = useMemo(() => {
    const tema = theme === "light" ? "claro" : theme === "dark" ? "oscuro" : "auto"
    const permiso = push === "activas" || push === "activo" || push === "activadas" ? "ok" : push === "bloqueadas" ? "no" : "ask"
    const AV = {
      ask: ["Avisos desactivados", push === "instalar-ios" ? "En el iPhone, primero instalá la app: Compartir → Agregar a inicio." : push === "sin-app" ? "Funcionan con la app instalada: agregala a la pantalla de inicio." : push === "no-soportado" ? "Este navegador no permite recibir avisos." : "Activalos para enterarte de pagos, reservas y novedades.", push === "instalar-ios" || push === "sin-app" || push === "no-soportado" || push === null ? false : "ACTIVAR AVISOS", c.line, c.surf, c.muted],
      ok: ["Avisos activados", "Te llegan aunque tengas la app cerrada.", false, c.okLine, c.tile, c.okFg],
      no: ["Avisos bloqueados", "Los bloqueaste en el navegador. Andá a Ajustes → Safari → Notificaciones y permitilos para Bravos.", false, c.errLine, c.errBg, c.errFg],
    }[permiso]
    return {
      c,
      temas: [["claro", "Claro", W, W, "light"], ["oscuro", "Oscuro", B, B, "dark"], ["auto", "Automático", W, B, "system"]].map(([id, l, A, Bb, valor]) => { const ch = tema === id; return { l, ch: ch ? "true" : "false", bd: ch ? "2px solid #9be600" : "1px solid " + c.line, a: A[0], aInk: A[1], b: Bb[0], bInk: Bb[1], pick: () => setTheme(valor) } }),
      temaH: tema === "auto" ? "Sigue el modo de tu celular. Se guarda en este equipo." : "Se guarda en este equipo.",
      avT: AV[0], avS: AV[1], avBtn: AV[2], avBd: AV[3], avIcBg: AV[4], avIcFg: AV[5],
      activar: async () => { try { await activarPush(); setPush(await estadoPush()); avisar("Avisos activados.") } catch (err) { avisar(err.response?.data?.message || err.message || "No se pudieron activar los avisos.") } },
      ins, insA: ins ? "true" : "false", insRot: ins ? "rotate(180deg)" : "none", togIns: () => setIns((x) => !x),
      os: [["ios", "iPhone"], ["and", "Android"]].map(([id, l]) => { const s = os === id; return { l, sel: s ? "true" : "false", bg: s ? "#9be600" : "transparent", fg: s ? "#0b0b0b" : c.ink, pick: () => setOs(id) } }),
      osNote: os === "ios" ? "Tiene que ser desde Safari." : "Desde Chrome.",
      pasos: (os === "ios" ? ["Tocá Compartir: el cuadrado con una flecha hacia arriba.", "Elegí \"Agregar a pantalla de inicio\".", "Tocá \"Agregar\" y abrí Bravos desde el ícono nuevo."] : ["Tocá el menú ⋮ arriba a la derecha.", "Elegí \"Instalar app\" o \"Agregar a pantalla principal\".", "Confirmá y abrí Bravos desde el ícono nuevo."]).map((t, i) => ({ n: i + 1, t })),
      toast,
    }
  }, [theme, setTheme, push, ins, os, toast, c, avisar])

  return (
    <>
      <style>{estilosHover(v)}</style>
      <div style={{ position: "sticky", top: 0, zIndex: 20, paddingTop: "env(safe-area-inset-top, 0px)", background: c.bg }}><Cabecera v={v} /></div>
      <Cuerpo v={v} />
      <div className="dcx" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 40 }}><Extras v={v} /></div>
    </>
  )
}
