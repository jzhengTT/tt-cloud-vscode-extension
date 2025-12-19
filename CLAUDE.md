# CLAUDE.md (Condensed)

Guidance for Claude Code working with this Tenstorrent VSCode extension.

## Project Overview

VSCode extension for Tenstorrent hardware development:

1. **Walkthroughs** - Step-by-step guides via VSCode Walkthroughs API
2. **Device Monitoring** - Statusbar with tt-smi integration
3. **Chat Integration** - @tenstorrent participant via vLLM
4. **Templates** - Production-ready Python scripts
5. **Auto-config** - Solarized Dark + terminal on activation
6. **Lesson Metadata** - Hardware compatibility and validation tracking (see LESSON_METADATA.md)

## Styled Hardware Configs (v0.0.85+)

All hardware instructions use CSS-styled `<details>` sections:

```html
<details open style="border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; margin: 8px 0; background: var(--vscode-editor-background);">
<summary style="cursor: pointer; font-weight: bold; padding: 4px; margin: -12px -12px 12px -12px; background: var(--vscode-sideBar-background); border-radius: 4px 4px 0 0; border-bottom: 1px solid var(--vscode-panel-border);"><b>🔧 Hardware Name</b></summary>
Content...
</details>
```

- Uses VSCode CSS variables (theme-aware)
- N150 open by default
- See `HARDWARE_CONFIG_TEMPLATE.md` + `STYLING_GUIDE.md`

## Build Commands

```bash
npm install           # Install dependencies
npm run build         # Compile TS → dist/
npm run watch         # Auto-recompile on changes
npm run package       # Create .vsix
```

## Version Management

**ALWAYS increment version in `package.json` with changes:**
- New features: increment MINOR (0.0.36 → 0.0.37)
- Bug fixes: increment PATCH
- Breaking changes: increment MAJOR

## Testing

Press `F5` to launch Extension Development Host.

**Manually open walkthrough:**
1. Cmd+Shift+P → "Welcome: Open Walkthrough"
2. Select "Get Started with Tenstorrent"

Or run: "Tenstorrent: Show Welcome Page"

## File Structure

```
content/
  lessons/        # Markdown content (editable by writers)
  templates/      # Python script templates
  welcome/        # Welcome page HTML
src/
  extension.ts    # Main extension code
  commands/terminalCommands.ts  # Command definitions
vendor/           # Reference repos (NOT deployed with extension)
  tt-metal/       # Main tt-metal repo - demos, examples, APIs
  vllm/           # TT vLLM fork - production inference
  tt-xla/         # TT-XLA/JAX - compiler, examples
  tt-forge-fe/    # TT-Forge frontend - experimental compiler
  tt-inference-server/  # Production deployment automation
  tt-installer/   # Installation automation reference
  ttsim/          # Simulator reference
package.json      # Extension manifest + walkthrough definitions
```

**Generated:** `~/tt-scratchpad/` - Extension-created scripts

**⚠️ Important:** The `vendor/` directory contains reference repositories for lesson authoring:
- **tt-metal** - Primary reference: demos, APIs, examples, model implementations
- **vllm** - Production inference patterns, server examples
- **tt-xla** - JAX/TT-XLA examples, demos, compiler documentation
- **tt-forge-fe** - TT-Forge examples, experimental compiler reference
- **tt-inference-server** - Production deployment automation, MODEL_SPECS
- **tt-installer** - Installation workflows, setup patterns
- **ttsim** - Simulator reference for testing without hardware

These repos are **NOT deployed** with the extension - they're local references only for development and lesson authoring. Always verify commands, paths, and API examples against these repos before publishing lessons.

**🚀 CRITICAL FOR CLAUDE CODE:** When working on lessons or features, **liberally clone/checkout packages to `vendor/` as needed**. Don't work blind - get the actual reference implementation first:

```bash
# Clone new reference repo when needed
cd vendor/
git clone https://github.com/tenstorrent/[repo-name].git

# Update existing repos
cd vendor/[repo-name]
git pull origin main
```

**Examples when you should clone/update vendor repos:**
- Authoring a new lesson about a feature
- Updating commands or API examples in existing lessons
- Verifying hardware configurations or flags
- Checking model paths, formats, or implementations
- Confirming environment variable names
- Finding correct import paths or function signatures

**Don't guess - check the source!** The vendor directory exists specifically so you can reference actual implementations.

**Note:** `vendor/` is in `.gitignore` - these reference repos are NOT committed to the extension's git repository. They're local-only for development. Each developer/AI should clone what they need.

## Lesson Metadata System (v0.0.86+)

**Every lesson now has metadata for hardware compatibility and validation tracking.**

See `LESSON_METADATA.md` for complete documentation.

**Quick reference:**
```json
"metadata": {
  "supportedHardware": ["n150", "n300", "t3k", "p100", "p150", "galaxy"],
  "status": "validated" | "draft" | "blocked",
  "validatedOn": ["n150", "n300"],
  "blockReason": "Optional reason if blocked",
  "minTTMetalVersion": "v0.51.0"
}
```

**Hardware values:** `n150`, `n300`, `t3k`, `p100`, `p150`, `galaxy`, `simulator`

**Status values:**
- `validated` - Tested and ready for production release
- `draft` - In development, hide in production builds
- `blocked` - Known issue, show with warning

**Use cases:**
1. **Release gating** - Filter lessons by status before packaging
2. **Hardware filtering** - Show only relevant lessons for detected hardware
3. **Quality tracking** - Know which configs have been tested
4. **Development workflow** - Clear status for each lesson

**All 16 lessons have metadata as of v0.0.86.**

## Architecture

**Content-First Design:** Content in markdown, code handles execution only.

**Walkthrough Structure:** Defined in `package.json` → `contributes.walkthroughs`
- Steps auto-complete via `completionEvents`
- Markdown rendered natively by VSCode
- Command links as buttons (on own line)
- Each step now includes `metadata` field (v0.0.86+)

**Terminal Management (v0.0.66+):**
- **2 terminals only:** `main` (setup/testing) and `server` (long-running)
- Reuse existing terminals (no terminal clutter)
- Environment persists across lessons

**Device Detection:** `updateDeviceStatus()` parses tt-smi, caches device info

## Adding New Lessons

1. **Research:** Check `vendor/` directory for reference implementations:
   - `vendor/tt-metal/` - Demos, examples, API patterns, model implementations
   - `vendor/vllm/` - Production inference, server configurations
   - `vendor/tt-xla/` - JAX examples, PJRT integration, demos
   - `vendor/tt-forge-fe/` - TT-Forge examples, experimental models
   - `vendor/tt-inference-server/` - MODEL_SPECS, validated configs, workflows
   - `vendor/tt-installer/` - Installation workflows, setup automation
   - `vendor/ttsim/` - Simulator for testing without hardware

   **If repo missing or outdated:** Clone/update it! Don't work without references:
   ```bash
   cd vendor/
   git clone https://github.com/tenstorrent/[repo-name].git
   # or update existing:
   cd vendor/[repo-name] && git pull origin main
   ```

2. Create `content/lessons/XX-your-lesson.md`
3. Add to `package.json` → `contributes.walkthroughs[0].steps`
4. Define commands needed
5. Implement handlers in `src/extension.ts`
6. Register commands in `activate()`

**For hardware-specific lessons:** Use styled `<details>` pattern from template.

**Best practice:** Always verify commands, paths, and examples against the vendor repos before publishing. They're cloned specifically for this purpose. **Clone liberally - don't guess!**

## Critical Patterns

**tt-metal builds:**
```bash
./install_dependencies.sh  # ALWAYS run first
./build_metal.sh --clean   # Troubleshooting
./build_metal.sh --enable-ccache  # Fast rebuilds
```

**vLLM commands (Lesson 7):**
- Hardware-specific Llama: `startVllmServerN150/N300/T3K/P100()`
- Hardware-specific Qwen: `startVllmServerN150Qwen/N300Qwen/T3KQwen/P100Qwen()` (v0.0.89+)
- Helper: `startVllmServerForHardware(hardware, config)` - accepts optional `modelPath` parameter
- All use `'server'` terminal type

**Model Support (v0.0.89+):**
- **Llama-3.1-8B-Instruct** - General-purpose chat (gated, requires HF token)
- **Qwen3-8B** - Multilingual (29 languages), coding, math (no HF token needed!)
- Both models: Same 8B size, work on all hardware (N150/N300/T3K/P100)
- Commands available for both models on all hardware configurations

**Model Registry:** `MODEL_REGISTRY` in `src/extension.ts`
- Current default: Llama-3.1-8B-Instruct
- Add models here to make available throughout extension

## Key Implementation Notes

- **No custom UI** - All UI from VSCode native
- **Markdown deployed** - `content/` copied to `dist/`
- **Terminal persistence** - Survives between invocations
- **Password input** - `password: true` in `showInputBox()`
- **Completion tracking** - VSCode auto-tracks via `completionEvents`

## Lessons Summary

| Lesson | Focus | Hardware Variants |
|--------|-------|-------------------|
| 1-5 | Setup, Direct API | Generic |
| 6-7 | Production (tt-inference-server, vLLM) | ✅ N150/N300/T3K/P100 |
| 8 | VSCode Chat | Generic |
| 9 | Image Generation (SD 3.5) | ✅ N150/N300/T3K/P100 |
| 10 | Coding Assistant | Generic |
| 11 | TT-Forge (experimental) | N150 only |
| 12 | TT-XLA JAX | ✅ N150/N300/T3K/Galaxy |

## Troubleshooting

**Environment variables matter:**
- vLLM: `TT_METAL_HOME`, `MESH_DEVICE`, `PYTHONPATH`
- Blackhole (P100): Also needs `TT_METAL_ARCH_NAME=blackhole`
- TT-Forge: `unset TT_METAL_HOME TT_METAL_VERSION`

**Model paths:**
- HuggingFace format: `~/models/Llama-3.1-8B-Instruct`
- Meta format: `~/models/Llama-3.1-8B-Instruct/original`

## Documentation Files

- `CLAUDE.md` - Full details (this file)
- `HARDWARE_CONFIG_TEMPLATE.md` - Pattern for hardware configs
- `STYLING_GUIDE.md` - CSS styling reference
- `FAQ.md` - User-facing troubleshooting
- `README.md` - Public-facing documentation

## Vendor Directory Reference Guide

**When authoring lessons, check these repos:**

| Lesson Type | Primary Reference | Secondary References |
|-------------|-------------------|---------------------|
| Setup/Installation | `tt-installer/` | `tt-metal/` |
| Direct API (tt-metal) | `tt-metal/models/` | `tt-metal/demos/` |
| vLLM Production | `vllm/tt_metal/` | `tt-inference-server/` |
| tt-inference-server | `tt-inference-server/` | `vllm/` |
| Image Generation | `tt-metal/models/experimental/` | - |
| TT-Forge | `tt-forge-fe/` | `tt-metal/` |
| TT-XLA/JAX | `tt-xla/demos/` | `tt-xla/` |
| Simulator Testing | `ttsim/` | `tt-metal/` |

**Always verify:**
- Command syntax and flags
- Model paths and formats
- Environment variables
- Hardware configurations
- API examples and patterns

## Recent Changes

**v0.0.86** - Lesson metadata system + install_dependencies.sh fixes
- Added metadata to all 16 walkthrough steps (hardware support, validation status)
- Created LESSON_METADATA.md with complete documentation
- Added `sudo` prefix to all `install_dependencies.sh` commands
- Fixed emoji-based lists to use proper markdown syntax (9 lessons)
- Infrastructure for release gating and hardware filtering

**v0.0.85** - CSS-styled hardware configurations
- Added styled `<details>` sections to Lessons 6, 7, 9, 12
- 4 new hardware-specific vLLM commands
- Template + styling guide created
- Added vendor directory documentation

**v0.0.84** - Previous version

See git history for full changelog.
