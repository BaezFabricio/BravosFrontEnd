import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Check, Settings, ChevronDown } from 'lucide-react';
import { PANELES, panelesPermitidos } from '@/lib/paneles';
import { useAnchoPanel } from '@/lib/useEscritorio';

function Iniciales({ nombre }) {
  const partes = (nombre || '').trim().split(' ');
  return (partes.length >= 2 ? partes[0][0] + partes[1][0] : partes[0]?.[0] || '?').toUpperCase();
}

function RolBadge({ tieneModulosAdmin, tieneModulosProfesor }) {
  if (tieneModulosAdmin) return <span className="text-[0.625rem] font-black uppercase tracking-widest text-lime-700 dark:text-lime-400">Admin</span>;
  if (tieneModulosProfesor) return <span className="text-[0.625rem] font-black uppercase tracking-widest text-blue-700 dark:text-blue-400">Profesor</span>;
  return <span className="text-[0.625rem] font-black uppercase tracking-widest text-muted-foreground">Alumno</span>;
}

export default function UserMenu({ userData, avatarUrl, userMenuOpen, setUserMenuOpen, handleLogout, tieneModulosAdmin, tieneModulosAlumno, tieneModulosProfesor, puedeAccederPanel, panelActual, sinAcordeon = false, variante }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [verPaneles, setVerPaneles] = useState(false);
  const escritorio = useAnchoPanel();
  if (!userMenuOpen) return null;

  // "Mi Perfil" se abre dentro del panel en el que está la persona (alumno o profesor);
  // desde el panel admin o el sitio usa el perfil compartido.
  const rutaPerfil = pathname.startsWith('/admin') ? '/admin/perfil'
    : pathname.startsWith('/alumno') ? '/alumno/perfil'
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
  // Variante de la portada (sinAcordeon): íconos sueltos, sin cuadrado de fondo
  const iconoSimple = "flex h-6 w-6 shrink-0 items-center justify-center text-foreground/60";

  // Mi configuración (preferencias de la persona) se abre dentro del panel en el que está
  const rutaMiConfiguracion = pathname.startsWith('/alumno') ? '/alumno/configuracion'
    : pathname.startsWith('/profesor') ? '/profesor/configuracion'
    : '/mi-configuracion';

  // Panel admin en escritorio (referencia 14): avatar y correo, "Ver como", Mi perfil, Preferencias y Cerrar sesión
  if (variante === "admin" && escritorio) {
    const fila = (activo) => ({ display: "flex", alignItems: "center", gap: "12px", width: "100%", boxSizing: "border-box", height: "44px", padding: "0px 12px", border: "none", borderRadius: "10px", background: activo ? "var(--sh-active-bg)" : "transparent", color: activo ? "var(--sh-accent)" : "var(--foreground)", font: "700 14px Archivo", textAlign: "left", cursor: "pointer", textDecoration: "none" });
    const linea = { borderTop: "1px solid var(--border)" };
    return (
      <>
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
        <div style={{ position: "absolute", right: 0, top: "100%", marginTop: "12px", zIndex: 50, width: "304px", borderRadius: "16px", background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)", overflow: "hidden", color: "var(--foreground)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px" }}>
            <span style={{ width: "52px", height: "52px", flexShrink: 0, borderRadius: "50%", background: "var(--sh-avatar)", border: "2px solid var(--sh-accent)", color: "var(--sh-accent)", font: "800 17px Archivo", display: "grid", placeItems: "center", overflow: "hidden" }}>
              {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Iniciales nombre={userData.nombrecompleto} />}
            </span>
            <div style={{ minWidth: 0, flex: "1 1 0%" }}>
              <div style={{ font: "800 16px Archivo", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userData.nombrecompleto}</div>
              {userData.correo && <div style={{ font: "500 13px Archivo", color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userData.correo}</div>}
              {tieneModulosAdmin && <span style={{ display: "inline-block", marginTop: "6px", padding: "1px 8px", borderRadius: "6px", background: "var(--sh-active-bg)", border: "1px solid var(--sh-accent)", color: "var(--sh-accent)", font: "700 11px Archivo" }}>Admin</span>}
            </div>
          </div>
          {mostrarPaneles && (
            <div style={{ ...linea, padding: "12px 12px 8px" }}>
              <div style={{ padding: "0px 12px 6px", font: "700 11px Archivo", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>Ver como</div>
              {paneles.map((panel) => {
                const esActual = panel.key === panelActual;
                const IconoPanel = panel.key === 'alumno' ? User : panel.icon;
                return (
                  <button key={panel.key} type="button" aria-current={esActual ? "page" : undefined} style={fila(esActual)}
                    onClick={() => { setUserMenuOpen(false); setVerPaneles(false); if (!esActual) navigate(panel.href); }}>
                    <IconoPanel className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    <span style={{ flex: "1 1 0%" }}>{panel.label}</span>
                    {esActual && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ ...linea, padding: "8px 12px" }}>
            <Link to={rutaPerfil} onClick={() => setUserMenuOpen(false)} style={fila(false)}><User className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />Mi perfil</Link>
            <Link to={rutaMiConfiguracion} onClick={() => setUserMenuOpen(false)} style={fila(false)}><Settings className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />Preferencias de mi cuenta</Link>
          </div>
          <div style={{ ...linea, padding: "8px 12px" }}>
            <button type="button" onClick={() => { setUserMenuOpen(false); handleLogout(); }} style={{ ...fila(false), color: "var(--sh-danger)" }}><LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />Cerrar sesión</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />

      <div className="absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-xl border border-border border-t-2 border-t-lime-400 bg-card shadow-2xl shadow-black/40">
        {/* Quién está conectado */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-lime-400 text-sm font-black leading-none text-black">
            {avatarUrl && !sinAcordeon
              ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              : <Iniciales nombre={userData.nombrecompleto} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold capitalize leading-tight text-foreground">{userData.nombrecompleto}</p>
            <RolBadge tieneModulosAdmin={tieneModulosAdmin} tieneModulosProfesor={tieneModulosProfesor} />
          </div>
        </div>


        {/* Paneles */}
        {mostrarPaneles && (
          <div className="border-b border-border p-1.5">
            {/* Lista desplegable: cerrada muestra el panel actual; al abrirla se elige el otro */}
            {!sinAcordeon && (
            <button
              type="button"
              aria-expanded={verPaneles}
              onClick={() => setVerPaneles((v) => !v)}
              className={`${fila} ${panelActual ? "bg-lime-400/10 text-foreground" : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"}`}
            >
              {panelActual && (() => {
                const IconoActual = PANELES.find((p) => p.key === panelActual)?.icon;
                return IconoActual ? (
                  <span className={`${icono} bg-lime-400/10`}>
                    <IconoActual className="h-4 w-4 text-lime-700 dark:text-lime-400" />
                  </span>
                ) : null;
              })()}
              <span className="min-w-0 flex-1">
                <span className="block text-[0.625rem] font-black uppercase leading-tight tracking-widest text-muted-foreground">
                  {panelActual ? "Cambiar de panel" : "Ir a un panel"}
                </span>
                {panelActual && (
                  <span className="block truncate text-sm font-black leading-tight text-foreground">
                    {PANELES.find((p) => p.key === panelActual)?.label}
                  </span>
                )}
              </span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-foreground/50 transition-transform ${verPaneles ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            )}
            {sinAcordeon && <p className="px-2 pb-1 pt-1.5 text-[0.625rem] font-black uppercase tracking-widest text-muted-foreground">Ir a un panel</p>}
            {(verPaneles || sinAcordeon) && (
            <ul className="mt-1 border-t border-border pt-1" aria-label={panelActual ? "Cambiar de panel" : "Ir a un panel"}>
              {paneles.map((panel) => {
                const esActual = panel.key === panelActual;
                const IconoPanel = panel.icon;
                return (
                  <li key={panel.key}>
                    <button
                      type="button"
                      aria-current={esActual ? "page" : undefined}
                      onClick={() => { setUserMenuOpen(false); setVerPaneles(false); if (!esActual) navigate(panel.href); }}
                      className={`${fila} ${esActual ? "bg-lime-400/10 text-foreground" : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"}`}
                    >
                      <span className={sinAcordeon ? iconoSimple : `${icono} bg-lime-400/10`}>
                        <IconoPanel className={`h-4 w-4 ${sinAcordeon ? "" : "text-lime-700 dark:text-lime-400"}`} />
                      </span>
                      <span className="flex-1">{panel.label}</span>
                      {sinAcordeon && <span className="text-foreground/50" aria-hidden="true">→</span>}
                      {esActual && <Check className="h-4 w-4 shrink-0 text-lime-700 dark:text-lime-400" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            )}
          </div>
        )}

        {/* Cuenta */}
        <div className="p-1.5">
          <Link to={rutaPerfil} onClick={() => setUserMenuOpen(false)} className={`${fila} text-foreground/80 hover:bg-foreground/5 hover:text-foreground`}>
            <span className={sinAcordeon ? iconoSimple : `${icono} bg-foreground/5`}><User className="h-4 w-4" /></span>
            Mi perfil
          </Link>
          <Link to={rutaMiConfiguracion} onClick={() => setUserMenuOpen(false)} className={`${fila} text-foreground/80 hover:bg-foreground/5 hover:text-foreground`}>
            <span className={sinAcordeon ? iconoSimple : `${icono} bg-foreground/5`}><Settings className="h-4 w-4" /></span>
            Mi configuración
          </Link>
          <button type="button" onClick={() => { setUserMenuOpen(false); handleLogout(); }} className={`${fila} text-red-600 hover:bg-red-500/10 dark:text-red-400`}>
            <span className={sinAcordeon ? iconoSimple : `${icono} bg-red-500/10`}><LogOut className="h-4 w-4" /></span>
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}
