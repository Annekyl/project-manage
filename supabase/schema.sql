-- ========================================
-- 产学研项目管理系统 - 数据库结构
-- 在 Supabase SQL Editor 中执行
-- ========================================

-- Phase 1.1 基础扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- Phase 1.2 用户信息表
-- ========================================
CREATE TABLE public.profiles (
  id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name  TEXT NOT NULL,
  email TEXT,
  role  TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 新用户注册时自动建立 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ========================================
-- Phase 1.3 项目主表
-- ========================================
CREATE TABLE public.projects (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  company_name   TEXT NOT NULL,
  company_contact TEXT,
  total_amount   NUMERIC(12,2),
  status         TEXT NOT NULL DEFAULT 'audit_sign'
                 CHECK (status IN ('audit_sign','stamp_upload','send_out','payment_invoice','reimbursement','closure','completed')),
  created_by     UUID REFERENCES public.profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Phase 1.4 合同表
-- ========================================
CREATE TABLE public.contracts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- 审核签收
  audit_sign_responsible_id  UUID REFERENCES public.profiles(id),
  audit_sign_file_url        TEXT,
  audit_sign_confirmed_at    TIMESTAMPTZ,
  audit_sign_locked          BOOLEAN NOT NULL DEFAULT FALSE,

  -- 签收确认
  sign_confirm_responsible_id       UUID REFERENCES public.profiles(id),
  sign_screenshot_url               TEXT,
  sign_confirm_screenshot_url       TEXT,
  sign_confirmed_at                 TIMESTAMPTZ,
  sign_locked                       BOOLEAN NOT NULL DEFAULT FALSE,

  -- 盖章上传
  stamp_upload_responsible_id  UUID REFERENCES public.profiles(id),
  stamp_upload_count           INTEGER,
  stamp_upload_scan_url        TEXT,
  stamp_upload_completed_at    TIMESTAMPTZ,
  stamp_upload_locked          BOOLEAN NOT NULL DEFAULT FALSE,

  -- 寄出
  send_out_responsible_id   UUID REFERENCES public.profiles(id),
  tracking_number           TEXT,
  courier                   TEXT DEFAULT '顺丰',
  sent_at                   TIMESTAMPTZ,
  send_out_locked           BOOLEAN NOT NULL DEFAULT FALSE,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Phase 1.5 打款与经费认领表
-- ========================================
CREATE TABLE public.payments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  payment_responsible_id  UUID REFERENCES public.profiles(id),
  payment_amount          NUMERIC(12,2),
  payment_screenshot_url  TEXT,
  bank_flow_number        TEXT,
  paid_at                 TIMESTAMPTZ,
  payment_locked          BOOLEAN NOT NULL DEFAULT FALSE,

  claim_responsible_id    UUID REFERENCES public.profiles(id),
  claimed_at              TIMESTAMPTZ,
  virtual_account_confirmed BOOLEAN DEFAULT FALSE,
  claim_locked            BOOLEAN NOT NULL DEFAULT FALSE,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Phase 1.6 开票表
-- ========================================
CREATE TABLE public.invoices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  invoice_type          TEXT CHECK (invoice_type IN ('普通发票','专用发票','增值税发票')),
  invoice_amount        NUMERIC(12,2),
  responsible_id        UUID REFERENCES public.profiles(id),

  preview_sent_at       TIMESTAMPTZ,
  customer_confirmed_at TIMESTAMPTZ,
  issued_at             TIMESTAMPTZ,
  sent_to_customer_at   TIMESTAMPTZ,

  invoice_locked        BOOLEAN NOT NULL DEFAULT FALSE,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Phase 1.7 经费报销表（支持分批多次）
-- ========================================
CREATE TABLE public.reimbursements (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id           UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  seq                  INTEGER NOT NULL,
  amount               NUMERIC(12,2) NOT NULL,
  responsible_id       UUID REFERENCES public.profiles(id),
  submitted_at         TIMESTAMPTZ,
  notes                TEXT,

  recipient_type       TEXT CHECK (recipient_type IN ('teacher','student')),
  recipient_name       TEXT,
  received_confirmed   BOOLEAN DEFAULT FALSE,
  received_confirmed_at TIMESTAMPTZ,

  reimbursement_locked BOOLEAN NOT NULL DEFAULT FALSE,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Phase 1.8 项目结题表
-- ========================================
CREATE TABLE public.closures (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id          UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  responsible_id      UUID REFERENCES public.profiles(id),
  report_file_url     TEXT,
  report_submitted_at TIMESTAMPTZ,
  closed_at           TIMESTAMPTZ,
  status              TEXT DEFAULT 'pending'
                      CHECK (status IN ('pending','submitted','completed')),

  closure_locked      BOOLEAN NOT NULL DEFAULT FALSE,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- Phase 1.9 审计日志
-- ========================================
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID REFERENCES public.projects(id),
  user_id     UUID REFERENCES public.profiles(id),
  table_name  TEXT NOT NULL,
  record_id   UUID,
  action      TEXT NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 通用审计触发器函数
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, table_name, record_id, action, old_data, new_data,
    project_id
  )
  VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    COALESCE(NEW.project_id, OLD.project_id)
  );
  RETURN NEW;
END;
$$;

-- 给每张业务表挂上审计触发器
CREATE TRIGGER audit_contracts
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_reimbursements
  AFTER INSERT OR UPDATE ON public.reimbursements
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_closures
  AFTER INSERT OR UPDATE ON public.closures
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ========================================
-- Phase 1.10 updated_at 自动更新
-- ========================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_projects     BEFORE UPDATE ON public.projects     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_contracts    BEFORE UPDATE ON public.contracts    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_payments     BEFORE UPDATE ON public.payments     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_invoices     BEFORE UPDATE ON public.invoices     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_reimbursements BEFORE UPDATE ON public.reimbursements FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER touch_closures     BEFORE UPDATE ON public.closures     FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
