# Teable Barcode Generator Plugin

A powerful [Teable](https://teable.ai) plugin for generating barcodes from table data and saving them as downloadable attachments.

## ✨ Features

- 📊 **Multiple Barcode Formats** - Support for 20+ barcode formats including CODE128, EAN, UPC, CODE39, ITF, MSI, and more
- 🎨 **Customizable Appearance** - Full control over width, height, colors, margins, and text display
- 📝 **Text Customization** - Customize font, size, style, position, and alignment of barcode text
- 🔄 **Batch Generation** - Generate barcodes for multiple records at once
- 👁️ **Live Preview** - Real-time preview of barcode appearance before generation
- 🎯 **Field Mapping** - Flexible selection of source data fields and target attachment fields
- 📈 **Progress Tracking** - Real-time display of generation progress and statistics
- 🎨 **Theme Support** - Complete light/dark mode compatibility with automatic theme detection
- 🌍 **Internationalization** - Full i18n support (English/Chinese)
- 📱 **Responsive Design** - Optimized for all screen sizes
- ⚡ **Performance Optimized** - Efficient data processing with React Query
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

### Barcode Generation
- **jsbarcode 3.12.1** - JavaScript barcode generation library

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

1. **Select View** - Choose the view containing records to process
2. **Select Data Source Field** - Choose the field containing data for barcode generation (text or number field)
3. **Select Attachment Field** - Choose the attachment field to store generated barcodes
4. **Configure Barcode** - Customize barcode format, appearance, and text settings
5. **Preview** - Review the barcode appearance in real-time
6. **Generate** - Click "Generate Barcode" to process all records
7. **View Results** - Generated barcodes are saved as images in the attachment field

## 🔧 Configuration Options

### Basic Settings

- **Barcode Type** - Choose from 20+ barcode formats:
  - CODE128 series (CODE128, CODE128A, CODE128B, CODE128C)
  - EAN series (EAN-13, EAN-8, EAN-5, EAN-2)
  - UPC series (UPC-A, UPC-E)
  - CODE39
  - ITF series (ITF, ITF-14)
  - MSI series (MSI, MSI10, MSI11, MSI1010, MSI1110)
  - Pharmacode
  - Codabar
- **File Format** - PNG or SVG output format
- **GS1-128** - Enable GS1-128 encoding for CODE128 series
- **Compact Format** - Enable flat encoding for EAN/UPC series

### Appearance Settings

- **Width** - Barcode line width (1-10px)
- **Height** - Barcode height (50-200px)
- **Barcode Color** - Customize barcode line color
- **Background Color** - Customize background color

### Text Settings

- **Display Text** - Toggle text display below/above barcode
- **Custom Text** - Override default text (leave empty to use barcode data)
- **Font** - Choose from multiple font families
- **Font Style** - Default, Bold, Italic, or Bold Italic
- **Font Size** - Adjustable from 10-40px
- **Text Position** - Top or Bottom
- **Text Alignment** - Left, Center, or Right
- **Text Margin** - Spacing between barcode and text (0-20px)

### Margin Settings

- **Uniform Margin** - Set all margins at once (0-50px)
- **Individual Margins** - Customize top, bottom, left, and right margins separately

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
│   ├── SimpleLinkConverter.tsx  # Main barcode generator component
│   └── ...            # Other UI components
├── hooks/              # React Hooks
├── lib/                # Utility libraries
├── locales/            # Internationalization files
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
    └── barcodeGenerator.ts  # Barcode generation logic
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

## 🎯 Supported Barcode Formats

### CODE128 Series
- **CODE128** - General purpose, supports full ASCII
- **CODE128A** - Uppercase letters, numbers, and control characters
- **CODE128B** - Uppercase and lowercase letters, numbers
- **CODE128C** - Numbers only (compressed)

### EAN Series
- **EAN-13** - 13-digit European Article Number
- **EAN-8** - 8-digit European Article Number
- **EAN-5** - 5-digit supplement
- **EAN-2** - 2-digit supplement

### UPC Series
- **UPC-A** - 12-digit Universal Product Code
- **UPC-E** - 6-digit compressed UPC

### Other Formats
- **CODE39** - Alphanumeric barcode
- **ITF** - Interleaved 2 of 5
- **ITF-14** - 14-digit ITF
- **MSI** - Modified Plessey variants
- **Pharmacode** - Pharmaceutical binary code
- **Codabar** - Self-checking barcode

## 🤝 Contributing

Issues and Pull Requests are welcome to improve this plugin!

## 📄 License

MIT License

## 🔗 Related Links

- [Teable Official Website](https://teable.ai)
- [Next.js Documentation](https://nextjs.org/docs)
- [JsBarcode Documentation](https://github.com/lindell/JsBarcode)
