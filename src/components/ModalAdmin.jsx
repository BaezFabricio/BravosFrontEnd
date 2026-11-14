import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { BOTON_SECUNDARIO, BOTON_PELIGRO, BOTON_PRINCIPAL } from "./estilosModal"

/*
 * Ventana (modal) del panel admin en escritorio, como la referencia: fondo oscuro, tarjeta de 16 px de radio,
 * título a la izquierda y cerrar (x) a la derecha. Se cierra con Escape o tocando afuera.
 * plano: sin encabezado propio (la ventana arma su encabezado, cuerpo y pie). ancho: ancho de la ventana en px. Con "sinCerrar" no muestra la x (los diálogos de confirmar).
 */
export function ModalAdmin({ abierto, onCerrar, ancho = 520, titulo, subtitulo, extraTitulo, sinCerrar = false, plano = false, children }) {
  // Al cerrar, la ventana queda 180 ms más para despedirse con movimiento (solo en escritorio y sin "reducir movimiento")
  const [visible, setVisible] = useState(abierto)
  const [ultimo, setUltimo] = useState(children)
  if (abierto && !visible) setVisible(true)
  if (abierto && ultimo !== children) setUltimo(children)
  const animaSalida = typeof window !== "undefined" && window.innerWidth >= 1024 && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  useEffect(() => {
    if (abierto || !visible) return undefined
    const t = setTimeout(() => setVisible(false), animaSalida ? 180 : 0)
    return () => clearTimeout(t)
  }, [abierto, visible, animaSalida])
  useEffect(() => {
    if (!abierto) return undefined
    const tecla = (e) => { if (e.key === "Escape") onCerrar() }
    window.addEventListener("keydown", tecla)
    return () => window.removeEventListener("keydown", tecla)
  }, [abierto, onCerrar])
  if (!abierto && !visible) return null
  const cerrando = !abierto
  return (
    <div className="bv-overlay" data-cerrando={cerrando ? "" : undefined} onMouseDown={(e) => { if (e.target === e.currentTarget) onCerrar() }}
      style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0, 0, 0, 0.6)", display: "grid", placeItems: "center", padding: "24px", overflowY: "auto" }}>
      <div className="bv-modal" data-cerrando={cerrando ? "" : undefined} role="dialog" aria-modal="true" aria-label={typeof titulo === "string" ? titulo : undefined}
        style={{ width: `${ancho}px`, maxWidth: "100%", boxSizing: "border-box", borderRadius: "16px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)", padding: plano ? 0 : "24px", color: "var(--foreground)", ...(plano ? { display: "flex", flexDirection: "column", maxHeight: "calc(var(--bv-vh, 100vh) - 48px)", overflow: "hidden" } : null) }}>
        {!plano && <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <div style={{ flex: "1 1 0%", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 className="bv-admin-titulo" style={{ margin: 0, font: "800 20px Archivo" }}>{titulo}</h2>
              {extraTitulo}
            </div>
            {subtitulo && <p style={{ margin: "4px 0 0", font: "400 14px Archivo", color: "var(--sh-link)" }}>{subtitulo}</p>}
          </div>
          {!sinCerrar && (
            <button type="button" onClick={onCerrar} aria-label="Cerrar"
              style={{ width: "32px", height: "32px", flexShrink: 0, border: "none", background: "transparent", color: "var(--foreground)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              <X className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          )}
        </div>}
        {cerrando ? ultimo : children}
      </div>
    </div>
  )
}

// Diálogo de confirmar: título, texto, Cancelar y el botón de la acción (rojo suave)
export function ConfirmarAdmin({ abierto, onCerrar, titulo, texto, aviso, peligro = true, textoAccion = "Eliminar", ocupado = false, onConfirmar }) {
  return (
    <ModalAdmin abierto={abierto} onCerrar={onCerrar} ancho={460} titulo={titulo} sinCerrar>
      {texto && <p style={{ margin: "12px 0 0", font: "400 14px / 1.6 Archivo", color: "var(--sh-link)", whiteSpace: "pre-line" }}>{texto}</p>}
      {aviso && (
        <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginTop: "14px", padding: "12px 14px", borderRadius: "10px", background: "var(--sh-danger-bg)", border: "1px solid var(--sh-danger-line)", color: "var(--sh-danger)", font: "700 14px / 1.4 Archivo" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ marginTop: "2px" }} aria-hidden="true" />{aviso}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px" }}>
        <button type="button" onClick={onCerrar} disabled={ocupado} style={BOTON_SECUNDARIO}>Cancelar</button>
        <button type="button" onClick={onConfirmar} disabled={ocupado} style={{ ...(peligro ? BOTON_PELIGRO : BOTON_PRINCIPAL), opacity: ocupado ? 0.6 : 1 }}>{ocupado ? "Un momento…" : textoAccion}</button>
      </div>
    </ModalAdmin>
  )
}
