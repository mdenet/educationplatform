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
        if(this.fileLocation instanceof vscode.Uri) {
            await this.openLocalFile();
        }
        else {
            await this.fetchRemoteFile();
        }

    }
    
    async openLocalFile() {
        try {
            this.doc = await vscode.workspace.openTextDocument(this.fileLocation);
        } catch (error) {
            vscode.window.showErrorMessage(`Error opening local file: ${error.message}`);
        }
    }
    
    async fetchRemoteFile() {
        try {
            const response = await fetch(this.fileLocation);
            this.content = await response.text();
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching remote file: ${error.message}`);
        }
    }

    async displayPanel(targetColumn=vscode.ViewColumn.One){
        if(this.content && (!this.doc || this.doc.isClosed)){
            this.doc = await vscode.workspace.openTextDocument({
                content: this.content,
            });
        }
        if (!this.doc) {
            vscode.window.showErrorMessage("Unable to display panel: no content or document.");
            return;
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
