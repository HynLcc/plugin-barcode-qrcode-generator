# Teable Link to Attachment Converter Plugin

A [Teable](https://teable.ai) plugin for converting web links in tables to downloadable attachments.

## ✨ Features

- 🔗 **Smart Link Detection** - Automatically identify URL links in table fields
- 📎 **Attachment Conversion** - Convert links to downloadable files in Teable attachment fields
- 🎯 **Field Mapping** - Flexible selection of source link fields and target attachment fields
- 📊 **Batch Processing** - Process multiple links across multiple records at once
- 🔧 **Progress Tracking** - Real-time display of conversion progress and results
- 🎨 **Theme Support** - Complete light/dark mode compatibility with automatic theme detection
- 🌍 **Internationalization** - Full i18n support (English/Chinese)
- 📱 **Responsive Design** - Optimized for all screen sizes
- ⚡ **Performance Optimized** - Efficient data fetching with React Query
- 🛡️ **Error Handling** - Comprehensive error reporting and user feedback
- 🔌 **Teable Integration** - Seamless integration with Teable tables and fields

## 🛠️ Tech Stack

### Core Framework
- **Next.js 14.2.14** - React full-stack framework with App Router
- **React 18.2.0** - UI library with modern React features
- **TypeScript 5** - Type-safe JavaScript superset

### UI & Styling
- **Tailwind CSS 3.4.1** - Atomic CSS framework
- **@teable/ui-lib** - Teable official UI component library

### State Management
- **@tanstack/react-query 4.36.1** - Server state management and caching
- **React Context** - Client-side state management

### Teable Ecosystem
- `@teable/sdk` - Plugin bridge, UI configuration, utilities
- `@teable/openapi` - API client and type definitions
- `@teable/core` - Core type definitions and utilities

### Internationalization
- **react-i18next 14.1.0** - React internationalization framework
- **i18next 23.10.1** - Core internationalization library

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

The development server will start at http://localhost:3001

### Build for Production

```bash
npm run build
npm start
```

## 📖 Usage

1. **Select Link Field** - Choose the text field containing web links
2. **Select Attachment Field** - Choose the field to store converted attachments
3. **Start Conversion** - Click "Start Conversion" to process the links
4. **View Results** - After conversion, the attachment field will contain downloadable files

## 🔧 Configuration Options

### Field Settings
- **URL Field** - Source field containing web links
- **Attachment Field** - Target field for storing conversion results

### Conversion Options
- **Error Handling** - Whether to continue processing other links when encountering errors
- **Preserve Original Links** - Whether to save original URLs in attachment comments

## 🌐 Internationalization

The plugin supports the following languages:
- 🇺🇸 English (en)
- 🇨🇳 Simplified Chinese (zh)

Translation files are located in the `src/locales/` directory.

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
│   ├── SimpleLinkConverter.tsx  # Main converter component
│   └── ...            # Other UI components
├── hooks/              # React Hooks
├── lib/                # Utility libraries
├── locales/            # Internationalization files
├── services/           # Business logic
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔌 Teable Plugin Architecture

### URL Parameter Configuration
The plugin receives configuration via URL parameters:
- `baseId`, `pluginId`, `pluginInstallId` - Teable identifiers
- `tableId` - Target table ID
- `lang`, `theme` - Localization and theme settings

### Plugin Bridge Communication
Uses `@teable/sdk`'s `usePluginBridge()` hook for:
- Host environment communication
- Authentication via `getSelfTempToken()`
- Real-time event listening

## 🤝 Contributing

Issues and Pull Requests are welcome to improve this plugin!

## 📄 License

MIT License

## 🔗 Related Links

- [Teable Official Website](https://teable.ai)
- [Next.js Documentation](https://nextjs.org/docs)