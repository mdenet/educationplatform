import {EducationPlatformError} from "./EducationPlatformError.js" 

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

}

export {ConfigValidationError}