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
            await this.initializePanels();
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

    async initializePanels(){
        if (this.activity.outputLanguage != null) {
            this.outputLanguage = this.activity.outputLanguage;
        }

        // Create panels for the given activities
        for ( let apanel of this.activity.panels ){
            var newPanel = await this.createPanelForDefinitionId(apanel);
            if (newPanel != null){
                this.panels.push(newPanel);
            }
        }

    }

    displayErrors(errors){
        throw new Error("Implement displayErrors in subclass");
    }

    async createPanelForDefinitionId(panel){
        const panelDefinition = panel.ref;
        var newPanel = null;

        const newPanelId= panel.id;

        if (panelDefinition != null){
            newPanel = await this.createPanel(panel,panelDefinition, newPanelId);
        }

        newPanel.setTitle(panel.name);

        if(panel.icon != null){
            newPanel.setIcon(panel.icon);
        } else{
            newPanel.setIcon(panelDefinition.icon);
        }

        if (panel.buttons == null && panelDefinition.buttons != null){
            // No activity defined buttons
            newPanel.addButtons( this.createButtons( panelDefinition.buttons, panel.id));

        } else if (panel.buttons != null) {
            // The activity has defined the buttons, some may be references to buttons defined in the tool spec
            let resolvedButtonConfigs = panel.buttons.map(btn =>{    
                let resolvedButton;

                if (btn.ref){
                    if (panelDefinition.buttons != null) {
                        // button reference so resolve
                        resolvedButton = panelDefinition.buttons.find((pdBtn)=> pdBtn.id===btn.ref);
                    }
                } else {
                    // activity defined button
                    resolvedButton = btn;
                }
                return resolvedButton;
            });
            panel.buttons = resolvedButtonConfigs;
            newPanel.addButtons(this.createButtons( resolvedButtonConfigs, panel.id));
        }
        return newPanel;
    }

    async createPanel(panel,panelDefinition, newPanelId){
        throw new Error("Implement createPanel in subclass");
    }

    createButtons(buttonConfigs, id){
        throw new Error("Implement createButton in subclass");
    }


  
}

export { GeneralEducationPlatformApp };