// Colores del módulo de profesor (referencia handoff_profesor, escritorio). Oscuro = d, claro = l.
export const PALETA = {
  d: {
    bg: "#0b0b0b", card: "#161616", line: "#262626", line2: "#2a2a2a", surf: "#1d1d1d",
    ink: "#ecefe4", muted: "#a3a698", btnLine: "#333333", track: "#2a2a2a",
    okBg: "#16220a", okLine: "#3d5a10", okFg: "#9be600", tile: "#1f2a0e",
    errFg: "#ff8a80", errBg: "#2a1210", errLine: "#6b2a24",
    warnBg: "#2a230a", warnLine: "#5a4a12", warnFg: "#e6c200",
    lime: "#9be600", limeHover: "#c4ff3d", onLime: "#0b0b0b",
  },
  l: {
    bg: "#ecece6", card: "#f6f6f1", line: "#dcdcd3", line2: "#e2e2da", surf: "#ffffff",
    ink: "#141510", muted: "#5f6156", btnLine: "#d6d6cc", track: "#e0e0d7",
    okBg: "#eef7dc", okLine: "#c9e39a", okFg: "#3f6400", tile: "#e3f2c4",
    errFg: "#b3261e", errBg: "#fdeceb", errLine: "#e9b3ae",
    warnBg: "#fdf6dc", warnLine: "#e3c766", warnFg: "#7a5d00",
    lime: "#9be600", limeHover: "#c4ff3d", onLime: "#0b0b0b",
  },
}

// Lee el tema que está aplicando la app (clase "dark" en <html>) y se actualiza si cambia
import { useEffect, useState } from "react"
export function useTemaProfesor() {
  const leer = () => document.documentElement.classList.contains("dark")
  const [oscuro, setOscuro] = useState(leer)
  useEffect(() => {
    const obs = new MutationObserver(() => setOscuro(leer()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])
  return oscuro ? PALETA.d : PALETA.l
}
