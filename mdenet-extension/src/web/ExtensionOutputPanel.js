import { ExtensionPanel } from './ExtensionPanel.js';
import * as vscode from 'vscode';

class ExtensionOutputPanel extends ExtensionPanel{

    constructor(id,name){
        super(id);
        this.name = name;
        this.panel = null;
        this.buttons = [];
    }

    displayPanel(content = '') {
        if (this.panel != null && content === ''){
            this.panel.reveal();
            return;
        }
        this.panel = vscode.window.createWebviewPanel(
            this.id, this.name, 
            vscode.ViewColumn.One,
            { enableScripts: true } // Webview options (allows JavaScript)
          );
      
          // Set HTML content for the Webview
        this.panel.webview.html = this.getWebviewContent(content);
        this.panel.onDidDispose(() => {
            this.panel = null;
        });
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
                    /* Make the body fill the entire viewport */
                    body { 
                        display: flex; 
                        flex-direction: column; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        margin: 0;
                        text-align: center;
                    }
    
                    /* Title container (20% height) */
                    #title-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        height: 20%;
                        width: 80%;
                        padding: 0 20px;
                    }
    
                    /* Title */
                    #title {
                        flex-grow: 1;
                        text-align: left;
                    }
    
                    /* Buttons container */
                    #buttons-container {
                        display: flex;
                        gap: 10px;
                    }
    
                    /* SVG container (80% height) */
                    #diagram-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 80%;
                        width: 100%;
                    }
    
                    /* Buttons Styling */
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
                    function handleButtonClick(buttonId) {
                        // Send message to VS Code extension
                        console.log("Button clicked: " + buttonId);
                    }
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
                    ${svg}
                </div>
            </body>
        </html>`;
    }
}

export { ExtensionOutputPanel };