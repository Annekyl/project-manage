-- ========================================
-- 修复 admin_delete_user RPC 函数
-- 删除用户前先将所有外键引用置为 NULL
-- 在 Supabase SQL Editor 中执行
-- ========================================

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- 清除 contracts 表中的外键引用
  UPDATE public.contracts SET audit_sign_responsible_id   = NULL WHERE audit_sign_responsible_id   = target_user_id;
  UPDATE public.contracts SET sign_confirm_responsible_id = NULL WHERE sign_confirm_responsible_id = target_user_id;
  UPDATE public.contracts SET stamp_upload_responsible_id = NULL WHERE stamp_upload_responsible_id = target_user_id;
  UPDATE public.contracts SET send_out_responsible_id     = NULL WHERE send_out_responsible_id     = target_user_id;

  -- 清除 payments 表中的外键引用
  UPDATE public.payments SET payment_responsible_id = NULL WHERE payment_responsible_id = target_user_id;
  UPDATE public.payments SET claim_responsible_id   = NULL WHERE claim_responsible_id   = target_user_id;

  -- 清除 invoices 表中的外键引用
  UPDATE public.invoices SET responsible_id = NULL WHERE responsible_id = target_user_id;

  -- 清除 reimbursements 表中的外键引用
  UPDATE public.reimbursements SET responsible_id = NULL WHERE responsible_id = target_user_id;

  -- 清除 closures 表中的外键引用
  UPDATE public.closures SET responsible_id = NULL WHERE responsible_id = target_user_id;

  -- 清除 audit_logs 表中的外键引用
  UPDATE public.audit_logs SET user_id = NULL WHERE user_id = target_user_id;

  -- 清除 projects 表中的外键引用
  UPDATE public.projects SET created_by = NULL WHERE created_by = target_user_id;

  -- 删除 profiles（会级联删除 auth.users）
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 删除 auth.users（profiles 有 ON DELETE CASCADE，通常会自动删除，但显式删除更保险）
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
