-- ========================================
-- 修复 contracts 表列名，与前端保持一致
-- 在 Supabase SQL Editor 中执行
-- ========================================

ALTER TABLE public.contracts RENAME COLUMN draft_responsible_name TO audit_sign_responsible_name;
ALTER TABLE public.contracts RENAME COLUMN receipt_responsible_name TO sign_confirm_responsible_name;
ALTER TABLE public.contracts RENAME COLUMN stamp_responsible_name TO stamp_upload_responsible_name;
ALTER TABLE public.contracts RENAME COLUMN send_responsible_name TO send_out_responsible_name;
