import { useState } from 'react'
import { useAddReimbursement, useConfirmReimbursement, useLockReimbursement } from '../../hooks/useReimbursements'
import { useUpdateProjectStatus } from '../../hooks/useProjectStatus'
import { useUsers } from '../../hooks/useUsers'
import UserSelect from '../../components/common/UserSelect'
import ConfirmModal from '../../components/common/ConfirmModal'
import { format } from 'date-fns'
import { Plus, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReimbursementTab({ project, isAdmin, currentUserId }) {
  const reimbursements = project.reimbursements || []
  const { data: users = [] } = useUsers()
  const userMap = {}
  users.forEach(u => { userMap[u.id] = u.name })
  const addReimbursement = useAddReimbursement(project.id)
  const confirmReimbursement = useConfirmReimbursement(project.id)
  const lockReimbursement = useLockReimbursement(project.id)
  const updateStatus = useUpdateProjectStatus(project.id)

  const [showForm, setShowForm] = useState(false)
  const [closureConfirm, setClosureConfirm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    responsible_id: currentUserId || '',
    recipient_type: 'teacher',
    recipient_name: '',
    notes: '',
    submitted_at: ''
  })

  const totalAmount = project.total_amount || 0
  const totalReimbursed = reimbursements.reduce((sum, r) => sum + (r.amount || 0), 0)
  const totalConfirmed = reimbursements
    .filter((r) => r.received_confirmed)
    .reduce((sum, r) => sum + (r.amount || 0), 0)
  const pendingAmount = totalAmount - totalReimbursed
  const progress = totalAmount > 0 ? (totalReimbursed / totalAmount) * 100 : 0

  async function handleSubmit(e) {
    e.preventDefault()
    const amount = parseFloat(formData.amount) || 0
    if (amount <= 0) { toast.error('报销金额必须大于 0'); return }
    if (amount > pendingAmount) { toast.error(`报销金额不能超过剩余可报销金额 ¥${pendingAmount.toLocaleString()}`); return }
    if (!formData.recipient_name?.trim()) { toast.error('请填写收款人姓名'); return }
    try {
      await addReimbursement.mutateAsync({
        ...formData,
        amount
      })
      toast.success('报销记录已添加')
      setShowForm(false)
      setFormData({
        amount: '',
        responsible_id: '',
        recipient_type: 'teacher',
        recipient_name: '',
        notes: '',
        submitted_at: ''
      })
    } catch (error) {
      toast.error('添加失败: ' + error.message)
    }
  }

  function handleConfirm(id) {
    confirmReimbursement.mutate(id, {
      onSuccess: () => toast.success('已确认到账')
    })
  }

  function handleLock(id) {
    lockReimbursement.mutate(id, {
      onSuccess: () => toast.success('已锁定')
    })
  }

  const isFullyReimbursed = totalReimbursed >= totalAmount

  async function handleMoveToClosure() {
    if (!isFullyReimbursed) {
      setClosureConfirm(true)
      return
    }
    try {
      await updateStatus.mutateAsync('closure')
      toast.success('已进入结题阶段')
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* 汇总区 */}
      <div className="rounded-xl shadow-sm p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>报销汇总</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>项目总金额</p>
            <p className="text-xl font-bold" style={{ color: 'var(--text-bright)' }}>¥{totalAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>已报销</p>
            <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>¥{totalReimbursed.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>待报销</p>
            <p className="text-xl font-bold" style={{ color: 'var(--warning)' }}>¥{pendingAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>已确认到账</p>
            <p className="text-xl font-bold" style={{ color: 'var(--success)' }}>¥{totalConfirmed.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full rounded-full h-2.5" style={{ background: 'var(--bg-table-head)' }}>
          <div
            className="h-2.5 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%`, background: 'var(--gradient-primary)' }}
          />
        </div>
        <p className="text-sm mt-2" style={{ color: 'var(--text-dim)' }}>报销进度: {progress.toFixed(1)}%</p>
        {!isFullyReimbursed && (
          <p className="text-sm mt-1" style={{ color: 'var(--warning)' }}>
            ⚠ 报销金额未达到项目总金额，还差 ¥{(totalAmount - totalReimbursed).toLocaleString()}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleMoveToClosure}
            className="px-4 py-2 text-sm text-white rounded-xl btn-transition"
            style={{ background: isFullyReimbursed ? 'var(--gradient-success)' : 'var(--gradient-warning)' }}
          >
            {isFullyReimbursed ? '进入结题阶段' : '进入结题阶段（报销未完成）'}
          </button>
          <ConfirmModal
            open={closureConfirm}
            title="确认进入结题"
            message={`当前报销金额 ¥${totalReimbursed.toLocaleString()} 未达到项目总金额 ¥${totalAmount.toLocaleString()}，还差 ¥${(totalAmount - totalReimbursed).toLocaleString()}。确定要进入结题阶段吗？`}
            onConfirm={async () => {
              setClosureConfirm(false)
              try {
                await updateStatus.mutateAsync('closure')
                toast.success('已进入结题阶段')
              } catch (error) {
                toast.error('操作失败: ' + error.message)
              }
            }}
            onCancel={() => setClosureConfirm(false)}
          />
        </div>
      </div>

      {/* 报销记录列表 */}
      <div className="rounded-xl shadow-sm p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>报销记录</h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-3 py-1.5 text-sm text-white rounded-xl btn-transition"
            style={{ background: 'var(--gradient-primary)' }}
          >
            <Plus className="w-4 h-4 mr-1" />
            新增报销
          </button>
        </div>

        {reimbursements.length === 0 ? (
          <p className="text-center py-4" style={{ color: 'var(--text-dim)' }}>暂无报销记录</p>
        ) : (
          <div className="space-y-4">
            {reimbursements.map((r) => (
              <div key={r.id} className="rounded-xl p-4" style={{ border: '1px solid var(--border-light)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-medium" style={{ color: 'var(--text-bright)' }}>第{r.seq}次报销</span>
                    {r.received_confirmed ? (
                      <span className="ml-2 flex items-center text-sm" style={{ color: 'var(--success)' }}>
                        <Check className="w-4 h-4 mr-1" />
                        已确认
                      </span>
                    ) : (
                      <span className="ml-2 flex items-center text-sm" style={{ color: 'var(--warning)' }}>
                        <AlertCircle className="w-4 h-4 mr-1" />
                        待确认
                      </span>
                    )}
                  </div>
                  {isAdmin && !r.received_confirmed && (
                    <button
                      onClick={() => handleConfirm(r.id)}
                      className="text-sm transition-colors"
                      style={{ color: 'var(--accent)' }}
                    >
                      确认到账
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm" style={{ color: 'var(--text-dim)' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>经办人: </span>
                    {userMap[r.responsible_id] || (r.responsible_id ? '已指定' : '未指定')}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>提交时间: </span>
                    {r.submitted_at ? format(new Date(r.submitted_at), 'yyyy-MM-dd') : '-'}
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>金额: </span>
                    <span className="font-medium" style={{ color: 'var(--text)' }}>¥{r.amount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>收款人: </span>
                    {r.recipient_name} ({r.recipient_type === 'teacher' ? '老师' : '学生'})
                  </div>
                </div>
                {r.notes && (
                  <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>说明: {r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新增报销表单 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 backdrop-blur-sm" style={{ background: 'var(--bg-modal-overlay)' }} onClick={() => setShowForm(false)} />
          <div className="relative rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 modal-enter" style={{ background: 'var(--bg-card)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-bright)' }}>新增报销记录</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>报销金额 (元) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full rounded-xl shadow-sm transition-all"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>经办人</label>
                <UserSelect
                  value={formData.responsible_id}
                  onChange={(v) => setFormData({ ...formData, responsible_id: v })}
                  disabled={!isAdmin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>收款人类型</label>
                <select
                  value={formData.recipient_type}
                  onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })}
                  className="w-full rounded-xl shadow-sm transition-all"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                >
                  <option value="teacher">老师</option>
                  <option value="student">学生</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>收款人姓名 *</label>
                <input
                  type="text"
                  required
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  className="w-full rounded-xl shadow-sm transition-all"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>提交时间</label>
                <input
                  type="datetime-local"
                  value={formData.submitted_at}
                  onChange={(e) => setFormData({ ...formData, submitted_at: e.target.value })}
                  className="w-full rounded-xl shadow-sm transition-all"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>说明</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl shadow-sm transition-all"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium rounded-xl btn-transition"
                  style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={addReimbursement.isPending}
                  className="px-4 py-2 text-sm font-medium text-white rounded-xl btn-transition disabled:opacity-50"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  {addReimbursement.isPending ? '提交中...' : '提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
