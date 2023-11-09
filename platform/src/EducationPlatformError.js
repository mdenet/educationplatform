
class EducationPlatformError extends Error {

    constructor(message){

        super(message);

        this.name= "EducationPlatformError";
    }

}

export {EducationPlatformError}