import { Layout } from "./Layout.js";
import { Panel } from "./Panel.js";

class CompositePanel extends Panel {

    constructor(id = "composite") {
        super(id);
        this.childPanels = [];
    }

    initialize(editor) {
        super.initialize(editor)
        this.childPanels.forEach(panel => {
            panel.initialize(editor);
            panel.parentComposite = this;
        });
    }

    addPanel(panel) {
        this.childPanels.push(panel);
        panel.parentComposite = this; // Set a reference to the parent CompositePanel
    }

    removePanel(panel) {
        this.childPanels = this.childPanels.filter(p => p !== panel);
    }

    createElement() {
        var root = super.createRootElement();
        root.setAttribute("class", "compositePanel");
        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.flex = "1";

        var childElementList = []
        if (this.childPanels) {
            this.childPanels.forEach(childPanel => { 
                var childElement = childPanel.getElement();
                childElementList.push(childElement);
            });
        }
        const splitter = Layout.createHorizontalSplitter(childElementList);
        splitter.setAttribute("class", "h-100");

        root.appendChild(splitter);

        return root;
    }

    fit() {
        const panelElement = document.getElementById(this.id + "Panel");
        panelElement.firstChild.style.height = "100%";
        
        this.childPanels.forEach(panel => {
            panel.fit();
        });
    }
    
}

export { CompositePanel };
