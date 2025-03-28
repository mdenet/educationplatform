import { ExtensionPanel } from './ExtensionPanel.js';
import * as vscode from 'vscode';

class ExtensionOutputPanel extends ExtensionPanel {
    constructor(id, name, language) {
        super(id);
        this.name = name;
        this.language = language;
        this.panel = null;
        this.buttons = [];
        this.generatedFiles = [];
        this.selectedFilePath = null;
        this.currentContent = null;
        this.isSvgContent = false;
    }

    initialize() {}

    setGeneratedFiles(generatedFiles) {
        this.generatedFiles = generatedFiles;
        this.resetContentState();
        this.ensurePanel();
    }

    resetContentState() {
        this.selectedFilePath = null;
        this.currentContent = null;
        this.isSvgContent = false;
    }

    ensurePanel() {
        if (this.panel) {
            this.updateWebview();
            this.panel.reveal();
        } else {
            this.displayPanel();
        }
    }

    displayPanel() {
        if (this.panel) {
            this.postUpdate();
            this.panel.reveal();
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            this.id, 
            this.name,
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        );

        this.panel.webview.html = this.getWebviewContent();
        this.panel.onDidDispose(() => this.panel = null);
        this.panel.webview.onDidReceiveMessage(
            message => this.handleWebviewMessage(message),
            undefined,
            []
        );

        this.panel.onDidChangeViewState(e => {
            if (e.webviewPanel.visible && this.currentContent){
                this.postUpdate();
            }
        });
    }

    handleWebviewMessage(message) {
        if (message.command === 'button.run') {
            this.runButton(message.button);
        } else if (message.command === 'fileSelected') {
            this.selectFile(message.path);
        }
    }

    runButton(buttonId) {
        const buttonObj = this.buttons.find(button => button.id === buttonId);
        if (buttonObj) {
            vscode.commands.executeCommand('button.run', buttonObj);
        } else {
            vscode.window.showErrorMessage(`Button ${buttonId} not found`);
        }
    }

    selectFile(path) {
        this.selectedFilePath = path;
        const selectedFile = this.generatedFiles.find(f => f.path === path);
        if (selectedFile && this.panel) {
            this.currentContent = selectedFile.content;
            this.isSvgContent = selectedFile.content.trim().startsWith('<svg');
            this.postUpdate();
        }
    }

    renderDiagram(svg) {
        this.currentContent = svg;
        this.isSvgContent = true;
        this.ensurePanel();
        this.postUpdate();
    }

    postUpdate() {
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'updateContent',
                content: this.currentContent,
                isSvg: this.isSvgContent
            });
        }
    }

    updateWebview() {
        if (this.panel) {
            this.panel.webview.html = this.getWebviewContent();
        }
    }

    getWebviewContent() {
        const buttonsHtml = this.renderButtons();
        const dropdownHtml = this.renderDropdown();
        const initialContent = this.language !== "multi" && this.generatedFiles[0]?.content && !this.currentContent
            ? this.generatedFiles[0].content
            : '';

        return `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>${this.name}</title>
                ${this.getStyles()}
                ${this.getScript()}
            </head>
            <body>
                <div id="title-container">
                    <h1 id="title">${this.name}</h1>
                    <div id="buttons-container">${buttonsHtml}</div>
                </div>
                <div id="content-container">
                    ${dropdownHtml}
                    <div id="content">${initialContent}</div>
                </div>
            </body>
        </html>`;
    }

    renderButtons() {
        return this.buttons.map(button => 
            `<button onclick="handleButtonClick('${button.id}')">${button.hint}</button>`
        ).join('') || '';
    }

    renderDropdown() {
        if (this.language !== "multi" || this.generatedFiles.length === 0) return '';

        const options = this.generatedFiles.map(file => 
            `<option value="${file.path}" ${file.path === this.selectedFilePath ? 'selected' : ''}>${file.path}</option>`
        ).join('');

        return `
            <select id="fileSelector" onchange="handleFileSelect(this.value)">
                <option value="" ${!this.selectedFilePath ? 'selected' : ''}>Select a file</option>
                ${options}
            </select>
        `;
    }

    getStyles() {
        return `<style>
            body { display: flex; flex-direction: column; height: 100vh; margin: 0; overflow: hidden; }
            #title-container { display: flex; justify-content: space-between; align-items: center; width: 80%; padding: 20px; flex-shrink: 0; }
            #title { flex-grow: 1; text-align: left; margin: 0; }
            #buttons-container { display: flex; gap: 10px; }
            #content-container { flex-grow: 1; display: flex; flex-direction: column; width: 100%; overflow: hidden; padding: 20px; box-sizing: border-box; }
            #fileSelector { width: 100%; padding: 8px; margin-bottom: 10px; }
            #content { flex-grow: 1; overflow: auto; margin: 0; width: 100%; height: 100%; }
            #content:not(:empty) { white-space: pre-wrap; }
            button { padding: 8px 15px; font-size: 14px; cursor: pointer; border: none; background-color: #007acc; color: white; border-radius: 5px; }
            button:hover { background-color: #005f99; }
        </style>`;
    }

    getScript() {
        return `<script>
            const vscode = acquireVsCodeApi();
            function handleButtonClick(button){
                vscode.postMessage({ command: 'button.run', button: button });
            }
            function handleFileSelect(path){
                if (path) {
                    vscode.postMessage({ command: 'fileSelected', path: path });
                } else {
                    document.getElementById('content').innerHTML = '';
                }
            }
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'updateContent'){
                    const contentDiv = document.getElementById('content');
                    if (message.isSvg) {
                        contentDiv.innerHTML = message.content;
                    } else {
                        contentDiv.textContent = message.content;
                    }
                }
            });
        </script>`;
    }
}

export { ExtensionOutputPanel };