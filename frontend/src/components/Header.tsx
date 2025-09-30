import React from 'react'
import { Layout, Menu, Button, Avatar } from 'antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  HomeOutlined, 
  TrophyOutlined, 
  UserOutlined, 
  LoginOutlined,
  LogoutOutlined,
  DashboardOutlined,
  UploadOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Header: AntHeader } = Layout

const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = []

  // 如果用户已登录，个人中心放在第一位
  if (user) {
    menuItems.push({
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>个人中心</Link>,
    })
  }

  // 添加其他菜单项
  menuItems.push(
    {
      key: '/problems',
      icon: <HomeOutlined />,
      label: <Link to="/problems" style={{ color: 'inherit', textDecoration: 'none' }}>题目列表</Link>,
    },
    {
      key: '/leaderboard',
      icon: <TrophyOutlined />,
      label: <Link to="/leaderboard" style={{ color: 'inherit', textDecoration: 'none' }}>排行榜</Link>,
    }
  )

  // 如果用户已登录，添加批量提交
  if (user) {
    menuItems.push({
      key: '/batch-upload',
      icon: <UploadOutlined />,
      label: <Link to="/batch-upload" style={{ color: 'inherit', textDecoration: 'none' }}>批量提交</Link>,
    })
    menuItems.push({
      key: '/export',
      icon: <DownloadOutlined />,
      label: <Link to="/export" style={{ color: 'inherit', textDecoration: 'none' }}>导出最新提交</Link>,
    })
  }

  return (
    <AntHeader style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      padding: '0 24px', 
      background: '#fff', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          color: '#1890ff', 
          marginRight: '32px' 
        }}>
          <Link to="/" style={{ color: '#1890ff', textDecoration: 'none' }}>
            🏌️‍♂️ GolfPad
          </Link>
        </div>
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ 
            border: 'none', 
            background: 'transparent',
            flex: 1
          }}
        />
      </div>
      
      {/* 右侧显示用户信息或登录按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '16px' }}>
        {user ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px'
          }}>
            <Avatar icon={<UserOutlined />} />
            <span style={{ color: '#333' }}>{user.username}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              type="default" 
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
            <Button 
              type="primary"
              onClick={() => navigate('/register')}
            >
              注册
            </Button>
          </div>
        )}
      </div>
    </AntHeader>
  )
}

export default Header