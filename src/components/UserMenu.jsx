import { Link } from 'react-router-dom';
import { User, Shield, ClipboardCheck, Dumbbell, LogOut } from 'lucide-react';

function Iniciales({ nombre }) {
  const partes = (nombre || '').trim().split(' ');
  return (partes.length >= 2 ? partes[0][0] + partes[1][0] : partes[0]?.[0] || '?').toUpperCase();
}

function RolBadge({ perfil, tieneModulosAdmin, tieneModulosProfesor }) {
  if (tieneModulosAdmin) return <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">Admin</span>;
  if (tieneModulosProfesor) return <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Profesor</span>;
  return <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alumno</span>;
}

export default function UserMenu({ userData, avatarUrl, userMenuOpen, setUserMenuOpen, handleLogout, tieneModulosAdmin, tieneModulosAlumno, tieneModulosProfesor, puedeAccederPanel }) {
  if (!userMenuOpen) return null;

  const paneles = [
    tieneModulosAdmin && puedeAccederPanel && { to: '/admin', icon: Shield, label: 'Panel Admin', color: 'hover:text-lime-400 hover:border-l-lime-400' },
    tieneModulosProfesor && puedeAccederPanel && { to: '/profesor', icon: ClipboardCheck, label: 'Panel Profesor', color: 'hover:text-blue-400 hover:border-l-blue-400' },
    tieneModulosAlumno && puedeAccederPanel && { to: '/alumno', icon: Dumbbell, label: 'Panel Alumno', color: 'hover:text-lime-400 hover:border-l-lime-400' },
  ].filter(Boolean);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />

      <div className="absolute right-0 mt-3 w-56 z-50 bg-background shadow-2xl shadow-black/80 overflow-hidden"
        style={{ borderTop: '2px solid #a3e635', border: '1px solid rgba(255,255,255,0.08)', borderTopColor: '#a3e635', borderTopWidth: '2px' }}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 rounded-full items-center justify-center bg-lime-400 text-black font-black text-base leading-none select-none overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt={userData.nombrecompleto} className="h-full w-full object-cover" />
                : <Iniciales nombre={userData.nombrecompleto} />
              }
            </div>
            <div className="min-w-0 flex-1">
              <RolBadge tieneModulosAdmin={tieneModulosAdmin} tieneModulosProfesor={tieneModulosProfesor} />
              <p className="text-sm font-bold text-foreground capitalize leading-tight truncate mt-0.5">
                {userData.nombrecompleto}
              </p>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav className="py-1">
          <Link
            to="/perfil"
            onClick={() => setUserMenuOpen(false)}
            className="flex items-center gap-3 border-l-2 border-l-transparent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground hover:border-l-foreground/40 hover:bg-foreground/5 transition-all"
          >
            <User className="h-3.5 w-3.5 shrink-0" />
            Mi Perfil
          </Link>

          {paneles.map(({ to, icon: Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setUserMenuOpen(false)}
              className={`flex items-center gap-3 border-l-2 border-l-transparent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-foreground/40 ${color} hover:bg-foreground/5 transition-all`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="border-t border-border">
          <button
            onClick={() => { setUserMenuOpen(false); handleLogout(); }}
            className="flex w-full items-center gap-3 border-l-2 border-l-transparent px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-red-500/60 hover:text-red-400 hover:border-l-red-500 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
