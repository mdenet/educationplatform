import { ExtensionPanel } from './ExtensionPanel.js';
import * as vscode from 'vscode';

class ExtensionConsolePanel extends ExtensionPanel{

    constructor(id){
        super(id);
        this.type = 'console';
        this.outputChannel = vscode.window.createOutputChannel("MDENet"+this.id);
        this.outputChannel.show();
    }

    displayPanel(){
        this.outputChannel.show(true);
    }

    setError(str){
        this.outputChannel.appendLine(`[Error] ${str}`);
        this.outputChannel.show(true);
    }

    setValue(str){
        this.outputChannel.appendLine(str);
        this.outputChannel.show(true);
    }
}

export { ExtensionConsolePanel };