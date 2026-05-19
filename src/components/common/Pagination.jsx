import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, totalCount, onPageChange }) {
  const [jumpPage, setJumpPage] = useState('')

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        共 {totalCount} 条，第 {page} / {totalPages} 页
      </p>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <input
          type="number"
          min="1"
          max={totalPages}
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const p = parseInt(jumpPage)
              if (p >= 1 && p <= totalPages) {
                onPageChange(p)
                setJumpPage('')
              }
            }
          }}
          placeholder={String(page)}
          aria-label="跳转页码"
          className="w-14 text-center rounded-lg border text-sm py-1.5"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-input)', color: 'var(--text)' }}
        />
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
