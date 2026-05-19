-- 修复所有表的 RLS 策略
-- 在 Supabase SQL Editor 中执行

-- 删除所有旧的更新策略
DROP POLICY IF EXISTS "定稿未锁定时可更新" ON public.contracts;
DROP POLICY IF EXISTS "未锁定时可更新合同" ON public.contracts;
DROP POLICY IF EXISTS "未锁定时可更新打款" ON public.payments;
DROP POLICY IF EXISTS "未锁定时可更新开票" ON public.invoices;
DROP POLICY IF EXISTS "未锁定时可更新报销" ON public.reimbursements;
DROP POLICY IF EXISTS "未锁定时可更新结题" ON public.closures;

-- 创建新策略：所有认证用户可更新
CREATE POLICY "所有人可更新合同"
  ON public.contracts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "所有人可更新打款"
  ON public.payments FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "所有人可更新开票"
  ON public.invoices FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "所有人可更新报销"
  ON public.reimbursements FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "所有人可更新结题"
  ON public.closures FOR UPDATE
  USING (auth.role() = 'authenticated');
