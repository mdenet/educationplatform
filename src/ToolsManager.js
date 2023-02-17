class ToolManager {

    toolId;
    toolsUrls;
    tools = {};

    constructor(){
    }

    setToolsUrls(urls){
        if(this.toolsUrls==null) {

            this.toolsUrls = [];
            
            for(let url of urls){
                
                let toolUrl = new Object();
                toolUrl.id = ""; // Populate when tool is fetched
                toolUrl.url = url;

                this.toolsUrls.push(toolUrl);
            }

            this.fetchTools();
        }
    }


    /*
     * Fetches the tools from the tools url and populates tool's
     * functions and panel definitions.
     */
    fetchTools(){

        for (let toolUrl of this.toolsUrls) {

            var xhr = new XMLHttpRequest();
            xhr.open("GET", toolUrl.url, false);
            xhr.send();
    
            if (xhr.status === 200) {    
                var json = JSON.parse(xhr.responseText);
    
                // Store the tool found in the given json
    
                    if (json.tool.id){
                        this.storeTool(json.tool);
                        
                        toolUrl.id = json.tool.id;

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


    getToolGrammars(toolId){
        const tool = this.tools[toolId]; 

        let grammars = [];

        for (let pdef of tool.panelDefs ) {
            if ( pdef.language != undefined ) {
                grammars.push(pdef.language);
            }
        }

        return [...new Set(grammars)];
    }


    /**
     * Returns the tool details for importing grammars for higlighting  
     * @returns Object[] import details tha have module and url attributes
     */
    getToolsGrammarImports(){
        let imports = [];

        for( let tool in this.tools ){
            //remove the config to get tool path
            const toolUrl = this.toolsUrls.find( tu => tu.id == tool ).url;
            let toolPath=  toolUrl.substring(0, toolUrl.lastIndexOf("/")); // Baseurl without the file

            
            let toolGrammars = this.getToolGrammars(tool);

            for (let grammar of toolGrammars ) {
             
                let grammarImportDetails = new Object();

                 grammarImportDetails.module = "ace/mode/" + grammar; // The name in tool config must match ace mode   
                 grammarImportDetails.url = toolPath + "/highlighting.js"; //  Grammars for a tool are bundled

                 imports.push( grammarImportDetails );
            }

            imports.push();
        }
    
        return imports;
    }


}

export {ToolManager};
