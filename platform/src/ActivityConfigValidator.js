import Ajv from 'ajv';

import { ConfigValidationError } from './ConfigValidationError';

const  schemaActivtyConfig = require('../schemas/activity-config.schema.json');
const schemaLayout  = require('../schemas/layout.schema.json');
const schemaAction  = require('../schemas/action.schema.json');
const schemaPanel  = require('../schemas/panel.schema.json');
const schemaButton = require( '../schemas/button.schema.json');
const schemaRef = require( '../schemas/ref.schema.json');


class ActivityConfigValidator {

    validate;

    constructor() {
        const schemaValidator = new Ajv({allErrors: true, schemas: [schemaActivtyConfig, schemaLayout, schemaAction, schemaPanel, schemaButton, schemaRef]});
        this.validate = schemaValidator.getSchema("https://mde-network.com/ep/activity-config.schema.json"); // id from local schema file
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
                        "ActivityConfig"
                    ) )
            } );            
        }

        return errors;
    }

}

export{ActivityConfigValidator}