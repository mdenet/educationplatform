import { Panel } from "./Panel.js";
import { Layout } from "./Layout.js";

import svgPanZoom from 'svg-pan-zoom';

class ModelPanel extends Panel {

    editable;
    metamodelPanel;

    constructor(id, editable, metamodelPanel) {
        super(id);
        this.editable = editable;
        this.metamodelPanel = metamodelPanel;
    }

    initialize(editor) {
        super.initialize(editor);

        this.setupSyntaxHighlighting();
        this.setTitleAndIcon("Model", "flexmi");
    }

    showDiagram() {
        $("#" + this.id + "Diagram").show();
    }

    hideDiagram() {
        $("#" + this.id + "Diagram").hide();
    }

    showEditor() {
        $("#" + this.id + "Editor").show();
    }

    hideEditor() {
        $("#" + this.id + "Editor").hide();
    }
    
    refreshDiagram() {
        this.refreshDiagramImpl(backend.getFlexmiToPlantUMLService(), this.id + "Diagram", "model", this.getEditor(), this.metamodelPanel.getEditor());
    }

    setupSyntaxHighlighting() {
        this.editor.getSession().setMode("ace/mode/xml");
        this.updateSyntaxHighlighting();
        var self = this;
        this.editor.getSession().on('change', function () {
            self.updateSyntaxHighlighting();
        });
    }

    /**
     * Updates the syntax highlighting mode of a Flexmi
     * editor based on its content. If the content starts with
     * < then the XML flavour is assumed, otherwise, the YAML
     * flavour is assumed
     */
    updateSyntaxHighlighting() {
        var val = this.editor.getSession().getValue();
        if ((val.trim() + "").startsWith("<")) {
            this.editor.getSession().setMode("ace/mode/xml");
        }
        else {
            this.editor.getSession().setMode("ace/mode/yaml");
        }
    }

    /* TODO: Rename to something more sensible */
    refreshDiagramImpl(url, diagramId, diagramName, modelEditor, metamodelEditor) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    var json = JSON.parse(xhr.responseText);

                    // FIXME: Make both functions return the PlantUML diagram in a "diagram" field
                    var jsonField = "modelDiagram";
                    if (diagramId.endsWith("etamodelDiagram"))
                        jsonField = "metamodelDiagram";

                    if (json.hasOwnProperty("error")) {
                        consolePanel.setError(json.error);
                    }
                    else {
                        renderDiagram(diagramId, json[jsonField]);
                    }

                    Metro.notify.killAll();
                }
            }
        };
        var data = this.modelToJson(modelEditor, metamodelEditor);
        xhr.send(data);
        longNotification("Rendering " + diagramName + " diagram");
    }


    renderDiagram(svg) {
        var diagramId = this.id + "Diagram";
        var diagramElement = document.getElementById(diagramId);
        diagramElement.innerHTML = svg;
        var svg = document.getElementById(diagramId).firstElementChild;
        
        //if (diagramId == "outputDiagram") {
            diagramElement.parentElement.style.padding = "0px";
        //}
    
        svg.style.width = diagramElement.offsetWidth + "px";
        svg.style.height = diagramElement.offsetHeight + "px";
    
        svgPanZoom(svg, {
          zoomEnabled: true,
          fit: true,
          center: true
        });
    }
    

    modelToJson(modelEditor, metamodelEditor) {
        return JSON.stringify(
            {
                "flexmi": modelEditor != null ? modelEditor.getValue() : "",
                "emfatic": metamodelEditor != null ? metamodelEditor.getValue() : ""
            }
        );
    }

    fit() {
        // Fit the editor
        var editorElement = document.getElementById(this.id + "Editor");
        if (editorElement != null) {
            editorElement.parentNode.parentNode.style = "flex-basis: calc(100% - 4px); padding: 0px";
            var parentElement = editorElement.parentElement.parentElement.parentElement;
            editorElement.style.width = parentElement.offsetWidth + "px";
            editorElement.style.height = parentElement.offsetHeight - 42 + "px";

        }

        this.editor.resize();
        
        // Fit the diagram
        var diagramElement = document.getElementById(this.id + "Diagram");
        if (diagramElement != null) {
            var svg = diagramElement.firstElementChild;
            if (svg != null) {
                if (svg.tagName == "svg") {
                    diagramElement = diagramElement.parentElement.parentElement.parentElement;
                    svg.style.width = diagramElement.offsetWidth + "px";
                    svg.style.height = diagramElement.offsetHeight - 42 + "px";
                }
            }
        }
    }

    createElement() {
        var root = document.createElement("div");

        root.setAttribute("data-role", "panel");
        root.setAttribute("class", "modelPanel");
        root.setAttribute("id", this.id + "Panel");

        var editor = document.createElement("div");
        editor.setAttribute("id", this.id + "Editor");
        editor.setAttribute("class", "editor");
        
        var diagram = document.createElement("div");
        diagram.setAttribute("id", this.id + "Diagram");
        diagram.setAttribute("class", "diagram");
        
        var splitter = Layout.createHorizontalSplitter([editor, diagram]);
        splitter.setAttribute("class", "h-100");

        root.appendChild(splitter);

        return root;
    }


}

export { ModelPanel };