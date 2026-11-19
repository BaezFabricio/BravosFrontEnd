import { useSyncExternalStore } from "react"
import apiClient from "@/api"

/*
 * Reglas de reservas del box (las configura el administrador en Configuración del box → Reglas de reservas).
 * Las pantallas del alumno las leen de acá para mostrar y comprobar lo mismo que exige el servidor, que es quien decide.
 *
 *  - horasReservar: horas de anticipación mínimas para reservar.
 *  - horasCancelar: horas de anticipación mínimas para cancelar recuperando el crédito.
 *  - diasAdelante:  días hacia adelante que se puede reservar (0 = solo las clases del día).
 *
 * Los valores iniciales son los de siempre; se actualizan apenas llegan del servidor.
 */
const POR_DEFECTO = { horasReservar: 2, horasCancelar: 2, diasAdelante: 0 }

let actual = { ...POR_DEFECTO }
let pedido = null
const oyentes = new Set()

/** Las reglas vigentes, para usarlas en funciones comunes (no reactivas). */
export const reglasBox = () => actual

const suscribir = (aviso) => { oyentes.add(aviso); return () => oyentes.delete(aviso) }

/** Las reglas vigentes dentro de un componente: se vuelve a dibujar solo cuando cambian. */
export const useReglasBox = () => useSyncExternalStore(suscribir, reglasBox, reglasBox)

/** Pide las reglas al servidor (una vez; con `forzar` vuelve a pedirlas). Si falla, quedan las de siempre. */
export function cargarReglasBox(forzar = false) {
  if (pedido && !forzar) return pedido
  pedido = apiClient.get("/reservas/reglas")
    .then((r) => {
      const d = r.data?.data
      if (!d) return
      const nuevas = {
        horasReservar: Number.isFinite(Number(d.horasReservar)) ? Number(d.horasReservar) : POR_DEFECTO.horasReservar,
        horasCancelar: Number.isFinite(Number(d.horasCancelar)) ? Number(d.horasCancelar) : POR_DEFECTO.horasCancelar,
        diasAdelante: Number.isFinite(Number(d.diasAdelante)) ? Number(d.diasAdelante) : POR_DEFECTO.diasAdelante,
      }
      if (JSON.stringify(nuevas) !== JSON.stringify(actual)) {
        actual = nuevas
        oyentes.forEach((aviso) => aviso())
      }
    })
    .catch(() => { pedido = null })
  return pedido
}

/** "1 hora" · "2 horas" */
export const hs = (n) => `${n} ${Number(n) === 1 ? "hora" : "horas"}`
