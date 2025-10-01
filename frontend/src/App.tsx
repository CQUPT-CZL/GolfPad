import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Header from './components/Header'
import ProblemList from './pages/ProblemList'
import ProblemDetail from './pages/ProblemDetail'
import Dashboard from './pages/Dashboard'
import Leaderboard from './pages/Leaderboard'
import BatchUpload from './pages/BatchUpload'
import ExportLatest from './pages/ExportLatest'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

const { Content, Footer } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ flex: 1, padding: '24px', background: '#f5f5f5' }}>
        <div style={{ margin: '0 auto', background: '#fff', borderRadius: '8px', padding: '24px', minHeight: 'calc(100vh - 200px)', width: '100%' }}>
          <Routes>
            <Route path="/" element={<ProblemList />} />
            <Route path="/problems" element={<ProblemList />} />
            <Route path="/problems/:id" element={<ProblemDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/batch-upload" element={<BatchUpload />} />
            <Route path="/export" element={<ExportLatest />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f5f5f5', padding: '24px' }}>
        <div style={{ color: '#666', marginBottom: '12px' }}>
          GolfPad © 2025 - Google Code Golf 2025 竞赛平台 🏌️‍♂️
        </div>
        <div style={{ color: '#888', fontSize: '14px' }}>
          <a 
            href="https://github.com/CQUPT-CZL/GolfPad" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: '#1890ff', 
              textDecoration: 'none',
              marginRight: '8px'
            }}
          >
            🌟 GitHub
          </a>
          | 欢迎大家 Star 和提交 PR！
        </div>
      </Footer>
    </Layout>
  )
}

export default App