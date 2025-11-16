# Teable 条形码生成器插件

一个强大的 [Teable](https://teable.ai) 插件，用于从表格数据生成条形码并保存为可下载的附件。

## ✨ 功能特性

- 📊 **多种条形码格式** - 支持 20+ 种条形码格式，包括 CODE128、EAN、UPC、CODE39、ITF、MSI 等
- 🎨 **可自定义外观** - 完全控制宽度、高度、颜色、边距和文本显示
- 📝 **文本自定义** - 自定义条形码文本的字体、大小、样式、位置和对齐方式
- 🔄 **批量生成** - 一次性为多条记录生成条形码
- 👁️ **实时预览** - 生成前实时预览条形码外观
- 🎯 **字段映射** - 灵活选择源数据字段和目标附件字段
- 📈 **进度跟踪** - 实时显示生成进度和统计信息
- 🎨 **主题支持** - 完整的明暗模式兼容，自动主题检测
- 🌍 **国际化** - 完整的 i18n 支持（英文/中文）
- 📱 **响应式设计** - 针对所有屏幕尺寸优化
- ⚡ **性能优化** - 使用 React Query 实现高效数据处理
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

### 条形码生成
- **jsbarcode 3.12.1** - JavaScript条形码生成库

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

1. **选择视图** - 选择包含要处理记录的视图
2. **选择数据源字段** - 选择包含条形码生成数据的字段（文本或数字字段）
3. **选择附件字段** - 选择用于存储生成条形码的附件字段
4. **配置条形码** - 自定义条形码格式、外观和文本设置
5. **预览** - 实时预览条形码外观
6. **生成** - 点击"生成条形码"按钮处理所有记录
7. **查看结果** - 生成的条形码以图片形式保存在附件字段中

## 🔧 配置选项

### 基本设置

- **条形码类型** - 从 20+ 种条形码格式中选择：
  - CODE128 系列（CODE128、CODE128A、CODE128B、CODE128C）
  - EAN 系列（EAN-13、EAN-8、EAN-5、EAN-2）
  - UPC 系列（UPC-A、UPC-E）
  - CODE39
  - ITF 系列（ITF、ITF-14）
  - MSI 系列（MSI、MSI10、MSI11、MSI1010、MSI1110）
  - Pharmacode
  - Codabar
- **文件格式** - PNG 或 SVG 输出格式
- **GS1-128** - 为 CODE128 系列启用 GS1-128 编码
- **紧凑格式** - 为 EAN/UPC 系列启用扁平编码

### 外观设置

- **宽度** - 条形码线条宽度（1-10px）
- **高度** - 条形码高度（50-200px）
- **条形码颜色** - 自定义条形码线条颜色
- **背景色** - 自定义背景颜色

### 文字设置

- **显示文字** - 切换条形码下方/上方文本显示
- **自定义文本** - 覆盖默认文本（留空则使用条形码数据）
- **字体** - 从多种字体族中选择
- **字体样式** - 默认、粗体、斜体或粗斜体
- **字体大小** - 可调整（10-40px）
- **文本位置** - 上方或下方
- **文本对齐** - 左对齐、居中或右对齐
- **文本边距** - 条形码与文本之间的间距（0-20px）

### 边距设置

- **统一边距** - 一次性设置所有边距（0-50px）
- **单独边距** - 分别自定义上、下、左、右边距

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
│   ├── BarcodeGenerator.tsx  # 主条形码生成器组件
│   └── ...            # 其他UI组件
├── hooks/              # React Hooks
├── lib/                # 工具库
├── locales/            # 国际化文件
├── types/              # TypeScript类型定义
└── utils/              # 工具函数
    └── barcodeGenerator.ts  # 条形码生成逻辑
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

## 🎯 支持的条形码格式

### CODE128 系列
- **CODE128** - 通用格式，支持完整ASCII字符
- **CODE128A** - 大写字母、数字和控制字符
- **CODE128B** - 大小写字母和数字
- **CODE128C** - 仅数字（压缩格式）

### EAN 系列
- **EAN-13** - 13位欧洲商品编码
- **EAN-8** - 8位欧洲商品编码
- **EAN-5** - 5位补充码
- **EAN-2** - 2位补充码

### UPC 系列
- **UPC-A** - 12位通用产品代码
- **UPC-E** - 6位压缩UPC

### 其他格式
- **CODE39** - 字母数字条形码
- **ITF** - 交叉二五码
- **ITF-14** - 14位ITF
- **MSI** - 修改的Plessey变体
- **Pharmacode** - 药品二进制码
- **Codabar** - 自检条形码

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个插件！

## 📄 许可证

MIT License

## 🔗 相关链接

- [Teable 官网](https://teable.ai)
- [Next.js 文档](https://nextjs.org/docs)
- [JsBarcode 文档](https://github.com/lindell/JsBarcode)
