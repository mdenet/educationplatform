import {EducationPlatformError} from "./EducationPlatformError.js" 

const CONTEXT_SEPARATOR = "->";

class ConfigValidationError extends EducationPlatformError {

    fileType;
    location;
    category;

    constructor(category, message, location, fileType){

        super(message);
        this.name= "ConfigValidationError";
        this.category= category;
        this.location=location;
        this.fileType= fileType;
    }


    /**
     * Prepends the addtional context to errors location. 
     * @param {String} context - The context to prepend.
     * @param {String} separator - The separtor to insert. 
     */
    addContext(context, separator=CONTEXT_SEPARATOR){
        this.location = context + " " + separator + " " + this.location;
    }

    /**
     * Prepend additional context to multiple errors.
     * @param {ConfigValidationError[]} errors 
     * @param {String} context - The context to prepend.
     * @param {String} separator - The separtor to insert. 
     */
    static addContextToErrors(errors, context, separator=CONTEXT_SEPARATOR){
        errors.forEach( (e) => e.addContext(context, separator) );
    }
}

export {ConfigValidationError, CONTEXT_SEPARATOR}