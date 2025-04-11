import { ExtensionPanel } from './ExtensionPanel.js';
import * as vscode from 'vscode';

class ExtensionConsolePanel extends ExtensionPanel{

    constructor(id="console"){
        super(id);
        
    }

    /**
     * Initializes the console panel by creating an output channel.
     * The output channel is used to display messages and errors.
     */
    initialize(){
        this.outputChannel = vscode.window.createOutputChannel("MDENet"+this.id);
        this.outputChannel.show();
    }

    /**
     * Focuses the output channel, bringing it to the front.
     */
    displayPanel(){
        this.outputChannel.show(true);
    }

    setError(str){
        this.outputChannel.appendLine(`[Error] ${str}`);
        this.outputChannel.show(true);
    }

    setValue(value){
        this.setOutput(value+"");
    }

    setOutput(str){
        this.outputChannel.appendLine(str);
        this.outputChannel.show(true);
    }
}

export { ExtensionConsolePanel };