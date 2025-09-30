import React, { useState, useEffect } from 'react'
import { Card, Table, Tag, Tabs, Select, message } from 'antd'
import { TrophyOutlined, CrownOutlined, StarOutlined } from '@ant-design/icons'
import api from '../services/api'

const { TabPane } = Tabs
const { Option } = Select

interface LeaderboardEntry {
  rank: number
  username: string
  total_score: number
  problems_solved: number
}

interface ProblemLeaderboardEntry {
  rank: number
  username: string
  code_length: number
  language: string
  submitted_at: string
}

const Leaderboard: React.FC = () => {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([])
  const [problemLeaderboard, setProblemLeaderboard] = useState<ProblemLeaderboardEntry[]>([])
  const [languageLeaderboard, setLanguageLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProblem, setSelectedProblem] = useState<number | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python')
  const [problems, setProblems] = useState<any[]>([])

  useEffect(() => {
    fetchGlobalLeaderboard()
    fetchLanguageLeaderboard()
    fetchProblems()
  }, [])

  useEffect(() => {
    if (selectedProblem) {
      fetchProblemLeaderboard(selectedProblem)
    }
  }, [selectedProblem])

  useEffect(() => {
    fetchLanguageLeaderboard()
  }, [selectedLanguage])

  const fetchGlobalLeaderboard = async () => {
    try {
      const response = await api.get('/leaderboard/global')
      setGlobalLeaderboard(response.data)
    } catch (error) {
      message.error('获取全局排行榜失败')
    }
  }

  const fetchProblemLeaderboard = async (problemId: number) => {
    try {
      setLoading(true)
      const response = await api.get(`/leaderboard/problem/${problemId}`)
      setProblemLeaderboard(response.data)
    } catch (error) {
      message.error('获取题目排行榜失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchLanguageLeaderboard = async () => {
    try {
      const response = await api.get(`/leaderboard/languages/${selectedLanguage}`)
      setLanguageLeaderboard(response.data)
    } catch (error) {
      message.error('获取语言排行榜失败')
    }
  }

  const fetchProblems = async () => {
    try {
      const response = await api.get('/problems?limit=100')
      setProblems(response.data)
      if (response.data.length > 0) {
        setSelectedProblem(response.data[0].id)
      }
    } catch (error) {
      message.error('获取题目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <CrownOutlined style={{ color: '#FFD700' }} />
      case 2: return <StarOutlined style={{ color: '#C0C0C0' }} />
      case 3: return <StarOutlined style={{ color: '#CD7F32' }} />
      default: return <span className="text-gray-500">#{rank}</span>
    }
  }

  const globalColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => getRankIcon(rank),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: LeaderboardEntry) => (
        <div className="flex items-center space-x-2">
          <span className={record.rank <= 3 ? 'font-bold' : ''}>{username}</span>
        </div>
      ),
    },
    {
      title: '总分数',
      dataIndex: 'total_score',
      key: 'total_score',
      render: (score: number) => (
        <Tag color="blue">{score} 分</Tag>
      ),
    },
    {
      title: '已解决题目',
      dataIndex: 'problems_solved',
      key: 'problems_solved',
      render: (count: number) => `${count} 题`,
    },
  ]

  const problemColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: number) => getRankIcon(rank),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: ProblemLeaderboardEntry) => (
        <div className="flex items-center space-x-2">
          <span className={record.rank <= 3 ? 'font-bold' : ''}>{username}</span>
        </div>
      ),
    },
    {
      title: '代码长度',
      dataIndex: 'code_length',
      key: 'code_length',
      render: (length: number) => (
        <Tag color="green">{length} 字符</Tag>
      ),
    },
    {
      title: '语言',
      dataIndex: 'language',
      key: 'language',
      render: (language: string) => (
        <Tag color="purple">{language}</Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submitted_at',
      key: 'submitted_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          🏆 排行榜
        </h1>
      </div>

      <Card className="shadow-sm">
        <Tabs defaultActiveKey="global" size="large">
          <TabPane tab={<span><TrophyOutlined />全局排行榜</span>} key="global">
            <Table
              columns={globalColumns}
              dataSource={globalLeaderboard}
              rowKey="username"
              pagination={{ pageSize: 20 }}
              loading={loading}
              locale={{ emptyText: '暂无数据' }}
            />
          </TabPane>

          <TabPane tab={<span><CrownOutlined />题目排行榜</span>} key="problem">
            <div className="mb-4">
              <Select
                placeholder="选择题目"
                style={{ width: 200 }}
                value={selectedProblem}
                onChange={setSelectedProblem}
              >
                {problems.map(problem => (
                  <Option key={problem.id} value={problem.id}>
                    {problem.title}
                  </Option>
                ))}
              </Select>
            </div>
            <Table
              columns={problemColumns}
              dataSource={problemLeaderboard}
              rowKey={(record) => `${record.username}-${record.submitted_at}`}
              pagination={{ pageSize: 20 }}
              loading={loading}
              locale={{ emptyText: '暂无数据' }}
            />
          </TabPane>

          <TabPane tab={<span><StarOutlined />语言排行榜</span>} key="language">
            <div className="mb-4">
              <Select
                value={selectedLanguage}
                style={{ width: 150 }}
                onChange={setSelectedLanguage}
              >
                <Option value="python">Python</Option>
                <Option value="javascript">JavaScript</Option>
                <Option value="cpp">C++</Option>
                <Option value="java">Java</Option>
                <Option value="go">Go</Option>
                <Option value="rust">Rust</Option>
              </Select>
            </div>
            <Table
              columns={globalColumns}
              dataSource={languageLeaderboard}
              rowKey="username"
              pagination={{ pageSize: 20 }}
              loading={loading}
              locale={{ emptyText: '暂无数据' }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  )
}

export default Leaderboard