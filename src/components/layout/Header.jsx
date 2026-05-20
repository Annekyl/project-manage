import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { LogOut, Sun, Moon, Menu } from 'lucide-react'

export default function Header({ onMenuToggle }) {
  const { profile, isAdmin, signOut } = useAuth()
  const { dark, toggleTheme } = useTheme()

  return (
    <header className="px-4 md:px-6 py-3 flex items-center justify-between backdrop-blur-sm" style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border-light)' }}>
      <div className="flex items-center space-x-3">
        <button onClick={onMenuToggle} className="p-1.5 rounded-lg md:hidden transition-colors" style={{ color: 'var(--text-dim)' }}>
          <Menu className="w-5 h-5" />
        </button>
        {isAdmin && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm" style={{ background: 'var(--gradient-primary)', color: '#fff' }}>
            管理员
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow-sm" style={{ background: 'var(--gradient-primary)' }}>
            {profile?.name?.[0] || '?'}
          </div>
          <span className="text-sm font-medium hidden sm:inline" style={{ color: 'var(--text)' }}>{profile?.name || '未知用户'}</span>
        </div>
        <div className="w-px h-5 hidden md:block" style={{ background: 'var(--border)' }} />
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors hover:scale-105 active:scale-95"
          style={{ color: 'var(--text-dim)', background: 'var(--bg-table-head)' }}
          title={dark ? '切换到亮色模式' : '切换到暗色模式'}
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button
          onClick={signOut}
          className="flex items-center text-sm px-3 py-1.5 rounded-lg transition-colors hover:scale-105 active:scale-95"
          style={{ color: 'var(--text-dim)', background: 'var(--bg-table-head)' }}
        >
          <LogOut className="w-4 h-4 md:mr-1" />
          <span className="hidden md:inline">退出</span>
        </button>
      </div>
    </header>
  )
}
