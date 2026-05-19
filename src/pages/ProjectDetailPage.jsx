import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProject } from '../hooks/useProjects'
import { useAuth } from '../hooks/useAuth'
import ProgressStepper from '../components/common/ProgressStepper'
import ContractTab from './tabs/ContractTab'
import PaymentTab from './tabs/PaymentTab'
import InvoiceTab from './tabs/InvoiceTab'
import ReimbursementTab from './tabs/ReimbursementTab'
import ClosureTab from './tabs/ClosureTab'
import { ArrowLeft, Building2, User, DollarSign, Download } from 'lucide-react'
import { exportCsv } from '../utils/exportCsv'

const TABS = [
  { key: 'contract', label: '合同' },
  { key: 'payment', label: '打款 & 认领' },
  { key: 'invoice', label: '开票' },
  { key: 'reimbursement', label: '报销' },
  { key: 'closure', label: '结题' },
]

export default function ProjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: project, isLoading, error } = useProject(id)
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('contract')

  if (isLoading) {
    return <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-dim)' }}>加载中...</div>
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--danger)' }}>项目不存在或加载失败</p>
        <button onClick={() => navigate('/')} className="mt-4 transition-colors" style={{ color: 'var(--accent)' }}>
          返回工作台
        </button>
      </div>
    )
  }

  const statusLabels = {
    contract: '合同阶段', payment: '打款阶段', invoice: '开票阶段',
    reimbursement: '报销阶段', closure: '结题阶段', completed: '已完成'
  }

  function handleExport() {
    const contract = project.contracts?.[0]
    const payment = project.payments?.[0]
    const invoice = project.invoices?.[0]
    const closure = project.closures?.[0]
    const reimbursements = project.reimbursements || []
    const rows = []

    // 项目基本信息
    rows.push(['=== 项目信息 ==='])
    rows.push(['项目名称', '企业名称', '负责人', '总金额', '状态', '创建时间'])
    rows.push([project.name, project.company_name, project.company_contact || '', project.total_amount || 0, statusLabels[project.status] || project.status, project.created_at])
    rows.push([])

    // 合同
    rows.push(['=== 合同定稿 ==='])
    rows.push(['责任人', '具体负责人', '定稿时间', '合同文件'])
    rows.push([contract?.draft_responsible_name || '', contract?.draft_responsible_name || '', contract?.draft_confirmed_at || '', contract?.draft_file_url || ''])
    rows.push([])
    rows.push(['=== 合同盖章 ==='])
    rows.push(['责任人', '具体负责人', '盖章时间', '合同份数', '盖章扫描件'])
    rows.push([contract?.stamp_responsible_name || '', contract?.stamp_responsible_name || '', contract?.stamp_completed_at || '', contract?.stamp_count || '', contract?.stamp_scan_url || ''])
    rows.push([])
    rows.push(['=== 合同寄送 ==='])
    rows.push(['责任人', '具体负责人', '寄出时间', '快递单号', '快递公司'])
    rows.push([contract?.send_responsible_name || '', contract?.send_responsible_name || '', contract?.sent_at || '', contract?.tracking_number || '', contract?.courier || ''])
    rows.push([])
    rows.push(['=== 签收确认 ==='])
    rows.push(['责任人', '具体负责人', '客户确认时间'])
    rows.push([contract?.receipt_responsible_name || '', contract?.receipt_responsible_name || '', contract?.customer_confirmed_at || ''])
    rows.push([])

    // 打款
    rows.push(['=== 客户打款 ==='])
    rows.push(['打款金额', '到账时间', '银行流水单号'])
    rows.push([payment?.payment_amount || '', payment?.paid_at || '', payment?.bank_flow_number || ''])
    rows.push([])
    rows.push(['=== 经费认领 ==='])
    rows.push(['认领责任人', '具体负责人', '认领时间', '虚拟账户已确认'])
    rows.push([payment?.claim_responsible_name || '', payment?.claim_responsible_name || '', payment?.claimed_at || '', payment?.virtual_account_confirmed ? '是' : '否'])
    rows.push([])

    // 开票
    rows.push(['=== 开票信息 ==='])
    rows.push(['发票类型', '开票金额', '责任人', '具体负责人', '预览发送时间', '客户确认时间', '正式开票时间', '发票发送时间'])
    rows.push([invoice?.invoice_type || '', invoice?.invoice_amount || '', invoice?.responsible_name || '', invoice?.responsible_name || '', invoice?.preview_sent_at || '', invoice?.customer_confirmed_at || '', invoice?.issued_at || '', invoice?.sent_to_customer_at || ''])
    rows.push([])

    // 报销
    rows.push(['=== 报销记录 ==='])
    if (reimbursements.length > 0) {
      rows.push(['序号', '金额', '经办人', '收款人', '收款人类型', '提交时间', '已确认到账', '说明'])
      reimbursements.forEach(r => {
        rows.push([r.seq, r.amount || 0, r.responsible_name || '', r.recipient_name || '', r.recipient_type === 'teacher' ? '老师' : '学生', r.submitted_at || '', r.received_confirmed ? '是' : '否', r.notes || ''])
      })
    } else {
      rows.push(['暂无报销记录'])
    }
    rows.push([])

    // 结题
    rows.push(['=== 项目结题 ==='])
    rows.push(['责任人', '具体负责人', '结题状态', '报告提交时间', '结题完成时间'])
    const closureStatusLabels = { pending: '待启动', submitted: '已提交报告', completed: '已完成' }
    rows.push([closure?.responsible_name || '', closure?.responsible_name || '', closureStatusLabels[closure?.status] || closure?.status || '', closure?.report_submitted_at || '', closure?.closed_at || ''])

    exportCsv(`${project.name}_详情.csv`, [], rows, true)
  }

  return (
    <div className="page-enter">
      <button onClick={() => navigate('/')} className="flex items-center mb-4 transition-colors" style={{ color: 'var(--text-dim)' }}>
        <ArrowLeft className="w-4 h-4 mr-1" /> 返回工作台
      </button>

      <div className="rounded-xl shadow-sm p-6 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-bright)' }}>{project.name}</h1>
            <div className="flex items-center mt-2 space-x-4 text-sm" style={{ color: 'var(--text-dim)' }}>
              <span className="flex items-center"><Building2 className="w-4 h-4 mr-1" />{project.company_name}</span>
              {project.company_contact && <span className="flex items-center"><User className="w-4 h-4 mr-1" />负责人: {project.company_contact}</span>}
              <span className="flex items-center"><DollarSign className="w-4 h-4 mr-1" />¥{project.total_amount?.toLocaleString() || '0'}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-2 lg:mt-0">
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-1.5 text-sm rounded-xl btn-transition"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              <Download className="w-4 h-4 mr-1" /> 导出
            </button>
            <span className="px-3 py-1 text-sm font-medium rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              {statusLabels[project.status] || project.status}
            </span>
          </div>
        </div>
        <ProgressStepper currentStatus={project.status} />
      </div>

      <div className="border-b mb-6" style={{ borderColor: 'var(--border)' }}>
        <nav className="flex space-x-8" role="tablist">
          {TABS.map((tab) => (
            <button key={tab.key} role="tab" aria-selected={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} className="py-2.5 px-1 border-b-2 font-medium text-sm transition-colors" style={{ borderColor: activeTab === tab.key ? 'var(--accent)' : 'transparent', color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-dim)' }}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'contract' && <ContractTab project={project} isAdmin={isAdmin} />}
        {activeTab === 'payment' && <PaymentTab project={project} isAdmin={isAdmin} />}
        {activeTab === 'invoice' && <InvoiceTab project={project} isAdmin={isAdmin} />}
        {activeTab === 'reimbursement' && <ReimbursementTab project={project} isAdmin={isAdmin} />}
        {activeTab === 'closure' && <ClosureTab project={project} isAdmin={isAdmin} />}
      </div>
    </div>
  )
}
