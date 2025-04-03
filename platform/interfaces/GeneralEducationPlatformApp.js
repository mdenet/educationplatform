import { ActivityValidator } from "../src/ActivityValidator";
import { EducationPlatformError} from "../src/EducationPlatformError";
import { utility } from "../src/Utility";

const COMMON_UTILITY_URL = utility.getBaseURL() + "/common/utility.json";
const ACTION_FUNCTION_LANGUAGE_TYPE = "text";

class GeneralEducationPlatformApp{
    outputType;
    outputLanguage;
    activity;
    panels;

    errorHandler;
    fileHandler;
    activityManager;
    toolsManager;
    wsUri;

    constructor(errorHandler) {
        this.outputType = "text";
        this.outputLanguage = "text";
        this.errorHandler = errorHandler;
        this.panels = [];
    }

    async initializeActivity(toolsManager,activityManager,errors){

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
        }
        return newPanel;
    }

    async createPanel(panel,panelDefinition, newPanelId){
        throw new Error("Implement createPanel in subclass");
    }

    createButtons(buttonConfigs, id){
        throw new Error("Implement createButton in subclass");
    }

    runAction(source, sourceButton) {

        // Get the action
        var action = this.activityManager.getActionForCurrentActivity(source, sourceButton);
        if (!action){
            let err = new EducationPlatformError(`Cannot find action given panel '${source}' and button '${sourceButton}'`);
            this.errorHandler.notify("Failed to invoke action.", err);

        } else {
            // Action found so try and invoke
            let buttonConfig;
            
            if(action.source.buttons){
                //Buttons defined by activity
                buttonConfig = action.source.buttons.find (btn => btn.id == sourceButton);
            } else {
                //Buttons defined by tool
                buttonConfig = action.source.ref.buttons.find (btn => btn.id == sourceButton);
            }  


            // Create map containing panel values
            let parameterMap = new Map();

            for (let paramName of Object.keys(action.parameters)){

                let param = {};
                const panelId = action.parameters[paramName].id;
                
                if (panelId) { 
                    const panel = this.activityManager.findPanel(panelId, this.panels);
                    param.type = panel.getType();
                    param.value = panel.getValue();

                } else {
                    // No panel with ID so it use as the parameter value
                    const parameterValue = action.parameters[paramName];
                    param.type = 'text';
                    param.value = parameterValue;
                }

                parameterMap.set(paramName, param);
            }

            // Add the platform language parameter
            let languageParam = {};
            languageParam.type = ACTION_FUNCTION_LANGUAGE_TYPE;
            languageParam.value = action.source.ref.language; // Source panel language
            parameterMap.set("language", languageParam);

            // TODO support output and language 
            //actionRequestData.outputType = outputType;
            //actionRequestData.outputLanguage = outputLanguage;

            // Call backend conversion and service functions
            let actionResultPromise = this.toolsManager.invokeActionFunction(buttonConfig.actionfunction, parameterMap);
            
            this.handleResponseActionFunction(action , actionResultPromise);

            this.displayLongMessage("Executing action");
        }
    }

    /**
     * Handle the response from the remote tool service
     * 
     * @param {Object} action 
     * @param {Promise} requestPromise
     */
    handleResponseActionFunction(action, requestPromise){
        
        requestPromise.then( (responseText) => {

            var response = JSON.parse(responseText);
            const outputPanel = this.activityManager.findPanel( action.output.id, this.panels);

            var outputConsole;
            if (action.outputConsole != null){
                outputConsole = this.activityManager.findPanel(action.outputConsole.id, this.panels);
            } else {
                outputConsole = outputPanel;
            }

            this.removeNotification();

            if ( Object.prototype.hasOwnProperty.call(response, "error")) {
                outputConsole.setError(response.error);
            } else {

                var responseDiagram = Object.keys(response).find( key => key.toLowerCase().includes("diagram") );

                if (response.output) {
                    // Text
                    outputConsole.setValue(response.output)  
                }
                
                if (response.editorID) {
                    this.displayLongMessage("Building editor");

                    this.checkEditorReady(response.editorID, response.editorUrl, action.source.editorPanel, action.source.editorActivity, outputConsole);
                    

                } else if (responseDiagram != undefined) {
                
                    outputPanel.renderDiagram( response[responseDiagram] );
                    
                } else if (response.generatedFiles) {
                    // Multiple text files
                    outputPanel.setGeneratedFiles(response.generatedFiles);

                } else if (response.generatedText) {
                    // Generated file
                    switch (action.outputType){
                        case "code":
                            // Text
                            this.displayGeneratedText(outputPanel,response.generatedText);
                            break;

                        case "html":
                            // Html
                            outputPanel.setOutput(response.output);
                            this.renderHtml(outputPanel,response.generatedText);
                            break; 

                        case "puml": 
                        case "dot":
                            // UML or Graph
                            var krokiEndpoint = "";
                            if (action.outputType == "puml") krokiEndpoint = "plantuml";
                            else krokiEndpoint = "graphviz/svg"

                            var krokiXhr = new XMLHttpRequest();
                            krokiXhr.open("POST", "https://kroki.io/" + krokiEndpoint, true);
                            krokiXhr.setRequestHeader("Accept", "image/svg+xml");
                            krokiXhr.setRequestHeader("Content-Type", "text/plain");
                            krokiXhr.onreadystatechange = function () {
                                if (krokiXhr.readyState === 4) {
                                    if (krokiXhr.status === 200) {

                                        outputPanel.renderDiagram(krokiXhr.responseText);

                                    }
                                }
                            };
                            krokiXhr.send(response.generatedText);
                            break;

                            default:
                                console.log("Unknown output type: " + action.outputType);
                    }
                }

            } 
        }).catch( (err) => {
            this.errorHandler.notify("There was an error translating action function parameter types.", err);
        });

    }

    /**
     * Renders the HTML for the output panel.
     * @override
     * @param {*} outputPanel 
     */
    renderHtml(outputPanel,responseText) {
        throw new Error("Implement renderHtml in subclass");
    }

    /**
     * Display the generated text in the output panel.
     * @override
     * @param {*} outputPanel 
     * @param {*} responseText 
     */
    displayGeneratedText(outputPanel, responseText){
        throw new Error("Implement displayGeneratedText in subclass");
    }

    /**
         * Open a websockets connection to receive status updates on editor build. 
         * @param {String} statusUrl - the url for checking the status of the editor panel.
         * @param {String} editorInstanceUrl - the editor instance's url. 
         * @param {String} editorPanelId - the id of the editor panel.
         * @param {String} editorActivityId - TODO remove as this can be found using editorPanelId to save having to specify in config.
         * @param {Panel} logPanel - the panel to log progress to.
         */
        checkEditorReady(editorID, editorInstanceUrl, editorPanelId, editorActivityId, logPanel){
            var socket = new WebSocket(this.wsUri);   
            var editorReady = false;
            socket.onopen = function(){
                socket.send(editorID);
            };
    
            socket.onmessage = function(e){
                var resultData = JSON.parse(e.data);
                if (resultData.output){
                    logPanel.setValue(resultData.output);
                }
                if(resultData.editorReady){
                    editorReady = true;
                    socket.close();
                    this.updateSessionInfo(editorPanelId, editorInstanceUrl);
                    this.activityManager.setActivityVisibility(editorActivityId, true);
                    this.removeNotification();
                    this.displaySuccessMessage("Building complete");
                    
                }
            }.bind(this);
    
            socket.onclose = function(){
                //If editor is not deployed, a new connection must be established.
                if (!editorReady){
                    if(!socket || socket.readyState == 3){
                        this.checkEditorReady(editorID, editorInstanceUrl, editorPanelId, editorActivityId, logPanel);
                    }
                }
            }.bind(this);
    
                
            if(!socket || socket.readyState == 3){
                this.checkEditorReady(editorID, editorInstanceUrl, editorPanelId, editorActivityId, logPanel);
            }
        }

    displayLongMessage(message){
        throw new Error("Implement displayMessage in subclass");
    }

    displaySuccessMessage(message){
        throw new Error("Implement displaySuccessMessage in subclass");
    }

    removeNotification(){
        throw new Error("Implement removeNotification in subclass");
    }

    updateSessionInfo(editorPanelId, editorInstanceUrl){
        throw new Error("Implement updateSessionInfo in subclass");
    }

}

export { GeneralEducationPlatformApp };