export const statusLabels = {
  audit_sign: '合同审核签收',
  stamp_upload: '合同盖章上传',
  send_out: '合同寄出',
  payment_invoice: '打款开票',
  reimbursement: '报销阶段',
  closure: '结题阶段',
  completed: '已完成'
}

export function getRemainingDays(deadline, status) {
  if (!deadline || status === 'completed') return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d - today) / 86400000)
}
