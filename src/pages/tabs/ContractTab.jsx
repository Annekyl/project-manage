import { useState, useEffect } from 'react'
import { useInitContract, useUpdateContract, useLockContractSection, useUnlockContractSection } from '../../hooks/useContract'
import { useUpdateProjectStatus } from '../../hooks/useProjectStatus'
import UserSelect from '../../components/common/UserSelect'
import FileUpload from '../../components/common/FileUpload'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmModal from '../../components/common/ConfirmModal'
import toast from 'react-hot-toast'

const STATUS_FLOW = {
  sign_confirm: 'stamp_upload',
  stamp_upload: 'send_out',
  send_out: 'payment_invoice',
}

const SECTION_LABELS = {
  audit_sign: '审核签收',
  sign_confirm: '签收确认',
  stamp_upload: '盖章上传',
  send_out: '寄出',
}

export default function ContractTab({ project, section, isAdmin, currentUserId }) {
  const contract = project.contracts?.[0]

  const initContract = useInitContract()
  const updateContract = useUpdateContract(project.id)
  const lockSection = useLockContractSection(project.id)
  const unlockSection = useUnlockContractSection(project.id)
  const updateStatus = useUpdateProjectStatus(project.id)

  const [confirmModal, setConfirmModal] = useState({ open: false, mode: null, target: null })

  const [auditData, setAuditData] = useState({})
  const [signData, setSignData] = useState({})
  const [stampData, setStampData] = useState({})
  const [sendData, setSendData] = useState({})

  useEffect(() => {
    if (!contract) return
    setAuditData({
      audit_sign_responsible_id: contract.audit_sign_responsible_id || currentUserId || '',
      audit_sign_file_url: contract.audit_sign_file_url || '',
      audit_sign_confirmed_at: contract.audit_sign_confirmed_at || '',
    })
    setSignData({
      sign_confirm_responsible_id: contract.sign_confirm_responsible_id || currentUserId || '',
      sign_screenshot_url: contract.sign_screenshot_url || '',
      sign_confirm_screenshot_url: contract.sign_confirm_screenshot_url || '',
      sign_confirmed_at: contract.sign_confirmed_at || '',
    })
    setStampData({
      stamp_upload_responsible_id: contract.stamp_upload_responsible_id || currentUserId || '',
      stamp_upload_count: contract.stamp_upload_count || '',
      stamp_upload_scan_url: contract.stamp_upload_scan_url || '',
      stamp_upload_completed_at: contract.stamp_upload_completed_at || '',
    })
    setSendData({
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

  async function handleLock(sectionKey, data, nextStatus) {
    try {
      await updateContract.mutateAsync({ contractId: contract.id, updates: data })
      await lockSection.mutateAsync({ contractId: contract.id, section: sectionKey })

      if (nextStatus) {
        await updateStatus.mutateAsync(nextStatus)
        const nextLabel = SECTION_LABELS[nextStatus] || '打款开票'
        toast.success(`已锁定，进入${nextLabel}`)
      } else {
        toast.success('已锁定')
      }
      setConfirmModal({ open: false, mode: null, target: null })
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  function handleUnlock(unlockTarget) {
    const prevStatus = {
      audit_sign: 'audit_sign',
      sign_confirm: 'audit_sign',
      stamp_upload: 'audit_sign',
      send_out: 'stamp_upload',
    }
    unlockSection.mutate(
      { contractId: contract.id, section: unlockTarget },
      {
        onSuccess: async () => {
          await updateStatus.mutateAsync(prevStatus[unlockTarget])
          toast.success('已解锁')
          setConfirmModal({ open: false, mode: null, target: null })
        }
      }
    )
  }

  // 审核签收 tab：显示两个独立区域
  if (section === 'audit_sign') {
    const isAuditLocked = contract.audit_sign_locked
    const isSignLocked = contract.sign_locked

    return (
      <div className="space-y-6">
        {/* 审核签收 */}
        <ContractSection title="审核签收" locked={isAuditLocked} hasData={!!contract.audit_sign_responsible_id || !!auditData.audit_sign_responsible_id}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
              <UserSelect value={auditData.audit_sign_responsible_id} onChange={(v) => setAuditData(p => ({ ...p, audit_sign_responsible_id: v }))} disabled={isAuditLocked || !isAdmin} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>审核时间</label>
              <input type="datetime-local" value={auditData.audit_sign_confirmed_at?.slice(0, 16) || ''} onChange={(e) => setAuditData(p => ({ ...p, audit_sign_confirmed_at: e.target.value }))} disabled={isAuditLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={{ background: isAuditLocked ? 'var(--bg-table-head)' : 'var(--bg-input)', borderColor: 'var(--border)', color: isAuditLocked ? 'var(--text-dim)' : 'var(--text)' }} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>合同文件</label>
            <FileUpload value={auditData.audit_sign_file_url} onChange={(v) => setAuditData(p => ({ ...p, audit_sign_file_url: v }))} folder={`contracts/${project.id}/audit_sign`} disabled={isAuditLocked} />
          </div>
          <div className="mt-4 flex justify-end">
            {isAuditLocked ? (
              isAdmin ? (
                <button onClick={() => setConfirmModal({ open: true, mode: 'unlock', target: 'audit_sign' })} className="px-4 py-2 text-sm rounded-xl btn-transition" style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}>
                  解锁
                </button>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>如需解锁请联系管理员</span>
              )
            ) : (
              <button onClick={() => setConfirmModal({ open: true, mode: 'lock', target: 'audit_sign' })} className="px-4 py-2 text-sm text-white rounded-xl btn-transition" style={{ background: 'var(--gradient-primary)' }}>
                提交并锁定
              </button>
            )}
          </div>
        </ContractSection>

        {/* 签收确认 */}
        <ContractSection title="签收确认" locked={isSignLocked} hasData={!!contract.sign_confirm_responsible_id || !!signData.sign_confirm_responsible_id}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>签收确认人</label>
              <UserSelect value={signData.sign_confirm_responsible_id} onChange={(v) => setSignData(p => ({ ...p, sign_confirm_responsible_id: v }))} disabled={isSignLocked || !isAdmin} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>客户确认时间</label>
              <input type="datetime-local" value={signData.sign_confirmed_at?.slice(0, 16) || ''} onChange={(e) => setSignData(p => ({ ...p, sign_confirmed_at: e.target.value }))} disabled={isSignLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={{ background: isSignLocked ? 'var(--bg-table-head)' : 'var(--bg-input)', borderColor: 'var(--border)', color: isSignLocked ? 'var(--text-dim)' : 'var(--text)' }} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>快递签收截图</label>
              <FileUpload value={signData.sign_screenshot_url} onChange={(v) => setSignData(p => ({ ...p, sign_screenshot_url: v }))} folder={`contracts/${project.id}/sign`} disabled={isSignLocked} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>客户确认聊天截图</label>
              <FileUpload value={signData.sign_confirm_screenshot_url} onChange={(v) => setSignData(p => ({ ...p, sign_confirm_screenshot_url: v }))} folder={`contracts/${project.id}/sign`} disabled={isSignLocked} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            {isSignLocked ? (
              isAdmin ? (
                <button onClick={() => setConfirmModal({ open: true, mode: 'unlock', target: 'sign_confirm' })} className="px-4 py-2 text-sm rounded-xl btn-transition" style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}>
                  解锁
                </button>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>如需解锁请联系管理员</span>
              )
            ) : (
              <button onClick={() => setConfirmModal({ open: true, mode: 'lock', target: 'sign_confirm' })} className="px-4 py-2 text-sm text-white rounded-xl btn-transition" style={{ background: 'var(--gradient-primary)' }}>
                提交并锁定
              </button>
            )}
          </div>
        </ContractSection>

        <ConfirmModal
          open={confirmModal.open}
          title={confirmModal.mode === 'unlock' ? '确认解锁' : '确认操作'}
          message={confirmModal.mode === 'unlock' ? '解锁后该环节将可以修改，项目状态将回退。确认解锁？' : '提交后该环节将锁定，无法自行修改。确认提交？'}
          onConfirm={() => {
            if (confirmModal.mode === 'unlock') {
              handleUnlock(confirmModal.target)
            } else if (confirmModal.target === 'audit_sign') {
              handleLock('audit_sign', auditData, null)
            } else {
              handleLock('sign_confirm', signData, 'stamp_upload')
            }
          }}
          onCancel={() => setConfirmModal({ open: false, mode: null, target: null })}
        />
      </div>
    )
  }

  // 盖章上传
  if (section === 'stamp_upload') {
    const isLocked = contract.stamp_upload_locked
    return (
      <div className="space-y-6">
        <ContractSection title="盖章上传" locked={isLocked} hasData={!!contract.stamp_upload_responsible_id || !!stampData.stamp_upload_responsible_id}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
              <UserSelect value={stampData.stamp_upload_responsible_id} onChange={(v) => setStampData(p => ({ ...p, stamp_upload_responsible_id: v }))} disabled={isLocked || !isAdmin} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>盖章时间</label>
              <input type="datetime-local" value={stampData.stamp_upload_completed_at?.slice(0, 16) || ''} onChange={(e) => setStampData(p => ({ ...p, stamp_upload_completed_at: e.target.value }))} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={{ background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)', borderColor: 'var(--border)', color: isLocked ? 'var(--text-dim)' : 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>合同份数</label>
              <input type="number" value={stampData.stamp_upload_count} onChange={(e) => setStampData(p => ({ ...p, stamp_upload_count: e.target.value }))} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={{ background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)', borderColor: 'var(--border)', color: isLocked ? 'var(--text-dim)' : 'var(--text)' }} />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>盖章扫描件</label>
            <FileUpload value={stampData.stamp_upload_scan_url} onChange={(v) => setStampData(p => ({ ...p, stamp_upload_scan_url: v }))} folder={`contracts/${project.id}/stamp_upload`} disabled={isLocked} />
          </div>
          <div className="mt-4 flex justify-end">
            {isLocked ? (
              isAdmin ? (
                <button onClick={() => setConfirmModal({ open: true, mode: 'unlock', target: 'stamp_upload' })} className="px-4 py-2 text-sm rounded-xl btn-transition" style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}>
                  解锁
                </button>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>如需解锁请联系管理员</span>
              )
            ) : (
              <button onClick={() => handleLock('stamp_upload', stampData, 'send_out')} className="px-4 py-2 text-sm text-white rounded-xl btn-transition" style={{ background: 'var(--gradient-primary)' }}>
                提交并锁定
              </button>
            )}
          </div>
        </ContractSection>

        <ConfirmModal
          open={confirmModal.open}
          title="确认解锁"
          message="解锁后该环节将可以修改，项目状态将回退。确认解锁？"
          onConfirm={() => handleUnlock('stamp_upload')}
          onCancel={() => setConfirmModal({ open: false, mode: null, target: null })}
        />
      </div>
    )
  }

  // 寄出
  if (section === 'send_out') {
    const isLocked = contract.send_out_locked
    return (
      <div className="space-y-6">
        <ContractSection title="寄出" locked={isLocked} hasData={!!contract.send_out_responsible_id || !!sendData.send_out_responsible_id}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>责任人</label>
              <UserSelect value={sendData.send_out_responsible_id} onChange={(v) => setSendData(p => ({ ...p, send_out_responsible_id: v }))} disabled={isLocked || !isAdmin} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>寄出时间</label>
              <input type="datetime-local" value={sendData.sent_at?.slice(0, 16) || ''} onChange={(e) => setSendData(p => ({ ...p, sent_at: e.target.value }))} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={{ background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)', borderColor: 'var(--border)', color: isLocked ? 'var(--text-dim)' : 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>快递单号</label>
              <input type="text" value={sendData.tracking_number} onChange={(e) => setSendData(p => ({ ...p, tracking_number: e.target.value }))} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={{ background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)', borderColor: 'var(--border)', color: isLocked ? 'var(--text-dim)' : 'var(--text)' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>快递公司</label>
              <input type="text" value={sendData.courier} onChange={(e) => setSendData(p => ({ ...p, courier: e.target.value }))} disabled={isLocked} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={{ background: isLocked ? 'var(--bg-table-head)' : 'var(--bg-input)', borderColor: 'var(--border)', color: isLocked ? 'var(--text-dim)' : 'var(--text)' }} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            {isLocked ? (
              isAdmin ? (
                <button onClick={() => setConfirmModal({ open: true, mode: 'unlock', target: 'send_out' })} className="px-4 py-2 text-sm rounded-xl btn-transition" style={{ background: 'var(--bg-table-head)', color: 'var(--text)' }}>
                  解锁
                </button>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>如需解锁请联系管理员</span>
              )
            ) : (
              <button onClick={() => handleLock('send_out', sendData, 'payment_invoice')} className="px-4 py-2 text-sm text-white rounded-xl btn-transition" style={{ background: 'var(--gradient-primary)' }}>
                提交并锁定
              </button>
            )}
          </div>
        </ContractSection>

        <ConfirmModal
          open={confirmModal.open}
          title="确认解锁"
          message="解锁后该环节将可以修改，项目状态将回退。确认解锁？"
          onConfirm={() => handleUnlock('send_out')}
          onCancel={() => setConfirmModal({ open: false, mode: null, target: null })}
        />
      </div>
    )
  }

  return null
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
