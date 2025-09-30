import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, Spin } from 'antd'
import { TrophyOutlined, CodeOutlined, ClockCircleOutlined, CrownOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import ScoreLineChart from '../components/ScoreLineChart'
import api from '../services/api'

interface UserStats {
  total_score: number
  problems_solved: number
  total_submissions: number
  rank: number | null
}

interface ScoreItem {
  problem_id: number
  task_id: string
  title: string
  code_length?: number | null
  score: number
}

interface ScoresResponse {
  total_score: number
  items: ScoreItem[]
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
  const [scores, setScores] = useState<ScoreItem[]>([])
  const [customTotal, setCustomTotal] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const [statsResult, submissionsResult, scoresResult] = await Promise.allSettled([
        api.get('/users/me/stats'),
        api.get('/submissions?limit=10'),
        api.get('/users/me/scores')
      ])

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data)
      } else {
        console.warn('Failed to fetch stats:', statsResult.reason)
      }

      if (submissionsResult.status === 'fulfilled') {
        setSubmissions(submissionsResult.value.data)
      } else {
        console.warn('Failed to fetch submissions:', submissionsResult.reason)
      }

      if (scoresResult.status === 'fulfilled') {
        const scoresData: ScoresResponse = scoresResult.value.data
        setScores(scoresData.items || [])
        const roundedTotal = Math.round(((scoresData.total_score ?? 0) + Number.EPSILON) * 1000) / 1000
        setCustomTotal(roundedTotal)
      } else {
        console.warn('Failed to fetch scores:', scoresResult.reason)
        setScores([])
        setCustomTotal(0)
      }
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

  const scoreColumns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: ScoreItem) => (
        <Link to={`/problems/${record.problem_id}`}>
          <Button type="link" size="small">{title}</Button>
        </Link>
      ),
    },
    {
      title: '题目ID',
      dataIndex: 'problem_id',
      key: 'problem_id',
      render: (problemId: number) => (
        <Link to={`/problems/${problemId}`}>
          <Button type="link" size="small">#{problemId}</Button>
        </Link>
      ),
      width: 100,
    },
    {
      title: '最佳代码长度',
      dataIndex: 'code_length',
      key: 'code_length',
      render: (length: number | null | undefined) => length ? `${length} 字符` : '未通过',
      width: 160,
    },
    {
      title: '分数（2500 - 长度）',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => score.toFixed(3),
      width: 180,
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
          <Col xs={24}>
            <Card>
              <Statistic
                title="个人总分（规则：通过题得 2500-代码长度；未通过 0.001）"
                value={Math.round((customTotal + Number.EPSILON) * 1000) / 1000}
                suffix="分"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 折线图放在个人总分下面（自适应容器宽度） */}
        <Card title="个人分数折线图" className="shadow-sm">
          {scores.length > 0 ? (
            <ScoreLineChart scores={scores} height={320} />
          ) : (
            <div className="text-gray-600" style={{ padding: '8px 0' }}>暂无分数数据</div>
          )}
        </Card>

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

        <Card title="每题个人分数" className="shadow-sm">
          <Table
            columns={scoreColumns}
            dataSource={scores}
            rowKey={(row) => `${row.problem_id}`}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: '暂无题目记录'
            }}
          />
        </Card>
      </Spin>
    </div>
  )
}

export default Dashboard