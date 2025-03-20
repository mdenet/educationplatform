/*global Metro ace -- Metro and ace are externally imported*/
import { ProgramPanel } from "./ProgramPanel.js";
import { Button } from "./Button.js";
import svgPanZoom from 'svg-pan-zoom';
class OutputPanel extends ProgramPanel {

    outputType;
    outputLanguage;
    language;
    generatedFiles;

    constructor(id, language, outputType, outputLanguage) {
        super(id);
        this.outputType = outputType;
        this.outputLanguage = outputLanguage;
        this.language = language;

    }

    initialize(editor) {
        super.initialize(editor);

        let buttons = []; 
        if (this.outputType == "code"){
            let highlightButton = new Button(
                { id:"highlight", 
                hint:"Set generated text language", 
                internal: `panels.find((p) => p.id==="${this.id}").editor.setOutputLanguage()`,
                icon: "highlight" }, 
                this.id
            );
            buttons.push(highlightButton);
        }
        this.addButtons(buttons);

    if (this.language == "multi") {
      this.createFileSelector();
    }
        this.getEditor().getSession().setMode("ace/mode/" + this.outputLanguage.toLowerCase());
    }

    setupSyntaxHighlighting() {}


    getSelect() {
        return Metro.getPlugin("#generatedFiles", 'select');
    }

    setGeneratedFiles(generatedFiles) {
        this.generatedFiles = generatedFiles;

        var options = new Map();
        for (const generatedFile of generatedFiles) {
            options.set(generatedFile.path, "<span>" + generatedFile.path + "</span>");
        }

        var select = this.getSelect();
        var previousSelection = select.getSelected();
        
        select.data(Object.fromEntries(options));

        var selection = generatedFiles.find(f => f.path == previousSelection) != null ? previousSelection : generatedFiles[0]?.path;
        select.val(selection);
        this.displayGeneratedFile(selection);
    }

    setOutputLanguage() {
        var self = this;
        Metro.dialog.create({
            title: "Set Generated Text Language",
            content: "<p>You can set the language of the generated text to <a href='https://github.com/ajaxorg/ace/tree/master/lib/ace/mode'>any language</a> supported by the <a href='https://ace.c9.io/'>ACE editor</a>. </p><br><input type='text' id='language' data-role='input' value='" + self.outputLanguage + "'>",
            actions: [
                {
                    caption: "OK",
                    cls: "js-dialog-close success",
                    onclick: function () {
                        var outputLanguage = document.getElementById("language").value;
                        self.getEditor().getSession().setMode("ace/mode/" + outputLanguage.toLowerCase());
                    }
                },
                {
                    caption: "Cancel",
                    cls: "js-dialog-close"
                }
            ]
        });
    }

    displayGeneratedFile(path) {
        for (const generatedFile of this.generatedFiles) {
            if (generatedFile.path == path) {
                this.setValue(generatedFile.content);
                // Set the right syntax highlighting for the file extension
                var modelist = ace.require("ace/ext/modelist");
                this.getEditor().getSession().setMode(modelist.getModeForPath(path + "").mode);
                return;
            }
        }

        // If the generated path is invalid, reset the editor
        this.setValue("");
        this.getEditor().getSession().setMode("ace/mode/text");
    }

    generatedFileSelected() {
        this.displayGeneratedFile(this.getSelect().getSelected()[0]);
    }

    createElement() {
        var root = super.createElement();
        root.setAttribute("style", "padding: 0px");

        return root;
    }

    /**
     *  Adds the file selection dropdown to the panel on the page
     */
    createFileSelector() {
        var select = document.createElement("select");

        select.setAttribute("data-role", "select");
        select.setAttribute("data-on-item-select", `panels.find((p) => p.id==="${this.id}").generatedFileSelected()`);
        select.setAttribute("id", "generatedFiles");
        select.setAttribute("style","width:100%");

        var root = this.getElement();
        root.insertBefore(select, root.children[0]);
    }



    renderDiagram(svg) {
        var diagramId = this.id + "Panel";
        var diagramElement = document.getElementById(diagramId);
        diagramElement.innerHTML = svg;
    
        // Ensure that the container has no padding or margin
        diagramElement.style.padding = "0";
        diagramElement.style.margin = "0";
    
        var svgElement = diagramElement.firstElementChild;
    
        // Set the SVG's width and height to 100% of the container
        svgElement.style.width = "100%";
        svgElement.style.height = "100%";
    
        // Initialize SVG pan and zoom
        svgPanZoom(svgElement, {
            zoomEnabled: true,
            fit: true,
            center: true
        });
    }
    
    

}

export { OutputPanel };