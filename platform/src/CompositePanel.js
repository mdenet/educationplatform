import { Panel } from "./Panel.js";
import { Layout } from "./Layout.js";

class CompositePanel extends Panel {
    childrenPanels = [];
    constructor(id = "composite") {
        super(id);
    }

    initialize(editor) {
        super.initialize(editor)
        this.childrenPanels.forEach(panel => {
            panel.initialize(editor);
        });
    }


    addPanel(panel) {
        this.childrenPanels.push(panel);
    }

    removePanel(panel) {
        this.childrenPanels = this.childrenPanels.filter(p => p !== panel);
    }

    showPanel(panelId) {
        const panel = this.childrenPanels.find(p => p.id === panelId);
        if (panel) {
            panel.setVisible(true);
        }
    }

    hidePanel(panelId) {
        const panel = this.childrenPanels.find(p => p.id === panelId);
        if (panel) {
            panel.setVisible(false);
        }
    }

    createElement() {
        var root = document.createElement("div");
        root.setAttribute("class", "compositePanel");
        root.setAttribute("data-role", "panel");
        root.setAttribute("id", this.id + "Panel");


        root.style.display = "flex";
        root.style.flexDirection = "column";
        root.style.flex = "1";

        var childElementList = []
        if (this.childrenPanels) {
            this.childrenPanels.forEach(childPanel => {
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
        
        this.childrenPanels.forEach(panel => {
            panel.fit();
        });
    }
    
}

export { CompositePanel };
