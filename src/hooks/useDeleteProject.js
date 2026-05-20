import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (projectId) => {
      // 1. 列出并删除 Storage 中该项目的所有文件
      const folders = [
        `contracts/${projectId}`,
        `payments/${projectId}`,
        `closures/${projectId}`,
      ]

      for (const folder of folders) {
        const { data: files } = await supabase.storage
          .from('project-files')
          .list(folder, { limit: 100, recursive: true })

        if (files && files.length > 0) {
          const paths = files.map(f => `${folder}/${f.name}`)
          await supabase.storage.from('project-files').remove(paths)
        }
      }

      // 2. 先删除审计日志（该表外键未设级联删除）
      await supabase
        .from('audit_logs')
        .delete()
        .eq('project_id', projectId)

      // 3. 删除项目（其余子表有级联删除）
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
    }
  })
}
