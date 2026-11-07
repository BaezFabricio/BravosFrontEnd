import { useEffect, useState } from "react"
import apiClient from "@/api"
import { haySesion } from "@/lib/sesion"
import { DialogoNovedad, FotoNovedad } from "@/components/Novedades"
import { estiloTitulo, tipoDe } from "@/lib/novedades"

/*
 * Novedades del box en la portada (solo para quien tiene sesión): una lista con miniatura, como las noticias de un portal.
 * Al tocar una novedad se abre su pop-up. Las que este dispositivo todavía no vio se abren solas, de a una.
 */
const CLAVE = (id) => `bravos-novedad-vista-${id}`
const yaVista = (id) => { try { return localStorage.getItem(CLAVE(id)) === "1" } catch { return false } }
const marcarVista = (id) => { try { localStorage.setItem(CLAVE(id), "1") } catch { /* sin almacenamiento: volverá a aparecer */ } }

// La fecha llega como dd/mm/aaaa; "Nuevo" si se publicó en los últimos 7 días
const esReciente = (fecha) => {
  const [d, m, a] = String(fecha || "").split("/")
  if (!d || !m || !a) return false
  const publicada = new Date(`${a}-${m}-${d}T12:00:00`).getTime()
  return !Number.isNaN(publicada) && Date.now() - publicada < 7 * 24 * 60 * 60 * 1000
}

export default function NovedadesPortada() {
  const [lista, setLista] = useState([])
  const [abierta, setAbierta] = useState(null) // novedad mostrada en el pop-up
  const [cola, setCola] = useState([]) // novedades nuevas que faltan mostrar de a una
  const [desdeAuto, setDesdeAuto] = useState(false)

  useEffect(() => {
    if (!haySesion()) return
    let vigente = true
    apiClient.get("/novedades/vigentes")
      .then((r) => {
        if (!vigente) return
        const todas = r.data?.data || r.data || []
        setLista(todas)
        const nuevas = todas.filter((n) => !yaVista(n.idNovedad))
        if (nuevas.length) {
          setAbierta(nuevas[0])
          setCola(nuevas.slice(1))
          setDesdeAuto(true)
        }
      })
      .catch(() => { /* sin novedades la portada se ve igual */ })
    return () => { vigente = false }
  }, [])

  if (!haySesion() || lista.length === 0) return null

  const cerrar = () => {
    if (abierta) marcarVista(abierta.idNovedad)
    // Las nuevas que se venían mostrando de a una: pasa a la siguiente solo si el pop-up se abrió solo
    if (desdeAuto && cola.length) {
      setAbierta(cola[0])
      setCola(cola.slice(1))
    } else {
      setAbierta(null)
      setDesdeAuto(false)
    }
  }

  return (
    <>
      <section aria-labelledby="novedades-titulo" className="border-t border-white/10 bg-zinc-950 py-10 text-white md:py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="novedades-titulo" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#9be600]">
            <span className="h-2 w-2 rounded-full bg-[#9be600]" aria-hidden="true" />
            Novedades
          </h2>
          <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {lista.map((n) => (
              <li key={n.idNovedad}>
                <button type="button" onClick={() => { setDesdeAuto(false); setAbierta(n) }}
                  className="group flex w-full items-center gap-4 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9be600] md:gap-5">
                  <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl md:h-24 md:w-36">
                    <FotoNovedad novedad={n} pequena className="transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-white/50">
                      {esReciente(n.fecha) && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-black">Nuevo</span>
                      )}
                      <span>{n.fecha} · {tipoDe(n.tipo).nombre}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xl md:text-2xl" style={{ ...estiloTitulo(n), lineHeight: 1.05 }}>{n.titulo}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <DialogoNovedad novedad={abierta} abierta={!!abierta} onCerrar={cerrar}
        textoBoton={desdeAuto && cola.length ? "Ver la siguiente" : "Cerrar"} />
    </>
  )
}
