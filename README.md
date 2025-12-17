# Tenstorrent Developer Extension

**Comprehensive walkthrough for building AI applications on Tenstorrent hardware** - from hardware detection to production deployment.

<p align="center">
  <img src="https://img.shields.io/badge/lessons-13-orange" alt="13 Lessons">
  <img src="https://img.shields.io/badge/platform-Linux-blue" alt="Linux">
  <img src="https://img.shields.io/badge/hardware-Wormhole%20%7C%20Blackhole-green" alt="Hardware">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="MIT License">
</p>

---

## 🎯 What is This?

An interactive VSCode extension that guides you through **14 comprehensive lessons** to master Tenstorrent hardware and AI deployment. Learn by doing - from detecting hardware to deploying production LLM servers.

**Perfect for:**
- ✅ Developers new to Tenstorrent hardware
- ✅ AI engineers deploying models on TT accelerators
- ✅ Teams building production inference pipelines
- ✅ Contributors to the Tenstorrent ecosystem

---

## 🚀 Quick Start

### Installation

1. **Clone this repository:**
   ```bash
   git clone https://github.com/tenstorrent/tt-vscode-extension.git
   cd tt-vscode-extension
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   - Open in VSCode
   - Press `F5` to launch Extension Development Host
   - The welcome page opens automatically

### Or Install from .vsix

```bash
npm run package
code --install-extension tenstorrent-developer-extension-0.0.78.vsix
```

---

## 📚 What You'll Learn

### 🔧 **Fundamentals (Lessons 1-3)**
Master the basics of Tenstorrent hardware and setup.

- **Lesson 1: Hardware Detection** - Detect and verify TT hardware with `tt-smi`
- **Lesson 2: Verify Installation** - Test your tt-metal setup
- **Lesson 3: Download Models** - Get models from HuggingFace

### 💻 **Application Development (Lessons 4-9)**
Build real applications with increasing sophistication.

- **Lesson 4: Interactive Chat** - CLI chat application with Generator API
- **Lesson 5: API Server** - Flask HTTP server for model serving
- **Lesson 6: vLLM Production** - Production-grade inference with OpenAI-compatible API
- **Lesson 7: VSCode Chat** - `@tenstorrent` chat participant integration
- **Lesson 8: Image Generation** - Stable Diffusion 3.5 Large on TT hardware
- **Lesson 9: Coding Assistant** - AI coding assistant with prompt engineering

### ⚙️ **Advanced Topics (Lessons 10-14)**
Explore compilers, frameworks, and contribution opportunities.

- **Lesson 10: TT-Forge** - MLIR-based compiler for PyTorch models
- **Lesson 11: TT-XLA** - Production-ready JAX compiler with PJRT integration
- **Lesson 12: Bounty Program** - Contribute models and earn rewards
- **Lesson 13: Exploring TT-Metalium** - TTNN tutorials and model zoo
- **Lesson 14: TT-Metalium Cookbook** - 4 complete projects (Game of Life, Audio, Fractals, Filters)

---

## 🌟 Key Features

### **Interactive Learning**
- ✅ Click-to-run commands from lessons
- ✅ Built-in terminal integration
- ✅ Step-by-step progression with completion tracking
- ✅ Visual feedback and validation

### **Production-Ready Code**
- ✅ Real templates you can customize
- ✅ Best practices from the Tenstorrent team
- ✅ Copy-paste ready examples
- ✅ Scripts saved to `~/tt-scratchpad/`

### **Hardware-Aware**
- ✅ Auto-detects your device (N150, N300, T3K, P100, P150)
- ✅ Provides hardware-specific guidance
- ✅ Real-time device monitoring in statusbar
- ✅ Configuration tuned for your device

### **Multi-Framework Support**
- ✅ **vLLM** - Production LLM serving
- ✅ **TT-Forge** - PyTorch MLIR compiler
- ✅ **TT-XLA** - JAX and PyTorch/XLA support
- ✅ **TT-Metal** - Low-level kernel development

---

## 🎓 Learning Path

### Beginner Path (First-time users)
```
1. Hardware Detection    (5 min) → Verify your setup
2. Verify Installation   (5 min) → Test tt-metal works
3. Download Model        (30 min) → Get Llama-3.1-8B
6. vLLM Production       (20 min) → Production server
7. VSCode Chat           (10 min) → Chat in VSCode
```

### Intermediate Path (Experienced developers)
```
1. Hardware Detection     (verify only)
6. vLLM Production       (production serving)
10. TT-Forge             (PyTorch compilation)
14. TT-Metalium Cookbook (custom projects)
```

### Advanced Path (Contributors)
```
11. TT-XLA               (JAX production compiler)
12. Bounty Program       (model bring-up)
13. Exploring Metalium   (TTNN tutorials)
14. Metalium Cookbook    (low-level projects)
```

**Total time to complete:** 4-6 hours (depending on download speeds and depth of exploration)

---

## 🛠️ Prerequisites

### Hardware Requirements
- **Tenstorrent accelerator:** N150, N300, T3K (Wormhole) or P100, P150 (Blackhole)
- **RAM:** 32GB+ recommended (16GB minimum)
- **Disk space:** 100GB+ free
- **Network:** Fast connection (will download ~20-40GB models)

### Software Requirements
- **OS:** Linux (Ubuntu 20.04+, RHEL 8+, or compatible)
- **Python:** 3.10+ (3.11 for TT-Forge)
- **Node.js:** v16+ (for extension development)
- **tt-metal:** Installed and working
- **VSCode:** 1.80+

### Quick Check
```bash
# Hardware detected?
tt-smi

# Python version OK?
python3 --version

# tt-metal working?
python3 -c "import ttnn; print('✓ Ready')"
```

---

## 📖 Documentation

- **[FAQ.md](FAQ.md)** - Comprehensive FAQ with troubleshooting
- **[CLAUDE.md](CLAUDE.md)** - Technical implementation details
- **[DOCUMENTATION_REVIEW.md](DOCUMENTATION_REVIEW.md)** - Style guide and quality review
- **Lesson files** - `content/lessons/*.md` (editable by technical writers)

### External Resources
- [Tenstorrent Documentation](https://docs.tenstorrent.com)
- [tt-metal GitHub](https://github.com/tenstorrent/tt-metal)
- [vLLM for TT](https://github.com/tenstorrent/vllm)
- [TT-Forge](https://github.com/tenstorrent/tt-forge)
- [Discord Community](https://discord.gg/tenstorrent)

---

## 🏗️ Architecture

### Extension Structure

```
tt-vscode-extension/
├── content/
│   ├── lessons/          # 13 markdown lesson files
│   ├── templates/        # Python script templates
│   └── welcome/          # Welcome page HTML
├── src/
│   ├── extension.ts      # Main extension logic
│   └── commands/         # Terminal command definitions
├── package.json          # Extension manifest
├── FAQ.md                # Comprehensive FAQ
└── README.md             # This file
```

### Generated Files (User System)

The extension creates files in your home directory:

```
~/tt-scratchpad/          # All generated scripts
├── tt-chat-direct.py
├── tt-api-server-direct.py
├── tt-forge-classifier.py
├── start-vllm-server.py
└── ...

~/models/                 # Downloaded models
└── Llama-3.1-8B-Instruct/

~/tt-vllm/               # vLLM repository
~/tt-metal/              # TT-Metal repository
```

### Design Principles

- **Content-first:** Lessons are markdown files - easy for technical writers to edit
- **No custom UI:** Uses VSCode's native Walkthroughs API
- **Terminal-integrated:** Commands run in persistent terminal
- **Stateless commands:** Each command can run independently
- **Hardware-aware:** Detects your device and adjusts instructions

---

## 🧪 Testing

The extension includes automated tests for template validation and quality assurance.

### Running Tests

```bash
# Run all tests
npm test

# Run only template validation tests
npm run test:templates

# Watch mode (re-run on changes)
npm run test:watch
```

### What Gets Tested

✅ **Template Validation** (Quick - runs in seconds)
- Python syntax validation for all script templates
- Import statement verification
- Code structure validation
- Python 3 compatibility checks

✅ **File Structure**
- All templates exist and are non-empty
- Documentation/comments present
- Proper file structure

### Test Files

```
test/
├── .mocharc.json          # Mocha configuration
└── lesson-tests/
    └── templates.test.ts  # Template validation suite
```

### CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-publish builds

### Testing with ttsim (Hardware Simulation)

For testing without physical hardware, see [TESTING_WITH_TTSIM.md](TESTING_WITH_TTSIM.md):
- How to set up ttsim simulator
- Testing basic TTNN operations
- Testing programming examples
- CI/CD integration strategies

**Note:** Template validation tests run on any platform (no hardware required). Full integration tests with ttsim require Linux/x86_64.

---

## 🤝 Contributing

We welcome contributions! Here's how:

### Report Issues
- Use the [GitHub issue tracker](https://github.com/tenstorrent/tt-vscode-extension/issues)
- Include hardware type, OS, and error messages
- Check [FAQ.md](FAQ.md) first

### Improve Documentation
- Lessons are in `content/lessons/*.md`
- Follow [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/)
- See [DOCUMENTATION_REVIEW.md](DOCUMENTATION_REVIEW.md) for standards

### Add Features
1. Fork the repository
2. Create a feature branch
3. Test thoroughly (`F5` in VSCode)
4. Update documentation
5. Submit a pull request

### Join the Bounty Program
- See **Lesson 12** for model bring-up opportunities
- Contribute to the ecosystem
- Earn rewards

---

## 🐛 Troubleshooting

### Common Issues

**"No hardware detected"**
```bash
# Try:
tt-smi -r
sudo tt-smi
# See FAQ.md for full diagnostic steps
```

**"ImportError: undefined symbol"**
```bash
# Fix environment pollution:
unset TT_METAL_HOME
unset TT_METAL_VERSION
# See Lesson 10 for details
```

**"vLLM won't start"**
```bash
# Check environment:
echo $TT_METAL_HOME    # Should be ~/tt-metal
echo $MESH_DEVICE      # Should match hardware
# See FAQ.md for systematic debugging
```

**Need more help?**
- Check [FAQ.md](FAQ.md) - covers 90% of issues
- Join [Discord](https://discord.gg/tenstorrent)
- Search [GitHub issues](https://github.com/tenstorrent/tt-metal/issues)

---

## 📊 What's New

### Version 0.0.79 (Current)
- 📖 Added FAQ command - accessible from welcome page, command menu, and Command Palette
- ✅ Fixed all Jukebox references (now standalone tool)
- 🎯 Made TT-XLA lesson (Lesson 11) visible on welcome page
- 📝 Updated lesson numbering throughout (now 14 lessons total)
- ✍️ Improved writing style (active voice, dated statements)

### Version 0.0.78
- ✨ Moved TT-Jukebox to standalone repository
- 📝 Comprehensive FAQ added
- 🔧 Fixed lesson numbering
- 📚 Documentation review and improvements

### Version 0.0.77
- ✨ Added TT-XLA lesson (JAX support)
- 🔧 Improved Forge lesson with environment variable fixes
- 📝 Updated troubleshooting sections

### Version 0.0.65-70
- ✨ Two-terminal strategy implementation
- ✨ Auto-configured UX (theme, terminal, extensions)
- ✨ Statusbar device monitoring
- 📚 Major documentation updates

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 💬 Community

- **Discord:** https://discord.gg/tenstorrent (most active)
- **GitHub:** https://github.com/tenstorrent
- **Documentation:** https://docs.tenstorrent.com
- **Twitter:** [@Tenstorrent](https://twitter.com/tenstorrent)

---

## 🙏 Acknowledgments

Built by the Tenstorrent community with contributions from:
- Tenstorrent engineering team
- Open-source contributors
- Community members providing feedback and testing

**Special thanks to:**
- All beta testers
- Documentation contributors
- Bug reporters

---

## 🎯 Get Started Now

```bash
# Clone and open in VSCode
git clone https://github.com/tenstorrent/tt-vscode-extension.git
cd tt-vscode-extension
code .

# Press F5 to launch
# The welcome page opens automatically!
```

**Ready to build AI on Tenstorrent hardware? Let's go! 🚀**

---

**Questions?** Check [FAQ.md](FAQ.md) or join our [Discord](https://discord.gg/tenstorrent)!
