import { ExtensionPanel } from './ExtensionPanel.js';
import * as vscode from 'vscode';

class ExtensionOutputPanel extends ExtensionPanel{

    constructor(id,name){
        super(id);
        this.name = name
    }

    initialize(){
        this.panel = null;
        this.buttons = [];
    }

    displayPanel(content = '') {
        if (this.panel != null && content === ''){
            this.panel.reveal();
            return;
        }
        if (this.panel != null){
            this.panel.webview.html = this.getWebviewContent(content);
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel(
            this.id, this.name, 
            vscode.ViewColumn.One,
            { enableScripts: true }
          );
      
          // Set HTML content for the Webview
        this.panel.webview.html = this.getWebviewContent(content);
        this.panel.onDidDispose(() => {
            this.panel = null;
        });
        this.panel.webview.onDidReceiveMessage(
            message => {
                if (message.command === 'button.run') {
                    console.log("Running button", message.button);
                    const buttonObj = this.buttons.find(button => button.id === message.button);
                    console.log("Found button", buttonObj);
                    if (buttonObj) {
                        vscode.commands.executeCommand('button.run', buttonObj);
                    }
                }
            },
            undefined,
            []
        );
    }

    renderDiagram(svg){
        this.displayPanel(svg);
       
    }

    getWebviewContent(svg = "") {
        // Generate buttons from this.buttons
        const buttonsHtml = this.buttons.map(button => 
            `<button onclick="handleButtonClick('${button.id}')">${button.hint}</button>`
        ).join('') || '';
    
        return `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <title>${this.name}</title>
                <style>
                    body { 
                        display: flex; 
                        flex-direction: column; 
                        height: 100vh; 
                        margin: 0;
                        overflow: hidden;
                    }
    
                    #title-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        width: 80%;
                        padding: 20px;
                        flex-shrink: 0;
                    }
    
                    #title {
                        flex-grow: 1;
                        text-align: left;
                        margin: 0;
                    }
    
                    #buttons-container {
                        display: flex;
                        gap: 10px;
                    }
    
                    #diagram-container {
                        flex-grow: 1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        overflow: auto;
                        padding: 20px;
                        box-sizing: border-box;
                        position: relative;
                        cursor: grab;
                    }
    
                    #svg-wrapper {
                        transition: transform 0.1s ease;
                        position: absolute;
                        transform-origin: center center;
                    }
    
                    button {
                        padding: 8px 15px;
                        font-size: 14px;
                        cursor: pointer;
                        border: none;
                        background-color: #007acc;
                        color: white;
                        border-radius: 5px;
                    }
    
                    button:hover {
                        background-color: #005f99;
                    }
                </style>
                <script>
                    const vscode = acquireVsCodeApi();
                    let scale = 1;
                    let translateX = 0;
                    let translateY = 0;
                    let startX, startY;
                    const scaleStep = 0.1;
                    const minScale = 0.2;
                    const maxScale = 3;

                    function handleButtonClick(button) {
                        vscode.postMessage({
                            command: 'button.run',
                            button: button
                        });
                    }

                    function updateTransform() {
                        const svgWrapper = document.getElementById('svg-wrapper');
                        svgWrapper.style.transform = 
                            \`scale(\${scale}) translate(\${translateX}px, \${translateY}px)\`;
                    }

                    document.addEventListener('DOMContentLoaded', () => {
                        const container = document.getElementById('diagram-container');
                        const svgWrapper = document.getElementById('svg-wrapper');

                        // Mouse wheel zoom
                        container.addEventListener('wheel', (e) => {
                            e.preventDefault();
                            const delta = e.deltaY > 0 ? -scaleStep : scaleStep;
                            const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));
                            if (newScale !== scale) {
                                scale = newScale;
                                updateTransform();
                            }
                        });

                    });
                </script>
            </head>
            <body>
                <div id="title-container">
                    <h1 id="title">${this.name}</h1>
                    <div id="buttons-container">
                        ${buttonsHtml}
                    </div>
                </div>
                <div id="diagram-container">
                    <div id="svg-wrapper">
                        ${svg}
                    </div>
                </div>
            </body>
        </html>`;
    }
}

export { ExtensionOutputPanel };