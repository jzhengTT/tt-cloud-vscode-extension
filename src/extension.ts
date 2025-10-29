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
  runInTerminal(terminal, 'huggingface-cli login --token "$HF_TOKEN"');

  vscode.window.showInformationMessage(
    'Authenticating with Hugging Face. Check the terminal for results.'
  );
}

/**
 * Command: tenstorrent.downloadModel
 *
 * Downloads the Llama-3.1-8B-Instruct model from Hugging Face.
 * This is Step 3c in the walkthrough.
 */
function downloadModel(): void {
  const terminal = getOrCreateTerminal('Model Download', 'modelDownload');
  runInTerminal(
    terminal,
    'huggingface-cli download meta-llama/Llama-3.1-8B-Instruct --include "original/*" --local-dir meta-llama/Llama-3.1-8B-Instruct'
  );

  vscode.window.showInformationMessage(
    'Downloading model. This may take several minutes. Check the terminal for progress.'
  );
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

  // Register all commands referenced by walkthrough steps
  const commands = [
    vscode.commands.registerCommand('tenstorrent.runHardwareDetection', runHardwareDetection),
    vscode.commands.registerCommand('tenstorrent.verifyInstallation', verifyInstallation),
    vscode.commands.registerCommand('tenstorrent.setHuggingFaceToken', setHuggingFaceToken),
    vscode.commands.registerCommand('tenstorrent.loginHuggingFace', loginHuggingFace),
    vscode.commands.registerCommand('tenstorrent.downloadModel', downloadModel),
  ];

  // Add all command registrations to subscriptions for proper cleanup
  context.subscriptions.push(...commands);

  // Optional: Auto-open the walkthrough when extension first activates
  // Uncomment the line below if you want the walkthrough to open automatically
  // vscode.commands.executeCommand('workbench.action.openWalkthrough', 'tenstorrent.tenstorrent-developer-extension#tenstorrent.setup', false);
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
