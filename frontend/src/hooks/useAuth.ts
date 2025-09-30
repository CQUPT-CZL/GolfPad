import { useState, useEffect } from 'react'
import { message } from 'antd'
import api from '../services/api'

interface User {
  id: number
  username: string
  email: string
}

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user info
      api.get('/users/me')
        .then((response: any) => {
          setUser(response.data)
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/users/login', { username, password })
      const { access_token, user: userData } = response.data
      
      localStorage.setItem('token', access_token)
      setUser(userData)
      message.success('登录成功！')
      return true
    } catch (error: any) {
      message.error(error.response?.data?.detail || '登录失败')
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    message.success('已退出登录')
  }

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      await api.post('/users/register', { username, email, password })
      message.success('注册成功！请登录')
      return true
    } catch (error: any) {
      message.error(error.response?.data?.detail || '注册失败')
      return false
    }
  }

  return {
    user,
    login,
    logout,
    register,
    loading
  }
}