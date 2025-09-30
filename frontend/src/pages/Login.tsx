import React from 'react'
import { Form, Input, Button, Card } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form] = Form.useForm()

  const onFinish = async (values: { username: string; password: string }) => {
    const success = await login(values.username, values.password)
    if (success) {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            🏌️‍♂️ 登录 GolfPad
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            开始你的代码高尔夫之旅
          </p>
        </div>
        
        <Card className="shadow-lg">
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名!' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入用户名" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入密码"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full">
                登录
              </Button>
            </Form.Item>

            <div className="text-center">
              <span className="text-gray-600">还没有账号？</span>
              <Link to="/register" className="text-blue-600 hover:text-blue-500 ml-1">
                立即注册
              </Link>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  )
}

export default Login