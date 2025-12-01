import { Panel } from "./Panel.js";
import * as Diff from 'diff';

class SaveablePanel extends Panel {
    fileUrl;
    valueSha;
    lastSavedContent;
    diff;

    constructor(id) {
        super(id);
    }

    initialize(editor) {
        super.initialize(editor);

        // Add an event listener to the editor to update the diff on change
        this.editor.session.on("change", () => {
            this.updatePanelDiff();
        })
    }

    /**
     * Updates the internal diff state of the panel.
     * 
     * Compares the current panel content with the last saved content
     * and stores the resulting differences in the `diff` property.
     * 
     * This method is typically triggered whenever the editor content changes.
     * The computed diff is a filtered list of added or removed lines,
     * ignoring unchanged lines.
     * 
     * Uses jsdiff's `diffLines` to compute the differences.
     */
    updatePanelDiff() {

        const currentValue = this.getValue() ?? "";
        const lastSavedValue = this.getLastSavedContent() ?? "";

        if (currentValue === lastSavedValue) {
            this.diff = []; // No changes, set diff to empty array
            return;
        }

        this.diff = Diff.diffLines(lastSavedValue, currentValue)
            .map(part => {
                let change = {};
                if (part.added) {
                    change.added = part.value;
                }
                else if (part.removed) {
                    change.removed = part.value;
                }
                return change;
            })
            .filter(change => change.added || change.removed);
    }

    getDiff() {
        return this.diff;
    }

    getFileUrl() {
        return this.fileUrl;
    }

    setFileUrl(url) {
        this.fileUrl = url;
    }

    /**
     * FIXME: Currently only supports GitHub URLs.
     */
    getFilePath() {
        return this.getFileUrl().split("/").slice(6).join("/");
    }

    getValueSha() {
        return this.valueSha;
    }

    setValueSha(sha) {
        this.valueSha = sha;
    }

    getLastSavedContent() {
        return this.lastSavedContent;
    }

    setLastSavedContent(content) {
        this.lastSavedContent = content;
    }

    /**
     * Define the saveable panel metadata in one function.
     * @param {*} fileUrl 
     * @param {*} fileContent 
     * @param {*} fileSha 
     */
    defineSaveMetaData(fileUrl, fileContent, fileSha) {
        this.setFileUrl(fileUrl);
        this.setLastSavedContent(fileContent);
        this.setValueSha(fileSha);
        super.setValue(fileContent);
    }

    /**
     * Has the contents of this panel changed since the last save?
     * @returns {boolean} true if the content has changed since the last save
     */
    canSave() {
        return super.getValue() !== this.getLastSavedContent();
    }

    /**
     * Return the data necessary to save this panel.
     * @returns {object} The data and its metadata to be saved.
     */
    exportSaveData() {
        return {
            fileUrl: this.getFileUrl(),
            newFileContent: this.getValue()
        };
    }

    /**
     * Bring the panel state back to the last saved state.
     */
    resetChanges() {
        super.setValue(this.getLastSavedContent());
    }
}

export { SaveablePanel };