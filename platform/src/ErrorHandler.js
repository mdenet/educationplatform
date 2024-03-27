import { EducationPlatformError } from "./EducationPlatformError";

class ErrorHandler {

    displayError;

    /**
     * @param {Function} notifier - The function to use for displaying error messages. 
     */
    constructor(notifier){

        this.displayError = notifier;

        window.onerror = () => {
            // TODO log unhandled exceptions/errors to remote server
        };
    }

    /**
     * Displays the given error 
     * @param message - The message to display
     * @param {EducationPlatformError} error - The error to display
     */
    notify(message, error){
        let displayMessage = "";

        if (message){
            displayMessage = message;
        }

        if (message && error){
            displayMessage += "<br><br>"
        }

        if (error instanceof EducationPlatformError){
            displayMessage += `<i>${error.message}</i>`;
        } else {
            // Other errors mark as unknown
            displayMessage += `<i>Unknown - ${error.message}</i>`;
        }

        this.displayError(displayMessage);
    }
    
}

export {ErrorHandler}