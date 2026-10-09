import { useEffect } from "react"
import { Link, NavLink } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { ACTUALIZACION_LEGAL, DOCUMENTOS_LEGALES } from "./datosLegales"

export default function LegalLayout({ titulo, children }) {
  useEffect(() => {
    const anterior = document.title
    document.title = `${titulo} · Bravos Box`
    window.scrollTo(0, 0)
    return () => { document.title = anterior }
  }, [titulo])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/inicio" className="flex items-center gap-2 text-sm font-bold text-foreground/70 hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Volver al sitio
          </Link>
          <span className="text-lg font-black tracking-tight text-accent">Bravos Box</span>
        </div>
        <nav aria-label="Documentos legales" className="mx-auto max-w-3xl px-4 sm:px-6">
          <ul className="flex flex-wrap gap-x-1 pb-2">
            {DOCUMENTOS_LEGALES.map((d) => (
              <li key={d.to}>
                <NavLink
                  to={d.to}
                  className={({ isActive }) =>
                    `inline-block border-b-2 px-3 py-2 text-xs font-black uppercase tracking-wider transition-colors ${
                      isActive
                        ? "border-lime-600 text-foreground dark:border-lime-400"
                        : "border-transparent text-foreground/50 hover:text-foreground"
                    }`
                  }
                >
                  {d.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-balance sm:text-4xl">{titulo}</h1>
        <p className="mt-2 text-sm text-foreground/50">Última actualización: {ACTUALIZACION_LEGAL}</p>
        <div className="legal-texto mt-8 space-y-4 text-[15px] leading-relaxed text-foreground/80">
          {children}
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-3xl px-4 py-6 text-xs text-foreground/50 sm:px-6">
          <a
            href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Defensa de las y los consumidores. Para reclamos ingresá aquí.
          </a>
        </div>
      </footer>
    </div>
  )
}

/** Piezas de texto con el mismo estilo en todas las páginas legales. */
export const H2 = ({ children }) => (
  <h2 className="!mt-10 text-lg font-black uppercase tracking-wide text-foreground">{children}</h2>
)
export const Lista = ({ children }) => <ul className="list-disc space-y-1.5 pl-5 marker:text-lime-600">{children}</ul>
export const Destacado = ({ children }) => (
  <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground/80">{children}</div>
)
export const Enlace = ({ to, children }) => (
  <Link to={to} className="font-semibold text-foreground underline underline-offset-2 hover:text-lime-700 dark:hover:text-lime-400">
    {children}
  </Link>
)

/** "Bravos Box (titular: X, CUIT Y), con domicilio en Z" según lo que haya cargado. */
export function Identificacion({ d }) {
  return (
    <>
      <strong>{d.nombre}</strong>
      {d.titular && <>, cuyo titular es <strong>{d.titular}</strong></>}
      {d.cuit && <> (CUIT {d.cuit})</>}
      {d.domicilio && <>, con domicilio en {d.domicilio}</>}
    </>
  )
}

export function Contacto({ d }) {
  return (
    <>
      {d.email ? <>al correo <strong>{d.email}</strong></> : <>por los medios de contacto del sitio</>}
      {d.whatsapp && <>, por WhatsApp al <strong>{d.whatsapp}</strong></>}
      {" "}o en la recepción del box
    </>
  )
}
