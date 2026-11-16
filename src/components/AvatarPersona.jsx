// Foto de perfil de una persona; si no tiene foto, muestra sus iniciales.
// Se usa en cualquier lista donde aparezca un alumno, profesor o usuario.
export default function AvatarPersona({ nombre = "", url, size = 40, fondo, color, font = "800 14px Archivo", style }) {
  const iniciales = (nombre || "").trim().split(/\s+/).slice(0, 2).map((p) => p[0] || "").join("").toUpperCase() || "?"
  const base = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    ...style,
  }
  if (url) {
    return <img src={url} alt="" aria-hidden="true" style={{ ...base, objectFit: "cover" }} />
  }
  return (
    <span aria-hidden="true" style={{ ...base, background: fondo, color, font }}>
      {iniciales}
    </span>
  )
}
