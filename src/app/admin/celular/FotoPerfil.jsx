import { useEffect, useState } from "react"

/*
 * Foto de perfil de quien tiene la sesión abierta, para el círculo del encabezado del admin en celular.
 * Si no hay foto se ven las iniciales. Se actualiza sola cuando la persona cambia su foto ("avatar-updated").
 */
export function FotoPerfil({ ini }) {
  const [url, setUrl] = useState(() => { try { return localStorage.getItem("avatarUrl") || "" } catch { return "" } })
  useEffect(() => {
    const alCambiar = (e) => setUrl(e.detail || "")
    window.addEventListener("avatar-updated", alCambiar)
    return () => window.removeEventListener("avatar-updated", alCambiar)
  }, [])
  return url
    ? <img src={url} alt="" aria-hidden="true" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
    : ini
}
