import { Link, useNavigate } from "react-router-dom"
import { User, SlidersHorizontal, LogOut, ChevronRight, X } from "lucide-react"
import { BottomSheet } from "@/components/bx/BottomSheet"
import { AvatarBx } from "@/components/bx/MenuCuenta"
import { PANELES, panelesPermitidos } from "@/lib/paneles"

// Menú de cuenta del celular, igual en todos los paneles (como el de admin): nombre y correo, "Ver como"
// con los paneles permitidos, Mi perfil, Preferencias y Cerrar sesión.
export default function HojaCuentaCelular({ abierto, onCerrar, userData, avatarUrl, rutaPerfil, rutaConfiguracion, panelActual, onLogout }) {
  const navigate = useNavigate()
  const permitidos = panelesPermitidos()
  const paneles = PANELES.filter((p) => permitidos[p.key])

  return (
    <BottomSheet abierto={abierto} onCerrar={onCerrar} titulo={userData.nombrecompleto} ocultarTitulo>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <AvatarBx nombre={userData.nombrecompleto} url={avatarUrl} tam={48} className="border-2 border-bx-lima !bg-bx-tile !text-bx-lima" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[1.0625rem] font-extrabold">{userData.nombrecompleto}</span>
            <span className="block truncate text-[0.8125rem] text-bx-muted">{userData.correo}</span>
          </span>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="grid h-11 w-11 shrink-0 place-items-center rounded-[0.625rem] text-bx-ink">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {paneles.length > 1 && (
          <div className="flex flex-col gap-2">
            <h2 id="t-ver-como" className="m-0 text-xs font-semibold tracking-[0.1em] text-bx-muted">VER COMO</h2>
            <div role="radiogroup" aria-labelledby="t-ver-como" className="grid gap-1 rounded-xl border border-bx-line bg-bx-surf p-1" style={{ gridTemplateColumns: `repeat(${paneles.length}, minmax(0, 1fr))` }}>
              {paneles.map((p) => {
                const actual = p.key === panelActual
                return (
                  <button
                    key={p.key}
                    type="button"
                    role="radio"
                    aria-checked={actual}
                    onClick={() => { onCerrar(); if (!actual) navigate(p.href) }}
                    className={`h-[2.625rem] rounded-[0.5625rem] text-sm font-bold ${actual ? "bg-lime-400 text-black" : "text-bx-ink"}`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-bx-line bg-bx-surf">
          <Link to={rutaPerfil} onClick={onCerrar} className="flex min-h-[3.5rem] items-center gap-3.5 px-3.5 text-bx-ink">
            <User className="h-5 w-5 text-bx-muted" aria-hidden="true" />
            <span className="flex-1 text-[0.9375rem] font-bold">Mi perfil</span>
            <ChevronRight className="h-[1.125rem] w-[1.125rem] text-bx-muted" aria-hidden="true" />
          </Link>
          {rutaConfiguracion && (
            <Link to={rutaConfiguracion} onClick={onCerrar} className="flex min-h-[3.5rem] items-center gap-3.5 border-t border-bx-line px-3.5 text-bx-ink">
              <SlidersHorizontal className="h-5 w-5 text-bx-muted" aria-hidden="true" />
              <span className="flex-1 text-[0.9375rem] font-bold">Preferencias</span>
              <ChevronRight className="h-[1.125rem] w-[1.125rem] text-bx-muted" aria-hidden="true" />
            </Link>
          )}
        </div>

        <button
          type="button"
          onClick={() => { onCerrar(); onLogout() }}
          className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-xl border border-bx-line text-[0.9375rem] font-bold text-red-700 dark:text-red-400"
        >
          <LogOut className="h-5 w-5" aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>
    </BottomSheet>
  )
}
