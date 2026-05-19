import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import { ThemeProvider } from './hooks/useTheme.jsx'
import Layout from './components/layout/Layout'
import ErrorBoundary from './components/common/ErrorBoundary'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectListPage from './pages/ProjectListPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import AdminPage from './pages/AdminPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

const queryClient = new QueryClient()

function Guard({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">加载中...</div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <HashRouter>
        <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Guard><Layout /></Guard>}>
            <Route index element={<DashboardPage />} />
            <Route path="projects" element={<ProjectListPage />} />
            <Route path="projects/:id" element={<ProjectDetailPage />} />
            <Route path="admin" element={<Guard adminOnly><AdminPage /></Guard>} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        </ErrorBoundary>
      </HashRouter>
      <Toaster position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
