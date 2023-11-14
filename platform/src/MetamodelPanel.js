import { ModelPanel } from './ModelPanel.js';

class MetamodelPanel extends ModelPanel {
    constructor(id) {
        super(id, true, null);
        this.setTitleAndIcon("Metamodel", "emfatic");
    }

    setupSyntaxHighlighting() {
        this.editor.getSession().setMode("ace/mode/emfatic");
    }

    refreshDiagram() {
        this.refreshDiagramImpl(backend.getEmfaticToPlantUMLService(), this.id + "Diagram", "metamodel", null, this.getEditor());
    }

}

export { MetamodelPanel };