import { useState, useRef } from 'react'
import { Upload, File, ExternalLink } from 'lucide-react'
import { uploadFile, getFileUrl } from '../../utils/storage'
import { translateError } from '../../utils/errors'
import toast from 'react-hot-toast'

export default function FileUpload({ value, onChange, folder, disabled = false }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    // 文件大小限制 20MB
    if (file.size > 20 * 1024 * 1024) {
      toast.error('文件大小不能超过 20MB')
      e.target.value = ''
      return
    }
    // 文件类型限制
    const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar']
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowed.includes(ext)) {
      toast.error('不支持的文件类型，允许: ' + allowed.join(', '))
      e.target.value = ''
      return
    }

    setUploading(true)
    try {
      const path = await uploadFile(file, folder)
      onChange(path)
      toast.success('文件上传成功')
    } catch (error) {
      toast.error('上传失败: ' + translateError(error.message))
    } finally {
      setUploading(false)
    }
  }

  async function handleView() {
    if (!value) return
    try {
      const url = await getFileUrl(value)
      window.open(url, '_blank')
    } catch (error) {
      toast.error('获取文件链接失败')
    }
  }

  if (value) {
    return (
      <div className="flex items-center space-x-2 p-2 rounded-lg" style={{ background: 'var(--bg-table-head)' }}>
        <File className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <span className="text-sm flex-1 truncate" style={{ color: 'var(--text)' }}>
          {value.split('/').pop()}
        </span>
        <button type="button" onClick={handleView} className="transition-colors" style={{ color: 'var(--accent)' }} title="查看文件">
          <ExternalLink className="w-4 h-4" />
        </button>
        {!disabled && (
          <button type="button" onClick={() => fileInputRef.current?.click()} className="transition-colors" style={{ color: 'var(--text-dim)' }} title="重新上传">
            <Upload className="w-4 h-4" />
          </button>
        )}
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !disabled && !uploading) { e.preventDefault(); fileInputRef.current?.click() } }}
      aria-label="点击或拖拽文件上传"
      className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors outline-none focus-visible:ring-2"
      style={{
        borderColor: disabled ? 'var(--border-light)' : 'var(--border)',
        background: disabled ? 'var(--bg-table-head)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        '--tw-ring-color': 'var(--accent)',
      }}
    >
      <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
      <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
        {uploading ? '上传中...' : '点击或拖拽文件上传'}
      </p>
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} disabled={disabled || uploading} className="hidden" />
    </div>
  )
}
