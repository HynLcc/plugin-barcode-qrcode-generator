# Teable 链接转附件插件

一个 [Teable](https://teable.ai) 插件，用于将表格中的网络链接转换为可下载的附件。

## ✨ 功能特性

- 🔗 **智能链接检测** - 自动识别表格中的URL链接
- 📎 **附件转换** - 将链接转换为Teable附件字段中的可下载文件
- 🎯 **字段映射** - 灵活的源链接字段和目标附件字段选择
- 📊 **批量处理** - 一次性处理多条记录中的多个链接
- 🔧 **进度跟踪** - 实时显示转换进度和结果
- 🎨 **主题支持** - 完整的明暗模式兼容，自动主题检测
- 🌍 **国际化** - 完整的 i18n 支持（英文/中文）
- 📱 **响应式设计** - 针对所有屏幕尺寸优化
- ⚡ **性能优化** - 使用 React Query 实现高效数据获取
- 🛡️ **错误处理** - 全面的错误报告和用户反馈
- 🔌 **Teable 集成** - 与 Teable 表格和字段的无缝集成

## 🛠️ 技术栈

### 核心框架
- **Next.js 14.2.14** - React全栈框架，使用App Router
- **React 18.2.0** - 用户界面库，支持现代React特性
- **TypeScript 5** - 类型安全的JavaScript超集

### UI与样式
- **Tailwind CSS 3.4.1** - 原子化CSS框架
- **@teable/ui-lib** - Teable官方UI组件库

### 状态管理
- **@tanstack/react-query 4.36.1** - 服务器状态管理和缓存
- **React Context** - 客户端状态管理

### Teable生态系统
- `@teable/sdk` - 插件桥接、UI配置、工具
- `@teable/openapi` - API客户端和类型定义
- `@teable/core` - 核心类型定义和工具

### 国际化
- **react-i18next 14.1.0** - React国际化框架
- **i18next 23.10.1** - 核心国际化库

## 🚀 快速开始

### 开发环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

开发服务器将在 http://localhost:3001 启动

### 构建生产版本

```bash
npm run build
npm start
```

## 📖 使用说明

1. **选择链接字段** - 选择包含网络链接的文本字段
2. **选择附件字段** - 选择用于存储转换后附件的字段
3. **开始转换** - 点击"开始转换"按钮处理链接
4. **查看结果** - 转换完成后，附件字段中将包含可下载的文件

## 🔧 配置选项

### 字段设置
- **URL字段** - 包含网络链接的源字段
- **附件字段** - 存储转换结果的目标字段

### 转换选项
- **错误处理** - 遇到错误时是否继续处理其他链接
- **原始链接保留** - 是否在附件备注中保存原始URL

## 🌐 国际化

插件支持以下语言：
- 🇺🇸 English (en)
- 🇨🇳 简体中文 (zh)

翻译文件位于 `src/locales/` 目录中。

## 📁 项目结构

```
src/
├── app/                 # Next.js App Router
├── components/          # React组件
│   ├── SimpleLinkConverter.tsx  # 主转换器组件
│   └── ...            # 其他UI组件
├── hooks/              # React Hooks
├── lib/                # 工具库
├── locales/            # 国际化文件
├── services/           # 业务逻辑
├── types/              # TypeScript类型定义
└── utils/              # 工具函数
```

## 🔌 Teable插件架构

### URL参数配置
插件通过URL参数接收配置：
- `baseId`, `pluginId`, `pluginInstallId` - Teable标识符
- `tableId` - 目标表格ID
- `lang`, `theme` - 本地化和主题设置

### 插件桥接通信
使用 `@teable/sdk` 的 `usePluginBridge()` hook进行：
- 主环境通信
- 通过 `getSelfTempToken()` 进行身份验证
- 实时事件监听

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个插件！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Teable 官网](https://teable.ai)
- [Next.js 文档](https://nextjs.org/docs)