# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension for Tenstorrent hardware setup and development. The extension uses **VSCode's native Walkthroughs API** to provide an interactive, step-by-step onboarding experience that guides users through hardware detection, installation verification, and model downloading.

## Build and Development Commands

```bash
# Install dependencies
npm install

# Compile TypeScript to dist/
npm run build

# Watch mode for development (auto-recompile on changes)
npm run watch

# Package extension as .vsix file
npm run package
```

## Running and Testing

Press `F5` in VS Code to launch the Extension Development Host with the extension loaded. The walkthrough will appear in the "Get Started" section of VS Code.

To manually open the walkthrough:
1. Open Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
2. Search for "Welcome: Open Walkthrough"
3. Select "Get Started with Tenstorrent"

Alternatively, open the welcome page:
1. Open Command Palette
2. Run "Tenstorrent: Show Welcome Page"
3. The welcome page provides an overview and links to all walkthroughs

## Working Directory Structure

The extension creates a dedicated directory for all generated scripts and files:

**Scratchpad Directory:** `~/tt-scratchpad/`
- All Python scripts created from templates are saved here
- Examples: `tt-chat-direct.py`, `tt-api-server-direct.py`
- Keeps user workspace organized and scripts easy to find
- Directory is automatically created when first script is generated

**Benefits:**
- ✅ Clear separation between extension-generated code and user projects
- ✅ All scripts in one predictable location
- ✅ Easy to customize, backup, or delete generated files
- ✅ No clutter in home directory root

## Architecture

### Content-First Design

**Key Principle:** Content is completely separated from code. Technical writers can edit lesson content without touching TypeScript files.

**Content Location:** `content/lessons/*.md`
- `01-hardware-detection.md` - Hardware detection lesson content
- `02-verify-installation.md` - Installation verification lesson content
- `03-download-model.md` - Model download lesson content

**Content Format:** Standard markdown with support for:
- Formatting: `**bold**`, `*italic*`, `` `code` ``
- Links to external URLs: `[text](https://url)`
- Command links: `[Run Command](command:tenstorrent.commandId)`
- Lists, headings, and other standard markdown features

**Command Links as Buttons:** By VS Code convention, command links on their own line are automatically rendered as buttons. No custom CSS or HTML is needed:

```markdown
[🔍 Detect Tenstorrent Hardware](command:tenstorrent.runHardwareDetection)
```

This native approach:
- Automatically matches the user's VS Code theme
- Requires no custom styling or CSS
- Follows VS Code extension best practices
- Keeps markdown files clean and simple for technical writers

### Walkthrough Structure

**Definition:** `package.json` → `contributes.walkthroughs`

This declarative structure defines:
- Walkthrough ID, title, and description
- Ordered list of steps
- Each step's title, description, and markdown content file
- Completion events (what triggers step completion)

**Adding a New Lesson:**
1. Create a new markdown file in `content/lessons/`
2. Add a new step to `package.json` → `contributes.walkthroughs[0].steps`
3. Define the command(s) needed for that step
4. Implement the command handler(s) in `src/extension.ts`

### Extension Code Structure

**src/extension.ts** - Single file containing all extension logic (~217 lines)

**Sections:**
1. **Terminal Management** (lines 20-71)
   - `terminals` object: Stores references to named terminals
   - `getOrCreateTerminal()`: Gets or creates a terminal, reuses if still alive
   - `runInTerminal()`: Executes commands and shows terminal to user

2. **Command Handlers** (lines 73-167)
   - `runHardwareDetection()`: Executes `tt-smi` command
   - `verifyInstallation()`: Runs tt-metal test program
   - `setHuggingFaceToken()`: Prompts for HF token, sets as env var
   - `loginHuggingFace()`: Authenticates with HF CLI
   - `downloadModel()`: Downloads Llama model from HF

3. **Extension Lifecycle** (lines 169-217)
   - `activate()`: Registers all commands
   - `deactivate()`: Cleans up terminal references

**Key Design Decisions:**
- No state management needed (VSCode tracks completion)
- No webview/HTML generation (uses native walkthrough UI)
- No custom UI code (leverages VSCode theming)
- Commands are simple: create terminal → send command → show feedback

### VSCode Walkthroughs API Features Used

**Automatic Step Completion:**
- `completionEvents: ["onCommand:commandId"]` in package.json
- Steps auto-check when the specified command executes
- No manual state tracking required

**Native UI Benefits:**
- Automatically themed to match user's VS Code theme
- Appears in VS Code's "Get Started" page
- Can auto-open on extension first install
- Progress tracking built-in
- Markdown rendering built-in

**Terminal Integration:**
- Each lesson uses a dedicated named terminal
- Terminals persist across command invocations
- Terminal reuse: if terminal exists and is alive, reuse it
- Workspace root used as cwd for all terminals

## Adding New Lessons

To add a new lesson to the walkthrough:

1. **Create Content File:** `content/lessons/04-your-lesson.md`
   ```markdown
   # Your Lesson Title

   Description of what this lesson does...

   Show the command that will be executed:

   ```bash
   your-shell-command
   ```

   [🚀 Run Your Command](command:tenstorrent.yourCommand)
   ```

   **Note:** Command links on their own line are automatically rendered as buttons by VS Code. Use emojis for visual appeal.

2. **Add to package.json:**
   ```json
   {
     "id": "your-lesson-id",
     "title": "Your Lesson Title",
     "description": "Brief description...",
     "media": {
       "markdown": "content/lessons/04-your-lesson.md"
     },
     "completionEvents": ["onCommand:tenstorrent.yourCommand"]
   }
   ```

3. **Register Command in package.json:**
   ```json
   {
     "command": "tenstorrent.yourCommand",
     "title": "Your Command Title",
     "category": "Tenstorrent"
   }
   ```

4. **Implement Handler in extension.ts:**
   ```typescript
   function yourCommandHandler(): void {
     const terminal = getOrCreateTerminal('Your Terminal', 'yourTerminal');
     runInTerminal(terminal, 'your-shell-command');
     vscode.window.showInformationMessage('Your feedback message');
   }
   ```

5. **Register in activate():**
   ```typescript
   vscode.commands.registerCommand('tenstorrent.yourCommand', yourCommandHandler)
   ```

## Important Implementation Notes

- **No Custom UI:** All UI is provided by VSCode's native walkthrough system
- **Markdown Files Are Deployed:** The `content/` directory is copied to `dist/` during build
- **Terminal Persistence:** Terminals survive between command invocations but are cleaned up on deactivation
- **Password Input:** Use `password: true` in `showInputBox()` for sensitive inputs like tokens
- **Command Discovery:** Users find commands via walkthrough links, not the Command Palette
- **Completion Tracking:** VSCode automatically tracks which steps are completed based on `completionEvents`

## Lessons 4-6: Direct API and Production Deployment

### Evolution of Approach

**Initial Attempt (Deprecated):**
- Wrapped pytest demo with temporary JSON files
- Model reloaded for each query (2-5 minutes each time)
- Limited customization, black-box approach

**Current Approach (Implemented):**
- Use Generator API directly - model stays in memory
- 2-5 min initial load, then 1-3 sec per query (100x faster!)
- Full source code visible and customizable
- Educational and production-ready

### Challenge

User feedback: "A developer wants to do more than just force test code to work. They want the first thing they build to be something they can customize too."

Requirements:
- Use Generator API directly (not pytest wrapper)
- Open created files in editor automatically
- Progress from basic chat → HTTP API → production (vLLM)
- Maintain educational value while being production-ready

### Solution: Three-Tier Approach

#### Lesson 4: Direct API Chat
**File:** `content/templates/tt-chat-direct.py`

Uses Generator API to load model once and reuse it:

```python
# Load model once (slow)
from models.tt_transformers.tt.generator import Generator
from models.tt_transformers.tt.common import create_tt_model

model_args, model, tt_kv_cache, _ = create_tt_model(mesh_device, ...)
generator = Generator([model], [model_args], mesh_device, ...)

# Chat loop (fast - model already loaded!)
while True:
    prompt = input("> ")

    # Preprocess
    tokens, encoded, pos, lens = preprocess_inputs_prefill([prompt], ...)

    # Prefill (process prompt)
    logits = generator.prefill_forward_text(tokens, ...)

    # Decode (generate response)
    for _ in range(max_tokens):
        logits = generator.decode_forward_text(out_tok, current_pos, ...)
        next_token = sample(logits)
        if is_end_token(next_token):
            break

    response = tokenizer.decode(all_tokens)
    print(response)
```

**Key Benefits:**
- ✅ Model loads once, stays in memory
- ✅ ~100x faster for subsequent queries
- ✅ Full control over sampling, temperature, max_tokens
- ✅ Educational - see exactly how inference works
- ✅ Foundation for custom applications

#### Lesson 5: Direct API Server
**File:** `content/templates/tt-api-server-direct.py`

Flask HTTP server that loads model once on startup:

```python
# Global model loaded at startup
GENERATOR = None
MODEL_ARGS = None

def initialize_model():
    """Load model once when server starts"""
    global GENERATOR, MODEL_ARGS
    # ... load model using Generator API ...

@app.route('/chat', methods=['POST'])
def chat():
    """Use the loaded model for fast inference"""
    data = request.get_json()
    prompt = data['prompt']

    # Fast inference - model already loaded!
    response = generate_response(GENERATOR, prompt, ...)

    return jsonify({
        "response": response,
        "tokens_per_second": ...,
    })

# Load model once at startup
initialize_model()
app.run(...)
```

**Key Benefits:**
- ✅ Model loaded once on startup
- ✅ 1-3 second response time per request
- ✅ Full Flask customization available
- ✅ Production-grade patterns (globals, error handling)
- ✅ Foundation for microservices

#### Lesson 6: vLLM Production
**File:** `content/lessons/06-vllm-production.md`

Comprehensive guide to Tenstorrent's vLLM fork:

**Features:**
- OpenAI-compatible API (drop-in replacement)
- Continuous batching (efficient multi-user serving)
- Request queuing, priority scheduling
- Streaming responses
- Production-tested at scale

**Why vLLM:**
- Enterprise features vs. basic Flask server
- Standardized API vs. custom endpoints
- Battle-tested vs. prototype
- Horizontal scaling support

### Implementation Details

#### Editor Opening Feature

Commands now open created files automatically:

```typescript
async function createChatScriptDirect(): Promise<void> {
    // ... copy template ...

    // Open in editor automatically
    const doc = await vscode.workspace.openTextDocument(destPath);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
        '✅ Created script. The file is now open - review the code!'
    );
}
```

This allows developers to immediately see and customize the code.

#### Command Structure

New commands follow this pattern:
- `createXXXDirect()` - Copy template + open in editor
- `startXXXDirect()` - Start with proper environment setup
- `testXXXDirect()` - Test functionality with curl/SDK

### Performance Comparison

| Approach | Load Time | Query Time | Use Case |
|----------|-----------|------------|----------|
| Lesson 3 (pytest) | 2-5 min | 2-5 min | Testing |
| Old Lesson 4-5 (pytest wrapper) | 2-5 min | 2-5 min | Learning (deprecated) |
| New Lesson 4 (Direct API) | 2-5 min | 1-3 sec | Custom apps |
| New Lesson 5 (Flask Direct) | 2-5 min | 1-3 sec | API services |
| Lesson 6 (vLLM) | 2-5 min | 1-3 sec | Production |

**Impact:** 100x faster for subsequent queries!

### Why This Progression?

1. **Lesson 4:** Understand the Generator API
   - Load model, run inference
   - Full control and visibility
   - Foundation for everything else

2. **Lesson 5:** Wrap in HTTP API
   - Same Generator API, different interface
   - Learn server patterns
   - Prepare for deployment

3. **Lesson 6:** Scale to production
   - vLLM handles complexity
   - OpenAI compatibility
   - Enterprise features

Each lesson builds on the previous, maintaining the Generator API understanding while adding capabilities.

### Model Format Requirements (IMPORTANT)

**Two model formats needed:**
- **Meta native format** (in `original/` subdirectory): Used by Direct API (Lessons 3, 4, 5)
  - Files: `params.json`, `consolidated.00.pth`, `tokenizer.model`
  - Downloaded with: `--include "original/*"` (OLD, deprecated)
- **HuggingFace format** (in root directory): Used by vLLM (Lessons 6, 7)
  - Files: `config.json`, `model.safetensors`, etc.
  - Downloaded with: No `--include` filter (downloads everything)

**Current implementation:**
- Lesson 3 download command now downloads BOTH formats (no `--include` filter)
- This ensures all subsequent lessons work correctly
- Total download size: ~16GB (both formats included)

**Model paths:**
- Direct API uses: `~/models/Llama-3.1-8B-Instruct/original`
- vLLM uses: `~/models/Llama-3.1-8B-Instruct` (root directory)

### Lessons 6-7: vLLM and VSCode Chat (Implemented)

**Status:** Fully implemented and working

**Key features:**
1. **Lesson 6:** vLLM production server
   - Dedicated venv at `~/tt-vllm-venv` to avoid dependency conflicts
   - Requires `llama-models==0.0.48` package
   - Uses HuggingFace model format
   - OpenAI-compatible API

2. **Lesson 7:** VSCode Chat integration
   - Chat participant: `@tenstorrent`
   - Connects to local vLLM server on port 8000
   - Streaming responses via Server-Sent Events
   - Full chat history context support

**Implementation files:**
- `content/lessons/06-vllm-production.md` (621 lines)
- `content/lessons/07-vscode-chat.md` (586 lines)
- Added chat participant and commands to `src/extension.ts`
- Updated `package.json` with chat participant definition

### Key Learnings

**From user feedback:**
- Developers want to customize, not just run black boxes
- Opening files in editor is crucial for learning
- Performance matters - 2-5 min per query is unacceptable for iteration
- Need clear progression: learn → prototype → production

## File Structure

```
tt-vscode-ext-clean/
├── content/
│   ├── lessons/           # Markdown content files (editable by technical writers)
│   │   ├── 01-hardware-detection.md
│   │   ├── 02-verify-installation.md
│   │   ├── 03-download-model.md
│   │   ├── 04-interactive-chat.md
│   │   ├── 05-api-server.md
│   │   ├── 06-vllm-production.md
│   │   └── 07-vscode-chat.md
│   ├── templates/         # Python script templates deployed with extension
│   │   ├── tt-chat.py              # Interactive REPL wrapper
│   │   ├── tt-api-server.py        # Flask HTTP API wrapper
│   │   ├── tt-chat-direct.py       # Direct Generator API chat
│   │   └── tt-api-server-direct.py # Direct Generator API server
│   └── welcome/           # Welcome page content
│       └── welcome.html   # Welcome page HTML with walkthrough links
├── src/
│   ├── extension.ts       # Main extension code (command handlers + webview)
│   ├── commands/
│   │   └── terminalCommands.ts  # Terminal command definitions
│   └── types/
│       └── lesson.ts      # Legacy type definitions (not currently used)
├── vendor/
│   └── tt-metal/          # Cloned for reference (not deployed)
├── package.json           # Extension manifest with walkthrough definitions
├── tsconfig.json          # TypeScript configuration
└── CLAUDE.md             # This file
```

**Generated Files (User System):**
```
~/tt-scratchpad/           # Extension-generated scripts (auto-created)
├── tt-chat-direct.py      # Direct API chat script
└── tt-api-server-direct.py # Direct API server script
```

## Migration Notes

This extension was refactored from a custom webview-based approach to use VSCode's native Walkthroughs API. Benefits:

- **72% code reduction** (775 lines → 217 lines)
- **Zero custom UI code** (no HTML/CSS/webview management)
- **Native markdown support** (technical writers edit .md files)
- **Automatic completion tracking** (no manual state management)
- **Better UX** (native VS Code theming and integration)

The old approach required custom state management, HTML generation, and webview message passing. The new approach is declarative and leverages VSCode's built-in capabilities.
