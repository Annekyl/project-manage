import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../utils/supabase'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()

  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' })
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (profile?.name) setName(profile.name)
  }, [profile])

  async function handleNameSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('姓名不能为空')
      return
    }
    setSavingName(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: name.trim() })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('姓名已更新')
    } catch (error) {
      toast.error('更新失败: ' + error.message)
    } finally {
      setSavingName(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (passwords.newPassword.length < 6) {
      toast.error('新密码至少需要 6 位')
      return
    }
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('两次输入的密码不一致')
      return
    }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword })
      if (error) throw error
      setPasswords({ current: '', newPassword: '', confirm: '' })
      toast.success('密码已更新')
    } catch (error) {
      toast.error('更新失败: ' + error.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">个人设置</h1>
        <p className="text-gray-600">管理你的账户信息</p>
      </div>

      {/* 基本信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
        <form onSubmit={handleNameSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <input
              type="text"
              value={profile?.role === 'admin' ? '管理员' : '成员'}
              disabled
              className="w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingName}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {savingName ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>

      {/* 修改密码 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">修改密码</h3>
        <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码 *</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
              minLength={6}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码 *</label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              required
              minLength={6}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {savingPassword ? '更新中...' : '更新密码'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
