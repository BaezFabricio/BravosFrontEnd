import { Link } from "react-router-dom"
import { Ico } from "@/components/bx/iconos"
import { AvatarBx } from "@/components/bx/MenuCuenta"

/*
 * Marco del módulo Alumno en el celular (handoff móvil): header fijo de 56 px y menú inferior fijo de 5 opciones con el botón
 * Reservar flotante en el centro. Se adaptan a cualquier tamaño de celular (columnas fluidas) y respetan las zonas seguras
 * del teléfono (la muesca arriba y la barra de abajo).
 */

// Header fijo: logo · (título de la pantalla, si no es el inicio) · campanita · avatar (abre el menú de cuenta)
export function EncabezadoMovil({ titulo, userData, avatarUrl, onAvatar, campana }) {
  return (
    <header className="bx sticky top-0 z-20 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-2 border-b border-bx-line bg-bx-bg pb-0 pl-4 pr-3 pt-[env(safe-area-inset-top)] lg:hidden">
      <Link to="/inicio" aria-label="Ir a la página principal" className="shrink-0 rounded-lg">
        <img src="/logo.jpg" alt="Bravos Box" className="h-9 w-9 rounded-lg object-cover" />
      </Link>
      {titulo
        ? <h1 data-guia="titulo" key={titulo} className="bx-aparece m-0 min-w-0 flex-1 truncate text-[1.0625rem] font-bold">{titulo}</h1>
        : <span className="flex-1" />}
      {campana}
      <button
        type="button"
        onClick={onAvatar}
        aria-label="Menú de cuenta"
        aria-haspopup="dialog"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-transform duration-200 active:scale-90"
      >
        <AvatarBx nombre={userData.nombrecompleto} url={avatarUrl} tam={36} />
      </button>
    </header>
  )
}

/*
 * Menú inferior. items: [{ name, mobileLabel, href, d (trazo del ícono), activo, centro?, alTocar?, guia?, insignia?, pista? }]
 * El centro (Reservar) es un círculo lima que sobresale hacia arriba.
 */
export function MenuInferior({ items, onNavegar }) {
  return (
    <div className="bx fixed inset-x-0 bottom-0 z-30 lg:hidden">
      <nav aria-label="Navegación principal" className="border-t border-bx-line bg-bx-card pb-[max(1.375rem,env(safe-area-inset-bottom))]">
        <div className="grid h-[4.625rem] grid-cols-5">
          {items.map((item) => {
            const alPulsar = (e) => {
              if (item.alTocar) { e.preventDefault(); item.alTocar() }
              onNavegar?.()
            }
            if (item.centro) {
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={alPulsar}
                  aria-label="Reservar clase"
                  aria-current={item.activo ? "page" : undefined}
                  className="relative flex min-w-0 flex-col items-center justify-end gap-1 pb-2.5 text-[0.6875rem] font-bold text-bx-ok-fg"
                >
                  <span className="latido-centro -mt-[1.875rem] grid h-[3.75rem] w-[3.75rem] place-items-center rounded-full border-4 border-bx-bg bg-bx-lima text-bx-negro shadow-[0_0_0_1px_rgba(155,230,0,0.4),0_0.5rem_1.5rem_rgba(155,230,0,0.25)] transition-transform duration-200 active:scale-90">
                    <Ico d={item.d} size={22} sw={1.9} />
                  </span>
                  <span className="max-w-full truncate px-0.5">{item.mobileLabel}</span>
                </Link>
              )
            }
            return (
              <Link
                key={item.name}
                to={item.href}
                data-guia={item.guia}
                onClick={alPulsar}
                aria-current={item.activo ? "page" : undefined}
                className={`relative flex min-w-0 flex-col items-center justify-end gap-1 pb-2.5 text-[0.6875rem] transition-colors duration-200 ${item.activo ? "font-bold text-bx-ok-fg" : "font-semibold text-bx-muted hover:text-bx-ink"}`}
              >
                <span className={`relative grid h-[1.875rem] w-[3.25rem] place-items-center rounded-[0.9375rem] transition-[background-color,transform] duration-300 active:scale-90 ${item.activo ? "bg-bx-ok-bg" : "bg-transparent"}`}>
                  <Ico d={item.d} size={22} sw={1.9} />
                  {item.insignia > 0 && (
                    <span className="absolute right-0.5 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-bx-lima px-1 text-[0.5625rem] font-extrabold leading-none text-bx-negro ring-2 ring-bx-card" aria-label={`${item.insignia} reservas próximas`}>
                      {item.insignia > 9 ? "9+" : item.insignia}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate px-0.5">{item.mobileLabel}</span>
                {item.pista && (
                  <span role="status" className="pista-barra pointer-events-none absolute -top-12 left-1/2 z-20 -ml-10 w-20 rounded-lg bg-bx-lima px-2 py-1.5 text-center text-[0.625rem] font-extrabold uppercase leading-tight tracking-wide text-bx-negro shadow-lg">
                    {item.pista}
                    <span aria-hidden="true" className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 bg-bx-lima" />
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
