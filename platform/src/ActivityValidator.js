import { ConfigValidationError, CONTEXT_SEPARATOR } from './ConfigValidationError';

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
                        `activity.id: ${activity.id}, layout ${CONTEXT_SEPARATOR} area ${CONTEXT_SEPARATOR} ${id}`, errorFileType.ACTIVITY)
                );
            }
        });

        return errors;
    }

    /**
     * Check the actions reference ids
     * @param {Object} activity - An activity with all references resolved.
     * @returns {ConfigValidationError[]} Array of configuration errors, empty if there are none.
     */
    static checkActions(activity){
        let errors = [];

        activity.actions.forEach( (act, index) => {
            let newErrors = this.checkActionIdsExist(act, activity.panels);
            
            ConfigValidationError.addContextToErrors(newErrors, `activity.id: ${activity.id}, actions[${index}]`);
            errors = errors.concat(newErrors);
        });

        

        return errors;
    }

    /**
     * Check an action panel ids exist
     * @param {Object} action - The action to check.
     * @param {Object[]} panels - The panels. 
     * @returns {ConfigValidationError[]} Array of configuration errors, empty if there are none.
     */
    static checkActionIdsExist(action, panels){
        let errors = [];

        if ( !(action.source instanceof Object) && !this.idExists(panels, action.source.id) ){ // action ids are resolved so get id from object
            errors.push( 
                new ConfigValidationError(ERROR_CATEGORY, "A panel does not exist for the given id.",  
                `source: ${action.source}`, errorFileType.ACTIVITY)
            );
        }

        if ( !(action.output instanceof Object) && !this.idExists(panels, action.output.id) ){ // action ids are resolved so get id from object
            errors.push( 
                new ConfigValidationError(ERROR_CATEGORY, "A panel does not exist for the given id.",  
                `output: ${action.output}`, errorFileType.ACTIVITY)
            );
        }

        if ( action.outputConsole != null && !(action.outputConsole instanceof Object) && !this.idExists( panels, action.outputConsole.id) ){ // action ids are resolved so get id from object
            errors.push( 
                new ConfigValidationError(ERROR_CATEGORY, "A panel does not exist for the given id.",  
                `outputConsole: ${action.outputConsole}`, errorFileType.ACTIVITY)
            );
        }

        return errors;
    }

    /**
     * Checks the given panels references exist.
     * @param {Object[]} activity - The activity with references resolved.
     * @returns {ConfigValidationError[]} Array of configuration errors, empty if there are none.
     */
    static checkPanelRefs(activity){
        let errors = [];

        activity.panels.forEach( (pn, index) => {
            if (!(pn.ref instanceof Object)){ // Un-resolved panels remain as ids
                errors.push( 
                    new ConfigValidationError(ERROR_CATEGORY, "A referenced panel definition does not exist with the given id.",  
                    `activity.id: ${activity.id}, panels[${index}] ${CONTEXT_SEPARATOR} id: ${pn.id}, ref: ${pn.ref}`, errorFileType.ACTIVITY)
                );
            }
        });

        return errors;
    }

    // Tool checks
    /**
     * Check the panel definitions reference ids
     * @param {Object} tool - A tool with all references resolved.
     * @returns {ConfigValidationError[]} Array of configuration errors, empty if there are none.
     */
    static checkPanelDefs(tool){
        let errors = [];

        tool.panelDefs.forEach( (pDef, index) => {
            let newErrors = this.checkPanelButtonsFunctionIdsExist(pDef, tool.functions);
            
            ConfigValidationError.addContextToErrors(newErrors, `tool.id: ${tool.id}, panelDefs[${index}]:`);
            errors = errors.concat(newErrors);
        });

        return errors;
    }

    /**
     * Check buttons function ids exist for a given panel. 
     * @param {Obejct} panel - Panel to check.
     * @param {Object[]} functions - The available functions.
     * @returns {ConfigValidationError[]} Array of configuration errors, empty if there are none.
     */
    static checkPanelButtonsFunctionIdsExist(panel, functions) {
        let errors = [];

        if("buttons" in panel){
            panel.buttons.forEach( (btn) => {

                if ( ("actionfunction" in btn) && !this.idExists(functions, btn.actionfunction) ) {
                    errors.push( 
                        new ConfigValidationError(ERROR_CATEGORY, "A function does not exist for the given id.",  
                        `id: ${panel.id} ${CONTEXT_SEPARATOR} buttton.id: ${btn.id}, actionfunction: ${btn.actionfunction}`, errorFileType.TOOL)
                    );
                } else if (("renderfunction" in btn) && !this.idExists(functions, btn.renderfunction) ){
                    errors.push( 
                        new ConfigValidationError(ERROR_CATEGORY, "A function does not exist for the given id.",  
                        `id: ${panel.id} ${CONTEXT_SEPARATOR} buttton.id: ${btn.id}, renderfunction: ${btn.renderfunction}`, errorFileType.TOOL)
                    );
                }
            });
        }

        return errors;
    }

    
    // Utility

    /**
     * Determines if an object with a matching id exists for the given items.  
     * @param {Object[]} items - Array of objects that have ids. 
     * @param {String} id - The id to check.
     * @returns true if exists.
     */
    static idExists(items, id){
        let found = false;

        if (id != null && items.length > 0){
            let foundItem;
                
            foundItem= items.find( (i) => { 
                if (i.constructor.name == "Object") {
                    // Simple object so expect id attribute
                    return i.id === id
                } else {
                    // Class so expect accessor method 
                    return i.getId() === id;
                }
            });
 
            found= (foundItem != null);
        }
        return found;
    }

    
    /**
     * Runs all checks on a given activity.
     * @param {Object} activity - An activity with all references resolved.
     * @param {Object[]} tools - The tools used by the activity.
     * @returns {ConfigValidationError[]} Array of configuration errors, empty if there are none.
     */
    static validate(activity, tools){
        let errors = [];

        Object.values(tools).forEach((tl)=>{
            errors = errors.concat ( this.checkPanelDefs(tl) );
        });

        errors = errors.concat( this.checkLayoutPanelIdsExist(activity) );

        errors = errors.concat( this.checkActions(activity) );

        errors = errors.concat( this.checkPanelRefs(activity) );
        
        return errors;
    }

}

export {ActivityValidator};