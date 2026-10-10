import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

/*
 * Botón redondo para pasar a modo claro u oscuro en las pantallas de acceso (login, registro,
 * recuperar contraseña). Mira el tema que se ve de verdad: si la persona tiene "sistema",
 * el primer toque igual cambia lo que ve.
 */
export function BotonTema({ className = "" }) {
  const { setTheme } = useTheme()
  const leer = () => document.documentElement.classList.contains("dark")
  const [oscuro, setOscuro] = useState(leer)

  // El tema puede cambiar por el sistema; se sigue la clase del <html>
  useEffect(() => {
    const obs = new MutationObserver(() => setOscuro(leer()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  return (
    <button
      type="button"
      onClick={() => setTheme(oscuro ? "light" : "dark")}
      aria-label={oscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={oscuro ? "Modo claro" : "Modo oscuro"}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground/80 transition-colors hover:border-foreground/30 hover:bg-muted active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${className}`}
    >
      {oscuro ? <Sun className="h-[18px] w-[18px]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px]" aria-hidden="true" />}
    </button>
  )
}
