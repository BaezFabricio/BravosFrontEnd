import { useSyncExternalStore } from "react"
import apiClient from "@/api"

/*
 * Reglas de reservas del box (las configura el administrador en Configuración del box → Reglas de reservas).
 * Las pantallas del alumno las leen de acá para mostrar y comprobar lo mismo que exige el servidor, que es quien decide.
 *
 *  - minutosReservar: minutos de anticipación mínimos para reservar.
 *  - minutosCancelar: minutos de anticipación mínimos para cancelar recuperando el crédito.
 *  - diasAdelante:    días hacia adelante que se puede reservar (0 = solo las clases del día).
 *  - horasReservar / horasCancelar: lo mismo en horas (con decimales, ej. 0.5 = 30 min), para las comparaciones que ya estaban en horas.
 *
 * Los valores iniciales son los de siempre (2 horas); se actualizan apenas llegan del servidor.
 */
const construir = (minutosReservar, minutosCancelar, diasAdelante) => ({
  minutosReservar, minutosCancelar, diasAdelante,
  horasReservar: minutosReservar / 60,
  horasCancelar: minutosCancelar / 60,
})
const POR_DEFECTO = construir(120, 120, 0)

let actual = POR_DEFECTO
let pedido = null
const oyentes = new Set()

/** Las reglas vigentes, para usarlas en funciones comunes (no reactivas). */
export const reglasBox = () => actual

const suscribir = (aviso) => { oyentes.add(aviso); return () => oyentes.delete(aviso) }

/** Las reglas vigentes dentro de un componente: se vuelve a dibujar solo cuando cambian. */
export const useReglasBox = () => useSyncExternalStore(suscribir, reglasBox, reglasBox)

const numero = (v, siempre) => (Number.isFinite(Number(v)) ? Number(v) : siempre)

/** Pide las reglas al servidor (una vez; con `forzar` vuelve a pedirlas). Si falla, quedan las de siempre. */
export function cargarReglasBox(forzar = false) {
  if (pedido && !forzar) return pedido
  pedido = apiClient.get("/reservas/reglas")
    .then((r) => {
      const d = r.data?.data
      if (!d) return
      // Un servidor que todavía manda horas (versión anterior) también se entiende
      const minReservar = d.minutosReservar !== undefined ? numero(d.minutosReservar, 120) : numero(d.horasReservar, 2) * 60
      const minCancelar = d.minutosCancelar !== undefined ? numero(d.minutosCancelar, 120) : numero(d.horasCancelar, 2) * 60
      const nuevas = construir(minReservar, minCancelar, numero(d.diasAdelante, 0))
      if (JSON.stringify(nuevas) !== JSON.stringify(actual)) {
        actual = nuevas
        oyentes.forEach((aviso) => aviso())
      }
    })
    .catch(() => { pedido = null })
  return pedido
}

/** Un tiempo en minutos, dicho como lo diría una persona: "30 minutos", "1 hora", "2 horas", "1 hora y 30 min" */
export function tiempoTexto(minutos) {
  const m = Math.round(Number(minutos) || 0)
  if (m < 60) return `${m} ${m === 1 ? "minuto" : "minutos"}`
  const h = Math.floor(m / 60)
  const resto = m % 60
  const horas = `${h} ${h === 1 ? "hora" : "horas"}`
  return resto ? `${horas} y ${resto} min` : horas
}

/** Lo mismo, pero partiendo de horas (puede traer decimales: 0.5 → "30 minutos") */
export const hs = (horas) => tiempoTexto(Math.round(Number(horas) * 60))
