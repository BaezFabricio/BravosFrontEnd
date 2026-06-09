import { useParams, Link } from 'react-router-dom'

export default function EditarClasePage() {
  const { id } = useParams()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Editar Clase</h1>
      </div>

      <div className="rounded-xl border border-gray-700 bg-[#071107] p-6">
        <p className="text-gray-300">Aquí podrás editar la clase con ID <strong>{id}</strong>.</p>
        <p className="mt-4 text-gray-400">Formulario de edición pendiente — por ahora usa la creación para agregar nuevas clases.</p>
        <div className="mt-6">
          <Link to="/admin/clases" className="inline-block rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800">Volver a Clases</Link>
        </div>
      </div>
    </div>
  )
}
