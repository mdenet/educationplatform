import { Panel } from "./Panel.js";

//import $ from "ace/ext/language_tools";  : "webjars/ace/1.3.3/src/ext-language_tools",
//import $ from "xtext";   /// xtext/xtext-ace  

class XtextEditorPanel extends Panel {

    constructor(id = "program") {
        super(id);

        //Load grammar
        

        // let editorInstaceUrls = JSON.parse(sessionStorage.getItem("editorInstaceUrls"));

        // let xtextace = document.createElement('script');
        // xtextace.setAttribute('src', editorInstaceUrls[0]+ "xtext/2.31.0/xtext-ace.js" );
        // document.head.appendChild(xtextace);

        // import("xtext").then(foo => console.log(foo.default));

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
