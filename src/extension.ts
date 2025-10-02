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
}

export function activate(context: vscode.ExtensionContext) {
  const setupState: SetupState = {
    currentStep: 1,
    totalSteps: 1,
    checklist: [
      { id: 'hardware', title: 'Hardware Detection', subtitle: 'Scan for devices', completed: false, active: true }
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
      // Mark hardware detection as completed
      const hardwareItem = state.checklist.find(item => item.id === 'hardware');
      if (hardwareItem) {
        hardwareItem.completed = true;
        hardwareItem.active = false;
        hardwareItem.subtitle = 'Hardware detected';
      }
      break;

    case 'runTtSmi':
      // Run actual tt-smi command in VS Code terminal
      const terminal = vscode.window.createTerminal('TT-SMI Hardware Detection');
      terminal.show();
      terminal.sendText('tt-smi');
      break;

    case 'openDocumentation':
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/tenstorrent/tt-smi'));
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
        title: 'Hardware Detection',
        description: 'Detect and verify your Tenstorrent hardware using tt-smi. This will scan for connected devices and verify they\'re properly recognized by the system.',
        buttonText: 'Run',
        buttonCommand: 'runTtSmi',
        commandToShow: 'tt-smi',
        codeVisible: false
      };
    default:
      return {
        title: 'Setup Complete',
        description: 'Your Tenstorrent hardware has been detected!',
        buttonText: 'Get Started',
        buttonCommand: 'getStarted',
        commandToShow: '',
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

        .copy-btn-small {
            padding: 4px 8px;
            background: var(--vscode-button-secondaryBackground, #3e3e42);
            border: none;
            border-radius: 4px;
            color: var(--vscode-button-secondaryForeground, #cccccc);
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s;
            margin-left: auto;
        }

        .copy-btn-small:hover {
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
            <div class="content-pane">
                    <div class="step-header">
                        <div class="step-badge">STEP ${state.currentStep} OF ${state.totalSteps}</div>
                        <h1 class="step-title">${stepContent.title}</h1>
                        <p class="step-description">
                            ${stepContent.description}
                        </p>
                    </div>

                    ${stepContent.commandToShow ? `
                        <div class="code-block">
                            <div class="code-line">
                                <span class="line-content"><span class="terminal-prompt">$</span> <span class="terminal-command">${stepContent.commandToShow}</span></span>
                            </div>
                        </div>
                    ` : ''}

                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="runCommand('${stepContent.buttonCommand}')">${stepContent.buttonText}</button>
                        <button class="btn btn-secondary" onclick="runCommand('openDocumentation')">View Documentation</button>
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

    </script>
</body>
</html>`;
}

export function deactivate() {}



