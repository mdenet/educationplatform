/*global ace -- ace is externally imported*/

class Panel {

    id;
    title;
    editor;
    element;
    visible;
    type;

    constructor(id) {
        this.id = id;
    }

    initialize(editor) {
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

    getTitle() {
        return this.title;
    }

    setTitleAndIcon(title, icon) {
        this.setTitle(title);
        this.setIcon(icon);
    }

    setTitle(title) {
        this.title = title;
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
        // Reset undo manager
        this.editor.session.getUndoManager().markClean();
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

    createElement() {
        var root = this.createRootElement();
        var editor = this.createEditorElement();
        root.appendChild(editor);

        return root;
    }

    getElement() {
        if (!this.element) {
            this.element = this.createElement();
        }
        return this.element;
    }

    createRootElement() {
        var root = document.createElement("div");
        root.setAttribute("data-role", "panel");
        root.setAttribute("id", this.id + "Panel");

        return root;
    }

    createEditorElement() {
        var editor = document.createElement("div");
        editor.setAttribute("class", "editor");
        editor.setAttribute("id", this.id + "Editor");

        return editor;
    }   

}

export { Panel };
