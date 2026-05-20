import { Check } from 'lucide-react'

const STEPS = [
  { key: 'audit_sign', label: '审核签收' },
  { key: 'stamp_upload', label: '盖章上传' },
  { key: 'send_out', label: '寄出' },
  { key: 'payment_invoice', label: '打款开票' },
  { key: 'reimbursement', label: '报销' },
  { key: 'closure', label: '结题' },
]

export default function ProgressStepper({ currentStatus }) {
  const isAllDone = currentStatus === 'completed'
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus)

  return (
    <div className="flex items-center justify-between w-full">
      {STEPS.map((step, index) => {
        const isCompleted = isAllDone || index < currentIndex
        const isCurrent = !isAllDone && index === currentIndex

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style={{
                  background: isCompleted
                    ? 'var(--success)'
                    : isCurrent
                    ? 'var(--warning)'
                    : 'var(--bg-table-head)',
                  color: isCompleted || isCurrent ? '#fff' : 'var(--text-dim)',
                }}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className="text-xs mt-1"
                style={{
                  color: isCurrent ? 'var(--warning)' : 'var(--text-dim)',
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2"
                style={{ background: isCompleted ? 'var(--success)' : isCurrent ? 'var(--warning)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
