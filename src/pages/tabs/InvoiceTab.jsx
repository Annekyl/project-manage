import { useState, useEffect } from 'react'
import { useInitInvoice, useUpdateInvoice, useLockInvoice } from '../../hooks/useInvoice'
import { useUpdateProjectStatus, isInvoiceComplete } from '../../hooks/useProjectStatus'
import UserSelect from '../../components/common/UserSelect'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmModal from '../../components/common/ConfirmModal'
import toast from 'react-hot-toast'

const INVOICE_TYPES = ['普通发票', '专用发票', '增值税发票']

export default function InvoiceTab({ project, isAdmin, currentUserId }) {
  const invoice = project.invoices?.[0]
  const initInvoice = useInitInvoice()
  const updateInvoice = useUpdateInvoice(project.id)
  const lockInvoice = useLockInvoice(project.id)
  const updateStatus = useUpdateProjectStatus(project.id)

  const [confirmModal, setConfirmModal] = useState(false)
  const [unlockConfirm, setUnlockConfirm] = useState(false)

  const [localData, setLocalData] = useState({
    invoice_type: '',
    invoice_amount: '',
    responsible_id: '',
    responsible_name: '',
    preview_sent_at: '',
    customer_confirmed_at: '',
    issued_at: '',
    sent_to_customer_at: ''
  })

  useEffect(() => {
    if (invoice) {
      setLocalData({
        invoice_type: invoice.invoice_type || '',
        invoice_amount: invoice.invoice_amount || '',
        responsible_id: invoice.responsible_id || currentUserId || '',
        responsible_name: invoice.responsible_name || '',
        preview_sent_at: invoice.preview_sent_at || '',
        customer_confirmed_at: invoice.customer_confirmed_at || '',
        issued_at: invoice.issued_at || '',
        sent_to_customer_at: invoice.sent_to_customer_at || ''
      })
    }
  }, [invoice])

  if (!invoice) {
    return (
      <div className="text-center py-8">
        <button
          onClick={() => initInvoice.mutate(project.id)}
          disabled={initInvoice.isPending}
          className="px-4 py-2 text-white rounded-xl btn-transition disabled:opacity-50"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {initInvoice.isPending ? '初始化中...' : '初始化开票记录'}
        </button>
      </div>
    )
  }

  function handleLocalChange(field, value) {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function handleLock() {
    try {
      await updateInvoice.mutateAsync({
        invoiceId: invoice.id,
        updates: localData
      })
      await lockInvoice.mutateAsync(invoice.id)

      await updateStatus.mutateAsync('reimbursement')
      toast.success('已锁定，开票阶段完成，进入报销阶段')
      setConfirmModal(false)
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  const isLocked = invoice.invoice_locked

  return (
    <div className="rounded-xl shadow-sm p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>开票信息</h3>
        <StatusBadge locked={isLocked} hasData={!!invoice.invoice_type || !!localData.invoice_type} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>发票类型</label>
          <select
            value={localData.invoice_type}
            onChange={(e) => handleLocalChange('invoice_type', e.target.value)}
            disabled={isLocked}
            className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
            style={{
              background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: isLocked ? 'var(--text-dim)' : 'var(--text)',
            }}
          >
            <option value="">请选择发票类型</option>
            {INVOICE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>开票金额 (元)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={localData.invoice_amount}
            onChange={(e) => handleLocalChange('invoice_amount', e.target.value)}
            disabled={isLocked}
            className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
            style={{
              background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: isLocked ? 'var(--text-dim)' : 'var(--text)',
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>开票责任人</label>
          <UserSelect
            value={localData.responsible_id}
            onChange={(v) => handleLocalChange('responsible_id', v)}
            disabled={isLocked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>具体负责人</label>
          <input
            type="text"
            value={localData.responsible_name}
            onChange={(e) => handleLocalChange('responsible_name', e.target.value)}
            disabled={isLocked}
            placeholder="输入负责人姓名"
            className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
            style={{
              background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: isLocked ? 'var(--text-dim)' : 'var(--text)',
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>预览图发送客户时间</label>
          <input
            type="datetime-local"
            value={localData.preview_sent_at?.slice(0, 16) || ''}
            onChange={(e) => handleLocalChange('preview_sent_at', e.target.value)}
            disabled={isLocked}
            className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
            style={{
              background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: isLocked ? 'var(--text-dim)' : 'var(--text)',
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>客户确认时间</label>
          <input
            type="datetime-local"
            value={localData.customer_confirmed_at?.slice(0, 16) || ''}
            onChange={(e) => handleLocalChange('customer_confirmed_at', e.target.value)}
            disabled={isLocked}
            className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
            style={{
              background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: isLocked ? 'var(--text-dim)' : 'var(--text)',
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>正式开票时间</label>
          <input
            type="datetime-local"
            value={localData.issued_at?.slice(0, 16) || ''}
            onChange={(e) => handleLocalChange('issued_at', e.target.value)}
            disabled={isLocked}
            className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
            style={{
              background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: isLocked ? 'var(--text-dim)' : 'var(--text)',
            }}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>发票发送给客户时间</label>
          <input
            type="datetime-local"
            value={localData.sent_to_customer_at?.slice(0, 16) || ''}
            onChange={(e) => handleLocalChange('sent_to_customer_at', e.target.value)}
            disabled={isLocked}
            className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
            style={{
              background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
              borderColor: 'var(--border)',
              color: isLocked ? 'var(--text-dim)' : 'var(--text)',
            }}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        {isLocked ? (
          isAdmin && (
            <button
              onClick={() => setUnlockConfirm(true)}
              className="px-4 py-2 text-sm rounded-xl btn-transition"
              style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
            >
              解锁
            </button>
          )
        ) : (
          <button
            onClick={() => setConfirmModal(true)}
            className="px-4 py-2 text-sm text-white rounded-xl btn-transition"
            style={{ background: 'var(--gradient-primary)' }}
          >
            提交并锁定
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmModal}
        onConfirm={handleLock}
        onCancel={() => setConfirmModal(false)}
        message="发票类型一旦锁定不可修改，请确认信息无误。确认提交？"
      />
      <ConfirmModal
        open={unlockConfirm}
        title="确认解锁"
        message="解锁后该环节将可以修改。确认解锁？"
        onConfirm={() => {
          updateInvoice.mutate({ invoiceId: invoice.id, updates: { invoice_locked: false } })
          setUnlockConfirm(false)
        }}
        onCancel={() => setUnlockConfirm(false)}
      />
    </div>
  )
}
