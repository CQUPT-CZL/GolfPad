import React, { useState, useEffect } from 'react'
import { 
  Upload, 
  Button, 
  Card, 
  Progress, 
  Alert, 
  Typography, 
  Space, 
  Table, 
  Tag, 
  message,
  Divider,
  Row,
  Col,
  Statistic
} from 'antd'
import type { UploadRequestOption } from 'rc-upload/lib/interface'
import { 
  InboxOutlined, 
  UploadOutlined, 
  CheckCircleOutlined, 
  LoadingOutlined,
  FileZipOutlined,
  TrophyOutlined
} from '@ant-design/icons'
import api from '../services/api'

const { Title, Text, Paragraph } = Typography
const { Dragger } = Upload

interface BatchSubmission {
  id: number
  filename: string
  total_problems: number
  processed_problems: number
  total_score: number
  status: string
  error_message?: string
  created_at: string
  updated_at?: string
}

interface BatchStatus {
  id: number
  status: string
  processed_problems: number
  total_problems: number
  total_score: number
  error_message?: string
}

const BatchUpload: React.FC = () => {
  const [uploading, setUploading] = useState(false)
  const [currentBatch, setCurrentBatch] = useState<BatchSubmission | null>(null)
  const [batchHistory, setBatchHistory] = useState<BatchSubmission[]>([])
  const [polling, setPolling] = useState(false)

  // 获取批量提交历史
  const fetchBatchHistory = async () => {
    try {
      const response = await api.get('/batch-submissions/')
      setBatchHistory(response.data)
    } catch (error) {
      console.error('获取批量提交历史失败:', error)
    }
  }

  // 轮询批量提交状态
  const pollBatchStatus = async (batchId: number) => {
    try {
      const response = await api.get<BatchStatus>(`/batch-submissions/${batchId}/status`)
      const status = response.data
      
      if (currentBatch) {
        setCurrentBatch({
          ...currentBatch,
          status: status.status,
          processed_problems: status.processed_problems,
          total_problems: status.total_problems,
          total_score: status.total_score,
          error_message: status.error_message
        })
      }

      // 如果处理完成，停止轮询
      if (status.status === 'completed' || status.status === 'failed') {
        setPolling(false)
        fetchBatchHistory() // 刷新历史记录
        
        if (status.status === 'completed') {
          message.success(`🎉 批量提交完成！总分数: ${status.total_score}`)
        } else {
          message.error('批量提交失败')
        }
      }
    } catch (error) {
      console.error('获取批量状态失败:', error)
      setPolling(false)
    }
  }

  // 开始轮询
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    
    if (polling && currentBatch) {
      interval = setInterval(() => {
        pollBatchStatus(currentBatch.id)
      }, 2000) // 每2秒轮询一次
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [polling, currentBatch])

  // 页面加载时获取历史记录
  useEffect(() => {
    fetchBatchHistory()
  }, [])

  // 文件上传配置
  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.zip',
    beforeUpload: (file: File) => {
      const isZip = file.type === 'application/zip' || file.name.endsWith('.zip')
      if (!isZip) {
        message.error('只能上传ZIP文件！📁')
        return false
      }
      
      const isLt50M = file.size / 1024 / 1024 < 50
      if (!isLt50M) {
        message.error('文件大小不能超过50MB！')
        return false
      }
      
      return true
    },
    customRequest: async (options: UploadRequestOption) => {
      setUploading(true)
      
      const formData = new FormData()
      formData.append('file', options.file as File)
      
      try {
        const response = await api.post<BatchSubmission>('/batch-submissions/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        
        setCurrentBatch(response.data)
        setPolling(true)
        message.success('文件上传成功，开始处理...')
        options.onSuccess?.(response.data)
      } catch (error: any) {
        message.error(error.response?.data?.detail || '上传失败')
        options.onError?.(error)
      } finally {
        setUploading(false)
      }
    },
  }

  // 状态标签渲染
  const renderStatusTag = (status: string) => {
    const statusMap = {
      processing: { color: 'processing', text: '处理中', icon: <LoadingOutlined /> },
      completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
      failed: { color: 'error', text: '失败', icon: null }
    }
    
    const config = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status, icon: null }
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  // 历史记录表格列配置
  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (filename: string) => (
        <Space>
          <FileZipOutlined />
          <Text>{filename}</Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: renderStatusTag
    },
    {
      title: '进度',
      key: 'progress',
      render: (record: BatchSubmission) => (
        <div>
          <Progress 
            percent={record.total_problems > 0 ? Math.round((record.processed_problems / record.total_problems) * 100) : 0}
            size="small"
            status={record.status === 'failed' ? 'exception' : undefined}
          />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.processed_problems}/{record.total_problems} 题目
          </Text>
        </div>
      )
    },
    {
      title: '总分数',
      dataIndex: 'total_score',
      key: 'total_score',
      render: (score: number) => (
        <Space>
          <TrophyOutlined style={{ color: '#faad14' }} />
          <Text strong>{score}</Text>
        </Space>
      )
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    }
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Title level={2}>
        📦 批量提交 - Code Golf 解决方案
      </Title>
      
      <Paragraph type="secondary">
        上传包含多个Python解决方案的ZIP文件，系统将自动解压并计算每个题目的代码长度分数。
      </Paragraph>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="📤 上传ZIP文件" style={{ height: '100%' }}>
            <Dragger {...uploadProps} disabled={uploading || polling}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">
                点击或拖拽ZIP文件到此区域上传
              </p>
              <p className="ant-upload-hint">
                支持包含task001.py到task400.py格式的文件
              </p>
            </Dragger>
            
            <Divider />
            
            <Alert
              message="文件格式要求"
              description={
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>文件格式：ZIP压缩包</li>
                  <li>文件命名：task001.py, task002.py, ..., task400.py</li>
                  <li>编程语言：Python</li>
                  <li>文件大小：不超过50MB</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {currentBatch && (
            <Card title="📊 当前处理状态" style={{ height: '100%' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic 
                      title="处理进度" 
                      value={currentBatch.total_problems > 0 ? Math.round((currentBatch.processed_problems / currentBatch.total_problems) * 100) : 0}
                      suffix="%" 
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="当前分数" 
                      value={currentBatch.total_score} 
                      prefix={<TrophyOutlined />}
                    />
                  </Col>
                </Row>
                
                <Progress 
                  percent={currentBatch.total_problems > 0 ? Math.round((currentBatch.processed_problems / currentBatch.total_problems) * 100) : 0}
                  status={currentBatch.status === 'failed' ? 'exception' : currentBatch.status === 'completed' ? 'success' : 'active'}
                />
                
                <Space>
                  <Text>状态:</Text>
                  {renderStatusTag(currentBatch.status)}
                </Space>
                
                <Text type="secondary">
                  已处理 {currentBatch.processed_problems} / {currentBatch.total_problems} 个题目
                </Text>
                
                {currentBatch.error_message && (
                  <Alert
                    message="处理错误"
                    description={currentBatch.error_message}
                    type="error"
                    showIcon
                  />
                )}
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      <Card title="📋 提交历史" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={batchHistory}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: '暂无批量提交记录' }}
        />
      </Card>
    </div>
  )
}

export default BatchUpload