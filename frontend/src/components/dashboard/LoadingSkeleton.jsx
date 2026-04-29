export function SkeletonLines({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`app-skeleton h-4 ${index === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCardGrid({ cards = 3 }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="app-skeleton-panel">
          <div className="app-skeleton h-4 w-24" />
          <div className="mt-4 app-skeleton h-8 w-16" />
          <div className="mt-4 app-skeleton h-4 w-full" />
          <div className="mt-2 app-skeleton h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="app-skeleton-panel p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="app-skeleton h-4 w-40" />
              <div className="mt-3 app-skeleton h-4 w-full" />
              <div className="mt-2 app-skeleton h-4 w-3/4" />
            </div>
            <div className="app-skeleton h-9 w-9" />
          </div>
        </div>
      ))}
    </div>
  );
}
