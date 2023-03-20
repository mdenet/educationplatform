import {arrayEquals} from "./Utility.js"

class FunctionRegistry {

register = [];

    registerFunction( inputParameterTypes, outputParameterType, functionId ){
        
        let entry = {}; 
        entry.id = functionId;
        entry.inputParamTypes = inputParameterTypes;
        entry.outputParamType = outputParameterType;

        this.register.push( entry );
    }

    lookupFunction(inputParameterTypes, outputParameterType){

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
}

export { FunctionRegistry };