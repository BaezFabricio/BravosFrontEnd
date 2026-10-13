import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Italic, UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, Heading2 } from "lucide-react"
import { useEffect } from "react"

// Botón de la barra: grande para el dedo, verde cuando el formato está activo.
// onMouseDown evita que el editor pierda la selección; la acción va en onClick (también funciona con teclado).
function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 ${
        active
          ? "bg-lime-400/20 text-lime-700 dark:text-lime-400"
          : "text-foreground/55 hover:bg-foreground/10 hover:text-foreground active:bg-foreground/15"
      }`}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({ value, onChange, placeholder = "Escribí acá...", minHeight = 160 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate({ editor }) {
      const html = editor.isEmpty ? "" : editor.getHTML()
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: "outline-none min-h-[inherit] prose prose-sm max-w-none text-foreground/90 prose-headings:text-foreground prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wide prose-strong:text-foreground",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML() && value !== undefined) {
      editor.commands.setContent(value || "", false)
    }
  }, [])

  if (!editor) return null

  const btn = (action, isActive, title, Icon) => (
    <ToolbarBtn onClick={action} active={isActive} title={title}>
      <Icon className="h-4 w-4" />
    </ToolbarBtn>
  )

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/60 transition-all focus-within:border-lime-500 focus-within:ring-2 focus-within:ring-lime-500/20">
      {/* Barra de formato: en el celular se desliza de costado en lugar de partirse en dos filas */}
      <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border bg-foreground/[0.03] px-1.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {btn(() => editor.chain().focus().toggleBold().run(),        editor.isActive("bold"),        "Negrita (Ctrl+B)",   Bold)}
        {btn(() => editor.chain().focus().toggleItalic().run(),      editor.isActive("italic"),      "Cursiva (Ctrl+I)",   Italic)}
        {btn(() => editor.chain().focus().toggleUnderline().run(),   editor.isActive("underline"),   "Subrayado (Ctrl+U)", UnderlineIcon)}

        <span className="mx-1 h-5 w-px shrink-0 bg-border" />

        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }), "Título", Heading2)}

        <span className="mx-1 h-5 w-px shrink-0 bg-border" />

        {btn(() => editor.chain().focus().toggleBulletList().run(),  editor.isActive("bulletList"),  "Lista", List)}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), "Lista numerada", ListOrdered)}

        <span className="mx-1 h-5 w-px shrink-0 bg-border" />

        {btn(() => editor.chain().focus().setTextAlign("left").run(),   editor.isActive({ textAlign: "left" }),   "Alinear izquierda", AlignLeft)}
        {btn(() => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }), "Centrar",           AlignCenter)}
      </div>

      {/* Área de escritura: tocar en cualquier parte empieza a escribir */}
      <div style={{ minHeight }} className="cursor-text px-4 py-3 text-[15px] leading-relaxed" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
