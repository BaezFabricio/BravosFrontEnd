import { useState } from "react"
import { PlayCircle, X } from "lucide-react"

const BACKEND_BASE = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api/vv1', '')
  : 'http://localhost:3001'

function getYoutubeEmbedUrl(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function isYoutube(url) {
  return url && (url.includes('youtube.com') || url.includes('youtu.be'))
}

function resolveUrl(url) {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${BACKEND_BASE}${url}`
}

export default function VideoPlayer({ url, label = "Ver video" }) {
  const [open, setOpen] = useState(false)

  if (!url) return null

  const embedUrl = isYoutube(url) ? getYoutubeEmbedUrl(url) : null
  const resolvedUrl = resolveUrl(url)

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        {open ? <X className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
        {open ? "Cerrar video" : label}
      </button>

      {open && (
        <div className="mt-2 rounded-lg overflow-hidden border border-border bg-black">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full aspect-video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={resolvedUrl}
              controls
              className="w-full aspect-video"
            />
          )}
        </div>
      )}
    </div>
  )
}
