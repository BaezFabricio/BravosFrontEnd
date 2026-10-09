import { useEffect, useState } from "react"

/**
 * Fecha de la versión vigente de los textos legales.
 * Si se cambia algún texto, actualizarla junto con VERSION_LEGAL del backend
 * (src/functions/consentimiento.js), que queda guardada con cada aceptación.
 */
export const ACTUALIZACION_LEGAL = "9 de octubre de 2026"

export const DOCUMENTOS_LEGALES = [
  { to: "/terminos", label: "Términos y condiciones" },
  { to: "/privacidad", label: "Privacidad" },
  { to: "/cookies", label: "Cookies" },
  { to: "/reembolsos", label: "Reembolsos" },
  { to: "/arrepentimiento", label: "Botón de arrepentimiento" },
]

/** Datos del titular y de contacto, cargados por el administrador en Configuración. */
export function useDatosLegales() {
  const [datos, setDatos] = useState({
    nombre: "Bravos Box", titular: "", cuit: "", domicilio: "", email: "", telefono: "", whatsapp: "",
  })
  useEffect(() => {
    let vivo = true
    fetch("/landing/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (!vivo || !c) return
        setDatos({
          nombre: "Bravos Box",
          titular: c.legalTitular || "",
          cuit: c.legalCuit || "",
          domicilio: c.legalDomicilio || c.direccion || "",
          email: c.email || "",
          telefono: c.telefono || "",
          whatsapp: c.whatsapp || c.telefono || "",
        })
      })
      .catch(() => {})
    return () => { vivo = false }
  }, [])
  return datos
}
