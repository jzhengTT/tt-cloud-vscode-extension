# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension for Tenstorrent hardware setup and development. The extension provides:

1. **Interactive Walkthroughs** - Step-by-step guides using VSCode's native Walkthroughs API
2. **Device Status Monitoring** - Real-time statusbar integration with tt-smi for device monitoring
3. **VSCode Chat Integration** - @tenstorrent chat participant powered by local vLLM server
4. **Template Scripts** - Production-ready Python scripts for inference and API servers
5. **Auto-configured UX** - Automatically sets Solarized Dark theme and opens terminal on first activation

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

## Version Management

**IMPORTANT:** Always increment the version number in `package.json` with every package of changes.

- Use semantic versioning: `MAJOR.MINOR.PATCH`
- For new features/lessons: increment MINOR (e.g., `0.0.36` → `0.0.37`)
- For bug fixes: increment PATCH (e.g., `0.0.36` → `0.0.37`)
- For breaking changes: increment MAJOR (when ready for 1.0.0)

Example workflow:
1. Make changes (add lesson, fix bug, etc.)
2. Update version in `package.json`
3. Build and test
4. Commit with version number in message

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

## First-Time User Experience (v0.0.65+)

The extension automatically configures an optimal development environment on first activation:

### Auto-Configured Settings

**1. Terminal Auto-Open**
- Creates and opens a "Tenstorrent" terminal immediately
- Terminal is ready for command execution
- Uses `preserveFocus=true` to keep editor focus
- Terminal persists across the session

**2. Solarized Dark Theme**
- Automatically sets `workbench.colorTheme` to "Solarized Dark"
- Only applies if user is on default theme (respects existing preferences)
- Optimal contrast for terminal visibility
- Professional, eye-friendly color scheme

**3. Welcome Page**
- Opens automatically on first activation
- Provides overview of all walkthrough lessons
- Links to documentation and resources

### Implementation Details

**Location:** `src/extension.ts` (lines 3177-3206)

The auto-configuration happens during the `activate()` function:

```typescript
// Create and show terminal
const defaultTerminal = vscode.window.createTerminal({
  name: 'Tenstorrent',
  cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
});
defaultTerminal.show(true); // preserveFocus=true

// Set theme on first run only
const hasSeenWelcome = context.globalState.get<boolean>('hasSeenWelcome', false);
if (!hasSeenWelcome) {
  context.globalState.update('hasSeenWelcome', true);

  const config = vscode.workspace.getConfiguration();
  const currentTheme = config.get<string>('workbench.colorTheme');

  // Only set if still on default theme
  if (currentTheme === 'Default Dark Modern' || currentTheme === 'Default Light Modern' || !currentTheme) {
    config.update('workbench.colorTheme', 'Solarized Dark', vscode.ConfigurationTarget.Global);
  }

  // Show welcome page
  setTimeout(() => showWelcome(context), 1000);
}
```

**Key Design Decisions:**
- ✅ **Respects user preferences:** Only sets theme if user is on a default theme
- ✅ **One-time configuration:** Uses `hasSeenWelcome` flag to avoid repeated changes
- ✅ **Non-intrusive terminal:** Opens with `preserveFocus=true` to not disrupt workflow
- ✅ **Global settings:** Uses `ConfigurationTarget.Global` so theme persists across workspaces

**For code-server/cloud deployments:**
This configuration works automatically when the extension is installed. No Docker image modifications needed - the extension handles everything at runtime.

## Terminal Management (v0.0.66+)

### Two-Terminal Strategy

The extension uses a **unified two-terminal approach** to prevent terminal clutter and preserve environment state across lessons:

**1. "Tenstorrent" (main terminal)**
- Used for: All setup, testing, one-off commands
- Examples: Hardware detection, downloads, installs, tests, script creation
- **Environment persists:** Python venvs, exported variables stay active across lessons
- Users can incrementally build their environment

**2. "Tenstorrent Server" (server terminal)**
- Used for: Long-running interactive processes
- Examples: vLLM servers, API servers, chat sessions, image generation, coding assistant
- **Keeps main terminal free:** Users can test/explore while servers run
- Can be stopped with Ctrl+C without affecting main environment

### Benefits

✅ **Environment persistence** - No need to re-export vars or re-activate venvs when switching lessons
✅ **Clean UI** - Maximum 2 terminal tabs (vs 9 with old approach)
✅ **Realistic workflow** - Matches how developers actually work
✅ **Non-blocking** - Servers don't block the main terminal
✅ **Simple mental model** - Easy to predict which terminal will be used

### Implementation

**Location:** `src/extension.ts` (lines 512-564)

```typescript
/**
 * Stores references to terminals used by the extension.
 */
const terminals = {
  main: undefined as vscode.Terminal | undefined,      // "Tenstorrent"
  server: undefined as vscode.Terminal | undefined,    // "Tenstorrent Server"
};

type TerminalType = 'main' | 'server';

function getOrCreateTerminal(type: TerminalType = 'main'): vscode.Terminal {
  // Check if terminal still exists
  if (terminals[type] && vscode.window.terminals.includes(terminals[type]!)) {
    return terminals[type]!;
  }

  // Create new terminal with appropriate name
  const name = type === 'server' ? 'Tenstorrent Server' : 'Tenstorrent';
  const terminal = vscode.window.createTerminal({
    name,
    cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
  });

  terminals[type] = terminal;
  return terminal;
}
```

### Routing Rules

Commands are automatically routed to the appropriate terminal:

**Main Terminal (`'main'`):**
- Hardware detection (`tt-smi`)
- Installation verification
- Model downloads
- Package installations
- Environment setup
- Testing commands (curl, pytest one-offs)
- Script creation/copying
- Jukebox operations
- Forge builds and tests

**Server Terminal (`'server'`):**
- Interactive chat sessions (`startChatSession*`)
- API servers (`startApiServer*`)
- vLLM servers (`startVllmServer`, `startVllmForChat`)
- Image generation (`startInteractiveImageGen`)
- Coding assistant (`startCodingAssistant`)
- Forge classifier (interactive mode)

### Migration from v0.0.65

**Old approach:** 9 different terminal types
- `hardwareDetection`, `verifyInstallation`, `modelDownload`, `interactiveChat`, `apiServer`, `vllmServer`, `imageGeneration`, `forgeInstall`, `forgeClassifier`

**New approach:** 2 terminal types
- `main`, `server`

**User impact:**
- Environment variables and Python venvs now persist across lessons
- Less terminal clutter (2 tabs max vs 9)
- Easier to follow lesson progression without losing context

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

### Device Status Monitoring (Statusbar Integration)

**Overview:**
The extension includes a non-obtrusive statusbar item that monitors Tenstorrent device status in real-time using tt-smi. This provides quick access to device information and actions without cluttering the UI.

**Statusbar Display States:**
- `$(check) TT: N150` - Device healthy (green checkmark)
- `$(warning) TT: N150` - Device has issues (yellow warning)
- `$(sync~spin) TT: Checking...` - Currently checking status
- `$(x) TT: No device` - No device detected (red X)
- `$(question) TT: Unknown` - Status unknown

**Architecture:**

1. **Cached Status Updates:**
   - Device status is cached to minimize tt-smi calls
   - Default update interval: 60 seconds (configurable: 30s, 1m, 2m, 5m, 10m)
   - Updates run in background using `child_process.exec()`
   - Timeout: 5 seconds to prevent blocking
   - Can be enabled/disabled by user

2. **Parsing tt-smi Output:**
   - Extracts device type (N150, N300, T3K, etc.) from "Board Type:" line
   - Extracts firmware version from "FW Version:" or "Firmware Version:" line
   - Detects errors by searching for keywords: "error", "failed", "timeout"
   - Status determination:
     - `healthy`: Device found, no errors
     - `warning`: Device found but has issues
     - `error`: tt-smi failed or errors detected
     - `unknown`: Initial state or parsing failed

3. **Quick Actions Menu (on click):**
   Opens QuickPick menu with contextual actions:
   - **Refresh Status** - Manually trigger tt-smi update (shows time since last check)
   - **Check Device Status** - Open terminal and run tt-smi for full output
   - **Firmware Version** - Display firmware version in info message (if available)
   - **Reset Device** - Run `tt-smi -r` with confirmation
   - **Clear Device State** - Kill processes, clear /dev/shm, reset device (requires sudo)
   - **Configure Update Interval** - Change auto-update frequency
   - **Enable/Disable Auto-Update** - Toggle periodic status checks

4. **Device Management Commands:**

   **tenstorrent.resetDevice:**
   ```typescript
   async function resetDevice(): Promise<void> {
     // Confirms with user before resetting
     // Runs tt-smi -r in terminal
     // Refreshes statusbar after 3 seconds
   }
   ```

   **tenstorrent.clearDeviceState:**
   ```typescript
   async function clearDeviceState(): Promise<void> {
     // Confirms with user (warns about sudo requirement)
     // Multi-step cleanup:
     //   1. Kill tt-metal and vllm processes
     //   2. Clear /dev/shm/tenstorrent* and /dev/shm/tt_*
     //   3. Reset device with tt-smi -r
     // Refreshes statusbar after 5 seconds
   }
   ```

**Implementation Details:**

**File:** `src/extension.ts` (lines 41-374)

**Key Functions:**
- `parseDeviceInfo(output: string)` - Parses tt-smi output into DeviceInfo object
- `updateDeviceStatus()` - Runs tt-smi async and updates cache
- `updateStatusBarItem()` - Updates statusbar text/icon based on cached status
- `showDeviceActionsMenu()` - Displays QuickPick menu with actions
- `configureUpdateInterval()` - Allows user to set update frequency
- `toggleAutoUpdate()` - Enable/disable periodic updates
- `startStatusUpdateTimer()` - Starts setInterval timer for updates
- `stopStatusUpdateTimer()` - Clears update timer
- `resetDevice()` - Soft reset via tt-smi -r
- `clearDeviceState()` - Full cleanup (processes, /dev/shm, reset)

**Persistent State:**
Stored in VSCode globalState (survives extension restarts):
- `STATUSBAR_UPDATE_INTERVAL` - Update interval in seconds (default: 60)
- `STATUSBAR_ENABLED` - Whether auto-update is enabled (default: true)

**Lifecycle:**
- Initialized in `activate()` - Creates statusbar item, registers commands, starts timer
- Cleaned up in `deactivate()` - Stops timer, clears references

**Error Handling:**
- tt-smi not found: Shows "No device" status
- tt-smi timeout (>5s): Shows "error" status
- Parse errors: Falls back to "unknown" status
- All errors are handled gracefully without blocking UI

**Benefits:**
- ✅ Non-obtrusive - Single statusbar item, doesn't take much space
- ✅ Efficient - Cached updates, configurable intervals
- ✅ Contextual - Only shows relevant actions based on device state
- ✅ Safe - Confirms before destructive operations
- ✅ Informative - Shows device type, firmware, last check time

**Use Cases:**
1. **Quick health check** - Glance at statusbar to see if device is healthy
2. **Firmware debugging** - View firmware version without running tt-smi
3. **Recovery from errors** - Reset device or clear state when initialization fails
4. **Development workflow** - Monitor device during development without manual checks

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
- **Meta native format** (in `original/` subdirectory): Used by pytest demos (Lesson 3)
  - Files: `params.json`, `consolidated.00.pth`, `tokenizer.model`
  - Environment variable: `LLAMA_DIR=~/models/Llama-3.1-8B-Instruct/original`
- **HuggingFace format** (in root directory): Used by Direct API and vLLM (Lessons 4-7)
  - Files: `config.json`, `model.safetensors`, etc.
  - Environment variable: `HF_MODEL=~/models/Llama-3.1-8B-Instruct`

**Current implementation:**
- Lesson 3 download command downloads BOTH formats (no `--include` filter)
- This ensures all subsequent lessons work correctly
- Total download size: ~16GB (both formats included)

**Model paths by lesson:**
- **Lesson 3** (pytest demos): `LLAMA_DIR=~/models/Llama-3.1-8B-Instruct/original`
- **Lessons 4-5** (Direct API): `HF_MODEL=~/models/Llama-3.1-8B-Instruct`
- **Lessons 6-7** (vLLM): `HF_MODEL=~/models/Llama-3.1-8B-Instruct`

### Lessons 6-7: vLLM and VSCode Chat (Implemented)

**Status:** Fully implemented and working

**Key features:**
1. **Lesson 6:** vLLM production server
   - Dedicated venv at `~/tt-vllm-venv` to avoid dependency conflicts
   - Requires dependencies: `fairscale`, `termcolor`, `loguru`, `blobfile`, `fire`, and `llama-models==0.0.48`
     - These are optional dependencies of `llama-models` that must be installed separately
     - `fairscale`: Required for model parallelism in llama3 reference implementation
     - `termcolor`: Required for colored terminal output in llama3/generation.py
     - `loguru`: Required by Tenstorrent's tt-metal vision demo code
     - `blobfile`, `fire`: Additional llama3 requirements
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

### Lesson 8: Image Generation with Stable Diffusion 3.5 Large (Implemented)

**Status:** Fully implemented with NATIVE TT HARDWARE ACCELERATION

**Key features:**
- ✅ **Native TT Acceleration** - Runs on tt-metal using TT-NN operators (NOT CPU!)
- ✅ **Stable Diffusion 3.5 Large** - State-of-the-art MMDiT architecture
- ✅ **High Resolution** - Generates 1024x1024 images (vs 512x512)
- ✅ **Fast** - ~12-15 seconds per image on N150 with hardware acceleration
- ✅ **Interactive Mode** - Built-in prompt input for multiple generations

**Architecture:**
- **3 Text Encoders:** CLIP-L, CLIP-G, T5-XXL for rich text understanding
- **MMDiT Transformer:** 38 blocks running on TT hardware
- **28 Inference Steps:** Optimized for quality/speed
- **VAE Decoder:** Converts latents to 1024x1024 pixels

**Implementation:**

1. **Model:** Stable Diffusion 3.5 Large (~10 GB)
   - Location: `models/experimental/stable_diffusion_35_large/`
   - From: `stabilityai/stable-diffusion-3.5-large`
   - Native TT-NN implementation in tt-metal

2. **Hardware Support:**
   - ✅ N150 (1x1 mesh) - Single chip
   - ✅ N300 (1x2 mesh) - Dual chip
   - ✅ T3K (1x8 mesh) - 8-chip system
   - ✅ TG (8x4 mesh) - Galaxy 32-chip

3. **Performance on N150:**
   - First run: Downloads model (~10 GB), loads (2-5 min)
   - Generation: ~12-15 seconds per 1024x1024 image
   - **Native hardware acceleration** - runs on TT cores!

4. **Commands:**
   ```bash
   # Set environment
   export MESH_DEVICE=N150

   # Generate with default prompt (sample)
   pytest models/experimental/stable_diffusion_35_large/demo.py

   # Interactive mode (custom prompts)
   export NO_PROMPT=0
   pytest models/experimental/stable_diffusion_35_large/demo.py
   ```

**Implementation files:**
- `content/lessons/08-image-generation.md` - Updated for SD 3.5 Large
- `src/commands/terminalCommands.ts` - 2 commands (generate, interactive)
- `src/extension.ts` - 2 command handlers
- `package.json` - Updated walkthrough step and commands
- Welcome page updated

**Extension Commands:**
- `tenstorrent.generateRetroImage` - Generate sample 1024x1024 image with default prompt
- `tenstorrent.startInteractiveImageGen` - Start interactive mode for custom prompts

**Key Advantages over SD 1.4:**
- ✅ **Native TT acceleration** (not CPU fallback)
- ✅ **4x higher resolution** (1024x1024 vs 512x512)
- ✅ **Better quality** - MMDiT architecture
- ✅ **Built into tt-metal** - No external dependencies
- ✅ **Production ready** - Optimized parallelization

The lesson teaches:
- How MMDiT transformers work
- Using experimental models in tt-metal
- Mesh device configuration for N150
- Native hardware-accelerated image generation
- Interactive prompt-based workflows

### Key Learnings

**From user feedback:**
- Developers want to customize, not just run black boxes
- Opening files in editor is crucial for learning
- Performance matters - 2-5 min per query is unacceptable for iteration
- Need clear progression: learn → prototype → production

## N150 Hardware Golden Path (Lesson 6-7)

**Status:** Configured for N150 single-chip cloud deployment

**Hardware Target:**
- N150 (Wormhole) single chip
- Cloud environment
- tt-metal: **latest main branch** (must be rebuilt after updates)
- vLLM branch: **dev (HEAD)**

**⚠️ Version Strategy Change:**
- Initially tried pinning to tt-metal v0.62.0-rc9 (August 2025)
- Found that vLLM dev requires latest tt-metal APIs
- **Solution:** Use latest on both repos (simpler, better tested)
- **Critical:** Must rebuild tt-metal after git pull with `./build_metal.sh`

**Model Configuration:**
- Model: Llama-3.1-8B-Instruct
- Size: 8B parameters (perfect for N150)
- Tensor Parallelism: Not needed (single chip)
- Context Length: 64K tokens (N150 limit)

**Required Environment Variables:**
```bash
export TT_METAL_HOME=~/tt-metal                # Point to tt-metal (required by setup-metal.sh)
export MESH_DEVICE=N150                        # Target N150 hardware
export HF_MODEL=~/models/Llama-3.1-8B-Instruct # Model path
export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH   # Critical: Find TTLlamaForCausalLM
```

**Required vLLM Flags:**
```bash
--max-model-len 65536                # 64K context limit for N150
```

**Why TT_METAL_HOME + PYTHONPATH matter:**
- `TT_METAL_HOME`: setup-metal.sh uses this to set PYTHON_ENV_DIR correctly
- `PYTHONPATH`: vLLM needs to import `TTLlamaForCausalLM` from tt-metal
- Without these, you get: "Cannot find model module 'TTLlamaForCausalLM'"
- The tt-metal directory contains the model implementation in `models/tt_transformers/tt/generator_vllm.py`

**Why This Configuration:**
1. Llama-3.1-8B officially supported on N150 (per vLLM tt_metal/README.md)
2. Single chip = simpler deployment (no multi-chip tensor parallelism)
3. Already downloaded in Lesson 3 (no additional downloads)
4. Compatible with tt-metal v0.62.0 family
5. Best balance of model capability vs hardware constraints

**Alternative Models (NOT recommended for N150):**
- Qwen 2.5 7B: Requires N300 (2 chips, TP=2)
- Llama 3.3 70B: Requires QuietBox (8 chips, TP=8)
- Larger models exceed N150 memory capacity

**Commands Updated:**
- `tenstorrent.runVllmOffline`: Includes MESH_DEVICE=N150 and --max_model_len 65536 (underscores)
- `tenstorrent.startVllmServer`: Includes MESH_DEVICE=N150 and --max-model-len 65536 (hyphens)
- `tenstorrent.startVllmForChat`: Includes MESH_DEVICE=N150 and --max-model-len 65536 (hyphens)
- `tenstorrent.installVllm`: Includes all discovered dependencies

**Note:** offline_inference_tt.py uses underscores `--max_model_len`, API server uses hyphens `--max-model-len`

**Complete Dependency List (discovered through testing):**
```bash
pip install --upgrade ttnn pytest  # Critical: must upgrade ttnn for v0.62.0-rc9
pip install fairscale termcolor loguru blobfile fire pytz llama-models==0.0.48
```

**Documentation Updated:**
- Lesson 6: Added "Hardware Configuration: N150 Golden Path" section
- Lesson 6: Updated all vLLM commands with N150 configuration
- Lesson 6: Added ttnn, pytest, and pytz to dependency list
- All commands now explicitly set MESH_DEVICE=N150 and context limit
- Troubleshooting section updated with ttnn upgrade instructions

### ✅ WORKING: N150 vLLM Golden Path (2025-11-05)

**Status:** Successfully tested and working on N150 hardware in cloud environment.

**Complete Working Command:**
```bash
cd ~/tt-vllm && \
  source ~/tt-vllm-venv/bin/activate && \
  export TT_METAL_HOME=~/tt-metal && \
  export MESH_DEVICE=N150 && \
  export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && \
  source ~/tt-vllm/tt_metal/setup-metal.sh && \
  python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-model-len 65536 \
    --max-num-seqs 16 \
    --block-size 64
```

**Key Success Factors:**
1. ✅ Custom starter script with `if __name__ == '__main__':` guard (prevents multiprocessing errors)
2. ✅ Local model path (avoids HuggingFace gated repo authentication)
3. ✅ TT model registration via `register_tt_models()`
4. ✅ N150-specific configuration (64K context, appropriate batch size)
5. ✅ All environment variables set correctly (TT_METAL_HOME, MESH_DEVICE, PYTHONPATH)

**Version:** Extension v0.0.20 includes all fixes and tested configuration.

### CRITICAL: vLLM TT Model Registration (2025-11-05)

**Problem Discovered:**
When users ran `python -m vllm.entrypoints.openai.api_server` directly, they got:
```
ValidationError: Cannot find model module. 'TTLlamaForCausalLM' is not a registered model
WARNING: TTLlamaForCausalLM has no vLLM implementation, falling back to Transformers
```

**Root Cause:**
vLLM doesn't automatically know about TT-specific model implementations (TTLlamaForCausalLM, etc.) in the tt-metal repository. These models must be explicitly registered using vLLM's `ModelRegistry.register_model()` API before starting the server.

**Solution:**
Use `examples/server_example_tt.py` instead of calling the API server directly. This script:

1. Calls `register_tt_models()` which registers all TT models:
   ```python
   ModelRegistry.register_model("TTLlamaForCausalLM",
       "models.tt_transformers.tt.generator_vllm:LlamaForCausalLM")
   ```

2. Then starts the API server with the correct parameters

**Updated Command (Step 4 in Lesson 6):**
```bash
python ~/tt-scratchpad/start-vllm-server.py \
    --model ~/models/Llama-3.1-8B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --max-num-seqs 16 \
    --block-size 64
```

**Why a custom starter script?**
The example scripts validate model names against a hardcoded list and try to download from HuggingFace. Our custom script (`start-vllm-server.py`):
1. Registers TT models with vLLM (required)
2. Accepts local model paths without validation
3. Passes all args directly to the API server

The extension automatically creates this script in `~/tt-scratchpad/` from a template.

**Key Insight:**
The example scripts (`offline_inference_tt.py`, `server_example_tt.py`) all include `register_tt_models()` at the top. This is not optional - without it, vLLM cannot find the TT model implementations even with correct PYTHONPATH and TT_METAL_HOME settings.

**Environment variables still required:**
- `TT_METAL_HOME=~/tt-metal` - Required by setup-metal.sh
- `PYTHONPATH=$TT_METAL_HOME` - Allows Python to import from tt-metal
- `MESH_DEVICE=N150` - Hardware target
- Must source `~/tt-vllm/tt_metal/setup-metal.sh`

**Model path:** Use the local path `~/models/Llama-3.1-8B-Instruct` (not HF model name). The model has HuggingFace format files in the root directory.

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

## Lesson 9: Coding Assistant with Prompt Engineering (2025-11-06)

**Final Implementation:** Uses Llama 3.1 8B with coding-focused system prompt

### Evolution of Lesson 9

**Iteration 1: Qwen 2.5 Coder 7B (Abandoned)**
- Attempted to use Qwen 2.5 Coder 7B for N150
- **Blocker:** Qwen requires N300 minimum (TP=2, dual-chip)
- No Qwen model supports N150 single-chip

**Iteration 2: Llama 3.2 6B AlgoCode (Abandoned)**
- Attempted community fine-tune "prithivMLmods/Llama-3.2-6B-AlgoCode"
- **Blocker 1:** Model only has HuggingFace format (no Meta `original/` checkpoint)
- **Blocker 2:** Weight dimensions not tile-aligned for tt-metal (32x32 requirement)
- Error: `Physical shard shape (10036, 352) must be tile {32, 32} sized!`
- **Root cause:** Direct API requires Meta checkpoint format with tt-metal-compatible weights

**Iteration 3: Llama 3.1 8B + Prompt Engineering (FINAL)**
- ✅ Uses proven tt-metal compatible model (already downloaded in Lesson 3)
- ✅ No compatibility issues - Meta format with proper tile alignment
- ✅ Teaches prompt engineering - critical real-world skill
- ✅ 80%+ of specialized model quality through system prompts
- ✅ Transferable knowledge to all LLMs

### Key Technical Insights

**Why Specialized Models Failed:**
1. **Model format mismatch:** Community HuggingFace models lack Meta checkpoint format
2. **Tile alignment:** tt-metal requires weights divisible by 32x32 tiles
3. **Hardware constraints:** Some models require multi-chip (TP > 1)
4. **Direct API requirements:** Needs specifically adapted model architectures

**Why Prompt Engineering Succeeds:**
- Works with any compatible model
- No weight conversion needed
- No additional downloads
- Industry-standard technique
- Easy to customize and iterate

### Implementation Details

**Files Changed:**
1. `content/lessons/09-algocode-assistant.md` - Complete rewrite with prompt engineering focus
   - Added "Future Model Options" preamble explaining blockers
   - Emphasis on prompt engineering as real-world technique
   - Examples of system prompt architecture
   - Comparison tables: prompt engineering vs model specialization
   - Advanced techniques: few-shot, chain-of-thought, constrained generation
   - Customization ideas for different domains

2. `content/templates/tt-coding-assistant.py` - New template (replaces tt-algocode-chat.py)
   - Uses Llama 3.1 8B with LLAMA_DIR (Meta format)
   - Coding-focused system prompt embedded
   - Temperature 0.7 for balanced determinism
   - Educational comments explaining prompt engineering

3. `src/extension.ts` - Updated command handlers
   - Removed AlgoCode model from MODEL_REGISTRY
   - `createAlgoCodeChatScript` now creates tt-coding-assistant.py
   - `startAlgoCodeChat` uses Llama 3.1 8B original path
   - Updated user-facing messages

4. `src/commands/terminalCommands.ts` - Updated command templates
   - DOWNLOAD_ALGOCODE now verifies Llama 3.1 8B (not downloads AlgoCode)
   - START_ALGOCODE_CHAT uses correct model path
   - Updated descriptions

5. `package.json` - Updated walkthrough metadata
   - Title: "Coding Assistant with Prompt Engineering"
   - Description emphasizes prompt engineering skill
   - Command titles updated

**System Prompt Example:**
```python
SYSTEM_PROMPT = """You are an expert coding assistant specializing in:
- Algorithm design and analysis
- Data structures (trees, graphs, heaps, hash tables)
- Code debugging and optimization
...

When answering:
- Provide clear, concise explanations
- Include code examples when relevant
- Explain your reasoning
- Consider edge cases
..."""
```

### User Experience

**What Users Learn:**
1. Prompt engineering fundamentals
2. System prompt architecture
3. Shaping model behavior through instructions
4. Few-shot learning, chain-of-thought, constrained generation
5. Domain-specific customization

**Practical Applications:**
- Interactive code review
- Algorithm learning
- Debugging assistance
- Code translation between languages
- Test generation
- Documentation generation

**Extensibility:**
- Customize system prompt for different domains (web dev, systems programming)
- Add context management for multi-turn conversations
- Integrate code execution
- Add file I/O for codebase analysis
- Build IDE integrations

### Future Path Forward

**When Model Support Expands:**
The lesson includes a forward-looking "Future Model Options" section listing:
- Llama 3.2 6B AlgoCode - Needs weight conversion for tile alignment
- Qwen 2.5 Coder 7B - Needs N300 or single-chip optimization
- CodeLlama - Needs architecture compatibility work
- StarCoder2 - Needs custom tt-metal implementation

**Migration Path:**
Once models become compatible, users can swap them in using the same Direct API pattern they learned. The prompt engineering skills remain valuable across all models.

### Key Takeaway

**Prompt engineering is not a workaround - it's a feature.**

Real production systems rely heavily on prompt engineering because:
- It works across all models
- Easy to iterate and customize
- No model training required
- Immediate results
- Often delivers 80%+ of specialized model quality

This lesson teaches a critical skill that applies to GPT, Claude, Gemini, and all future LLMs.

## Lesson 10: Environment Management with TT-Jukebox

### The Version Mismatch Problem

Each model in production has been tested with SPECIFIC commits of tt-metal and vLLM. Using the wrong versions leads to compilation failures, runtime errors, and crashes.

### TT-Jukebox Solution

TT-Jukebox is an intelligent environment manager that:
1. Detects your hardware automatically (tt-smi)
2. Fetches official model specifications from GitHub
3. Matches your task/model to compatible configurations
4. **Checks if models are downloaded** (NEW in v0.0.32)
5. Generates setup scripts with EXACT commit SHAs
6. **Downloads models from HuggingFace if missing** (NEW in v0.0.32)
7. Builds reproducible environments

### Model Download Detection (v0.0.32)

**Added Functions:**

1. **detect_model_download()** - Checks if model exists:
   - Location 1: `~/models/{model_name}/`
   - Location 2: `~/.cache/huggingface/hub/models--{repo}/`
   - Validates by checking for: `config.json`, `model.safetensors`, `pytorch_model.bin`

2. **check_hf_token()** - Finds HuggingFace authentication:
   - Checks `HF_TOKEN` environment variable
   - Checks `~/.cache/huggingface/token` file
   - Returns token or None

3. **Modified generate_setup_script()** - Includes model download:
   ```bash
   # Check if HF_TOKEN is set
   if [ -z "$HF_TOKEN" ]; then
       if ! huggingface-cli whoami &>/dev/null; then
           echo 'ERROR: Not logged into HuggingFace!'
           exit 1
       fi
   fi

   # Download model
   huggingface-cli download {hf_repo} --local-dir {path}
   ```

4. **Modified display_model_spec()** - Shows download status:
   ```
   Model: Downloaded ✓
     Path: ~/models/Llama-3.1-8B-Instruct

   OR

   Model: Not downloaded
     Will download to: ~/models/Llama-3.1-8B-Instruct
   ```

### HuggingFace Authentication Options

**Option 1: Environment variable (recommended)**
```bash
export HF_TOKEN=hf_...
python3 tt-jukebox.py --model llama --setup
```

**Option 2: Command line argument**
```bash
python3 tt-jukebox.py --model llama --setup --hf-token hf_...
```

**Option 3: Use existing huggingface-cli login**
```bash
huggingface-cli login
python3 tt-jukebox.py --model llama --setup
```

### Workflow

1. Copy script: `tenstorrent.copyJukebox`
2. List models: `python3 tt-jukebox.py --list`
3. Find chat models: `python3 tt-jukebox.py chat`
4. Search Llama: `python3 tt-jukebox.py --model llama`
5. Generate setup: `python3 tt-jukebox.py --model llama-3.1-8b --setup`
6. Execute setup: `bash ~/tt-scratchpad/setup-scripts/setup_llama_3_1_8b_instruct.sh`
7. Verify: Check commits match, test imports
8. Start vLLM: Use spec-based flags (max_model_len, max_num_seqs, block_size)
9. Test: OpenAI SDK, curl, pv (pipe viewer)

### Key Benefits

- ✅ Eliminates version mismatch errors
- ✅ Reproducible environments (share setup scripts)
- ✅ Intelligent matching (task or model name)
- ✅ Hardware-aware (only compatible models)
- ✅ Automated setup (bash scripts do everything)
- ✅ Production-ready configs (tested vLLM flags)
- ✅ **Automatic model downloads** (NEW - no manual download needed)
- ✅ **HF authentication support** (NEW - multiple auth methods)
- ✅ **Intelligent experimental matching** (NEW v0.0.35 - try unvalidated models safely)

### Experimental Model Matching (v0.0.35)

**Problem:** Official model specs only include validated configurations. Users with newer hardware (like Blackhole P100) or wanting to try unvalidated models had limited options.

**Solution:** Intelligent partial compatibility detection using `--show-experimental` flag.

**How it works:**

The `filter_by_hardware()` function now analyzes multiple factors to determine compatibility:

1. **Exact Device Match** → Validated List (regardless of status)
   - P100 models on P100 hardware
   - Shows status badge: [EXPERIMENTAL], [FUNCTIONAL], or [COMPLETE]

2. **Same Architecture Family** → Experimental List
   - Architecture families:
     - Wormhole: N150, N300, T3K, N150X4
     - Blackhole: P100, P150, P150X4, P150X8
   - Example: N150 model might work on N300 (both wormhole_b0)
   - Example: P150 model might work on P100 (both blackhole)

3. **Smaller Model on Larger Device** → Experimental List
   - Parameter count ≤ 8B
   - User device "larger" than spec device (crude heuristic by device numbers)
   - Example: N150 (8B model) might work on T3K

4. **Official Experimental Status** → Experimental List
   - Models marked `status: "EXPERIMENTAL"` in JSON
   - But device doesn't match exactly

**Display Features:**

- Compatibility reason shown for each experimental model
- Status badges in both validated and experimental lists
- Conservative parameters automatically applied (33% reduction)
- Clear warnings about unvalidated status

**Usage Examples:**

```bash
# List validated models only (default)
python3 tt-jukebox.py --list

# List validated + experimental models
python3 tt-jukebox.py --list --show-experimental

# Search for Llama models, include experimental
python3 tt-jukebox.py --model llama --show-experimental

# Find chat models on P100 Blackhole
python3 tt-jukebox.py chat --show-experimental
```

**Output Example (P100 hardware):**

```
✓ VALIDATED MODELS

Llama Family:
  • Llama-3.1-8B-Instruct [EXPERIMENTAL]
    Context: 65536 tokens, Disk: 20 GB

⚠ EXPERIMENTAL MODELS (not validated)

Llama Family:
  • Llama-3.1-70B (validated for P150)
    Reason: same architecture (blackhole)
    Context: 131072 tokens, Disk: 140 GB
```

**Implementation Details:**

File: `content/templates/tt-jukebox.py`

- `filter_by_hardware()` (lines 323-401) - Enhanced compatibility logic
- `display_model_spec()` (lines 545-599) - Shows compatibility reasons
- `apply_conservative_params()` (lines 460-481) - 33% parameter reduction
- `list_compatible_models()` (lines 953-1036) - Separate validated/experimental display

**Architecture Detection:**

Reads from model specs JSON:
- `device_type`: N150, N300, P100, etc.
- `env_vars.ARCH_NAME`: wormhole_b0, blackhole
- `status`: COMPLETE, FUNCTIONAL, EXPERIMENTAL
- `param_count`: Model size in billions

**Conservative Parameters:**

Experimental models automatically get reduced parameters to minimize OOM:
- `max_context`: 67% of original (e.g., 65536 → 43,008)
- `max_num_seqs`: 67% of original (e.g., 16 → 10)
- Applied in `apply_conservative_params()`
- Marked with `_is_experimental: true` flag

**Benefits for Blackhole P100:**

- Official P100 models show in validated list (with EXPERIMENTAL badge)
- Other Blackhole models (P150, P150X4) show as experimental
- Conservative params reduce risk of OOM on unvalidated configs
- Clear compatibility reasons help users make informed decisions

### Model Specs Caching (v0.0.35)

**Problem:** Fetching model specs from GitHub on every run is slow and wasteful.

**Solution:** Cache model specs locally for 1 hour.

**Implementation:**

Cache location: `~/tt-scratchpad/cache/`
- `model_specs.json` - Cached specifications
- `model_specs_timestamp.txt` - Unix timestamp of cache creation

**Behavior:**

1. **First run:** Fetches from GitHub, saves to cache
   ```
   ℹ Fetching model specifications from tt-inference-server...
   ✓ Fetched 247 model specifications
   ℹ Cached to ~/tt-scratchpad/cache/model_specs.json
   ```

2. **Subsequent runs (< 1 hour):** Uses cache
   ```
   ℹ Using cached model specifications (15 minutes old)
   ✓ Loaded 247 model specifications from cache
   ```

3. **After 1 hour:** Automatically refreshes from GitHub

4. **Manual refresh:** Use `--refresh-cache` flag
   ```bash
   python3 tt-jukebox.py --list --refresh-cache
   ```

**Benefits:**

- ✅ Faster startup (no network delay)
- ✅ Works offline (if cache exists)
- ✅ Reduces GitHub API load
- ✅ Still stays current (1 hour TTL)

**Code:**

File: `content/templates/tt-jukebox.py`
- `fetch_model_specs(force_refresh=False)` (lines 287-375)
- Creates `~/tt-scratchpad/cache/` directory automatically
- Checks timestamp, falls back to fetch if stale
- Saves both JSON and timestamp on successful fetch

### Bug Fixes (v0.0.35)

**Fixed: NoneType comparison error in experimental filtering**

**Problem:** Some model specs have `param_count: null` in JSON, causing `'<=' not supported between instances of 'NoneType' and 'int'` error when using `--show-experimental`.

**Fix:** Added None check before comparison:
```python
param_count = spec.get('param_count')
if param_count is None:
    param_count = 999  # Unknown size, assume large
```

**Task Aliases Added:**
- `video` → maps to `generate_video` (searches for video models)
- `image` → maps to `generate_image` (searches for image models)

**Usage:**
```bash
# Now works without error
python3 tt-jukebox.py video --show-experimental

# Shorter aliases
python3 tt-jukebox.py video
python3 tt-jukebox.py image
```

## Lesson 11: Image Classification with TT-Forge (2025-11-14)

**Status:** Implemented with critical environment variable fixes (v0.0.50)

### Overview

TT-Forge is Tenstorrent's MLIR-based compiler that aims to run PyTorch models on TT hardware with less manual kernel programming than TT-Metal. However, it's under active development and not all models work yet.

**Key lesson approach:**
- Realistic about limitations (many models fail to compile)
- Start with validated models (MobileNetV2, ResNet family)
- Two installation options: build from source (recommended) vs wheels (quick but may fail)
- Visual feedback through image classification

### Critical Discovery: Environment Variable Pollution (v0.0.50)

**Problem:** The #1 cause of `ImportError: undefined symbol` errors is environment variable pollution from TT-Metal installations.

**Root Cause:** From [GitHub issue #529](https://github.com/tenstorrent/tt-forge/issues/529):
- `TT_METAL_HOME` and `TT_METAL_VERSION` environment variables cause TT-Forge to load TT-Metal from outdated system paths
- Even with correct installation, these variables override the build and load the wrong version
- Results in symbol resolution failures

**Solution:** Must unset these variables BEFORE building or running TT-Forge:

```bash
# Critical first step
unset TT_METAL_HOME
unset TT_METAL_VERSION
```

**Permanent fix in `~/.bashrc`:**
```bash
# Prevent TT-Metal environment pollution for forge
unset TT_METAL_HOME
unset TT_METAL_VERSION
```

### Implementation Changes (v0.0.50)

**1. Updated Lesson Content:** `content/lessons/11-forge-image-classification.md`
- Added prominent warning about environment variables at top of Step 1
- Updated both build-from-source and wheel installation commands to include `unset` statements
- Completely rewrote troubleshooting section to prioritize environment variables as ROOT CAUSE #1 (90% of cases)
- Added links to GitHub issue #529 for reference

**2. Updated Terminal Commands:** `src/commands/terminalCommands.ts`
```typescript
BUILD_FORGE_FROM_SOURCE: {
  template: 'unset TT_METAL_HOME && unset TT_METAL_VERSION && sudo mkdir -p ...',
  description: 'Builds TT-Forge from source... Clears environment variables first to prevent conflicts.',
}

INSTALL_FORGE: {
  template: 'unset TT_METAL_HOME && unset TT_METAL_VERSION && python3 -m venv ...',
  description: 'Creates venv and installs TT-Forge-FE wheels... Clears environment variables first to prevent conflicts.',
}
```

**3. Version Bump:** `package.json` → v0.0.50

### Installation Options

**Option A: Build from Source (Recommended)**
- Official CMake-based build process
- Guarantees compatibility with your exact TT-Metal version
- Builds against `/opt/ttforge-toolchain` and `/opt/ttmlir-toolchain`
- Requires clang-17, cmake, ninja-build
- Takes 10-20 minutes (one-time cost)

**Option B: Wheel Installation**
- Quick installation from Tenstorrent PyPI
- May have version mismatches (wheels built against specific TT-Metal versions)
- Useful for quick prototyping if willing to troubleshoot

### Model Selection: MobileNetV2

**Why this model:**
- ✅ Validated in tt-forge-models repository (confirmed working)
- ✅ Lightweight (3.5M parameters)
- ✅ Standard CNN architecture (no exotic operators)
- ✅ Fast compilation (simpler graph than larger models)
- ✅ Visual feedback (1000 ImageNet classes)

**Realistic expectations:**
- Not all PyTorch models will compile
- Start with validated examples from tt-forge-models (169 models)
- Operator coverage expanding but incomplete
- Compilation failures are normal for unvalidated models

### Workflow

1. **Clear environment variables** (CRITICAL)
2. **Install TT-Forge** (build from source or wheels)
3. **Test installation** (verify forge module loads)
4. **Create classifier script** (MobileNetV2 with forge.compile())
5. **Run classification** (first compilation takes 2-5 minutes)
6. **Classify custom images** (subsequent runs faster with caching)

### Key Technical Details

**forge.compile() API:**
```python
import forge

# Create sample input for shape inference
sample_input = torch.randn(1, 3, 224, 224)  # Batch, Channels, Height, Width

# Compile for TT hardware
compiled_model = forge.compile(model, sample_inputs=[sample_input])

# Run inference
output = compiled_model(input_tensor)
```

**What happens during compilation:**
1. Graph capture: Traces PyTorch operations
2. Operator validation: Checks if all ops are supported
3. Optimization: Applies fusion, layout transforms
4. Lowering: Converts to TTNN operations (TT-Metal layer)
5. Device mapping: Allocates tensors, schedules execution
6. JIT compilation: Generates device kernels

**Can fail if:**
- Unsupported operators encountered
- Dynamic shapes or control flow
- Memory constraints exceeded
- Operator combinations not validated

### Troubleshooting Priority

**90% of symbol errors:** Environment variable pollution
- Check `echo $TT_METAL_HOME` and `echo $TT_METAL_VERSION`
- Unset both before running forge
- Add to `~/.bashrc` for permanent fix

**10% of symbol errors:** True version mismatch
- Wheels built against different TT-Metal version
- Solution: Build from source with both repos on main

### Files Modified

**content/lessons/11-forge-image-classification.md:**
- Added environment variable warning section
- Updated installation commands with `unset` statements
- Rewrote troubleshooting to prioritize environment variables
- Added GitHub issue #529 references

**content/templates/tt-forge-classifier.py:**
- Complete MobileNetV2 classification script
- forge.compile() usage example
- ImageNet preprocessing
- Top-5 prediction display

**src/commands/terminalCommands.ts:**
- BUILD_FORGE_FROM_SOURCE: Prepended with `unset TT_METAL_HOME && unset TT_METAL_VERSION`
- INSTALL_FORGE: Prepended with `unset TT_METAL_HOME && unset TT_METAL_VERSION`
- TEST_FORGE_INSTALL: Tests forge import and device detection
- CREATE_FORGE_CLASSIFIER: Copies template to ~/tt-scratchpad
- RUN_FORGE_CLASSIFIER: Activates forge env and runs classifier

**src/extension.ts:**
- Added forge terminal types
- Registered 5 forge commands
- Command handlers with proper user feedback

**package.json:**
- Version bumped to 0.0.50
- Added walkthrough step between Jukebox and Bounty Program
- Registered forge commands

**content/welcome/welcome.html:**
- Added Lesson 11 card with 🔨 icon

### Key Takeaways

**1. Environment variables are critical**
- Must unset `TT_METAL_HOME` and `TT_METAL_VERSION` before using forge
- This is the #1 cause of ImportError issues (90% of cases)
- Make permanent by adding to `~/.bashrc`

**2. Start with validated models**
- 169 models in tt-forge-models are tested/confirmed working
- Compilation failures are normal for unvalidated models
- Operator coverage expanding but incomplete

**3. Build from source is most reliable**
- Guarantees compatibility with your TT-Metal version
- Avoids wheel version mismatch issues
- Better for development and experimentation

**4. Realistic expectations**
- TT-Forge is under active development
- Not all PyTorch models will compile
- Start with validated examples
- File issues to help the community

### Resources

- TT-Forge Overview: https://github.com/tenstorrent/tt-forge
- TT-Forge-FE: https://github.com/tenstorrent/tt-forge-fe
- TT-Forge-Models (169 validated): https://github.com/tenstorrent/tt-forge-models
- Environment variable issue: https://github.com/tenstorrent/tt-forge/issues/529
- Discord: https://discord.gg/tenstorrent

