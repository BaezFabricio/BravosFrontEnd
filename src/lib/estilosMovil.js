// Login y registro en celular (< 768 px): referencias movil-login.html y movil-registro.html.
// .inp, .lbl y .cell son las clases de la referencia, acotadas a .lm para no afectar al resto de la app.
// Los campos de texto usan 16 px para que el celular no haga zoom al tocarlos.
export const ESTILOS_MOVIL = `
.lm *{box-sizing:border-box}
.lm a{color:#9be600}.lm a:hover{color:#c4ff3d}
.lm input::placeholder{color:#6b705e}.lm input:focus{outline:none}
.lm button:active,.lm .btn2:active{transform:scale(.98)}
.lm .inp{display:block;width:100%;background:transparent;border:none;color:#ecefe4;font:500 16px Archivo;padding:6px 0 2px}
.lm .lbl{font:500 9.5px 'JetBrains Mono';letter-spacing:.16em;color:#8a8f7a}
.lm .cell{padding:10px 14px 8px;border-bottom:1px solid #3a3d32}
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
