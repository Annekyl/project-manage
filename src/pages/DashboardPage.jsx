import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useProjectsWithDetails } from '../hooks/useProjects'
import { useUsers } from '../hooks/useUsers'
import { supabase } from '../utils/supabase'
import ProgressStepper from '../components/common/ProgressStepper'
import Pagination from '../components/common/Pagination'
import { Search, User } from 'lucide-react'
import { SkeletonCard } from '../components/common/Skeleton'
import { statusLabels } from '../utils/constants'
import { format } from 'date-fns'

const PAGE_SIZE = 10

export default function DashboardPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useProjectsWithDetails({ page, pageSize: PAGE_SIZE, search: debouncedSearch, status: statusFilter })
  const projects = data?.data || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['projectStats'],
    queryFn: async () => {
      const { count: total } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
      const { count: completed } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
      return { total: total || 0, completed: completed || 0 }
    },
    staleTime: 60_000,
  })

  const { data: users = [] } = useUsers()

  const userMap = {}
  users.forEach(u => { userMap[u.id] = u.name })

  function getResponsibleName(project) {
    const contract = project.contracts?.[0]
    const payment = project.payments?.[0]
    const invoice = project.invoices?.[0]
    const closure = project.closures?.[0]

    switch (project.status) {
      case 'contract':
        if (!contract?.draft_locked) return contract?.draft_responsible_name || contract?.draft_responsible_id
        if (!contract?.stamp_locked) return contract?.stamp_responsible_name || contract?.stamp_responsible_id
        if (!contract?.send_locked) return contract?.send_responsible_name || contract?.send_responsible_id
        if (!contract?.receipt_locked) return contract?.receipt_responsible_name || contract?.receipt_responsible_id
        break
      case 'payment':
        if (!payment?.payment_locked) return payment?.claim_responsible_name || payment?.claim_responsible_id
        break
      case 'invoice':
        if (!invoice?.invoice_locked) return invoice?.responsible_name || invoice?.responsible_id
        break
      case 'reimbursement':
        return project.reimbursements?.[0]?.responsible_name || project.reimbursements?.[0]?.responsible_id
      case 'closure':
        return closure?.responsible_name || closure?.responsible_id
    }
    return null
  }

  const statTotal = stats?.total ?? 0
  const statCompleted = stats?.completed ?? 0
  const statInProgress = statTotal - statCompleted

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>工作台</h1>
        <p className="mt-1" style={{ color: 'var(--text-dim)' }}>产学研项目管理总览</p>
      </div>

      {/* 搜索框 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目名称或企业名称..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl shadow-sm transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* 标签栏 */}
      <div className="border-b mb-5" style={{ borderColor: 'var(--border)' }}>
        <nav className="flex space-x-6" role="tablist">
          {[
            { key: '', label: '全部项目', count: statsLoading ? null : statTotal },
            { key: 'in_progress', label: '进行中', count: statsLoading ? null : statInProgress },
            { key: 'completed', label: '已完成', count: statsLoading ? null : statCompleted },
          ].map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={statusFilter === tab.key}
              onClick={() => { setStatusFilter(tab.key); setPage(1) }}
              className="py-2.5 px-1 border-b-2 font-medium text-sm transition-colors flex items-center"
              style={{
                borderColor: statusFilter === tab.key ? 'var(--accent)' : 'transparent',
                color: statusFilter === tab.key ? 'var(--accent)' : 'var(--text-dim)',
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span
                  className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full"
                  style={{
                    background: statusFilter === tab.key ? 'var(--accent-light)' : 'var(--bg-table-head)',
                    color: statusFilter === tab.key ? 'var(--accent)' : 'var(--text-dim)',
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* 项目卡片列表 */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-dim)' }}>
          {debouncedSearch ? '没有找到匹配的项目' : '暂无项目'}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {projects.map((project) => {
              const totalReimbursed = project.reimbursements?.reduce(
                (sum, r) => sum + (r.amount || 0),
                0
              ) || 0

              const responsibleId = getResponsibleName(project)
              const responsibleName = responsibleId
                ? (userMap[responsibleId] || responsibleId)
                : '未指定'

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="rounded-xl shadow cursor-pointer p-5 transition-all hover:shadow-lg"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--text-bright)' }}>{project.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{project.company_name}</p>
                      {project.company_contact && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>负责人: {project.company_contact}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      {statusLabels[project.status]}
                    </span>
                  </div>

                  <div className="mb-3">
                    <ProgressStepper currentStatus={project.status} />
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center" style={{ color: 'var(--text-dim)' }}>
                      <User className="w-4 h-4 mr-1" />
                      <span>当前责任人: {responsibleName}</span>
                    </div>
                    <div style={{ color: 'var(--text-dim)' }}>
                      ¥{project.total_amount?.toLocaleString() || '0'}
                    </div>
                  </div>

                  <div className="mt-2 flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>已报销: ¥{totalReimbursed.toLocaleString()}</span>
                    <span>{format(new Date(project.created_at), 'yyyy-MM-dd')}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 分页 */}
          <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
