import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertTriangle className="w-12 h-12" style={{ color: 'var(--warning)' }} />
          <div className="text-center">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-bright)' }}>页面出现错误</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>
              {this.state.error?.message || '发生了未知错误'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 text-sm font-medium text-white rounded-xl btn-transition"
            style={{ background: 'var(--gradient-primary)' }}
          >
            重试
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
