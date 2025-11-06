# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension for Tenstorrent hardware setup and development. The extension provides:

1. **Interactive Walkthroughs** - Step-by-step guides using VSCode's native Walkthroughs API
2. **Device Status Monitoring** - Real-time statusbar integration with tt-smi for device monitoring
3. **VSCode Chat Integration** - @tenstorrent chat participant powered by local vLLM server
4. **Template Scripts** - Production-ready Python scripts for inference and API servers

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

