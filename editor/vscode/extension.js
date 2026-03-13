// Lume Language Extension for VS Code
// Provides syntax highlighting, snippets, and language configuration

const vscode = require('vscode')

function activate(context) {
    console.log('Lume language extension activated')

    // Register a simple command to show Lume version
    const disposable = vscode.commands.registerCommand('lume.showVersion', () => {
        vscode.window.showInformationMessage('Lume v0.8.0 — The AI-Native Programming Language')
    })

    context.subscriptions.push(disposable)
}

function deactivate() { }

module.exports = { activate, deactivate }
