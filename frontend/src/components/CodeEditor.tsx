import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Card, Button, Select, Space, message, Spin } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import Editor from '@monaco-editor/react'

interface CodeEditorProps {
  onRunCode?: (code: string, language: string) => Promise<any>
  initialCode?: string
  initialLanguage?: string
  readOnly?: boolean
}

export interface CodeEditorRef {
  updateCode: (code: string, language: string) => void
}

const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({
  onRunCode,
  initialCode = '# 在这里编写你的Python代码\n# 函数应该接收输入并返回输出\n\ndef solve(input_data):\n    # 你的代码逻辑\n    return input_data\n',
  initialLanguage = 'python',
  readOnly = false
}, ref) => {
  const [code, setCode] = useState(initialCode)
  const [language, setLanguage] = useState(initialLanguage)
  const [isRunning, setIsRunning] = useState(false)
  const editorRef = useRef<any>(null)

  // 当初始代码或语言改变时更新状态
  useEffect(() => {
    if (initialCode && initialCode !== code) {
      setCode(initialCode)
    }
  }, [initialCode])

  useEffect(() => {
    if (initialLanguage && initialLanguage !== language) {
      setLanguage(initialLanguage)
    }
  }, [initialLanguage])

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    updateCode: (newCode: string, newLanguage: string) => {
      setCode(newCode)
      setLanguage(newLanguage)
    }
  }))

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor
    
    // 设置编辑器主题和配置
    monaco.editor.defineTheme('golfpad-theme', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#fafafa',
        'editor.lineHighlightBackground': '#f0f9ff',
      }
    })
    monaco.editor.setTheme('golfpad-theme')
  }

  const handleRunCode = async () => {
    if (!onRunCode) return
    
    try {
      setIsRunning(true)
      await onRunCode(code, language)
    } catch (error) {
      message.error('代码执行失败')
    } finally {
      setIsRunning(false)
    }
  }

  const languageOptions = [
    { label: '🐍 Python', value: 'python' },
    { label: '🟨 JavaScript', value: 'javascript' },
    { label: '⚡ C++', value: 'cpp' },
    { label: '☕ Java', value: 'java' },
    { label: '🐹 Go', value: 'go' },
    { label: '🦀 Rust', value: 'rust' },
  ]

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <span>💻 代码编辑器</span>
          <Space>
            <Select
              value={language}
              onChange={setLanguage}
              options={languageOptions}
              style={{ width: 140 }}
              disabled={readOnly}
            />
          </Space>
        </div>
      }
      className="shadow-sm"
    >
      <div className="space-y-4">
        <div style={{ height: '400px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
          <Editor
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            options={{
              readOnly,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              insertSpaces: true,
              wordWrap: 'on',
              theme: 'golfpad-theme'
            }}
          />
        </div>
        
        {!readOnly && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              代码长度: {code.length} 字符
            </div>
            <Space>
              {onRunCode && (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleRunCode}
                  loading={isRunning}
                >
                  {isRunning ? '运行中...' : '运行代码'}
                </Button>
              )}
            </Space>
          </div>
        )}
      </div>
    </Card>
  )
})

export default CodeEditor