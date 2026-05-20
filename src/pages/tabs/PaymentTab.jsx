import { useState, useEffect } from 'react'
import { useInitPayment, useUpdatePayment, useLockPayment } from '../../hooks/usePayment'
import { useUpdateProjectStatus, isPaymentComplete, isPaymentInvoiceComplete } from '../../hooks/useProjectStatus'
import UserSelect from '../../components/common/UserSelect'
import FileUpload from '../../components/common/FileUpload'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmModal from '../../components/common/ConfirmModal'
import toast from 'react-hot-toast'
import { translateError } from '../../utils/errors'

export default function PaymentTab({ project, isAdmin, currentUserId }) {
  const payment = project.payments?.[0]
  const initPayment = useInitPayment()
  const updatePayment = useUpdatePayment(project.id)
  const lockPayment = useLockPayment(project.id)
  const updateStatus = useUpdateProjectStatus(project.id)

  const [confirmModal, setConfirmModal] = useState({ open: false, section: null })
  const [unlockConfirm, setUnlockConfirm] = useState({ open: false, section: null })

  const [localData, setLocalData] = useState({
    payment: {},
    claim: {}
  })

  useEffect(() => {
    if (payment) {
      setLocalData({
        payment: {
          payment_responsible_id: payment.payment_responsible_id || currentUserId || '',
          payment_amount: payment.payment_amount || '',
          payment_screenshot_url: payment.payment_screenshot_url || '',
          bank_flow_number: payment.bank_flow_number || '',
          paid_at: payment.paid_at || ''
        },
        claim: {
          claim_responsible_id: payment.claim_responsible_id || currentUserId || '',
          claimed_at: payment.claimed_at || '',
          virtual_account_confirmed: payment.virtual_account_confirmed || false
        }
      })
    }
  }, [payment])

  if (!payment) {
    return (
      <div className="text-center py-8">
        <button
          onClick={() => initPayment.mutate(project.id)}
          disabled={initPayment.isPending}
          className="px-4 py-2 text-white rounded-xl btn-transition disabled:opacity-50"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {initPayment.isPending ? '初始化中...' : '初始化打款记录'}
        </button>
      </div>
    )
  }

  function handleLocalChange(section, field, value) {
    setLocalData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  async function handleLock(section) {
    try {
      await updatePayment.mutateAsync({
        paymentId: payment.id,
        updates: localData[section]
      })
      await lockPayment.mutateAsync({ paymentId: payment.id, section })

      const updatedPayment = {
        ...payment,
        ...localData[section],
        [`${section}_locked`]: true
      }
      if (isPaymentComplete(updatedPayment)) {
        const invoice = project.invoices?.[0]
        if (isPaymentInvoiceComplete(updatedPayment, invoice)) {
          await updateStatus.mutateAsync('reimbursement')
          toast.success('已锁定，打款开票阶段完成，进入报销阶段')
        } else {
          toast.success('已锁定，等待开票部分完成')
        }
      } else {
        toast.success('已锁定')
      }

      setConfirmModal({ open: false, section: null })
    } catch (error) {
      toast.error('操作失败: ' + translateError(error.message))
    }
  }

  const isPaymentLocked = payment.payment_locked
  const isClaimLocked = payment.claim_locked

  return (
    <div className="space-y-6">
      {/* 客户打款 */}
      <div className="rounded-xl shadow-sm p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>客户打款</h3>
          <StatusBadge locked={isPaymentLocked} hasData={!!payment.payment_amount || !!localData.payment.payment_amount} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
            <UserSelect
              value={localData.payment.payment_responsible_id}
              onChange={(v) => handleLocalChange('payment', 'payment_responsible_id', v)}
              disabled={isPaymentLocked || !isAdmin}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>打款金额 (元)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={localData.payment.payment_amount}
              onChange={(e) => handleLocalChange('payment', 'payment_amount', e.target.value)}
              disabled={isPaymentLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isPaymentLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isPaymentLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>到账时间</label>
            <input
              type="datetime-local"
              value={localData.payment.paid_at?.slice(0, 16) || ''}
              onChange={(e) => handleLocalChange('payment', 'paid_at', e.target.value)}
              disabled={isPaymentLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isPaymentLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isPaymentLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>银行流水单号</label>
            <input
              type="text"
              value={localData.payment.bank_flow_number}
              onChange={(e) => handleLocalChange('payment', 'bank_flow_number', e.target.value)}
              disabled={isPaymentLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isPaymentLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isPaymentLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>打款截图</label>
          <FileUpload
            value={localData.payment.payment_screenshot_url}
            onChange={(v) => handleLocalChange('payment', 'payment_screenshot_url', v)}
            folder={`payments/${project.id}`}
            disabled={isPaymentLocked}
          />
        </div>

        <div className="mt-4 flex justify-end">
          {isPaymentLocked ? (
            isAdmin ? (
              <button
                onClick={() => setUnlockConfirm({ open: true, section: 'payment' })}
                className="px-4 py-2 text-sm rounded-xl btn-transition"
                style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
              >
                解锁
              </button>
            ) : (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>如需解锁请联系管理员</span>
            )
          ) : (
            <button
              onClick={() => setConfirmModal({ open: true, section: 'payment' })}
              className="px-4 py-2 text-sm text-white rounded-xl btn-transition"
              style={{ background: 'var(--gradient-primary)' }}
            >
              提交并锁定
            </button>
          )}
        </div>
      </div>

      {/* 经费认领 */}
      <div className="rounded-xl shadow-sm p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>经费认领</h3>
          <StatusBadge locked={isClaimLocked} hasData={!!payment.claim_responsible_id || !!localData.claim.claim_responsible_id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>认领责任人</label>
            <UserSelect
              value={localData.claim.claim_responsible_id}
              onChange={(v) => handleLocalChange('claim', 'claim_responsible_id', v)}
              disabled={isClaimLocked || !isAdmin}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>认领时间</label>
            <input
              type="datetime-local"
              value={localData.claim.claimed_at?.slice(0, 16) || ''}
              onChange={(e) => handleLocalChange('claim', 'claimed_at', e.target.value)}
              disabled={isClaimLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isClaimLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isClaimLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localData.claim.virtual_account_confirmed}
              onChange={(e) => handleLocalChange('claim', 'virtual_account_confirmed', e.target.checked)}
              disabled={isClaimLocked}
              className="rounded"
              style={{ borderColor: 'var(--border)', accentColor: 'var(--accent)' }}
            />
            <span className="ml-2 text-sm" style={{ color: 'var(--text)' }}>虚拟账户已确认到账</span>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          {isClaimLocked ? (
            isAdmin ? (
              <button
                onClick={() => setUnlockConfirm({ open: true, section: 'claim' })}
                className="px-4 py-2 text-sm rounded-xl btn-transition"
                style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
              >
                解锁
              </button>
            ) : (
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>如需解锁请联系管理员</span>
            )
          ) : (
            <button
              onClick={() => setConfirmModal({ open: true, section: 'claim' })}
              className="px-4 py-2 text-sm text-white rounded-xl btn-transition"
              style={{ background: 'var(--gradient-primary)' }}
            >
              提交并锁定
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        onConfirm={() => handleLock(confirmModal.section)}
        onCancel={() => setConfirmModal({ open: false, section: null })}
      />
      <ConfirmModal
        open={unlockConfirm.open}
        title="确认解锁"
        message="解锁后该环节将可以修改，项目状态将回退。确认解锁？"
        onConfirm={async () => {
          const field = unlockConfirm.section === 'payment' ? 'payment_locked' : 'claim_locked'
          updatePayment.mutate({ paymentId: payment.id, updates: { [field]: false } })
          if (project.status !== 'payment_invoice') {
            await updateStatus.mutateAsync('payment_invoice')
          }
          setUnlockConfirm({ open: false, section: null })
        }}
        onCancel={() => setUnlockConfirm({ open: false, section: null })}
      />
    </div>
  )
}
