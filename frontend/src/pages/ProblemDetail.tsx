import React, { useState, useEffect } from 'react'
import { Card, Button, Tag, Spin, message, Collapse } from 'antd'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeftOutlined,
  CodeOutlined,
  RightOutlined,
} from '@ant-design/icons'
import api from '../services/api'
import CodeEditor from '../components/CodeEditor'
import CodeExecutionResult from '../components/CodeExecutionResult'

const colors = [
  'rgb(0, 0, 0)',
  'rgb(30, 147, 255)',
  'rgb(250, 61, 49)',
  'rgb(78, 204, 48)',
  'rgb(255, 221, 0)',
  'rgb(153, 153, 153)',
  'rgb(229, 59, 163)',
  'rgb(255, 133, 28)',
  'rgb(136, 216, 241)',
  'rgb(147, 17, 49)',
]

const ColorPalette = ({ usedColors }: { usedColors: number[] }) => {
  if (usedColors.length === 0) return null

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
      <div className="font-semibold text-gray-700 mb-2">颜色图例:</div>
      <table className="w-full">
        <tbody>
          <tr>
            {usedColors.map((colorIndex) => (
              <td key={colorIndex} className="text-center p-2 border border-gray-300">
                <div className="flex flex-col items-center gap-1">
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      backgroundColor: colors[colorIndex],
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                    }}
                  />
                  <span className="text-xs text-gray-600 font-mono">
                    {colorIndex}
                  </span>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

const PixelGrid = ({ matrix }: { matrix: number[][] }) => {
  if (!matrix || matrix.length === 0) return null
  const height = matrix.length
  const width = matrix[0].length
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${width}, 20px)`,
        gridGap: '2px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #d9d9d9',
        padding: '4px',
        borderRadius: '4px',
      }}
    >
      {matrix.flat().map((colorIndex, idx) => (
        <div
          key={idx}
          style={{
            width: '20px',
            height: '20px',
            backgroundColor: colors[colorIndex] || 'transparent',
            border: '1px solid #fff',
            borderRadius: '2px',
          }}
        />
      ))}
    </div>
  )
}

interface Problem {
  id: number
  task_id: string
  title: string
  description: string
  difficulty: string
  test_cases: {
    train?: Array<{
      input: number[][]
      output: number[][]
    }>
  }
  created_at: string
}

const ProblemDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [problem, setProblem] = useState<Problem | null>(null)
  const [loading, setLoading] = useState(true)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [isExecuting, setIsExecuting] = useState(false)

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

  const handleRunCode = async (code: string, language: string) => {
    if (!problem) return
    
    try {
      setIsExecuting(true)
      setExecutionResult(null)
      
      const response = await api.post(`/problems/${problem.id}/execute`, {
        code,
        language
      })
      
      setExecutionResult(response.data)
      
      if (response.data.status === 'passed') {
        message.success('🎉 所有测试用例通过！')
      } else if (response.data.status === 'failed') {
        message.warning('⚠️ 部分测试用例未通过')
      } else {
        message.error('❌ 代码执行出错')
      }
    } catch (error) {
      message.error('代码执行失败，请检查网络连接')
      setExecutionResult({
        status: 'error',
        test_results: [],
        error_message: '网络请求失败'
      })
    } finally {
      setIsExecuting(false)
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

  const usedColorsInSamples = Array.from(
    new Set(
      problem.test_cases.train
        ?.slice(0, 3)
        .flatMap(tc => [...tc.input.flat(), ...tc.output.flat()]) ?? []
    )
  ).sort((a, b) => a - b)

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
          <ColorPalette usedColors={usedColorsInSamples} />
          <Collapse accordion>
            {problem.test_cases.train?.slice(0, 3).map((testCase, index) => (
              <Collapse.Panel header={`示例 ${index + 1}`} key={index}>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center justify-items-center">
                  <div className="text-center">
                    <PixelGrid matrix={testCase.input} />
                  </div>
                  <div className="text-2xl text-gray-400">
                    <RightOutlined />
                  </div>
                  <div className="text-center">
                    <PixelGrid matrix={testCase.output} />
                  </div>
                </div>
              </Collapse.Panel>
            ))}
          </Collapse>
        </Card>
      )}

      <CodeEditor
        onRunCode={handleRunCode}
        onSaveCode={(code, language) => {
          // TODO: 实现代码保存功能
          console.log('保存代码:', { code, language })
        }}
        onSubmitCode={(code, language) => {
          // TODO: 实现代码提交功能
          console.log('提交代码:', { code, language })
        }}
      />

      <CodeExecutionResult 
        result={executionResult}
        loading={isExecuting}
      />
    </div>
  )
}

export default ProblemDetail