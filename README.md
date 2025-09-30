# 🏌️‍♂️ GolfPad - Google Code Golf 2025 竞赛平台

一个专为 Google Code Golf 2025 竞赛设计的综合性Web平台，提供题目浏览、代码提交、实时评测和排行榜功能。

## ✨ 功能特性

- 📚 **题目管理**: 400道Google Code Golf题目，支持搜索和筛选
- 👤 **用户系统**: 完整的注册、登录和认证功能
- 🏆 **多维排行榜**: 全局排行榜、单题排行榜、分语言排行榜
- 📊 **个人中心**: 详细的统计数据和提交历史
- ⚡ **代码评测**: 支持Python、JavaScript、C++、Java、Go、Rust等多种语言
- 🎨 **现代化UI**: 基于Ant Design的响应式界面设计

## 🏗️ 技术架构

### 后端
- **框架**: FastAPI
- **数据库**: SQLite
- **认证**: JWT Token
- **代码评测**: 多语言沙箱执行环境

### 前端
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design
- **构建工具**: Vite
- **状态管理**: React Context + Hooks

## 🚀 快速启动

### 环境要求

- Python 3.13+
- Node.js 18+
- uv (Python包管理器)
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <repository-url>
cd GolfPad
```

### 2. 启动后端服务

```bash
# 安装Python依赖
uv sync

# 启动后端服务器
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

后端服务将在 http://localhost:8000 启动

- API文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/api/health

### 3. 启动前端服务

打开新的终端窗口：

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务将在 http://localhost:3000 启动（如果端口被占用会自动切换到3001）

### 4. 访问应用

打开浏览器访问 http://localhost:3000 开始使用！

## 📁 项目结构

```
GolfPad/
├── backend/                 # 后端代码
│   ├── main.py             # FastAPI应用入口
│   ├── database.py         # 数据库配置
│   ├── models.py           # 数据库模型
│   ├── schemas.py          # Pydantic模式
│   ├── evaluation.py       # 代码评测系统
│   └── routers/            # API路由
│       ├── users.py        # 用户相关API
│       ├── problems.py     # 题目相关API
│       ├── submissions.py  # 提交相关API
│       └── leaderboard.py  # 排行榜API
├── frontend/               # 前端代码
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── contexts/       # React Context
│   │   └── services/       # API服务
│   ├── package.json        # 前端依赖配置
│   └── vite.config.ts      # Vite配置
├── google-code-golf-2025/  # 题目数据文件
├── golfpad.db              # SQLite数据库文件
├── pyproject.toml          # Python项目配置
└── README.md               # 项目文档
```

## 🎯 使用指南

### 注册和登录
1. 访问平台首页
2. 点击右上角"注册"按钮创建账号
3. 使用用户名和密码登录

### 浏览题目
1. 在首页查看所有题目列表
2. 使用搜索框按标题或编号搜索
3. 使用难度筛选器过滤题目
4. 点击题目卡片查看详细信息

### 查看排行榜
1. 点击导航栏"排行榜"
2. 查看全局排行榜、题目排行榜或语言排行榜
3. 了解自己的排名和其他用户的成绩

### 个人中心
1. 登录后点击右上角用户名
2. 查看个人统计数据
3. 浏览提交历史记录

## 🔧 开发指南

### 后端开发

```bash
# 安装开发依赖
uv sync

# 运行测试
uv run pytest

# 代码格式化
uv run black backend/

# 类型检查
uv run mypy backend/
```

### 前端开发

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

### 数据库管理

```bash
# 查看数据库中的题目数量
uv run python -c "
from backend.database import SessionLocal
from backend.models import Problem
db = SessionLocal()
print(f'数据库包含 {db.query(Problem).count()} 道题目')
db.close()
"
```

## 🐛 故障排除

### 后端启动失败
- 检查Python版本是否为3.13+
- 确保已安装uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- 检查端口8000是否被占用

### 前端启动失败
- 检查Node.js版本是否为18+
- 删除node_modules重新安装: `rm -rf node_modules && npm install`
- 检查端口3000是否被占用

### 数据库问题
- 如果数据库文件损坏，删除golfpad.db文件重新启动后端
- 题目数据会自动从google-code-golf-2025目录加载

## 📝 API文档

启动后端服务后，访问 http://localhost:8000/docs 查看完整的API文档。

主要API端点：
- `GET /api/problems` - 获取题目列表
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `POST /api/submissions` - 提交代码
- `GET /api/leaderboard/global` - 全局排行榜

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- Google Code Golf 2025 竞赛提供题目数据
- Ant Design 提供优秀的UI组件库
- FastAPI 提供高性能的Web框架

---

🏌️‍♂️ **Happy Code Golfing!** 享受代码高尔夫的乐趣吧！