export function AppSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header skeleton */}
      <header className="h-[72px] bg-white/95 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-full flex items-center justify-between">
          <div className="h-[34px] w-[130px] bg-muted animate-pulse rounded" />
          <div className="hidden md:flex gap-1">
            {[120, 100, 80, 80].map((w, i) => (
              <div
                key={i}
                className="h-9 bg-muted animate-pulse rounded-[10px]"
                style={{ width: `${w}px` }}
              />
            ))}
          </div>
          <div className="h-10 w-[140px] bg-muted animate-pulse rounded-[10px] hidden sm:block" />
        </div>
      </header>

      {/* Hero skeleton */}
      <main className="flex-1">
        <section className="min-h-screen bg-navy flex items-center">
          <div className="max-w-[1200px] mx-auto px-5 sm:px-8 w-full">
            <div className="max-w-[620px] space-y-6">
              <div className="h-3 w-[280px] bg-white/10 animate-pulse rounded-full" />
              <div className="space-y-3">
                <div className="h-14 bg-white/10 animate-pulse rounded-lg max-w-[500px]" />
                <div className="h-14 bg-white/10 animate-pulse rounded-lg max-w-[400px]" />
              </div>
              <div className="h-5 bg-white/10 animate-pulse rounded max-w-[450px]" />
              <div className="flex gap-3">
                <div className="h-12 w-[220px] bg-white/10 animate-pulse rounded-[12px]" />
                <div className="h-12 w-[160px] bg-white/10 animate-pulse rounded-[12px]" />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer skeleton */}
      <footer className="bg-navy text-white py-16">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 w-20 bg-white/10 animate-pulse rounded" />
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-3 bg-white/5 animate-pulse rounded"
                    style={{ width: `${60 + j * 30}px` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <section className="py-24 sm:py-32 bg-background">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="text-center mb-16">
          <div className="h-5 w-[80px] bg-muted animate-pulse rounded-full mx-auto mb-5" />
          <div className="h-12 bg-muted animate-pulse rounded-lg max-w-[500px] mx-auto mb-5" />
          <div className="h-5 bg-muted animate-pulse rounded max-w-[400px] mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[320px] bg-muted animate-pulse rounded-2xl"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
