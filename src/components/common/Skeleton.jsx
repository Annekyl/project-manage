export function SkeletonLine({ width = '100%', height = '1rem', className = '' }) {
  return (
    <div
      className={`rounded-md animate-pulse ${className}`}
      style={{ width, height, background: 'var(--bg-table-head)' }}
    />
  )
}

export function SkeletonCircle({ size = '2.5rem', className = '' }) {
  return (
    <div
      className={`rounded-full animate-pulse ${className}`}
      style={{ width: size, height: size, background: 'var(--bg-table-head)' }}
    />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-xl p-6 space-y-4 animate-pulse ${className}`} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
      <SkeletonLine width="40%" height="1.25rem" />
      <SkeletonLine width="100%" />
      <SkeletonLine width="75%" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
      <div className="p-4" style={{ background: 'var(--bg-table-head)' }}>
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonLine key={i} width={`${100 / cols}%`} height="1rem" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 p-4" style={{ borderBottom: '1px solid var(--border-light)' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={`${100 / cols}%`} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonStatCards({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-5 animate-pulse" style={{ background: 'var(--bg-table-head)', height: '6rem' }} />
      ))}
    </div>
  )
}
