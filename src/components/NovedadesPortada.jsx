import { useEffect, useState } from "react"
import apiClient from "@/api"
import { haySesion } from "@/lib/sesion"
import { DialogoNovedad, TarjetaNovedad } from "@/components/Novedades"
import { ESTILO_TITULO } from "@/lib/novedades"

/*
 * Novedades del box en la portada (solo para quien tiene sesión): una franja de tarjetas con foto,
 * y al abrir la portada se muestra en pop-up cada novedad que este dispositivo todavía no vio.
 */
const CLAVE = (id) => `bravos-novedad-vista-${id}`
const yaVista = (id) => { try { return localStorage.getItem(CLAVE(id)) === "1" } catch { return false } }
const marcarVista = (id) => { try { localStorage.setItem(CLAVE(id), "1") } catch { /* sin almacenamiento: volverá a aparecer */ } }

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
      <section aria-labelledby="novedades-titulo" className="bg-zinc-950 py-12 text-white md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#9be600]">Novedades del box</p>
          <h2 id="novedades-titulo" className="mt-2 text-5xl md:text-6xl" style={ESTILO_TITULO}>Lo que pasa en Bravos</h2>
          <div className="-mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {lista.map((n) => (
              <TarjetaNovedad key={n.idNovedad} novedad={n} onAbrir={() => { setDesdeAuto(false); setAbierta(n) }}
                className="w-[82%] shrink-0 snap-start sm:w-[340px]" />
            ))}
          </div>
        </div>
      </section>

      <DialogoNovedad novedad={abierta} abierta={!!abierta} onCerrar={cerrar}
        textoBoton={desdeAuto && cola.length ? "Ver la siguiente" : "Cerrar"} />
    </>
  )
}
