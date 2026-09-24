import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Send, X } from "lucide-react"
import BravoAvatar from "@/components/BravoAvatar"
import { mascotaDeHoy } from "@/lib/mascotas"
import { responder } from "@/lib/bravoRespuestas"

// Las respuestas salen de lib/bravoRespuestas.js (hoy nivel 1: preguntas frecuentes; luego IA).
const SUGERENCIAS = {
  alumno: ["¿Cuántos créditos me quedan?", "¿Qué clases hay hoy?", "¿Cómo reservo una clase?", "¿Cómo pago mi cuota?"],
  profesor: ["¿Cómo tomo asistencia?", "¿Cómo cargo una rutina?", "Perdí mi contraseña", "¿Cómo cambio a modo oscuro?"],
  admin: ["¿Cómo cargo un abono?", "¿Cómo apruebo un comprobante?", "¿Cómo creo una clase?", "¿Cómo doy permisos a un perfil?"],
}

const bienvenida = (nombre, rol) => ({
  id: 0,
  de: "bravo",
  texto: `Soy ${nombre} 🐾 Tu asistente de Bravos Box. Preguntame lo que necesites con tus propias palabras y te ayudo: cómo usar el sistema, tus créditos, tu membresía, los horarios y mucho más.`,
  sugerencias: SUGERENCIAS[rol] || SUGERENCIAS.alumno,
})

// Ciclo del globito de saludo (ms): aparece a los 5 s, se queda un rato, se va,
// y vuelve a aparecer cada 10 s mientras el chat esté cerrado.
const GLOBO_PRIMERA_VEZ = 5000
const GLOBO_VISIBLE = 6000
const GLOBO_OCULTO = 10000

export default function BravoChat({ rol = "alumno" }) {
  // La mascota se elige al cargar según el día de la semana (ver lib/mascotas.js)
  const [mascota] = useState(() => mascotaDeHoy())
  const [abierto, setAbierto] = useState(false)
  const navigate = useNavigate()
  const [mensajes, setMensajes] = useState(() => [bienvenida(mascota.nombre, rol)])
  const [texto, setTexto] = useState("")
  const [escribiendo, setEscribiendo] = useState(false)
  const [globo, setGlobo] = useState(false)
  const [globoHover, setGloboHover] = useState(false)
  const [globoDescartado, setGloboDescartado] = useState(false)
  const finRef = useRef(null)
  const inputRef = useRef(null)
  const idRef = useRef(1)
  const timerRef = useRef(null)
  const ventanaRef = useRef(null)
  const botonRef = useRef(null)

  // Baja al último mensaje cada vez que hay uno nuevo
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [mensajes, escribiendo, abierto])

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 250)
  }, [abierto])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Globito de saludo: aparece, se va y vuelve a aparecer en ciclo. Se pausa con el chat abierto
  // y se corta del todo si el alumno lo cierra con la ✕. Pasar el mouse por la mascota lo muestra igual.
  useEffect(() => {
    if (globoDescartado || abierto) return
    let timer
    const mostrar = () => { setGlobo(true); timer = setTimeout(ocultar, GLOBO_VISIBLE) }
    const ocultar = () => { setGlobo(false); timer = setTimeout(mostrar, GLOBO_OCULTO) }
    timer = setTimeout(mostrar, GLOBO_PRIMERA_VEZ)
    return () => { clearTimeout(timer); setGlobo(false) }
  }, [globoDescartado, abierto])

  // Cierra al tocar fuera de la ventana (y del botón flotante) o con Esc
  useEffect(() => {
    if (!abierto) return
    const fuera = (e) => {
      if (ventanaRef.current?.contains(e.target) || botonRef.current?.contains(e.target)) return
      setAbierto(false)
    }
    const tecla = (e) => { if (e.key === "Escape") setAbierto(false) }
    document.addEventListener("mousedown", fuera)
    document.addEventListener("touchstart", fuera)
    document.addEventListener("keydown", tecla)
    return () => {
      document.removeEventListener("mousedown", fuera)
      document.removeEventListener("touchstart", fuera)
      document.removeEventListener("keydown", tecla)
    }
  }, [abierto])

  const cerrarGlobo = () => {
    setGlobo(false)
    setGloboHover(false)
    setGloboDescartado(true)
  }

  const alternarChat = () => {
    setGlobo(false)
    setGloboHover(false)
    setAbierto((v) => !v)
  }

  const globoVisible = (globo || globoHover) && !abierto

  const nombreUsuario = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("usuario") || "{}")
      return u.nombrecompleto || u.nombre || ""
    } catch {
      return ""
    }
  })()

  const enviar = async (contenido) => {
    const limpio = contenido.trim()
    if (!limpio || escribiendo) return
    setMensajes((prev) => [...prev, { id: idRef.current++, de: "usuario", texto: limpio }])
    setTexto("")
    setEscribiendo(true)
    // Mínimo de espera para que se note que "escribe", aunque la respuesta sea inmediata
    const [respuesta] = await Promise.all([
      responder(limpio, { rol, nombre: nombreUsuario, mascota: mascota.nombre }),
      new Promise((r) => { timerRef.current = setTimeout(r, 750) }),
    ])
    setMensajes((prev) => [...prev, { id: idRef.current++, de: "bravo", ...respuesta }])
    setEscribiendo(false)
  }

  const irA = (ruta) => {
    setAbierto(false)
    navigate(ruta)
  }


  return (
    <>
      <style>{`
        @keyframes bravoDot { 0%, 60%, 100% { transform: translateY(0); opacity: .4 } 30% { transform: translateY(-4px); opacity: 1 } }
        @keyframes bravoGloboIn { from { opacity: 0; transform: translateX(12px) scale(.9) } to { opacity: 1; transform: none } }
        @keyframes bravoMsg { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @media (prefers-reduced-motion: reduce) { .bravo-anim { animation: none !important; transition: none !important } }
      `}</style>

      {/* Ventana del chat: el contenedor no recorta, así Bravo puede asomarse por arriba del marco */}
      <div
        ref={ventanaRef}
        role="dialog"
        aria-label={`Chat con ${mascota.nombre}`}
        aria-hidden={!abierto}
        className={`bravo-anim fixed z-40 right-4 bottom-[8.5rem] lg:bottom-[5.25rem] w-[320px] max-w-[calc(100vw-2rem)] h-[440px] max-h-[calc(100vh-14rem)] origin-bottom-right transition-all duration-300 ease-out ${
          abierto ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-4 pointer-events-none"
        }`}
      >
        {/* La mascota apoyada sobre el borde superior de la ventana, con las patas colgando hacia adentro.
            Las imágenes y su posición salen de lib/mascotas.js (Bravo: camiseta negra en modo claro,
            blanca en modo oscuro; el borde que agarra está al 87 % de la altura de la imagen). */}
        {mascota.ventana.imagenes.map(({ src, tema }) => (
          <img
            key={src}
            src={src}
            alt={mascota.nombre}
            draggable={false}
            className={`${tema} bravo-anim pointer-events-none select-none absolute left-1/2 z-20 drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] transition-all duration-500 ease-[cubic-bezier(.2,.9,.3,1.25)] ${
              abierto ? "translate-y-0 scale-100 opacity-100 delay-150" : "translate-y-8 scale-75 opacity-0"
            }`}
            style={mascota.ventana.ajuste}
          />
        ))}

        <div className="absolute inset-0 z-10 flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Encabezado */}
        <div className="relative shrink-0 border-b border-border bg-sidebar pt-[18px] pb-2.5 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-sidebar-foreground leading-tight">
            {mascota.nombre}
            {/* Circulito verde de "conectado": pulso suave, se detiene con la opción de reducir animaciones */}
            <span className="relative flex h-2 w-2" role="img" aria-label="En línea">
              <span className="bravo-anim absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-500 dark:bg-lime-400" />
            </span>
          </p>
          <p className="text-[11px] text-sidebar-foreground/50">Asistente de Bravos Box</p>
          <button
            onClick={() => setAbierto(false)}
            aria-label="Cerrar chat"
            className="absolute top-1.5 right-1.5 p-2.5 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {mensajes.map((m, i) => {
            const esUltimo = i === mensajes.length - 1
            return (
              <div key={m.id} className="bravo-anim" style={{ animation: "bravoMsg 0.25s ease-out both" }}>
                <div className={`flex items-end gap-2 ${m.de === "usuario" ? "justify-end" : "justify-start"}`}>
                  {m.de === "bravo" && <BravoAvatar size={28} src={mascota.avatar} nombre={mascota.nombre} className="shrink-0 rounded-full" />}
                  <div
                    className={`max-w-[85%] px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line ${
                      m.de === "usuario"
                        ? "bg-lime-400 text-black rounded-2xl rounded-br-sm font-medium"
                        : "bg-muted text-foreground rounded-2xl rounded-bl-sm"
                    }`}
                  >
                    {m.texto}
                  </div>
                </div>

                {m.enlaces?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 pl-9">
                    {m.enlaces.map((l) => (
                      <button
                        key={l.ruta}
                        onClick={() => irA(l.ruta)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-lime-400 hover:bg-lime-300 text-black px-3 py-1.5 rounded-full transition-colors"
                      >
                        {l.texto}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}

                {esUltimo && !escribiendo && m.sugerencias?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 pl-9">
                    {m.sugerencias.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => enviar(sug)}
                        className="text-xs font-semibold border border-lime-500/40 dark:border-lime-400/40 text-lime-700 dark:text-lime-400 px-3 py-1.5 rounded-full hover:bg-lime-400/10 transition-colors text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {escribiendo && (
            <div className="flex items-end gap-2">
              <BravoAvatar size={28} src={mascota.avatar} nombre={mascota.nombre} className="shrink-0 rounded-full" />
              <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-3 flex gap-1" aria-label={`${mascota.nombre} está escribiendo`}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="bravo-anim h-1.5 w-1.5 rounded-full bg-foreground/60"
                    style={{ animation: `bravoDot 1s ease-in-out ${i * 0.15}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}


          <div ref={finRef} />
        </div>

        {/* Entrada */}
        <form
          onSubmit={(e) => { e.preventDefault(); enviar(texto) }}
          className="flex items-center gap-2 px-3 py-3 border-t border-border bg-card"
        >
          <input
            ref={inputRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={300}
            placeholder={`Escribile a ${mascota.nombre}...`}
            className="flex-1 min-w-0 bg-background border border-border rounded-full px-4 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-lime-500 dark:focus:border-lime-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!texto.trim() || escribiendo}
            aria-label="Enviar"
            className="shrink-0 h-9 w-9 rounded-full bg-lime-400 hover:bg-lime-300 text-black flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        </div>
      </div>

      {/* Globito de saludo */}
      {globoVisible && (
        <div
          className="bravo-anim fixed z-40 right-[4.6rem] bottom-[4.6rem] lg:bottom-[1.1rem] max-w-[200px]"
          style={{ animation: "bravoGloboIn 0.35s cubic-bezier(.2,.9,.3,1.2) both" }}
        >
          <div className="relative rounded-2xl rounded-br-sm bg-card border border-lime-400/50 shadow-lg pl-3.5 pr-7 py-2">
            <button
              onClick={() => { setAbierto(true); setGlobo(false); setGloboHover(false) }}
              className="text-left text-[13px] font-semibold text-foreground leading-snug"
            >
              Soy {mascota.nombre} 🐾 ¿Te ayudo con algo?
            </button>
            <button
              onClick={cerrarGlobo}
              aria-label="Cerrar mensaje"
              className="absolute top-1.5 right-1.5 p-1 text-foreground/40 hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {/* colita que apunta al botón */}
            <span className="absolute -right-[7px] bottom-3 h-3 w-3 rotate-45 bg-card border-t border-r border-lime-400/50" />
          </div>
        </div>
      )}

      {/* Botón flotante: círculo verde con la mascota apoyada; la cabeza asoma por arriba del círculo */}
      <button
        ref={botonRef}
        onClick={alternarChat}
        onMouseEnter={() => setGloboHover(true)}
        onMouseLeave={() => setGloboHover(false)}
        onFocus={() => setGloboHover(true)}
        onBlur={() => setGloboHover(false)}
        aria-label={abierto ? `Cerrar chat con ${mascota.nombre}` : `Abrir chat con ${mascota.nombre}`}
        className="group bravo-anim fixed z-40 right-4 bottom-20 lg:bottom-6 h-[52px] w-[52px] rounded-full outline-none focus:outline-none focus-visible:outline-none transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        <span className="absolute inset-0 rounded-full bg-lime-400 shadow-lg ring-0 group-focus-visible:ring-2 group-focus-visible:ring-lime-200" />
        {abierto ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <X className="h-5 w-5 text-black" />
          </span>
        ) : (
          // El recorte sigue la forma del círculo (mitad de abajo redondeada) pero deja libre todo lo de
          // arriba: así la cabeza asoma y los hombros no se salen por las esquinas de abajo.
          <span
            className="absolute inset-0 block"
            style={{ clipPath: "path('M 0 -60 H 52 V 26 A 26 26 0 0 1 0 26 Z')" }}
          >
            {mascota.boton.imagenes.map(({ src, tema }) => (
              <img
                key={src}
                src={src}
                alt=""
                draggable={false}
                className={`${tema} absolute max-w-none select-none pointer-events-none`}
                style={mascota.boton.ajuste}
              />
            ))}
          </span>
        )}
      </button>
    </>
  )
}
