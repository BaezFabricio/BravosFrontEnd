import { Link } from 'react-router-dom'
import { Layout, Info, Dumbbell, MapPin, Landmark, ChevronRight } from 'lucide-react'

/*
 * Menú de Configuración del gimnasio (estilo apps de banco o de compras): la web pública y
 * los cobros. Lo personal (tema, avisos, perfil) está en "Mi configuración", en el globito;
 * los módulos de gestión (usuarios, clases, planes…) están en el menú lateral. Cada opción se
 * muestra solo si el perfil tiene el permiso (el servidor lo vuelve a controlar en cada ruta).
 */
const GRUPOS = [
  {
    titulo: 'Web pública',
    items: [
      { texto: 'Portada y logo', detalle: 'Título, logo y fotos del carrusel', icono: Layout, a: '?seccion=hero', permiso: 'configuracion:consulta' },
      { texto: 'Sobre nosotros', detalle: 'Foto, historia y misión', icono: Info, a: '?seccion=nosotros', permiso: 'configuracion:consulta' },
      { texto: 'Tarjetas de clases', detalle: 'Las 3 disciplinas de la portada', icono: Dumbbell, a: '?seccion=clases', permiso: 'configuracion:consulta' },
      { texto: 'Contacto, horarios y mapa', detalle: 'Teléfono, redes, horarios y datos legales', icono: MapPin, a: '?seccion=contacto', permiso: 'configuracion:consulta' },
    ],
  },
  {
    titulo: 'Cobros',
    items: [
      { texto: 'Datos bancarios', detalle: 'Banco, CBU/CVU y alias para transferencias', icono: Landmark, a: '?seccion=banco', permiso: 'configuracion:consulta' },
    ],
  },
]

const leer = (clave, porDefecto) => {
  try { return JSON.parse(localStorage.getItem(clave) || porDefecto) } catch { return JSON.parse(porDefecto) }
}

function Fila({ icono: Icono, texto, detalle, a, onClick, peligro, derecha }) {
  const contenido = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${peligro ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-lime-400/15 text-lime-700 dark:text-lime-400'}`}>
        <Icono className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm font-bold ${peligro ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>{texto}</span>
        {detalle && <span className="block truncate text-xs text-foreground/55">{detalle}</span>}
      </span>
      {derecha === undefined ? <ChevronRight className="h-4 w-4 shrink-0 text-foreground/35" aria-hidden="true" /> : derecha}
    </>
  )
  const cls = 'flex min-h-[64px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-500'
  return a
    // desdeMenu: la sección sabe que puede volver al menú con 'atrás' sin apilar otra página
    ? <Link to={a} state={{ desdeMenu: true }} className={cls}>{contenido}</Link>
    : <button type="button" onClick={onClick} className={cls}>{contenido}</button>
}

function Grupo({ titulo, children }) {
  return (
    <section aria-label={titulo}>
      <h2 className="mb-2 flex items-center gap-2 px-1 text-[11px] font-black uppercase tracking-widest text-foreground/60">
        <span className="h-3 w-1 rounded-full bg-lime-400" aria-hidden="true" /> {titulo}
      </h2>
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">{children}</div>
    </section>
  )
}

export default function MenuAjustes() {
  const permisos = leer('permisos', '[]')

  const grupos = GRUPOS
    .map(g => ({ ...g, items: g.items.filter(i => permisos.includes(i.permiso) || permisos.includes(i.permiso.replace(':consulta', ':ver'))) }))
    .filter(g => g.items.length > 0)

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Panel admin</p>
        <h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">Configuración del Box</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {grupos.map(g => (
          <Grupo key={g.titulo} titulo={g.titulo}>
            {g.items.map(i => <Fila key={i.texto} icono={i.icono} texto={i.texto} detalle={i.detalle} a={i.a} />)}
          </Grupo>
        ))}

      </div>
    </div>
  )
}
