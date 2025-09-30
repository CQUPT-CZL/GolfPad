import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Spin, message } from 'antd'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeftOutlined, CodeOutlined } from '@ant-design/icons'
import api from '../services/api'

interface Problem {
  id: number
  task_id: string
  title: string
  description: string
  difficulty: string
  test_cases: any
  created_at: string
}

const ProblemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchProblem(parseInt(id))
    }
  }, [id])

  const fetchProblem = async (problemId: number) => {
    try {
      setLoading(true)
      const response = await api.get(`/problems/${problemId}`)
      setProblem(response.data)
    } catch (error) {
      message.error('获取题目详情失败')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'green'
      case 'medium': return 'orange'
      case 'hard': return 'red'
      default: return 'blue'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return difficulty
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <Spin size="large" />
      </div>
    )
  }

  if (!problem) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">题目不存在</div>
        <Link to="/problems">
          <Button type="primary" className="mt-4">
            返回题目列表
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/problems">
          <Button icon={<ArrowLeftOutlined />}>
            返回题目列表
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">
            {problem.title}
          </h1>
          <div className="flex items-center space-x-2 mt-2">
            <span className="text-gray-500">题目编号: {problem.task_id}</span>
            <Tag color={getDifficultyColor(problem.difficulty)}>
              {getDifficultyText(problem.difficulty)}
            </Tag>
          </div>
        </div>
      </div>

      <Card title="题目描述" className="shadow-sm">
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed">
            {problem.description}
          </p>
        </div>
      </Card>

      {problem.test_cases && (
        <Card title="示例数据" className="shadow-sm">
          <div className="space-y-4">
            {problem.test_cases.train && problem.test_cases.train.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">训练数据示例:</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">输入:</span>
                      <pre className="mt-1 text-sm bg-white p-2 rounded border">
                        {JSON.stringify(problem.test_cases.train[0]?.input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <span className="font-medium">输出:</span>
                      <pre className="mt-1 text-sm bg-white p-2 rounded border">
                        {JSON.stringify(problem.test_cases.train[0]?.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card title="开始解题" className="shadow-sm">
        <div className="text-center py-8">
          <CodeOutlined className="text-6xl text-blue-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">准备好挑战了吗？</h3>
          <p className="text-gray-600 mb-6">
            在线代码编辑器功能正在开发中，敬请期待！
          </p>
          <Button type="primary" size="large" disabled>
            开始编码
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ProblemDetail