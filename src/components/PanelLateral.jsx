import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

/*
 * Panel lateral para formularios de alta (escritorio): se abre sobre la lista, desde la derecha, sin sacar a la persona de
 * la pantalla donde está. Tiene encabezado fijo (título, explicación y cerrar), cuerpo con scroll y un pie fijo con las acciones.
 * Se cierra con Escape, tocando fuera o con la X. Radix se ocupa del foco y de devolverlo al botón que lo abrió.
 *
 * Props: open, onOpenChange, titulo, descripcion, children (cuerpo), pie (acciones; si no hay, no se dibuja el pie), ancho.
 */
export default function PanelLateral({ open, onOpenChange, titulo, descripcion, children, pie, ancho = 470 }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={descripcion ? "panel-lateral-desc" : undefined}
          className="fixed inset-y-0 right-0 z-50 flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=closed]:duration-200 data-[state=open]:duration-300 focus:outline-none"
          style={{ width: `min(${ancho}px, 100vw)`, background: "var(--card)", borderLeft: "1px solid var(--border)", color: "var(--foreground)", boxShadow: "-24px 0 48px rgba(0,0,0,0.35)" }}
        >
          <header style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "24px 24px 18px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* p y no h2: el CSS global fuerza otra tipografía en los encabezados */}
              <Dialog.Title asChild><p style={{ margin: 0, font: "800 22px/1.15 Archivo, sans-serif" }}>{titulo}</p></Dialog.Title>
              {descripcion && (
                <Dialog.Description id="panel-lateral-desc" style={{ margin: "6px 0 0", font: "500 13px/1.45 Archivo, sans-serif", color: "var(--muted-foreground)" }}>
                  {descripcion}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              aria-label="Cerrar"
              style={{ display: "grid", placeItems: "center", width: 36, height: 36, flex: "none", borderRadius: 10, border: "none", background: "transparent", color: "var(--muted-foreground)", cursor: "pointer" }}
              className="transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
            >
              <X size={18} aria-hidden="true" />
            </Dialog.Close>
          </header>

          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "22px 24px 28px" }}>{children}</div>

          {pie && (
            <footer style={{ display: "flex", gap: 12, padding: "16px 24px 20px", borderTop: "1px solid var(--border)" }}>{pie}</footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// Piezas de formulario compartidas por los paneles de alta
export const estiloInput = (conError) => ({
  width: "100%", boxSizing: "border-box", height: 46, padding: "0 14px", borderRadius: 10,
  border: `1px solid ${conError ? "var(--sh-danger)" : "var(--input-line)"}`, background: "var(--input)", color: "var(--foreground)", font: "500 15px Archivo, sans-serif",
})

export function Campo({ id, etiqueta, opcional, ayuda, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
      <label htmlFor={id} style={{ font: "700 13px Archivo, sans-serif" }}>
        {etiqueta}{opcional && <span style={{ fontWeight: 400, color: "var(--muted-foreground)" }}> (opcional)</span>}
      </label>
      {children}
      {error
        ? <p role="alert" style={{ margin: 0, font: "600 12px/1.4 Archivo, sans-serif", color: "var(--sh-danger)" }}>{error}</p>
        : ayuda && <p style={{ margin: 0, font: "500 12px/1.45 Archivo, sans-serif", color: "var(--muted-foreground)" }}>{ayuda}</p>}
    </div>
  )
}

export const Seccion = ({ titulo, children }) => (
  <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div role="heading" aria-level={3} style={{ font: "800 16px Archivo, sans-serif" }}>{titulo}</div>
    {children}
  </section>
)

export const Divisor = () => <hr style={{ margin: "24px 0", border: 0, borderTop: "1px solid var(--border)" }} />

export const botonSecundario = { height: 46, padding: "0 20px", borderRadius: 10, border: "1px solid var(--sh-control-line)", background: "transparent", color: "var(--foreground)", font: "700 14px Archivo, sans-serif", cursor: "pointer" }
export const botonPrincipal = (deshabilitado) => ({ flex: 1, height: 46, borderRadius: 10, border: "none", background: "var(--primary)", color: "var(--primary-foreground)", font: "800 14px Archivo, sans-serif", cursor: deshabilitado ? "not-allowed" : "pointer", opacity: deshabilitado ? 0.6 : 1 })
