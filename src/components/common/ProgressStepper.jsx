import { Check } from 'lucide-react'

const STEPS = [
  { key: 'audit_sign', label: '审核签收' },
  { key: 'stamp_upload', label: '盖章上传' },
  { key: 'send_out', label: '寄出' },
  { key: 'payment_invoice', label: '打款开票' },
  { key: 'reimbursement', label: '报销' },
  { key: 'closure', label: '结题' },
]

export default function ProgressStepper({ currentStatus, responsibles }) {
  const isAllDone = currentStatus === 'completed'
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus)

  return (
    <div className="flex items-start justify-between w-full">
      {STEPS.map((step, index) => {
        const isCompleted = isAllDone || index < currentIndex
        const isCurrent = !isAllDone && index === currentIndex
        const responsible = responsibles?.find(r => r.key === step.key)?.name

        return (
          <div key={step.key} className="flex items-start flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium text-white"
                style={{
                  background: isCompleted
                    ? 'var(--success)'
                    : isCurrent
                    ? 'var(--warning)'
                    : 'var(--bg-table-head)',
                  color: isCompleted || isCurrent ? '#fff' : 'var(--text-dim)',
                }}
              >
                {isCompleted ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : index + 1}
              </div>
              <span
                className="text-[10px] sm:text-xs mt-1 text-center leading-tight"
                style={{
                  color: isCurrent ? 'var(--warning)' : 'var(--text-dim)',
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {step.label}
              </span>
              {responsible && (
                <span className="hidden sm:block text-xs mt-0.5 truncate max-w-16" style={{ color: 'var(--text-muted)' }}>
                  {responsible}
                </span>
              )}
            </div>
            {index < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-1 sm:mx-2 mt-3 sm:mt-4"
                style={{ background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--warning)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
