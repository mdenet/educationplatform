import { Panel } from "./Panel.js";

class EditablePanel extends Panel {
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
     * Has the contents of this panel changed since the last save?
     * @returns {boolean} true if the content has changed since the last save
     */
    canSave() {
        return this.getValue() !== this.getLastSavedContent();
    }
}

export { EditablePanel };