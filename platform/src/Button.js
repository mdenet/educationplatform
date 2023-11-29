
var buttonTypes= {
    BUTTON_ACTION: 'BUTTON_ACTION',
    BUTTON_HELP: 'BUTTON_HELP'
}

class Button {
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
            this.action = "window.open('" + buttonConfigObject.url + "');";
                           
        } else if (buttonConfigObject["actionfunction"] != undefined)  {        
            this.type = buttonTypes.BUTTON_ACTION;
            this.action = "runAction( '" + parentPanel + "', '" + buttonConfigObject.id +"' )";
    
        } else if (buttonConfigObject["internal"] != undefined) {

            if ((buttonConfigObject.targetPanel) && (buttonConfigObject.internal === "show" || buttonConfigObject.internal === "hide")) {
                if (buttonConfigObject.internal === "hide") {
                    this.action = "hidePanelById( '" + buttonConfigObject.targetPanel + "Panel' )";  
                } else {
                    this.action = "showPanelById( '" + buttonConfigObject.targetPanel + "Panel' )";  
                }
            } else {
                this.action = buttonConfigObject.internal;
            }

        } else {
            console.log( "Button '" + buttonConfigObject.id + "' with uknown key.");
        }
    }


    buttonHtml() {
        return "<span class='mif-" + this.icon + "' data-role='hint' data-hint-text='" + this.hint + "' data-hint-position='bottom'></span>";
    }

    /**
     * Get a string representation of the button for its display 
     * @returns {String} DOM object with html, cls and onclick properties  
     */
    getView() {
        var buttonData={};
            
        buttonData.html= this.buttonHtml();
        buttonData.cls= "sys-button";
        buttonData.onclick= this.action;

        return buttonData;
    }


    /**
     * Create an array of buttons from an array of configurations
     * @param {object[]} buttonConfigs
     * @param {string} parentPanel  
     * @returns {Button[]} the Button objects
     */
    static createButtons(buttonConfigs, parentPanel){

        let buttons= [];

        buttonConfigs.forEach((config)=>{
            buttons.push( new Button(config, parentPanel) );
        })

        return buttons;
    }
}

export {Button}