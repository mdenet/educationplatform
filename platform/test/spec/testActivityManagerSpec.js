/*global describe, it, expect, spyOn, beforeEach, fail --  functions provided by Jasmine */
import {ActivityManager} from "../../src/ActivityManager.js";

import { FileHandler } from "../../src/FileHandler.js";
import { ActivityConfigValidator } from "../../src/ActivityConfigValidator.js";
import { utility } from "../../src/Utility.js";
import { ACTIVITY_2PANELS_1ACTION } from "../resources/TestActivityFiles.js";
import { TOOL_1PANELDEF_1FUNCTION } from "../resources/TestToolFiles.js";
import { configObjectEquals } from "../resources/TestUtility.js";


describe("ActivityManager", () => {

    describe("constructor", () => {
        // Setup
        const ACTIVITY_URL="test://a.url";
        let fileh;
        let refPanelDef;
        let spySearch;

        beforeEach( () => {

            fileh = new FileHandler("test://th.url") 
            refPanelDef = () => {};

            spySearch = spyOn( utility, "getWindowLocationSearch");
        })

        it("can be created", () => {
            // Call the target object
            let am = new ActivityManager(refPanelDef, fileh);

            // Check the expected results
            expect(am).toBeInstanceOf(ActivityManager);
        })

        it("initialises the configValidator property", () => {
            // Call the target object
            let am = new ActivityManager(refPanelDef, fileh);

            // Check the expected results            
            expect(am.configValidator).toBeInstanceOf(ActivityConfigValidator);
        })        

        it("initialises the accessPanelDef property using param panelDefAccessor", () => {
            // Call the target object
            let am = new ActivityManager(refPanelDef, fileh);

            // Check the expected results            
            expect(am.accessPanelDef).toBe(refPanelDef);
        })  

        it("initialises the fileHandler property  using param fileHandler", () => {
            // Call the target object
            let am = new ActivityManager(refPanelDef, fileh);

            // Check the expected results            
            expect(am.fileHandler).toBe(fileh);
        })  

        it("uses the query string to set the activitiesUrl property", () => {
            const QUERY = "?activities=" + ACTIVITY_URL;
            spySearch.and.returnValue(QUERY); //Update the spy

            // Call the target object
            let am = new ActivityManager(refPanelDef, fileh);

            // Check the expected results
            expect(utility.getWindowLocationSearch).toHaveBeenCalled();
            expect(am.activitiesUrl).toBe(ACTIVITY_URL);
        })

        it ("sets the activityId property if the current activity is provided in the url query string", () => {
            const ACTIVITY_ID="a1"
            const QUERY = "?"+ ACTIVITY_ID + "=&" + "activities=" + ACTIVITY_URL;
            spySearch.and.returnValue(QUERY); // Update the spy

            // Call the target object
            let am = new ActivityManager(refPanelDef, fileh);

            // Check the expected results
            expect(am.activityId).toBe(ACTIVITY_ID);
        })

    })

    describe("activity initialisation", () => {
        const ACTIVITY_URL="test://a.url";
        const QUERY="?activities=" + ACTIVITY_URL;
        let fileh;
        let refPanelDef;
        let am;
        const activityFile = ACTIVITY_2PANELS_1ACTION;

        beforeEach( () => {
            // Setup
            fileh = new FileHandler("test://th.url"); 
            refPanelDef = () => {};
                
            spyOn( ActivityManager.prototype, "resolveActionReferences").and.callThrough();
            spyOn( utility, "getWindowLocationSearch").and.returnValue(QUERY);
            spyOn(FileHandler.prototype, "fetchFile").and.returnValue({ content: activityFile });
            spyOn(ActivityConfigValidator.prototype, "validateConfigFile").and.returnValue([]);
            spyOn(ActivityManager.prototype, "appendTopLevelActivityMenuItem"); // Uses document.getElementById

            // Call the target object
            am = new ActivityManager(refPanelDef , fileh);
            am.initializeActivities();
        })

        // Check the expected results
        const ACTIVITY_ID = "activity-1";
        const PANEL1_ID = "panel-1";
        const PANEL2_ID = "panel-2";
        const PANEL_DEINITION_ID = "paneldef-t1";

        it("causes the activity file to be fetched from its URL using the fileHandler", () => {
            expect(FileHandler.prototype.fetchFile).toHaveBeenCalledWith(ACTIVITY_URL, false);
        })

        it("resolves references for a valid activity by  calling resolveActionReferences with activity id", ()=> {
            expect(am.resolveActionReferences).toHaveBeenCalledWith(ACTIVITY_ID);
        })

        it("current activity activityId property is set to the activity id", () => {
            expect(am.activityId).toEqual(ACTIVITY_ID);
        })

        it("no config errors empty configErrors propererty", () => {
            expect(am.configErrors).toHaveSize(0);
        })

        it("the activities property has a key matching the activity id", () => {
            expect(Object.keys(am.activities)).toHaveSize(1);
            expect(Object.keys(am.activities).pop()).toEqual(ACTIVITY_ID);
        })

        it("an activities property's value is an object", () => {
            expect(am.activities[ACTIVITY_ID]).toBeInstanceOf(Object);
        }) 

        it("the activities property is an object that has required keys", () => {
            const REQUIRED_KEYS = ["actions", "icon", "id", "layout", "panels", "title", "tools"];
  
            const activityObject = am.activities[ACTIVITY_ID];
            let parsedActivityKeys = Object.keys(activityObject);

            expect(parsedActivityKeys).toHaveSize(REQUIRED_KEYS.length)
            for(const k of REQUIRED_KEYS){
                if ( !parsedActivityKeys.find( (n) => (n == k) ) ){
                    fail("Expected key '" + k + "' not found in activity object.");
                }
            }
        }) 

        it("the activities actions property panel references have been resolved", () => {
            const expectedActivity = JSON.parse(activityFile).activities[0];
            const expectedPanelSource = expectedActivity.panels.find((p) => p.id===PANEL1_ID);
            const expectedPanelOutput = expectedActivity.panels.find((p) => p.id===PANEL2_ID);
            
            const action = am.activities[ACTIVITY_ID].actions[0];
            
            expect(action.source).toBeInstanceOf(Object);
            if (!configObjectEquals( action.source, expectedPanelSource )) {
                fail("Expected action's source panel'" + JSON.stringify(action.source) + "' to equal'" + JSON.stringify(expectedPanelSource) + "'");
            }

            expect(action.output).toBeInstanceOf(Object);
            if (!configObjectEquals( action.output, expectedPanelOutput )){
                fail("Expected action's source panel'" + JSON.stringify(action.output) + "' to equal'" + JSON.stringify(expectedPanelOutput) + "'" );
            }
        })

        it("the panel definitions the current activity references are unresolved", () => {
            expect (am.activities[ACTIVITY_ID].panels[0].ref).toEqual(PANEL_DEINITION_ID);
            expect (am.activities[ACTIVITY_ID].panels[1].ref).toEqual(PANEL_DEINITION_ID);
        })
    })


    describe("getting current activity", () => {
        const ACTIVITY_URL="http://a.url";
        const QUERY="?activities=" + ACTIVITY_URL;
        let fileh;
        let refPanelDef;
        let am;
        const activityFile = ACTIVITY_2PANELS_1ACTION;
        const toolConfig = JSON.parse(TOOL_1PANELDEF_1FUNCTION).tool;
        const panelDef = toolConfig.panelDefs[0];

        beforeEach( () => {
            // Setup
            fileh = new FileHandler("test://th.url"); 
            refPanelDef = () => {
                return panelDef;
            };
                
            spyOn( utility, "getWindowLocationSearch").and.returnValue(QUERY);
            spyOn(FileHandler.prototype, "fetchFile").and.returnValue({ content: activityFile });
            spyOn(ActivityConfigValidator.prototype, "validateConfigFile").and.returnValue([]);
            spyOn(ActivityManager.prototype, "appendTopLevelActivityMenuItem"); // Uses document.getElementById
            spyOn(ActivityManager.prototype, "fetchFile").and.returnValue({content: "Test Content", sha: "a123"}); 

            // Call the target object
            am = new ActivityManager(refPanelDef , fileh);
            am.initializeActivities();
            am.getSelectedActivity();
        }) 

        // Check the expected results
        const ACTIVITY_ID = "activity-1";

        it("the panel definitions for the current activity references are resolved", () => {
            expect(am.activities[ACTIVITY_ID].panels[0].ref).toBeInstanceOf(Object);
            expect(am.activities[ACTIVITY_ID].panels[0].ref).toEqual(toolConfig.panelDefs[0])

            expect(am.activities[ACTIVITY_ID].panels[1].ref).toBeInstanceOf(Object);
            expect(am.activities[ACTIVITY_ID].panels[1].ref).toEqual(toolConfig.panelDefs[0]);
        })

        it("the activity files are fetched using FileHandler", () => {
            expect(am.fetchFile.calls.allArgs()).toEqual( [["file1.ext"],  ["file2.ext"] ]);
        })

    })
})
