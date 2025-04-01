
/*global $ -- jquery is externally imported*/
import { parseConfigFile } from "../src/Utility.js";
import { ActivityConfigValidator } from "../src/ActivityConfigValidator.js";


class GeneralActivityManager {

    activityId;
    toolsUrl;
    configErrors = [];
    configValidator;
    activities = {};

    accessPanelDef;
    fileHandler;

    constructor( panelDefAccessor, fileHandler ) {
        this.configValidator = new ActivityConfigValidator();
        this.accessPanelDef = panelDefAccessor; // Obtain tool panel definitions from thier ID
        this.fileHandler = fileHandler;
    }

    /**
     *  Intialises activities by fetching the activities from the activitiesUrl 
     *  remote and resolving action references.
     */
    async initializeActivities(){
        this.configErrors = this.configErrors.concat(await this.fetchActivities());

        for(var activityKey of Object.keys(this.activities)) {
            this.resolveActionReferences( this.activities[activityKey].id );
        }
    }

    resolveActionReferences(activityId){
        
        let activity = this.activities[activityId];
        
        for( var action of activity.actions ) {
            action.source = this.resolvePanelReference(activityId, action.source); 
            
            for ( const paramKey of Object.keys(action.parameters) ){

                action.parameters[paramKey] = this.resolvePanelReference( activityId, action.parameters[paramKey] );
            }
            
            action.output = this.resolvePanelReference(activityId, action.output);
            action.outputConsole = this.resolvePanelReference(activityId, action.outputConsole);
        }
    }

    /**
     * Finds the panel for a given reference 
     * @param {*} activityId 
     * @param {*} panelRef 
     * @returns {Panel|any} The found panel or the unchanged reference
     */
    resolvePanelReference(activityId, panelRef){

        const foundPanel = this.findPanel(panelRef,this.activities[activityId].panels);

        if ( foundPanel != undefined && typeof foundPanel.id == "string" ){
            
            return foundPanel;

        } else {

            return panelRef;
        }
    }

    /**
     * Required to search within CompositePanels
     * 
     * @param {*} panelRef 
     * @param {*} panelList 
     * @returns 
     */
    findPanel(panelRef, panelList) {
        for(let panel of panelList) {
            if (panel.id == panelRef) return panel;
            else {
                if (panel.childPanels) {
                    const pnl = this.findPanel(panelRef, panel.childPanels)
                    if (pnl) return pnl;
                }
            }
        }
        return undefined;
    }

    /**
     * Fetches all the activities from activitiesUrl
     * and populates the activities array
     * @returns errors from parsing and validation
     */
    async fetchActivities() {
        throw new Error("Override this method in the subclass");
    }

    /**
     * Processes the activity configuration file content.
     *
     * @param {string} fileContent - The content of the activity configuration file.
     * @param {Array} errors - An array to store any errors encountered during processing.
     * @returns {Array} The updated array of errors after processing the configuration.
     */
    processActivityConfig(fileContent, errors){
        let validatedConfig = this.parseAndValidateActivityConfig(fileContent);

        if ( validatedConfig.errors.length == 0 ){

            this.createActivitiesMenu(validatedConfig.config);

        } else {
            // Error config file parsing error
            errors = errors.concat(validatedConfig.errors);
        }
        return errors;
    }

    /**
     * Parses and validates an activity file
     * @param {*} activityFile 
     * @returns object containing the validated config file object and an array of errors
     */
    parseAndValidateActivityConfig(activityFile){
        let validationResult = {};

        validationResult.errors = [];

        let config = parseConfigFile(activityFile);

        if (config instanceof Error) {
            // Parsing failed
            validationResult.errors.push(config);
        }

        if (validationResult.errors == 0){
            // Parsed correctly so validate activity configuration
            validationResult.errors =  validationResult.errors.concat( 
                this.configValidator.validateConfigFile(config) 
            );
        }

        if (validationResult.errors == 0){
            validationResult.config = config;
        } else {
            validationResult.config = null;
        }
        
        return validationResult;
    }

    /**
     * Create the activities menu
     * @param {*} config valid activities configuration object
     */
    createActivitiesMenu(config){
        throw new Error("Override this method in the subclass");
    }

    storeActivity(activity) {

        if (!this.activityId) {
            this.activityId = activity.id;
        }
        
        this.activities[activity.id] = activity;
    
    }

    getSelectedActivity() {
        return this.fetchActivity(this.activityId);
    }

    hasActivity(id) {
       return this.activities[id] != null;
    }

    getActivityId() {
        return this.activityId;
    }

    /**
     * Returns the tool panel definition id that a Panel definition references 
     * @param {*} panelId 
     * @returns 
     */
    getPanelRefId(panelId){
        
        for ( const activitykey of  Object.keys(this.activities)){
            const foundPanel = this.activities[activitykey].panels.find( pn => pn.id==panelId );
            if ( foundPanel != undefined){
                return foundPanel.ref;
            } 
        } 
        
        console.log("Panel with definition id '" + panelId + "' not found.");
        return null;
    }

    /**
     * Interpolate someString using information from session storage.
     * 
     * @param {*} someString the string to be changed
     */
    interpolate(someString) {
        throw new Error("Override this method in the subclass");
    }

    /* resolve panel refs recursively because of CompositePanels */
    resolveRef(panelList) {
        for ( let apanel of panelList ){
            
            if (apanel.file != null) {
                let panelURLString = this.interpolate(apanel.file);
                apanel.url = this.getPanelFileLocation(panelURLString);
                let file = this.fetchFile(panelURLString);
                if (file) {
                    this.handlePanelFile(apanel,file);
                }
            }

            // Resolve the panel definition reference  
            if ( typeof apanel.ref == "string" ){
                const panelDef = this.accessPanelDef(apanel.ref);

                if (panelDef != null){
                    apanel.ref = panelDef;
                }
            }

            if (apanel.childPanels) {
                this.resolveRef(apanel.childPanels);
            }
        }
    }

    getPanelFileLocation(panelURL){
        throw new Error("Override this method in the subclass");
    }

    handlePanelFile(panel,file){
        throw new Error("Override this method in the subclass");
    }

    /**
     * Fetches the contents of the activity with the provided ID
     */ 
    fetchActivity(id) {

        if (this.hasActivity(id)) {
    
            let activity = this.activities[id];

            this.resolveRef(activity.panels);
        
            return activity;
        }

        // If we are here it means that such an activity has not been found
        let activity = {};
        activity.language = "";
        activity.program = "// Activity " + id + " has not been found";
        activity.secondProgram = "";
        activity.flexmi = "";
        activity.secondFlexmi = "";
        activity.emfatic = "";
        activity.secondEmfatic = "";
        return activity;
    }

    /**
     * Fetches the content of a file under the activities folder
     * This could be an Epsilon program, a Flexmi model or an Emfatic metamodel
     */
    fetchFile(name) {
        throw new Error("Override this method in the subclass");
    }


    /**
     * Finds an action where the panel is the source.
     * @param {*} panelId 
     * @returns The first found action otherwise null.
     */
    getPanelAction(panelId){
        for ( const activitykey of  Object.keys(this.activities)){

            const foundActivity = this.activities[activitykey].actions.find( ac => ac.source==panelId );

            if ( foundActivity != undefined){
                return foundActivity;
            } 
        } 
        
        console.log("Panel with definition id '" + panelId + "' has no action.");
        return null;
    }   

    
    getActionForCurrentActivity(source, sourceButton){
        
        const foundAction = this.activities[this.activityId].actions.find( ac => (ac.source.id==source && ac.sourceButton==sourceButton) );

        if (foundAction != undefined) { 
            return foundAction;

        } else {
            console.log("Action with source '" + source + "' and button " + sourceButton + " not found.");
            return null;
        }
    }


    /**
     * Returns true if the supplied panel ID has an action. 
     * @param {*} panelId the id of the panel to check. 
     */
    panelHasAction(panelId){
  
        return ( this.getPanelAction(panelId) != null );
    }   

    /**
     * Returns all of the tool urls used by the activities removing duplicates.
     * @returns 
     */
    getToolUrls(){
         var toolUrls = [];

         for ( const activitykey of  Object.keys(this.activities)){
            toolUrls = toolUrls.concat(this.activities[activitykey].tools
                                                                   .map((url) => { 
                                                                            return this.interpolate(url); 
                                                                        }));
         }

         return ( new Set(toolUrls) );
    }


    setActivityVisibility(activityid, visible){
        throw new Error("Override this method in the subclass");
    }

    hasGeneratedPanel(activityId){
        
        let generatedPanelFound = false;

        for (const panel of  this.activities[activityId].panels) {
            let panelDef = this.accessPanelDef(panel.ref);
            // If no panel definition can be found, treat the panel as generated. Panel definitions may only be contributed by generated tools.
            if ((!panelDef) || (panelDef.generated  && !this.isPanelGenerated(panel.id))) {
                generatedPanelFound = true;
                break;
            }
        }

        return generatedPanelFound;
    }

    isPanelGenerated(panelId){
        throw new Error("Override this method in the subclass");
    }

    showActivitiesNavEntries(){
        for(var activityKey of Object.keys(this.activities)) {

            // Show activities that have no generated panels
            if (!this.hasGeneratedPanel(activityKey)){
                this.setActivityVisibility(activityKey, true);
            }
        }
    }

    /**
     * Returns the errors found parsing and validating the activty configuration file 
     * @returns array of errors
     */
    getConfigErrors(){
        return this.configErrors;
    }

}

export {GeneralActivityManager};
