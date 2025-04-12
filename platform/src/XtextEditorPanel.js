/*global ace -- ace is externally imported*/
import { SaveablePanel } from "./SaveablePanel";


class XtextEditorPanel extends SaveablePanel {

    constructor(id = "program") {
        super(id);
    }

    
    initialize(url, extension){
        let aceEditor;
        super.initialize(aceEditor);

        let editorContainer = this.element.querySelector('.editor');

        let modeName = "ace/mode/xtext-" + extension;

        ace.config.setModuleUrl( modeName, url + "/xtext-resources/generated/mode.js" );
        
        //Create Xtext editor
        require(["xtext/xtext-ace"], function(xtext) {
            aceEditor = xtext.createEditor({
                serviceUrl: url + "/xtext-service",
                enableCors: true,
                syntaxDefinition: modeName,
                parent: editorContainer,
                xtextLang: extension
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

    createElement() {
        var root = super.createRootElement();
        var editor = super.createEditorElement();

        let htmlObject = document.createElement("object");
        htmlObject.setAttribute( "type", "text/html" );
        htmlObject.setAttribute( "data", "http://127.0.0.1:9000" );
        editor.appendChild(htmlObject);

        root.appendChild(editor);

        return root;
    }
}

export { XtextEditorPanel };
