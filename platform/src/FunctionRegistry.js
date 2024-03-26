import {arrayEquals, jsonRequestConversion, jsonRequest} from "./Utility.js"

class FunctionRegistry {

register = [];
toolsManager;

    /**
     * @param {ToolsManager} theToolsManager - the tools manager
     */
    constructor(theToolsManager){
        this.toolsManager = theToolsManager;
    }

    registerFunction( inputParameterTypes, outputParameterType, functionId ){
        
        let entry = {}; 
        entry.id = functionId;
        entry.inputParamTypes = inputParameterTypes;
        entry.outputParamType = outputParameterType;

        this.register.push( entry );
    }

    find(inputParameterTypes, outputParameterType){

        let foundEntry;

        if (this.register.length > 0){

            foundEntry = this.register.find( entry => arrayEquals(entry.inputParamTypes, inputParameterTypes) &&
                                                            entry.outputParamType === outputParameterType);
        }

        if (foundEntry != undefined){
            return foundEntry.id;

        } else {
            return null;
        }
    }

    
    findPartial(inputParameterTypes, outputParameterType){

        let foundEntries;

        if (this.register.length > 0){

            foundEntries = this.register.filter( entry => arrayEquals(entry.inputParamTypes, inputParameterTypes, true) &&
                                                            entry.outputParamType === outputParameterType);
        }

        if (foundEntries != undefined){
            return  foundEntries.map( entry => entry.id )  ;

        } else {
            return null;
        }
    }

    /**
     * Resolves the id of an action function to the function itself
     * 
     * @param {string} functionId 
     */
    resolve(functionId){
        return this.toolsManager.getActionFunction(functionId)
    }

    /**
     * Requests the conversion function from the remote tool service
     * 
     * @param {Object} parameters 
     * @param {ActionFunction} conversionFunction
     * @param {String} parameterName name of the parameter
     * @returns Promise for the translated data
     */
    requestTranslation(parameters, conversionFunction, parameterName){
        
        let parametersJson = JSON.stringify(parameters);

        return jsonRequestConversion(conversionFunction.getPath(), parametersJson, parameterName);
    }

    /**
     * 
     * @param {string} functionId url of the function to call
     * @param {Object} parameters object containing the parameters request data
     * @returns 
     */
    call(functionId, parameters ){

        let actionFunction = this.toolsManager.getActionFunction(functionId);
        let parametersJson = JSON.stringify(parameters);

        let requestPromise = jsonRequest(actionFunction.getPath(), parametersJson)

        return requestPromise;
    }

    /**
     * Prepares the input parameters and requests the type translation for the given function id 
     * 
     * @param {string} functionId the id of the action function
     * @param {Object} typeValuesMap an object mapping action functions parameter types as keys to input values
     * @param {string} parameterName name of the parameter
     * @returns Promise for the translated data
     * 
     */
        callConversion( functionId, typeValuesMap, parameterName ){
            let conversionRequestData = {};
            let conversionFunction = this.toolsManager.getActionFunction(functionId);
    
            // Populate parameters for the conversion request 
            for( const param of conversionFunction.getParameters() ){
                conversionRequestData[param.name] =  typeValuesMap[param.type];
            }
    
            return this.requestTranslation(conversionRequestData, conversionFunction, parameterName);
        }
}

export { FunctionRegistry };