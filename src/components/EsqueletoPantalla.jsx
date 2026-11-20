/*
 * Lo que se ve mientras llega una pantalla que se carga a pedido (antes quedaba todo en blanco o negro durante 1 o 2 segundos).
 * Es neutro (barras que laten suave, con el color del texto del tema) para servir en celular, tableta y escritorio.
 */
export default function EsqueletoPantalla() {
  return (
    <div role="status" aria-label="Cargando" className="bv-esq flex w-full flex-col gap-4 px-4 pb-32 pt-5">
      <div className="h-7 w-1/2 rounded-lg bg-foreground/[0.07]" />
      <div className="h-24 w-full rounded-2xl bg-foreground/[0.06]" />
      <div className="h-24 w-full rounded-2xl bg-foreground/[0.06]" />
      <div className="h-24 w-full rounded-2xl bg-foreground/[0.06]" />
    </div>
  )
}
