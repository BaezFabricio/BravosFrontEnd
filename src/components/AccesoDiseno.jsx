import { useRef } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { ARCH, BIG, COLOR, MONO } from "@/lib/accesoEstilos"

/*
 * Diseño de Login y Registro ("legajo"): paneles de fotos, ficha con grilla de campos y botón estarcido.
 * Colores, tipografías y medidas del archivo de diseño entregado (Bravos Acceso), que está medido sobre 1280×880.
 *
 * Escala: la raíz define --u = min(100vw / 1280, 100vh / 880) y cada medida del diseño es calc(N * var(--p)).
 * --p vale --u desde 900 px de ancho (el diseño se ve igual en cualquier pantalla) y 1px por debajo (celular, sin escalar).
 * Los títulos son <div role="heading"> porque una regla global fuerza otra tipografía en h1/h2/h3.
 */
const P = (n) => `calc(${n} * var(--p))`

const ESTILOS = `
.acc-escala { --p: 1px; }
@media (min-width: 900px) { .acc-escala { --p: var(--u, 1px); } }

.acc-raiz { min-height: 100vh; }
@media (min-width: 900px) { .acc-raiz { display: flex; height: 100vh; min-height: 0; overflow: hidden; } }
.acc-panel { display: none; position: relative; }
@media (min-width: 900px) { .acc-panel { display: block; flex: none; height: 100vh; width: calc(640 * var(--u)); } }

.acc-col { position: relative; min-height: 100vh; padding: 16px 24px 32px; background: ${COLOR.form}; }
@media (min-width: 900px) { .acc-col { flex: 1; min-width: 0; min-height: 0; height: 100%; padding: 0 ${P(64)}; } }
.acc-wrap { width: 100%; max-width: 540px; margin: 0 auto; }
@media (min-width: 900px) { .acc-wrap { max-width: none; width: ${P(512)}; } }

.acc-volver { display: none; position: absolute; right: ${P(40)}; top: ${P(32)}; align-items: center; gap: ${P(8)}; border-radius: 4px; font-size: ${P(12)}; letter-spacing: .14em; text-transform: uppercase; transition: color .15s; }
.acc-volver:hover { color: ${COLOR.tinta}; }
@media (min-width: 900px) { .acc-volver { display: inline-flex; } }

.acc-ficha { position: relative; border: ${P(1)} solid #4a4e3f; border-radius: ${P(16)}; padding: ${P(24)} ${P(30)}; margin-top: var(--mt-movil); }
@media (max-width: 420px) { .acc-ficha { padding-left: 20px; padding-right: 20px; } }
@media (min-width: 900px) { .acc-ficha { margin-top: ${P("var(--mt)")}; } }
.acc-flota { transition: transform .25s ease-out; will-change: transform; transform: translateY(-4px); }
.acc-flota:hover { transition: transform .08s linear; }
@keyframes acc-perro { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.acc-perro { position: absolute; left: ${P(30)}; top: ${P(-96)}; width: ${P(110)}; max-width: none; pointer-events: none; user-select: none; animation: acc-perro .6s cubic-bezier(.22,1.2,.36,1) .35s both; }
@media (prefers-reduced-motion: reduce) { .acc-perro { animation: none; } .acc-flota { transition: none; } }

.acc-tags { display: flex; justify-content: space-between; padding-bottom: ${P(12)}; font-size: ${P(10.5)}; letter-spacing: .16em; border-bottom: ${P(1)} dashed ${COLOR.linea}; }
.acc-titulo { margin: ${P(16)} 0 ${P(4)}; font-size: 2.4rem; line-height: .9; text-transform: uppercase; }
@media (min-width: 900px) { .acc-titulo { font-size: ${P(54)}; } }
.acc-sub { margin-bottom: ${P(18)}; font-size: ${P(14)}; }

.acc-grilla { display: grid; grid-template-columns: 1fr 1fr; overflow: hidden; border: ${P(1)} solid ${COLOR.linea}; border-radius: ${P(12)}; }
.acc-celda { position: relative; margin: ${P(-0.5)}; border: ${P(1)} solid ${COLOR.linea}; padding: ${P(8)} ${P(12)} ${P(6)}; transition: border-color .15s; }
.acc-celda:focus-within { z-index: 10; border-color: ${COLOR.lima} !important; }
.acc-cab { display: flex; align-items: center; justify-content: space-between; gap: ${P(12)}; }
.acc-label { font-size: ${P(9.5)}; letter-spacing: .16em; text-transform: uppercase; }
.acc-enlace { font-size: ${P(11)}; font-weight: 500; color: ${COLOR.lima}; }
.acc-enlace:hover { text-decoration: underline; }
.acc-input { display: block; width: 100%; background: transparent; padding: ${P(4)} 0; font-size: ${P(16)}; font-weight: 500; color: ${COLOR.tinta}; outline: none; }
.acc-input::placeholder { color: #6b705e; }
.acc-error { padding: ${P(2)} 0; font-size: ${P(11)}; color: ${COLOR.error}; }
.acc-icono { width: ${P(16)}; height: ${P(16)}; }
.acc-fila { display: flex; align-items: center; gap: ${P(8)}; }

.acc-boton { display: flex; width: 100%; align-items: center; justify-content: center; gap: ${P(12)}; margin-top: ${P(18)}; border-radius: ${P(12)}; padding: ${P(12)}; font-size: ${P(26)}; letter-spacing: .12em; text-transform: uppercase;
  background: ${COLOR.lima}; color: ${COLOR.base}; box-shadow: 0 ${P(8)} ${P(20)} ${P(-6)} rgba(155,230,0,.45); transition: background-color .15s; }
.acc-boton:hover { background: ${COLOR.limaHover}; }
.acc-boton:focus-visible { outline: 2px solid ${COLOR.limaHover}; outline-offset: 2px; }
.acc-boton:disabled { cursor: not-allowed; opacity: .7; }
.acc-pie { margin-top: ${P(18)}; font-size: ${P(13)}; }

.acc-pista { display: flex; align-items: flex-start; gap: ${P(12)}; margin-bottom: ${P(16)}; padding: ${P(12)}; border: ${P(1)} solid ${COLOR.lima}; border-radius: ${P(12)}; background: rgba(155,230,0,.08); font-size: ${P(14)}; line-height: 1.35; }
.acc-reglas { display: grid; grid-template-columns: 1fr 1fr; gap: ${P(4)} ${P(16)}; margin-top: ${P(12)}; font-size: ${P(11)}; }
.acc-check { margin-top: ${P(14)}; }
.acc-check label { display: flex; align-items: flex-start; gap: ${P(10)}; cursor: pointer; font-size: ${P(11)}; line-height: 1.5; }
.acc-check input { width: ${P(16)}; height: ${P(16)}; margin-top: 2px; flex-shrink: 0; cursor: pointer; accent-color: ${COLOR.lima}; }
.acc-aviso { margin-top: ${P(6)}; font-size: ${P(11)}; color: ${COLOR.error}; }
`

export function EstilosAcceso() {
  return <style>{ESTILOS}</style>
}

// Foto en blanco y negro con tinte verde oliva (se usa como fondo CSS: en celular el panel no se muestra y no se descarga)
function Foto({ src, posicion = "50% 50%", filtro = "grayscale(1) contrast(1.05)", style = {}, oliva = 1, mascara }) {
  return (
    <div className="absolute inset-0" style={style}>
      <div className="absolute inset-0" style={{ backgroundImage: `url('${src}')`, backgroundSize: "cover", backgroundPosition: posicion, filter: filtro, WebkitMaskImage: mascara, maskImage: mascara }} />
      {oliva > 0 && <div className="absolute inset-0" style={{ background: "#4a5626", mixBlendMode: "multiply", opacity: oliva }} />}
    </div>
  )
}

function Marca() {
  return (
    <Link to="/inicio" aria-label="Ir a la página principal" className="absolute z-10 flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9be600]" style={{ left: P(36), top: P(30), gap: P(14) }}>
      <img src="/acceso/brvs.png" alt="" style={{ width: P(44), height: P(44), borderRadius: P(8) }} />
      <span className="uppercase" style={{ ...BIG, color: COLOR.lima, fontSize: P(20), letterSpacing: ".3em" }}>Bravos Box</span>
    </Link>
  )
}

function Titular({ a, b, abajo }) {
  return (
    <div role="heading" aria-level={1} className="absolute uppercase" style={{ ...BIG, color: COLOR.tinta, fontSize: P(74), lineHeight: 0.92, maxWidth: P(430), left: P(36), bottom: abajo }}>
      {a} <span style={{ color: COLOR.lima }}>{b}</span>
    </div>
  )
}

export function Cinta({ className = "", style = {}, chica = false }) {
  return (
    <div className={`flex items-center whitespace-nowrap ${className}`}
      style={{ ...BIG, gap: chica ? 14 : P(14), background: COLOR.lima, color: COLOR.base, fontSize: chica ? 15 : P(20), letterSpacing: ".14em", boxShadow: chica ? "0 6px 20px rgba(0,0,0,.4)" : `0 ${P(6)} ${P(20)} rgba(0,0,0,.4)`, ...style }}>
      <span aria-hidden="true">✦</span>
      <span className="uppercase">Empieza aunque no sepas lo que viene</span>
      <span aria-hidden="true">✦</span>
    </div>
  )
}

const DEGRADADO_DERECHO = (
  <div className="pointer-events-none absolute bottom-0 right-0 top-0" style={{ width: P(110), background: `linear-gradient(90deg, rgba(14,16,10,0), ${COLOR.form})` }} />
)

/** Panel de fotos del login: soldados arriba, atleta y grupo abajo y la cinta cruzando */
export function PanelLogin() {
  return (
    <div className="relative grid h-full grid-cols-2 overflow-hidden" style={{ background: COLOR.base, gap: P(4), gridTemplateRows: `min(${P(360)}, 40%) minmax(0, 1fr)` }}>
      <div className="relative col-span-2 overflow-hidden">
        <Foto src="/acceso/hero.jpg" posicion="50% 15%" filtro="grayscale(1) contrast(1.1) brightness(.95)" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(11,12,9,.7), transparent 55%)" }} />
        <Marca />
        <Titular a="Nadie entrena" b="solo." abajo={P(86)} />
      </div>
      {/* Fila de abajo: el atleta se ve completo (alto 100 %, ancho según su proporción) y el grupo ocupa el resto */}
      <div className="col-span-2" style={{ position: "relative", overflow: "hidden", display: "flex", height: "100%", minHeight: 0 }}>
        <img src="/acceso/hookgrip-c.jpg" alt=""
          style={{ flex: "none", height: "100%", width: "auto", aspectRatio: "873/1140", objectFit: "contain", objectPosition: "left top", position: "relative", zIndex: 1,
            filter: "grayscale(1) contrast(1.05) brightness(.9)",
            WebkitMaskImage: "linear-gradient(90deg,#000 88%,transparent)", maskImage: "linear-gradient(90deg,#000 88%,transparent)" }} />
        <img src="/acceso/grupo-c.jpg" alt=""
          style={{ flex: 1, minWidth: 0, height: "100%", marginLeft: -40, objectFit: "cover", objectPosition: "40% 75%", filter: "grayscale(1) contrast(1.1) brightness(1.15)" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "#4a5626", mixBlendMode: "multiply", opacity: 0.6, pointerEvents: "none" }} />
      </div>
      <Cinta className="absolute z-[3]" style={{ left: P(-40), width: "max-content", top: `calc(min(${P(360)}, 40%) - ${P(50)})`, padding: `${P(9)} ${P(40)} ${P(9)} ${P(76)}`, transform: "rotate(-2.5deg)", transformOrigin: "left center" }} />
      {DEGRADADO_DERECHO}
    </div>
  )
}

/** Panel de foto del registro: el atleta a pantalla completa, el detalle de Malvinas y el titular */
export function PanelRegistro() {
  return (
    <div className="relative h-full overflow-hidden" style={{ background: COLOR.base }}>
      <Foto src="/acceso/hookgrip-c.jpg" posicion="50% 15%" filtro="grayscale(1) contrast(1.1) brightness(.85)" />
      <div className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(11,12,9,.95) 0%, rgba(11,12,9,.2) 45%, rgba(11,12,9,.55) 100%)" }} />
      <Marca />
      <div className="absolute flex items-center" style={{ right: P(36), top: P(32), gap: P(10) }}>
        <img src="/acceso/malvinas.png" alt="" style={{ width: P(84), filter: "saturate(.8)" }} />
        <span className="tracking-[0.16em]" style={{ ...MONO, fontSize: P(10), lineHeight: 1.6 }}>
          <span style={{ color: COLOR.tinta }}>MALVINAS</span><br /><span style={{ color: COLOR.lima }}>51°41′S</span>
        </span>
      </div>
      <Titular a="Sumate al" b="equipo." abajo={P(40)} />
      {DEGRADADO_DERECHO}
    </div>
  )
}

/**
 * Estructura de la pantalla: panel de fotos a la izquierda (desde 900 px) y formulario a la derecha, 50/50 y alto 100vh.
 * En celular no hay fotos: arriba va "Volver", la marca y el titular que se pasa en `movil`.
 */
export function PantallaAcceso({ panel, volver, movil, children }) {
  return (
    <div className="acc-escala acc-raiz text-[#ecefe4]" style={{ ...ARCH, background: COLOR.form, "--u": "min(100vh / 880, 100vw / 1280)" }}>
      <EstilosAcceso />
      <div className="acc-panel">{panel}</div>

      <div className="acc-col">
        {/* Volver — computadora */}
        <button type="button" onClick={volver} className="acc-volver focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9be600]" style={{ ...MONO, color: COLOR.apagado }}>
          ← Volver al sitio
        </button>

        {/* Encabezado — celular */}
        <div className="-mx-6 mb-5 flex items-center justify-between border-b px-4 py-2.5 min-[900px]:hidden" style={{ borderColor: COLOR.linea }}>
          <button type="button" onClick={volver}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9be600]"
            style={{ borderColor: COLOR.linea, color: COLOR.tinta }}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver
          </button>
          <Link to="/inicio" aria-label="Ir a la página principal" className="flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9be600]">
            <img src="/acceso/brvs.png" alt="" className="h-7 w-7 rounded-md" />
            <span className="text-[15px] uppercase tracking-[0.3em]" style={{ ...BIG, color: COLOR.lima }}>Bravos Box</span>
          </Link>
          <span className="w-[88px]" aria-hidden="true" />
        </div>
        <div className="min-[900px]:hidden">{movil}</div>

        <div className="acc-wrap">{children}</div>
      </div>
    </div>
  )
}

/**
 * Ficha: caja con el perro asomado, rótulos, título estarcido y subtítulo.
 * `margenSuperior` es el margen en celular (px); `arriba` es dónde queda la ficha en el diseño de 1280×880.
 */
export function Ficha({ margenSuperior = 100, arriba = 300, tagIzq, tagDer, titulo, subtitulo, children }) {
  const ref = useRef(null)
  // Efecto flotante: la ficha se inclina un poco hacia donde está el cursor
  const inclinar = (e) => {
    const el = ref.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width - 0.5
    const y = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(1100px) rotateX(${(-y * 4).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg) translateY(-4px)`
  }
  const soltar = () => { if (ref.current) ref.current.style.transform = "" }
  return (
    <div ref={ref} onMouseMove={inclinar} onMouseLeave={soltar} className="acc-escala acc-ficha acc-flota"
      style={{ "--mt-movil": `${margenSuperior}px`, "--mt": arriba, background: `linear-gradient(160deg, #16190f 0%, ${COLOR.form} 60%)`,
        boxShadow: "0 1px 0 rgba(236,239,228,.08) inset, 0 30px 60px -12px rgba(0,0,0,.75), 0 12px 24px -8px rgba(0,0,0,.6), 0 0 60px -20px rgba(155,230,0,.18)" }}>
      <EstilosAcceso />
      {/* Bravo: el borde dibujado de la imagen (y = 87,5 %) queda sobre el filo de la ficha */}
      <img src="/bravo_asomado.webp" alt="" draggable={false} className="acc-perro" />
      <div className="acc-tags" style={{ ...MONO, color: COLOR.apagado }}>
        <span style={{ color: COLOR.lima }}>{tagIzq}</span>{tagDer && <span>{tagDer}</span>}
      </div>
      <div role="heading" aria-level={2} className="acc-titulo" style={{ ...BIG, color: COLOR.tinta }}>
        {titulo}<span style={{ color: COLOR.lima }}>.</span>
      </div>
      <div className="acc-sub" style={{ color: COLOR.apagado }}>{subtitulo}</div>
      {children}
    </div>
  )
}

/** Grilla de campos tipo planilla (2 columnas, bordes colapsados) */
export function GrillaCampos({ children }) {
  return <div className="acc-grilla">{children}</div>
}

/** Una celda de la grilla: rótulo, enlace opcional a la derecha, el campo y el mensaje de error */
export function Celda({ id, etiqueta, enlace, dosColumnas = true, error, children }) {
  return (
    <div className={`acc-celda ${dosColumnas ? "col-span-2" : "col-span-2 min-[420px]:col-span-1"}`} style={error ? { borderColor: COLOR.error } : undefined}>
      <div className="acc-cab">
        <label htmlFor={id} className="acc-label" style={{ ...MONO, color: COLOR.apagado }}>{etiqueta}</label>
        {enlace}
      </div>
      {children}
      {error && <p role="alert" className="acc-error">{error}</p>}
    </div>
  )
}

export function BotonPrimario({ cargando, textoCargando, children, ...resto }) {
  return (
    <button type="submit" disabled={cargando} {...resto} className="acc-boton" style={BIG}>
      {cargando ? textoCargando : children}
    </button>
  )
}

export function PieLink({ texto, enlace, to }) {
  return (
    <p className="acc-pie acc-escala" style={{ color: COLOR.apagado }}>
      {texto}{" "}<Link to={to} className="font-semibold underline-offset-2 hover:underline" style={{ color: COLOR.lima }}>{enlace}</Link>
    </p>
  )
}
