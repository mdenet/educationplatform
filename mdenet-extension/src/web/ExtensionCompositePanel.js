import { ExtensionPanel } from './ExtensionPanel';

class ExtensionCompositePanel extends ExtensionPanel{
    childPanels = [];

    constructor(id = "composite"){
        super(id);
        this.panels = [];
    }

    initialize(){
        this.childPanels.forEach(panel => async () => {
            await panel.initialize();
        });
    }

    addPanel(panel){
        this.childPanels.push(panel);
    }

    getChildren(){
        return this.childPanels;
    }


}

export { ExtensionCompositePanel };