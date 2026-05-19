import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LayoutDashboard, FolderOpen, Settings, UserCog } from 'lucide-react'

export default function Sidebar() {
  const { isAdmin } = useAuth()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: '工作台' },
    { to: '/projects', icon: FolderOpen, label: '项目列表' },
  ]

  if (isAdmin) {
    navItems.push({ to: '/admin', icon: Settings, label: '系统管理' })
  }

  navItems.push({ to: '/settings', icon: UserCog, label: '个人设置' })

  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-800">项目管理系统</h1>
      </div>
      <nav className="mt-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 ${
                isActive ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
              }`
            }
          >
            <Icon className="w-5 h-5 mr-3" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
