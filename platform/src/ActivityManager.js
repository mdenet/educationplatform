
/*global $ -- jquery is externally imported*/
import { urlParamPrivateRepo, parseConfigFile } from "./Utility.js";
import { ActivityConfigValidator } from "./ActivityConfigValidator.js";
import { EducationPlatformError } from "./EducationPlatformError.js";
import {utility} from "./Utility.js"

const NAV_ID_PREFIX = "nav-entry-";

class ActivityManager {

    activityId;
    visibleActivities = 15;
    activitiesUrl;
    customActivitiesUrl = false;
    toolsUrl;
    customToolsUrl= false;
    configErrors = [];
    configValidator;
    activities = {};
    activeSubMenu;

    accessPanelDef;
    fileHandler;

    

    constructor( panelDefAccessor, fileHandler ) {

        this.configValidator = new ActivityConfigValidator();

        this.accessPanelDef = panelDefAccessor; // Obtain tool panel definitions from thier ID
        this.fileHandler = fileHandler;

        // Retrieve the url of the activities configuration
        this.activitiesUrl = utility.getActivityURL();
        this.activitiesUrl ? this.customActivitiesUrl = true : this.customActivitiesUrl = false;
    }

    /**
     *  Intialises activities by fetching the activities from the activitiesUrl 
     *  remote and resolving action references.
     */
    initializeActivities(){
        this.configErrors = this.configErrors.concat(this.fetchActivities());

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
    fetchActivities() {
        let errors = []; 
        let fileContent

        try {
            let file = this.fileHandler.fetchFile( this.activitiesUrl , urlParamPrivateRepo() );
            fileContent = file.content;
        } catch (err) {
            errors.push( new EducationPlatformError(`The activity configuration file was not accessible at: ${this.activitiesUrl}. 
                                                    Check the activity file is available at the given url and you have the correct access rights.`) );
        }

        if (fileContent != null){

            let validatedConfig = this.parseAndValidateActivityConfig(fileContent);

            if ( validatedConfig.errors.length == 0 ){

                this.createActivitiesMenu(validatedConfig.config);

            } else {
                // Error config file parsing error
                errors = errors.concat(validatedConfig.errors);
            }
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

        for (const activity of config.activities) {

            if (activity.id) {
                this.storeActivity(activity);
                this.createActivityMenuEntry(null, activity);
            }
            else {
                var active = false;
                for (const nestedActivity of activity.activities) {
                    this.storeActivity(nestedActivity);
                    if (nestedActivity.id == this.activityId) {
                        active = true;
                    }
                }

                var subMenu = this.createActivitiesSubMenu(activity.title, active);

                for (const nestedActivity of activity.activities) {
                    this.createActivityMenuEntry(subMenu, nestedActivity);
                }
            }
        }
    }


    subMenuNumber = 0;

    createActivitiesSubMenu(title, active = false) {
        this.subMenuNumber ++;

        var li = document.createElement("li");
        if (active) {
            li.setAttribute("class", "active-container");
        }


        this.appendTopLevelActivityMenuItem(li);
        var a = document.createElement("a");
        if (active) a.setAttribute("id", "activeActivitiesSubMenu");
        a.setAttribute("class", "dropdown-toggle");
        
        a.setAttribute("href", "#");
        li.appendChild(a);

        var icon = document.createElement("span");
        icon.setAttribute("class", "icon");
        a.appendChild(icon);
        
        var mif = document.createElement("span");
        mif.setAttribute("class", "mif-folder");
        icon.appendChild(mif);

        var caption = document.createElement("span");
        caption.setAttribute("class", "caption");
        caption.innerText = title;
        a.appendChild(caption);

        var menu = document.createElement("ul");
        menu.setAttribute("class", "navview-menu stay-open");
        menu.setAttribute("data-role", "dropdown");
        li.appendChild(menu);

        return menu;
    }

    openActiveActivitiesSubMenu() {
        document.getElementById("activeActivitiesSubMenu")?.click();
    }

    createActivityMenuEntry(parent, activity) {  

        // Add a link for the activity to the left hand side menu
        var li = document.createElement("li");
        li.setAttribute("id", NAV_ID_PREFIX + activity.id);
        li.setAttribute("class", "no-visible"); // Start off hidden

        var a = document.createElement("a");
        a.href = "?" + activity.id;
        if (this.customActivitiesUrl) {
            a.href += "&activities=" + this.activitiesUrl;
        }

        if (urlParamPrivateRepo()){
            a.href += "&privaterepo=true"
        }

        li.appendChild(a);

        var icon = document.createElement("span");
        icon.classList.add("icon");
        a.appendChild(icon);

        var mif = document.createElement("span");
        mif.classList.add("mif-activity-16");
        mif.classList.add("mif-" + activity.icon);
        icon.appendChild(mif);

        var caption = document.createElement("caption");
        caption.innerHTML = activity.title;
        caption.classList.add("caption");
        a.appendChild(caption);

        if (parent) {
            parent.appendChild(li);
        }
        else {
            this.appendTopLevelActivityMenuItem(li);
        }
    }

    appendTopLevelActivityMenuItem(element) {
        var activitiesEnd = document.getElementById("examplesEnd");
        activitiesEnd.parentNode.insertBefore(element, activitiesEnd);
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
        let result = someString;

        for (let i = 0; i < sessionStorage.length; i++) {
            let currentKey = sessionStorage.key(i);

            if (currentKey !== "isAuthenticated") {
                // TODO: This *assumes* this can only be a panel ID, but that may change over time,
                // so this code may need to be improved to only allow access to panel IDs explicitly
                // Removing trailing slash to avoid double slashes
                result = result.replace("{{ID-" + currentKey + "}}", sessionStorage.getItem(currentKey).replace(/\/$/, ""));
            }
        }

        return result;
    }

    /* resolve panel refs recursively because of CompositePanels */
    resolveRef(panelList) {
        for ( let apanel of panelList ){
                
            if (apanel.file != null) {
                let panelURLString = this.interpolate(apanel.file);
                apanel.url =  new URL(panelURLString, this.activitiesUrl).href; 
                let file = this.fetchFile(panelURLString);
                if (file) {
                    apanel.file = file.content;
                    apanel.sha = file.sha; 
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

        let fileUrl = new URL(name, this.activitiesUrl).href 

        return this.fileHandler.fetchFile( fileUrl, urlParamPrivateRepo() );
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

        if (visible){
            $("#"+ NAV_ID_PREFIX + activityid).removeClass("no-visible");
        } else {
            $("#"+ NAV_ID_PREFIX + activityid).addClass("no-visible");
        }
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
        return ( sessionStorage.getItem(panelId) != null );
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





export {ActivityManager};
