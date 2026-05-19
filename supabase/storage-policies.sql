-- ========================================
-- 产学研项目管理系统 - Storage RLS 策略
-- 先在 Dashboard 创建 Bucket: project-files (私有)
-- 然后执行此文件
-- ========================================

-- 登录用户可上传
CREATE POLICY "登录用户可上传文件"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-files' AND auth.role() = 'authenticated');

-- 登录用户可读取（获取签名URL）
CREATE POLICY "登录用户可读取文件"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files' AND auth.role() = 'authenticated');
