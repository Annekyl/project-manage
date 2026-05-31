-- ========================================
-- 补充 DELETE 的 RLS 策略
-- 在 Supabase SQL Editor 中执行
-- ========================================

-- 仅 admin 可删除项目（子表通过 ON DELETE CASCADE 级联删除）
CREATE POLICY "仅admin可删除项目" ON public.projects
  FOR DELETE USING (public.is_admin());

-- 仅 admin 可删除审计日志
CREATE POLICY "仅admin可删除审计日志" ON public.audit_logs
  FOR DELETE USING (public.is_admin());
