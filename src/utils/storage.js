import { supabase } from './supabase'

// 上传文件，返回存储路径
export async function uploadFile(file, folder) {
  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('project-files')
    .upload(path, file)

  if (error) throw error
  return path
}

// 获取临时访问 URL（1小时有效）
export async function getFileUrl(path) {
  const { data, error } = await supabase.storage
    .from('project-files')
    .createSignedUrl(path, 3600)

  if (error) throw error
  return data.signedUrl
}
