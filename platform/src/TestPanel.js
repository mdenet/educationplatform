import { Panel } from "./Panel.js";

class TestPanel extends Panel {
    
    constructor(id = "test") {
        super(id);

        var colour = "#" + Math.floor(Math.random()*16777215).toString(16);
        this.setColour(colour);
        
    }

    setColour(newColour){
        this.editor.container.style.background=newColour;
    }
}

export { TestPanel };