import { GeneralEducationPlatformApp } from "../../../platform/interfaces/GeneralEducationPlatformApp";
class ExtensionEducationPlatformApp extends GeneralEducationPlatformApp {
    constructor(errorHandler){;
        super(errorHandler);
    }

    handleToolImports(toolImports){
        console.log("Handling tool imports");
    }

    addToolIconStyles(toolUrl){
        console.log("Adding tool icon styles");
    }

    initializePanels(){
        console.log("Initializing panels");
    }

    displayErrors(errors){
        console.log("Displaying errors");
    }

}

export { ExtensionEducationPlatformApp }