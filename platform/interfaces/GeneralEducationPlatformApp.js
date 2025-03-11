import { ActivityValidator } from "../src/ActivityValidator";
const COMMON_UTILITY_URL = "https://ep.mde-network.org/common/utility.json";

class GeneralEducationPlatformApp{
    outputType;
    outputLanguage;
    activity;
    panels;

    errorHandler;
    fileHandler;
    activityManager;
    toolsManager;
    wsUri

    constructor(errorHandler) {
        this.outputType = "text";
        this.outputLanguage = "text";
        this.errorHandler = errorHandler;
        this.panels = [];
    }

    async initializeActivity(toolsManager,activityManager){

        let errors = [];

        if (errors.length==0){
            // An activity configuration has been provided
            this.toolsManager = toolsManager;
            this.activityManager = activityManager;
            await this.activityManager.initializeActivities();
            errors = errors.concat(this.activityManager.getConfigErrors());
        } 

        if (errors.length==0){
            // The activities have been validated
            this.toolsManager.setToolsUrls( this.activityManager.getToolUrls().add(COMMON_UTILITY_URL) );
            errors = errors.concat(this.toolsManager.getConfigErrors());
        }

        if (errors.length==0){
            // The tools have been validated 
            this.activityManager.showActivitiesNavEntries();

            // Import tool grammar highlighting 
            const  toolImports = this.toolsManager.getToolsGrammarImports(); 

            this.handleToolImports(toolImports);

            // Add Tool styles for icons 
           for (let toolUrl of this.toolsManager.toolsUrls){
                this.addToolIconStyles(toolUrl);
            }
            
            this.activity = this.activityManager.getSelectedActivity(); 

            // Validate the resolved activity
            errors = errors.concat( ActivityValidator.validate(this.activity, this.toolsManager.tools) );   
        }

        if  (errors.length==0){
            // The resolved activity has been validated
            this.initializePanels();
        }

        if (errors.length > 0) {
            this.displayErrors(errors);
        }
    }

    handleToolImports(toolImports){
        throw new Error("Implement handleToolImports in subclass");
    }

    addToolIconStyles(toolUrl){
        throw new Error("Implement addToolIconStyles in subclass");
    }

    initializePanels(){
        throw new Error("Implement initializePanels in subclass");
    }

    displayErrors(errors){
        throw new Error("Implement displayErrors in subclass");
    }

  
}

export { GeneralEducationPlatformApp };