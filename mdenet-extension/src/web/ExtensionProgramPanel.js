import * as vscode from 'vscode';
import { ExtensionPanel } from './ExtensionPanel';

class ExtensionProgramPanel extends ExtensionPanel{
    constructor(id, fileLocation){
        super(id);
        this.fileLocation = fileLocation;
        this.doc = null;
    }
    async initialize(){
        let doc = null;
        if (this.fileLocation && !this.fileLocation.startsWith('http') && !this.fileLocation.startsWith('https')){
            console.log('Opening file: ' + vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + this.fileLocation);
            doc = await vscode.workspace.openTextDocument(vscode.workspace.workspaceFolders[0].uri.fsPath + '/' + this.fileLocation);
        }
        else{
            console.log('Opening URL: ' + this.fileLocation);
            doc = await vscode.workspace.openTextDocument();
        }
        this.doc = doc;
    }

    async displayPanel(targetColumn=vscode.ViewColumn.One){
        await vscode.window.showTextDocument(this.doc, { preview: false, viewColumn: targetColumn });
    }

    getValue(){
        return this.doc.getText();
    }

}

export { ExtensionProgramPanel };
