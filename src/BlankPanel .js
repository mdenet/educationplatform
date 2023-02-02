import { Panel } from "./Panel.js";

class BlankPanel extends Panel {
    
    constructor(id) {
        super(id);
    }


    createElement() {
        var root = document.createElement("div");
        root.setAttribute("data-role", "panel");
        root.setAttribute("id", this.id + "Panel");

        var editor = document.createElement("div");
        editor.setAttribute("id", this.id);
        editor.setAttribute("class", "info");

        root.appendChild(editor);
        
        return root;
    }
}

export { BlankPanel };