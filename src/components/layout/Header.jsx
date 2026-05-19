import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { LogOut, Sun, Moon } from 'lucide-react'

export default function Header() {
  const { profile, isAdmin, signOut } = useAuth()
  const { dark, toggleTheme } = useTheme()

  return (
    <header className="px-6 py-3 flex items-center justify-between backdrop-blur-sm" style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border-light)' }}>
      <div className="text-sm" style={{ color: 'var(--text-dim)' }}>
        {isAdmin && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm" style={{ background: 'var(--gradient-primary)', color: '#fff' }}>
            管理员
          </span>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm" style={{ background: 'var(--gradient-primary)' }}>
            {profile?.name?.[0] || '?'}
          </div>
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{profile?.name || '未知用户'}</span>
        </div>
        <div className="w-px h-5" style={{ background: 'var(--border)' }} />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors"
          style={{ color: 'var(--text-dim)' }}
          title={dark ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={signOut}
          className="flex items-center text-sm transition-colors btn-transition"
          style={{ color: 'var(--text-dim)' }}
        >
          <LogOut className="w-4 h-4 mr-1" />
          退出
        </button>
      </div>
    </header>
  )
}
