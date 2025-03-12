import { GeneralEducationPlatformApp } from "../../../platform/interfaces/GeneralEducationPlatformApp";
import { ExtensionButton } from "./ExtensionButton";
import { ExtensionProgramPanel } from "./ExtensionProgramPanel";
import { ExtensionConsolePanel } from "./ExtensionConsolePanel";
import { ExtensionOutputPanel } from "./ExtensionOutputPanel";
import { ExtensionCompositePanel } from "./ExtensionCompositePanel"; 

class ExtensionEducationPlatformApp extends GeneralEducationPlatformApp {
    constructor(errorHandler,context){;
        super(errorHandler);
        this.context = context;
    }

    handleToolImports(toolImports){
        console.log("Handling tool imports");
    }

    addToolIconStyles(toolUrl){
        console.log("Adding tool icon styles");
    }

    displayErrors(errors){
        console.log("Displaying errors");
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
				break;
			}
			case "CompositePanel":{
				newPanel = new ExtensionCompositePanel(newPanelId);
				if(panel.childPanels){
					for (let childPanelConfig of panel.childPanels){
						var childPanel = await createPanelForDefinition(childPanelConfig);
						newPanel.addPanel(childPanel);
					}
				}
				break;
			}
			case "OutputPanel":{
				console.log(panel)
				newPanel = new ExtensionOutputPanel(newPanelId,panel.name);
				break;
			}
			case "XtextEditorPanel":{
				let editorUrl = current_context.workspaceState.get(newPanelId);
				newPanel = new ExtensionProgramPanel(newPanelId,panel.file);
				await newPanel.initialize();
				newPanel.setType(panelDefinition.language);
				break
			}
			default:{
				console.log()
				console.log("Panel class not found");
				break;
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

}

export { ExtensionEducationPlatformApp }