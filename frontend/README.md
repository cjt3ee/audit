# 银行投资风险审核系统 - 前端

这是基于 React Next.js 开发的银行投资风险审核系统前端应用。

## 功能特性

- 🏦 **客户风险评估**: 完整的客户基本信息录入和风险评估问卷
- 📊 **实时风险评分**: 基于问卷答案实时计算风险评分
- 🎯 **风险分类**: 自动将客户分类为保守型、稳健型、激进型投资者
- 🔍 **审核状态查询**: 实时查询客户审核状态和最终结果
- 📱 **响应式设计**: 支持桌面端和移动端访问
- 🎨 **美观UI**: 基于原HTML设计的现代化界面

## 技术栈

- **框架**: Next.js 14 + React 18
- **语言**: TypeScript
- **样式**: CSS Modules + 自定义CSS
- **HTTP客户端**: Axios
- **开发工具**: ESLint

## 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn

### 安装依赖

\`\`\`bash
cd frontend
npm install
\`\`\`

### 环境配置

复制环境变量模板文件：

\`\`\`bash
cp .env.local.example .env.local
\`\`\`

编辑 \`.env.local\` 配置后端API地址：

\`\`\`
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 构建生产版本

\`\`\`bash
npm run build
npm start
\`\`\`

## API集成

前端应用通过Next.js API代理集成了以下后端API：

### 1. 提交客户问卷
- **前端接口**: `POST /api/proxy?path=customer/questionnaire`
- **后端接口**: `POST /api/customer/questionnaire`
- **功能**: 提交客户基本信息和风险评估数据

### 2. 查询审核状态
- **前端接口**: `GET /api/proxy?path=customer/audit-status/{customerId}`
- **后端接口**: `GET /api/customer/audit-status/{customerId}`
- **功能**: 查询客户审核状态和最终风险类型

### CORS解决方案
为了解决跨域问题，采用了Next.js API路由代理方案：
- 创建了 `/pages/api/proxy.ts` 作为代理服务器
- 前端请求发送到Next.js代理
- 代理转发请求到后端Spring Boot服务
- 有效避免浏览器CORS限制

## 风险评分算法

基于6个维度的问卷答案计算风险评分：

1. **年龄范围** (影响权重: -10 到 +15)
2. **年收入水平** (影响权重: 0 到 +15)
3. **投资经验** (影响权重: 0 到 +15)
4. **风险承受能力** (影响权重: -10 到 +20)
5. **投资目标** (影响权重: -5 到 +15)
6. **投资期限** (影响权重: -10 到 +10)

### 风险分类

- **保守型**: 评分 < 40分
- **稳健型**: 评分 40-69分  
- **激进型**: 评分 ≥ 70分

## 项目结构

\`\`\`
frontend/
├── pages/              # Next.js页面
│   ├── _app.tsx        # 应用入口
│   └── index.tsx       # 主页面
├── styles/             # 样式文件
│   └── globals.css     # 全局样式
├── types/              # TypeScript类型定义
│   └── api.ts          # API相关类型
├── utils/              # 工具函数
│   ├── api.ts          # API调用封装
│   └── riskScoring.ts  # 风险评分算法
├── package.json        # 项目依赖
├── tsconfig.json       # TypeScript配置
├── next.config.js      # Next.js配置
└── README.md           # 项目说明
\`\`\`

## 主要组件

### CustomerPage (主页面)
- 客户基本信息表单
- 风险评估问卷
- 实时风险评分显示
- 审核状态查询

### 核心功能模块
- **表单验证**: 完整的客户信息验证
- **风险评分**: 实时计算并显示风险等级
- **API集成**: 与后端接口的完整对接
- **状态管理**: React Hooks状态管理

## 样式特性

- 🎨 渐变背景和现代化设计
- 📱 响应式布局适配移动端
- 🎯 交互式选项按钮
- 📊 动态风险评分指示器
- ✨ 平滑过渡动画效果

## 开发指南

### 添加新功能

1. 在 \`types/api.ts\` 中定义相关类型
2. 在 \`utils/api.ts\` 中添加API调用函数
3. 在页面组件中集成新功能
4. 更新样式文件

### 调试技巧

- 使用浏览器开发者工具查看网络请求
- 检查Console输出的错误信息
- 使用React Developer Tools调试组件状态

## 注意事项

1. **CORS配置**: 确保后端正确配置CORS以允许前端跨域请求
2. **API地址**: 生产环境需要更新\`.env.local\`中的API地址
3. **表单验证**: 前端验证仅作为用户体验优化，后端仍需完整验证
4. **错误处理**: 所有API调用都包含完整的错误处理逻辑

## 部署说明

### 开发环境
确保后端服务在 http://localhost:8080 运行

### 生产环境  
1. 更新环境变量中的API地址
2. 构建生产版本
3. 部署到静态托管服务或服务器

## 支持

如有问题，请检查：
1. Node.js版本是否符合要求
2. 后端API服务是否正常运行
3. 环境变量配置是否正确
4. 网络连接是否正常