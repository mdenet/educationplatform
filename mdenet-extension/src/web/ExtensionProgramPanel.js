import * as vscode from 'vscode';
import { ExtensionPanel } from './ExtensionPanel';

class ExtensionProgramPanel extends ExtensionPanel{
    constructor(id, fileLocation){
        super(id);
        this.fileLocation = fileLocation;
        this.doc = null;
        this.content = null;
    }

    /**
     * Initializes the program panel by either opening a local file or fetching a remote file.
     */
    async initialize() {
        if(this.fileLocation instanceof vscode.Uri) {
            await this.openLocalFile();
        }
        else {
            await this.fetchRemoteFile();
        }

    }
    
    /**
     * Opens a local file in the workspace.
     */
    async openLocalFile() {
        try {
            this.doc = await vscode.workspace.openTextDocument(this.fileLocation);
        } catch (error) {
            vscode.window.showErrorMessage(`Error opening local file: ${error.message}`);
        }
    }
    
    /**
     * Fetches a remote file from the specified URL.
     */
    async fetchRemoteFile() {
        try {
            const response = await fetch(this.fileLocation);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.content = await response.text();
        } catch (error) {
            vscode.window.showErrorMessage(`Error fetching remote file: ${error.message}`);
        }
    }

    /**
     * Displays the panel in a specific view column.
     * @param {vscode.viewColumn} targetColumn - The target view column where the panel should be displayed.
     * @returns 
     */
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

    /**
     * @returns {string} The content of the document.
     */
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
