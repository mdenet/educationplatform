/*global describe, it, expect, beforeEach, jasmine --  functions provided by Jasmine */
import { ToolConfigValidator } from "../../src/ToolConfigValidator";
import { TOOL_1PANELDEF_1FUNCTION } from "../resources/TestToolFiles.js";
import {customMatchers, checkErrorPopulated} from "../resources/TestUtility.js"

const EXPECTED_FILE_TYPE = "ToolConfig"; 

describe("ToolConfigValidator", () => {
      
    describe("constructor", () => {
        it("can be created", () => {
            // Call the target object
            let tcv = new ToolConfigValidator();
            
            // Check the expected results
            expect(tcv).toBeInstanceOf(ToolConfigValidator);
        })
    })

    describe("validate tool configuration", () => {
        let tcv;
        let toolConfig;
        
        //Setup
        beforeEach( () => {
            jasmine.addMatchers(customMatchers);
            toolConfig = JSON.parse(TOOL_1PANELDEF_1FUNCTION);
            tcv = new ToolConfigValidator();
        })

        it("reports no errors for a valid config", () => {
            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            
            // Check the expected results
            expect(errors).toHaveSize(0);
        })

        /*--------------------------------------------------------
         *   Tool
         *--------------------------------------------------------*/
        it("returns an error if the config has no id key", () => {
            delete toolConfig.tool.id;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "id"], "/tool");
        })

        it("returns an error if the config has no name key", () => {
            delete toolConfig.tool.name;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "name"], "/tool");
        })

        it("returns an error if the config has no functions key", () => {
            delete toolConfig.tool.functions;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "functions"], "/tool");
        })

        it("returns an error if a panel definition in the config has no id key", () => {
            delete toolConfig.tool.panelDefs[0].id;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "id"], "/tool/panelDefs/0");
        })

        /*--------------------------------------------------------
         *   Panel Definitions
         *--------------------------------------------------------*/
        it("returns an error if a panel definition in the config has no name key", () => {
            delete toolConfig.tool.panelDefs[0].name;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "name"], "/tool/panelDefs/0");
        })

        it("returns an error if a panel definition in the config has no panelclass key", () => {
            delete toolConfig.tool.panelDefs[0].panelclass;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "panelclass"], "/tool/panelDefs/0");
        })

        it("returns an error if a panel definition in the config has no icon key", () => {
            delete toolConfig.tool.panelDefs[0].icon;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "icon"], "/tool/panelDefs/0");
        })

        /* ---- Buttons ----  */
        it("returns an error if a button in the config has no id key", () => {
            delete toolConfig.tool.panelDefs[0].buttons[0].id;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "id"], "/tool/panelDefs/0/buttons/0");
        }) 

        it("returns an error if a button in the config has no id key", () => {
            delete toolConfig.tool.panelDefs[0].buttons[0].icon;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "icon"], "/tool/panelDefs/0/buttons/0");
        }) 


        /*--------------------------------------------------------
         *   Functions
         *--------------------------------------------------------*/
        it("returns an error if a function in the config has no id key", () => {
            delete toolConfig.tool.functions[0].id;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "id"], "/tool/functions/0");
        }) 

        it("returns an error if a function in the config has no name key", () => {
            delete toolConfig.tool.functions[0].name;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "name"], "/tool/functions/0");
        }) 

        it("returns an error if a function in the config has no parameters key", () => {
            delete toolConfig.tool.functions[0].parameters;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "parameters"], "/tool/functions/0");
        }) 
        
        it("returns an error if a function in the config has no returnType key", () => {
            delete toolConfig.tool.functions[0].returnType;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "returnType"], "/tool/functions/0");
        })
        
        it("returns an error if a function in the config has no path key", () => {
            delete toolConfig.tool.functions[0].path;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "path"], "/tool/functions/0");
        }) 

        /* ---- Parameters ----  */
        it("returns an error if a parameter in the config has no name key", () => {
            delete toolConfig.tool.functions[0].parameters[1].name;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "name"], "/tool/functions/0/parameters/1");
        })
        
        it("returns an error if a parameter in the config has no type key", () => {
            delete toolConfig.tool.functions[0].parameters[1].type;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "type"], "/tool/functions/0/parameters/1");
        }) 
    }) 
})

