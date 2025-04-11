import * as vscode from 'vscode';
import { GeneralActivityManager } from '../../../platform/interfaces/GeneralActivityManager.js';

class ExtensionActivityManager extends GeneralActivityManager {

    provider;
    context;
    lable;

    constructor(panelDefAccessor, fileHandler, provider, context, label) {
        super(panelDefAccessor, fileHandler);
        this.provider = provider;
        this.context = context;
        this.label = label;
    }

    async fetchActivities() {
        let errors = [];
        try {
            let fileContent = await this.fileHandler.fetchActivityFile(this.label);
            if (fileContent != null){
                errors = this.processActivityConfig(fileContent,errors);
            }
            return errors;
        }
        catch (error) {
            errors.push(error);
        }
        return errors;
    }

    getPanelFileLocation(panelURL){
        return panelURL;
    }

    handlePanelFile(panel,file){
        panel.file = file;
    }

    fetchFile(filePath){
        //if filePath starts with http or https, it is a URL so just return it
        if(filePath instanceof vscode.Uri || filePath.startsWith('http')){
            return filePath
        }
        else{
            return this.fileHandler.getPath(filePath);
        }
    }

    createActivitiesMenu(config){
        if(!config.activities){
            vscode.window.showWarningMessage('No activities found in the file.');
            return;
        }
        for (const activity of config.activities){
            if (activity.id) {
                this.storeActivity(activity);
            }
        }
        this.provider.setTasks(config.activities);
        this.provider.hideAllTasks();

    }

    setActivityVisibility(activityId, visible){
        if(visible){
            this.provider.showTask(activityId);
        }
        else{
            this.provider.hideTask(activityId);
        }
    }

    isPanelGenerated(panelId){
        return (this.context.workspaceState.get(panelId) != null);
    }

    showActivitiesNavEntries(){
        for(var activityKey of Object.keys(this.activities)) {
            // Show activities that have no generated panels
            if (this.hasGeneratedPanel(activityKey)){
                this.setActivityVisibility(activityKey, false);
            }
            else{
                this.setActivityVisibility(activityKey, true);
            }
        }
    }

    interpolate(someString){
        if(typeof someString !== "string") {
            return someString;
        }
        let result = someString;

        // Retrieve all stored keys
        const storedKeys = this.context.workspaceState.keys();

        for (let currentKey of storedKeys) {
            if (currentKey !== "isAuthenticated" && this.context.workspaceState.get(currentKey) !== null) {
                // Retrieve stored value
                let storedValue = this.context.workspaceState.get(currentKey, "").replace(/\/$/, ""); // Remove trailing slash

                // Replace placeholder in the string
                result = result.replace(`{{ID-${currentKey}}}`, storedValue);
            }
        }

        return result;
    }

    setSelectedActivity(activityId){
        this.activityId = activityId;
    }
}

export { ExtensionActivityManager };