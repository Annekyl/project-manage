import { useAuth } from '../../hooks/useAuth'
import { LogOut, User } from 'lucide-react'

export default function Header() {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
      <div className="text-sm text-gray-500">
        {isAdmin && (
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium mr-2">
            管理员
          </span>
        )}
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-sm text-gray-700">
          <User className="w-4 h-4 mr-1" />
          {profile?.name || '未知用户'}
        </div>
        <button
          onClick={signOut}
          className="flex items-center text-sm text-gray-500 hover:text-red-600"
        >
          <LogOut className="w-4 h-4 mr-1" />
          退出
        </button>
      </div>
    </header>
  )
}
