

import { extendErrors } from 'ajv/dist/compile/errors';
import { ConfigValidationError } from './ConfigValidationError';

const ERROR_CATEGORY = "ERROR_CONFIG_DEF"

const errorFileType =  {
    ACTIVITY: "ActivityConfig",
    TOOL: "ToolConfig"
}

class ActivityValidator {

    // Activity checks
    
    /**
     * Check layout panel ids exist
     * @param {Object} activity - An activity with all references resolved.
     * @returns {ConfigValidationError[]} Array of configuration errors, empty if there are none.
     */
    static checkLayoutPanelIdsExist(activity){
        let errors = [];

        let combinedRows = [];
        activity.layout.area.forEach( (row) => combinedRows= combinedRows.concat(row) );

        const ids = new Set(combinedRows);
        ids.delete(""); // Remove empty references used to indicate extend panel

        ids.forEach( (id) => {
            if (!this.idExists(activity.panels, id)){
                    errors.push( 
                        new ConfigValidationError(ERROR_CATEGORY, "A panel does not exist for the given id.",  
                        `${activity.id} -> layout -> ${id}`, errorFileType.ACTIVITY)
                );
            }
        });

        return errors;
    }

    /**
     * Check the actions reference ids
     * @param {*} activity - An activity with all references resolved.
     * @returns {ConfigValidationError[]} Array of configuration errors, empty if there are none.
     */
    static checkActions(activity){
        let errors = [];

        activity.actions.forEach( (act) => {
            errors = errors.concat( this.checkActionIdsExist(act, activity.panels) );
        });

        return errors;
    }

    /**
     * Check an action panel ids exist
     * @param {*} action - The action to check
     * @param {*} panels - The panels 
     * @returns {ConfigValidationError[]} Array of configuration errors, empty if there are none.
     */
    static checkActionIdsExist(action, panels){
        let errors = [];

        if (!this.idExists( panels, action.source.id)){ // action ids are resolved so get id from object
            errors.push( 
                new ConfigValidationError(ERROR_CATEGORY, "A panel does not exist for the given id.",  
                `actions -> source: ${action.source}`, errorFileType.ACTIVITY)
            );
        }

        if (!this.idExists( panels, action.output.id)){ // action ids are resolved so get id from object
            errors.push( 
                new ConfigValidationError(ERROR_CATEGORY, "A panel does not exist for the given id.",  
                `actions -> output: ${action.output}`, errorFileType.ACTIVITY)
            );
        }

        if ( ("outputConsole" in action) && !this.idExists( panels, action.outputConsole.id)){ // action ids are resolved so get id from object
            errors.push( 
                new ConfigValidationError(ERROR_CATEGORY, "A panel does not exist for the given id.",  
                `actions -> outputConsole: ${action.outputConsole}`, errorFileType.ACTIVITY)
            );
        }

        return errors;
;    }


    // Tool checks
    // TODO 

    
    // Utility

    /**
     * 
     * @param {Object[]} items - Array of objects that have ids. 
     * @param {String} id - The id to check.
     * @returns true if exists.
     */
    static idExists(items, id){
        let found = false;

        if (id != null){
            let foundItem= items.find( (i) => i.id === id );
            found= (id === foundItem?.id);
        }
        return found;
    }

    
    static validate(activity){
        let errors = [];

        errors = errors.concat( this.checkLayoutPanelIdsExist(activity) );

        errors = errors.concat( this.checkActions(activity) );
        
        return errors;
    }

}

export {ActivityValidator};