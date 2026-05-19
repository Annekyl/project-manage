export default function StatusBadge({ locked, hasData }) {
  if (locked) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
        已锁定
      </span>
    )
  }

  if (hasData) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
        进行中
      </span>
    )
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--bg-table-head)', color: 'var(--text-dim)' }}>
      待填写
    </span>
  )
}
