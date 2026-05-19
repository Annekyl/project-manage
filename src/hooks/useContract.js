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

// 锁定某子环节（提交确认）
export function useLockContractSection(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ contractId, section }) => {
      // section: 'draft' | 'stamp' | 'send' | 'receipt'
      const { error } = await supabase
        .from('contracts')
        .update({ [`${section}_locked`]: true })
        .eq('id', contractId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 解锁某子环节（仅 admin）
export function useUnlockContractSection(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ contractId, section }) => {
      const { error } = await supabase
        .from('contracts')
        .update({ [`${section}_locked`]: false })
        .eq('id', contractId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}
