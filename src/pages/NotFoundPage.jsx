import { useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 page-enter">
      <p className="text-6xl font-bold" style={{ color: 'var(--text-muted)' }}>404</p>
      <p className="text-lg" style={{ color: 'var(--text-dim)' }}>页面不存在</p>
      <button
        onClick={() => navigate('/')}
        className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-xl btn-transition"
        style={{ background: 'var(--gradient-primary)' }}
      >
        <Home className="w-4 h-4 mr-2" />
        返回工作台
      </button>
    </div>
  )
}
