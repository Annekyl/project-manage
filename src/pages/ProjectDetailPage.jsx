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
import { ArrowLeft, Building2, User, DollarSign } from 'lucide-react'

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
    return <div className="flex items-center justify-center h-64">加载中...</div>
  }

  if (error || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">项目不存在或加载失败</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">
          返回工作台
        </button>
      </div>
    )
  }

  const statusLabels = {
    contract: '合同阶段',
    payment: '打款阶段',
    invoice: '开票阶段',
    reimbursement: '报销阶段',
    closure: '结题阶段',
    completed: '已完成'
  }

  const totalReimbursed = project.reimbursements?.reduce(
    (sum, r) => sum + (r.amount || 0),
    0
  ) || 0

  return (
    <div>
      {/* 返回按钮 */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        返回工作台
      </button>

      {/* 项目头部信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <Building2 className="w-4 h-4 mr-1" />
                {project.company_name}
              </span>
              {project.company_contact && (
                <span className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  负责人: {project.company_contact}
                </span>
              )}
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                ¥{project.total_amount?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
          <span className="mt-2 lg:mt-0 px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-800">
            {statusLabels[project.status] || project.status}
          </span>
        </div>

        <ProgressStepper currentStatus={project.status} />
      </div>

      {/* Tab 导航 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab 内容 */}
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
