import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

export function useProjects({ page = 1, pageSize = 4, search = '' } = {}) {
  return useQuery({
    queryKey: ['projects', { page, pageSize, search }],
    queryFn: async () => {
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('projects')
        .select(`
          *,
          contracts(*),
          payments(*),
          invoices(*),
          reimbursements(*),
          closures(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (search) {
        query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%`)
      }

      const { data, count, error } = await query
      if (error) throw error
      return { data, totalCount: count || 0 }
    }
  })
}

export function useProject(id) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          contracts(*),
          payments(*),
          invoices(*),
          reimbursements(*),
          closures(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    }
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values) => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...values, created_by: user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] })
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] })
  })
}
