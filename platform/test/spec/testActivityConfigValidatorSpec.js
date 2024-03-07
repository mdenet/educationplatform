/*global describe, it, expect, beforeEach --  functions provided by Jasmine */
import { ActivityConfigValidator } from "../../src/ActivityConfigValidator.js"
import { ACTIVITY_2PANELS_1ACTION } from "../resources/TestActivityFiles.js";
import { ConfigValidationError } from "../../src/ConfigValidationError.js"


const EXPECTED_FILE_TYPE = "ActivityConfig"; 

describe("ActivityConfigValidator", () => {
      
    describe("constructor", () => {
        it("can be created", () => {
            // Call the target object
            let acv = new ActivityConfigValidator();
            
            // Check the expected results
            expect(acv).toBeInstanceOf(ActivityConfigValidator);
        })
    })

    describe("validate tool configuration", () => {
        let acv;
        let activityConfig;
        
        //Setup
        beforeEach( () => {
            activityConfig = JSON.parse(ACTIVITY_2PANELS_1ACTION);
            acv = new ActivityConfigValidator();
        })

        it("reports no errors for a valid config", () => {
            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            
            // Check the expected results
            expect(errors).toHaveSize(0);
        })

        it("returns errors that are  ConfigValidationError instances",() => {
            delete activityConfig.activities[0].id;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(e).toBeInstanceOf(ConfigValidationError);
            expect(e.fileType).toEqual(EXPECTED_FILE_TYPE);
        })

        it("returns an error if the config has no id key", () => {
            delete activityConfig.activities[0].id;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e);
        })

        it("returns an error if a panel in config has no id key", () => {
            delete activityConfig.activities[0].panels[1].id;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
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