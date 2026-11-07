import { useEffect, useState } from "react"
import apiClient from "@/api"
import { haySesion } from "@/lib/sesion"
import { DialogoNovedad, FilaNovedad } from "@/components/Novedades"

/*
 * Novedades del box en la portada (solo para quien tiene sesión): una lista con miniatura, como las noticias de un portal.
 * Al tocar una novedad se abre su pop-up. Las que este dispositivo todavía no vio se abren solas, de a una.
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
      <section aria-labelledby="novedades-titulo" className="border-t border-white/10 bg-zinc-950 py-10 text-white md:py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 id="novedades-titulo" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#9be600]">
            <span className="h-2 w-2 rounded-full bg-[#9be600]" aria-hidden="true" />
            Novedades
          </h2>
          <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
            {lista.map((n) => (
              <li key={n.idNovedad}>
                <FilaNovedad novedad={n} onAbrir={() => { setDesdeAuto(false); setAbierta(n) }} />
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
