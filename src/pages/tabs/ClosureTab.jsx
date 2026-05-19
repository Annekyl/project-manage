import { useState, useEffect } from 'react'
import { useInitClosure, useUpdateClosure, useLockClosure } from '../../hooks/useClosure'
import { useUpdateProjectStatus } from '../../hooks/useProjectStatus'
import UserSelect from '../../components/common/UserSelect'
import FileUpload from '../../components/common/FileUpload'
import StatusBadge from '../../components/common/StatusBadge'
import ConfirmModal from '../../components/common/ConfirmModal'
import toast from 'react-hot-toast'

export default function ClosureTab({ project, isAdmin }) {
  const closure = project.closures?.[0]
  const initClosure = useInitClosure()
  const updateClosure = useUpdateClosure(project.id)
  const lockClosure = useLockClosure(project.id)
  const updateStatus = useUpdateProjectStatus(project.id)

  const [confirmModal, setConfirmModal] = useState(false)

  // 本地状态
  const [localData, setLocalData] = useState({
    responsible_id: '',
    responsible_name: '',
    status: 'pending',
    report_submitted_at: '',
    closed_at: '',
    report_file_url: ''
  })

  // 从数据库加载初始值
  useEffect(() => {
    if (closure) {
      setLocalData({
        responsible_id: closure.responsible_id || '',
        responsible_name: closure.responsible_name || '',
        status: closure.status || 'pending',
        report_submitted_at: closure.report_submitted_at || '',
        closed_at: closure.closed_at || '',
        report_file_url: closure.report_file_url || ''
      })
    }
  }, [closure])

  if (!closure) {
    return (
      <div className="text-center py-8">
        <button
          onClick={() => initClosure.mutate(project.id)}
          disabled={initClosure.isPending}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {initClosure.isPending ? '初始化中...' : '初始化结题记录'}
        </button>
      </div>
    )
  }

  // 更新本地状态
  function handleLocalChange(field, value) {
    setLocalData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 提交并锁定
  async function handleLock() {
    try {
      await updateClosure.mutateAsync({
        closureId: closure.id,
        updates: localData
      })
      await lockClosure.mutateAsync(closure.id)

      // 如果结题状态为已完成，更新项目状态
      if (localData.status === 'completed') {
        await updateStatus.mutateAsync('completed')
        toast.success('已锁定，项目已完成')
      } else {
        toast.success('已锁定')
      }

      setConfirmModal(false)
    } catch (error) {
      toast.error('操作失败: ' + error.message)
    }
  }

  const isLocked = closure.closure_locked

  const statusLabels = {
    pending: '待启动',
    submitted: '已提交报告',
    completed: '已完成'
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">项目结题</h3>
        <StatusBadge locked={isLocked} hasData={closure.status !== 'pending' || localData.status !== 'pending'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">结题责任人</label>
          <UserSelect
            value={localData.responsible_id}
            onChange={(v) => handleLocalChange('responsible_id', v)}
            disabled={isLocked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">具体负责人</label>
          <input
            type="text"
            value={localData.responsible_name}
            onChange={(e) => handleLocalChange('responsible_name', e.target.value)}
            disabled={isLocked}
            placeholder="输入负责人姓名"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">结题状态</label>
          <select
            value={localData.status}
            onChange={(e) => handleLocalChange('status', e.target.value)}
            disabled={isLocked}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="pending">待启动</option>
            <option value="submitted">已提交报告</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">报告提交时间</label>
          <input
            type="datetime-local"
            value={localData.report_submitted_at?.slice(0, 16) || ''}
            onChange={(e) => handleLocalChange('report_submitted_at', e.target.value)}
            disabled={isLocked}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">结题完成时间</label>
          <input
            type="datetime-local"
            value={localData.closed_at?.slice(0, 16) || ''}
            onChange={(e) => handleLocalChange('closed_at', e.target.value)}
            disabled={isLocked}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">结题报告文件</label>
        <FileUpload
          value={localData.report_file_url}
          onChange={(v) => handleLocalChange('report_file_url', v)}
          folder={`closures/${project.id}`}
          disabled={isLocked}
        />
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        {isLocked ? (
          <>
            {project.status !== 'completed' && (
              <button
                onClick={async () => {
                  try {
                    await updateStatus.mutateAsync('completed')
                    toast.success('项目已完成')
                  } catch (error) {
                    toast.error('操作失败: ' + error.message)
                  }
                }}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                标记项目完成
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => updateClosure.mutate({ closureId: closure.id, updates: { closure_locked: false } })}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                解锁
              </button>
            )}
          </>
        ) : (
          <button
            onClick={() => setConfirmModal(true)}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            提交并锁定
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmModal}
        onConfirm={handleLock}
        onCancel={() => setConfirmModal(false)}
      />
    </div>
  )
}
