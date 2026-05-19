-- ========================================
-- 产学研项目管理系统 - RLS 权限策略
-- 在 schema.sql 执行后再执行此文件
-- ========================================

-- 开启 RLS
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reimbursements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closures         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs       ENABLE ROW LEVEL SECURITY;

-- ========================
-- 辅助函数：获取当前用户角色
-- ========================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ========================
-- profiles
-- ========================
CREATE POLICY "登录用户可读所有人信息"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "只能修改自己的信息"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "admin可修改所有人"
  ON public.profiles FOR UPDATE
  USING (is_admin());

-- ========================
-- projects：所有人可读，仅 admin 可写
-- ========================
CREATE POLICY "所有登录用户可读项目"
  ON public.projects FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "仅admin可新建项目"
  ON public.projects FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "仅admin可修改项目"
  ON public.projects FOR UPDATE
  USING (is_admin());

-- ========================
-- contracts
-- ========================
CREATE POLICY "所有登录用户可读合同"
  ON public.contracts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "初始化合同记录"
  ON public.contracts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "定稿未锁定时可更新"
  ON public.contracts FOR UPDATE
  USING (draft_locked = FALSE OR is_admin());

-- ========================
-- payments
-- ========================
CREATE POLICY "所有人可读打款"
  ON public.payments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "所有人可初始化打款"
  ON public.payments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "未锁定时可更新打款"
  ON public.payments FOR UPDATE USING (payment_locked = FALSE OR is_admin());

-- ========================
-- invoices
-- ========================
CREATE POLICY "所有人可读开票"
  ON public.invoices FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "所有人可初始化开票"
  ON public.invoices FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "未锁定时可更新开票"
  ON public.invoices FOR UPDATE USING (invoice_locked = FALSE OR is_admin());

-- ========================
-- closures
-- ========================
CREATE POLICY "所有人可读结题"
  ON public.closures FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "所有人可初始化结题"
  ON public.closures FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "未锁定时可更新结题"
  ON public.closures FOR UPDATE USING (closure_locked = FALSE OR is_admin());

-- ========================
-- reimbursements
-- ========================
CREATE POLICY "所有人可读报销"
  ON public.reimbursements FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "所有人可新增报销"
  ON public.reimbursements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "未锁定时可更新报销"
  ON public.reimbursements FOR UPDATE
  USING (reimbursement_locked = FALSE OR is_admin());

-- ========================
-- audit_logs：所有人可读，不可手动写
-- ========================
CREATE POLICY "所有人可读审计日志"
  ON public.audit_logs FOR SELECT USING (auth.role() = 'authenticated');
