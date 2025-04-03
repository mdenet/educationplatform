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
import { ExtensionPanel } from "./ExtensionPanel";
import { ExtensionHtmlPanel } from "./ExtensionHtmlPanel";

class ExtensionEducationPlatformApp extends GeneralEducationPlatformApp {
    constructor(context, provider, activityLabel){;
        const errorHandler = new ExtensionErrorHandler();
        super(errorHandler);
        this.wsUri = "ws://localhost:8080/tools/xtext/services/xtext/ws"; //Change this to the deployment URI when published
        this.context = context;
        this.provider = provider;
        this.activityLabel = activityLabel;
        this.fileHandler = new LocalRepoManager();
    }

    /**
     * Initializes the activity.
     * @override
     */
    async initializeActivity(){
        const toolManager = new ToolManager(this.errorHandler.notify.bind(this.errorHandler));
        const activityManager = new ExtensionActivityManager(toolManager.getPanelDefinition.bind(toolManager), this.fileHandler, this.provider, this.context, this.activityLabel);
        await super.initializeActivity(toolManager, activityManager, []);

    }

    /**
     * Dynamically add syntax highlighting for tools.
     * @override
     * @param {Object} toolImports The tool imports object that contains the tool import urls.
     */
    handleToolImports(toolImports){
        //TODO: Implement tool imports
    }

    /**
     * Dynamically add tool icon styles.
     * @override
     * @param {String} toolUrl 
     */
    addToolIconStyles(toolUrl){
        //TODO: Implement tool icon styles. Currently uses VSCode default styles.
    }

    /**
     * Display errors in the extension.
     * @override
     * @param {Array} errors 
     */
    displayErrors(errors){
        for (let error of errors){
            vscode.window.showErrorMessage(error.message);
        }
    }

    /**
     * Create corresponding panels for the panel definitions.
     * @override
     * @param {Object} panel The panel object.
     * @param {Object} panelDefinition The panel definition object that is referenced by the panel.
     * @param {String} newPanelId The ID of the new panel to be created.
     * @returns {ExtensionPanel} 
     */
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

    /**
     * Creates buttons for a specific panel.
     * @override
     * @param {Array} buttons Array of button definitions.
     * @param {String} panelId The ID of the panel to associate the buttons with.
     * @returns {Array} Array of created button instances.
     */
    createButtons(buttons, panelId){
        return ExtensionButton.createButtons(buttons, panelId);
    }
    
    /**
     * @returns {Array} Array of panels that are currently visible in the layout.
     */
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

    /**
     * @override
     * @param {String} message The message to be displayed.
     */
    displayLongMessage(message){
        vscode.window.showInformationMessage(message);
    }

    /**
     * @override
     * @param {String} message The message to be displayed.
     */
    displaySuccessMessage(message){
        vscode.window.showInformationMessage(message);
    }

    removeNotification(){
    }

    /**
     * Stores the editor instance URL in the workspace state.
     * @override
     * @param {String} editorPanelId 
     * @param {String} editorInstanceUrl 
     */
    updateSessionInfo(editorPanelId, editorInstanceUrl){
        this.context.workspaceState.update(editorPanelId,editorInstanceUrl);
    }

    /**
     * Swtiches the activity task.
     * @param {String} task 
     */
    async switchActivityTask(task){
        await this.initializeActivity();
        this.panels = [];
        this.activityManager.setSelectedActivity(task);
        this.activity = this.activityManager.getSelectedActivity();
        await this.initializePanels();
    }

    /**
     * Displays the html content in a new panel.
     * @override
     * @param {*} outputPanel 
     * @param {*} responseText 
     */
    renderHtml(outputPanel,responseText){
        const panel = new ExtensionHtmlPanel(outputPanel.getId(), outputPanel.getTitle());
        panel.initialize(responseText);
    }

    /**
     * Displays the generated text in the output panel.
     * @override
     * @param {*} outputPanel 
     * @param {*} responseText 
     */
    displayGeneratedText(outputPanel, responseText){
        outputPanel.setContent(responseText.trim());
    }

}

export { ExtensionEducationPlatformApp }