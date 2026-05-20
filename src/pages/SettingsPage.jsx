import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../utils/supabase'
import { translateError } from '../utils/errors'
import toast from 'react-hot-toast'
import { User, Shield, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, refreshProfile, isAdmin } = useAuth()

  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' })
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (profile?.name) setName(profile.name)
  }, [profile])

  async function handleNameSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { toast.error('姓名不能为空'); return }
    setSavingName(true)
    try {
      const { error } = await supabase.from('profiles').update({ name: name.trim() }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      toast.success('姓名已更新')
    } catch (error) { toast.error('更新失败: ' + translateError(error.message)) }
    finally { setSavingName(false) }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    if (!passwords.current) { toast.error('请输入当前密码'); return }
    if (passwords.newPassword.length < 6) { toast.error('新密码至少需要 6 位'); return }
    if (passwords.newPassword !== passwords.confirm) { toast.error('两次输入的密码不一致'); return }
    setSavingPassword(true)
    try {
      // 先用当前密码重新验证身份
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwords.current
      })
      if (authError) { toast.error('当前密码不正确'); setSavingPassword(false); return }

      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword })
      if (error) throw error
      setPasswords({ current: '', newPassword: '', confirm: '' })
      toast.success('密码已更新')
    } catch (error) { toast.error('更新失败: ' + translateError(error.message)) }
    finally { setSavingPassword(false) }
  }

  const inputStyle = { background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }
  const disabledInputStyle = { background: 'var(--bg-table-head)', borderColor: 'var(--border-light)', color: 'var(--text-dim)' }

  return (
    <div className="page-enter">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>个人设置</h1>
        <p className="mt-1" style={{ color: 'var(--text-dim)' }}>管理你的账户信息</p>
      </div>

      {/* 基本信息 */}
      <div className="rounded-xl shadow-sm p-6 mb-6 card-animate" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
            <User className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>基本信息</h3>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>管理你的个人资料</p>
          </div>
        </div>
        <form onSubmit={handleNameSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>邮箱</label>
            <input type="email" value={user?.email || ''} disabled className="w-full rounded-xl shadow-sm cursor-not-allowed" style={disabledInputStyle} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>邮箱无法修改</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>姓名</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin} className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed" style={isAdmin ? inputStyle : disabledInputStyle} />
            {!isAdmin && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>姓名由管理员设置</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>角色</label>
            <input type="text" value={profile?.role === 'admin' ? '管理员' : '成员'} disabled className="w-full rounded-xl shadow-sm cursor-not-allowed" style={disabledInputStyle} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>角色由管理员设置</p>
          </div>
          {isAdmin && (
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={savingName} className="px-5 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50 shadow-md btn-transition flex items-center" style={{ background: 'var(--gradient-primary)' }}>
                {savingName ? <><Loader2 className="w-4 h-4 mr-2 spinner" />保存中...</> : '保存修改'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 修改密码 */}
      <div className="rounded-xl shadow-sm p-6 card-animate" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', animationDelay: '0.1s' }}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--warning-light)' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--warning)' }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>修改密码</h3>
            <p className="text-sm" style={{ color: 'var(--text-dim)' }}>定期更换密码以保障账户安全</p>
          </div>
        </div>
        <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>当前密码</label>
            <input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} placeholder="请输入当前密码" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>新密码 *</label>
            <input type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={6} className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} placeholder="至少 6 位字符" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>确认新密码 *</label>
            <input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required minLength={6} className="w-full rounded-xl shadow-sm transition-all" style={inputStyle} placeholder="再次输入新密码" />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={savingPassword} className="px-5 py-2.5 text-sm font-medium text-white rounded-xl disabled:opacity-50 shadow-md btn-transition flex items-center" style={{ background: 'var(--gradient-primary)' }}>
              {savingPassword ? <><Loader2 className="w-4 h-4 mr-2 spinner" />更新中...</> : '更新密码'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
