import { Panel } from "./Panel.js";
import * as Diff from 'diff';

class SaveablePanel extends Panel {
    fileUrl;
    valueSha;
    lastSavedContent;

    constructor(id) {
        super(id);
    }

    getFileUrl() {
        return this.fileUrl;
    }

    setFileUrl(url) {
        this.fileUrl = url;
    }

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
        this.setValue(fileContent);
        this.setLastSavedContent(fileContent);
        this.setValueSha(fileSha);
    }

    /**
     * Has the contents of this panel changed since the last save?
     * @returns {boolean} true if the content has changed since the last save
     */
    canSave() {
        return this.getValue() !== this.getLastSavedContent();
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
     * Compare the current content of the panel with the last saved content.
     * @returns {Promise<Array>} A promise that resolves to an array of diff objects.
     * * Each object contains the following properties:
     * - `added`: The added content (if any).
     * - `removed`: The removed content (if any).
     * - `value`: The content itself.
     */
    computeDiff() {
        return Promise.resolve(
            Diff.diffLines(this.lastSavedContent, this.getValue())
                .map(part => {
                    let change = {};
                    if (part.added) change.added = part.value;
                    else if (part.removed) change.removed = part.value;
                    return change;
                })
                .filter(change => change.added || change.removed)
        );
    }

    /**
     * Bring the panel state back to the last saved state.
     */
    resetChanges() {
        this.setValue(this.getLastSavedContent());
    }
}

export { SaveablePanel };