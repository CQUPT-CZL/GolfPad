import React, { useState, useEffect } from 'react'
import { Card, List, Tag, Button, Spin, message, Modal, Typography, Space, Tooltip } from 'antd'
import { 
  HistoryOutlined, 
  CodeOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  CopyOutlined
} from '@ant-design/icons'
import api from '../services/api'

const { Text, Paragraph } = Typography

interface Submission {
  id: number
  user_id: number
  username: string  // 添加用户名字段
  language: string
  code: string
  code_length: number
  status: string
  result?: any
  execution_time?: number
  memory_usage?: number
  created_at: string
}

interface SubmissionHistoryProps {
  problemId: number
  onLoadCode?: (code: string, language: string) => void
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({ 
  problemId, 
  onLoadCode 
}) => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [codeModalVisible, setCodeModalVisible] = useState(false)

  useEffect(() => {
    fetchSubmissions()
  }, [problemId])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      // 使用公开的API获取所有人的提交记录
      const response = await api.get(`/problems/${problemId}/submissions?limit=20`)
      setSubmissions(response.data)
    } catch (error) {
      console.error('获取提交记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      case 'pending':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />
      default:
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'passed':
        return '通过'
      case 'failed':
        return '失败'
      case 'pending':
        return '评测中'
      default:
        return '错误'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'success'
      case 'failed':
        return 'error'
      case 'pending':
        return 'processing'
      default:
        return 'error'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewCode = (submission: Submission) => {
    setSelectedSubmission(submission)
    setCodeModalVisible(true)
  }

  const handleLoadCode = (submission: Submission) => {
    if (onLoadCode) {
      onLoadCode(submission.code, submission.language)
      message.success('代码已加载到编辑器 📝')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('代码已复制到剪贴板 📋')
    }).catch(() => {
      message.error('复制失败')
    })
  }

  if (submissions.length === 0 && !loading) {
    return (
      <Card 
        title={
          <Space>
            <HistoryOutlined />
            <span>提交历史</span>
          </Space>
        }
        className="shadow-sm"
      >
        <div className="text-center py-8 text-gray-500">
          <HistoryOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
          <div>暂无提交记录</div>
          <div className="text-sm mt-2">完成第一次提交后，历史记录将显示在这里</div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card 
        title={
          <Space>
            <HistoryOutlined />
            <span>所有提交记录</span>
            <Tag color="blue">{submissions.length} 次提交</Tag>
          </Space>
        }
        className="shadow-sm"
      >
        <Spin spinning={loading}>
          <List
            dataSource={submissions}
            renderItem={(submission, index) => (
              <List.Item
                key={submission.id}
                actions={[
                  <Tooltip title="查看代码">
                    <Button 
                      type="text" 
                      icon={<EyeOutlined />}
                      onClick={() => handleViewCode(submission)}
                    />
                  </Tooltip>,
                  <Tooltip title="加载到编辑器">
                    <Button 
                      type="text" 
                      icon={<CodeOutlined />}
                      onClick={() => handleLoadCode(submission)}
                    />
                  </Tooltip>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        #{submissions.length - index}
                      </span>
                    </div>
                  }
                  title={
                    <Space>
                      {getStatusIcon(submission.status)}
                      <Tag color={getStatusColor(submission.status)}>
                        {getStatusText(submission.status)}
                      </Tag>
                      <Tag color="blue">{submission.username}</Tag>
                      <Tag>{submission.language}</Tag>
                      <Text type="secondary">{submission.code_length} 字符</Text>
                      {submission.execution_time && (
                        <Text type="secondary">
                          {submission.execution_time.toFixed(2)}ms
                        </Text>
                      )}
                    </Space>
                  }
                  description={
                    <Text type="secondary">
                      {formatDate(submission.created_at)}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </Spin>
      </Card>

      <Modal
        title={
          <Space>
            <CodeOutlined />
            <span>代码详情</span>
            {selectedSubmission && (
              <>
                <Tag color={getStatusColor(selectedSubmission.status)}>
                  {getStatusText(selectedSubmission.status)}
                </Tag>
                <Tag>{selectedSubmission.language}</Tag>
              </>
            )}
          </Space>
        }
        open={codeModalVisible}
        onCancel={() => setCodeModalVisible(false)}
        width={800}
        footer={[
          <Button key="copy" onClick={() => selectedSubmission && copyToClipboard(selectedSubmission.code)}>
            <CopyOutlined /> 复制代码
          </Button>,
          <Button 
            key="load" 
            type="primary" 
            onClick={() => {
              if (selectedSubmission) {
                handleLoadCode(selectedSubmission)
                setCodeModalVisible(false)
              }
            }}
          >
            <CodeOutlined /> 加载到编辑器
          </Button>,
          <Button key="close" onClick={() => setCodeModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        {selectedSubmission && (
          <div>
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <Space direction="vertical" size="small">
                <div>
                  <Text strong>提交时间：</Text>
                  <Text>{formatDate(selectedSubmission.created_at)}</Text>
                </div>
                <div>
                  <Text strong>代码长度：</Text>
                  <Text>{selectedSubmission.code_length} 字符</Text>
                </div>
                {selectedSubmission.execution_time && (
                  <div>
                    <Text strong>执行时间：</Text>
                    <Text>{selectedSubmission.execution_time.toFixed(2)}ms</Text>
                  </div>
                )}
                {selectedSubmission.memory_usage && (
                  <div>
                    <Text strong>内存使用：</Text>
                    <Text>{selectedSubmission.memory_usage}KB</Text>
                  </div>
                )}
              </Space>
            </div>
            
            <Paragraph>
              <Text strong>代码内容：</Text>
            </Paragraph>
            <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
              <pre>{selectedSubmission.code}</pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default SubmissionHistory