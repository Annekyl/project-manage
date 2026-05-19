import { useState, useRef } from 'react'
import { Upload, File, ExternalLink, X } from 'lucide-react'
import { uploadFile, getFileUrl } from '../../utils/storage'
import toast from 'react-hot-toast'

export default function FileUpload({ value, onChange, folder, disabled = false }) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const path = await uploadFile(file, folder)
      onChange(path)
      toast.success('文件上传成功')
    } catch (error) {
      toast.error('上传失败: ' + error.message)
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
      <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
        <File className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-700 flex-1 truncate">
          {value.split('/').pop()}
        </span>
        <button
          type="button"
          onClick={handleView}
          className="text-blue-600 hover:text-blue-800"
          title="查看文件"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        {!disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-gray-700"
            title="重新上传"
          >
            <Upload className="w-4 h-4" />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div
      onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
        disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
      }`}
    >
      <Upload className="w-6 h-6 mx-auto text-gray-400 mb-2" />
      <p className="text-sm text-gray-500">
        {uploading ? '上传中...' : '点击或拖拽文件上传'}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />
    </div>
  )
}
