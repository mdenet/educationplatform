import { backend } from "./Playground.js";

class ActivityManager {

    activityId;
    visibleActivities = 15;
    activitiesUrl = new URL("activities/activities.json", document.baseURI).href;
    customActivitiesUrl = false;
    toolsUrl;
    customToolsUrl= false;
    activities = {};
    activeSubMenu;

    constructor() {

        // Retrieve the url of the activities configuration
        var parameters = new URLSearchParams(window.location.search);
        if (parameters.has("activities")) {
            this.customActivitiesUrl = true;
            this.activitiesUrl = parameters.get("activities");
        }

        //TODO - Other future parameters will need to be handled more generally
        if (parameters.has("tools")) {
            this.customToolsUrl = true;
            this.toolsUrl = parameters.get("tools");
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
    }

    /**
     * Fetches all the activities from activitiesUrl
     * and pupulates the activities array
     */
    fetchActivities() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", this.activitiesUrl, false);
        xhr.send();
        if (xhr.status === 200) {    
            var json = JSON.parse(xhr.responseText);
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
        if (this.customToolsUrl){
            a.href += "&tools=" + this.toolsUrl;
        }
        li.appendChild(a);

        var icon = document.createElement("span");
        icon.classList.add("icon");
        a.appendChild(icon);

        var mif = document.createElement("span");
        mif.classList.add("mif-activity-16");
        mif.classList.add("mif-" + activity.language);
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
        if (!this.activityId) this.activityId = activity.id;
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
     * Fetches the contents of the activity with the provided ID
     */ 
    fetchActivity(id) {
        if (!this.hasActivity(id)) {
            var xhr = new XMLHttpRequest();
            
            xhr.open("POST", backend.getShortURLService(), false);
            xhr.setRequestHeader("Content-Type", "application/json");
            var data = JSON.stringify({"shortened": id});
            xhr.send(data);
            if (xhr.status === 200) {
                try {
                    var content = atob(JSON.parse(xhr.responseText).content);
                    return JSON.parse(content);
                }
                catch (err) {
                    console.log("Fetching activity " + id + " failed");
                    // Ignore the error and return a default activity later on
                }
            }
        }
        else {
            var activity = this.activities[id];

            for ( let apanel of activity.panels ){
                if (apanel.file != null) apanel.file = this.fetchFile(apanel.file);
            }
            /* Fixed panel fetching 
            if (activity.program != null) activity.program = this.fetchFile(activity.program);
            if (activity.secondProgram != null) activity.secondProgram = this.fetchFile(activity.secondProgram);
            if (activity.flexmi != null) activity.flexmi = this.fetchFile(activity.flexmi);
            if (activity.emfatic != null) activity.emfatic = this.fetchFile(activity.emfatic);
            if (activity.secondFlexmi != null) activity.secondFlexmi = this.fetchFile(activity.secondFlexmi);
            if (activity.secondEmfatic != null) activity.secondEmfatic = this.fetchFile(activity.secondEmfatic); */
            return activity;
        }

        // If we are here it means that such an activity has not been found
        var activity = {};
        activity.language = "eol";
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
        var xhr = new XMLHttpRequest();
        var url = new URL(name, this.activitiesUrl).href;
        xhr.open("GET", url, false);
        xhr.send();
        if (xhr.status === 200) {    
            return xhr.responseText;
        }
    }

}

export {ActivityManager};