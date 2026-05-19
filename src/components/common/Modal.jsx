import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }) {
  const dialogRef = useRef(null)
  const firstFocusable = useRef(null)

  useEffect(() => {
    if (!open) return
    firstFocusable.current?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = dialog.querySelectorAll(
          'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 backdrop-blur-sm"
        style={{ background: 'var(--bg-modal-overlay)' }}
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative rounded-2xl shadow-xl w-full mx-4 p-6 modal-enter ${maxWidth}`}
        style={{ background: 'var(--bg-card)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="modal-title" className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div ref={firstFocusable} tabIndex={-1}>
          {children}
        </div>
      </div>
    </div>
  )
}
