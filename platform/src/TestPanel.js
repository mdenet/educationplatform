import { Panel } from "./Panel.js";

class TestPanel extends Panel {
    
    constructor(id = "test") {
        super(id);

        var colour = "#" + Math.floor(Math.random()*16777215).toString(16);
        this.setColour(colour);
        
    }

    setColour(newColour){
        this.editor.container.style.background=newColour;
    }

    createElement() {
        var root = document.createElement("div");
        root.setAttribute("data-role", "panel");
        root.setAttribute("id", this.id + "Panel");

        var editor = document.createElement("div");
        editor.setAttribute("id", this.id + "Editor");
        editor.setAttribute("class", "editor");

        root.appendChild(editor);
        
        return root;
    }
}

export { TestPanel };