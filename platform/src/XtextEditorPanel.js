import { Panel } from "./Panel.js";


class XtextEditorPanel extends Panel {

    constructor(id = "program") {
        
        let aceEditor;

        super(id, aceEditor);

        let editorContainer = this.element.querySelector('.editor');
        
        //Create Xtext editor
        require(["xtext/xtext-ace"], function(xtext) {
            aceEditor = xtext.createEditor({
                serviceUrl: "http://127.0.0.1:9001/xtext-service",
                enableCors: true,
                syntaxDefinition: "xtext-resources/generated/mode-turtles",
                parent: editorContainer,
                xtextLang: "turtles"
            });
        });

        this.editor.renderer.setShowGutter(true);


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
            editorElement.parentNode.style = "flex-basis: calc(100% - 4px);";
        }
        this.editor.resize();
    }


    // TODO: Identical to ConsolePanel.createElement()
    createElement() {
        var root = document.createElement("div");
        root.setAttribute("data-role", "panel");
        root.setAttribute("id", this.id + "Panel");

        var editor = document.createElement("div");
        editor.setAttribute("id", this.id + "Editor");
        editor.setAttribute("class", "editor");


        let htmlObject = document.createElement("object");
        htmlObject.setAttribute( "type", "text/html" );
        htmlObject.setAttribute( "data", "http://127.0.0.1:9000" );
        editor.appendChild(htmlObject);

        root.appendChild(editor);

        return root;
    }
}

export { XtextEditorPanel };
