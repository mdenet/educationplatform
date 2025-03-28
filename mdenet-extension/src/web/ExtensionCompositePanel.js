import { ExtensionPanel } from './ExtensionPanel';

class ExtensionCompositePanel extends ExtensionPanel{
    childPanels = [];

    constructor(id = "composite"){
        super(id);
        this.panels = [];
    }

    async initialize() {
        for (const panel of this.childPanels) {
            await panel.initialize();
        }
    }

    addPanel(panel){
        this.childPanels.push(panel);
    }

    getChildren(){
        return this.childPanels;
    }


}

export { ExtensionCompositePanel };