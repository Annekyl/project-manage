import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LayoutDashboard, FolderOpen, Settings, UserCog } from 'lucide-react'

export default function Sidebar() {
  const { isAdmin, profile } = useAuth()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: '工作台' },
    { to: '/projects', icon: FolderOpen, label: '项目列表' },
  ]

  if (isAdmin) {
    navItems.push({ to: '/admin', icon: Settings, label: '系统管理' })
  }

  navItems.push({ to: '/settings', icon: UserCog, label: '个人设置' })

  return (
    <aside className="w-64 shadow-lg flex flex-col" style={{ background: 'var(--bg-sidebar)' }}>
      {/* 品牌头部 */}
      <div className="px-5 py-6" style={{ background: 'var(--gradient-primary)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">项目管理系统</h1>
            <p className="text-xs text-white/60">产学研协同管理平台</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 mt-4 px-3">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'shadow-sm'
                  : 'hover:opacity-80'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'var(--accent-light)' : 'transparent',
              color: isActive ? 'var(--accent)' : 'var(--text-dim)',
            })}
          >
            <Icon className="w-5 h-5 mr-3 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* 底部用户信息 */}
      <div className="p-4" style={{ borderTop: '1px solid var(--border-light)' }}>
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm" style={{ background: 'var(--gradient-primary)' }}>
            {profile?.name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-bright)' }}>{profile?.name || '未知用户'}</p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{profile?.role === 'admin' ? '管理员' : '成员'}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
