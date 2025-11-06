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
import { TERMINAL_COMMANDS, replaceVariables } from './commands/terminalCommands';

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
  STATUSBAR_UPDATE_INTERVAL: 'statusbarUpdateInterval',
  STATUSBAR_ENABLED: 'statusbarEnabled',
};

/**
 * Model configuration type
 */
interface ModelConfig {
  /** HuggingFace model ID (used for downloading and API requests) */
  huggingfaceId: string;
  /** Local directory name (where model is stored) */
  localDirName: string;
  /** Subdirectory for Meta's original format (used by Direct API), if applicable */
  originalSubdir?: string;
  /** Display name for UI */
  displayName: string;
  /** Model size for user information */
  size: string;
  /** Model type (llm, image, etc.) */
  type: 'llm' | 'image' | 'multimodal';
}

/**
 * Model Registry
 * Extensible registry of all models supported by the extension.
 * Add new models here to make them available throughout the extension.
 */
const MODEL_REGISTRY: Record<string, ModelConfig> = {
  'llama-3.1-8b': {
    huggingfaceId: 'meta-llama/Llama-3.1-8B-Instruct',
    localDirName: 'Llama-3.1-8B-Instruct',
    originalSubdir: 'original',
    displayName: 'Llama 3.1 8B Instruct',
    size: '~16GB',
    type: 'llm',
  },
  // Future models can be added here as they become compatible with tt-metal:
  // 'llama-3.2-9b': {
  //   huggingfaceId: 'meta-llama/Llama-3.2-9B-Instruct',
  //   localDirName: 'Llama-3.2-9B-Instruct',
  //   originalSubdir: 'original',
  //   displayName: 'Llama 3.2 9B Instruct',
  //   size: '~18GB',
  //   type: 'llm',
  // },
  // 'sd-3.5-large': {
  //   huggingfaceId: 'stabilityai/stable-diffusion-3.5-large',
  //   localDirName: 'stable-diffusion-3.5-large',
  //   displayName: 'Stable Diffusion 3.5 Large',
  //   size: '~10GB',
  //   type: 'image',
  // },
} as const;

/**
 * Default model key used throughout the extension
 * Change this to switch the default model for all lessons
 */
const DEFAULT_MODEL_KEY = 'llama-3.1-8b';

/**
 * Helper function to get a model config by key
 */
function getModelConfig(modelKey: string = DEFAULT_MODEL_KEY): ModelConfig {
  const config = MODEL_REGISTRY[modelKey];
  if (!config) {
    throw new Error(`Model '${modelKey}' not found in MODEL_REGISTRY. Available models: ${Object.keys(MODEL_REGISTRY).join(', ')}`);
  }
  return config;
}

/**
 * Helper functions for model paths
 */
async function getModelBasePath(modelKey: string = DEFAULT_MODEL_KEY): Promise<string> {
  const os = await import('os');
  const path = await import('path');
  const config = getModelConfig(modelKey);
  return path.join(os.homedir(), 'models', config.localDirName);
}

async function getModelOriginalPath(modelKey: string = DEFAULT_MODEL_KEY): Promise<string> {
  const path = await import('path');
  const config = getModelConfig(modelKey);
  const basePath = await getModelBasePath(modelKey);

  if (!config.originalSubdir) {
    throw new Error(`Model '${modelKey}' does not have an originalSubdir. This model may not support Direct API.`);
  }

  return path.join(basePath, config.originalSubdir);
}

// ============================================================================
// Device Status Monitoring
// ============================================================================

/**
 * Cached device information to avoid excessive tt-smi calls
 */
interface DeviceInfo {
  deviceType: string | null;    // e.g., "N150", "N300", "T3K"
  firmwareVersion: string | null;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  lastChecked: number;
}

let cachedDeviceInfo: DeviceInfo = {
  deviceType: null,
  firmwareVersion: null,
  status: 'unknown',
  lastChecked: 0,
};

let statusBarItem: vscode.StatusBarItem | undefined;
let statusUpdateTimer: NodeJS.Timeout | undefined;

/**
 * Parses tt-smi output to extract device information.
 * Supports both JSON format (tt-smi -s) and text format.
 *
 * @param output - Raw output from tt-smi command
 * @returns DeviceInfo object with parsed data
 */
function parseDeviceInfo(output: string): DeviceInfo {
  let deviceType: string | null = null;
  let firmwareVersion: string | null = null;
  let status: 'healthy' | 'warning' | 'error' | 'unknown' = 'unknown';

  // Check for error indicators first
  const hasError = output.toLowerCase().includes('error') ||
                   output.toLowerCase().includes('failed') ||
                   output.toLowerCase().includes('timeout');

  // Try to parse as JSON first (tt-smi -s format)
  try {
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);

      // Extract device info from JSON
      if (data.device_info && Array.isArray(data.device_info) && data.device_info.length > 0) {
        const device = data.device_info[0];

        // Get board type (e.g., "n150 L" -> "N150")
        if (device.board_info && device.board_info.board_type) {
          const boardType = device.board_info.board_type.toUpperCase();
          // Extract just the device model (N150, N300, etc.)
          const match = boardType.match(/([NP]\d+)/);
          deviceType = match ? match[1] : boardType.split(' ')[0];
        }

        // Get firmware version
        if (device.firmwares && device.firmwares.fw_bundle_version) {
          firmwareVersion = device.firmwares.fw_bundle_version;
        }

        // Check DRAM and device status
        if (device.board_info) {
          const dramStatus = device.board_info.dram_status;
          if (dramStatus === true || dramStatus === 'true') {
            status = hasError ? 'warning' : 'healthy';
          } else {
            status = 'warning';
          }
        } else {
          status = hasError ? 'error' : 'healthy';
        }
      }
    }
  } catch (e) {
    // Not JSON, try text parsing
    const lines = output.split('\n');

    for (const line of lines) {
      // Parse device type from board type line
      // Example: "Board Type: N150" or "board_type": "n150 L"
      if (line.includes('Board Type:') || line.includes('board_type')) {
        const match = line.match(/(?:Board Type:|board_type.*?):\s*["\']?([nNpP]\d+)/i);
        if (match) {
          deviceType = match[1].toUpperCase();
        }
      }

      // Parse firmware version
      // Example: "FW Version: 18.7.0" or "fw_bundle_version": "18.7.0.0"
      if (line.includes('FW Version:') || line.includes('fw_bundle_version') || line.includes('Firmware Version:')) {
        const match = line.match(/(?:FW|Firmware|fw_bundle_version).*?:\s*["\']?(\d+\.\d+\.\d+)/i);
        if (match) {
          firmwareVersion = match[1];
        }
      }
    }

    // If we found device info and no errors, mark as healthy
    if (deviceType) {
      status = hasError ? 'warning' : 'healthy';
    }
  }

  return {
    deviceType,
    firmwareVersion,
    status,
    lastChecked: Date.now(),
  };
}

/**
 * Runs tt-smi and updates cached device info.
 * Uses child_process.exec to capture output without showing terminal.
 * Uses tt-smi -s for structured JSON output.
 *
 * @returns Promise<DeviceInfo> - Updated device information
 */
async function updateDeviceStatus(): Promise<DeviceInfo> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    // Use tt-smi -s for structured JSON output
    const { stdout, stderr } = await execAsync('tt-smi -s', { timeout: 10000 });
    const output = stdout + stderr;

    cachedDeviceInfo = parseDeviceInfo(output);
    updateStatusBarItem();

    return cachedDeviceInfo;
  } catch (error) {
    // tt-smi not found or failed
    cachedDeviceInfo = {
      deviceType: null,
      firmwareVersion: null,
      status: 'error',
      lastChecked: Date.now(),
    };
    updateStatusBarItem();

    return cachedDeviceInfo;
  }
}

/**
 * Updates the statusbar item text and icon based on cached device info.
 */
function updateStatusBarItem(): void {
  if (!statusBarItem) return;

  const { deviceType, status } = cachedDeviceInfo;

  // Set icon based on status
  let icon = '$(question)'; // unknown
  if (status === 'healthy') {
    icon = '$(check)';
  } else if (status === 'warning') {
    icon = '$(warning)';
  } else if (status === 'error') {
    icon = '$(x)';
  }

  // Set text
  if (deviceType) {
    statusBarItem.text = `${icon} TT: ${deviceType}`;
    statusBarItem.tooltip = `Tenstorrent ${deviceType} - Click for device actions`;
  } else {
    statusBarItem.text = `${icon} TT: No device`;
    statusBarItem.tooltip = 'No Tenstorrent device detected - Click for options';
  }

  statusBarItem.show();
}

/**
 * Shows quick actions menu when statusbar item is clicked.
 */
async function showDeviceActionsMenu(): Promise<void> {
  const { deviceType, firmwareVersion, lastChecked } = cachedDeviceInfo;

  // Calculate time since last check
  const minutesAgo = Math.floor((Date.now() - lastChecked) / 60000);
  const timeStr = minutesAgo === 0 ? 'just now' : `${minutesAgo}m ago`;

  const items: vscode.QuickPickItem[] = [
    {
      label: '$(sync) Refresh Status',
      description: `Last checked: ${timeStr}`,
      detail: 'Run tt-smi to update device status',
    },
    {
      label: '$(terminal) Check Device Status',
      description: 'Open terminal',
      detail: 'Run tt-smi in a terminal window to see full output',
    },
  ];

  // Add firmware info if available
  if (firmwareVersion) {
    items.push({
      label: '$(info) Firmware Version',
      description: firmwareVersion,
      detail: 'Current firmware version on the device',
    });
  }

  // Add device-specific actions
  if (deviceType) {
    items.push(
      {
        label: '$(debug-restart) Reset Device',
        description: 'Run tt-smi -r',
        detail: 'Software reset of the Tenstorrent device',
      },
      {
        label: '$(clear-all) Clear Device State',
        description: 'Clear /dev/shm and device state',
        detail: 'Remove cached data and device state (requires sudo)',
      }
    );
  }

  // Configuration options
  const autoUpdateEnabled = extensionContext.globalState.get<boolean>(
    STATE_KEYS.STATUSBAR_ENABLED,
    false
  );

  items.push(
    {
      label: '$(settings-gear) Configure Update Interval',
      description: 'Change auto-update frequency',
      detail: 'Set how often device status is checked automatically',
    },
    {
      label: autoUpdateEnabled ? '$(debug-pause) Disable Auto-Update' : '$(debug-start) Enable Auto-Update',
      description: autoUpdateEnabled ? 'Currently: ON' : 'Currently: OFF',
      detail: 'Turn periodic device status updates on or off',
    }
  );

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: deviceType
      ? `Tenstorrent ${deviceType} Device Actions`
      : 'Tenstorrent Device Actions',
  });

  if (!selected) return;

  // Handle selection
  if (selected.label.includes('Refresh Status')) {
    statusBarItem!.text = '$(sync~spin) TT: Checking...';
    await updateDeviceStatus();
    vscode.window.showInformationMessage(
      cachedDeviceInfo.deviceType
        ? `✓ Device found: ${cachedDeviceInfo.deviceType}`
        : '⚠️ No Tenstorrent device detected'
    );
  } else if (selected.label.includes('Check Device Status')) {
    vscode.commands.executeCommand('tenstorrent.runHardwareDetection');
  } else if (selected.label.includes('Firmware Version')) {
    vscode.window.showInformationMessage(
      `Firmware Version: ${firmwareVersion || 'Unknown'}`
    );
  } else if (selected.label.includes('Reset Device')) {
    vscode.commands.executeCommand('tenstorrent.resetDevice');
  } else if (selected.label.includes('Clear Device State')) {
    vscode.commands.executeCommand('tenstorrent.clearDeviceState');
  } else if (selected.label.includes('Configure Update Interval')) {
    await configureUpdateInterval();
  } else if (selected.label.includes('Auto-Update')) {
    await toggleAutoUpdate();
  }
}

/**
 * Allows user to configure the auto-update interval.
 */
async function configureUpdateInterval(): Promise<void> {
  const intervals = [
    { label: '30 seconds', value: 30 },
    { label: '1 minute', value: 60 },
    { label: '2 minutes', value: 120 },
    { label: '5 minutes', value: 300 },
    { label: '10 minutes', value: 600 },
  ];

  const selected = await vscode.window.showQuickPick(intervals, {
    placeHolder: 'Select how often to check device status',
  });

  if (selected) {
    await extensionContext.globalState.update(
      STATE_KEYS.STATUSBAR_UPDATE_INTERVAL,
      selected.value
    );

    // Restart the update timer
    startStatusUpdateTimer();

    vscode.window.showInformationMessage(
      `Device status will update every ${selected.label}`
    );
  }
}

/**
 * Toggles auto-update on or off.
 */
async function toggleAutoUpdate(): Promise<void> {
  const currentEnabled = extensionContext.globalState.get<boolean>(
    STATE_KEYS.STATUSBAR_ENABLED,
    false  // Default is false (disabled)
  );

  await extensionContext.globalState.update(
    STATE_KEYS.STATUSBAR_ENABLED,
    !currentEnabled
  );

  if (!currentEnabled) {
    // Enabling
    startStatusUpdateTimer();
    vscode.window.showInformationMessage('✓ Auto-update enabled. Device status will refresh automatically.');
  } else {
    // Disabling
    stopStatusUpdateTimer();
    vscode.window.showInformationMessage('✓ Auto-update disabled. Click "Refresh Status" to check device manually.');
  }
}

/**
 * Starts the periodic status update timer.
 */
function startStatusUpdateTimer(): void {
  // Stop existing timer
  stopStatusUpdateTimer();

  // Check if auto-update is enabled (default: false)
  const enabled = extensionContext.globalState.get<boolean>(
    STATE_KEYS.STATUSBAR_ENABLED,
    false  // Changed from true to false - auto-polling disabled by default
  );

  if (!enabled) return;

  // Get update interval (default 60 seconds)
  const intervalSeconds = extensionContext.globalState.get<number>(
    STATE_KEYS.STATUSBAR_UPDATE_INTERVAL,
    60
  );

  // Run initial check
  updateDeviceStatus();

  // Start periodic updates
  statusUpdateTimer = setInterval(() => {
    updateDeviceStatus();
  }, intervalSeconds * 1000);
}

/**
 * Stops the periodic status update timer.
 */
function stopStatusUpdateTimer(): void {
  if (statusUpdateTimer) {
    clearInterval(statusUpdateTimer);
    statusUpdateTimer = undefined;
  }
}

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
  interactiveChat: undefined as vscode.Terminal | undefined,
  apiServer: undefined as vscode.Terminal | undefined,
  vllmServer: undefined as vscode.Terminal | undefined,
  imageGeneration: undefined as vscode.Terminal | undefined,
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

/**
 * Checks if the vLLM server is running and accessible on localhost:8000.
 * Used by chat integration to verify server availability before sending requests.
 *
 * @returns Promise<boolean> - true if server is accessible, false otherwise
 */
async function checkVllmServerRunning(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8000/health');
    return response.ok;
  } catch {
    return false;
  }
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
  const command = TERMINAL_COMMANDS.TT_SMI.template;

  runInTerminal(terminal, command);

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
  const command = TERMINAL_COMMANDS.VERIFY_INSTALLATION.template;

  runInTerminal(terminal, command);

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
  const command = replaceVariables(TERMINAL_COMMANDS.SET_HF_TOKEN.template, { token });

  runInTerminal(terminal, command);

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
  const command = TERMINAL_COMMANDS.LOGIN_HF.template;

  runInTerminal(terminal, command);

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
  const command = TERMINAL_COMMANDS.DOWNLOAD_MODEL.template;

  // Create models directory and download to absolute path
  // This ensures the model is in a predictable location for the inference script
  runInTerminal(terminal, command);

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
      const command = replaceVariables(TERMINAL_COMMANDS.CLONE_TT_METAL.template, {
        path: userPath,
      });

      runInTerminal(terminal, command);

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
      const command = replaceVariables(TERMINAL_COMMANDS.CLONE_TT_METAL.template, {
        path: defaultTTMetalPath,
      });

      runInTerminal(terminal, command);

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
      const command = replaceVariables(TERMINAL_COMMANDS.CLONE_TT_METAL.template, {
        path: userPath,
      });

      runInTerminal(terminal, command);

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
  const command = replaceVariables(TERMINAL_COMMANDS.SETUP_ENVIRONMENT.template, {
    ttMetalPath,
  });

  runInTerminal(terminal, command);

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

  // Model path using constants
  const modelPath = await getModelOriginalPath();

  const terminal = getOrCreateTerminal('Model Download', 'modelDownload');

  // Run inference demo with LLAMA_DIR set to the model location
  // and reasonable default parameters for seq length and token generation
  const command = replaceVariables(TERMINAL_COMMANDS.RUN_INFERENCE.template, {
    ttMetalPath,
    modelPath,
  });

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '🚀 Running Llama inference on Tenstorrent hardware! First run may take a few minutes for kernel compilation. Check the terminal for output.'
  );
}

/**
 * Command: tenstorrent.installInferenceDeps
 *
 * Installs additional Python dependencies required for interactive inference.
 * This is Step 4-1 in the walkthrough - Interactive Chat
 */
function installInferenceDeps(): void {
  const terminal = getOrCreateTerminal('Interactive Chat', 'interactiveChat');
  const command = TERMINAL_COMMANDS.INSTALL_INFERENCE_DEPS.template;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    'Installing inference dependencies (pi and llama-models). This may take 1-2 minutes. Check the terminal for progress.'
  );
}

/**
 * Command: tenstorrent.createChatScript
 *
 * Creates the interactive chat script by copying the template to ~/tt-scratchpad/tt-chat.py
 * This is Step 4-2 in the walkthrough - Interactive Chat
 */
async function createChatScript(): Promise<void> {
  const path = await import('path');
  const fs = await import('fs');
  const os = await import('os');

  // Get the template path from the extension
  const extensionPath = extensionContext.extensionPath;
  const templatePath = path.join(extensionPath, 'content', 'templates', 'tt-chat.py');

  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    vscode.window.showErrorMessage(
      `Template not found at ${templatePath}. Please reinstall the extension.`
    );
    return;
  }

  // Destination path in ~/tt-scratchpad/
  const homeDir = os.homedir();
  const scratchpadDir = path.join(homeDir, 'tt-scratchpad');

  // Create scratchpad directory if it doesn't exist
  if (!fs.existsSync(scratchpadDir)) {
    fs.mkdirSync(scratchpadDir, { recursive: true });
  }

  const destPath = path.join(scratchpadDir, 'tt-chat.py');

  try {
    // Copy the template to scratchpad directory
    fs.copyFileSync(templatePath, destPath);

    // Make it executable
    fs.chmodSync(destPath, 0o755);

    vscode.window.showInformationMessage(
      `✅ Created interactive chat script at ${destPath}. You can now start a chat session!`
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to create chat script: ${error}`
    );
  }
}

/**
 * Command: tenstorrent.startChatSession
 *
 * Starts an interactive chat session with the Llama model.
 * This is Step 4-3 in the walkthrough - Interactive Chat
 */
async function startChatSession(): Promise<void> {
  // Get the tt-metal path from stored state (default to ~/tt-metal if not found)
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const defaultPath = path.join(homeDir, 'tt-metal');
  const ttMetalPath = extensionContext.globalState.get<string>(STATE_KEYS.TT_METAL_PATH, defaultPath);

  // Model path using constants
  const modelPath = await getModelOriginalPath();

  const terminal = getOrCreateTerminal('Interactive Chat', 'interactiveChat');

  // Run the interactive chat script with proper environment setup
  const command = replaceVariables(TERMINAL_COMMANDS.START_CHAT_SESSION.template, {
    ttMetalPath,
    modelPath,
  });

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '💬 Starting interactive chat session. First load may take a few minutes. Type your prompts in the terminal!'
  );
}

/**
 * Command: tenstorrent.createApiServer
 *
 * Creates the API server script by copying the template to ~/tt-scratchpad/tt-api-server.py
 * This is Step 5a in the walkthrough - HTTP API Server
 */
async function createApiServer(): Promise<void> {
  const path = await import('path');
  const fs = await import('fs');
  const os = await import('os');

  // Get the template path from the extension
  const extensionPath = extensionContext.extensionPath;
  const templatePath = path.join(extensionPath, 'content', 'templates', 'tt-api-server.py');

  // Check if template exists
  if (!fs.existsSync(templatePath)) {
    vscode.window.showErrorMessage(
      `Template not found at ${templatePath}. Please reinstall the extension.`
    );
    return;
  }

  // Destination path in ~/tt-scratchpad/
  const homeDir = os.homedir();
  const scratchpadDir = path.join(homeDir, 'tt-scratchpad');

  // Create scratchpad directory if it doesn't exist
  if (!fs.existsSync(scratchpadDir)) {
    fs.mkdirSync(scratchpadDir, { recursive: true });
  }

  const destPath = path.join(scratchpadDir, 'tt-api-server.py');

  try {
    // Copy the template to scratchpad directory
    fs.copyFileSync(templatePath, destPath);

    // Make it executable
    fs.chmodSync(destPath, 0o755);

    vscode.window.showInformationMessage(
      `✅ Created API server script at ${destPath}. Next, install Flask if you haven't already!`
    );
  } catch (error) {
    vscode.window.showErrorMessage(
      `Failed to create API server script: ${error}`
    );
  }
}

/**
 * Command: tenstorrent.installFlask
 *
 * Installs Flask web framework using pip.
 * This is Step 5b in the walkthrough - HTTP API Server
 */
function installFlask(): void {
  const terminal = getOrCreateTerminal('API Server', 'apiServer');
  const command = TERMINAL_COMMANDS.INSTALL_FLASK.template;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    'Installing Flask. This should only take a few seconds. Check the terminal for progress.'
  );
}

/**
 * Command: tenstorrent.startApiServer
 *
 * Starts the Flask API server with the Llama model.
 * This is Step 5c in the walkthrough - HTTP API Server
 */
async function startApiServer(): Promise<void> {
  // Get the tt-metal path from stored state (default to ~/tt-metal if not found)
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const defaultPath = path.join(homeDir, 'tt-metal');
  const ttMetalPath = extensionContext.globalState.get<string>(STATE_KEYS.TT_METAL_PATH, defaultPath);

  // Model path using constants
  const modelPath = await getModelOriginalPath();

  const terminal = getOrCreateTerminal('API Server', 'apiServer');

  // Run the API server with proper environment setup
  const command = replaceVariables(TERMINAL_COMMANDS.START_API_SERVER.template, {
    ttMetalPath,
    modelPath,
  });

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '🚀 Starting API server on port 8080. First load may take a few minutes. Open a second terminal to test with curl!'
  );
}

/**
 * Command: tenstorrent.testApiBasic
 *
 * Tests the API server with a basic curl query.
 * This is Step 5d in the walkthrough - HTTP API Server
 */
function testApiBasic(): void {
  // Use a different terminal for testing so we don't interfere with the server
  const terminal = getOrCreateTerminal('API Test', 'interactiveChat');
  const command = TERMINAL_COMMANDS.TEST_API_BASIC.template;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '🧪 Testing API with basic query. Check the terminal for the response!'
  );
}

/**
 * Command: tenstorrent.testApiMultiple
 *
 * Tests the API server with multiple curl queries.
 * This is Step 5e in the walkthrough - HTTP API Server
 */
function testApiMultiple(): void {
  // Use a different terminal for testing so we don't interfere with the server
  const terminal = getOrCreateTerminal('API Test', 'interactiveChat');
  const command = TERMINAL_COMMANDS.TEST_API_MULTIPLE.template;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '🧪 Testing API with multiple queries. Check the terminal for the responses!'
  );
}

// ============================================================================
// Direct API Commands (Lessons 4-6)
// ============================================================================

/**
 * Command: tenstorrent.createChatScriptDirect
 * Creates the direct API chat script and opens it in the editor
 */
async function createChatScriptDirect(): Promise<void> {
  const path = await import('path');
  const fs = await import('fs');
  const os = await import('os');

  const extensionPath = extensionContext.extensionPath;
  const templatePath = path.join(extensionPath, 'content', 'templates', 'tt-chat-direct.py');

  if (!fs.existsSync(templatePath)) {
    vscode.window.showErrorMessage(
      `Template not found at ${templatePath}. Please reinstall the extension.`
    );
    return;
  }

  const homeDir = os.homedir();
  const scratchpadDir = path.join(homeDir, 'tt-scratchpad');

  // Create scratchpad directory if it doesn't exist
  if (!fs.existsSync(scratchpadDir)) {
    fs.mkdirSync(scratchpadDir, { recursive: true });
  }

  const destPath = path.join(scratchpadDir, 'tt-chat-direct.py');

  try {
    fs.copyFileSync(templatePath, destPath);
    fs.chmodSync(destPath, 0o755);

    // Open the file in the editor
    const doc = await vscode.workspace.openTextDocument(destPath);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
      `✅ Created direct API chat script at ${destPath}. The file is now open - review the code!`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create chat script: ${error}`);
  }
}

/**
 * Command: tenstorrent.startChatSessionDirect
 * Starts the direct API chat session
 */
async function startChatSessionDirect(): Promise<void> {
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const ttMetalPath = path.join(homeDir, 'tt-metal');
  const modelPath = await getModelBasePath();

  const terminal = getOrCreateTerminal('Direct API Chat', 'interactiveChat');

  const command = `cd ${ttMetalPath} && export HF_MODEL=${modelPath} && export PYTHONPATH=$(pwd) && python3 ~/tt-scratchpad/tt-chat-direct.py`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '💬 Starting direct API chat. Model loads once (2-5 min), then queries are fast (1-3 sec)!'
  );
}

/**
 * Command: tenstorrent.createApiServerDirect
 * Creates the direct API server script and opens it in the editor
 */
async function createApiServerDirect(): Promise<void> {
  const path = await import('path');
  const fs = await import('fs');
  const os = await import('os');

  const extensionPath = extensionContext.extensionPath;
  const templatePath = path.join(extensionPath, 'content', 'templates', 'tt-api-server-direct.py');

  if (!fs.existsSync(templatePath)) {
    vscode.window.showErrorMessage(
      `Template not found at ${templatePath}. Please reinstall the extension.`
    );
    return;
  }

  const homeDir = os.homedir();
  const scratchpadDir = path.join(homeDir, 'tt-scratchpad');

  // Create scratchpad directory if it doesn't exist
  if (!fs.existsSync(scratchpadDir)) {
    fs.mkdirSync(scratchpadDir, { recursive: true });
  }

  const destPath = path.join(scratchpadDir, 'tt-api-server-direct.py');

  try {
    fs.copyFileSync(templatePath, destPath);
    fs.chmodSync(destPath, 0o755);

    // Open the file in the editor
    const doc = await vscode.workspace.openTextDocument(destPath);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
      `✅ Created direct API server at ${destPath}. The file is now open - review the code!`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create API server: ${error}`);
  }
}

/**
 * Command: tenstorrent.startApiServerDirect
 * Starts the direct API server
 */
async function startApiServerDirect(): Promise<void> {
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const ttMetalPath = path.join(homeDir, 'tt-metal');
  const modelPath = await getModelBasePath();

  const terminal = getOrCreateTerminal('Direct API Server', 'apiServer');

  const command = `cd ${ttMetalPath} && export HF_MODEL=${modelPath} && export PYTHONPATH=$(pwd) && python3 ~/tt-scratchpad/tt-api-server-direct.py --port 8080`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '🚀 Starting direct API server. Model loads once (2-5 min), then handles requests fast!'
  );
}

/**
 * Command: tenstorrent.testApiBasicDirect
 * Tests the direct API server with a basic query
 */
function testApiBasicDirect(): void {
  const terminal = getOrCreateTerminal('API Test', 'apiServer');

  const command = `curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '{"prompt": "What is machine learning?"}'`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    'Testing direct API server. Check terminal for response!'
  );
}

/**
 * Command: tenstorrent.testApiMultipleDirect
 * Tests the direct API with multiple queries
 */
function testApiMultipleDirect(): void {
  const terminal = getOrCreateTerminal('API Test', 'apiServer');

  const commands = [
    `curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '{"prompt": "Explain neural networks"}'`,
    `echo "\n--- Second query ---\n"`,
    `curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '{"prompt": "Write a haiku about programming"}'`,
    `echo "\n--- Third query ---\n"`,
    `curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '{"prompt": "What are transformers?"}'`
  ];

  runInTerminal(terminal, commands.join(' && '));

  vscode.window.showInformationMessage(
    'Running multiple API tests. Watch the terminal for fast responses!'
  );
}

// vLLM Commands

/**
 * Command: tenstorrent.updateTTMetal
 * Updates and rebuilds TT-Metal to latest main branch
 */
async function updateTTMetal(): Promise<void> {
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const ttMetalPath = path.join(homeDir, 'tt-metal');

  const terminal = getOrCreateTerminal('TT-Metal Update', 'apiServer');

  const command = `cd ${ttMetalPath} && git checkout main && git pull origin main && git submodule update --init --recursive && ./build_metal.sh`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '🔧 Updating and rebuilding TT-Metal. This takes 5-10 minutes. Watch terminal for progress.'
  );
}

/**
 * Command: tenstorrent.cloneVllm
 * Clones the TT vLLM repository
 */
function cloneVllm(): void {
  const terminal = getOrCreateTerminal('vLLM Setup', 'apiServer');

  const command = `cd ~ && git clone --branch dev https://github.com/tenstorrent/vllm.git tt-vllm && cd tt-vllm`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    'Cloning TT vLLM repository. This may take 1-2 minutes...'
  );
}

/**
 * Command: tenstorrent.installVllm
 * Creates a dedicated venv and installs vLLM and dependencies
 */
function installVllm(): void {
  const terminal = getOrCreateTerminal('vLLM Setup', 'apiServer');

  const command = `cd ~/tt-vllm && python3 -m venv ~/tt-vllm-venv && source ~/tt-vllm-venv/bin/activate && pip install --upgrade pip && export vllm_dir=$(pwd) && source $vllm_dir/tt_metal/setup-metal.sh && pip install --upgrade ttnn pytest && pip install fairscale termcolor loguru blobfile fire pytz llama-models==0.0.48 && pip install -e . --extra-index-url https://download.pytorch.org/whl/cpu`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    'Creating venv and installing vLLM with all dependencies (ttnn, pytest, etc). This will take 5-10 minutes. Check terminal for progress.'
  );
}

/**
 * Command: tenstorrent.runVllmOffline
 * Runs vLLM offline inference example with N150 configuration
 * Note: Offline script may show 128K context warnings - this is expected
 */
async function runVllmOffline(): Promise<void> {
  const modelPath = await getModelBasePath();
  const terminal = getOrCreateTerminal('vLLM Offline', 'apiServer');

  const command = `cd ~/tt-vllm && source ~/tt-vllm-venv/bin/activate && export TT_METAL_HOME=~/tt-metal && export HF_MODEL=${modelPath} && export MESH_DEVICE=N150 && export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && source ~/tt-vllm/tt_metal/setup-metal.sh && python examples/offline_inference_tt.py`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    'Running vLLM offline inference (may show context length warnings - this is expected). You can skip to API server if preferred.'
  );
}

/**
 * Command: tenstorrent.startVllmServer
 * Starts the vLLM OpenAI-compatible server with N150 configuration.
 * Creates a custom starter script that registers TT models and uses local model path.
 */
async function startVllmServer(): Promise<void> {
  const path = await import('path');
  const fs = await import('fs');
  const os = await import('os');

  // Create starter script if it doesn't exist
  const homeDir = os.homedir();
  const scratchpadDir = path.join(homeDir, 'tt-scratchpad');
  const starterPath = path.join(scratchpadDir, 'start-vllm-server.py');

  if (!fs.existsSync(scratchpadDir)) {
    fs.mkdirSync(scratchpadDir, { recursive: true });
  }

  if (!fs.existsSync(starterPath)) {
    const extensionPath = extensionContext.extensionPath;
    const templatePath = path.join(extensionPath, 'content', 'templates', 'start-vllm-server.py');

    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, starterPath);
      fs.chmodSync(starterPath, 0o755);
    }
  }

  const modelPath = await getModelBasePath();
  const terminal = getOrCreateTerminal('vLLM Server', 'apiServer');

  const command = `cd ~/tt-vllm && source ~/tt-vllm-venv/bin/activate && export TT_METAL_HOME=~/tt-metal && export MESH_DEVICE=N150 && export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && source ~/tt-vllm/tt_metal/setup-metal.sh && python ~/tt-scratchpad/start-vllm-server.py --model ${modelPath} --host 0.0.0.0 --port 8000 --max-model-len 65536 --max-num-seqs 16 --block-size 64`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '🚀 Starting vLLM server on N150 with local model. First load takes 2-5 minutes...'
  );
}

/**
 * Command: tenstorrent.testVllmOpenai
 * Tests vLLM with OpenAI SDK
 */
function testVllmOpenai(): void {
  const terminal = getOrCreateTerminal('vLLM Test', 'apiServer');
  const modelConfig = getModelConfig(DEFAULT_MODEL_KEY);

  const command = `python3 -c "from openai import OpenAI; client = OpenAI(base_url='http://localhost:8000/v1', api_key='dummy'); response = client.chat.completions.create(model='${modelConfig.huggingfaceId}', messages=[{'role': 'user', 'content': 'What is machine learning?'}], max_tokens=128); print(response.choices[0].message.content)"`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    'Testing vLLM with OpenAI SDK. Check terminal for response!'
  );
}

/**
 * Command: tenstorrent.testVllmCurl
 * Tests vLLM with curl
 */
function testVllmCurl(): void {
  const terminal = getOrCreateTerminal('vLLM Test', 'apiServer');
  const modelConfig = getModelConfig(DEFAULT_MODEL_KEY);

  const command = `curl http://localhost:8000/v1/chat/completions -H "Content-Type: application/json" -d '{"model": "${modelConfig.huggingfaceId}", "messages": [{"role": "user", "content": "Explain neural networks"}], "max_tokens": 128}'`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    'Testing vLLM with curl. Check terminal for OpenAI-formatted response!'
  );
}

// ============================================================================
// Lesson 7 - VSCode Chat Integration
// ============================================================================

/**
 * Command: tenstorrent.startVllmForChat
 * Starts vLLM server for use with VSCode chat integration.
 * Checks if server is already running before starting.
 */
async function startVllmForChat(): Promise<void> {
  // Check if server already running
  const isRunning = await checkVllmServerRunning();

  if (isRunning) {
    vscode.window.showInformationMessage('✅ vLLM server already running on port 8000!');
    return;
  }

  // Start vLLM in background terminal with N150 configuration
  // Create starter script if it doesn't exist
  const path = await import('path');
  const fs = await import('fs');
  const os = await import('os');

  const homeDir = os.homedir();
  const scratchpadDir = path.join(homeDir, 'tt-scratchpad');
  const starterPath = path.join(scratchpadDir, 'start-vllm-server.py');

  if (!fs.existsSync(scratchpadDir)) {
    fs.mkdirSync(scratchpadDir, { recursive: true });
  }

  if (!fs.existsSync(starterPath)) {
    const extensionPath = extensionContext.extensionPath;
    const templatePath = path.join(extensionPath, 'content', 'templates', 'start-vllm-server.py');

    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, starterPath);
      fs.chmodSync(starterPath, 0o755);
    }
  }

  const modelPath = await getModelBasePath();
  const terminal = getOrCreateTerminal('TT vLLM Server', 'vllmServer');

  const command = `cd ~/tt-vllm && source ~/tt-vllm-venv/bin/activate && export TT_METAL_HOME=~/tt-metal && export MESH_DEVICE=N150 && export PYTHONPATH=$TT_METAL_HOME:$PYTHONPATH && source ~/tt-vllm/tt_metal/setup-metal.sh && python ~/tt-scratchpad/start-vllm-server.py --model ${modelPath} --host 0.0.0.0 --port 8000 --max-model-len 65536 --max-num-seqs 16 --block-size 64`;

  runInTerminal(terminal, command);

  const selection = await vscode.window.showInformationMessage(
    '🚀 Starting vLLM server on N150 with TT model registration... This takes 2-5 minutes. Watch the terminal for "Application startup complete."',
    'Show Terminal'
  );

  if (selection === 'Show Terminal') {
    terminal.show();
  }
}

/**
 * Command: tenstorrent.enableChatParticipant
 * Verifies vLLM server is running and confirms chat participant is ready.
 */
async function enableChatParticipant(): Promise<void> {
  // Check if server is running
  const isRunning = await checkVllmServerRunning();

  if (!isRunning) {
    const choice = await vscode.window.showWarningMessage(
      '⚠️ vLLM server not detected on port 8000. Start it first?',
      'Start Server',
      'Cancel'
    );

    if (choice === 'Start Server') {
      await startVllmForChat();
    }
    return;
  }

  const selection = await vscode.window.showInformationMessage(
    '✅ Chat participant enabled! Open chat and type "@tenstorrent" to get started.',
    'Open Chat'
  );

  if (selection === 'Open Chat') {
    vscode.commands.executeCommand('workbench.action.chat.open');
  }
}

/**
 * Command: tenstorrent.testChat
 * Opens the VSCode chat panel with a pre-filled test prompt.
 */
async function testChat(): Promise<void> {
  // Open chat with pre-filled prompt
  await vscode.commands.executeCommand('workbench.action.chat.open', {
    query: '@tenstorrent Explain what async/await does in JavaScript'
  });
}

/**
 * Chat Participant Handler
 * Handles chat requests from the @tenstorrent participant.
 * Forwards requests to the local vLLM server and streams responses back.
 */
async function handleChatRequest(
  request: vscode.ChatRequest,
  context: vscode.ChatContext,
  stream: vscode.ChatResponseStream,
  token: vscode.CancellationToken
): Promise<void> {
  // Check if server is running
  const isRunning = await checkVllmServerRunning();
  if (!isRunning) {
    stream.markdown('⚠️ **vLLM server not running.** Please start it first using the walkthrough (Lesson 7, Step 1).\n\n');
    stream.markdown('Run the command: `Tenstorrent: Start vLLM Server for Chat`');
    return;
  }

  try {
    // Show progress indicator
    stream.progress('Thinking on Tenstorrent hardware...');

    // Prepare messages (include chat history for context)
    const messages: Array<{role: string, content: string}> = [
      {
        role: 'system',
        content: 'You are a helpful coding assistant integrated into VSCode, powered by Tenstorrent hardware. Provide concise, accurate answers focused on programming and software development. When explaining code, be clear and educational.'
      }
    ];

    // Add chat history for context
    for (const msg of context.history) {
      // Check if it's a user request
      if ('prompt' in msg && msg.prompt) {
        messages.push({role: 'user', content: msg.prompt});
      }
      // Check if it's an assistant response
      else if ('response' in msg && msg.response) {
        // Extract markdown text from response
        let responseText = '';
        for (const part of msg.response) {
          // Only extract markdown parts for simplicity
          if (part instanceof vscode.MarkdownString) {
            responseText += part.value;
          } else if (typeof (part as any).value === 'object' && (part as any).value.value) {
            // Handle ChatResponseMarkdownPart
            responseText += (part as any).value.value;
          }
        }
        if (responseText) {
          messages.push({role: 'assistant', content: responseText});
        }
      }
    }

    // Add current user message
    messages.push({role: 'user', content: request.prompt});

    // Call vLLM server
    const modelConfig = getModelConfig(DEFAULT_MODEL_KEY);
    const response = await fetch('http://localhost:8000/v1/chat/completions', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        model: modelConfig.huggingfaceId,
        messages,
        max_tokens: 512,
        stream: true,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      stream.markdown(`❌ **Error:** Server returned status ${response.status}\n\nMake sure vLLM server is running properly.`);
      return;
    }

    // Stream response back
    const reader = response.body?.getReader();
    if (!reader) {
      stream.markdown('❌ **Error:** Could not read response from server');
      return;
    }

    const decoder = new TextDecoder();

    while (true) {
      const {done, value} = await reader.read();
      if (done) break;

      // Check cancellation
      if (token.isCancellationRequested) {
        reader.cancel();
        break;
      }

      // Parse SSE format (Server-Sent Events)
      const chunk = decoder.decode(value, {stream: true});
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        if (line.includes('[DONE]')) continue;

        try {
          const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix
          const content = data.choices?.[0]?.delta?.content;

          if (content) {
            stream.markdown(content);
          }
        } catch (e) {
          // Skip parse errors (can happen with partial chunks)
          continue;
        }
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    stream.markdown(`❌ **Error:** ${errorMessage}\n\nMake sure vLLM server is running on port 8000.`);
  }
}

// ============================================================================
// Lesson 8 - Image Generation with Stable Diffusion 3.5 Large
// ============================================================================

/**
 * Command: tenstorrent.generateRetroImage
 * Generates a sample 1024x1024 image using Stable Diffusion 3.5 Large on TT hardware
 * and displays it in VSCode
 */
async function generateRetroImage(): Promise<void> {
  // Get the tt-metal path from stored state (default to ~/tt-metal if not found)
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const defaultPath = path.join(homeDir, 'tt-metal');
  const ttMetalPath = extensionContext.globalState.get<string>(STATE_KEYS.TT_METAL_PATH, defaultPath);

  const terminal = getOrCreateTerminal('Image Generation', 'imageGeneration');

  const command = replaceVariables(TERMINAL_COMMANDS.GENERATE_RETRO_IMAGE.template, {
    ttMetalPath,
  });

  runInTerminal(terminal, command);

  // Image will be saved to ~/tt-scratchpad/sd35_1024_1024.png
  const scratchpadPath = path.join(homeDir, 'tt-scratchpad');
  const imagePath = path.join(scratchpadPath, 'sd35_1024_1024.png');

  const message = await vscode.window.showInformationMessage(
    '🎨 Generating 1024x1024 image with Stable Diffusion 3.5 Large on TT hardware. Image will be saved to ~/tt-scratchpad/sd35_1024_1024.png. First run downloads the model (~10 GB) and may take 5-10 minutes. Subsequent generations: ~12-15 seconds on N150.',
    'Open Image When Done'
  );

  // If user clicks "Open Image When Done", set up a file watcher
  if (message === 'Open Image When Done') {
    vscode.window.showInformationMessage(
      `Will open ${imagePath} when generation completes. Watch the terminal for "Image saved" message.`
    );

    // Offer a manual open command since we can't reliably detect when pytest completes
    const openNow = await vscode.window.showInformationMessage(
      'Generation takes ~12-15 seconds. Click "Open Now" when you see the image saved in terminal.',
      'Open Now'
    );

    if (openNow === 'Open Now') {
      await openGeneratedImage(imagePath);
    }
  }
}

/**
 * Helper function to open a generated image in VSCode
 */
async function openGeneratedImage(imagePath: string): Promise<void> {
  const fs = await import('fs');

  if (!fs.existsSync(imagePath)) {
    vscode.window.showWarningMessage(
      `Image not found at ${imagePath}. Make sure generation completed successfully.`
    );
    return;
  }

  try {
    // Open the image in VSCode
    const imageUri = vscode.Uri.file(imagePath);
    await vscode.commands.executeCommand('vscode.open', imageUri);

    vscode.window.showInformationMessage(`✅ Image opened: ${imagePath}`);
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to open image: ${error}`);
  }
}

/**
 * Command: tenstorrent.startInteractiveImageGen
 * Starts interactive SD 3.5 mode where users can enter custom prompts
 */
async function startInteractiveImageGen(): Promise<void> {
  // Get the tt-metal path from stored state (default to ~/tt-metal if not found)
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const defaultPath = path.join(homeDir, 'tt-metal');
  const ttMetalPath = extensionContext.globalState.get<string>(STATE_KEYS.TT_METAL_PATH, defaultPath);

  const terminal = getOrCreateTerminal('Image Generation', 'imageGeneration');

  const command = replaceVariables(TERMINAL_COMMANDS.START_INTERACTIVE_IMAGE_GEN.template, {
    ttMetalPath,
  });

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '🖼️ Starting interactive SD 3.5 Large. Model loads once (2-5 min), then enter custom prompts to generate 1024x1024 images (~12-15 sec each on N150)! Images will be saved to ~/tt-scratchpad/sd35_1024_1024.png'
  );
}

// ============================================================================
// Lesson 9 - Coding Assistant with Prompt Engineering
// ============================================================================

/**
 * Command: tenstorrent.verifyCodingModel
 * Verifies Llama 3.1 8B model is available for coding assistant
 */
function verifyCodingModel(): void {
  const terminal = getOrCreateTerminal('Coding Assistant Setup', 'modelDownload');
  const command = TERMINAL_COMMANDS.VERIFY_CODING_MODEL.template;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '🔍 Checking for Llama 3.1 8B model. Should be installed from Lesson 3.'
  );
}

/**
 * Command: tenstorrent.createCodingAssistantScript
 * Creates the coding assistant CLI script and opens it in editor
 */
async function createCodingAssistantScript(): Promise<void> {
  const path = await import('path');
  const fs = await import('fs');
  const os = await import('os');

  const extensionPath = extensionContext.extensionPath;
  const templatePath = path.join(extensionPath, 'content', 'templates', 'tt-coding-assistant.py');

  if (!fs.existsSync(templatePath)) {
    vscode.window.showErrorMessage(
      `Template not found at ${templatePath}. Please reinstall the extension.`
    );
    return;
  }

  const homeDir = os.homedir();
  const scratchpadDir = path.join(homeDir, 'tt-scratchpad');

  // Create scratchpad directory if it doesn't exist
  if (!fs.existsSync(scratchpadDir)) {
    fs.mkdirSync(scratchpadDir, { recursive: true });
  }

  const destPath = path.join(scratchpadDir, 'tt-coding-assistant.py');

  try {
    fs.copyFileSync(templatePath, destPath);
    fs.chmodSync(destPath, 0o755);

    // Open the file in the editor
    const doc = await vscode.workspace.openTextDocument(destPath);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
      `✅ Created coding assistant script at ${destPath}. The file is now open - review the code!`
    );
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to create coding assistant script: ${error}`);
  }
}

/**
 * Command: tenstorrent.startCodingAssistant
 * Starts the coding assistant CLI using Llama 3.1 8B with Direct API and prompt engineering
 */
async function startCodingAssistant(): Promise<void> {
  const os = await import('os');
  const path = await import('path');
  const homeDir = os.homedir();
  const defaultPath = path.join(homeDir, 'tt-metal');
  const ttMetalPath = extensionContext.globalState.get<string>(STATE_KEYS.TT_METAL_PATH, defaultPath);

  // Model path for Llama 3.1 8B (original subdirectory for Direct API)
  const modelPath = await getModelOriginalPath();

  const terminal = getOrCreateTerminal('Coding Assistant', 'interactiveChat');

  const command = `cd "${ttMetalPath}" && export LLAMA_DIR="${modelPath}" && export PYTHONPATH=$(pwd) && python3 ~/tt-scratchpad/tt-coding-assistant.py`;

  runInTerminal(terminal, command);

  vscode.window.showInformationMessage(
    '💬 Starting coding assistant with prompt engineering. Model loads once (2-5 min), then fast responses (1-3 sec)!'
  );
}

// ============================================================================
// Device Management Commands
// ============================================================================

/**
 * Command: tenstorrent.resetDevice
 * Performs a software reset of the Tenstorrent device using tt-smi -r
 */
async function resetDevice(): Promise<void> {
  const choice = await vscode.window.showWarningMessage(
    'This will reset the Tenstorrent device. Any running processes using the device will be interrupted. Continue?',
    'Reset Device',
    'Cancel'
  );

  if (choice !== 'Reset Device') {
    return;
  }

  const terminal = getOrCreateTerminal('Device Management', 'hardwareDetection');
  runInTerminal(terminal, 'tt-smi -r');

  vscode.window.showInformationMessage(
    '🔄 Resetting device... Check terminal for status.'
  );

  // Refresh status after a short delay
  setTimeout(async () => {
    await updateDeviceStatus();
  }, 3000);
}

/**
 * Command: tenstorrent.clearDeviceState
 * Clears device state by removing cached data and performing cleanup
 */
async function clearDeviceState(): Promise<void> {
  const choice = await vscode.window.showWarningMessage(
    'This will:\n• Kill any processes using the device\n• Clear /dev/shm Tenstorrent data\n• Reset device state\n\nThis operation requires sudo. Continue?',
    'Clear State',
    'Cancel'
  );

  if (choice !== 'Clear State') {
    return;
  }

  const terminal = getOrCreateTerminal('Device Management', 'hardwareDetection');

  // Multi-step cleanup command
  const commands = [
    'echo "=== Killing processes using Tenstorrent devices ==="',
    'pgrep -f tt-metal && pkill -9 -f tt-metal || echo "No tt-metal processes found"',
    'pgrep -f vllm && pkill -9 -f vllm || echo "No vllm processes found"',
    'echo "=== Clearing /dev/shm ==="',
    'sudo rm -rf /dev/shm/tenstorrent* /dev/shm/tt_* || echo "No shared memory files found"',
    'echo "=== Resetting device ==="',
    'tt-smi -r',
    'echo "=== Cleanup complete ==="',
  ];

  runInTerminal(terminal, commands.join(' && '));

  vscode.window.showInformationMessage(
    '🧹 Clearing device state... Check terminal for progress. You may need to enter your sudo password.'
  );

  // Refresh status after cleanup
  setTimeout(async () => {
    await updateDeviceStatus();
  }, 5000);
}

// ============================================================================
// Welcome Page
// ============================================================================

/**
 * Command: tenstorrent.showWelcome
 *
 * Opens a welcome page in a webview panel with an overview of the extension,
 * links to all walkthroughs, and quick actions.
 */
async function showWelcome(context: vscode.ExtensionContext): Promise<void> {
  const panel = vscode.window.createWebviewPanel(
    'tenstorrentWelcome',
    'Welcome to Tenstorrent',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'content', 'welcome')]
    }
  );

  // Load welcome HTML
  const fs = await import('fs');
  const path = await import('path');
  const welcomePath = path.join(context.extensionPath, 'content', 'welcome', 'welcome.html');

  if (fs.existsSync(welcomePath)) {
    panel.webview.html = fs.readFileSync(welcomePath, 'utf8');
  } else {
    panel.webview.html = '<html><body><h1>Welcome to Tenstorrent</h1><p>Welcome content not found.</p></body></html>';
  }

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case 'openWalkthrough':
          // Open the main walkthrough at a specific step
          vscode.commands.executeCommand(
            'workbench.action.openWalkthrough',
            {
              category: 'tenstorrent.tenstorrent-developer-extension#tenstorrent.setup',
              step: message.stepId
            }
          );
          break;
        case 'executeCommand':
          // Execute a command by ID
          vscode.commands.executeCommand(message.commandId);
          break;
      }
    },
    undefined,
    context.subscriptions
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
    // Welcome page
    vscode.commands.registerCommand('tenstorrent.showWelcome', () => showWelcome(context)),

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
    vscode.commands.registerCommand('tenstorrent.installInferenceDeps', installInferenceDeps),
    vscode.commands.registerCommand('tenstorrent.createChatScript', createChatScript),
    vscode.commands.registerCommand('tenstorrent.startChatSession', startChatSession),
    vscode.commands.registerCommand('tenstorrent.createApiServer', createApiServer),
    vscode.commands.registerCommand('tenstorrent.installFlask', installFlask),
    vscode.commands.registerCommand('tenstorrent.startApiServer', startApiServer),
    vscode.commands.registerCommand('tenstorrent.testApiBasic', testApiBasic),
    vscode.commands.registerCommand('tenstorrent.testApiMultiple', testApiMultiple),

    // Lesson 4 - Direct API Chat
    vscode.commands.registerCommand('tenstorrent.createChatScriptDirect', createChatScriptDirect),
    vscode.commands.registerCommand('tenstorrent.startChatSessionDirect', startChatSessionDirect),

    // Lesson 5 - Direct API Server
    vscode.commands.registerCommand('tenstorrent.createApiServerDirect', createApiServerDirect),
    vscode.commands.registerCommand('tenstorrent.startApiServerDirect', startApiServerDirect),
    vscode.commands.registerCommand('tenstorrent.testApiBasicDirect', testApiBasicDirect),
    vscode.commands.registerCommand('tenstorrent.testApiMultipleDirect', testApiMultipleDirect),

    // Lesson 6 - vLLM
    vscode.commands.registerCommand('tenstorrent.updateTTMetal', updateTTMetal),
    vscode.commands.registerCommand('tenstorrent.cloneVllm', cloneVllm),
    vscode.commands.registerCommand('tenstorrent.installVllm', installVllm),
    vscode.commands.registerCommand('tenstorrent.runVllmOffline', runVllmOffline),
    vscode.commands.registerCommand('tenstorrent.startVllmServer', startVllmServer),
    vscode.commands.registerCommand('tenstorrent.testVllmOpenai', testVllmOpenai),
    vscode.commands.registerCommand('tenstorrent.testVllmCurl', testVllmCurl),

    // Lesson 7 - VSCode Chat Integration
    vscode.commands.registerCommand('tenstorrent.startVllmForChat', startVllmForChat),
    vscode.commands.registerCommand('tenstorrent.enableChatParticipant', enableChatParticipant),
    vscode.commands.registerCommand('tenstorrent.testChat', testChat),

    // Lesson 8 - Image Generation with SD 3.5 Large
    vscode.commands.registerCommand('tenstorrent.generateRetroImage', generateRetroImage),
    vscode.commands.registerCommand('tenstorrent.startInteractiveImageGen', startInteractiveImageGen),

    // Lesson 9 - Coding Assistant with Prompt Engineering
    vscode.commands.registerCommand('tenstorrent.verifyCodingModel', verifyCodingModel),
    vscode.commands.registerCommand('tenstorrent.createCodingAssistantScript', createCodingAssistantScript),
    vscode.commands.registerCommand('tenstorrent.startCodingAssistant', startCodingAssistant),

    // Device Management
    vscode.commands.registerCommand('tenstorrent.resetDevice', resetDevice),
    vscode.commands.registerCommand('tenstorrent.clearDeviceState', clearDeviceState),
  ];

  // Add all command registrations to subscriptions for proper cleanup
  context.subscriptions.push(...commands);

  // Register chat participant
  const chatParticipant = vscode.chat.createChatParticipant(
    'tenstorrent.chat',
    handleChatRequest
  );

  chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'assets', 'icon.png');

  context.subscriptions.push(chatParticipant);

  // Initialize statusbar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100 // Priority (higher = further left)
  );

  statusBarItem.command = {
    title: 'Show Device Actions',
    command: 'tenstorrent.showDeviceActions',
  };

  context.subscriptions.push(statusBarItem);

  // Register statusbar click command
  context.subscriptions.push(
    vscode.commands.registerCommand('tenstorrent.showDeviceActions', showDeviceActionsMenu)
  );

  // Run initial device status check (but don't start auto-polling)
  updateDeviceStatus();

  // Start periodic updates only if enabled (default: disabled)
  startStatusUpdateTimer();

  // Create a persistent terminal for user convenience
  // This terminal stays open and can be reused for any commands
  const defaultTerminal = vscode.window.createTerminal({
    name: 'Tenstorrent',
    cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
  });
  // Don't show it immediately - let user open it when needed
  context.subscriptions.push(defaultTerminal);

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
 * Cleans up terminal references and stops status monitoring.
 * Note that VS Code automatically disposes of terminals and statusbar items
 * when the extension is deactivated, but we explicitly clear our references
 * for good measure.
 */
export function deactivate(): void {
  // Stop status update timer
  stopStatusUpdateTimer();

  // Clear all terminal references
  // VS Code will handle actual disposal
  terminals.hardwareDetection = undefined;
  terminals.verifyInstallation = undefined;
  terminals.modelDownload = undefined;
  terminals.interactiveChat = undefined;
  terminals.apiServer = undefined;
  terminals.vllmServer = undefined;
  terminals.imageGeneration = undefined;

  // Clear statusbar reference
  statusBarItem = undefined;

  console.log('Tenstorrent Developer Extension has been deactivated');
}
