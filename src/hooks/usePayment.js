import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

// 初始化打款记录
export function useInitPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (projectId) => {
      const { data, error } = await supabase
        .from('payments')
        .insert({ project_id: projectId })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_, projectId) =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 更新打款信息
export function useUpdatePayment(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId, updates }) => {
      const { error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', paymentId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 锁定打款环节
export function useLockPayment(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ paymentId, section }) => {
      // section: 'payment' | 'claim'
      const { error } = await supabase
        .from('payments')
        .update({ [`${section}_locked`]: true })
        .eq('id', paymentId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}
