import { ErrorHandler } from "../../../platform/src/ErrorHandler";
import * as vscode from 'vscode';

class ExtensionErrorHandler{
    constructor(){
        
    }

    notify(message,error){
        let displayMessage = "";

        if (message){
            displayMessage = message;
        }

        if (error){
            if (error instanceof Error){
                displayMessage += error.constructor.name;
            } else {
                displayMessage += String(error);
            }
        }

        vscode.window.showErrorMessage(displayMessage);
    }

}

export { ExtensionErrorHandler }