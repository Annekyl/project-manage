import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useProjects } from '../hooks/useProjects'
import { supabase } from '../utils/supabase'
import ProgressStepper from '../components/common/ProgressStepper'
import { Search, FolderOpen, Clock, CheckCircle, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const PAGE_SIZE = 4

export default function DashboardPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useProjects({ page, pageSize: PAGE_SIZE, search: debouncedSearch })
  const projects = data?.data || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const { data: stats } = useQuery({
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

  const { data: users = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, name')
      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })

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

  const statusLabels = {
    contract: '合同阶段',
    payment: '打款阶段',
    invoice: '开票阶段',
    reimbursement: '报销阶段',
    closure: '结题阶段',
    completed: '已完成'
  }

  const statTotal = stats?.total || 0
  const statCompleted = stats?.completed || 0
  const statInProgress = statTotal - statCompleted

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
        <p className="text-gray-600">产学研项目管理总览</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <FolderOpen className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">全部项目</p>
              <p className="text-2xl font-bold text-gray-900">{statTotal}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">进行中</p>
              <p className="text-2xl font-bold text-gray-900">{statInProgress}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-gray-500">已完成</p>
              <p className="text-2xl font-bold text-gray-900">{statCompleted}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目名称或企业名称..."
            className="w-full pl-10 pr-4 py-2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 项目卡片列表 */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
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
                  className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{project.name}</h3>
                      <p className="text-sm text-gray-500">{project.company_name}</p>
                      {project.company_contact && (
                        <p className="text-xs text-gray-400 mt-1">负责人: {project.company_contact}</p>
                      )}
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {statusLabels[project.status]}
                    </span>
                  </div>

                  <div className="mb-3">
                    <ProgressStepper currentStatus={project.status} />
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-1" />
                      <span>当前责任人: {responsibleName}</span>
                    </div>
                    <div className="text-gray-500">
                      ¥{project.total_amount?.toLocaleString() || '0'}
                    </div>
                  </div>

                  <div className="mt-2 flex justify-between text-xs text-gray-400">
                    <span>已报销: ¥{totalReimbursed.toLocaleString()}</span>
                    <span>{format(new Date(project.created_at), 'yyyy-MM-dd')}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                共 {totalCount} 条，第 {page} / {totalPages} 页
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
