# Tenstorrent Cloud VS Code Extension

A simple VS Code extension to help Tenstorrent instance users get started with a basic hello world setup.

## 🚀 Features

- **Hello World Guide**: Interactive step-by-step guide to run your first Tenstorrent program
- **Code Examples**: Complete Python code examples with tensor operations
- **Terminal Integration**: Direct execution of Python code in VS Code terminal
- **Auto-Launch**: Opens automatically when the extension loads

## 📦 Installation

### Development Setup
1. Clone this repository
2. Open in VS Code
3. Press `F5` to run the extension in Extension Development Host
4. Test the "Tenstorrent: Hello World" command

### Production Installation
1. Package the extension: `vsce package`
2. Install the generated `.vsix` file in VS Code

## 🎯 Quick Start

1. **Open Command Palette** (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. **Search for "Tenstorrent"** to see available commands
3. **Run "Tenstorrent: Hello World"** to start with the interactive guide
4. **Follow the step-by-step instructions** in the webview
5. **Click "Run Hello World"** to execute the Python code

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `Tenstorrent: Hello World` | Interactive hello world guide with code examples |

## 📁 Project Structure

```
tt-cloud-vscode-extension/
├── README.md               # This file
└── [Your extension files]  # Your custom implementation
```

## 🎨 How It Works

### Hello World Guide
- **Interactive Webview**: Beautiful step-by-step interface
- **Code Examples**: Complete Python code with tensor operations
- **Direct Execution**: Click button to run code in VS Code terminal
- **Educational**: Learn basic Tenstorrent concepts

### Key Features
- **Simple Setup**: Just one command to remember
- **Auto-Launch**: Opens automatically on extension load
- **Code Integration**: Direct terminal execution
- **Resource Links**: Quick access to Tenstorrent documentation

## 🚀 Development

### Prerequisites
- Node.js (v16 or higher)
- TypeScript
- VS Code Extension API

### Building
```bash
npm install
npm run compile
```

### Testing
```bash
# Press F5 in VS Code to run in Extension Development Host
# Or use the Command Palette to test commands
```

### Packaging
```bash
npm install -g vsce
vsce package
```

## 📚 What's Included

The extension provides:
- **Basic Tensor Operations**: Learn fundamental tensor operations
- **Matrix Operations**: Matrix multiplication and element-wise operations
- **Code Examples**: Ready-to-run Python examples
- **Best Practices**: Code organization and development patterns

## 🎯 User Experience

1. **Extension Loads**: When VS Code starts, the extension activates
2. **Hello World Opens**: The interactive webview opens automatically
3. **Step-by-Step Guide**: Follow the instructions to run your first program
4. **Code Execution**: Click the button to run Python code in terminal
5. **Learn and Explore**: Understand Tenstorrent basics through examples

## 🔧 Configuration

The extension is designed to work out of the box with minimal configuration:
- No additional setup required
- Works with any Python environment
- Compatible with standard VS Code Python extensions

## 📖 Learning Resources

- [Tenstorrent Documentation](https://docs.tenstorrent.com)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Python Development in VS Code](https://code.visualstudio.com/docs/languages/python)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly with `F5`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check the [documentation](https://docs.tenstorrent.com)
- Open an issue on GitHub
- Join the Tenstorrent community

---

**Get started with Tenstorrent development today! 🎉**
