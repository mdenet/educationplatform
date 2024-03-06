import { parseConfigFile } from "./Utility.js";
import { FunctionRegistry } from "../src/FunctionRegistry.js"
import { ActionFunction } from "./ActionFunction.js";
import { ToolConfigValidator } from "./ToolConfigValidator.js";
import { EducationPlatformError } from "./EducationPlatformError.js";

class ToolManager {

    toolId;
    toolsUrls;
    configErrors = [];
    configValidator;
    tools = {};
    functionRegister;

    constructor(){
        this.configValidator= new ToolConfigValidator();
        this.functionRegister= new FunctionRegistry();
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

            this.configErrors = this.configErrors.concat( this.fetchTools() );
            this.registerToolFunctions();
            this.createClassesFromConfig();
            
        }
    }

    

    /** 
     * Fetches the tools from the tools url and populates tool's
     * functions and panel definitions.
     * @returns errors from parsing and validation
     */
    fetchTools(){
        let errors = [];

        for (let toolUrl of this.toolsUrls) {

            let xhr = new XMLHttpRequest();
            xhr.open("GET", toolUrl.url, false);

            try{
                xhr.send();
            } catch (e) {
                if (e instanceof DOMException){
                    errors.push( new EducationPlatformError(`A tool configuration file was not accessible at: ${toolUrl.url}. 
                                                            Check the tool's url given in the activity file is correct and the tool 
                                                            service is still available.`) );
                }
            }

            if (xhr.status === 200) {    
                // Rewrite URLs in tool config
                let baseURL = toolUrl.url.substring(0, toolUrl.url.lastIndexOf("/")); // remove the name of the json file (including the trailing slash)
                let toolConfig = xhr.responseText.replaceAll("{{BASE-URL}}", baseURL);

                // Now parse tool config
                let validatedConfig = this.parseAndValidateToolConfig(toolConfig);

                if ( validatedConfig.errors.length == 0 ){
                    
                    const config = validatedConfig.config;

                    // Store the tool found in the given json
                    if (config.tool.id){
                        this.storeTool(config.tool);
                        
                        toolUrl.id = config.tool.id;

                        //TODO update any tool mangement menu. 
                    }
                
                } else {
                    // Error tool file parsing error
                    errors = errors.concat(validatedConfig.errors);
                }                
            }
        }

        return errors;
    }

    /**
     * Parses and validates a tool config file
     * @param {*} toolFile 
     * @returns object containing the validated tool file object and an array of errors
     */
    parseAndValidateToolConfig(toolFile){
        let validationResult = {};

        validationResult.errors = [];

        let config = parseConfigFile(toolFile);

        if (config instanceof Error) {
            // Parsing failed
            validationResult.errors.push(config);
        }

        if (validationResult.errors == 0){
            // Parsed correctly so validate activity configuration
            validationResult.errors =  validationResult.errors.concat( 
                this.configValidator.validateConfigFile(config) 
            );
        }

        if (validationResult.errors == 0){
            validationResult.config = config;
        } else {
            validationResult.config = null;
        }

        return validationResult;
    }


    registerToolFunctions(){
        for ( const toolKey in this.tools){

            for ( const toolFunction of this.tools[toolKey].functions ) {
               let parameterTypes = toolFunction.parameters.map( param => param.type);
               this.functionRegister.registerFunction( parameterTypes, toolFunction.returnType, toolFunction.id );
            }
        } 
    }

    /**
     *  Instantiate classes from the config
     */
    createClassesFromConfig() {
        for ( const toolkey in this.tools){
           
           let tool = this.tools[toolkey];
           
           if (Array.isArray(tool.functions) && tool.functions.length > 0){ 
               for (let functionIndex in tool.functions ){
                        
                    tool.functions[functionIndex] = new ActionFunction(tool.functions[functionIndex]);
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
     * Find a panel definition by id
     * @param {string} panelDefId 
     * @returns {Object|null} the found panel definition  
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
     * Returns type for a given Panel id
     * @param {*} panelDefId 
     * @returns {string|null} panel type
     */
    getPanelType(panelDefId) {

        let def = this.getPanelDefinition(panelDefId);
        
        if (def) {
            return def.language;
            
        } else {
            console.log("Tool with panel definition id '" + panelDefId + "' was not found.");
            return null;
        }
    }




    /**
     * Finds the action function for an action function Id
     * @param {*} actionFuntionId 
     * 
     * @deprecated issue #40
     */
    getActionFunction(actionFuntionId) {
        for ( const toolskey of  Object.keys(this.tools)){

            const foundFunction = this.tools[toolskey].functions.find( fn => fn.getId()==actionFuntionId );

            if ( foundFunction != undefined){
                return foundFunction;
            } 
        } 
        
        console.log("Tool with function id '" + actionFuntionId + "' was not found.");
        return null;

    }


    /**
     * Resolves the id of an action function to the function itself
     * 
     * TODO: To be moved to the FunctionRegistry issue #40
     * 
     * @param {string} functionId 
     */
    functionRegistry_resolve(functionId){
        return this.getActionFunction(functionId)
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


    /**
     * Returns the id of the registered function with matching input and output parameters.
     * @param {*} inputsParamTypes 
     * @param {*} outputParamType 
     * @returns The id of a matching function
     */
    getConversionFunction(inputsParamTypes, outputParamType){
        
       return this.functionRegister.lookupFunction(inputsParamTypes, outputParamType);
    }

    getPartiallyMatchingConversionFunctions(inputsParamTypes, outputParamType){
        
        return this.functionRegister.lookupFunctionsPartialMatch(inputsParamTypes, outputParamType);
     }

   /**
     * Returns the errors found parsing and validating the tool configuration files 
     * @returns array of errors
     */
    getConfigErrors(){
        return this.configErrors;
    }
}

export {ToolManager};
