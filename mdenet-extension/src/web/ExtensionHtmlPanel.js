import * as vscode from 'vscode';

class ExtensionHtmlPanel{
    constructor(id, name){
        this.id = id;
        this.name = name;
    }

    initialize(htmlContent){
        const panel = vscode.window.createWebviewPanel(
            this.id, 
            this.name,
            vscode.ViewColumn.One,
            { enableScripts: true, retainContextWhenHidden: true }
        )
        panel.webview.html = htmlContent;
    }
}

export { ExtensionHtmlPanel };