/**
 * Tenstorrent Developer Extension
 *
 * This extension provides a walkthrough-based setup experience for Tenstorrent
 * hardware development. The walkthrough guides users through:
 *   1. Hardware detection (tt-smi)
 *   2. Installation verification (tt-metal test)
 *   3. Model downloading (Hugging Face CLI)
 *
 * Architecture:
 * - Content is defined in markdown files (content/lessons/*.md)
 * - Walkthrough structure is defined in package.json (contributes.walkthroughs)
 * - This file only registers commands that execute terminal operations
 *
 * Technical writers can edit lesson content without touching this code!
 */

import * as vscode from 'vscode';

// ============================================================================
// Global State
// ============================================================================

/**
 * Global extension context for accessing persistent state across commands.
 * Set during activation and used by commands that need to store/retrieve data.
 */
let extensionContext: vscode.ExtensionContext;

/**
 * Storage keys for persistent state
 */
const STATE_KEYS = {
  TT_METAL_PATH: 'ttMetalPath',
  MODEL_PATH: 'modelPath',
};

// ============================================================================
// Terminal Management
// ============================================================================

/**
 * Stores references to terminals used by the walkthrough steps.
 * Each step gets its own dedicated terminal for better organization.
 */
const terminals = {
  hardwareDetection: undefined as vscode.Terminal | undefined,
  verifyInstallation: undefined as vscode.Terminal | undefined,
  modelDownload: undefined as vscode.Terminal | undefined,
};

/**
 * Gets or creates a terminal with the specified name.
 * Reuses existing terminals if they're still alive.
 *
 * @param name - Display name for the terminal
 * @param terminalRef - Reference to store/retrieve the terminal
 * @returns Active terminal instance
 */
function getOrCreateTerminal(
  name: string,
  terminalRef: keyof typeof terminals
): vscode.Terminal {
  // Check if terminal still exists
  if (terminals[terminalRef] && vscode.window.terminals.includes(terminals[terminalRef]!)) {
    return terminals[terminalRef]!;
  }

  // Create new terminal with workspace root as cwd
  const terminal = vscode.window.createTerminal({
    name,
    cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
  });

  terminals[terminalRef] = terminal;
  return terminal;
}

/**
 * Executes a command in the specified terminal.
 * Shows the terminal to the user so they can see the output.
 *
 * @param terminal - The terminal to execute the command in
 * @param command - The shell command to execute
 */
function runInTerminal(terminal: vscode.Terminal, command: string): void {
  terminal.show();
  terminal.sendText(command);
}

// ============================================================================
// Command Handlers
// ============================================================================

/**
 * Command: tenstorrent.runHardwareDetection
 *
 * Runs the tt-smi command to detect and display connected Tenstorrent devices.
 * This is Step 1 in the walkthrough.
 */
function runHardwareDetection(): void {
  const terminal = getOrCreateTerminal('Hardware Detection', 'hardwareDetection');
  runInTerminal(terminal, 'tt-smi');

  vscode.window.showInformationMessage(
    'Running hardware detection. Check the terminal for results.'
  );
}

/**
 * Command: tenstorrent.verifyInstallation
 *
 * Runs a test program to verify tt-metal is properly installed and configured.
 * This is Step 2 in the walkthrough.
 */
function verifyInstallation(): void {
  const terminal = getOrCreateTerminal('TT-Metal Verification', 'verifyInstallation');
  runInTerminal(terminal, 'python3 -m ttnn.examples.usage.run_op_on_device');

  vscode.window.showInformationMessage(
    'Running installation verification. Check the terminal for results.'
  );
}

/**
 * Command: tenstorrent.setHuggingFaceToken
 *
 * Prompts the user for their Hugging Face token and sets it as an environment
 * variable in the model download terminal. This is Step 3a in the walkthrough.
 */
async function setHuggingFaceToken(): Promise<void> {
  // Prompt user for their HF token (password input to hide the token)
  const token = await vscode.window.showInputBox({
    prompt: 'Enter your Hugging Face access token',
    placeHolder: 'hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    password: true, // Hide the token input
    ignoreFocusOut: true, // Don't dismiss if user clicks elsewhere
  });

  if (!token) {
    vscode.window.showWarningMessage('Hugging Face token is required to download models.');
    return;
  }

  // Set the token as an environment variable in the terminal
  const terminal = getOrCreateTerminal('Model Download', 'modelDownload');
  runInTerminal(terminal, `export HF_TOKEN="${token}"`);

  vscode.window.showInformationMessage(
    'Hugging Face token set. You can now authenticate and download models.'
  );
}

/**
 * Command: tenstorrent.loginHuggingFace
 *
 * Authenticates with Hugging Face using the token stored in HF_TOKEN.
 * This is Step 3b in the walkthrough.
 */
function loginHuggingFace(): void {
  const terminal = getOrCreateTerminal('Model Download', 'modelDownload');
  runInTerminal(terminal, "huggingface-cli login --token \"$HF_TOKEN\"");

  vscode.window.showInformationMessage(
    'Authenticating with Hugging Face. Check the terminal for results.'
  );
}

/**
 * Command: tenstorrent.downloadModel
 *
 * Downloads the Llama-3.1-8B-Instruct model from Hugging Face to ~/models/.
 * Uses absolute path to ensure predictable location for inference scripts.
 * This is Step 3c in the walkthrough.
 */
function downloadModel(): void {
  const terminal = getOrCreateTerminal('Model Download', 'modelDownload');

  // Create models directory and download to absolute path
  // This ensures the model is in a predictable location for the inference script
  runInTerminal(
    terminal,
    'mkdir -p ~/models && huggingface-cli download meta-llama/Llama-3.1-8B-Instruct --include "original/*" --local-dir ~/models/Llama-3.1-8B-Instruct'
  );

  vscode.window.showInformationMessage(
    'Downloading model to ~/models/Llama-3.1-8B-Instruct. This is ~16GB and may take several minutes. Check the terminal for progress.'
  );
}

/**
 * Command: tenstorrent.cloneTTMetal
 *
 * Checks if ~/tt-metal exists, and offers to use it or prompt for new location.
 * Always asks the user before cloning to respect their filesystem preferences.
 * This is Step 3d in the walkthrough.
 */
async function cloneTTMetal(): Promise<void> {
  const fs = await import('fs');
  const os = await import('os');
  const path = await import('path');

  // Expand ~ to home directory
  const homeDir = os.homedir();
  const defaultTTMetalPath = path.join(homeDir, 'tt-metal');

  // Check if default tt-metal directory exists
  if (fs.existsSync(defaultTTMetalPath)) {
    // Directory exists - offer choice to user
    const choice = await vscode.window.showInformationMessage(
      `Found existing tt-metal installation at ${defaultTTMetalPath}`,
      'Use Existing',
      'Clone to Different Location'
    );

    if (choice === 'Use Existing') {
      // Store the path for use in subsequent commands
      await extensionContext.globalState.update(STATE_KEYS.TT_METAL_PATH, defaultTTMetalPath);

      vscode.window.showInformationMessage(
        `✓ Using existing tt-metal at ${defaultTTMetalPath}. Proceed to setup environment.`
      );
      return;
    } else if (choice === 'Clone to Different Location') {
      // User wants to clone to a different location - ask where
      const userPath = await vscode.window.showInputBox({
        prompt: 'Enter the full path where you want to clone tt-metal',
        placeHolder: '/home/user/my-projects/tt-metal',
        value: defaultTTMetalPath,
        ignoreFocusOut: true,
      });

      if (!userPath) {
        vscode.window.showWarningMessage('Clone cancelled. No path provided.');
        return;
      }

      // Validate and clone to user-specified path
      const parentDir = path.dirname(userPath);
      if (!fs.existsSync(parentDir)) {
        vscode.window.showErrorMessage(
          `Parent directory does not exist: ${parentDir}. Please create it first.`
        );
        return;
      }

      if (fs.existsSync(userPath)) {
        vscode.window.showErrorMessage(
          `Directory already exists: ${userPath}. Please choose a different location.`
        );
        return;
      }

      // Clone to user-specified location and store the path
      await extensionContext.globalState.update(STATE_KEYS.TT_METAL_PATH, userPath);

      const terminal = getOrCreateTerminal('Model Download', 'modelDownload');
      runInTerminal(
        terminal,
        `git clone https://github.com/tenstorrent/tt-metal.git "${userPath}" --recurse-submodules`
      );

      vscode.window.showInformationMessage(
        `Cloning tt-metal to ${userPath}. This may take several minutes. Check the terminal for progress.`
      );
    }
    // If user cancels (clicks X), do nothing
  } else {
    // Directory doesn't exist - ask user where to clone
    const choice = await vscode.window.showInformationMessage(
      'TT-Metal repository not found. Would you like to clone it?',
      'Clone to ~/tt-metal',
      'Choose Different Location'
    );

    if (choice === 'Clone to ~/tt-metal') {
      // Clone to default location and store the path
      await extensionContext.globalState.update(STATE_KEYS.TT_METAL_PATH, defaultTTMetalPath);

      const terminal = getOrCreateTerminal('Model Download', 'modelDownload');
      runInTerminal(
        terminal,
        `git clone https://github.com/tenstorrent/tt-metal.git "${defaultTTMetalPath}" --recurse-submodules`
      );

      vscode.window.showInformationMessage(
        `Cloning tt-metal to ${defaultTTMetalPath}. This may take several minutes. Check the terminal for progress.`
      );
    } else if (choice === 'Choose Different Location') {
      // Ask user for custom path
      const userPath = await vscode.window.showInputBox({
        prompt: 'Enter the full path where you want to clone tt-metal',
        placeHolder: '/home/user/my-projects/tt-metal',
        value: defaultTTMetalPath,
        ignoreFocusOut: true,
      });

      if (!userPath) {
        vscode.window.showWarningMessage('Clone cancelled. No path provided.');
        return;
      }

      // Validate and clone to user-specified path
      const parentDir = path.dirname(userPath);
      if (!fs.existsSync(parentDir)) {
        vscode.window.showErrorMessage(
          `Parent directory does not exist: ${parentDir}. Please create it first.`
        );
        return;
      }

      if (fs.existsSync(userPath)) {
        vscode.window.showErrorMessage(
          `Directory already exists: ${userPath}. Please choose a different location.`
        );
        return;
      }

      // Clone to user-specified location and store the path
      await extensionContext.globalState.update(STATE_KEYS.TT_METAL_PATH, userPath);

      const terminal = getOrCreateTerminal('Model Download', 'modelDownload');
      runInTerminal(
        terminal,
        `git clone https://github.com/tenstorrent/tt-metal.git "${userPath}" --recurse-submodules`
      );

      vscode.window.showInformationMessage(
        `Cloning tt-metal to ${userPath}. This may take several minutes. Check the terminal for progress.`
      );
    }
    // If user cancels (clicks X), do nothing
  }
}

/**
 * Command: tenstorrent.setupEnvironment
 *
 * Sets up the Python environment for running inference.
 * Sets PYTHONPATH and installs dependencies from the tt-metal repository.
 * This is Step 3e in the walkthrough.
 */
async function setupEnvironment(): Promise<void> {
  // Get the tt-metal path from stored state (default to ~/tt-metal if not found)
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const defaultPath = path.join(homeDir, 'tt-metal');
  const ttMetalPath = extensionContext.globalState.get<string>(STATE_KEYS.TT_METAL_PATH, defaultPath);

  const terminal = getOrCreateTerminal('Model Download', 'modelDownload');

  // Run setup commands in sequence using the stored path
  runInTerminal(
    terminal,
    `cd "${ttMetalPath}" && export PYTHONPATH=$(pwd) && pip install -r tt_metal/python_env/requirements-dev.txt`
  );

  vscode.window.showInformationMessage(
    `Setting up Python environment in ${ttMetalPath}. This will install required dependencies. Check the terminal for progress.`
  );
}

/**
 * Command: tenstorrent.runInference
 *
 * Runs the Llama inference demo using pytest.
 * Sets LLAMA_DIR environment variable to point to the downloaded model.
 * This is Step 3f in the walkthrough - the final step!
 */
async function runInference(): Promise<void> {
  // Get the tt-metal path from stored state (default to ~/tt-metal if not found)
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const defaultPath = path.join(homeDir, 'tt-metal');
  const ttMetalPath = extensionContext.globalState.get<string>(STATE_KEYS.TT_METAL_PATH, defaultPath);

  // Model is downloaded to ~/models/Llama-3.1-8B-Instruct
  const modelPath = path.join(homeDir, 'models', 'Llama-3.1-8B-Instruct', 'original');

  const terminal = getOrCreateTerminal('Model Download', 'modelDownload');

  // Run inference demo with LLAMA_DIR set to the model location
  // and reasonable default parameters for seq length and token generation
  runInTerminal(
    terminal,
    `cd "${ttMetalPath}" && export LLAMA_DIR="${modelPath}" && export PYTHONPATH=$(pwd) && pytest models/tt_transformers/demo/simple_text_demo.py -k performance-batch-1 --max_seq_len 1024 --max_generated_tokens 128`
  );

  vscode.window.showInformationMessage(
    '🚀 Running Llama inference on Tenstorrent hardware! First run may take a few minutes for kernel compilation. Check the terminal for output.'
  );
}

// ============================================================================
// Walkthrough Management
// ============================================================================

/**
 * Command: tenstorrent.openWalkthrough
 *
 * Opens (or reopens) the Tenstorrent setup walkthrough.
 * This allows users to access the walkthrough at any time from the Command Palette.
 */
function openWalkthrough(): void {
  // Open the walkthrough using VS Code's built-in command
  // Format: publisher.extensionName#walkthroughId
  vscode.commands.executeCommand(
    'workbench.action.openWalkthrough',
    'tenstorrent.tenstorrent-developer-extension#tenstorrent.setup',
    false
  );

  vscode.window.showInformationMessage('Opening Tenstorrent Setup Walkthrough...');
}

/**
 * Command: tenstorrent.resetProgress
 *
 * Resets walkthrough progress by clearing stored paths and state.
 * This allows users to start the walkthrough from scratch.
 */
async function resetProgress(): Promise<void> {
  const choice = await vscode.window.showWarningMessage(
    'This will reset your walkthrough progress and clear stored paths. Continue?',
    'Reset Progress',
    'Cancel'
  );

  if (choice === 'Reset Progress') {
    // Clear all stored state
    await extensionContext.globalState.update(STATE_KEYS.TT_METAL_PATH, undefined);
    await extensionContext.globalState.update(STATE_KEYS.MODEL_PATH, undefined);

    vscode.window.showInformationMessage(
      '✓ Walkthrough progress reset. You can now start from the beginning.'
    );

    // Optionally, reopen the walkthrough
    openWalkthrough();
  }
}

// ============================================================================
// Extension Lifecycle
// ============================================================================

/**
 * Called when the extension is activated.
 *
 * Registers all commands that are referenced by the walkthrough steps.
 * The walkthrough itself is automatically shown by VS Code based on the
 * configuration in package.json.
 *
 * @param context - Extension context provided by VS Code
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Tenstorrent Developer Extension is now active');

  // Store context globally for use in command handlers
  extensionContext = context;

  // Register all commands (walkthrough management + step commands)
  const commands = [
    // Walkthrough management commands
    vscode.commands.registerCommand('tenstorrent.openWalkthrough', openWalkthrough),
    vscode.commands.registerCommand('tenstorrent.resetProgress', resetProgress),

    // Walkthrough step commands
    vscode.commands.registerCommand('tenstorrent.runHardwareDetection', runHardwareDetection),
    vscode.commands.registerCommand('tenstorrent.verifyInstallation', verifyInstallation),
    vscode.commands.registerCommand('tenstorrent.setHuggingFaceToken', setHuggingFaceToken),
    vscode.commands.registerCommand('tenstorrent.loginHuggingFace', loginHuggingFace),
    vscode.commands.registerCommand('tenstorrent.downloadModel', downloadModel),
    vscode.commands.registerCommand('tenstorrent.cloneTTMetal', cloneTTMetal),
    vscode.commands.registerCommand('tenstorrent.setupEnvironment', setupEnvironment),
    vscode.commands.registerCommand('tenstorrent.runInference', runInference),
  ];

  // Add all command registrations to subscriptions for proper cleanup
  context.subscriptions.push(...commands);

  // Auto-open the walkthrough on first activation
  const hasSeenWalkthrough = context.globalState.get<boolean>('hasSeenWalkthrough', false);
  if (!hasSeenWalkthrough) {
    // Mark as seen first to avoid reopening if command fails
    context.globalState.update('hasSeenWalkthrough', true);

    // Open the walkthrough automatically on first run
    setTimeout(() => {
      openWalkthrough();
    }, 1000); // Small delay to ensure extension is fully activated
  }
}

/**
 * Called when the extension is deactivated.
 *
 * Cleans up terminal references. Note that VS Code automatically disposes
 * of terminals when the extension is deactivated, but we explicitly clear
 * our references for good measure.
 */
export function deactivate(): void {
  // Clear all terminal references
  // VS Code will handle actual disposal
  terminals.hardwareDetection = undefined;
  terminals.verifyInstallation = undefined;
  terminals.modelDownload = undefined;

  console.log('Tenstorrent Developer Extension has been deactivated');
}
