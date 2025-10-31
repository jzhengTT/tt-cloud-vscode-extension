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

## Lessons 4 & 5: Interactive Chat and HTTP API

### Challenge

The initial approach tried to use tt-metal's internal APIs directly, but this required guessing at imports and understanding complex initialization sequences. The user wanted a minimal solution that:
- Allows personal interaction with the Llama model
- Works with installed tt-metal without modifications
- Doesn't require Docker or complex setup
- Progresses from CLI chat (Lesson 4) to HTTP API (Lesson 5)

### Solution Strategy

Instead of importing tt-metal APIs directly, we leverage the existing `simple_text_demo.py` pytest demo by:

1. **Creating temporary JSON files** with user prompts in the format expected by the demo
2. **Using the `--input_prompts` flag** to pass custom prompts to pytest
3. **Wrapping the execution** in simple Python scripts (REPL and Flask server)

**Key files:**
- `content/templates/tt-chat.py` - Interactive REPL that accepts custom prompts
- `content/templates/tt-api-server.py` - Flask HTTP server for REST API access
- `content/lessons/04-interactive-chat.md` - Lesson on terminal-based chat
- `content/lessons/05-api-server.md` - Lesson on HTTP API with curl

### How It Works

**Lesson 4 (Interactive Chat):**
```python
# Create temp JSON file with user's prompt
prompt_data = [{"prompt": user_input}]
with open(prompt_file, 'w') as f:
    json.dump(prompt_data, f)

# Run pytest with custom prompt
cmd = [
    'pytest', 'models/tt_transformers/demo/simple_text_demo.py',
    '-k', 'performance-batch-1',
    '--input_prompts', str(prompt_file),
    '--instruct', '1',
    '-s',
]
subprocess.run(cmd, check=True)
```

**Lesson 5 (HTTP API):**
- Flask server accepts POST requests with JSON `{"prompt": "..."}`
- Creates temp JSON files same as Lesson 4
- Runs pytest and returns output as JSON
- Provides `/health` and `/chat` endpoints

### Why This Approach?

✅ **Works immediately** - No need to understand tt-metal internals
✅ **Uses proven code** - Leverages the existing demo that's known to work
✅ **Accepts custom prompts** - Real user interaction, not fixed demos
✅ **No modifications** - Works with installed tt-metal as-is
✅ **Good foundation** - Teaches REST patterns and inference basics

### Limitations

- Reloads model for each query (slow but functional)
- Shows full pytest output (verbose but informative)
- First run takes 2-5 minutes for kernel compilation
- Subsequent runs are faster due to caching

### For Production

For production use, you'd want to:
1. Load the model once using `prepare_generator_args()` and `Generator` class
2. Keep model in memory between queries
3. Extract just the inference code without pytest overhead
4. Handle errors and edge cases more gracefully

This requires understanding the internal APIs in `models/tt_transformers/tt/generator.py` and related modules.

## File Structure

```
tt-vscode-ext-clean/
├── content/
│   ├── lessons/           # Markdown content files (editable by technical writers)
│   │   ├── 01-hardware-detection.md
│   │   ├── 02-verify-installation.md
│   │   ├── 03-download-model.md
│   │   ├── 04-interactive-chat.md
│   │   └── 05-api-server.md
│   └── templates/         # Python script templates deployed with extension
│       ├── tt-chat.py     # Interactive REPL wrapper
│       └── tt-api-server.py  # Flask HTTP API wrapper
├── src/
│   ├── extension.ts       # Main extension code (command handlers only)
│   └── types/
│       └── lesson.ts      # Legacy type definitions (not currently used)
├── vendor/
│   └── tt-metal/          # Cloned for reference (not deployed)
├── package.json           # Extension manifest with walkthrough definitions
├── tsconfig.json          # TypeScript configuration
└── CLAUDE.md             # This file
```

## Migration Notes

This extension was refactored from a custom webview-based approach to use VSCode's native Walkthroughs API. Benefits:

- **72% code reduction** (775 lines → 217 lines)
- **Zero custom UI code** (no HTML/CSS/webview management)
- **Native markdown support** (technical writers edit .md files)
- **Automatic completion tracking** (no manual state management)
- **Better UX** (native VS Code theming and integration)

The old approach required custom state management, HTML generation, and webview message passing. The new approach is declarative and leverages VSCode's built-in capabilities.
