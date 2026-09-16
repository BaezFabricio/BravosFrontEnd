export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">

      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 border-b-2 border-lime-400/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="h-9 w-40 bg-white/10 animate-pulse rounded" />
            <div className="hidden lg:flex items-center gap-8">
              {[80, 90, 100, 90, 110].map((w, i) => (
                <div key={i} className="h-3 bg-white/10 animate-pulse rounded" style={{ width: w }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 bg-white/10 animate-pulse rounded" />
              <div className="h-9 w-24 bg-lime-400/20 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen items-end pb-12">
        <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-3">
            <div className="h-3 w-36 bg-white/10 animate-pulse rounded" />
            <div className="h-20 w-56 bg-white/10 animate-pulse rounded" />
            <div className="h-7 w-72 bg-white/10 animate-pulse rounded" />
            <div className="h-4 w-24 bg-white/10 animate-pulse rounded mt-2" />
          </div>
        </div>
      </section>

      {/* Frase */}
      <section className="bg-black py-14">
        <div className="container mx-auto px-4 flex flex-col items-center gap-3">
          <div className="h-8 w-3/4 bg-white/10 animate-pulse rounded" />
          <div className="h-8 w-1/2 bg-lime-400/10 animate-pulse rounded" />
        </div>
      </section>

      {/* Nosotros */}
      <section className="relative py-12">
        <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="h-10 w-64 bg-white/10 animate-pulse rounded" />
            <div className="h-4 w-full bg-white/10 animate-pulse rounded" />
            <div className="h-4 w-5/6 bg-white/10 animate-pulse rounded" />
            <div className="h-4 w-4/6 bg-white/10 animate-pulse rounded" />
            <div className="mt-8 grid grid-cols-4 gap-8">
              {[0,1,2,3].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-9 w-16 bg-lime-400/20 animate-pulse rounded" />
                  <div className="h-3 w-14 bg-white/10 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Clases */}
      <section className="bg-zinc-950 py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-56 bg-white/10 animate-pulse rounded mb-12" />
          <div className="grid gap-6 md:grid-cols-3">
            {[0,1,2].map(i => (
              <div key={i} className="aspect-[4/5] bg-zinc-800 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </section>

      {/* Horarios */}
      <section className="relative py-14">
        <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        <div className="absolute inset-0 bg-black/90" />
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="h-10 w-72 bg-white/10 animate-pulse rounded" />
          <div className="h-4 w-96 bg-white/10 animate-pulse rounded" />
          <div className="flex gap-2 mt-6">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="h-8 w-20 bg-white/10 animate-pulse rounded" />
            ))}
          </div>
          <div className="h-48 w-full bg-white/5 animate-pulse rounded mt-4" />
        </div>
      </section>

      {/* Contacto */}
      <section className="bg-black py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-10 w-48 bg-white/10 animate-pulse rounded mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[0,1,2,3].map(i => (
                <div key={i} className="h-5 w-60 bg-white/10 animate-pulse rounded" />
              ))}
            </div>
            <div className="h-64 bg-zinc-900 animate-pulse rounded" />
          </div>
        </div>
      </section>

    </div>
  )
}
