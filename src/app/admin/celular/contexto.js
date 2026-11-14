import { createContext, useContext } from "react"

// Paleta y datos de sesión que comparten el layout y las pantallas del admin en celular
export const ContextoCelular = createContext(null)
export const useCelular = () => useContext(ContextoCelular)
