import React from 'react'
import { Card, Alert, Tag, Collapse, Space, Divider } from 'antd'
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined
} from '@ant-design/icons'

interface TestResult {
  test_name: string
  status: 'passed' | 'failed' | 'error'
  execution_time?: number
  memory_usage?: number
  error?: string
  expected?: any
  actual?: any
}

interface ExecutionResult {
  status: 'passed' | 'failed' | 'error'
  test_results: TestResult[]
  execution_time?: number
  memory_usage?: number
  error_message?: string
}

interface CodeExecutionResultProps {
  result: ExecutionResult | null
  loading?: boolean
}

const PixelGrid = ({ matrix }: { matrix: number[][] }) => {
  if (!matrix || matrix.length === 0) return null
  
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
  
  const height = matrix.length
  const width = matrix[0].length
  
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${width}, 16px)`,
        gridGap: '1px',
        backgroundColor: '#f0f0f0',
        border: '1px solid #d9d9d9',
        padding: '4px',
        borderRadius: '4px',
        maxWidth: 'fit-content'
      }}
    >
      {matrix.flat().map((colorIndex, idx) => (
        <div
          key={idx}
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: colors[colorIndex] || 'transparent',
            border: '1px solid #fff',
            borderRadius: '1px',
          }}
        />
      ))}
    </div>
  )
}

const CodeExecutionResult: React.FC<CodeExecutionResultProps> = ({ result, loading }) => {
  if (loading) {
    return (
      <Card title="🔄 执行结果" className="shadow-sm">
        <div className="text-center py-8">
          <div className="text-blue-500 text-lg">代码执行中，请稍候...</div>
        </div>
      </Card>
    )
  }

  if (!result) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success'
      case 'failed': return 'error'
      case 'error': return 'warning'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'passed': return '✅ 通过'
      case 'failed': return '❌ 失败'
      case 'error': return '⚠️ 错误'
      default: return status
    }
  }

  return (
    <Card 
      title={
        <div className="flex items-center space-x-2">
          <span>📊 执行结果</span>
          {getStatusIcon(result.status)}
          <Tag color={getStatusColor(result.status)}>
            {getStatusText(result.status)}
          </Tag>
        </div>
      }
      className="shadow-sm"
    >
      {/* 总体状态 */}
      {result.status === 'error' && result.error_message && (
        <Alert
          message="执行错误"
          description={result.error_message}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* 执行统计 */}
      {(result.execution_time || result.memory_usage) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <Space size="large">
            {result.execution_time && (
              <div className="flex items-center space-x-1">
                <ClockCircleOutlined />
                <span>执行时间: {result.execution_time.toFixed(3)}s</span>
              </div>
            )}
            {result.memory_usage && (
              <div className="flex items-center space-x-1">
                <DatabaseOutlined />
                <span>内存使用: {result.memory_usage}MB</span>
              </div>
            )}
          </Space>
        </div>
      )}

      {/* 测试用例结果 */}
      {result.test_results && result.test_results.length > 0 && (
        <div>
          <h4 className="text-base font-semibold mb-3">测试用例结果</h4>
          <Collapse accordion>
            {result.test_results.map((testResult, index) => (
              <Collapse.Panel
                header={
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(testResult.status)}
                      <span>{testResult.test_name || `测试用例 ${index + 1}`}</span>
                      <Tag color={getStatusColor(testResult.status)}>
                        {getStatusText(testResult.status)}
                      </Tag>
                    </div>
                    {testResult.execution_time && (
                      <span className="text-xs text-gray-500">
                        {testResult.execution_time.toFixed(3)}s
                      </span>
                    )}
                  </div>
                }
                key={index}
              >
                <div className="space-y-3">
                  {/* 错误信息 */}
                  {testResult.error && (
                    <Alert
                      message="测试失败"
                      description={testResult.error}
                      type="error"
                    />
                  )}

                  {/* 输入输出对比 */}
                  {testResult.expected !== undefined && testResult.actual !== undefined && (
                    <div>
                      <div className="text-sm font-medium mb-2">输入输出对比:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-600 mb-1">期望输出:</div>
                          <div className="p-2 bg-green-50 border border-green-200 rounded">
                            {Array.isArray(testResult.expected) && Array.isArray(testResult.expected[0]) ? (
                              <PixelGrid matrix={testResult.expected} />
                            ) : (
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(testResult.expected, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600 mb-1">实际输出:</div>
                          <div className="p-2 bg-red-50 border border-red-200 rounded">
                            {Array.isArray(testResult.actual) && Array.isArray(testResult.actual[0]) ? (
                              <PixelGrid matrix={testResult.actual} />
                            ) : (
                              <pre className="text-xs whitespace-pre-wrap">
                                {JSON.stringify(testResult.actual, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 执行统计 */}
                  {(testResult.execution_time || testResult.memory_usage) && (
                    <div className="text-xs text-gray-500">
                      <Space>
                        {testResult.execution_time && (
                          <span>执行时间: {testResult.execution_time.toFixed(3)}s</span>
                        )}
                        {testResult.memory_usage && (
                          <span>内存: {testResult.memory_usage}MB</span>
                        )}
                      </Space>
                    </div>
                  )}
                </div>
              </Collapse.Panel>
            ))}
          </Collapse>
        </div>
      )}
    </Card>
  )
}

export default CodeExecutionResult