import { useEffect, useState } from "react"
import { Calendar as CalendarIcon, ClipboardCheck, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import apiClient from "@/api"

export default function ProfesorDashboard() {
  const [fecha, setFecha] = useState(new Date())
  const [actividades, setActividades] = useState([])
  const [actividad, setActividad] = useState("")
  const [alumnos, setAlumnos] = useState([])
  const [checkedIn, setCheckedIn] = useState(false)
  const [loading, setLoading] = useState(false)

  // Lógica de carga de clases
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("usuario"));
    const idProfesor = user?.idProfesor || 1;
    apiClient.get(`/profesores/${idProfesor}/clases`)
      .then(res => setActividades(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error al cargar clases:", err));
  }, []);

  // Lógica para marcar asistencia
  async function marcarAsistencia(idAlumno, estado) {
    const fechaISO = fecha.toISOString().split("T")[0];
    try {
      await apiClient.put(`/profesores/asistencias/${idAlumno}`, { estado, fecha: fechaISO });
      setAlumnos(prev => prev.map(a => a.id === idAlumno ? { ...a, asistencia: estado } : a));
    } catch (err) {
      console.error("Error al guardar asistencia:", err);
      alert("No se pudo guardar la asistencia");
    }
  }

  // Lógica de Check-In
  async function handleCheckIn() {
    if (!actividad) { alert("Selecciona una actividad"); return; }
    
    setLoading(true);
    const fechaISO = fecha.toISOString().split("T")[0];
    try {
      const response = await apiClient.get(`/profesores/clases/${actividad}/alumnos?fecha=${fechaISO}`);
      const datosAlumnos = response.data.data || response.data;
      setAlumnos(Array.isArray(datosAlumnos) ? datosAlumnos : []);
      setCheckedIn(true);
    } catch (err) {
      console.error("Error en la petición:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* CABECERA */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-green-500" /> Registro de Asistencia
        </h1>
        <p className="text-muted-foreground">Seleccioná fecha, actividad y horario, luego hacé Check-In para tomar lista.</p>
      </div>

      {/* FILTROS CON ESTILO OSCURO */}
      <Card className="bg-[#0f0f0f] border-border shadow-none">
        <CardContent className="p-6 flex flex-wrap items-end gap-8">
          {/* FECHA CON CALENDARIO PERSONALIZADO */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Fecha</label>
            <div className="flex items-center gap-2">
              <CalendarIcon className="ml-2 h-4 w-4 text-green-500" />
              <input
                type="date"
                value={fecha ? fecha.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (!val) return
                  const d = new Date(val + 'T00:00:00')
                  setFecha(d)
                }}
                className="w-[280px] bg-transparent border border-border rounded p-2 text-white outline-none"
              />
            </div>
          </div>

          {/* ACTIVIDAD */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Actividad</label>
            <Select onValueChange={setActividad}>
              <SelectTrigger className="w-[220px] bg-transparent border-border text-white">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent className="bg-[#0f0f0f] border-border">
                {actividades.map((a) => <SelectItem key={a.idClase} value={String(a.idClase)}>{a.nombreClase}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* HORARIO */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Horario</label>
            <Button variant="outline" className="w-[220px] bg-transparent border-border justify-start text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" /> Seleccionar...
            </Button>
          </div>

          <Button onClick={handleCheckIn} disabled={loading} className="bg-white text-black hover:bg-gray-200 ml-auto">
            <ClipboardCheck className="mr-2 h-4 w-4" /> Check-In
          </Button>
        </CardContent>
      </Card>

      {/* RESULTADOS / PLACEHOLDER */}
      {!checkedIn ? (
        <div className="border border-border/40 rounded-xl p-20 text-center bg-[#0f0f0f]">
          <ClipboardCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Seleccioná fecha, actividad y horario, luego presioná <strong>Check-In</strong> para ver los alumnos.</p>
        </div>
      ) : (
        <Card className="bg-[#0f0f0f] border-border">
          <CardContent className="p-0">
            <table className="w-full text-left">
              <thead className="bg-muted/10 border-b border-border">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Alumno</th>
                  <th className="p-4 text-xs font-bold uppercase text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {alumnos.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-medium text-white">{a.nombrecompleto}</td>
                    <td className="p-4 flex gap-2">
                      <Button onClick={() => marcarAsistencia(a.id, 'presente')} variant={a.asistencia === 'presente' ? 'default' : 'outline'}>Presente</Button>
                      <Button onClick={() => marcarAsistencia(a.id, 'ausente')} variant={a.asistencia === 'ausente' ? 'destructive' : 'outline'}>Ausente</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}