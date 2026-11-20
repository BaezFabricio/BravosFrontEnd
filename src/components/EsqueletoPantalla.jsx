/*
 * Lo que se ve mientras llega una pantalla que se carga a pedido (antes quedaba todo vacío, "en negro", 1 o 2 segundos).
 * Una línea verde que corre arriba y barras que laten suave, con el color del texto del tema, para que se note que está cargando
 * en celular, tableta y escritorio.
 */
export default function EsqueletoPantalla() {
  return (
    <div role="status" aria-label="Cargando" className="w-full">
      <div aria-hidden="true" className="bv-carga-linea fixed inset-x-0 top-0 z-[120] h-[3px] overflow-hidden"><span /></div>
      <div className="bv-esq flex w-full flex-col gap-4 px-4 pb-32 pt-5">
        <div className="h-7 w-1/2 rounded-lg bg-foreground/[0.14]" />
        <div className="h-24 w-full rounded-2xl bg-foreground/[0.11]" />
        <div className="h-24 w-full rounded-2xl bg-foreground/[0.11]" />
        <div className="h-24 w-full rounded-2xl bg-foreground/[0.11]" />
      </div>
    </div>
  )
}
