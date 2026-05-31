-- ========================================
-- 修复 admin_delete_user RPC 函数
-- 如果用户有外键引用则禁止删除
-- 在 Supabase SQL Editor 中执行
-- ========================================

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_count INT := 0;
  user_name TEXT;
BEGIN
  -- 仅允许管理员调用
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admin can delete users';
  END IF;

  -- 不允许删除自己
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete yourself';
  END IF;

  -- 获取用户名
  SELECT name INTO user_name FROM public.profiles WHERE id = target_user_id;

  -- 检查是否存在外键引用
  SELECT COUNT(*) INTO ref_count FROM (
    SELECT 1 FROM public.contracts   WHERE audit_sign_responsible_id = target_user_id
      UNION ALL SELECT 1 FROM public.contracts WHERE sign_confirm_responsible_id = target_user_id
      UNION ALL SELECT 1 FROM public.contracts WHERE stamp_upload_responsible_id = target_user_id
      UNION ALL SELECT 1 FROM public.contracts WHERE send_out_responsible_id = target_user_id
      UNION ALL SELECT 1 FROM public.payments  WHERE payment_responsible_id = target_user_id
      UNION ALL SELECT 1 FROM public.payments  WHERE claim_responsible_id = target_user_id
      UNION ALL SELECT 1 FROM public.invoices  WHERE responsible_id = target_user_id
      UNION ALL SELECT 1 FROM public.reimbursements WHERE responsible_id = target_user_id
      UNION ALL SELECT 1 FROM public.closures  WHERE responsible_id = target_user_id
      UNION ALL SELECT 1 FROM public.projects  WHERE created_by = target_user_id
  ) refs;

  IF ref_count > 0 THEN
    RAISE EXCEPTION '用户「%」仍有 % 条项目记录关联，无法删除。请先转移相关负责人后再操作。', user_name, ref_count;
  END IF;

  -- 清除 audit_logs（日志不影响业务，直接置 NULL）
  UPDATE public.audit_logs SET user_id = NULL WHERE user_id = target_user_id;

  -- 删除 profiles
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 删除 auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
