var buttonTypes= {
    BUTTON_ACTION: 'BUTTON_ACTION',
    BUTTON_HELP: 'BUTTON_HELP'
}

class ExtensionButton{
    id;
    icon;
    hint;
    action;
    type;

    /**
     * Create a Button 
     * @param {object} buttonConfigObject 
     * @param {string} parentPanel 
     */
    constructor(buttonConfigObject, parentPanel){
        this.id= buttonConfigObject.id;
        this.icon= buttonConfigObject.icon;
        this.hint= buttonConfigObject.hint;
        this.action = buttonConfigObject.action;
        // Set button's onclick action
        if (buttonConfigObject["url"] != undefined) {
            this.type = buttonTypes.BUTTON_HELP;
            this.action = "vscode.env.openExternal('" + buttonConfigObject.url + "');";
                           
        } else if (buttonConfigObject["actionfunction"] != undefined)  {        
            this.type = buttonTypes.BUTTON_ACTION;
            this.action = "app.runAction( '" + parentPanel + "', '" + buttonConfigObject.id +"' )";
    
        } else if (buttonConfigObject["internal"] != undefined) {

            if (buttonConfigObject.targetPanel && buttonConfigObject.internal === "toggle") {
                this.action = "togglePanelById( '" + buttonConfigObject.targetPanel + "Panel' )";  
            } else {
                this.action = buttonConfigObject.internal;
            }

        } else {
            console.log( "Button '" + buttonConfigObject.id + "' with uknown key.");
        }
    }

    /**
     * Create an array of buttons from an array of configurations
     * @param {object[]} buttonConfigs
     * @param {string} parentPanel  
     * @returns {ExtensionButton[]} the Button objects
     */
    static createButtons(buttonConfigs, parentPanel){

        let buttons= [];

        buttonConfigs.forEach((config)=>{
            buttons.push( new ExtensionButton(config, parentPanel) );
        })

        return buttons;
    }
} 

export { ExtensionButton };