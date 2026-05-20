import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useCreateProject, useUpdateProject } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { useInitContract } from '../hooks/useContract'
import { useDeleteProject } from '../hooks/useDeleteProject'
import { Plus, Search, Trash2, Pencil, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { SkeletonTable } from '../components/common/Skeleton'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import { exportCsv } from '../utils/exportCsv'
import { statusLabels } from '../utils/constants'
import { translateError } from '../utils/errors'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const PAGE_SIZE = 10

export default function ProjectListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sort, setSort] = useState({ field: 'created_at', asc: false })
  const { isAdmin } = useAuth()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const initContract = useInitContract()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, projectId: null, projectName: '' })
  const [editProject, setEditProject] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    total_amount: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data, isLoading } = useProjects({ page, pageSize: PAGE_SIZE, search: debouncedSearch, status: statusFilter })
  const projects = data?.data || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const project = await createProject.mutateAsync({
        ...formData,
        total_amount: Math.max(0, parseFloat(formData.total_amount) || 0)
      })
      await initContract.mutateAsync(project.id)
      toast.success('项目创建成功')
      setShowCreate(false)
      setFormData({ name: '', company_name: '', total_amount: '' })
      navigate(`/projects/${project.id}`)
    } catch (error) {
      toast.error('创建失败: ' + translateError(error.message))
    }
  }

  async function handleDelete() {
    try {
      await deleteProject.mutateAsync(deleteConfirm.projectId)
      toast.success('项目已删除')
      setDeleteConfirm({ open: false, projectId: null, projectName: '' })
    } catch (error) {
      toast.error('删除失败: ' + translateError(error.message))
    }
  }

  async function handleUpdate(e) {
    e.preventDefault()
    try {
      await updateProject.mutateAsync({
        id: editProject.id,
        updates: {
          name: editProject.name,
          company_name: editProject.company_name,
          total_amount: Math.max(0, parseFloat(editProject.total_amount) || 0)
        }
      })
      toast.success('项目已更新')
      setEditProject(null)
    } catch (error) {
      toast.error('更新失败: ' + translateError(error.message))
    }
  }

  const inputStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }

  // 客户端排序
  const sortedProjects = [...projects].sort((a, b) => {
    const { field, asc } = sort
    let va = a[field], vb = b[field]
    if (field === 'total_amount') { va = va || 0; vb = vb || 0 }
    if (va < vb) return asc ? -1 : 1
    if (va > vb) return asc ? 1 : -1
    return 0
  })

  function handleSort(field) {
    setSort(prev => prev.field === field ? { field, asc: !prev.asc } : { field, asc: true })
  }

  return (
    <div className="page-enter">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>项目填报</h1>
          <p className="mt-1" style={{ color: 'var(--text-dim)' }}>管理所有产学研项目</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const headers = ['项目名称', '企业名称', '总金额', '状态', '创建时间']
              const rows = projects.map(p => [p.name, p.company_name, p.total_amount || 0, statusLabels[p.status] || p.status, p.created_at])
              exportCsv('项目填报.csv', headers, rows)
            }}
            className="flex items-center px-3 py-2.5 text-sm rounded-xl btn-transition"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <Download className="w-4 h-4 mr-1" />
            导出
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center px-4 py-2.5 text-white rounded-xl shadow-md btn-transition"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Plus className="w-4 h-4 mr-2" />
            新建项目
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索项目名称或企业名称..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl shadow-sm transition-all"
            style={inputStyle}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2.5 rounded-xl shadow-sm transition-all sm:w-40"
          style={inputStyle}
        >
          <option value="">全部状态</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* 项目表格 */}
      <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        {isLoading ? (
          <div className="p-4"><SkeletonTable rows={5} cols={5} /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--text-dim)' }}>
            {debouncedSearch ? '没有找到匹配的项目' : '暂无项目'}
          </div>
        ) : (
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-light)' }}>
            <thead style={{ background: 'var(--bg-table-head)' }}>
              <tr>
                {[
                  { key: 'name', label: '项目名称' },
                  { key: 'company_name', label: '企业名称' },
                  { key: 'total_amount', label: '总金额' },
                  { key: 'status', label: '当前状态' },
                  { key: 'created_at', label: '创建时间' },
                ].map(col => (
                  <th key={col.key} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none hover:opacity-80" style={{ color: 'var(--text-dim)' }} onClick={() => handleSort(col.key)}>
                    <span className="inline-flex items-center">
                      {col.label}
                      {sort.field === col.key
                        ? (sort.asc ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)
                        : <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />}
                    </span>
                  </th>
                ))}
                <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>操作</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
              {sortedProjects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ background: 'var(--bg-table-row)' }}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium" style={{ color: 'var(--text-bright)' }}>{project.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-dim)' }}>
                    {project.company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--accent2)' }}>
                    ¥{(project.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                      {statusLabels[project.status] || project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-muted)' }}>
                    {format(new Date(project.created_at), 'yyyy-MM-dd')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditProject({
                          id: project.id,
                          name: project.name,
                          company_name: project.company_name,
                          total_amount: project.total_amount?.toString() || ''
                        })
                      }}
                      className="mr-3 transition-colors"
                      style={{ color: 'var(--accent)' }}
                      title="编辑项目"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm({ open: true, projectId: project.id, projectName: project.name })
                        }}
                        className="transition-colors"
                        style={{ color: 'var(--danger)' }}
                        title="删除项目"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      <Pagination page={page} totalPages={totalPages} totalCount={totalCount} onPageChange={setPage} />

      {/* 删除确认弹窗 */}
      <Modal open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, projectId: null, projectName: '' })} title="确认删除" maxWidth="max-w-sm">
        <p className="mb-4" style={{ color: 'var(--text-dim)' }}>
          确定要删除项目 <span className="font-medium" style={{ color: 'var(--text-bright)' }}>{deleteConfirm.projectName}</span> 吗？该项目的所有数据将被永久删除，且无法恢复。
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setDeleteConfirm({ open: false, projectId: null, projectName: '' })}
            className="px-4 py-2 text-sm font-medium rounded-xl btn-transition"
            style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
          >
            取消
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteProject.isPending}
            className="px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-50 btn-transition"
            style={{ background: 'var(--gradient-danger)' }}
          >
            {deleteProject.isPending ? '删除中...' : '确认删除'}
          </button>
        </div>
      </Modal>

      {/* 编辑项目弹窗 */}
      <Modal open={!!editProject} onClose={() => setEditProject(null)} title="编辑项目">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>项目名称 *</label>
            <input type="text" value={editProject?.name || ''} onChange={(e) => setEditProject({ ...editProject, name: e.target.value })} required className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>企业名称 *</label>
            <input type="text" value={editProject?.company_name || ''} onChange={(e) => setEditProject({ ...editProject, company_name: e.target.value })} required className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>项目总金额</label>
            <input type="number" min="0" step="0.01" value={editProject?.total_amount || ''} onChange={(e) => setEditProject({ ...editProject, total_amount: e.target.value })} className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setEditProject(null)} className="px-4 py-2.5 text-sm font-medium rounded-xl btn-transition" style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}>取消</button>
            <button type="submit" disabled={updateProject.isPending} className="px-4 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50 btn-transition" style={{ background: 'var(--gradient-primary)' }}>
              {updateProject.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 创建项目弹窗 */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="新建项目">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>项目名称 *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>企业名称 *</label>
            <input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} required className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>项目总金额</label>
            <input type="number" min="0" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })} className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl btn-transition" style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}>取消</button>
            <button type="submit" disabled={createProject.isPending} className="px-4 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50 btn-transition" style={{ background: 'var(--gradient-primary)' }}>
              {createProject.isPending ? '创建中...' : '创建项目'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
