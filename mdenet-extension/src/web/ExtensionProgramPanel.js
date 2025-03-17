import * as vscode from 'vscode';
import { ExtensionPanel } from './ExtensionPanel';

class ExtensionProgramPanel extends ExtensionPanel{
    constructor(id, fileLocation){
        super(id);
        this.fileLocation = fileLocation;
        this.doc = null;
        this.content = null;
    }
    async initialize(){
        let doc = null;
        if (this.fileLocation && !this.fileLocation.startsWith('http') && !this.fileLocation.startsWith('https')){
            console.log('Opening file: ' + vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + this.fileLocation);
            doc = await vscode.workspace.openTextDocument(vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + this.fileLocation);
        }
        else{
            console.log('Fetching URL: ' + this.fileLocation);
            try {
                const response = await fetch(this.fileLocation);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const content = await response.text();
                this.content = content;

                doc = await vscode.workspace.openTextDocument({
                    content: content,
                    language: 'plaintext'
                });
            } catch (error) {
                console.error('Error fetching URL content:', error);
                // Create an empty document with error message
                doc = await vscode.workspace.openTextDocument({
                    content: `Error fetching URL content: ${error.message}`,
                    language: 'plaintext'
                });
            }
        }
        this.doc = doc;
    }

    async displayPanel(targetColumn=vscode.ViewColumn.One){
        if(this.content && this.doc.isClosed){
            this.doc = await vscode.workspace.openTextDocument({
                content: this.content,
            });
        }
        await vscode.window.showTextDocument(this.doc, { preview: false, viewColumn: targetColumn });
    }

    getValue(){
        return this.doc.getText();
    }

}

export { ExtensionProgramPanel };
