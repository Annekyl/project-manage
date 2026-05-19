-- 添加各环节自定义负责人名称字段
-- 在 Supabase SQL Editor 中执行

-- 合同表添加字段
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS draft_responsible_name TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS stamp_responsible_name TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS send_responsible_name TEXT;
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS receipt_responsible_name TEXT;

-- 打款表添加字段
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS claim_responsible_name TEXT;

-- 开票表添加字段
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS responsible_name TEXT;

-- 报销表添加字段
ALTER TABLE public.reimbursements ADD COLUMN IF NOT EXISTS responsible_name TEXT;

-- 结题表添加字段
ALTER TABLE public.closures ADD COLUMN IF NOT EXISTS responsible_name TEXT;
