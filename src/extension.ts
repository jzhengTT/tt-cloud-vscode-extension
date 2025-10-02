import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'ttCloudHelloWorld',
    'TT Cloud Hello World',
    vscode.ViewColumn.Two,
    {}
  );

  panel.webview.html = getWebviewContent();

  const disposable = vscode.commands.registerCommand(
    'tt-cloud-hello-world.helloWorld',
    () => {
      vscode.window.showInformationMessage('Hello World from TT Cloud!');
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(panel);
}

function getWebviewContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TT Cloud Hello World</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .hello-message {
            font-size: 24px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="hello-message">Hello World</div>
</body>
</html>`;
}

export function deactivate() {}



