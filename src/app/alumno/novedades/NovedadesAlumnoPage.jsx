import NovedadesPortada from "@/components/NovedadesPortada"

/* Página "Novedades" del alumno: todas las novedades vigentes, una abajo de la otra, como un diario. */
export default function NovedadesAlumnoPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 lg:px-0">
      <NovedadesPortada compacta />
    </div>
  )
}
