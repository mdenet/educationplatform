import { SaveablePanel } from "./SaveablePanel";

class ProgramPanel extends SaveablePanel {

    constructor(id = "program") {
        super(id);
    }

    /**
     *  Sets the mode of the editor for syntax highlighting
     * 
     * @param {*} language 
     */
    setEditorMode(language){
        this.editor.getSession().setMode("ace/mode/" + language);
        console.log(language);
    }
    

    fit() {
        var editorElement = document.getElementById(this.id + "Editor");
        if (editorElement != null) {
            editorElement.parentElement.style = "flex-basis: calc(100% - 4px);";
        }
        this.editor.resize();
    }


    // TODO: Identical to ConsolePanel.createElement()
    createElement() {
        var root = document.createElement("div");
        root.setAttribute("data-role", "panel");
        root.setAttribute("id", this.id + "Panel");

        var editor = document.createElement("div");
        editor.setAttribute("class", "editor");
        editor.setAttribute("id", this.id + "Editor");

        root.appendChild(editor);
        
        return root;
    }
}

export { ProgramPanel };
