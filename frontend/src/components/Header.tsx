import React from 'react'
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  HomeOutlined, 
  TrophyOutlined, 
  UserOutlined, 
  LoginOutlined,
  LogoutOutlined,
  DashboardOutlined
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Header: AntHeader } = Layout

const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const menuItems = [
    {
      key: '/problems',
      icon: <HomeOutlined />,
      label: <Link to="/problems" style={{ color: 'inherit', textDecoration: 'none' }}>题目列表</Link>,
    },
    {
      key: '/leaderboard',
      icon: <TrophyOutlined />,
      label: <Link to="/leaderboard" style={{ color: 'inherit', textDecoration: 'none' }}>排行榜</Link>,
    },
  ]

  if (user) {
    menuItems.push({
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard" style={{ color: 'inherit', textDecoration: 'none' }}>个人中心</Link>,
    })
  }

  const userMenuItems = user ? [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '个人中心',
      onClick: () => navigate('/dashboard'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: logout,
    },
  ] : []

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
      <div style={{ display: 'flex', alignItems: 'center' }}>
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
            minWidth: '300px'
          }}
        />
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Avatar icon={<UserOutlined />} />
              <span style={{ color: '#333' }}>{user.username}</span>
            </div>
          </Dropdown>
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