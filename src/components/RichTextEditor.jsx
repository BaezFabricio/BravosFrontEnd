import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Italic, UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, Heading2 } from "lucide-react"
import { useEffect } from "react"

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 transition-colors rounded ${
        active
          ? "text-foreground bg-foreground/10"
          : "text-foreground/40 hover:text-foreground hover:bg-foreground/5"
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
      <Icon className="h-3.5 w-3.5" />
    </ToolbarBtn>
  )

  return (
    <div className="border border-border focus-within:border-foreground/40 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border px-2 py-1 bg-muted/30 flex-wrap">
        {btn(() => editor.chain().focus().toggleBold().run(),        editor.isActive("bold"),        "Negrita (Ctrl+B)",   Bold)}
        {btn(() => editor.chain().focus().toggleItalic().run(),      editor.isActive("italic"),      "Cursiva (Ctrl+I)",   Italic)}
        {btn(() => editor.chain().focus().toggleUnderline().run(),   editor.isActive("underline"),   "Subrayado (Ctrl+U)", UnderlineIcon)}

        <span className="w-px h-4 bg-border mx-1" />

        {btn(() => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }), "Título", Heading2)}

        <span className="w-px h-4 bg-border mx-1" />

        {btn(() => editor.chain().focus().toggleBulletList().run(),  editor.isActive("bulletList"),  "Lista", List)}
        {btn(() => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"), "Lista numerada", ListOrdered)}

        <span className="w-px h-4 bg-border mx-1" />

        {btn(() => editor.chain().focus().setTextAlign("left").run(),   editor.isActive({ textAlign: "left" }),   "Alinear izquierda", AlignLeft)}
        {btn(() => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }), "Centrar",           AlignCenter)}
      </div>

      {/* Editor area */}
      <div style={{ minHeight }} className="px-3 py-2.5 text-sm">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
