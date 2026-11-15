import { useState } from "react"
import { useTemaProfesor } from "../paletaProfesor"

// "2026-11-15 19:04:00" (hora local del servidor) -> fecha local sin cambio de día por zona horaria
function fechaDe(creadoEn) {
  const t = String(creadoEn || "").replace(" ", "T")
  const d = new Date(t)
  return isNaN(d) ? null : d
}

function ymdLocal(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Grupos de la referencia: Hoy y Ayer (lo más viejo queda en "Anteriores")
function agrupar(avisos) {
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(hoy.getDate() - 1)
  const kHoy = ymdLocal(hoy), kAyer = ymdLocal(ayer)
  const grupos = { Hoy: [], Ayer: [], Anteriores: [] }
  for (const a of avisos) {
    const d = fechaDe(a.creadoEn)
    const k = d ? ymdLocal(d) : ""
    if (k === kHoy) grupos.Hoy.push(a)
    else if (k === kAyer) grupos.Ayer.push(a)
    else grupos.Anteriores.push(a)
  }
  return Object.entries(grupos).filter(([, lista]) => lista.length > 0)
}

function horaDe(creadoEn) {
  const d = fechaDe(creadoEn)
  return d ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : ""
}

// Lista de avisos del profesor: filtros, "Leer todo", grupos por día y un aviso por fila.
// Se usa en el panel de la campanita (escritorio) y en la pantalla de avisos (celular).
export default function ListaAvisos({ avisos, noLeidas, cargando, onLeer, onLeerTodos, onAbrir }) {
  const C = useTemaProfesor()
  const [filtro, setFiltro] = useState("todas") // "todas" | "sinLeer"
  const visibles = filtro === "sinLeer" ? avisos.filter((a) => !a.leida) : avisos
  const grupos = agrupar(visibles)

  const chip = (id, texto) => {
    const on = filtro === id
    return (
      <button
        key={id}
        type="button"
        aria-pressed={on}
        onClick={() => setFiltro(id)}
        style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: `1px solid ${on ? C.lime : C.btnLine}`, background: on ? C.lime : "transparent", color: on ? C.onLime : C.ink, font: "700 13px Archivo", cursor: "pointer" }}
      >
        {texto}
      </button>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, color: C.ink, fontFamily: "Archivo, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {chip("todas", "Todas")}
        {chip("sinLeer", `Sin leer${noLeidas ? ` · ${noLeidas}` : ""}`)}
        <button
          type="button"
          onClick={onLeerTodos}
          disabled={noLeidas === 0}
          style={{ marginLeft: "auto", minHeight: 40, padding: "0 4px", border: "none", background: "transparent", color: C.okFg, font: "700 13px Archivo", cursor: noLeidas === 0 ? "default" : "pointer", opacity: noLeidas === 0 ? 0.4 : 1 }}
        >
          Leer todo
        </button>
      </div>

      {!cargando && noLeidas === 0 && avisos.length > 0 && (
        <p style={{ margin: 0, padding: "10px 12px", borderRadius: 12, background: C.okBg, border: `1px solid ${C.okLine}`, font: "600 13px Archivo", color: C.okFg }}>Estás al día</p>
      )}

      {!cargando && avisos.length === 0 && (
        <div style={{ padding: "36px 16px", borderRadius: 14, border: `1px dashed ${C.btnLine}`, textAlign: "center" }}>
          <div style={{ font: "700 16px Archivo" }}>Todavía no tenés avisos</div>
          <div style={{ marginTop: 4, font: "400 14px Archivo", color: C.muted }}>Acá aparecen las reservas de tus clases, las rutinas asignadas y las listas por tomar.</div>
        </div>
      )}

      {grupos.map(([titulo, lista]) => (
        <section key={titulo} aria-label={titulo} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <h2 style={{ margin: "4px 0 0", font: "600 12px Archivo", letterSpacing: ".1em", color: C.muted }}>{titulo.toUpperCase()}</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {lista.map((a) => {
              const sinLeer = !a.leida
              const falta = a.tipo === "profesor_falta_lista" // aviso de atención: en amarillo
              const fondo = falta ? C.warnBg : sinLeer ? C.okBg : C.card
              const borde = falta ? C.warnLine : sinLeer ? C.okLine : C.line
              return (
                <li key={a.idNotificacion}>
                  <button
                    type="button"
                    onClick={() => { onLeer(a.idNotificacion); onAbrir(a) }}
                    aria-label={`${a.titulo}${sinLeer ? ", sin leer" : ""}: ${a.mensaje}`}
                    style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 14px", borderRadius: 14, border: `1px solid ${borde}`, background: fondo, color: C.ink, textAlign: "left", cursor: "pointer" }}
                  >
                    <span aria-hidden="true" style={{ width: 8, height: 8, marginTop: 6, flexShrink: 0, borderRadius: "50%", background: sinLeer ? C.lime : "transparent" }} />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", font: `${sinLeer ? 800 : 600} 15px Archivo` }}>{a.titulo}</span>
                      <span style={{ display: "block", marginTop: 2, font: "400 13px/1.4 Archivo", color: C.muted }}>{a.mensaje}</span>
                    </span>
                    <span style={{ flexShrink: 0, font: "500 12px Archivo", color: C.muted }}>{horaDe(a.creadoEn)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
