
/*global $ -- jquery is externally imported*/
import { urlParamPrivateRepo } from "./Utility.js";
import { EducationPlatformError } from "./EducationPlatformError.js";
import { GeneralActivityManager } from "../interfaces/GeneralActivityManager.js";
import {utility} from "./Utility.js"

const NAV_ID_PREFIX = "nav-entry-";

class ActivityManager extends GeneralActivityManager {

    visibleActivities = 15;
    activitiesUrl;
    customActivitiesUrl = false;
    customToolsUrl= false;
    activeSubMenu;

    constructor( panelDefAccessor, fileHandler ) {

        super(panelDefAccessor, fileHandler);

        // Retrieve the url of the activities configuration
        var parameters = new URLSearchParams(utility.getWindowLocationSearch());
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
            errors = this.processActivityConfig(fileContent,errors);
        } 

        return errors;
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

    getPanelFileLocation(panelURL){
        return new URL(panelURL, this.activitiesUrl).href; 
    }

    handlePanelFile(panel,file){
        panel.file = file.content;
        panel.sha = file.sha; 
    }

    /**
     * Fetches the content of a file under the activities folder
     * This could be an Epsilon program, a Flexmi model or an Emfatic metamodel
     */
    fetchFile(name) {

        let fileUrl = new URL(name, this.activitiesUrl).href 

        return this.fileHandler.fetchFile( fileUrl, urlParamPrivateRepo() );
    }

    setActivityVisibility(activityid, visible){

        if (visible){
            $("#"+ NAV_ID_PREFIX + activityid).removeClass("no-visible");
        } else {
            $("#"+ NAV_ID_PREFIX + activityid).addClass("no-visible");
        }
    }

    isPanelGenerated(panelId){
        return ( sessionStorage.getItem(panelId) != null );
    }
}





export {ActivityManager};
