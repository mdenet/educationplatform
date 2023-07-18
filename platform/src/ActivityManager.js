import { urlParamPrivateRepo } from "./Utility.js";

class ActivityManager {

    activityId;
    visibleActivities = 15;
    activitiesUrl;
    customActivitiesUrl = false;
    toolsUrl;
    customToolsUrl= false;
    activities = {};
    activeSubMenu;

    accessPanelDef;
    fileHandler;

    constructor( panelDefAccessor, fileHandler ) {

        this.accessPanelDef = panelDefAccessor; // Obtain tool panel definitions from thier ID
        this.fileHandler = fileHandler;

        // Retrieve the url of the activities configuration
        var parameters = new URLSearchParams(window.location.search);
        if (parameters.has("activities")) {
            this.customActivitiesUrl = true;
            this.activitiesUrl = parameters.get("activities");
        }


        var parameterKeys = Array.from(parameters.keys());

        // Retrieve selected activity from the url parameters 
        for (const key of parameterKeys) {
            if (!parameters.get(key)) {
                this.activityId = key;
                break;
            }
        }

        this.fetchActivities();

        for(var activityKey of Object.keys(this.activities)) {
            this.resolveActionReferences( this.activities[activityKey].id );
        }
    }



    resolveActionReferences(activityId){
        
        var activity = this.activities[activityId];
        
        for( var action of activity.actions ) {
            action.source = this.resolvePanelReference(activityId, action.source); 
            
            for ( const paramKey of Object.keys(action.parameters) ){

                action.parameters[paramKey] = this.resolvePanelReference( activityId, action.parameters[paramKey] );
            }
            
            action.output = this.resolvePanelReference(activityId, action.output);
        }
    }

    /**
     * Finds the panel for a given reference 
     * @param {*} activityId 
     * @param {*} panelRef 
     * @returns {Panel|any} The found panel or the unchanged reference
     */
    resolvePanelReference(activityId, panelRef){

        const foundPanel = this.activities[activityId].panels.find( pnl => pnl.id == panelRef );

        if ( foundPanel != undefined && typeof foundPanel.id == "string" ){
            
            return foundPanel;

        } else {

            return panelRef;
        }
    }

    /**
     * Fetches all the activities from activitiesUrl
     * and populates the activities array
     */
    fetchActivities() {

        let file  = this.fileHandler.fetchFile( this.activitiesUrl , urlParamPrivateRepo() )
        let fileContent = file.content;

        if (fileContent != null){

            var json = JSON.parse(fileContent);
            
            for (const activity of json.activities) {

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
        
        var a = document.createElement("a");
        a.href = "?" + activity.id;
        if (this.customActivitiesUrl) {
            a.href += "&activities=" + this.activitiesUrl;
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
     * Fetches the contents of the activity with the provided ID
     */ 
    fetchActivity(id) {
        
        if (this.hasActivity(id)) {
    
            var activity = this.activities[id];

            for ( let apanel of activity.panels ){
                
                if (apanel.file != null) { 
                    apanel.url =  new URL( apanel.file, this.activitiesUrl).href; 
                    let file = this.fetchFile(apanel.file);
                    apanel.file = file.content;
                    apanel.sha = file.sha; 
                };

                // Resolve the panel definition reference  
                if ( typeof apanel.ref == "string" ){
                    apanel.ref = this.accessPanelDef(apanel.ref);
                }
            }
        
            return activity;
        }

        // If we are here it means that such an activity has not been found
        var activity = {};
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
            
            toolUrls = toolUrls.concat( this.activities[activitykey].tools );
         }

         return ( new Set(toolUrls) );
    }


}





export {ActivityManager};