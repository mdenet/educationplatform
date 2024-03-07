/*global describe, it, expect, beforeEach --  functions provided by Jasmine */
import { ToolConfigValidator } from "../../src/ToolConfigValidator"
import { TOOL_1PANELDEF_1FUNCTION } from "../resources/TestToolFiles.js";
import { ConfigValidationError } from "../../src/ConfigValidationError.js"


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
            toolConfig = JSON.parse(TOOL_1PANELDEF_1FUNCTION);
            tcv = new ToolConfigValidator();
        })

        it("reports no errors for a valid config", () => {
            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            
            // Check the expected results
            expect(errors).toHaveSize(0);
        })

        it("returns errors that are ConfigValidationError instances",() => {
            delete toolConfig.tool.id;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(e).toBeInstanceOf(ConfigValidationError);
            expect(e.fileType).toEqual(EXPECTED_FILE_TYPE);
        })

        it("returns an error if the config has no id key", () => {
            delete toolConfig.tool.id;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e);
        })

        it("returns an error if a panel definition in the config has no id key", () => {
            delete toolConfig.tool.panelDefs[0].id;

            // Call the target object
            let errors = tcv.validateConfigFile(toolConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e);
        })
    }) 
})

function checkErrorPopulated(error){
    const MIN_LENGTH = 3;
    expect(error).toBeInstanceOf(ConfigValidationError);
    expect(error.fileType).toEqual(EXPECTED_FILE_TYPE);
    expect(error.location.length).toBeGreaterThanOrEqual(MIN_LENGTH);
    expect(error.category.length).toBeGreaterThanOrEqual(MIN_LENGTH);
    expect(error.message.length).toBeGreaterThanOrEqual(MIN_LENGTH);
}