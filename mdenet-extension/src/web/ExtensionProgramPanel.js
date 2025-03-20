import * as vscode from 'vscode';
import { ExtensionPanel } from './ExtensionPanel';

class ExtensionProgramPanel extends ExtensionPanel{
    constructor(id, fileLocation){
        super(id);
        this.fileLocation = fileLocation;
        this.doc = null;
        this.content = null;
    }
    async initialize() {
        if (this.fileLocation?.startsWith('http')) {
            await this.fetchRemoteFile();
        } else {
            await this.openLocalFile();
        }
    }
    
    async openLocalFile() {
        try {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const filePath = `${workspacePath}/${this.fileLocation}`;
            console.log(`Opening file: ${filePath}`);
            this.doc = await vscode.workspace.openTextDocument(filePath);
        } catch (error) {
            console.error('Error opening local file:', error);
        }
    }
    
    async fetchRemoteFile() {
        console.log(`Fetching URL: ${this.fileLocation}`);
        try {
            const response = await fetch(this.fileLocation);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            this.content = await response.text();
        } catch (error) {
            console.error('Error fetching URL content:', error);
            this.doc = await vscode.workspace.openTextDocument({
                content: `Error fetching URL content: ${error.message}`,
                language: 'plaintext'
            });
        }
    }

    async displayPanel(targetColumn=vscode.ViewColumn.One){
        if(this.content && (!this.doc || this.doc.isClosed)){
            this.doc = await vscode.workspace.openTextDocument({
                content: this.content,
            });
        }
        await vscode.window.showTextDocument(this.doc, { preview: false, viewColumn: targetColumn });
    }

    getValue(){
        if (this.doc){
            return this.doc.getText();
        }
        else{
            return this.content;
        }
    }

}

export { ExtensionProgramPanel };
