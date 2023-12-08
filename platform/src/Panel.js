class Panel {

    id;
    editor;
    element;
    visible;
    type;
    valueSha;
    fileUrl;

    constructor(id, editor) {
        this.id = id;
        this.getElement();

        // Set up the panel's editor
        if (editor === undefined) { 
            this.editor = ace.edit(this.element.querySelector('.editor'));
            this.editor.setShowPrintMargin(false);
            this.editor.setTheme("ace/theme/eclipse");
            this.editor.renderer.setShowGutter(false);
            this.editor.setFontSize("1rem");
            this.editor.setOptions({
                fontSize: "11pt",
                useSoftTabs: true
            });
        } else {
            this.editor = editor;
        }

        // Reset undo manager
        this.editor.session.getUndoManager().reset();
        
        this.visible = true;
    }

    getId(){
        return this.id;
    }

    setTitleAndIcon(title, icon) {
        this.setTitle(title);
        this.setIcon(icon);
    }

    setTitle(title) {
        this.element.dataset.titleCaption = title;
    }

    setIcon(icon) {
        this.element.dataset.titleIcon = "<span class='mif-16 mif-" + icon + "'></span>";
    }

    setVisible(visible) {
        this.visible = visible;
    }

    isVisible() {
        return this.visible;
    }

    /**
     * Can the contents of this panel (or at least some of it) be saved in a meaningful way -- in other words, is this stuff we would expect the student to change?
     *
     * @returns true if the panel should be considered when saving contents.
     */
    canSave() {
        return false;
    }

    /**
     * Save the contents of this panel using the filehandler given. Return a promise that will complete when the saving completes.
     * 
     * Only called if {#canSave} returns true.
     * 
     * @param {*} fileHandler the handler to be used for saving
     * @returns a promise
     */
    save(fileHandler) {
        let thisEditor = this.editor;
        return fileHandler.storeFile(this.getFileUrl(), this.getValueSha(), this.getValue())
                          // Mark the editor clean if the save completed
                          .then((response) => { thisEditor.session.getUndoManager().markClean(); });
    }

    getEditor() {
        return this.editor;
    }

    getValue() {
        return this.editor.getValue();
    }

    setValue(value) {
        this.editor.setValue((value+""), 1);
        // Reset undo manager
        this.editor.session.getUndoManager().markClean();
    }

    getValueSha() {
        return this.valueSha;
    }

    setValueSha(sha) {
        this.valueSha = sha;
    }

    getFileUrl() {
        return this.fileUrl;
    }

    setFileUrl(url) {
        this.fileUrl = url;
    }

    setType(type){

        if (this.type != null){
            throw "Panel type has been previously set.";
            
        } else {
            this.type = type;
        }
    }

    getType(){
        return this.type;
    }

    /**
     * Add the buttons to the page
     * @param {Button[]} buttons - The Button objects to add.
     */
    addButtons(buttons){
        if (buttons.length > 0){
            var buttonViewData= buttons.map( (btn) => {
                return btn.getView();
            }); 

            buttonViewData.reverse(); // So they are displayed in the order they are defined

            this.element.dataset.customButtons = JSON.stringify(buttonViewData);
        }
    }


    fit() {}

    createElement() {}

    getElement() {
        if (!this.element) {
            this.element = this.createElement();
        }
        return this.element;
    }

}

export { Panel };
