import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  message = '提交后该环节将锁定，无法自行修改。确认提交？',
  title = '确认操作'
}) {
  const dialogRef = useRef(null)
  const confirmBtnRef = useRef(null)

  useEffect(() => {
    if (!open) return
    confirmBtnRef.current?.focus()

    function handleKeyDown(e) {
      if (e.key === 'Escape') onCancel?.()
      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = dialog.querySelectorAll('button:not([disabled])')
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 backdrop-blur-sm" style={{ background: 'var(--bg-modal-overlay)' }} onClick={onCancel} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 modal-enter"
        style={{ background: 'var(--bg-card)' }}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 id="confirm-modal-title" className="text-lg font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>{title}</h3>
        <p className="mb-6" style={{ color: 'var(--text-dim)' }}>{message}</p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-medium rounded-xl btn-transition"
            style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
          >
            取消
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            className="px-4 py-2.5 text-sm font-medium text-white rounded-xl btn-transition"
            style={{ background: 'var(--gradient-primary)' }}
          >
            确认提交
          </button>
        </div>
      </div>
    </div>
  )
}
