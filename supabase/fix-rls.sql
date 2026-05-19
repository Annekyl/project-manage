-- 修复 contracts 表的 RLS 策略
-- 在 Supabase SQL Editor 中执行

-- 删除旧的策略
DROP POLICY IF EXISTS "定稿未锁定时可更新" ON public.contracts;

-- 创建新的策略：只要有任何一个字段未锁定，就允许更新
CREATE POLICY "未锁定时可更新合同"
  ON public.contracts FOR UPDATE
  USING (
    draft_locked = FALSE OR
    stamp_locked = FALSE OR
    send_locked = FALSE OR
    receipt_locked = FALSE OR
    is_admin()
  );
