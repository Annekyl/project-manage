import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../utils/supabase'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { UserPlus, X, Loader2, Download } from 'lucide-react'
import ConfirmModal from '../components/common/ConfirmModal'
import Pagination from '../components/common/Pagination'
import Modal from '../components/common/Modal'
import { SkeletonTable } from '../components/common/Skeleton'
import { exportCsv } from '../utils/exportCsv'

const PAGE_SIZE = 10

export default function AdminPage() {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState('users')
  const [logFilter, setLogFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [newUser, setNewUser] = useState({ email: '', password: '', name: '' })
  const [userPage, setUserPage] = useState(1)
  const [logPage, setLogPage] = useState(1)
  const [detailData, setDetailData] = useState(null)
  const [roleConfirm, setRoleConfirm] = useState({ open: false, userId: '', userName: '', newRole: '' })
  const [editingName, setEditingName] = useState({ userId: '', name: '' })
  const [resetConfirm, setResetConfirm] = useState({ open: false, userId: '', userName: '' })

  // Users query
  const { data: userData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', userPage],
    queryFn: async () => {
      const from = (userPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      if (error) throw error
      return { data: data || [], totalCount: count || 0 }
    }
  })

  const users = userData?.data || []
  const userTotalCount = userData?.totalCount || 0
  const userTotalPages = Math.ceil(userTotalCount / PAGE_SIZE)

  // Logs query
  const { data: logData, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-logs', logPage, logFilter, dateFrom, dateTo],
    queryFn: async () => {
      const from = (logPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)
      if (logFilter) query = query.eq('project_id', logFilter)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59')
      const { data, count, error } = await query
      if (error) throw error
      return { data: data || [], totalCount: count || 0 }
    }
  })

  const logs = logData?.data || []
  const logTotalCount = logData?.totalCount || 0
  const logTotalPages = Math.ceil(logTotalCount / PAGE_SIZE)

  // Mutations
  const roleMutation = useMutation({
    mutationFn: async ({ userId, newRole }) => {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('角色已更新')
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error) => toast.error('更新失败: ' + error.message)
  })

  const nameMutation = useMutation({
    mutationFn: async ({ userId, name }) => {
      const { error } = await supabase.from('profiles').update({ name }).eq('id', userId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('姓名已更新')
      setEditingName({ userId: '', name: '' })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error) => toast.error('更新失败: ' + error.message)
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId }) => {
      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: userId,
        new_password: 'user123'
      })
      if (error) throw error
    },
    onSuccess: () => {
      setResetConfirm({ open: false, userId: '', userName: '' })
      toast.success('密码已重置为 user123')
    },
    onError: (error) => toast.error('重置失败: ' + error.message)
  })

  const createUserMutation = useMutation({
    mutationFn: async ({ email, password, name }) => {
      const { error } = await supabase.auth.signUp({
        email, password, options: { data: { name } }
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('用户创建成功，请用户查收确认邮件')
      setShowCreateUser(false)
      setNewUser({ email: '', password: '', name: '' })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error) => toast.error('创建失败: ' + error.message)
  })

  function handleRoleChange(userId, userName, newRole) {
    setRoleConfirm({ open: true, userId, userName, newRole })
  }

  function confirmRoleChange() {
    const { userId, newRole } = roleConfirm
    roleMutation.mutate({ userId, newRole })
    setRoleConfirm({ open: false, userId: '', userName: '', newRole: '' })
  }

  function handleCreateUser(e) {
    e.preventDefault()
    createUserMutation.mutate(newUser)
  }

  const inputStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>系统管理</h1>
        <p className="mt-1" style={{ color: 'var(--text-dim)' }}>用户管理和审计日志</p>
      </div>

      {/* Tab 导航 */}
      <div className="border-b mb-6" style={{ borderColor: 'var(--border)' }}>
        <nav className="flex space-x-8" role="tablist">
          {['users', 'logs'].map(tab => (
            <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className="py-2.5 px-1 border-b-2 font-medium text-sm transition-colors" style={{ borderColor: activeTab === tab ? 'var(--accent)' : 'transparent', color: activeTab === tab ? 'var(--accent)' : 'var(--text-dim)' }}>
              {tab === 'users' ? '用户管理' : '审计日志'}
            </button>
          ))}
        </nav>
      </div>

      {/* 用户管理 */}
      {activeTab === 'users' && (
        <div>
          <div className="flex justify-end mb-4 space-x-2">
            <button
              onClick={() => {
                const headers = ['姓名', '邮箱', 'ID', '角色', '注册时间']
                const rows = users.map(u => [u.name, u.email || '', u.id, u.role === 'admin' ? '管理员' : '成员', u.created_at])
                exportCsv('用户列表.csv', headers, rows)
              }}
              className="flex items-center px-3 py-2.5 text-sm rounded-xl btn-transition"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <Download className="w-4 h-4 mr-1" /> 导出
            </button>
            <button onClick={() => setShowCreateUser(true)} className="flex items-center px-4 py-2.5 text-white rounded-xl shadow-md btn-transition" style={{ background: 'var(--gradient-primary)' }}>
              <UserPlus className="w-4 h-4 mr-2" /> 创建用户
            </button>
          </div>
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            {usersLoading ? (
              <div className="p-4"><SkeletonTable rows={5} cols={5} /></div>
            ) : users.length === 0 ? (
              <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>暂无用户</div>
            ) : (
              <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-light)' }}>
                <thead style={{ background: 'var(--bg-table-head)' }}>
                  <tr>
                    {['姓名', '邮箱', 'ID', '角色', '注册时间', '操作'].map(h => (
                      <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                  {users.map((user) => (
                    <tr key={user.id} className="transition-colors" style={{ background: 'var(--bg-table-row)' }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingName.userId === user.id ? (
                          <form
                            onSubmit={(e) => { e.preventDefault(); nameMutation.mutate({ userId: user.id, name: editingName.name }) }}
                            className="flex items-center space-x-2"
                          >
                            <input
                              type="text"
                              value={editingName.name}
                              onChange={(e) => setEditingName({ ...editingName, name: e.target.value })}
                              className="rounded-lg shadow-sm text-sm transition-all w-32"
                              style={inputStyle}
                              autoFocus
                            />
                            <button type="submit" className="text-xs font-medium transition-colors" style={{ color: 'var(--success)' }}>保存</button>
                            <button type="button" onClick={() => setEditingName({ userId: '', name: '' })} className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>取消</button>
                          </form>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3" style={{ background: 'var(--gradient-primary)' }}>{user.name?.[0] || '?'}</div>
                            <span className="font-medium mr-2" style={{ color: 'var(--text-bright)' }}>{user.name}</span>
                            <button
                              onClick={() => setEditingName({ userId: user.id, name: user.name || '' })}
                              className="text-xs transition-colors"
                              style={{ color: 'var(--accent)' }}
                            >
                              编辑
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-dim)' }}>{user.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono" style={{ color: 'var(--text-dim)' }}>{user.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select value={user.role} onChange={(e) => handleRoleChange(user.id, user.name, e.target.value)} className="rounded-lg shadow-sm text-sm transition-all" style={inputStyle}>
                          <option value="member">成员</option>
                          <option value="admin">管理员</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-dim)' }}>{format(new Date(user.created_at), 'yyyy-MM-dd HH:mm')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setResetConfirm({ open: true, userId: user.id, userName: user.name })}
                          className="transition-colors"
                          style={{ color: 'var(--warning)' }}
                        >
                          重置密码
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <Pagination page={userPage} totalPages={userTotalPages} totalCount={userTotalCount} onPageChange={setUserPage} />
        </div>
      )}

      {/* 创建用户弹窗 */}
      <Modal open={showCreateUser} onClose={() => setShowCreateUser(false)} title="创建新用户">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>姓名 *</label><input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} /></div>
          <div><label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>邮箱 *</label><input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} /></div>
          <div><label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>密码 *</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} /></div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setShowCreateUser(false)} className="px-4 py-2.5 text-sm font-medium rounded-xl btn-transition" style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}>取消</button>
            <button type="submit" disabled={createUserMutation.isPending} className="px-4 py-2.5 text-sm font-medium text-white rounded-xl btn-transition disabled:opacity-50" style={{ background: 'var(--gradient-primary)' }}>
              {createUserMutation.isPending ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 审计日志 */}
      {activeTab === 'logs' && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
            <input type="text" value={logFilter} onChange={(e) => { setLogFilter(e.target.value); setLogPage(1) }} placeholder="按项目 ID 筛选..." className="w-full max-w-xs rounded-xl shadow-sm transition-all" style={inputStyle} />
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setLogPage(1) }} className="rounded-xl shadow-sm transition-all text-sm" style={inputStyle} />
            <span className="text-sm" style={{ color: 'var(--text-dim)' }}>至</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setLogPage(1) }} className="rounded-xl shadow-sm transition-all text-sm" style={inputStyle} />
            <button
              onClick={() => {
                const headers = ['时间', '操作表', '动作', '记录 ID']
                const rows = logs.map(l => [l.created_at, l.table_name, l.action, l.record_id || ''])
                exportCsv('审计日志.csv', headers, rows)
              }}
              className="flex items-center px-3 py-2.5 text-sm rounded-xl btn-transition shrink-0"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <Download className="w-4 h-4 mr-1" /> 导出
            </button>
          </div>
          <div className="rounded-xl shadow-sm overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
            <table className="min-w-full divide-y" style={{ borderColor: 'var(--border-light)' }}>
              <thead style={{ background: 'var(--bg-table-head)' }}>
                <tr>
                  {['时间', '操作表', '动作', '记录 ID', '详情'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-light)' }}>
                {logsLoading ? (
                  <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--text-dim)' }}><div className="flex items-center justify-center"><Loader2 className="w-5 h-5 mr-2 spinner" />加载中...</div></td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>暂无日志记录</td></tr>
                ) : logs.map((log) => (
                  <tr key={log.id} className="transition-colors" style={{ background: 'var(--bg-table-row)' }}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--text-dim)' }}>{format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--text-bright)' }}>{log.table_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full" style={{ background: log.action === 'INSERT' ? 'var(--success-light)' : 'var(--accent-light)', color: log.action === 'INSERT' ? 'var(--success)' : 'var(--accent)' }}>{log.action}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono" style={{ color: 'var(--text-dim)' }}>{log.record_id?.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm"><button onClick={() => setDetailData(log.new_data)} className="font-medium transition-colors" style={{ color: 'var(--accent)' }}>查看数据</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={logPage} totalPages={logTotalPages} totalCount={logTotalCount} onPageChange={setLogPage} />
        </div>
      )}

      <ConfirmModal
        open={roleConfirm.open}
        title="确认修改角色"
        message={`确定将用户「${roleConfirm.userName}」的角色修改为${roleConfirm.newRole === 'admin' ? '管理员' : '成员'}？`}
        onConfirm={confirmRoleChange}
        onCancel={() => setRoleConfirm({ open: false, userId: '', userName: '', newRole: '' })}
      />

      <ConfirmModal
        open={resetConfirm.open}
        title="确认重置密码"
        message={`确定要重置用户「${resetConfirm.userName}」的密码？重置后密码为：user123`}
        onConfirm={() => resetPasswordMutation.mutate({ userId: resetConfirm.userId })}
        onCancel={() => setResetConfirm({ open: false, userId: '', userName: '' })}
      />

      {/* 数据详情弹窗 */}
      <Modal open={detailData !== null} onClose={() => setDetailData(null)} title="数据详情" maxWidth="max-w-2xl">
        <div className="max-h-[60vh] overflow-auto">
          <pre className="text-sm p-4 rounded-xl whitespace-pre-wrap break-words font-mono" style={{ background: 'var(--bg-table-head)', color: 'var(--text)', border: '1px solid var(--border-light)' }}>
            {JSON.stringify(detailData, null, 2)}
          </pre>
        </div>
      </Modal>
    </div>
  )
}
