import { useState, useEffect } from 'react'
import { useInitPayment, useUpdatePayment, useLockPayment } from '../../hooks/usePayment'
import { useUpdateProjectStatus, isPaymentComplete } from '../../hooks/useProjectStatus'
import UserSelect from '../../components/common/UserSelect'
import FileUpload from '../../components/common/FileUpload'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmModal from '../../components/common/ConfirmModal'
import toast from 'react-hot-toast'

export default function PaymentTab({ project, isAdmin }) {
  const payment = project.payments?.[0]
  const initPayment = useInitPayment()
  const updatePayment = useUpdatePayment(project.id)
  const lockPayment = useLockPayment(project.id)
  const updateStatus = useUpdateProjectStatus(project.id)

  const [confirmModal, setConfirmModal] = useState({ open: false, section: null })

  // 本地状态
  const [localData, setLocalData] = useState({
    payment: {},
    claim: {}
  })

  // 从数据库加载初始值
  useEffect(() => {
    if (payment) {
      setLocalData({
        payment: {
          payment_amount: payment.payment_amount || '',
          payment_screenshot_url: payment.payment_screenshot_url || '',
          bank_flow_number: payment.bank_flow_number || '',
          paid_at: payment.paid_at || ''
        },
        claim: {
          claim_responsible_id: payment.claim_responsible_id || '',
          claim_responsible_name: payment.claim_responsible_name || '',
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
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {initPayment.isPending ? '初始化中...' : '初始化打款记录'}
        </button>
      </div>
    )
  }

  // 更新本地状态
  function handleLocalChange(section, field, value) {
    setLocalData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  // 提交并锁定
  async function handleLock(section) {
    try {
      await updatePayment.mutateAsync({
        paymentId: payment.id,
        updates: localData[section]
      })
      await lockPayment.mutateAsync({ paymentId: payment.id, section })

      // 检查打款阶段是否全部完成
      const updatedPayment = {
        ...payment,
        ...localData[section],
        [`${section}_locked`]: true
      }
      if (isPaymentComplete(updatedPayment)) {
        await updateStatus.mutateAsync('invoice')
        toast.success('已锁定，打款阶段完成，进入开票阶段')
      } else {
        toast.success('已锁定')
      }

      setConfirmModal({ open: false, section: null })
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  const isPaymentLocked = payment.payment_locked
  const isClaimLocked = payment.claim_locked

  return (
    <div className="space-y-6">
      {/* 客户打款 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">客户打款</h3>
          <StatusBadge locked={isPaymentLocked} hasData={!!payment.payment_amount || !!localData.payment.payment_amount} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">打款金额 (元)</label>
            <input
              type="number"
              value={localData.payment.payment_amount}
              onChange={(e) => handleLocalChange('payment', 'payment_amount', e.target.value)}
              disabled={isPaymentLocked}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">到账时间</label>
            <input
              type="datetime-local"
              value={localData.payment.paid_at?.slice(0, 16) || ''}
              onChange={(e) => handleLocalChange('payment', 'paid_at', e.target.value)}
              disabled={isPaymentLocked}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">银行流水单号</label>
            <input
              type="text"
              value={localData.payment.bank_flow_number}
              onChange={(e) => handleLocalChange('payment', 'bank_flow_number', e.target.value)}
              disabled={isPaymentLocked}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">打款截图</label>
          <FileUpload
            value={localData.payment.payment_screenshot_url}
            onChange={(v) => handleLocalChange('payment', 'payment_screenshot_url', v)}
            folder={`payments/${project.id}`}
            disabled={isPaymentLocked}
          />
        </div>

        <div className="mt-4 flex justify-end">
          {isPaymentLocked ? (
            isAdmin && (
              <button
                onClick={() => updatePayment.mutate({ paymentId: payment.id, updates: { payment_locked: false } })}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                解锁
              </button>
            )
          ) : (
            <button
              onClick={() => setConfirmModal({ open: true, section: 'payment' })}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              提交并锁定
            </button>
          )}
        </div>
      </div>

      {/* 经费认领 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">经费认领</h3>
          <StatusBadge locked={isClaimLocked} hasData={!!payment.claim_responsible_id || !!localData.claim.claim_responsible_id} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">认领责任人</label>
            <UserSelect
              value={localData.claim.claim_responsible_id}
              onChange={(v) => handleLocalChange('claim', 'claim_responsible_id', v)}
              disabled={isClaimLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">具体负责人</label>
            <input
              type="text"
              value={localData.claim.claim_responsible_name}
              onChange={(e) => handleLocalChange('claim', 'claim_responsible_name', e.target.value)}
              disabled={isClaimLocked}
              placeholder="输入负责人姓名"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">认领时间</label>
            <input
              type="datetime-local"
              value={localData.claim.claimed_at?.slice(0, 16) || ''}
              onChange={(e) => handleLocalChange('claim', 'claimed_at', e.target.value)}
              disabled={isClaimLocked}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
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
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">虚拟账户已确认到账</span>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          {isClaimLocked ? (
            isAdmin && (
              <button
                onClick={() => updatePayment.mutate({ paymentId: payment.id, updates: { claim_locked: false } })}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                解锁
              </button>
            )
          ) : (
            <button
              onClick={() => setConfirmModal({ open: true, section: 'claim' })}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
    </div>
  )
}
