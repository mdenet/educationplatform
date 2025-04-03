import * as vscode from 'vscode';
import { EducationPlatformError } from '../../../platform/src/EducationPlatformError';

class ExtensionErrorHandler {
    constructor() {

    }

    /**
     * Displays the given error
     * @param {string} message - The message to display if provided
     * @param {*} error - The error to display if provided
     */
    notify(message, error) {
        let displayMessage = '';

        if (message) {
            displayMessage = message;
        }

        if (message && error) {
            displayMessage += '\n\n';
        }

        if (error) {
            if (error instanceof EducationPlatformError) {
                displayMessage += `${error.message}`;
            } else if (error instanceof Error) {
                displayMessage += `${error.constructor.name} - ${error.message}`;
            } else {
                displayMessage += `value - ${String(error)}`;
            }
        }
        vscode.window.showErrorMessage(displayMessage);
    }
}

export { ExtensionErrorHandler };
