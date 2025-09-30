import React, { useEffect, useRef, useState } from 'react'

type ScorePoint = {
  problem_id: number
  title?: string
  score: number
}

interface Props {
  scores: ScorePoint[]
  width?: number // 若不传则自动适配容器宽度
  height?: number
}

// 一个零依赖的简单SVG折线图，横轴为题目ID（0-400），纵轴为分数
const ScoreLineChart: React.FC<Props> = ({ scores, width, height = 320 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      setContainerWidth(Math.max(0, Math.floor(rect.width)))
    }
    update()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => update())
      ro.observe(el)
    } else {
      window.addEventListener('resize', update)
    }
    return () => {
      if (ro) ro.disconnect()
      else window.removeEventListener('resize', update)
    }
  }, [])
  // 处理数据：按problem_id排序，并限制x轴范围在[0, 400]
  const data = (scores || [])
    .filter((s) => typeof s.problem_id === 'number' && typeof s.score === 'number')
    .map((s) => ({ x: s.problem_id, y: s.score, title: s.title }))
    .sort((a, b) => a.x - b.x)

  const svgWidth = (typeof width === 'number' ? width : (containerWidth ?? 800))
  const padding = { left: 40, right: 20, top: 20, bottom: 30 }
  const innerWidth = svgWidth - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom

  const xMin = 0
  const xMax = 400
  const yMin = 0
  const yMax = Math.max(1, ...data.map((d) => d.y))

  const xScale = (x: number) => {
    const clamped = Math.max(xMin, Math.min(xMax, x))
    return padding.left + ((clamped - xMin) / (xMax - xMin)) * innerWidth
  }

  const yScale = (y: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, y))
    // y轴从下往上
    return padding.top + innerHeight - ((clamped - yMin) / (yMax - yMin)) * innerHeight
  }

  // 生成折线path
  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`)
    .join(' ')

  // 坐标轴刻度
  const xTicks = [0, 50, 100, 150, 200, 250, 300, 350, 400]
  const yTicks = 5
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((i * yMax) / yTicks))

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg width={svgWidth} height={height}>
        {/* 背景网格 */}
        {xTicks.map((t) => (
          <line
            key={`x-grid-${t}`}
            x1={xScale(t)}
            y1={padding.top}
            x2={xScale(t)}
            y2={padding.top + innerHeight}
            stroke="#f0f0f0"
          />
        ))}
        {yTickValues.map((t) => (
          <line
            key={`y-grid-${t}`}
            x1={padding.left}
            y1={yScale(t)}
            x2={padding.left + innerWidth}
            y2={yScale(t)}
            stroke="#f0f0f0"
          />
        ))}

        {/* 坐标轴 */}
        <line
          x1={padding.left}
          y1={padding.top + innerHeight}
          x2={padding.left + innerWidth}
          y2={padding.top + innerHeight}
          stroke="#999"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + innerHeight}
          stroke="#999"
        />

        {/* x轴刻度与标签 */}
        {xTicks.map((t) => (
          <g key={`x-tick-${t}`}>
            <line
              x1={xScale(t)}
              y1={padding.top + innerHeight}
              x2={xScale(t)}
              y2={padding.top + innerHeight + 5}
              stroke="#999"
            />
            <text
              x={xScale(t)}
              y={padding.top + innerHeight + 20}
              fontSize={12}
              textAnchor="middle"
              fill="#666"
            >
              {t}
            </text>
          </g>
        ))}

        {/* y轴刻度与标签 */}
        {yTickValues.map((t) => (
          <g key={`y-tick-${t}`}>
            <line
              x1={padding.left - 5}
              y1={yScale(t)}
              x2={padding.left}
              y2={yScale(t)}
              stroke="#999"
            />
            <text
              x={padding.left - 8}
              y={yScale(t) + 4}
              fontSize={12}
              textAnchor="end"
              fill="#666"
            >
              {t}
            </text>
          </g>
        ))}

        {/* 折线 */}
        <path d={pathD} fill="none" stroke="#1890ff" strokeWidth={2} />

        {/* 数据点 */}
        {data.map((d, i) => (
          <g key={`dot-${i}`}>
            <circle cx={xScale(d.x)} cy={yScale(d.y)} r={3} fill="#1890ff" />
            {/* 点提示：标题与分数 */}
            {d.title && (
              <title>{`${d.title} | 分数: ${d.y.toFixed(3)} | 题ID: ${d.x}`}</title>
            )}
          </g>
        ))}

        {/* 轴标题 */}
        <text
          x={padding.left + innerWidth / 2}
          y={height - 5}
          fontSize={12}
          textAnchor="middle"
          fill="#666"
        >
          题目ID（0-400）
        </text>
        <text
          x={15}
          y={padding.top + innerHeight / 2}
          fontSize={12}
          textAnchor="middle"
          transform={`rotate(-90 15 ${padding.top + innerHeight / 2})`}
          fill="#666"
        >
          分数
        </text>
      </svg>
    </div>
  )
}

export default ScoreLineChart