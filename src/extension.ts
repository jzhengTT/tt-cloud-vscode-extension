import * as vscode from 'vscode';

interface ChecklistItem {
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
  active: boolean;
}

interface SetupState {
  currentStep: number;
  totalSteps: number;
  checklist: ChecklistItem[];
  terminalOutput: string[];
}

export function activate(context: vscode.ExtensionContext) {
  const setupState: SetupState = {
    currentStep: 1,
    totalSteps: 5,
    checklist: [
      { id: 'hardware', title: 'Hardware Detection', subtitle: 'Scan for devices', completed: false, active: true },
      { id: 'install', title: 'Install TT-Metalium', subtitle: 'Runtime & drivers', completed: false, active: false },
      { id: 'verify', title: 'Verify Installation', subtitle: 'Run health checks', completed: false, active: false },
      { id: 'first-program', title: 'First Program', subtitle: 'Hello Tenstorrent', completed: false, active: false },
      { id: 'examples', title: 'Explore Examples', subtitle: 'Sample projects', completed: false, active: false }
    ],
    terminalOutput: [
      'tt-smi $ █'
    ]
  };

  let panel: vscode.WebviewPanel | undefined;

  const openSetupCommand = vscode.commands.registerCommand('tenstorrent.openSetup', () => {
    if (panel) {
      panel.reveal(vscode.ViewColumn.Two);
      return;
    }

    panel = vscode.window.createWebviewPanel(
      'tenstorrentSetup',
      'Tenstorrent Setup',
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    panel.webview.html = getWebviewContent(setupState);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'runCommand':
            handleRunCommand(message.commandName, setupState, panel!);
            break;
          case 'updateProgress':
            updateChecklistProgress(message.itemId, setupState, panel!);
            break;
        }
      }
    );

    panel.onDidDispose(() => {
      panel = undefined;
    });
  });

  const runCommandCommand = vscode.commands.registerCommand('tenstorrent.runCommand',
    (commandName: string) => {
      if (panel) {
        handleRunCommand(commandName, setupState, panel);
      }
    }
  );

  context.subscriptions.push(openSetupCommand, runCommandCommand);

  // Auto-open the setup panel on activation
  vscode.commands.executeCommand('tenstorrent.openSetup');
}

function handleRunCommand(commandName: string, state: SetupState, panel: vscode.WebviewPanel) {
  switch (commandName) {
    case 'detectHardware':
      // Remove the cursor from the previous line
      if (state.terminalOutput[state.terminalOutput.length - 1].includes('█')) {
        state.terminalOutput[state.terminalOutput.length - 1] = 'tt-smi $';
      }

      state.terminalOutput.push('tt-smi $ tt-smi detect');
      state.terminalOutput.push('Scanning for Tenstorrent devices...');
      state.terminalOutput.push('✓ Found 1 device(s)');
      state.terminalOutput.push('  Device 0: Wormhole N150');
      state.terminalOutput.push('  Status: Ready');
      state.terminalOutput.push('  Driver: v1.4.2');
      state.terminalOutput.push('');
      state.terminalOutput.push('tt-smi $ █');

      // Mark hardware detection as completed
      const hardwareItem = state.checklist.find(item => item.id === 'hardware');
      if (hardwareItem) {
        hardwareItem.completed = true;
        hardwareItem.active = false;
        hardwareItem.subtitle = 'Wormhole detected';
      }

      // Activate install step
      const installItem = state.checklist.find(item => item.id === 'install');
      if (installItem) {
        installItem.active = true;
      }

      state.currentStep = 2;
      break;

    case 'installTTMetalium':
      // Remove the cursor from the previous line
      if (state.terminalOutput[state.terminalOutput.length - 1].includes('█')) {
        state.terminalOutput[state.terminalOutput.length - 1] = 'tt-smi $';
      }

      state.terminalOutput.push('tt-smi $ pip install tt-metalium');
      state.terminalOutput.push('Installing TT-Metalium...');
      state.terminalOutput.push('✅ TT-Metalium installed successfully');
      state.terminalOutput.push('✅ Drivers loaded');
      state.terminalOutput.push('');
      state.terminalOutput.push('tt-smi $ █');

      // Mark install as completed
      const installCompleteItem = state.checklist.find(item => item.id === 'install');
      if (installCompleteItem) {
        installCompleteItem.completed = true;
        installCompleteItem.active = false;
      }

      // Activate verify step
      const verifyItem = state.checklist.find(item => item.id === 'verify');
      if (verifyItem) {
        verifyItem.active = true;
      }

      state.currentStep = 3;
      break;

    case 'verifyInstallation':
      // Remove the cursor from the previous line
      if (state.terminalOutput[state.terminalOutput.length - 1].includes('█')) {
        state.terminalOutput[state.terminalOutput.length - 1] = 'tt-smi $';
      }

      state.terminalOutput.push('tt-smi $ tt-smi health');
      state.terminalOutput.push('Running health checks...');
      state.terminalOutput.push('✅ Device communication: OK');
      state.terminalOutput.push('✅ Memory test: PASSED');
      state.terminalOutput.push('✅ Driver status: ACTIVE');
      state.terminalOutput.push('');
      state.terminalOutput.push('tt-smi $ █');

      // Mark verify as completed
      const verifyCompleteItem = state.checklist.find(item => item.id === 'verify');
      if (verifyCompleteItem) {
        verifyCompleteItem.completed = true;
        verifyCompleteItem.active = false;
      }

      // Activate first program step
      const firstProgramItem = state.checklist.find(item => item.id === 'first-program');
      if (firstProgramItem) {
        firstProgramItem.active = true;
      }

      state.currentStep = 4;
      break;

    case 'runOnTenstorrent':
      // Remove the cursor from the previous line
      if (state.terminalOutput[state.terminalOutput.length - 1].includes('█')) {
        state.terminalOutput[state.terminalOutput.length - 1] = 'tt-smi $';
      }

      state.terminalOutput.push('tt-smi $ python hello_tt.py');
      state.terminalOutput.push('Initializing Tenstorrent device...');
      state.terminalOutput.push('✅ Successfully ran on Tenstorrent device!');
      state.terminalOutput.push('Device: Wormhole-0');
      state.terminalOutput.push('Execution time: 12.4ms');
      state.terminalOutput.push('');
      state.terminalOutput.push('tt-smi $ █');

      // Mark first program as completed
      const firstProgramCompleteItem = state.checklist.find(item => item.id === 'first-program');
      if (firstProgramCompleteItem) {
        firstProgramCompleteItem.completed = true;
        firstProgramCompleteItem.active = false;
      }

      // Activate examples step
      const examplesItem = state.checklist.find(item => item.id === 'examples');
      if (examplesItem) {
        examplesItem.active = true;
      }

      state.currentStep = 5;
      break;
  }

  panel.webview.html = getWebviewContent(state);
}

function updateChecklistProgress(itemId: string, state: SetupState, panel: vscode.WebviewPanel) {
  const item = state.checklist.find(item => item.id === itemId);
  if (item) {
    // Set all items to inactive
    state.checklist.forEach(item => item.active = false);
    // Set clicked item as active
    item.active = true;
  }
  panel.webview.html = getWebviewContent(state);
}

function getStepContent(state: SetupState) {
  const currentItem = state.checklist.find(item => item.active);

  switch (currentItem?.id) {
    case 'hardware':
      return {
        title: 'Detect Hardware',
        description: 'Let\'s start by detecting your Tenstorrent hardware. This will scan for connected devices and verify they\'re properly recognized by the system.',
        buttonText: '🔍 Detect Hardware',
        buttonCommand: 'detectHardware',
        codeVisible: false
      };
    case 'install':
      return {
        title: 'Install TT-Metalium',
        description: 'Install the TT-Metalium runtime and drivers. This provides the core libraries needed to run programs on Tenstorrent hardware.',
        buttonText: '📦 Install TT-Metalium',
        buttonCommand: 'installTTMetalium',
        codeVisible: false
      };
    case 'verify':
      return {
        title: 'Verify Installation',
        description: 'Run health checks to ensure your Tenstorrent device is properly configured and ready to use.',
        buttonText: '✅ Run Health Check',
        buttonCommand: 'verifyInstallation',
        codeVisible: false
      };
    case 'first-program':
      return {
        title: 'Run Your First Program',
        description: 'Let\'s run a simple tensor operation on your Tenstorrent hardware. This example demonstrates basic tensor creation and computation using TT-Metalium.',
        buttonText: '▶ Run on Tenstorrent',
        buttonCommand: 'runOnTenstorrent',
        codeVisible: true
      };
    case 'examples':
      return {
        title: 'Explore Examples',
        description: 'Congratulations! You\'ve successfully set up your Tenstorrent development environment. Explore sample projects to learn more advanced techniques.',
        buttonText: '📚 Browse Examples',
        buttonCommand: 'browseExamples',
        codeVisible: false
      };
    default:
      return {
        title: 'Setup Complete',
        description: 'Your Tenstorrent development environment is ready!',
        buttonText: '🎉 Get Started',
        buttonCommand: 'getStarted',
        codeVisible: false
      };
  }
}

function getWebviewContent(state: SetupState): string {
  const progressPercentage = Math.round((state.checklist.filter(item => item.completed).length / state.totalSteps) * 100);
  const stepContent = getStepContent(state);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tenstorrent Developer Extension</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-editor-foreground, #cccccc);
            height: 100vh;
            overflow: hidden;
        }

        .vscode-container {
            display: flex;
            height: 100vh;
        }

        .sidebar {
            width: 300px;
            background: var(--vscode-sideBar-background, #252526);
            border-right: 1px solid var(--vscode-sideBar-border, #3e3e42);
            display: flex;
            flex-direction: column;
        }

        .sidebar-header {
            padding: 12px 16px;
            background: var(--vscode-titleBar-inactiveBackground, #2d2d30);
            border-bottom: 1px solid var(--vscode-sideBar-border, #3e3e42);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tt-logo {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 14px;
        }

        .sidebar-title {
            font-size: 13px;
            font-weight: 600;
            color: var(--vscode-titleBar-activeForeground, #ffffff);
        }

        .setup-progress {
            padding: 16px;
            border-bottom: 1px solid var(--vscode-sideBar-border, #3e3e42);
        }

        .progress-bar {
            height: 6px;
            background: var(--vscode-progressBar-background, #3e3e42);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 8px;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            width: ${progressPercentage}%;
            transition: width 0.3s ease;
        }

        .progress-text {
            font-size: 11px;
            color: var(--vscode-descriptionForeground, #999);
        }

        .checklist {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }

        .checklist-item {
            padding: 12px;
            margin: 4px 0;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: start;
            gap: 10px;
        }

        .checklist-item:hover {
            background: var(--vscode-list-hoverBackground, #2a2d2e);
        }

        .checklist-item.active {
            background: var(--vscode-list-activeSelectionBackground, #37373d);
        }

        .checkbox {
            width: 18px;
            height: 18px;
            border: 2px solid var(--vscode-checkbox-border, #3e3e42);
            border-radius: 3px;
            flex-shrink: 0;
            margin-top: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .checkbox.checked {
            background: #667eea;
            border-color: #667eea;
        }

        .checkbox.checked::after {
            content: '✓';
            color: white;
            font-size: 12px;
        }

        .item-content {
            flex: 1;
        }

        .item-title {
            font-size: 13px;
            color: var(--vscode-foreground, #cccccc);
            margin-bottom: 4px;
        }

        .item-subtitle {
            font-size: 11px;
            color: var(--vscode-descriptionForeground, #858585);
        }

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .tab-bar {
            display: flex;
            background: var(--vscode-tab-inactiveBackground, #2d2d30);
            border-bottom: 1px solid var(--vscode-tab-border, #3e3e42);
        }

        .tab {
            padding: 10px 16px;
            font-size: 12px;
            color: var(--vscode-tab-inactiveForeground, #969696);
            border-right: 1px solid var(--vscode-tab-border, #3e3e42);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .tab.active {
            background: var(--vscode-tab-activeBackground, #1e1e1e);
            color: var(--vscode-tab-activeForeground, #ffffff);
        }

        .tab-icon {
            font-size: 14px;
        }

        .editor-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .content-pane {
            flex: 1;
            padding: 24px;
            overflow-y: auto;
        }

        .step-header {
            margin-bottom: 24px;
        }

        .step-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #667eea20;
            color: #667eea;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .step-title {
            font-size: 24px;
            font-weight: 600;
            color: var(--vscode-editor-foreground, #ffffff);
            margin-bottom: 8px;
        }

        .step-description {
            font-size: 14px;
            color: var(--vscode-descriptionForeground, #999);
            line-height: 1.6;
        }

        .code-block {
            background: var(--vscode-textCodeBlock-background, #1e1e1e);
            border: 1px solid var(--vscode-textBlockQuote-border, #3e3e42);
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
            font-family: var(--vscode-editor-font-family, 'Consolas', 'Monaco', monospace);
            font-size: 13px;
            line-height: 1.6;
        }

        .code-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-textBlockQuote-border, #3e3e42);
        }

        .code-title {
            font-size: 11px;
            color: var(--vscode-descriptionForeground, #858585);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .copy-btn {
            padding: 4px 12px;
            background: var(--vscode-button-secondaryBackground, #3e3e42);
            border: none;
            border-radius: 4px;
            color: var(--vscode-button-secondaryForeground, #cccccc);
            font-size: 11px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .copy-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground, #4e4e52);
        }

        .code-line {
            display: flex;
            gap: 16px;
        }

        .line-number {
            color: var(--vscode-editorLineNumber-foreground, #858585);
            user-select: none;
            text-align: right;
            min-width: 20px;
        }

        .line-content {
            flex: 1;
            color: var(--vscode-editor-foreground, #d4d4d4);
        }

        .keyword { color: var(--vscode-symbolIcon-keywordForeground, #c586c0); }
        .string { color: var(--vscode-symbolIcon-stringForeground, #ce9178); }
        .function { color: var(--vscode-symbolIcon-functionForeground, #dcdcaa); }
        .comment { color: var(--vscode-symbolIcon-textForeground, #6a9955); }
        .variable { color: var(--vscode-symbolIcon-variableForeground, #9cdcfe); }
        .number { color: var(--vscode-symbolIcon-numberForeground, #b5cea8); }

        .terminal {
            background: var(--vscode-terminal-background, #1e1e1e);
            border-top: 1px solid var(--vscode-panel-border, #3e3e42);
            height: 250px;
            display: flex;
            flex-direction: column;
        }

        .terminal-header {
            padding: 8px 12px;
            background: var(--vscode-tab-inactiveBackground, #2d2d30);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            color: var(--vscode-foreground, #cccccc);
        }

        .terminal-content {
            flex: 1;
            padding: 12px;
            font-family: var(--vscode-editor-font-family, 'Consolas', 'Monaco', monospace);
            font-size: 13px;
            overflow-y: auto;
            line-height: 1.5;
        }

        .terminal-line {
            margin-bottom: 4px;
        }

        .terminal-prompt {
            color: var(--vscode-terminal-ansiGreen, #4ec9b0);
        }

        .terminal-command {
            color: var(--vscode-terminal-ansiYellow, #dcdcaa);
        }

        .terminal-output {
            color: var(--vscode-terminal-foreground, #cccccc);
        }

        .terminal-success {
            color: var(--vscode-terminal-ansiGreen, #4ec9b0);
        }

        .terminal-warning {
            color: var(--vscode-terminal-ansiYellow, #ce9178);
        }

        .action-buttons {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }

        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
        }

        .btn-primary {
            background: var(--vscode-button-background, linear-gradient(135deg, #667eea 0%, #764ba2 100%));
            color: var(--vscode-button-foreground, white);
        }

        .btn-primary:hover {
            background: var(--vscode-button-hoverBackground, linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%));
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
            background: var(--vscode-button-secondaryBackground, #3e3e42);
            color: var(--vscode-button-secondaryForeground, #cccccc);
        }

        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground, #4e4e52);
        }

        .info-box {
            padding: 16px;
            background: var(--vscode-textBlockQuote-background, #264f78);
            border-left: 4px solid var(--vscode-terminal-ansiGreen, #4ec9b0);
            border-radius: 4px;
            margin: 16px 0;
            font-size: 13px;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="vscode-container">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <div class="tt-logo">TT</div>
                <div class="sidebar-title">Tenstorrent Setup</div>
            </div>

            <div class="setup-progress">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-text">${state.checklist.filter(item => item.completed).length} of ${state.totalSteps} steps completed</div>
            </div>

            <div class="checklist">
                ${state.checklist.map(item => `
                    <div class="checklist-item ${item.active ? 'active' : ''}" onclick="updateProgress('${item.id}')">
                        <div class="checkbox ${item.completed ? 'checked' : ''}"></div>
                        <div class="item-content">
                            <div class="item-title">${item.title}</div>
                            <div class="item-subtitle">${item.subtitle}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="tab-bar">
                <div class="tab active">
                    <span class="tab-icon">📄</span>
                    <span>hello_tt.py</span>
                </div>
                <div class="tab">
                    <span class="tab-icon">📋</span>
                    <span>Setup Guide</span>
                </div>
            </div>

            <div class="editor-area">
                <div class="content-pane">
                    <div class="step-header">
                        <div class="step-badge">STEP ${state.currentStep} OF ${state.totalSteps}</div>
                        <h1 class="step-title">${stepContent.title}</h1>
                        <p class="step-description">
                            ${stepContent.description}
                        </p>
                    </div>

                    ${stepContent.codeVisible ? `
                        <div class="info-box">
                            💡 <strong>Tip:</strong> Make sure your Tenstorrent device is properly connected and drivers are loaded. You can verify this by checking the terminal output below.
                        </div>

                        <div class="code-block">
                            <div class="code-header">
                                <span class="code-title">hello_tt.py</span>
                                <button class="copy-btn">Copy</button>
                            </div>
                            <div class="code-line">
                                <span class="line-number">1</span>
                                <span class="line-content"><span class="keyword">import</span> tt_lib <span class="keyword">as</span> ttl</span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">2</span>
                                <span class="line-content"><span class="keyword">import</span> torch</span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">3</span>
                                <span class="line-content"></span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">4</span>
                                <span class="line-content"><span class="comment"># Initialize Tenstorrent device</span></span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">5</span>
                                <span class="line-content"><span class="variable">device</span> = <span class="function">ttl</span>.device.<span class="function">CreateDevice</span>(<span class="number">0</span>)</span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">6</span>
                                <span class="line-content"></span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">7</span>
                                <span class="line-content"><span class="comment"># Create a tensor on CPU</span></span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">8</span>
                                <span class="line-content"><span class="variable">cpu_tensor</span> = torch.<span class="function">randn</span>(<span class="number">2</span>, <span class="number">3</span>, <span class="number">32</span>, <span class="number">32</span>)</span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">9</span>
                                <span class="line-content"></span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">10</span>
                                <span class="line-content"><span class="comment"># Transfer to Tenstorrent device</span></span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">11</span>
                                <span class="line-content"><span class="variable">tt_tensor</span> = <span class="function">ttl</span>.tensor.<span class="function">Tensor</span>(<span class="variable">cpu_tensor</span>, <span class="variable">device</span>)</span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">12</span>
                                <span class="line-content"></span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">13</span>
                                <span class="line-content"><span class="comment"># Perform computation on TT hardware</span></span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">14</span>
                                <span class="line-content"><span class="variable">result</span> = <span class="function">ttl</span>.tensor.<span class="function">mul</span>(<span class="variable">tt_tensor</span>, <span class="number">2.0</span>)</span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">15</span>
                                <span class="line-content"></span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">16</span>
                                <span class="line-content"><span class="function">print</span>(<span class="string">f"✅ Successfully ran on Tenstorrent device!"</span>)</span>
                            </div>
                            <div class="code-line">
                                <span class="line-number">17</span>
                                <span class="line-content"><span class="function">print</span>(<span class="string">f"Device: {device.id()}"</span>)</span>
                            </div>
                        </div>
                    ` : ''}

                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="runCommand('${stepContent.buttonCommand}')">${stepContent.buttonText}</button>
                        <button class="btn btn-secondary" onclick="runCommand('viewDocs')">📖 View Documentation</button>
                    </div>
                </div>

                <!-- Terminal -->
                <div class="terminal">
                    <div class="terminal-header">
                        <span>⚡ Terminal</span>
                        <span style="margin-left: auto; font-size: 11px; color: var(--vscode-descriptionForeground, #858585);">Tenstorrent CLI</span>
                    </div>
                    <div class="terminal-content">
                        ${state.terminalOutput.map(line => {
                          if (line.startsWith('tt-smi $')) {
                            const parts = line.split(' ');
                            const prompt = parts.slice(0, 2).join(' ');
                            const command = parts.slice(2).join(' ');
                            return `<div class="terminal-line">
                              <span class="terminal-prompt">${prompt}</span>
                              <span class="terminal-command"> ${command}</span>
                            </div>`;
                          } else if (line.includes('✓') || line.includes('✅')) {
                            return `<div class="terminal-line terminal-success">${line}</div>`;
                          } else if (line.includes('WARNING') || line.includes('⚠')) {
                            return `<div class="terminal-line terminal-warning">${line}</div>`;
                          } else if (line === '') {
                            return `<div class="terminal-line"></div>`;
                          } else {
                            return `<div class="terminal-line terminal-output">${line}</div>`;
                          }
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        function runCommand(commandName) {
            vscode.postMessage({
                command: 'runCommand',
                commandName: commandName
            });
        }

        function updateProgress(itemId) {
            vscode.postMessage({
                command: 'updateProgress',
                itemId: itemId
            });
        }

        // Auto-scroll terminal to bottom
        const terminal = document.querySelector('.terminal-content');
        if (terminal) {
            terminal.scrollTop = terminal.scrollHeight;
        }
    </script>
</body>
</html>`;
}

export function deactivate() {}



