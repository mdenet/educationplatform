var buttonTypes= {
    BUTTON_ACTION: 'BUTTON_ACTION',
    BUTTON_HELP: 'BUTTON_HELP'
}

class ExtensionButton{
    id;
    icon;
    hint;
    actionData;
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
            this.actionData = { type: 'openExternal', url: buttonConfigObject.url };
                           
        } else if (buttonConfigObject["actionfunction"] != undefined)  {        
            this.type = buttonTypes.BUTTON_ACTION;
            this.actionData = { type: 'runAppAction', parentPanel, buttonId: buttonConfigObject.id };
    
        } 
        else {
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
        return buttonConfigs.map(config => new ExtensionButton(config, parentPanel));
    }
} 

export { ExtensionButton };