import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (projectId) => {
      // 1. 获取项目关联的所有文件路径
      const filePaths = []

      // 合同文件
      const { data: contracts } = await supabase
        .from('contracts')
        .select('draft_file_url, stamp_scan_url, receipt_screenshot_url, customer_confirm_screenshot_url')
        .eq('project_id', projectId)

      if (contracts) {
        contracts.forEach(c => {
          if (c.draft_file_url) filePaths.push(c.draft_file_url)
          if (c.stamp_scan_url) filePaths.push(c.stamp_scan_url)
          if (c.receipt_screenshot_url) filePaths.push(c.receipt_screenshot_url)
          if (c.customer_confirm_screenshot_url) filePaths.push(c.customer_confirm_screenshot_url)
        })
      }

      // 打款文件
      const { data: payments } = await supabase
        .from('payments')
        .select('payment_screenshot_url')
        .eq('project_id', projectId)

      if (payments) {
        payments.forEach(p => {
          if (p.payment_screenshot_url) filePaths.push(p.payment_screenshot_url)
        })
      }

      // 结题文件
      const { data: closures } = await supabase
        .from('closures')
        .select('report_file_url')
        .eq('project_id', projectId)

      if (closures) {
        closures.forEach(c => {
          if (c.report_file_url) filePaths.push(c.report_file_url)
        })
      }

      // 2. 删除 Storage 中的文件
      if (filePaths.length > 0) {
        await supabase.storage
          .from('project-files')
          .remove(filePaths)
      }

      // 3. 删除数据库记录（由于外键级联删除，删除项目会自动删除关联记录）
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
