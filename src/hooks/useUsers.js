import { useQuery } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .order('name')
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}
