export function AdminPageSkeleton({ rows = 6, showHeader = true }) {
  return (
    <div className="space-y-6 animate-pulse">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-foreground/10 rounded" />
            <div className="h-4 w-72 bg-foreground/5 rounded" />
          </div>
          <div className="h-9 w-32 bg-foreground/10 rounded" />
        </div>
      )}

      {/* Filtros / acciones */}
      <div className="flex gap-3">
        <div className="h-9 w-48 bg-foreground/10 rounded" />
        <div className="h-9 w-32 bg-foreground/5 rounded" />
        <div className="h-9 w-32 bg-foreground/5 rounded" />
      </div>

      {/* Tabla */}
      <div className="border border-border rounded overflow-hidden">
        {/* Thead */}
        <div className="bg-foreground/5 px-4 py-3 flex gap-4">
          {[120, 200, 100, 80, 100].map((w, i) => (
            <div key={i} className="h-3 bg-foreground/15 rounded" style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex gap-4 border-t border-border">
            <div className="h-4 w-[120px] bg-foreground/8 rounded" />
            <div className="h-4 w-[200px] bg-foreground/6 rounded" />
            <div className="h-4 w-[100px] bg-foreground/6 rounded" />
            <div className="h-5 w-[80px] bg-foreground/8 rounded-full" />
            <div className="h-4 w-[100px] bg-foreground/5 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-2xl">
      <div className="space-y-2">
        <div className="h-7 w-52 bg-foreground/10 rounded" />
        <div className="h-4 w-80 bg-foreground/5 rounded" />
      </div>
      <div className="space-y-5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-28 bg-foreground/10 rounded" />
            <div className="h-10 w-full bg-foreground/5 rounded border border-border" />
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <div className="h-10 w-32 bg-foreground/10 rounded" />
        <div className="h-10 w-24 bg-foreground/5 rounded" />
      </div>
    </div>
  )
}
