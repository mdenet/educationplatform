import { parseConfigFile, ARRAY_ANY_ELEMENT, utility } from "./Utility.js";
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
    errorNotification;

    /**
     * @param {function(String)} errorNotifier - the function to call to display an error
     */
    constructor(errorNotifier){
        this.configValidator = new ToolConfigValidator();
        this.functionRegister = new FunctionRegistry(this);
        this.errorNotification = errorNotifier;
    }

    setToolsUrls(urls){
        if(this.toolsUrls==null) {

            this.toolsUrls = [];
            
            for(let url of urls){
                
                let toolUrl = new Object();
                toolUrl.id = ""; // Populate when tool is fetched
                if (this.isUrlPlaceHolder(url)){
                    // the url variable is a placeholder, so it needs to be re-written with the correct path
                    let url_tail = url.split('/')[1];
                    let url_port = this.getPort(url);
                    if (url_port != null){
                        let path = this.fetchPathByPort(url_port);

                        if(path != null){
                            let base_url = utility.getBaseURL();
                            path = path.endsWith('/') ? path : path + '/';
                            toolUrl.url = base_url + path + url_tail;
                        }
                    }
                    else{
                        toolUrl.url = url;
                    }
                }
                else if (this.isValidUrl(url)){
                    // the url variable is hardcoded in the activity file, so no need for re-writing
                    toolUrl.url = url;
                }
                else{
                    // something is wrong
                    this.configErrors.push(new EducationPlatformError(`${url} is not a valid URL or a valid URL placeholder.`))
                }
                
                this.toolsUrls.push(toolUrl);
            }

            this.configErrors = this.configErrors.concat( this.fetchTools() );
            this.registerToolFunctions();
            this.createClassesFromConfig();
            
        }
    }

    /**
     * Checks whether url_placeholder has a port attached to it and if so, it returns the port
     * @return integer|null
     */
    getPort(url_placeholder) {
        var url_placeholder_regexp = url_placeholder.match(new RegExp(/{{BASE-URL}}:*[0-9]*/));
        if (
            url_placeholder_regexp != null &&
            url_placeholder.indexOf(':') > 0
            ){
            return url_placeholder_regexp[0].split(':')[1];
        }

        return null;
    }

    /**
     * Fetches the relevant path by the service port.
     * @returns string|null
     */
    fetchPathByPort(port) {

        var port_to_path_dict = {
            8080 : '/',
            10000 : '/mdenet-auth',
            8069 : '/tools/conversion/',
            8070: '/tools/epsilon/services',
            8071: '/tools/emfatic',
            8072: '/tools/ocl/',
            8073: '/tools/emf/',
            8074: '/tools/xtext/',
            9000: '/tools/xtext/services/xtext',
            10001: '/tools/xtext/project/'
          };
        
          if (!isNaN(parseInt(port)) && Object.prototype.hasOwnProperty.call(port_to_path_dict, port)) {
            return port_to_path_dict[port];
          }

        return null;
    }

    /**
     * 
     */
    isUrlPlaceHolder(urlPlaceholder) {
        return (urlPlaceholder.startsWith('{{BASE-URL}}') || 
                urlPlaceholder.indexOf('{{BASE-URL}}') >= 0 ||
                urlPlaceholder.startsWith('{{ID-')
            )  
    }

    /**
     * Checks whether url is a valid url or not 
     * Valid URLs can begin with http or https optionally, and can consit of FQDN or IP addresses.
     * @returns bool
     */
    isValidUrl(url) {
        return url.match(new RegExp(/((http|https):\/\/)*([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/)) != null;
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
            } catch (err) {
                if (err instanceof DOMException){
                    errors.push( new EducationPlatformError(`A tool configuration file was not accessible at: ${toolUrl.url}. 
                                                            Check the tool's url given in the activity file is correct and the tool 
                                                            service is still available.`) );
                } else {
                    throw err;
                }
            }

            if (xhr.status === 200) {    

                let response_text =  xhr.responseText;

                var toolConfig = this.rewriteUrl(utility.getBaseURL(), toolUrl.url, response_text);

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
     * Reads toocl config text and replaces {{BASE-URL}} placeholders with the tool URL
     * @returns string
     */
    rewriteUrl(base_url, toolUrl, tool_config_string) {
        let tool_config_regexp = tool_config_string.match(new RegExp(/{{BASE-URL}}(:[0-9]+)?/g));
        var toolConfig = tool_config_string;

        if (tool_config_regexp != null){
            // There are references to another endpoint, so base URL must be set accordingly (There is a {{BASE-URL}} placeholder plus a port).
            var base_url_placeholders = new Set(tool_config_regexp); // Remove duplicates
            
            for (const url_placeholder of base_url_placeholders.values()) {
                let url_port = url_placeholder;
                let port = this.getPort(url_port);
                if (port != null){
                    let path = this.fetchPathByPort(port);
                    toolConfig = toolConfig.replaceAll(url_port, base_url + path);
                }
            }

            // No port comes with the remaining placeholders, replace it with the tool reletive URL

            var tool_base_url = toolUrl.substring(0, toolUrl.lastIndexOf("/")); // remove the name of the json file (including the trailing slash)
            toolConfig = toolConfig.replaceAll("{{BASE-URL}}", tool_base_url);

        }

        return toolConfig;
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
     * @deprecated issue #192
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
     * Returns the errors found parsing and validating the tool configuration files 
     * @returns array of errors
     */
    getConfigErrors(){
        return this.configErrors;
    }


    /**
     * Invokes an action function by placing requests to all the required external tool functions  
     * 
     * @param {string} functionId the id of tool function
     * @param {Map} parameterMap map from parameter name to its value and type
     * @returns {Promise}  promise to result of the action function 
     */
    invokeActionFunction(functionId, parameterMap){

        let actionFunction = this.functionRegister.resolve(functionId);

        let parameterPromises = [];

        for ( const paramName  of parameterMap.keys() ){ /* TODO add defensive checks that every required value
                                                                is provided issue #57 */

            let actionFunctionParam = actionFunction.getParameters().find( p => p.name === paramName);                                                             
                                                                        
            /* Check the given parameter types against the those of the requested action function. 
            If required, request conversion from available tool functions */
            let givenParameter = parameterMap.get(paramName);

            if (givenParameter.type != actionFunctionParam.type){
                //Types don't match  so try  and convert 
                let convertedValue;

                const metamodelId = actionFunction.getInstanceOfParamName(paramName);
                
                if(metamodelId==null){
                    // Convert with no metamodel to consider
                    convertedValue = this.convert( givenParameter.value, givenParameter.type, 
                                            actionFunctionParam.type, paramName ); // TODO issue #58 remove paramName

                } else {
                    // Convert considering metamodel
                    const givenMetamodel = parameterMap.get(metamodelId);

                    convertedValue = this.convertIncludingMetamodel( givenParameter.value , givenParameter.type, 
                                                                givenMetamodel.value, givenMetamodel.type, 
                                                                actionFunctionParam.type, paramName ); // TODO issue #58 remove paramName
                }

                parameterPromises.push(convertedValue);
            
            } else {
                // Matching types add values to promise for synchronisation 
                let value =  new Promise( function (resolve) { 
                    let parameterData = {};
                    
                    parameterData.name = paramName;
                    parameterData.data = givenParameter.value;
        
                    resolve(parameterData); 
                });

                parameterPromises.push(value);
            }
        }

        // Invoke the actionFunction on completion of any conversions
        let actionFunctionPromise = new Promise((resolve, reject) => {

            Promise.all( parameterPromises ).then( (values) => { 
                let actionRequestData = {};

                //Populate the transformed parameters
                for ( const param  of actionFunction.getParameters() ){

                    const panelConfig = parameterMap.get(param.name); 

                    if (panelConfig != undefined){
                        let parameterData = values.find(val => (val.name === param.name) );

                        actionRequestData[param.name] =  parameterData.data;
                    }
                }

                let resultPromise = this.functionRegister.call(functionId, actionRequestData);

                resolve(resultPromise);
            
            }).catch( (err) => {

                reject(err);
            });

        });

        return actionFunctionPromise;
    }

    /**
     * Converts a source value to a target type using the available conversion functions
     * 
     * @param {string} sourceValue 
     * @param {string} sourceType 
     * @param {string} targetType
     * @param {string} parameterName name of the parameter for request
     * @returns {Promise} promise for the converted parameter value
     */
    convert(sourceValue, sourceType, targetType, parameterName){
        
        let parameterPromise;
        let typesPanelValuesMap = {}; // Types have to be distinct for mapping to the conversion function's paramters
        typesPanelValuesMap[sourceType]=  sourceValue;

        let conversionFunctionId = this.functionRegister.find( Object.keys(typesPanelValuesMap), targetType );

        if (conversionFunctionId != null){
            //There is a matching conversion function
            parameterPromise = this.functionRegister.callConversion(conversionFunctionId, typesPanelValuesMap, parameterName);
            
        } else {
            parameterPromise = null;

            this.errorNotification("No conversion function available for input types:" + Object.keys(typesPanelValuesMap).toString() )
        }

        return parameterPromise;
    }


    /**
     * Converts a source value to a target type using the available conversion functions taking
     * into consideration the related metamodel.
     * 
     *   TODO: To be moved to the ToolManager issue #40
     * 
     * @param {string} sourceValue 
     * @param {string} sourceType
     * @param {string} metamodelValue 
     * @param {string} metamodelType
     * @param {string} targetType
     * @param {string} parameterName name of the parameter for request
     * @returns {Promise} promise for the converted parameter value
     */
    async convertIncludingMetamodel(sourceValue, sourceType, metamodelValue, metamodelType, targetType, parameterName){
        let parameterPromise;
        let typesPanelValuesMap = {}; // Types have to be distinct for mapping to the conversion function's parameters
        typesPanelValuesMap[sourceType]=  sourceValue;

        let conversionFunctionId;

        let potentialConversionFunctions = this.functionRegister.findPartial( [sourceType, ARRAY_ANY_ELEMENT], targetType);

        //check for a conversion function with the metamodel type
        conversionFunctionId = await this.selectConversionFunctionConvertMetamodel( metamodelType, metamodelValue, potentialConversionFunctions, 
                                                                                false, parameterName, typesPanelValuesMap)

        if (conversionFunctionId==null){
            //no conversion found so check for a conversion function but consider conversions of the metamodel
            conversionFunctionId = await this.selectConversionFunctionConvertMetamodel(metamodelType, metamodelValue, potentialConversionFunctions, 
                                                                                    true, parameterName, typesPanelValuesMap);
        }

        if (conversionFunctionId != null){
            //There is a matching conversion function
            parameterPromise = this.functionRegister.callConversion(conversionFunctionId, typesPanelValuesMap, parameterName);
            
        } else {
            parameterPromise = null;
            
            this.errorNotification("No conversion function available for input types:" + Object.keys(typesPanelValuesMap).toString() )
        }

        return parameterPromise;
    }


    /**
     * For the given list of conversion function ids to check, finds the first conversion function with matching metamodel dependency.
     * Optionally conversions of the metamodel are considered from the conversion functions available to the tools manager and
     * the metamodel type. If available, the metamodel value is converted to the required type. 
     * 
     * @param {string} metamodelType the metamodel type
     * @param {string} metamodelValue the metamodel value
     * @param {string[]} conversionFunctions list of conversion function ids to check 
     * @param {boolean} convertMetamodel when true try to convert the metamodel using a remote tool service conversion function
     *                                    available to the ToolsManager.
     * @param {string} parameterName the name of the parameter to use when converting the metamodel. 
     * @param {string[]} typeValueMap the type values map the metamodel input value is added to if a conversion function is found
     * @returns {string} the id of a conversion function to use, null if none found.
     */
    async selectConversionFunctionConvertMetamodel(metamodelType, metamodelValue, conversionFunctions, convertMetamodel, parameterName, typeValueMap){
        let conversionFunctionId = null;
        let functionsToCheck = [];

        if (Array.isArray(conversionFunctions)){
            functionsToCheck = [...conversionFunctions];
        }
        
        while ( conversionFunctionId==null && functionsToCheck.length > 0){
            let functionId = functionsToCheck.pop();
            let conversionFunction = this.getActionFunction(functionId);

            // Lookup the conversion function's metamodel type
            let metamodelName = conversionFunction.getInstanceOfParamName( conversionFunction.getParameters()[0].name );

            if(metamodelName==null){
                metamodelName = conversionFunction.getInstanceOfParamName( conversionFunction.getParameters()[1].name );
            }

            const targetMetamodelType = conversionFunction.getParameterType(metamodelName);

            if (!convertMetamodel){
                // Check for conversion functions with matching metamodels only
                
                if (targetMetamodelType==metamodelType) {
                        //Conversion function found so use the panel value
                        
                        conversionFunctionId = functionId;
                        typeValueMap[metamodelType]=  metamodelValue;
                }

            } else {
                // Check for conversion functions converting metamodel if possible 
                let metamodelConversionFunctionId = this.functionRegister.find( [metamodelType], targetMetamodelType );
                
                if (metamodelConversionFunctionId != null){

                    conversionFunctionId = functionId;

                    //convert metamodel
                    let metamodelTypeValueMap =  {};  
                    metamodelTypeValueMap[metamodelType]=metamodelValue; // The found conversion function is expected to have one parameter

                    let convertedValue = await this.functionRegister.callConversion(metamodelConversionFunctionId, metamodelTypeValueMap, parameterName);

                    typeValueMap[targetMetamodelType]= convertedValue.data;
                }
            }
        }

        return conversionFunctionId;
    }
}

export {ToolManager};
