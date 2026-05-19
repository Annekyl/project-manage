import { useState, useEffect } from 'react'
import { useInitContract, useUpdateContract, useLockContractSection, useUnlockContractSection } from '../../hooks/useContract'
import { useUpdateProjectStatus, isContractComplete } from '../../hooks/useProjectStatus'
import UserSelect from '../../components/common/UserSelect'
import FileUpload from '../../components/common/FileUpload'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmModal from '../../components/common/ConfirmModal'
import toast from 'react-hot-toast'

export default function ContractTab({ project, isAdmin, currentUserId }) {
  const contract = project.contracts?.[0]
  const initContract = useInitContract()
  const updateContract = useUpdateContract(project.id)
  const lockSection = useLockContractSection(project.id)
  const unlockSection = useUnlockContractSection(project.id)
  const updateStatus = useUpdateProjectStatus(project.id)

  const [confirmModal, setConfirmModal] = useState({ open: false, section: null })

  const [localData, setLocalData] = useState({
    draft: {},
    stamp: {},
    send: {},
    receipt: {}
  })

  useEffect(() => {
    if (contract) {
      setLocalData({
        draft: {
          draft_responsible_id: contract.draft_responsible_id || currentUserId || '',
          draft_responsible_name: contract.draft_responsible_name || '',
          draft_confirmed_at: contract.draft_confirmed_at || '',
          draft_file_url: contract.draft_file_url || ''
        },
        stamp: {
          stamp_responsible_id: contract.stamp_responsible_id || currentUserId || '',
          stamp_responsible_name: contract.stamp_responsible_name || '',
          stamp_completed_at: contract.stamp_completed_at || '',
          stamp_count: contract.stamp_count || '',
          stamp_scan_url: contract.stamp_scan_url || ''
        },
        send: {
          send_responsible_id: contract.send_responsible_id || currentUserId || '',
          send_responsible_name: contract.send_responsible_name || '',
          sent_at: contract.sent_at || '',
          tracking_number: contract.tracking_number || '',
          courier: contract.courier || '顺丰'
        },
        receipt: {
          receipt_responsible_id: contract.receipt_responsible_id || currentUserId || '',
          receipt_responsible_name: contract.receipt_responsible_name || '',
          customer_confirmed_at: contract.customer_confirmed_at || '',
          receipt_screenshot_url: contract.receipt_screenshot_url || '',
          customer_confirm_screenshot_url: contract.customer_confirm_screenshot_url || ''
        }
      })
    }
  }, [contract])

  if (!contract) {
    return (
      <div className="text-center py-8">
        <button
          onClick={() => initContract.mutate(project.id)}
          disabled={initContract.isPending}
          className="px-4 py-2 text-white rounded-xl btn-transition disabled:opacity-50"
          style={{ background: 'var(--gradient-primary)' }}
        >
          {initContract.isPending ? '初始化中...' : '初始化合同记录'}
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
      await updateContract.mutateAsync({
        contractId: contract.id,
        updates: localData[section]
      })
      await lockSection.mutateAsync({ contractId: contract.id, section })

      const updatedContract = {
        ...contract,
        ...localData[section],
        [`${section}_locked`]: true
      }
      if (isContractComplete(updatedContract)) {
        await updateStatus.mutateAsync('payment')
        toast.success('已锁定，合同阶段完成，进入打款阶段')
      } else {
        toast.success('已锁定')
      }

      setConfirmModal({ open: false, section: null })
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  function handleUnlock(section) {
    unlockSection.mutate(
      { contractId: contract.id, section },
      { onSuccess: () => toast.success('已解锁') }
    )
  }

  const isDraftLocked = contract.draft_locked
  const isStampLocked = contract.stamp_locked
  const isSendLocked = contract.send_locked
  const isReceiptLocked = contract.receipt_locked

  return (
    <div className="space-y-6">
      <ContractSection
        title="合同定稿"
        locked={isDraftLocked}
        hasData={!!contract.draft_responsible_id || !!localData.draft.draft_responsible_id}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
            <UserSelect
              value={localData.draft.draft_responsible_id}
              onChange={(v) => handleLocalChange('draft', 'draft_responsible_id', v)}
              disabled={isDraftLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>具体负责人</label>
            <input
              type="text"
              value={localData.draft.draft_responsible_name}
              onChange={(e) => handleLocalChange('draft', 'draft_responsible_name', e.target.value)}
              disabled={isDraftLocked}
              placeholder="输入负责人姓名"
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isDraftLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isDraftLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>定稿时间</label>
            <input
              type="datetime-local"
              value={localData.draft.draft_confirmed_at?.slice(0, 16) || ''}
              onChange={(e) => handleLocalChange('draft', 'draft_confirmed_at', e.target.value)}
              disabled={isDraftLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isDraftLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isDraftLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>合同文件</label>
          <FileUpload
            value={localData.draft.draft_file_url}
            onChange={(v) => handleLocalChange('draft', 'draft_file_url', v)}
            folder={`contracts/${project.id}/draft`}
            disabled={isDraftLocked}
          />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          {isDraftLocked ? (
            isAdmin && (
              <button
                onClick={() => handleUnlock('draft')}
                className="px-4 py-2 text-sm rounded-xl btn-transition"
                style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
              >
                解锁
              </button>
            )
          ) : (
            <button
              onClick={() => setConfirmModal({ open: true, section: 'draft' })}
              className="px-4 py-2 text-sm text-white rounded-xl btn-transition"
              style={{ background: 'var(--gradient-primary)' }}
            >
              提交并锁定
            </button>
          )}
        </div>
      </ContractSection>

      <ContractSection
        title="合同盖章"
        locked={isStampLocked}
        hasData={!!contract.stamp_responsible_id || !!localData.stamp.stamp_responsible_id}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
            <UserSelect
              value={localData.stamp.stamp_responsible_id}
              onChange={(v) => handleLocalChange('stamp', 'stamp_responsible_id', v)}
              disabled={isStampLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>具体负责人</label>
            <input
              type="text"
              value={localData.stamp.stamp_responsible_name}
              onChange={(e) => handleLocalChange('stamp', 'stamp_responsible_name', e.target.value)}
              disabled={isStampLocked}
              placeholder="输入负责人姓名"
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isStampLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isStampLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>盖章时间</label>
            <input
              type="datetime-local"
              value={localData.stamp.stamp_completed_at?.slice(0, 16) || ''}
              onChange={(e) => handleLocalChange('stamp', 'stamp_completed_at', e.target.value)}
              disabled={isStampLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isStampLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isStampLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>合同份数</label>
            <input
              type="number"
              value={localData.stamp.stamp_count}
              onChange={(e) => handleLocalChange('stamp', 'stamp_count', e.target.value)}
              disabled={isStampLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isStampLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isStampLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>盖章扫描件</label>
          <FileUpload
            value={localData.stamp.stamp_scan_url}
            onChange={(v) => handleLocalChange('stamp', 'stamp_scan_url', v)}
            folder={`contracts/${project.id}/stamp`}
            disabled={isStampLocked}
          />
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          {isStampLocked ? (
            isAdmin && (
              <button
                onClick={() => handleUnlock('stamp')}
                className="px-4 py-2 text-sm rounded-xl btn-transition"
                style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
              >
                解锁
              </button>
            )
          ) : (
            <button
              onClick={() => setConfirmModal({ open: true, section: 'stamp' })}
              className="px-4 py-2 text-sm text-white rounded-xl btn-transition"
              style={{ background: 'var(--gradient-primary)' }}
            >
              提交并锁定
            </button>
          )}
        </div>
      </ContractSection>

      <ContractSection
        title="合同寄送"
        locked={isSendLocked}
        hasData={!!contract.send_responsible_id || !!localData.send.send_responsible_id}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
            <UserSelect
              value={localData.send.send_responsible_id}
              onChange={(v) => handleLocalChange('send', 'send_responsible_id', v)}
              disabled={isSendLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>具体负责人</label>
            <input
              type="text"
              value={localData.send.send_responsible_name}
              onChange={(e) => handleLocalChange('send', 'send_responsible_name', e.target.value)}
              disabled={isSendLocked}
              placeholder="输入负责人姓名"
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isSendLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isSendLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>寄出时间</label>
            <input
              type="datetime-local"
              value={localData.send.sent_at?.slice(0, 16) || ''}
              onChange={(e) => handleLocalChange('send', 'sent_at', e.target.value)}
              disabled={isSendLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isSendLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isSendLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>快递单号</label>
            <input
              type="text"
              value={localData.send.tracking_number}
              onChange={(e) => handleLocalChange('send', 'tracking_number', e.target.value)}
              disabled={isSendLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isSendLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isSendLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>快递公司</label>
            <input
              type="text"
              value={localData.send.courier}
              onChange={(e) => handleLocalChange('send', 'courier', e.target.value)}
              disabled={isSendLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isSendLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isSendLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          {isSendLocked ? (
            isAdmin && (
              <button
                onClick={() => handleUnlock('send')}
                className="px-4 py-2 text-sm rounded-xl btn-transition"
                style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
              >
                解锁
              </button>
            )
          ) : (
            <button
              onClick={() => setConfirmModal({ open: true, section: 'send' })}
              className="px-4 py-2 text-sm text-white rounded-xl btn-transition"
              style={{ background: 'var(--gradient-primary)' }}
            >
              提交并锁定
            </button>
          )}
        </div>
      </ContractSection>

      <ContractSection
        title="签收确认"
        locked={isReceiptLocked}
        hasData={!!contract.receipt_responsible_id || !!localData.receipt.receipt_responsible_id}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
            <UserSelect
              value={localData.receipt.receipt_responsible_id}
              onChange={(v) => handleLocalChange('receipt', 'receipt_responsible_id', v)}
              disabled={isReceiptLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>具体负责人</label>
            <input
              type="text"
              value={localData.receipt.receipt_responsible_name}
              onChange={(e) => handleLocalChange('receipt', 'receipt_responsible_name', e.target.value)}
              disabled={isReceiptLocked}
              placeholder="输入负责人姓名"
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isReceiptLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isReceiptLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>客户确认时间</label>
            <input
              type="datetime-local"
              value={localData.receipt.customer_confirmed_at?.slice(0, 16) || ''}
              onChange={(e) => handleLocalChange('receipt', 'customer_confirmed_at', e.target.value)}
              disabled={isReceiptLocked}
              className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
              style={{
                background: isReceiptLocked ? 'var(--bg-table-head)' : 'var(--bg-input)',
                borderColor: 'var(--border)',
                color: isReceiptLocked ? 'var(--text-dim)' : 'var(--text)',
              }}
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>快递签收截图</label>
            <FileUpload
              value={localData.receipt.receipt_screenshot_url}
              onChange={(v) => handleLocalChange('receipt', 'receipt_screenshot_url', v)}
              folder={`contracts/${project.id}/receipt`}
              disabled={isReceiptLocked}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>客户确认聊天截图</label>
            <FileUpload
              value={localData.receipt.customer_confirm_screenshot_url}
              onChange={(v) => handleLocalChange('receipt', 'customer_confirm_screenshot_url', v)}
              folder={`contracts/${project.id}/receipt`}
              disabled={isReceiptLocked}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          {isReceiptLocked ? (
            isAdmin && (
              <button
                onClick={() => handleUnlock('receipt')}
                className="px-4 py-2 text-sm rounded-xl btn-transition"
                style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}
              >
                解锁
              </button>
            )
          ) : (
            <button
              onClick={() => setConfirmModal({ open: true, section: 'receipt' })}
              className="px-4 py-2 text-sm text-white rounded-xl btn-transition"
              style={{ background: 'var(--gradient-primary)' }}
            >
              提交并锁定
            </button>
          )}
        </div>
      </ContractSection>

      <ConfirmModal
        open={confirmModal.open}
        onConfirm={() => handleLock(confirmModal.section)}
        onCancel={() => setConfirmModal({ open: false, section: null })}
      />
    </div>
  )
}

function ContractSection({ title, locked, hasData, children }) {
  return (
    <div className="rounded-xl shadow-sm p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>{title}</h3>
        <StatusBadge locked={locked} hasData={hasData} />
      </div>
      {children}
    </div>
  )
}
