import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

export function useAddReimbursement(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values) => {
      // 自动计算 seq：取当前最大值 + 1，避免并发竞态
      const { data: maxRow } = await supabase
        .from('reimbursements')
        .select('seq')
        .eq('project_id', projectId)
        .order('seq', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextSeq = (maxRow?.seq || 0) + 1

      const { data, error } = await supabase
        .from('reimbursements')
        .insert({ ...values, project_id: projectId, seq: nextSeq })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 更新报销记录
export function useUpdateReimbursement(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ reimbursementId, updates }) => {
      const { error } = await supabase
        .from('reimbursements')
        .update(updates)
        .eq('id', reimbursementId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 老师确认到账
export function useConfirmReimbursement(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reimbursementId) => {
      const { error } = await supabase
        .from('reimbursements')
        .update({
          received_confirmed: true,
          received_confirmed_at: new Date().toISOString()
        })
        .eq('id', reimbursementId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 锁定报销记录
export function useLockReimbursement(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reimbursementId) => {
      const { error } = await supabase
        .from('reimbursements')
        .update({ reimbursement_locked: true })
        .eq('id', reimbursementId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}
