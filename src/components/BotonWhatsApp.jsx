import IconoWhatsApp from "@/components/IconoWhatsApp"
import { enlaceWhatsApp } from "@/lib/whatsapp"

/** Botón redondo de WhatsApp que abre el chat con ese teléfono. Si el número no sirve para WhatsApp, no se muestra. */
export default function BotonWhatsApp({ telefono, nombre, className = "" }) {
  const enlace = enlaceWhatsApp(telefono)
  if (!enlace) return null
  return (
    <a href={enlace} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
      aria-label={`Escribirle por WhatsApp a ${nombre || "este usuario"}`} title="Escribir por WhatsApp"
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${className}`}>
      <IconoWhatsApp className="h-4 w-4" />
    </a>
  )
}
