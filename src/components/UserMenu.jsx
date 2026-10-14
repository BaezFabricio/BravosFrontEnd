import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Check, Settings, Globe } from 'lucide-react';
import { PANELES, panelesPermitidos } from '@/lib/paneles';

function Iniciales({ nombre }) {
  const partes = (nombre || '').trim().split(' ');
  return (partes.length >= 2 ? partes[0][0] + partes[1][0] : partes[0]?.[0] || '?').toUpperCase();
}

function RolBadge({ tieneModulosAdmin, tieneModulosProfesor }) {
  if (tieneModulosAdmin) return <span className="text-[10px] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Admin</span>;
  if (tieneModulosProfesor) return <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">Profesor</span>;
  return <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alumno</span>;
}

export default function UserMenu({ userData, avatarUrl, userMenuOpen, setUserMenuOpen, handleLogout, tieneModulosAdmin, tieneModulosAlumno, tieneModulosProfesor, puedeAccederPanel, panelActual }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (!userMenuOpen) return null;

  // "Mi Perfil" se abre dentro del panel en el que está la persona (alumno o profesor);
  // desde el panel admin o el sitio usa el perfil compartido.
  const rutaPerfil = pathname.startsWith('/alumno') ? '/alumno/perfil'
    : pathname.startsWith('/profesor') ? '/profesor/perfil'
    : '/perfil';

  // Paneles a los que puede ir. Dentro de un panel se marca el actual con ✓ ("Cambiar de panel");
  // en el sitio público son accesos directos a cada uno.
  const paneles = panelActual
    ? PANELES.filter((p) => panelesPermitidos()[p.key])
    : PANELES.filter((p) => puedeAccederPanel && { admin: tieneModulosAdmin, alumno: tieneModulosAlumno, profesor: tieneModulosProfesor }[p.key]);
  const mostrarPaneles = panelActual ? paneles.length > 1 : paneles.length > 0;

  // Todas las filas iguales: misma altura, ícono en la misma columna, texto normal
  const fila = "flex h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500";
  const icono = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg";

  // Mi configuración (preferencias de la persona) se abre dentro del panel en el que está
  const rutaMiConfiguracion = pathname.startsWith('/alumno') ? '/alumno/configuracion'
    : pathname.startsWith('/profesor') ? '/profesor/configuracion'
    : '/mi-configuracion';

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />

      <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border border-border border-t-2 border-t-lime-400 bg-card shadow-2xl shadow-black/40">
        {/* Quién está conectado */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-lime-400 text-sm font-black leading-none text-black">
            {avatarUrl
              ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              : <Iniciales nombre={userData.nombrecompleto} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold capitalize leading-tight text-foreground">{userData.nombrecompleto}</p>
            <RolBadge tieneModulosAdmin={tieneModulosAdmin} tieneModulosProfesor={tieneModulosProfesor} />
          </div>
        </div>

        {/* Dentro de un panel, primero: volver al sitio público del box */}
        {panelActual && (
          <div className="border-b border-border p-1.5">
            <Link to="/inicio" onClick={() => setUserMenuOpen(false)} className={`${fila} text-foreground/80 hover:bg-foreground/5 hover:text-foreground`}>
              <span className={`${icono} bg-foreground/5`}><Globe className="h-4 w-4" /></span>
              Página principal
            </Link>
          </div>
        )}

        {/* Paneles */}
        {mostrarPaneles && (
          <div className="border-b border-border p-1.5" role="group" aria-label={panelActual ? "Cambiar de panel" : "Ir a un panel"}>
            <p className="px-2 pb-1 pt-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {panelActual ? "Cambiar de panel" : "Ir a un panel"}
            </p>
            {paneles.map((panel) => {
              const esActual = panel.key === panelActual;
              const IconoPanel = panel.icon;
              return (
                <button
                  key={panel.key}
                  type="button"
                  aria-current={esActual ? "page" : undefined}
                  onClick={() => { setUserMenuOpen(false); if (!esActual) navigate(panel.href); }}
                  className={`${fila} ${esActual ? "bg-lime-400/10 text-foreground" : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"}`}
                >
                  <span className={`${icono} bg-lime-400/10`}>
                    <IconoPanel className="h-4 w-4 text-lime-700 dark:text-lime-400" />
                  </span>
                  <span className="flex-1">{panel.label}</span>
                  {esActual && <Check className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Cuenta */}
        <div className="p-1.5">
          <Link to={rutaPerfil} onClick={() => setUserMenuOpen(false)} className={`${fila} text-foreground/80 hover:bg-foreground/5 hover:text-foreground`}>
            <span className={`${icono} bg-foreground/5`}><User className="h-4 w-4" /></span>
            Mi perfil
          </Link>
          <Link to={rutaMiConfiguracion} onClick={() => setUserMenuOpen(false)} className={`${fila} text-foreground/80 hover:bg-foreground/5 hover:text-foreground`}>
            <span className={`${icono} bg-foreground/5`}><Settings className="h-4 w-4" /></span>
            Mi configuración
          </Link>
          <button type="button" onClick={() => { setUserMenuOpen(false); handleLogout(); }} className={`${fila} text-red-600 hover:bg-red-500/10 dark:text-red-400`}>
            <span className={`${icono} bg-red-500/10`}><LogOut className="h-4 w-4" /></span>
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}
