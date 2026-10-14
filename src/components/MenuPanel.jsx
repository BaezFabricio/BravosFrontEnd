import { Link } from "react-router-dom"
import { Globe, LogOut } from "lucide-react"

/*
 * Piezas del menú que comparten los tres paneles (alumno, profesor y administrador),
 * para que en todos se navegue igual.
 */

// Título de cada grupo (mismo estilo en el menú lateral y en el desplegable del celular)
export const TituloGrupo = ({ titulo }) =>
  titulo ? (
    <p className="px-3 pb-1 pt-4 text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/30">{titulo}</p>
  ) : null

const claseItem = (activo, extra = "") =>
  `flex items-center gap-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all ${extra} ${
    activo
      ? "border-l-2 border-l-lime-600 dark:border-l-lime-400 pl-[10px] pr-3 bg-lime-400/10 text-lime-700 dark:text-lime-400"
      : "px-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
  }`

/*
 * Celular, arriba a la izquierda: el logo, que lleva a la página principal. La opción con
 * nombre ("Página principal") va primera en el menú y en el globito.
 */
export function BotonPaginaPrincipal() {
  return (
    <Link to="/inicio" aria-label="Ir a la página principal"
      className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 lg:hidden">
      <img src="/logo.jpg" alt="Bravos Box" width={36} height={36} className="h-9 w-9 rounded-lg" />
    </Link>
  )
}

// Opción "Página principal": vuelve al sitio público del box sin cerrar la sesión
export function EnlacePaginaPrincipal({ onClick, tabIndex }) {
  return (
    <Link to="/inicio" onClick={onClick} tabIndex={tabIndex} className={claseItem(false, "min-h-[42px]")}>
      <Globe className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      Página principal
    </Link>
  )
}

/*
 * Menú desplegable del celular: se abre hacia abajo desde el botón de arriba a la derecha.
 * Va dentro del <header> (que es sticky), justo después de la fila de botones.
 * - grupos: [{ key, titulo }] en el orden en que se dibujan
 * - items: opciones ya filtradas por permisos, cada una con { name, href, icon, grupo }
 * - esActivo(item): si es la pantalla actual
 */
export function MenuMovil({ abierto, onCerrar, grupos, items, esActivo, onLogout }) {
  const tab = abierto ? 0 : -1
  return (
      <div
        className={`lg:hidden absolute right-3 top-full z-20 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-border bg-sidebar shadow-2xl shadow-black/40 transition-all duration-200 ease-out ${
          abierto ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
        aria-hidden={!abierto}
      >
        <nav className="max-h-[75vh] overflow-y-auto p-2" aria-label="Menú">
          {/* Primero: volver al sitio público del box */}
          <div className="mb-1 border-b border-sidebar-border pb-1">
            <EnlacePaginaPrincipal onClick={onCerrar} tabIndex={tab} />
          </div>

          {grupos.map((g) => {
            const delGrupo = items.filter((item) => item.grupo === g.key)
            if (delGrupo.length === 0) return null
            return (
              <div key={g.key} className="space-y-0.5">
                {g.titulo && <p className="px-3 pb-1 pt-3 text-[10px] font-black uppercase tracking-widest text-sidebar-foreground/35">{g.titulo}</p>}
                {delGrupo.map((item) => {
                  const activo = esActivo(item)
                  return (
                    <Link key={item.name} to={item.href} onClick={onCerrar} tabIndex={tab} aria-current={activo ? "page" : undefined} className={claseItem(activo, "min-h-[42px]")}>
                      <item.icon className={`h-4 w-4 flex-shrink-0 ${activo ? "text-lime-700 dark:text-lime-400" : ""}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )
          })}

          {/* Cerrar sesión, separado del resto para no tocarlo sin querer */}
          <div className="mt-2 border-t border-sidebar-border pt-2">
            <button
              type="button"
              onClick={() => { onCerrar(); onLogout() }}
              tabIndex={tab}
              className="flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold uppercase tracking-wide text-red-700 transition-all hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-red-400"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </nav>
      </div>
  )
}

/*
 * Fondo invisible para cerrar el menú tocando afuera. Va DESPUÉS del <header>, no adentro:
 * el header tiene desenfoque de fondo y eso encerraría a este fondo dentro de él.
 */
export function FondoMenuMovil({ abierto, onCerrar }) {
  return abierto ? <div className="lg:hidden fixed inset-0 z-10" onClick={onCerrar} aria-hidden="true" /> : null
}
