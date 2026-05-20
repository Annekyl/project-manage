import { useState, useEffect } from 'react'
import { useInitContract, useUpdateContract, useLockContract, useUnlockContract } from '../../hooks/useContract'
import { useUpdateProjectStatus } from '../../hooks/useProjectStatus'
import UserSelect from '../../components/common/UserSelect'
import FileUpload from '../../components/common/FileUpload'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmModal from '../../components/common/ConfirmModal'
import toast from 'react-hot-toast'

export default function ContractTab({ project, isAdmin, currentUserId }) {
  const contract = project.contracts?.[0]

  const initContract = useInitContract()
  const updateContract = useUpdateContract(project.id)
  const lockContract = useLockContract(project.id)
  const unlockContract = useUnlockContract(project.id)
  const updateStatus = useUpdateProjectStatus(project.id)

  const [confirmModal, setConfirmModal] = useState({ open: false, mode: null })
  const [localData, setLocalData] = useState({})

  useEffect(() => {
    if (!contract) return
    setLocalData({
      audit_sign_responsible_id: contract.audit_sign_responsible_id || currentUserId || '',
      audit_sign_file_url: contract.audit_sign_file_url || '',
      audit_sign_confirmed_at: contract.audit_sign_confirmed_at || '',
      sign_confirm_responsible_id: contract.sign_confirm_responsible_id || currentUserId || '',
      sign_screenshot_url: contract.sign_screenshot_url || '',
      sign_confirm_screenshot_url: contract.sign_confirm_screenshot_url || '',
      sign_confirmed_at: contract.sign_confirmed_at || '',
      stamp_upload_responsible_id: contract.stamp_upload_responsible_id || currentUserId || '',
      stamp_upload_count: contract.stamp_upload_count || '',
      stamp_upload_scan_url: contract.stamp_upload_scan_url || '',
      stamp_upload_completed_at: contract.stamp_upload_completed_at || '',
      send_out_responsible_id: contract.send_out_responsible_id || currentUserId || '',
      tracking_number: contract.tracking_number || '',
      courier: contract.courier || '顺丰',
      sent_at: contract.sent_at || '',
    })
  }, [contract, currentUserId])

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

  const isLocked = contract.contract_locked

  function update(field, value) {
    setLocalData(prev => ({ ...prev, [field]: value }))
  }

  async function handleLock() {
    try {
      await updateContract.mutateAsync({ contractId: contract.id, updates: localData })
      await lockContract.mutateAsync(contract.id)
      await updateStatus.mutateAsync('payment_invoice')
      toast.success('合同已锁定，进入打款开票')
      setConfirmModal({ open: false, mode: null })
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  async function handleUnlock() {
    try {
      await unlockContract.mutateAsync(contract.id)
      await updateStatus.mutateAsync('contract')
      toast.success('已解锁')
      setConfirmModal({ open: false, mode: null })
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  const inputStyle = (locked) => ({
    background: locked ? 'var(--bg-table-head)' : 'var(--bg-input)',
    borderColor: 'var(--border)',
    color: locked ? 'var(--text-dim)' : 'var(--text)',
  })

  return (
    <div className="space-y-6">
      {/* 审核签收 */}
      <Section title="审核签收" locked={isLocked} hasData={!!contract.audit_sign_responsible_id}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
            <UserSelect value={localData.audit_sign_responsible_id} onChange={(v) => update('audit_sign_responsible_id', v)} disabled={isLocked || !isAdmin} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>审核时间</label>
            <input type="datetime-local" value={localData.audit_sign_confirmed_at?.slice(0, 16) || ''} onChange={(e) => update('audit_sign_confirmed_at', e.target.value)} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={inputStyle(isLocked)} />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>合同文件</label>
          <FileUpload value={localData.audit_sign_file_url} onChange={(v) => update('audit_sign_file_url', v)} folder={`contracts/${project.id}/audit_sign`} disabled={isLocked} />
        </div>
      </Section>

      {/* 签收确认 */}
      <Section title="签收确认" locked={isLocked} hasData={!!contract.sign_confirm_responsible_id}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>签收确认人</label>
            <UserSelect value={localData.sign_confirm_responsible_id} onChange={(v) => update('sign_confirm_responsible_id', v)} disabled={isLocked || !isAdmin} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>客户确认时间</label>
            <input type="datetime-local" value={localData.sign_confirmed_at?.slice(0, 16) || ''} onChange={(e) => update('sign_confirmed_at', e.target.value)} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={inputStyle(isLocked)} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>快递签收截图</label>
            <FileUpload value={localData.sign_screenshot_url} onChange={(v) => update('sign_screenshot_url', v)} folder={`contracts/${project.id}/sign`} disabled={isLocked} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>客户确认聊天截图</label>
            <FileUpload value={localData.sign_confirm_screenshot_url} onChange={(v) => update('sign_confirm_screenshot_url', v)} folder={`contracts/${project.id}/sign`} disabled={isLocked} />
          </div>
        </div>
      </Section>

      {/* 盖章上传 */}
      <Section title="盖章上传" locked={isLocked} hasData={!!contract.stamp_upload_responsible_id}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
            <UserSelect value={localData.stamp_upload_responsible_id} onChange={(v) => update('stamp_upload_responsible_id', v)} disabled={isLocked || !isAdmin} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>盖章时间</label>
            <input type="datetime-local" value={localData.stamp_upload_completed_at?.slice(0, 16) || ''} onChange={(e) => update('stamp_upload_completed_at', e.target.value)} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={inputStyle(isLocked)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>合同份数</label>
            <input type="number" value={localData.stamp_upload_count} onChange={(e) => update('stamp_upload_count', e.target.value)} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={inputStyle(isLocked)} />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>盖章扫描件</label>
          <FileUpload value={localData.stamp_upload_scan_url} onChange={(v) => update('stamp_upload_scan_url', v)} folder={`contracts/${project.id}/stamp_upload`} disabled={isLocked} />
        </div>
      </Section>

      {/* 寄出 */}
      <Section title="寄出" locked={isLocked} hasData={!!contract.send_out_responsible_id}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
            <UserSelect value={localData.send_out_responsible_id} onChange={(v) => update('send_out_responsible_id', v)} disabled={isLocked || !isAdmin} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>寄出时间</label>
            <input type="datetime-local" value={localData.sent_at?.slice(0, 16) || ''} onChange={(e) => update('sent_at', e.target.value)} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={inputStyle(isLocked)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>快递单号</label>
            <input type="text" value={localData.tracking_number} onChange={(e) => update('tracking_number', e.target.value)} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={inputStyle(isLocked)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>快递公司</label>
            <input type="text" value={localData.courier} onChange={(e) => update('courier', e.target.value)} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={inputStyle(isLocked)} />
          </div>
        </div>
      </Section>

      {/* 锁定/解锁按钮 */}
      <div className="flex justify-end">
        {isLocked ? (
          isAdmin ? (
            <button onClick={() => setConfirmModal({ open: true, mode: 'unlock' })} className="px-4 py-2 text-sm rounded-xl btn-transition" style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}>
              解锁
            </button>
          ) : (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>如需解锁请联系管理员</span>
          )
        ) : (
          <button onClick={() => setConfirmModal({ open: true, mode: 'lock' })} className="px-4 py-2 text-sm text-white rounded-xl btn-transition" style={{ background: 'var(--gradient-primary)' }}>
            提交并锁定合同
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.mode === 'unlock' ? '确认解锁' : '确认锁定'}
        message={confirmModal.mode === 'unlock' ? '解锁后合同阶段将可以修改，项目状态将回退到合同。确认解锁？' : '锁定后合同阶段将无法修改，项目将进入打款开票阶段。确认锁定？'}
        onConfirm={confirmModal.mode === 'unlock' ? handleUnlock : handleLock}
        onCancel={() => setConfirmModal({ open: false, mode: null })}
      />
    </div>
  )
}

function Section({ title, locked, hasData, children }) {
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
