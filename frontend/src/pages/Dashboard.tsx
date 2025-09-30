import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Spin } from 'antd'
import { TrophyOutlined, CodeOutlined, ClockCircleOutlined, CrownOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface UserStats {
  total_score: number
  problems_solved: number
  total_submissions: number
  rank: number | null
}

interface Submission {
  id: number
  problem_id: number
  language: string
  code_length: number
  status: string
  created_at: string
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [statsResponse, submissionsResponse] = await Promise.all([
        api.get('/users/me/stats'),
        api.get('/submissions?limit=10')
      ])
      
      setStats(statsResponse.data)
      setSubmissions(submissionsResponse.data)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'green'
      case 'failed': return 'red'
      case 'pending': return 'blue'
      case 'running': return 'orange'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'passed': return '通过'
      case 'failed': return '失败'
      case 'pending': return '等待中'
      case 'running': return '运行中'
      default: return status
    }
  }

  const columns = [
    {
      title: '题目ID',
      dataIndex: 'problem_id',
      key: 'problem_id',
      render: (problemId: number) => (
        <Link to={`/problems/${problemId}`}>
          <Button type="link" size="small">
            #{problemId}
          </Button>
        </Link>
      ),
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
      render: (language: string) => (
        <Tag color="blue">{language}</Tag>
      ),
    },
    {
      title: '代码长度',
      dataIndex: 'code_length',
      key: 'code_length',
      render: (length: number) => `${length} 字符`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ]

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">
          请先登录查看个人中心
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          👋 欢迎回来，{user.username}！
        </h1>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总分数"
                value={stats?.total_score || 0}
                prefix={<TrophyOutlined />}
                suffix="分"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已解决题目"
                value={stats?.problems_solved || 0}
                prefix={<CodeOutlined />}
                suffix="题"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总提交次数"
                value={stats?.total_submissions || 0}
                prefix={<ClockCircleOutlined />}
                suffix="次"
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="全站排名"
                value={stats?.rank || '-'}
                prefix={<CrownOutlined />}
                suffix={stats?.rank ? "名" : ""}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="最近提交记录" className="shadow-sm">
          <Table
            columns={columns}
            dataSource={submissions}
            rowKey="id"
            pagination={false}
            locale={{
              emptyText: '暂无提交记录'
            }}
          />
          {submissions.length > 0 && (
            <div className="text-center mt-4">
              <Link to="/submissions">
                <Button type="link">查看全部提交记录</Button>
              </Link>
            </div>
          )}
        </Card>
      </Spin>
    </div>
  )
}

export default Dashboard