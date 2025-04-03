class ExtensionPanel{

    id;
    visible;
    type;
    title;
    buttons;
    icon;

    constructor(id){
        this.id = id;
    }

    setTitle(title){
        this.title = title;
    }

    getTitle(){
        return this.title;
    }

    addButtons(buttons){
        this.buttons = buttons;
    }

    getButtons(){
        return this.buttons;
    }

    setIcon(icon){
        this.icon = icon;
    }

    getId(){
        return this.id;
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
}

export { ExtensionPanel };