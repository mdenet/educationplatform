/*global describe, it, expect, beforeEach, jasmine --  functions provided by Jasmine */
import { ActivityConfigValidator } from "../../src/ActivityConfigValidator.js"
import { ACTIVITY_2PANELS_1ACTION } from "../resources/TestActivityFiles.js";
import {customMatchers, checkErrorPopulated} from "../resources/TestUtility.js"

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

    describe("validate activity configuration", () => {
        let acv;
        let activityConfig;
        
        //Setup
        beforeEach( () => {
            jasmine.addMatchers(customMatchers);
            activityConfig = JSON.parse(ACTIVITY_2PANELS_1ACTION);
            acv = new ActivityConfigValidator();
        })

        it("reports no errors for a valid config", () => {
            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            
            // Check the expected results
            expect(errors).toHaveSize(0);
        })

        /*--------------------------------------------------------
         *   Activity
         *--------------------------------------------------------*/
        it("returns an error if the config has no id key", () => {
            delete activityConfig.activities[0].id;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "id"], "/activities/0");
        })

        it("returns an error if the config has no title key", () => {
            delete activityConfig.activities[0].title;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "title"], "/activities/0");
        })

        it("returns an error if the config has no tools key", () => {
            delete activityConfig.activities[0].tools;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "tools"], "/activities/0");
        })

        it("returns an error if the config has no layout key", () => {
            delete activityConfig.activities[0].layout;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "layout"], "/activities/0");
        })

        it("returns an error if the config has no actions key", () => {
            delete activityConfig.activities[0].actions;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "actions"], "/activities/0");
        })

        it("returns an error if the config has no panels key", () => {
            delete activityConfig.activities[0].panels;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "panels"], "/activities/0");
        })

        /*--------------------------------------------------------
         *   Layout
         *--------------------------------------------------------*/
        it("returns an error if the config layout has no area key", () => {
            delete activityConfig.activities[0].layout.area;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "area"], "/activities/0/layout");
        })
        
        /*--------------------------------------------------------
         *   Actions
         *--------------------------------------------------------*/
        it("returns an error if a config action has no source key", () => {
            delete activityConfig.activities[0].actions[0].source;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "source"], "/activities/0/actions/0");
        })

        it("returns an error if a config action has no sourceButton key", () => {
            delete activityConfig.activities[0].actions[0].sourceButton;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "sourceButton"], "/activities/0/actions/0");
        })

        it("returns an error if a config action has no parameters key", () => {
            delete activityConfig.activities[0].actions[0].parameters;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "parameters"], "/activities/0/actions/0");
        })

        it("returns an error if a config action has no output key", () => {
            delete activityConfig.activities[0].actions[0].output;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "output"], "/activities/0/actions/0");
        })

        /*--------------------------------------------------------
         *   Panels
         *--------------------------------------------------------*/
        it("returns an error if a panel in config has no id key", () => {
            delete activityConfig.activities[0].panels[1].id;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "id"], "/activities/0/panels/1");
        })

        it("returns an error if a panel in config has no name key", () => {
            delete activityConfig.activities[0].panels[1].name;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "name"], "/activities/0/panels/1");
        })

        it("returns an error if a panel in config has no ref key", () => {
            delete activityConfig.activities[0].panels[1].ref;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(1);
            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "ref"], "/activities/0/panels/1");
        })

        /* ---- Buttons ----  */
        it("returns an error if a panel button in config has no id key", () => {
            delete activityConfig.activities[0].panels[1].buttons[0].id;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(3); // As Json schema oneOf is used to allow either ref or a button so a ref error 
                                          // and oneOf error are also returned

            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "id"], "/activities/0/panels/1/buttons/0");
        })

        it("returns an error if a panel button in config has no icon key", () => {
            delete activityConfig.activities[0].panels[1].buttons[0].icon;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[0];
            
            // Check the expected results
            expect(errors).toHaveSize(3); // As Json schema oneOf is used to allow either ref or a button so a ref 
                                          // and oneOf errors are also returned

            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "icon"], "/activities/0/panels/1/buttons/0");
        })

        it("returns an error if a panel button ref in config has no ref key", () => {
            delete activityConfig.activities[0].panels[1].buttons[1].ref;

            // Call the target object
            let errors = acv.validateConfigFile(activityConfig);
            let e = errors[2];
            
            // Check the expected results
            expect(errors).toHaveSize(4); // As Json schema oneOf is used to allow either ref or a button so a button  
                                          // and oneOf errors are also returned

            checkErrorPopulated(e, "required", EXPECTED_FILE_TYPE, ["required", "ref"], "/activities/0/panels/1/buttons/1");
        })
    }) 
})
