import { GeneralEducationPlatformApp } from "../../../platform/interfaces/GeneralEducationPlatformApp";
import { ExtensionButton } from "./ExtensionButton";
import { ExtensionProgramPanel } from "./ExtensionProgramPanel";
import { ExtensionConsolePanel } from "./ExtensionConsolePanel";
import { ExtensionOutputPanel } from "./ExtensionOutputPanel";
import { ExtensionCompositePanel } from "./ExtensionCompositePanel"; 
import { ExtensionErrorHandler } from "./ExtensionErrorHandler";
import * as vscode from 'vscode';
import { ExtensionActivityManager } from "./ExtensionActivityManager";
import { LocalRepoManager } from "./LocalRepoManager";
import { ToolManager } from "../../../platform/src/ToolsManager";

class ExtensionEducationPlatformApp extends GeneralEducationPlatformApp {
    constructor(context, provider, activityLabel){;
        const errorHandler = new ExtensionErrorHandler();
        super(errorHandler);
        this.wsUri = "ws://localhost:8080/tools/xtext/services/xtext/ws";
        this.context = context;
        this.provider = provider;
        this.activityLabel = activityLabel;
        this.fileHandler = new LocalRepoManager();
    }

    async initializeActivity(){
        const toolManager = new ToolManager(this.errorHandler.notify.bind(this.errorHandler));
        const activityManager = new ExtensionActivityManager(toolManager.getPanelDefinition.bind(toolManager), this.fileHandler, this.provider, this.context, this.activityLabel);
        await super.initializeActivity(toolManager, activityManager, []);

    }

    handleToolImports(toolImports){
        //TODO: Implement tool imports
    }

    addToolIconStyles(toolUrl){
        //TODO: Implement tool icon styles
    }

    displayErrors(errors){
        for (let error of errors){
            vscode.window.showErrorMessage(error.message);
        }
    }

    async createPanel(panel, panelDefinition, newPanelId){
        let newPanel = null;
        switch(panelDefinition.panelclass){
			case "ProgramPanel":{
				newPanel = new ExtensionProgramPanel(newPanelId,panel.file);
				await newPanel.initialize();
				newPanel.setType(panelDefinition.language);
				break;
			}
			case "ConsolePanel":{
				newPanel = new ExtensionConsolePanel(newPanelId);
                newPanel.initialize();
				break;
			}
			case "CompositePanel":{
				newPanel = new ExtensionCompositePanel(newPanelId);
				if(panel.childPanels){
					for (let childPanelConfig of panel.childPanels){
						var childPanel = await this.createPanelForDefinitionId(childPanelConfig);
                        this.panels.push(childPanel);
						newPanel.addPanel(childPanel);
					}
				}
                newPanel.initialize();
				break;
			}
			case "OutputPanel":{
				console.log(panel)
				newPanel = new ExtensionOutputPanel(newPanelId, panel.name, panelDefinition.language);
                newPanel.initialize();
				break;
			}
			case "XtextEditorPanel":{
				let editorUrl = this.context.workspaceState.get(newPanelId);
				newPanel = new ExtensionProgramPanel(newPanelId,panel.file);
				await newPanel.initialize();
				newPanel.setType(panelDefinition.language);
				break
			}
			default:{
				throw new Error("Panel class not found");
			}
		}
        return newPanel;
    }

    createButtons(buttons, panelId){
        return ExtensionButton.createButtons(buttons, panelId);
    }
    
    getVisiblePanels(){
        let visiblePanels = [];
        const layout = this.activity.layout.area;
        for(let i = 0; i < layout.length; i++){
            for(let j = 0; j < layout[i].length; j++){
                const panel = this.panels.find(panel => panel.getId() === layout[i][j]);
                if(panel){
                    visiblePanels.push(panel);
                }
                else{
                    throw new Error("Panel not found");
                }
            }
        }
        return visiblePanels;
    }

    displayLongMessage(message){
        vscode.window.showInformationMessage(message);
    }

    displaySuccessMessage(message){
        vscode.window.showInformationMessage(message);
    }

    removeNotification(){
    }

    updateSessionInfo(editorPanelId, editorInstanceUrl){
        //replace the origin of editorInstanceUrl with http://localhost:8080 for development. This will not be need if backend return {{BASE_URL}} in the URL
        editorInstanceUrl = editorInstanceUrl.replace(/https:\/\/ep.mde-network\.org/,"http://localhost:8080");
        this.context.workspaceState.update(editorPanelId,editorInstanceUrl);
    }

    async switchActivityTask(task){
        await this.initializeActivity();
        this.panels = [];
        this.activityManager.setSelectedActivity(task);
        this.activity = this.activityManager.getSelectedActivity();
        await this.initializePanels();
    }



}

export { ExtensionEducationPlatformApp }