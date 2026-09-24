import DOMPurify from "dompurify"

// Las descripciones y rutinas se guardan como HTML escrito por otras personas (profesores).
// Sin limpiarlo, un <img onerror=...> o un <script> se ejecuta en el navegador de quien lo mira
// y puede robar su sesión. Siempre pasar por acá antes de usar dangerouslySetInnerHTML.
export function sanitizarHtml(html) {
  return DOMPurify.sanitize(String(html ?? ""), { USE_PROFILES: { html: true } })
}
