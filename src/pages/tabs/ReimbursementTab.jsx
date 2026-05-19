import { useState } from 'react'
import { useAddReimbursement, useConfirmReimbursement, useLockReimbursement } from '../../hooks/useReimbursements'
import { useUpdateProjectStatus } from '../../hooks/useProjectStatus'
import UserSelect from '../../components/common/UserSelect'
import ConfirmModal from '../../components/common/ConfirmModal'
import { format } from 'date-fns'
import { Plus, Check, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ReimbursementTab({ project, isAdmin }) {
  const reimbursements = project.reimbursements || []
  const addReimbursement = useAddReimbursement(project.id)
  const confirmReimbursement = useConfirmReimbursement(project.id)
  const lockReimbursement = useLockReimbursement(project.id)
  const updateStatus = useUpdateProjectStatus(project.id)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    responsible_id: '',
    responsible_name: '',
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
    try {
      await addReimbursement.mutateAsync({
        ...formData,
        amount: parseFloat(formData.amount) || 0
      })
      toast.success('报销记录已添加')
      setShowForm(false)
      setFormData({
        amount: '',
        responsible_id: '',
        responsible_name: '',
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
      const confirmed = window.confirm(
        `当前报销金额 ¥${totalReimbursed.toLocaleString()} 未达到项目总金额 ¥${totalAmount.toLocaleString()}，还差 ¥${(totalAmount - totalReimbursed).toLocaleString()}。确定要进入结题阶段吗？`
      )
      if (!confirmed) return
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
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">报销汇总</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">项目总金额</p>
            <p className="text-xl font-bold text-gray-900">¥{totalAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">已报销</p>
            <p className="text-xl font-bold text-blue-600">¥{totalReimbursed.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">待报销</p>
            <p className="text-xl font-bold text-yellow-600">¥{pendingAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">已确认到账</p>
            <p className="text-xl font-bold text-green-600">¥{totalConfirmed.toLocaleString()}</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">报销进度: {progress.toFixed(1)}%</p>
        {!isFullyReimbursed && (
          <p className="text-sm text-yellow-600 mt-1">
            ⚠ 报销金额未达到项目总金额，还差 ¥{(totalAmount - totalReimbursed).toLocaleString()}
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleMoveToClosure}
            className={`px-4 py-2 text-sm text-white rounded-md ${
              isFullyReimbursed
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {isFullyReimbursed ? '进入结题阶段' : '进入结题阶段（报销未完成）'}
          </button>
        </div>
      </div>

      {/* 报销记录列表 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">报销记录</h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            新增报销
          </button>
        </div>

        {reimbursements.length === 0 ? (
          <p className="text-gray-500 text-center py-4">暂无报销记录</p>
        ) : (
          <div className="space-y-4">
            {reimbursements.map((r) => (
              <div key={r.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">第{r.seq}次报销</span>
                    {r.received_confirmed ? (
                      <span className="ml-2 flex items-center text-sm text-green-600">
                        <Check className="w-4 h-4 mr-1" />
                        已确认
                      </span>
                    ) : (
                      <span className="ml-2 flex items-center text-sm text-yellow-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        待确认
                      </span>
                    )}
                  </div>
                  {isAdmin && !r.received_confirmed && (
                    <button
                      onClick={() => handleConfirm(r.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      确认到账
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="text-gray-500">经办人: </span>
                    {r.responsible_name || (r.responsible_id ? '已指定' : '未指定')}
                  </div>
                  <div>
                    <span className="text-gray-500">提交时间: </span>
                    {r.submitted_at ? format(new Date(r.submitted_at), 'yyyy-MM-dd') : '-'}
                  </div>
                  <div>
                    <span className="text-gray-500">金额: </span>
                    <span className="font-medium">¥{r.amount?.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">收款人: </span>
                    {r.recipient_name} ({r.recipient_type === 'teacher' ? '老师' : '学生'})
                  </div>
                </div>
                {r.notes && (
                  <p className="text-sm text-gray-500 mt-2">说明: {r.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 新增报销表单 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">新增报销记录</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">报销金额 (元) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">经办人</label>
                <UserSelect
                  value={formData.responsible_id}
                  onChange={(v) => setFormData({ ...formData, responsible_id: v })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">具体负责人</label>
                <input
                  type="text"
                  value={formData.responsible_name}
                  onChange={(e) => setFormData({ ...formData, responsible_name: e.target.value })}
                  placeholder="输入负责人姓名"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">收款人类型</label>
                <select
                  value={formData.recipient_type}
                  onChange={(e) => setFormData({ ...formData, recipient_type: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="teacher">老师</option>
                  <option value="student">学生</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">收款人姓名</label>
                <input
                  type="text"
                  value={formData.recipient_name}
                  onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">提交时间</label>
                <input
                  type="datetime-local"
                  value={formData.submitted_at}
                  onChange={(e) => setFormData({ ...formData, submitted_at: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">说明</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={addReimbursement.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
