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
import { statusLabels } from '../utils/constants'
import { getFileUrl } from '../utils/storage'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import toast from 'react-hot-toast'

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
  const { isAdmin, user } = useAuth()
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

  async function handleExport() {
    const contract = project.contracts?.[0]
    const payment = project.payments?.[0]
    const invoice = project.invoices?.[0]
    const closure = project.closures?.[0]
    const reimbursements = project.reimbursements || []
    const closureStatusLabels = { pending: '待启动', submitted: '已提交报告', completed: '已完成' }

    const zip = new JSZip()

    // 1. 项目概要
    zip.file('项目概要.txt', [
      `项目名称: ${project.name}`,
      `企业名称: ${project.company_name}`,
      `负责人: ${project.company_contact || '未指定'}`,
      `总金额: ¥${(project.total_amount || 0).toLocaleString()}`,
      `当前状态: ${statusLabels[project.status] || project.status}`,
      `创建时间: ${project.created_at}`,
    ].join('\n'))

    // 2. 合同阶段
    zip.file('合同.txt', [
      '【合同定稿】',
      `责任人: ${contract?.draft_responsible_name || '未指定'}`,
      `定稿时间: ${contract?.draft_confirmed_at || '-'}`,
      `合同文件: ${contract?.draft_file_url ? '见附件' : '-'}`,
      '',
      '【合同盖章】',
      `责任人: ${contract?.stamp_responsible_name || '未指定'}`,
      `盖章时间: ${contract?.stamp_completed_at || '-'}`,
      `合同份数: ${contract?.stamp_count || '-'}`,
      `盖章扫描件: ${contract?.stamp_scan_url ? '见附件' : '-'}`,
      '',
      '【合同寄送】',
      `责任人: ${contract?.send_responsible_name || '未指定'}`,
      `寄出时间: ${contract?.sent_at || '-'}`,
      `快递单号: ${contract?.tracking_number || '-'}`,
      `快递公司: ${contract?.courier || '-'}`,
      '',
      '【签收确认】',
      `责任人: ${contract?.receipt_responsible_name || '未指定'}`,
      `客户确认时间: ${contract?.customer_confirmed_at || '-'}`,
      `签收截图: ${contract?.receipt_screenshot_url ? '见附件' : '-'}`,
      `客户确认截图: ${contract?.customer_confirm_screenshot_url ? '见附件' : '-'}`,
    ].join('\n'))

    // 3. 打款阶段
    zip.file('打款.txt', [
      '【客户打款】',
      `打款金额: ¥${(payment?.payment_amount || 0).toLocaleString()}`,
      `到账时间: ${payment?.paid_at || '-'}`,
      `银行流水单号: ${payment?.bank_flow_number || '-'}`,
      `打款截图: ${payment?.payment_screenshot_url ? '见附件' : '-'}`,
      '',
      '【经费认领】',
      `认领责任人: ${payment?.claim_responsible_name || '未指定'}`,
      `认领时间: ${payment?.claimed_at || '-'}`,
      `虚拟账户已确认: ${payment?.virtual_account_confirmed ? '是' : '否'}`,
    ].join('\n'))

    // 4. 开票阶段
    zip.file('开票.txt', [
      '【开票信息】',
      `发票类型: ${invoice?.invoice_type || '-'}`,
      `开票金额: ¥${(invoice?.invoice_amount || 0).toLocaleString()}`,
      `责任人: ${invoice?.responsible_name || '未指定'}`,
      `预览发送客户时间: ${invoice?.preview_sent_at || '-'}`,
      `客户确认时间: ${invoice?.customer_confirmed_at || '-'}`,
      `正式开票时间: ${invoice?.issued_at || '-'}`,
      `发票发送客户时间: ${invoice?.sent_to_customer_at || '-'}`,
    ].join('\n'))

    // 5. 报销阶段
    const reimbursementLines = ['【报销记录】']
    if (reimbursements.length > 0) {
      reimbursements.forEach((r, i) => {
        reimbursementLines.push(
          '',
          `--- 第${r.seq}次报销 ---`,
          `金额: ¥${(r.amount || 0).toLocaleString()}`,
          `经办人: ${r.responsible_name || '未指定'}`,
          `收款人: ${r.recipient_name} (${r.recipient_type === 'teacher' ? '老师' : '学生'})`,
          `提交时间: ${r.submitted_at || '-'}`,
          `已确认到账: ${r.received_confirmed ? '是' : '否'}`,
          r.notes ? `说明: ${r.notes}` : '',
        )
      })
    } else {
      reimbursementLines.push('暂无报销记录')
    }
    zip.file('报销.txt', reimbursementLines.join('\n'))

    // 6. 结题阶段
    zip.file('结题.txt', [
      '【项目结题】',
      `责任人: ${closure?.responsible_name || '未指定'}`,
      `结题状态: ${closureStatusLabels[closure?.status] || closure?.status || '-'}`,
      `报告提交时间: ${closure?.report_submitted_at || '-'}`,
      `结题完成时间: ${closure?.closed_at || '-'}`,
      `结题报告: ${closure?.report_file_url ? '见附件' : '-'}`,
    ].join('\n'))

    // 7. 收集并下载附件
    const fileEntries = [
      { path: contract?.draft_file_url, label: '合同定稿' },
      { path: contract?.stamp_scan_url, label: '盖章扫描件' },
      { path: contract?.receipt_screenshot_url, label: '签收截图' },
      { path: contract?.customer_confirm_screenshot_url, label: '客户确认截图' },
      { path: payment?.payment_screenshot_url, label: '打款截图' },
      { path: closure?.report_file_url, label: '结题报告' },
    ].filter(f => f.path)

    if (fileEntries.length > 0) {
      toast.loading('正在下载附件...', { id: 'export-zip' })
      const folder = zip.folder('附件')
      const results = await Promise.allSettled(
        fileEntries.map(async ({ path, label }) => {
          const url = await getFileUrl(path)
          const res = await fetch(url)
          if (!res.ok) throw new Error(`${label} 下载失败`)
          const blob = await res.blob()
          const fileName = path.split('/').pop()
          folder.file(`${label}_${fileName}`, blob)
        })
      )
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        toast.error(`${failed.length} 个附件下载失败`, { id: 'export-zip' })
      } else {
        toast.success('导出完成', { id: 'export-zip' })
      }
    }

    // 8. 生成并下载 ZIP
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `${project.name}_项目资料.zip`)
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
        {activeTab === 'contract' && <ContractTab project={project} isAdmin={isAdmin} currentUserId={user?.id} />}
        {activeTab === 'payment' && <PaymentTab project={project} isAdmin={isAdmin} currentUserId={user?.id} />}
        {activeTab === 'invoice' && <InvoiceTab project={project} isAdmin={isAdmin} currentUserId={user?.id} />}
        {activeTab === 'reimbursement' && <ReimbursementTab project={project} isAdmin={isAdmin} currentUserId={user?.id} />}
        {activeTab === 'closure' && <ClosureTab project={project} isAdmin={isAdmin} currentUserId={user?.id} />}
      </div>
    </div>
  )
}
