import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

export function useUpdateProjectStatus(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (status) => {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', projectId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['project', projectId] })
    }
  })
}

// 检查合同阶段是否完成
export function isContractComplete(contract) {
  if (!contract) return false
  return (
    contract.draft_locked &&
    contract.stamp_locked &&
    contract.send_locked &&
    contract.receipt_locked
  )
}

// 检查打款阶段是否完成
export function isPaymentComplete(payment) {
  if (!payment) return false
  return payment.payment_locked && payment.claim_locked
}

// 检查开票阶段是否完成
export function isInvoiceComplete(invoice) {
  if (!invoice) return false
  return invoice.invoice_locked
}

// 检查报销阶段是否完成（所有报销记录都已锁定）
export function isReimbursementComplete(reimbursements) {
  if (!reimbursements || reimbursements.length === 0) return false
  return reimbursements.every(r => r.reimbursement_locked)
}

// 检查结题阶段是否完成
export function isClosureComplete(closure) {
  if (!closure) return false
  return closure.closure_locked && closure.status === 'completed'
}
