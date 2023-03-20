
class ActionFunction { 

    actionFunction;

    constructor(actionFunctionConfig){

        this.actionFunction = actionFunctionConfig;

    }

    getId(){
        return this.actionFunction.id;
    }

    getName(){
        return this.actionFunction.name;
    }

    getParameters(){
        return this.actionFunction.parameters;    
    }

    getReturnType(){
        return this.actionFunction.returnType;
    }

    getPath(){
        return this.actionFunction.path;
    }

    getParameterType(parameterName){
        let parameter=  this.actionFunction.parameters.find( param => param.name===parameterName );
        return parameter.type;
    }
    

    getParametersMatchingType(type){
        return this.actionFunction.parameters.filter( param => param.type===type )
    }

    /**
     * Gets the correspoding parameter name of the instance of the actionfunction's parameter
     * @param {*} parameterName the parameter to get the instance of
     * @returns parameter name or null if there isn't one or parameter not found
     */
    getInstanceOfParamName(parameterName){
        
        for(const param of this.actionFunction.parameters){

            if(param.name === parameterName && param.instanceOf != null){
                return param.instanceOf;
            }
        
        }
    return null;
    }

    getInstanceOfReturnType(){
        if (this.actionFunction.returnType.instanceOf != null) {

            return  this.actionFunction.returnType.instanceOf;

        } else {
            return null;
        }

    }

}

export {ActionFunction};