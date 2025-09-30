import React, { useState, useEffect } from 'react'
import { Card, List, Tag, Button, Select, Input, Spin, message } from 'antd'
import { Link } from 'react-router-dom'
import { SearchOutlined, CodeOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Option } = Select
const { Search } = Input

interface Problem {
  id: number
  task_id: string
  title: string
  description: string
  difficulty: string
  created_at: string
}

const ProblemList: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [difficulty, setDifficulty] = useState<string>('')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchProblems()
  }, [difficulty])

  const fetchProblems = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (difficulty) params.difficulty = difficulty
      
      const response = await api.get('/problems', { params })
      setProblems(response.data)
    } catch (error) {
      message.error('获取题目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredProblems = problems.filter(problem =>
    problem.title.toLowerCase().includes(searchText.toLowerCase()) ||
    problem.task_id.toLowerCase().includes(searchText.toLowerCase())
  )

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

  return (
    <div style={{ padding: '0' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: '#333',
          margin: 0
        }}>
          🏌️‍♂️ 代码高尔夫题目
        </h1>
        <div style={{ fontSize: '14px', color: '#666' }}>
          共 {filteredProblems.length} 道题目
        </div>
      </div>

      <Card style={{ marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '16px', 
          alignItems: 'center' 
        }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <Search
              placeholder="搜索题目标题或编号..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Select
            placeholder="选择难度"
            allowClear
            style={{ width: 120 }}
            value={difficulty || undefined}
            onChange={setDifficulty}
          >
            <Option value="easy">简单</Option>
            <Option value="medium">中等</Option>
            <Option value="hard">困难</Option>
          </Select>
        </div>
      </Card>

      <Spin spinning={loading}>
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 1,
            md: 2,
            lg: 2,
            xl: 3,
            xxl: 3,
          }}
          dataSource={filteredProblems}
          renderItem={(problem) => (
            <List.Item>
              <Card
                hoverable
                style={{ 
                  height: '100%', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'box-shadow 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
                actions={[
                  <Link to={`/problems/${problem.id}`} key="solve">
                    <Button type="primary" icon={<CodeOutlined />}>
                      开始解题
                    </Button>
                  </Link>
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: '8px'
                    }}>
                      <span style={{ 
                        fontSize: '18px', 
                        fontWeight: '600',
                        color: '#333'
                      }}>
                        {problem.title}
                      </span>
                      <Tag color={getDifficultyColor(problem.difficulty)}>
                        {getDifficultyText(problem.difficulty)}
                      </Tag>
                    </div>
                  }
                  description={
                    <div style={{ lineHeight: '1.6' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#999',
                        marginBottom: '8px'
                      }}>
                        题目编号: {problem.task_id}
                      </div>
                      <div style={{ 
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {problem.description}
                      </div>
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      </Spin>

      {!loading && filteredProblems.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '48px 0',
          color: '#999',
          fontSize: '16px'
        }}>
          {searchText || difficulty ? '没有找到匹配的题目' : '暂无题目'}
        </div>
      )}
    </div>
  )
}

export default ProblemList