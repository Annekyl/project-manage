import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

// 初始化合同记录（项目创建后调用一次）
export function useInitContract() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (projectId) => {
      const { data, error } = await supabase
        .from('contracts')
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

// 更新合同某个子环节字段
export function useUpdateContract(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ contractId, updates }) => {
      const { error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', contractId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 锁定合同
export function useLockContract(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contractId) => {
      const { error } = await supabase
        .from('contracts')
        .update({ contract_locked: true })
        .eq('id', contractId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 解锁合同（仅 admin）
export function useUnlockContract(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (contractId) => {
      const { error } = await supabase
        .from('contracts')
        .update({ contract_locked: false })
        .eq('id', contractId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}
