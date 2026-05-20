import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import toast from 'react-hot-toast'
import { Mail, Lock, Loader2, Sun, Moon } from 'lucide-react'
import appIcon from '/icon.svg'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const { dark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('登录成功')
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* 背景装饰 */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" style={{ background: 'var(--accent-light)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" style={{ background: 'var(--accent-light)' }} />

      {/* 主题切换 */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-xl transition-colors z-10"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}
        title={dark ? '切换到亮色模式' : '切换到暗色模式'}
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="relative backdrop-blur-xl p-8 rounded-2xl shadow-xl w-full max-w-md border card-animate" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        {/* Logo 区域 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg flex items-center justify-center" style={{ background: 'var(--gradient-primary)' }}>
            <img src={appIcon} alt="图标" className="w-14 h-14" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>产学研项目管理系统</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>登录以管理你的项目</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl shadow-sm transition-all"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                placeholder="请输入邮箱"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl shadow-sm transition-all"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border)', color: 'var(--text)' }}
                placeholder="请输入密码"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg btn-transition flex items-center justify-center"
            style={{ background: 'var(--gradient-primary)', boxShadow: 'var(--shadow)' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 spinner" />
                登录中...
              </>
            ) : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
