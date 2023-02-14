class ToolManager {

    toolId;
    toolsUrls;
    tools = {};

    constructor(){
    }

    setToolsUrls(urls){

        if(this.toolsUrls==null) {
            this.toolsUrls = urls;
            this.fetchTools();
        }
    }


    /*
     * Fetches the tools from the tools url and populates tool's
     * functions and panel definitions.
     */
    fetchTools(){

        for (const url of this.toolsUrls) {

            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send();
    
            if (xhr.status === 200) {    
                var json = JSON.parse(xhr.responseText);
    
                // Store the tool found in the given json
    
                    if (json.tool.id){
                        this.storeTool(json.tool);
                        
                        //TODO update any tool mangement menu. 
                    }
                
            }

        }
    }

    storeTool(newTool){
        // Add the tool
        this.tools[newTool.id] = newTool;
    }

    getToolIds(){
        return this.tools.keys();
    }

    getParametersForToolFunction(functionId){

        for ( const toolskey of  Object.keys(this.tools)){

            const foundFunction = this.tools[toolskey].functions.find( fn => fn.id==functionId );

            if (foundFunction != undefined) {
                return ([...foundFunction.parameters])
            } 
        }

        return null; // Not toolfunction with matching id was found.
    }


    /**
     * Find a panel defintion by id
     * @param {string} panelDefId 
     * @returns {PanelDefinition|null} the found panel definition  
     */
    getPanelDefinition(panelDefId) {

        for ( const toolskey of  Object.keys(this.tools)){

            const foundDefinition = this.tools[toolskey].panelDefs.find( pd => pd.id==panelDefId );

            if ( foundDefinition != undefined){
                return foundDefinition;
            } 
        } 
        
        console.log("Tool with panel definition id '" + panelDefId + "' was not found.");
        return null;
    }


    /**
     * Finds the action function for an action function Id
     * @param {*} actionFuntionId 
     */
    getActionFunction(actionFuntionId) {
        for ( const toolskey of  Object.keys(this.tools)){

            const foundFunction = this.tools[toolskey].functions.find( fn => fn.id==actionFuntionId );

            if ( foundFunction != undefined){
                return foundFunction;
            } 
        } 
        
        console.log("Tool with function id '" + actionFuntionId + "' was not found.");
        return null;

    }
    
    hasPanelDefinition(panelDefId){
        
        return (this.getPanelDefinition(panelDefId) != null);

    }


}

export {ToolManager};
