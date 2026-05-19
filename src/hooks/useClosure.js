import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

// 初始化结题记录
export function useInitClosure() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (projectId) => {
      const { data, error } = await supabase
        .from('closures')
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

// 更新结题信息
export function useUpdateClosure(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ closureId, updates }) => {
      const { error } = await supabase
        .from('closures')
        .update(updates)
        .eq('id', closureId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}

// 锁定结题
export function useLockClosure(projectId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (closureId) => {
      const { error } = await supabase
        .from('closures')
        .update({ closure_locked: true })
        .eq('id', closureId)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['project', projectId] })
  })
}
