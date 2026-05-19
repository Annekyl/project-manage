import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

// 初始化开票记录
export function useInitInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (projectId) => {
      const { data, error } = await supabase
        .from('invoices')
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

// 更新开票信息
export function useUpdateInvoice(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ invoiceId, updates }) => {
      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 锁定开票
export function useLockInvoice(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (invoiceId) => {
      const { error } = await supabase
        .from('invoices')
        .update({ invoice_locked: true })
        .eq('id', invoiceId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}
