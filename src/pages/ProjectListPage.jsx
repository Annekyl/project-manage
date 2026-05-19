import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects, useCreateProject, useUpdateProject } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import { useInitContract } from '../hooks/useContract'
import { useDeleteProject } from '../hooks/useDeleteProject'
import { Plus, Search, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const PAGE_SIZE = 4

export default function ProjectListPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
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
    company_contact: '',
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

  const { data, isLoading } = useProjects({ page, pageSize: PAGE_SIZE, search: debouncedSearch })
  const projects = data?.data || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  async function handleCreate(e) {
    e.preventDefault()
    try {
      const project = await createProject.mutateAsync({
        ...formData,
        total_amount: parseFloat(formData.total_amount) || 0
      })
      await initContract.mutateAsync(project.id)
      toast.success('项目创建成功')
      setShowCreate(false)
      setFormData({ name: '', company_name: '', company_contact: '', total_amount: '' })
      navigate(`/projects/${project.id}`)
    } catch (error) {
      toast.error('创建失败: ' + error.message)
    }
  }

  async function handleDelete() {
    try {
      await deleteProject.mutateAsync(deleteConfirm.projectId)
      toast.success('项目已删除')
      setDeleteConfirm({ open: false, projectId: null, projectName: '' })
    } catch (error) {
      toast.error('删除失败: ' + error.message)
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
          company_contact: editProject.company_contact,
          total_amount: parseFloat(editProject.total_amount) || 0
        }
      })
      toast.success('项目已更新')
      setEditProject(null)
    } catch (error) {
      toast.error('更新失败: ' + error.message)
    }
  }

  const statusLabels = {
    contract: '合同阶段',
    payment: '打款阶段',
    invoice: '开票阶段',
    reimbursement: '报销阶段',
    closure: '结题阶段',
    completed: '已完成'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">项目列表</h1>
          <p className="text-gray-600">管理所有产学研项目</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建项目
          </button>
        )}
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

      {/* 项目表格 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {debouncedSearch ? '没有找到匹配的项目' : '暂无项目'}
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">企业名称</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">项目负责人</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">总金额</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">当前状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{project.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {project.company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {project.company_contact || '未指定'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    ¥{project.total_amount?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {statusLabels[project.status] || project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(project.created_at), 'yyyy-MM-dd')}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditProject({
                            id: project.id,
                            name: project.name,
                            company_name: project.company_name,
                            company_contact: project.company_contact || '',
                            total_amount: project.total_amount?.toString() || ''
                          })
                        }}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                        title="编辑项目"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm({ open: true, projectId: project.id, projectName: project.name })
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="删除项目"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
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

      {/* 删除确认弹窗 */}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirm({ open: false, projectId: null, projectName: '' })} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-2">确认删除</h2>
            <p className="text-gray-600 mb-4">
              确定要删除项目 <span className="font-medium text-gray-900">{deleteConfirm.projectName}</span> 吗？该项目的所有数据（包括合同、打款、开票、报销、结题记录及上传的文件）将被永久删除，且无法恢复。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm({ open: false, projectId: null, projectName: '' })}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProject.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProject.isPending ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑项目弹窗 */}
      {editProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditProject(null)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">编辑项目</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
                <input
                  type="text"
                  value={editProject.name}
                  onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">企业名称 *</label>
                <input
                  type="text"
                  value={editProject.company_name}
                  onChange={(e) => setEditProject({ ...editProject, company_name: e.target.value })}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目负责人</label>
                <input
                  type="text"
                  value={editProject.company_contact}
                  onChange={(e) => setEditProject({ ...editProject, company_contact: e.target.value })}
                  placeholder="请输入负责人姓名"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目总金额</label>
                <input
                  type="number"
                  value={editProject.total_amount}
                  onChange={(e) => setEditProject({ ...editProject, total_amount: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditProject(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={updateProject.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateProject.isPending ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 创建项目弹窗 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">新建项目</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">企业名称 *</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目负责人</label>
                <input
                  type="text"
                  value={formData.company_contact}
                  onChange={(e) => setFormData({ ...formData, company_contact: e.target.value })}
                  placeholder="请输入负责人姓名"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">项目总金额</label>
                <input
                  type="number"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={createProject.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createProject.isPending ? '创建中...' : '创建项目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
