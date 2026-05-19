-- 修复 contracts 表的 RLS 策略
-- 在 Supabase SQL Editor 中执行

-- 删除所有旧的更新策略
DROP POLICY IF EXISTS "定稿未锁定时可更新" ON public.contracts;
DROP POLICY IF EXISTS "未锁定时可更新合同" ON public.contracts;

-- 创建新策略：所有认证用户可更新
CREATE POLICY "所有人可更新合同"
  ON public.contracts FOR UPDATE
  USING (auth.role() = 'authenticated');
