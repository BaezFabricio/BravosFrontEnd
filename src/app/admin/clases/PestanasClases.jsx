import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import apiClient from "@/api"
import { yaTermino } from "./utilClases"

// Barra de pestañas de Clases (Clases · Turnos · Historial N), igual en las tres pantallas.
// Con "onCambiar" (la lista de Clases) Clases e Historial cambian en el mismo lugar; sin él son enlaces.
// Si no se le pasa "cantidad", cuenta por su cuenta las clases del historial.
const estilo = (activa) => ({
  minHeight: "48px", marginBottom: "-1px", padding: "0px 18px",
  borderWidth: "0px 0px 3px", borderStyle: "none none solid", borderColor: `transparent transparent ${activa ? "var(--primary)" : "transparent"}`,
  background: "transparent", color: activa ? "var(--foreground)" : "var(--muted-foreground)",
  display: "flex", alignItems: "center", gap: "8px", font: "700 15px Archivo", cursor: "pointer", textDecoration: "none",
})

export default function PestanasClases({ activa, cantidad, onCambiar }) {
  const [propia, setPropia] = useState(null)
  useEffect(() => {
    if (cantidad !== undefined) return undefined
    let vigente = true
    apiClient.get("/clases")
      .then((res) => { if (vigente) setPropia((res.data?.data || res.data || []).filter((c) => yaTermino(c)).length) })
      .catch(() => {})
    return () => { vigente = false }
  }, [cantidad])
  const total = cantidad ?? propia

  const pestana = (clave, texto, a, extra) => {
    const props = { role: "tab", "aria-selected": activa === clave, style: estilo(activa === clave) }
    const contenido = <><span>{texto}</span>{extra}</>
    if (onCambiar && clave !== "turnos") return <button type="button" key={clave} {...props} onClick={() => onCambiar(clave)}>{contenido}</button>
    return <Link key={clave} to={a} {...props}>{contenido}</Link>
  }

  return (
    <div role="tablist" aria-label="Secciones de clases" style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)" }}>
      {pestana("clases", "Clases", "/admin/clases")}
      {pestana("turnos", "Turnos", "/admin/clases/turnos")}
      {pestana("historial", "Historial", "/admin/clases?pestana=historial", total != null && (
        <span style={{ minWidth: "22px", height: "22px", padding: "0px 6px", boxSizing: "border-box", borderRadius: "11px", background: "var(--sh-track)", color: "var(--foreground)", font: "700 12px / 22px Archivo", textAlign: "center" }}>{total}</span>
      ))}
    </div>
  )
}
