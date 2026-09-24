import { Trophy, Flame, Medal, TrendingUp, Dumbbell, Weight } from "lucide-react"
import apiClient from "@/api"

// Definición de logros: cada uno se cumple según las estadísticas reales del alumno.
// `codigo` debe existir también en BravosBackEnd/src/controllers/logros.controller.js
export const LOGROS_DEF = [
  { codigo: "primera_clase", nombre: "Primera Clase", descripcion: "Completaste tu primera clase.", icono: Trophy, cumple: (s) => s.totalClases >= 1 },
  { codigo: "racha_5", nombre: "Racha 5 días", descripcion: "Entrenaste 5 días seguidos.", icono: Flame, cumple: (s) => s.racha >= 5 },
  { codigo: "primer_pr", nombre: "Primer PR", descripcion: "Registraste tu primera marca personal.", icono: Medal, cumple: (s) => s.totalMarcas >= 1 },
  { codigo: "superandote", nombre: "Superándote", descripcion: "Superaste tus marcas 5 veces.", icono: TrendingUp, cumple: (s) => s.superaciones >= 5 },
  { codigo: "todoterreno", nombre: "Todoterreno", descripcion: "Registraste marcas en 5 ejercicios distintos.", icono: Dumbbell, cumple: (s) => s.ejerciciosDistintos >= 5 },
  { codigo: "club_100", nombre: "Club de los 100", descripcion: "Levantaste 100 kg o más en una serie.", icono: Weight, cumple: (s) => s.maxPeso >= 100 },
]

export const logrosConEstado = (stats) =>
  LOGROS_DEF.map((l) => ({ ...l, completado: l.cumple(stats) }))

/**
 * Registra en el servidor los logros cumplidos y devuelve las definiciones de los
 * recién desbloqueados (el servidor también genera la notificación).
 */
export async function sincronizarLogros(codigos) {
  if (!codigos.length) return []
  try {
    const res = await apiClient.post("/logros/sincronizar", { codigos })
    const nuevos = res.data?.data?.nuevos || []
    return LOGROS_DEF.filter((l) => nuevos.includes(l.codigo))
  } catch {
    return []
  }
}
