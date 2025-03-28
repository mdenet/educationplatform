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
}

export { ProgramPanel };
