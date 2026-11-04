// Login y registro en celular (< 768 px): referencias movil-login.html y movil-registro.html.
// .inp, .lbl y .cell son las clases de la referencia, acotadas a .lm para no afectar al resto de la app.
// Los campos de texto usan 16 px para que el celular no haga zoom al tocarlos.
export const ESTILOS_MOVIL = `
.lm *{box-sizing:border-box}
.lm a{color:#9be600}.lm a:hover{color:#c4ff3d}
.lm input::placeholder{color:#6b705e}.lm input:focus{outline:none}
.lm button:active,.lm .btn2:active{transform:scale(.98)}
.lm .inp{display:block;width:100%;background:transparent;border:none;color:#ecefe4;font:500 16px Barlow,Archivo,sans-serif;padding:6px 0 2px}
.lm .lbl{font:700 12px Barlow,Archivo,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8a8f7a}
.lm .mf{display:flex;flex-direction:column;gap:5px}
.lm .mfw{position:relative}
.lm .mfw .ic{position:absolute;left:14px;top:50%;transform:translateY(-50%);width:18px;height:18px;color:#8a8f7a;pointer-events:none}
.lm .campo{display:block;width:100%;height:46px;padding:0 44px 0 42px;background:rgba(255,255,255,.04);border:1px solid #3a3d32;border-radius:8px;color:#ecefe4;font:500 16px Barlow,Archivo,sans-serif;transition:border-color .15s,box-shadow .15s}
.lm .campo:focus{border-color:#9be600;box-shadow:0 0 0 2px rgba(155,230,0,.25)}
.lm .campo.ok{border-color:rgba(155,230,0,.5)}
.lm .campo.error{border-color:#ff6b4a}
.lm .mfw .ojo{position:absolute;right:2px;top:50%;transform:translateY(-50%);width:42px;height:42px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;color:#8a8f7a;cursor:pointer}
.lm .mfw .estado{position:absolute;right:14px;top:50%;transform:translateY(-50%);display:flex}
.lm .mfw .estado.con-ojo{right:44px}
.lm .boton{width:100%;height:52px;border:none;border-radius:8px;cursor:pointer;background:#9be600;color:#0b0c09;font:900 17px Barlow,Archivo,sans-serif;letter-spacing:.08em;text-transform:uppercase;box-shadow:0 8px 20px -6px rgba(155,230,0,.45)}
.lm .boton:disabled{opacity:.7}
@keyframes lm-in{from{opacity:0}to{opacity:1}}
@keyframes lm-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(-3px)}}
.lm{animation:lm-in .4s ease both}
.lm.sale{opacity:0;transition:opacity .22s ease}
.lm .flota{transition:transform .25s ease-out;will-change:transform;transform:translateY(-3px);animation:lm-up .5s cubic-bezier(.22,1,.36,1) .05s backwards}
@media (prefers-reduced-motion: reduce){.lm,.lm .flota{animation:none;transition:none}}
`

// Efecto flotante (el mismo de escritorio): fondo con degradado, borde más claro y sombras en capas
export const FICHA_FLOTANTE = {
  border: "1px solid #4a4e3f",
  background: "linear-gradient(160deg, #16190f 0%, #0e100a 60%)",
  boxShadow: "0 1px 0 rgba(236,239,228,.08) inset, 0 24px 48px -12px rgba(0,0,0,.75), 0 10px 20px -8px rgba(0,0,0,.6), 0 0 48px -18px rgba(155,230,0,.18)",
}
