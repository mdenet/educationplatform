// Acts as an abstract class for panels should define save functionality
import { Panel } from "./Panel.js";

class SaveablePanel extends Panel {

    constructor(id) {
        super(id);
    }

    /**
     * Determines if this panel has unsaved changes.
     * Must be overridden by subclasses.
     * @returns {boolean}
     */
    canSave() {
        throw new Error("canSave() must be implemented by subclasses");
    }

    /**
     * Gather the data necessary to save this panel.
     * Must be overridden by subclasses.
     * @returns {object} The data and its metadata to be saved.
     */
    exportSaveData() {
        throw new Error("exportSaveData() must be implemented by subclasses");
    }
}

export { SaveablePanel };
