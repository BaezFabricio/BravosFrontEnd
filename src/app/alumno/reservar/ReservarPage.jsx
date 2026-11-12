import { useSemanaCreditos } from "@/lib/semanaCreditos"
import { useEffect, useMemo, useState } from "react"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from '@/lib/notificar'
import apiClient from "@/api"
import { useAnchoPanel } from "@/lib/useEscritorio"
import ReservarMovil from "./ReservarMovil"
import ReservarMovilNuevo from "./ReservarMovilNuevo"
import ReservarEscritorio from "./ReservarEscritorio"

const mapaDiasBD = { 0: "DOMINGO", 1: "LUNES", 2: "MARTES", 3: "MIERCOLES", 4: "JUEVES", 5: "VIERNES", 6: "SABADO" }

const TURNOS = [
  { id: "manana", label: "Mañana",  desde: "05:00", hasta: "12:00" },
  { id: "tarde",  label: "Tarde",   desde: "12:00", hasta: "17:00" },
  { id: "noche",  label: "Noche",   desde: "17:00", hasta: "23:59" },
]

function horaEnTurno(hora, turnoId) {
  const t = TURNOS.find(t => t.id === turnoId)
  if (!t) return true
  return hora >= t.desde && hora < t.hasta
}

// ¿La clase se da ese día? (activa, del día de la semana o de esa fecha única, y del plan del alumno)
function claseEsDelDia(clase, date, idPlanAlumno) {
  if (clase.estado !== 'Activo') return false
  if (idPlanAlumno && clase.idPlan && clase.idPlan !== idPlanAlumno) return false
  if (clase.fechaEspecifica) {
    const fechaStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return clase.fechaEspecifica.split('T')[0] === fechaStr
  }
  return (clase.dia ? clase.dia.toUpperCase().trim() : "") === mapaDiasBD[date.getDay()]
}

function rutinaPublicada(publicarEn) {
  if (!publicarEn) return true
  return new Date() >= new Date(publicarEn)
}

function formatearFechaPublicacion(publicarEn) {
  return new Date(publicarEn).toLocaleString("es-AR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
  })
}

function calcularDuracion(inicio, fin) {
  if (!inicio || !fin) return 60
  const [h1, m1] = inicio.split(':').map(Number)
  const [h2, m2] = fin.split(':').map(Number)
  return (h2 * 60 + m2) - (h1 * 60 + m1)
}

// Devuelve la diferencia en horas entre ahora y la clase (positivo = clase en el futuro)
function horasHastaClase(fechaDate, horaInicio) {
  if (!horaInicio) return Infinity
  const [h, m] = horaInicio.split(':').map(Number)
  const claseDatetime = new Date(fechaDate)
  claseDatetime.setHours(h, m, 0, 0)
  return (claseDatetime - new Date()) / 3600000
}

// Solo se reservan las clases del día (el servidor lo exige igual) y hasta 2 horas antes de que empiecen
function esDeHoy(fechaDate) {
  return fechaDate.toDateString() === new Date().toDateString()
}

function puedeReservar(fechaDate, horaInicio) {
  return esDeHoy(fechaDate) && horasHastaClase(fechaDate, horaInicio) >= 2
}

function puedeCancelar(fechaDate, horaInicio) {
  return horasHastaClase(fechaDate, horaInicio) >= 2
}

export default function ReservarClasePage() {
  const [selectedDate, setSelectedDate]       = useState(new Date())
  const [clasesOriginales, setClasesOriginales] = useState([])
  const [planes, setPlanes]                   = useState([])
  const [selectedClass, setSelectedClass]     = useState(null)
  const [confirmDialog, setConfirmDialog]     = useState(false)
  const [cancelDialog, setCancelDialog]       = useState({ open: false, clase: null })
  const [isLoading, setIsLoading]             = useState(false)
  const [pageLoading, setPageLoading]         = useState(true)
  const [creditosReales, setCreditosReales]   = useState(0)
  const semana = useSemanaCreditos() // plan con créditos por semana (o null)
  const [loadingCreditos, setLoadingCreditos] = useState(true)
  const escritorio = useAnchoPanel() // desde 1024 px: diseño de escritorio; por debajo, el del celular
  const [errorCarga, setErrorCarga]           = useState(false)
  const [intento, setIntento]                 = useState(0) // sube al tocar "Reintentar"
  const [turnoFiltro, setTurnoFiltro]         = useState(null)
  const [idPlanAlumno]       = useState(null)
  const [vencimientoAbono, setVencimientoAbono] = useState(null)
  // mapa: `${idHorario}-${fechaISO}` → idReserva (solo reservas "proxima")
  const [reservasMap, setReservasMap]         = useState({})

  const storedUser = JSON.parse(localStorage.getItem("usuario") || "{}")

  const formatDate = (date) =>
    date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

  const toLocalDateStr = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const getDatesOfWeek = () => {
    const dates = []
    const startOfWeek = new Date(selectedDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getDatesOfWeek()

  const cargarReservas = async () => {
    try {
      const res = await apiClient.get('/reservas/mis-reservas')
      const lista = res.data?.data || res.data || []
      const mapa = {}
      lista.forEach(r => {
        if (r.estadoReserva === 'proxima') {
          const fecha = r.fechaReserva?.split('T')[0]
          mapa[`${r.idHorario}-${fecha}`] = r.idReserva
        }
      })
      setReservasMap(mapa)
    } catch {}
  }

  useEffect(() => {
    const fetchDatosIniciales = async () => {
      try {
        setPageLoading(true)
        setLoadingCreditos(true)
        setErrorCarga(false)

        // Solo las clases de los planes que el alumno tiene vigentes. El nombre del plan viene con cada clase:
        // la lista general de planes (/planes) requiere un permiso que el alumno no tiene y cortaba toda la carga.
        // Los créditos se cargan aparte: si falla la lista de clases, igual se ven los créditos del alumno.
        try {
          const responseClases = await apiClient.get('/clases/para-mi')
          const filas = responseClases.data?.data || responseClases.data || []
          setClasesOriginales(filas)
          const vistos = new Map()
          filas.forEach((c) => { if (c.idPlan && !vistos.has(c.idPlan)) vistos.set(c.idPlan, { idPlan: c.idPlan, nombre: c.nombrePlan }) })
          setPlanes([...vistos.values()])
        } catch (error) {
          console.error("No se pudo cargar la lista de clases:", error)
          setErrorCarga(true)
          toast.error("No se pudieron cargar las clases", { description: "Probá de nuevo en unos segundos." })
        }

        if (storedUser.idUsuario) {
          const responseAbonos = await apiClient.get(`/usuarios/${storedUser.idUsuario}/abonos`)
          const abonos = responseAbonos.data?.data || responseAbonos.data || []
          const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
          const abonoActivo = abonos.find(a => {
            if (a.estado !== 'ACTIVO') return false
            if (!a.vencimiento) return true
            const venc = new Date(a.vencimiento); venc.setHours(0, 0, 0, 0)
            return venc >= hoy
          })
          setCreditosReales(abonoActivo?.disponibles ?? 0)
          // El servidor ya filtra las clases por todos los planes vigentes del alumno: no se vuelve a filtrar por uno solo
          setVencimientoAbono(abonoActivo?.vencimiento ?? null)
        }

        await cargarReservas()
      } catch (error) {
        console.error("Error al inicializar la interfaz:", error)
        toast.error("No se pudieron cargar tus reservas y créditos", { description: "Probá recargar la página.", guardar: false })
      } finally {
        setPageLoading(false)
        setLoadingCreditos(false)
      }
    }
    fetchDatosIniciales()
  }, [intento])

  const clasesFiltradas = useMemo(() => {
    const diaIndex = selectedDate.getDay()
    const nombreDiaBuscado = mapaDiasBD[diaIndex]
    const fechaStr = toLocalDateStr(selectedDate)

    return clasesOriginales
      .filter(clase => {
        if (clase.estado !== 'Activo') return false
        if (clase.fechaEspecifica) {
          // Clase única: solo aparece el día exacto de su fecha
          const fechaUnica = clase.fechaEspecifica.split('T')[0]
          if (fechaUnica !== fechaStr) return false
        } else {
          // Clase recurrente: filtra por día de semana
          const diaClase = clase.dia ? clase.dia.toUpperCase().trim() : ""
          if (diaClase !== nombreDiaBuscado) return false
        }
        const hora = clase.horaInicio ? clase.horaInicio.substring(0, 5) : "00:00"
        if (turnoFiltro && !horaEnTurno(hora, turnoFiltro)) return false
        if (idPlanAlumno && clase.idPlan && clase.idPlan !== idPlanAlumno) return false
        return true
      })
      .map(clase => {
        const horaInicio = clase.horaInicio ? clase.horaInicio.substring(0, 5) : '00:00'
        const key = `${clase.idHorario}-${fechaStr}`
        const idReserva = reservasMap[key] ?? null
        return {
          id: clase.idHorario,
          idClase: clase.idClase,
          idPlan: clase.idPlan ?? null,
          tipo: clase.nombrePlan || null,
          nombre: clase.nombreClase,
          hora: horaInicio,
          horaFin: clase.horaFin ? clase.horaFin.substring(0, 5) : null,
          duracion: clase.horaFin ? `${calcularDuracion(clase.horaInicio, clase.horaFin)} min` : '60 min',
          coach: clase.nombreProfesor || "Staff Bravos",
          cuposDisponibles: clase.cupoDisponible ?? 0,
          cuposTotales: clase.cupoMaximo ?? 15,
          descripcion: clase.descripcion || clase.rutina?.descripcion || '',
          rutina: clase.rutina?.ejercicios || clase.rutina || '',
          publicarEn: clase.rutina?.publicarEn || clase.publicarEn || null,
          reservado: idReserva !== null,
          idReserva,
        }
      })
  }, [selectedDate, clasesOriginales, turnoFiltro, idPlanAlumno, reservasMap])

  const horasDelDia = useMemo(() => clasesOriginales
    .filter((c) => claseEsDelDia(c, selectedDate, idPlanAlumno))
    .map((c) => (c.horaInicio ? c.horaInicio.substring(0, 5) : "00:00")),
  [clasesOriginales, selectedDate, idPlanAlumno])

  const clasesAgrupadas = useMemo(() => {
    const grupos = {}
    planes.forEach(plan => { grupos[plan.idPlan] = { plan, clases: [] } })
    grupos['sin-plan'] = { plan: { nombre: 'Clases Generales', idPlan: null }, clases: [] }

    clasesFiltradas.forEach(clase => {
      const key = clase.idPlan ?? 'sin-plan'
      if (grupos[key]) grupos[key].clases.push(clase)
      else grupos['sin-plan'].clases.push(clase)
    })

    return Object.entries(grupos)
      .filter(([, g]) => g.clases.length > 0)
      .map(([key, g]) => ({ key, ...g }))
  }, [planes, clasesFiltradas])

  const handleReservar = async () => {
    if (!selectedClass) return
    if (creditosReales <= 0) {
      toast.error("Sin créditos disponibles", { description: "No tenés créditos disponibles para completar la acción." })
      setConfirmDialog(false)
      return
    }
    setIsLoading(true)
    try {
      const fechaFormateada = toLocalDateStr(selectedDate)
      const response = await apiClient.post('/reservas', {
        idHorario: selectedClass.id,
        fechaReserva: fechaFormateada
      })
      if (response.data?.success) {
        const idReservaNueva = response.data?.data?.idReserva
        if (escritorio) toast.success(`Listo, reservaste ${selectedClass.nombre} a las ${selectedClass.hora}.`, { guardar: false, enlace: { to: "/alumno/reservas", texto: "Ver mis reservas" } })
        else toast.success("¡Reserva confirmada!", { description: `${selectedClass.nombre} a las ${selectedClass.hora}`, guardar: false })
        setCreditosReales(prev => prev - 1)
        window.dispatchEvent(new CustomEvent("bravos:reservas-cambiaron")) // el contador de la semana se vuelve a pedir
        // Actualización optimista inmediata
        const key = `${selectedClass.id}-${fechaFormateada}`
        setReservasMap(prev => ({ ...prev, [key]: idReservaNueva }))
        await cargarReservas()
        window.dispatchEvent(new CustomEvent('bravos:reserva-creada')) // la barra de abajo marca dónde ver la reserva
      }
    } catch (error) {
      toast.error("Error de Reserva", { description: error.response?.data?.message || "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
      setConfirmDialog(false)
      setSelectedClass(null)
    }
  }

  const handleCancelar = async () => {
    const { clase } = cancelDialog
    if (!clase?.idReserva) return
    setIsLoading(true)
    try {
      await apiClient.patch(`/reservas/${clase.idReserva}/cancelar`)
      // Con créditos por semana cancelar no devuelve el crédito (cuenta para los de esa semana)
      const devuelveCredito = !semana && puedeCancelar(selectedDate, clase.hora)
      if (semana) {
        toast.warning("Reserva cancelada", { description: "En tu plan el crédito no se devuelve al cancelar: cuenta para los de la semana.", guardar: false })
      } else if (devuelveCredito) {
        toast.success("Reserva cancelada", { description: "Tu crédito fue devuelto.", guardar: false })
        setCreditosReales(prev => prev + 1)
      } else {
        toast.warning("Reserva cancelada", { description: "El crédito no fue devuelto porque cancelaste con menos de 2 horas de anticipación.", guardar: false })
      }
      await cargarReservas()
      window.dispatchEvent(new CustomEvent('bravos:reservas-cambiaron'))
    } catch (error) {
      toast.error("Error al cancelar", { description: error.response?.data?.message || "Ocurrió un error inesperado." })
    } finally {
      setIsLoading(false)
      setCancelDialog({ open: false, clase: null })
    }
  }

  // Para la fila de días del celular: ¿ese día tiene clases del plan del alumno?
  const hayClasesEn = (d) => clasesOriginales.some(c => claseEsDelDia(c, d, idPlanAlumno))

  // "Ver próximos días disponibles": salta al siguiente día con clases (hasta 4 semanas) y quita el filtro de turno
  const irAProximoDiaConClases = () => {
    const d = new Date(selectedDate)
    for (let i = 1; i <= 28; i++) {
      d.setDate(d.getDate() + 1)
      if (clasesOriginales.some(c => claseEsDelDia(c, d, idPlanAlumno))) {
        setTurnoFiltro(null)
        setSelectedDate(new Date(d))
        return
      }
    }
    toast.info("No hay clases programadas en las próximas 4 semanas")
  }

  const nombrePlan = (idPlan) => planes.find(p => p.idPlan === idPlan)?.nombre || null

  if (escritorio) {
    return (
      <ReservarEscritorio
        creditos={creditosReales}
        cargandoCreditos={loadingCreditos}
        semana={semana}
        errorCarga={errorCarga}
        onReintentar={() => setIntento((n) => n + 1)}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        weekDates={weekDates}
        hayClasesEn={hayClasesEn}
        turnos={TURNOS}
        turnoFiltro={turnoFiltro}
        setTurnoFiltro={setTurnoFiltro}
        horasDelDia={horasDelDia}
        grupos={clasesAgrupadas}
        cargando={pageLoading}
        puedeReservar={puedeReservar}
        esDeHoy={esDeHoy}
        puedeCancelar={puedeCancelar}
        rutinaPublicada={rutinaPublicada}
        fechaPublicacion={formatearFechaPublicacion}
        onReservar={(clase) => { setSelectedClass(clase); setConfirmDialog(true) }}
        onCancelar={(clase) => setCancelDialog({ open: true, clase })}
        irAProximoDiaConClases={irAProximoDiaConClases}
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        selectedClass={selectedClass}
        handleReservar={handleReservar}
        cancelDialog={cancelDialog}
        setCancelDialog={setCancelDialog}
        handleCancelar={handleCancelar}
        isLoading={isLoading}
      />
    )
  }

  return (
    <>
      {/* CELULAR: diseño propio (ReservarMovil.jsx) */}
      <div>
        <ReservarMovilNuevo
          creditos={creditosReales}
          semana={semana}
          cargandoCreditos={loadingCreditos}
          vencimiento={vencimientoAbono}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          hayClasesEn={hayClasesEn}
          turnos={TURNOS}
          turnoFiltro={turnoFiltro}
          setTurnoFiltro={setTurnoFiltro}
          clases={[...clasesFiltradas].sort((a, b) => a.hora.localeCompare(b.hora))}
          nombrePlan={nombrePlan}
          cargando={pageLoading}
          puedeReservar={puedeReservar}
          esDeHoy={esDeHoy}
          puedeCancelar={puedeCancelar}
          rutinaPublicada={rutinaPublicada}
          fechaPublicacion={formatearFechaPublicacion}
          onReservar={(clase) => { setSelectedClass(clase); setConfirmDialog(true) }}
          onCancelar={(clase) => setCancelDialog({ open: true, clase })}
          irAProximoDiaConClases={irAProximoDiaConClases}
        />
      </div>

      {/* DIÁLOGO CONFIRMAR RESERVA (lo usan las dos versiones) */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>¿Confirmás la reserva de esta clase?</DialogDescription>
          </DialogHeader>
          {selectedClass && (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-semibold text-foreground">{selectedClass.nombre}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(selectedDate)} a las {selectedClass.hora}
              </p>
              <p className="text-sm text-muted-foreground">Coach: {selectedClass.coach}</p>
            </div>
          )}
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />
            <AlertDescription className="text-yellow-700/80 dark:text-yellow-500/80">
              {semana ? `Se descontará 1 crédito. En tu plan podés reservar hasta ${semana.porSemana} clases por semana y cancelar no devuelve el crédito.` : "Se descontará 1 crédito. Si cancelás con menos de 2 horas de anticipación, el crédito no se devuelve."}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleReservar}
              disabled={isLoading || creditosReales === 0}
              className="bg-lime-400 text-black hover:bg-lime-300"
            >
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Reservando...</>
                : "Confirmar Reserva"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO CANCELAR RESERVA */}
      <Dialog open={cancelDialog.open} onOpenChange={open => !open && setCancelDialog({ open: false, clase: null })}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive">Cancelar Reserva</DialogTitle>
            <DialogDescription>¿Seguro que querés cancelar esta reserva?</DialogDescription>
          </DialogHeader>
          {cancelDialog.clase && (
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-semibold text-foreground">{cancelDialog.clase.nombre}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {formatDate(selectedDate)} a las {cancelDialog.clase.hora}
              </p>
            </div>
          )}
          {!semana && cancelDialog.clase && puedeCancelar(selectedDate, cancelDialog.clase.hora) ? (
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500" />
              <AlertDescription className="text-green-700/80 dark:text-green-500/80">
                Cancelás con más de 2 horas de anticipación. Tu crédito será devuelto.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertCircle className="h-4 w-4 text-red-700 dark:text-red-500" />
              <AlertDescription className="text-red-700/80 dark:text-red-500/80">
                {semana ? <>En tu plan, cancelar <strong>no</strong> devuelve el crédito: cuenta para los de esta semana.</> : <>Faltan menos de 2 horas para la clase. El crédito <strong>no</strong> será devuelto.</>}
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialog({ open: false, clase: null })}>Volver</Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={isLoading}
            >
              {isLoading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelando...</>
                : "Confirmar cancelación"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
