import { Link } from 'react-router-dom';
import { User, Shield, ClipboardCheck, Dumbbell, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function UserMenu({ userData, avatarUrl, userMenuOpen, setUserMenuOpen, handleLogout, tieneModulosAdmin, tieneModulosAlumno, tieneModulosProfesor, puedeAccederPanel, navigate }) {
  if (!userMenuOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      <div className="absolute right-0 mt-3 w-64 rounded-md border border-zinc-800 bg-[#0c0c0e] shadow-2xl z-50 overflow-hidden">
        <div className="border-b border-zinc-800 p-4">
          <p className="text-sm font-bold text-white capitalize">{userData.nombrecompleto}</p>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{userData.correo}</p>
        </div>
        <div className="p-1">
          <Link to="/perfil" onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900 transition-colors">
            <User className="h-4 w-4 text-zinc-400" /> Mi Perfil
          </Link>
          
          {tieneModulosAdmin && puedeAccederPanel && (
            <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900 transition-colors">
              <Shield className="h-4 w-4 text-zinc-400" /> Panel de Control
            </Link>
          )}
          
          {tieneModulosProfesor && puedeAccederPanel && (
            <Link to="/profesor" onClick={() => setUserMenuOpen(false)} className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-900 transition-colors">
              <ClipboardCheck className="h-4 w-4 text-zinc-400" /> Panel de Profesor
            </Link>
          )}

          <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-red-500 hover:bg-red-950/20 transition-colors border-t border-zinc-800/60">
            <LogOut className="h-4 w-4 text-red-500" /> Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}