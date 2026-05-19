import { useUsers } from '../../hooks/useUsers'

export default function UserSelect({ value, onChange, disabled = false, placeholder = '请选择责任人' }) {
  const { data: users = [], isLoading } = useUsers()

  if (isLoading) return <div className="text-sm" style={{ color: 'var(--text-dim)' }}>加载中...</div>

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      className="w-full rounded-xl shadow-sm transition-all disabled:cursor-not-allowed"
      style={{
        background: disabled ? 'var(--bg-table-head)' : 'var(--bg-input)',
        borderColor: 'var(--border)',
        color: disabled ? 'var(--text-dim)' : 'var(--text)',
      }}
    >
      <option value="">{placeholder}</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {user.name} ({user.role === 'admin' ? '管理员' : '成员'})
        </option>
      ))}
    </select>
  )
}
