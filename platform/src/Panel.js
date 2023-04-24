class Panel {

    id;
    editor;
    element;
    visible;
    type;
    valueSha;
    fileUrl;

    constructor(id) {
        this.id = id;
        this.getElement();

        // Set up the panel's editor
        this.editor = ace.edit(this.element.querySelector('.editor'));
        this.editor.setShowPrintMargin(false);
        this.editor.setTheme("ace/theme/eclipse");
        this.editor.renderer.setShowGutter(false);
        this.editor.setFontSize("1rem");
        this.editor.setOptions({
            fontSize: "11pt",
            useSoftTabs: true
        });
        
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

    getEditor() {
        return this.editor;
    }

    getValue() {
        return this.editor.getValue();
    }

    setValue(value) {
        this.editor.setValue((value+""), 1);
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

    buttonHtml(icon, hint) {
        return "<span class='mif-" + icon + "' data-role='hint' data-hint-text='" + hint + "' data-hint-position='bottom'></span>";
    }


    /**
     * Add the buttons to the page
     * @param {object[]} buttons  Objects with attributes: icon, hint, action
     * 
     * TODO Support image files for icon
     */
    addButtons(buttons){

        var buttonViewData= buttons.map( (btn) => {
            var buttonData={};
            
            buttonData.html= this.buttonHtml(btn.icon, btn.hint);
            buttonData.cls= "sys-button";
            buttonData.onclick= btn.action;

            return buttonData;
        }); 

        buttonViewData.reverse(); // So they are displayed in the order they are defined

        this.element.dataset.customButtons = JSON.stringify(buttonViewData);
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