import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'
import Header from './components/Header'
import ProblemList from './pages/ProblemList'
import ProblemDetail from './pages/ProblemDetail'
import Dashboard from './pages/Dashboard'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import Register from './pages/Register'
import './App.css'

const { Content, Footer } = Layout

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ flex: 1, padding: '24px', background: '#f5f5f5' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', background: '#fff', borderRadius: '8px', padding: '24px', minHeight: 'calc(100vh - 200px)' }}>
          <Routes>
            <Route path="/" element={<ProblemList />} />
            <Route path="/problems" element={<ProblemList />} />
            <Route path="/problems/:id" element={<ProblemDetail />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center', background: '#f5f5f5', padding: '24px' }}>
        <div style={{ color: '#666' }}>
          GolfPad © 2025 - Google Code Golf 2025 竞赛平台 🏌️‍♂️
        </div>
      </Footer>
    </Layout>
  )
}

export default App