import { Panel } from "./Panel.js";

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
            url: this.getFileUrl(),
            newFileContent: this.getValue()
        };
    }

    /**
     * Bring the panel state back to the last saved state.
     */
    resetChanges() {
        this.setValue(this.getLastSavedContent());
    }
}

export { SaveablePanel };