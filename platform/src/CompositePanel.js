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

    // You can add other composite-specific methods here, such as methods to show/hide all childrenPanels

    createElement() {
        var root = document.createElement("div");
        root.setAttribute("class", "compositePanel");
        root.setAttribute("data-role", "panel");
        root.setAttribute("id", this.id + "Panel");


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
        this.childrenPanels.forEach(panel => {
            if (typeof panel.fit === 'function') {
                panel.fit();
            }
        });

        // Fit the composite panel itself
        const panelElement = document.getElementById(this.id + "Panel");
        if (panelElement != null) {
            // Assuming the parent element is the container for the composite panel
            const parentElement = panelElement.parentElement;

            // Set the width and height of the composite panel based on its parent
            panelElement.style.width = parentElement.offsetWidth + "px";
            panelElement.style.height = parentElement.offsetHeight + "px";
        }
    }
}

export { CompositePanel };
