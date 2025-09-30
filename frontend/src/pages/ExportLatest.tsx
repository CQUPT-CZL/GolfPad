import React, { useState } from 'react'
import { Card, Button, Typography, Space, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import api from '../services/api'

const { Title, Paragraph } = Typography

const ExportLatest: React.FC = () => {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await api.get('/submissions/export/latest', { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/zip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'submission.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      message.success('导出成功，已开始下载 submission.zip')
    } catch (err: any) {
      if (err?.response?.status === 404) {
        message.warning('没有可导出的提交记录')
      } else if (err?.response?.status === 401) {
        message.error('请先登录后再导出')
      } else {
        message.error('导出失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Title level={3} style={{ marginBottom: 0 }}>导出最新提交</Title>
        <Paragraph>
          从题库 1 到 400，打包你每道题的最新一次提交为 <code>submission.zip</code>。
          未提交的题目不会包含在压缩包中。
        </Paragraph>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} loading={loading}>
          导出最新提交 ZIP
        </Button>
      </Space>
    </Card>
  )
}

export default ExportLatest