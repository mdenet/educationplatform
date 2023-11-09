import Ajv from 'ajv';

import { ConfigValidationError } from './ConfigValidationError';

const schemaToolConfig = require('../schemas/tool-config.schema.json');
const schemaFunction = require('../schemas/function.schema.json');
const schemaPanelDef = require('../schemas/paneldef.schema.json');
const schemaParameter = require( '../schemas/parameter.schema.json');
const schemaButton = require( '../schemas/button.schema.json');

class ToolConfigValidator {

    validate;

    constructor() {
        const schemaValidator = new Ajv({allErrors: true, schemas: [schemaToolConfig, schemaFunction, schemaPanelDef, schemaParameter, schemaButton]});
        this.validate = schemaValidator.getSchema("https://mde-network.com/ep/tool-config.schema.json"); // id from local schema file
    }


    /**
     * Valdiates an activity configuration file.
     * @param {*} the parsed activity configuration file object
     * @returns an array of errors
     */
    validateConfigFile(activityObject){

        let errors = [];

        const valid = this.validate(activityObject);

        if (!valid) {
            // Validation errors create and add to the return variable
            this.validate.errors.forEach( (err)=> {
                errors.push( 
                    new ConfigValidationError(
                        err.keyword,
                        err.message,
                        err.instancePath,
                        "ToolConfig"
                    ) )
            } );            
        }

        return errors;
    }

}

export{ToolConfigValidator}