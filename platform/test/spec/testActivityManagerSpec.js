/*global describe, it, expect, spyOn, beforeEach, fail --  functions provided by Jasmine */
import {ActivityManager} from "../../src/ActivityManager.js";

import { FileHandler } from "../../src/FileHandler.js";
import { ActivityConfigValidator } from "../../src/ActivityConfigValidator.js";
import { utility } from "../../src/Utility.js";
import { ACTIVITY_2PANELS_1ACTION } from "../resources/TestActivityFiles.js"
import { configObjectEquals, configToString } from "../resources/TestUtility.js"


describe("ActivityManager", () => {

    it("can be created", () => {
        // Setup
        const fileh = new FileHandler("test://th.url") 
        const refPanelDef = () => {};
            
        // Call the target object
        var am = new ActivityManager(refPanelDef , fileh);

        // Check the expected results
        expect(am).toBeInstanceOf(ActivityManager);
    })

    it("constructor -  initialises the configValidator property", () => {
        // Setup
        const fileh = new FileHandler("test://th.url") 
        const refPanelDef = () => {};

        // Call the target object
        var am = new ActivityManager(refPanelDef , fileh);

        // Check the expected results
        expect(am.configValidator).toBeInstanceOf(ActivityConfigValidator);
    })        

    it("constructor -  initialises the accessPanelDef property using param panelDefAccessor", () => {
        // Setup
        const fileh = new FileHandler("test://th.url") 
        const refPanelDef = () => {};

        // Call the target object
        var am = new ActivityManager(refPanelDef , fileh);

        // Check the expected results
        expect(am.accessPanelDef).toBe(refPanelDef);
    })  

    it("constructor -  initialises the fileHandler property  using param fileHandler", () => {
        // Setup
        const fileh = new FileHandler("test://th.url") 
        const refPanelDef = () => {};

        // Call the target object
        var am = new ActivityManager(refPanelDef , fileh);

        // Check the expected results
        expect(am.fileHandler).toBe(fileh);
    })  

    it("constructor -  uses the query string to set the activitiesUrl property", () => {
        // Setup
        const ACTIVITY_URL="test://a.url";
        const QUERY = "?activities=" + ACTIVITY_URL;
        const fileh = new FileHandler("test://th.url") 
        const refPanelDef = () => {};

        spyOn( utility, "getWindowLocationSearch").and.returnValue(QUERY);

        // Call the target object
        var am = new ActivityManager(refPanelDef , fileh);

        // Check the expected results
        expect(utility.getWindowLocationSearch).toHaveBeenCalled();
        expect(am.activitiesUrl).toBe(ACTIVITY_URL);
    })

    it ("constructor -  if the current activity is provided in the url query string, set the activityId property", () => {
        // Setup
        const ACTIVITY_URL="test://a.url";
        const ACTIVITY_ID="a1"
        const QUERY = "?"+ ACTIVITY_ID + "=&" + "activities=" + ACTIVITY_URL;
        const fileh = new FileHandler("test://th.url") 
        const refPanelDef = () => {};

        spyOn( utility, "getWindowLocationSearch").and.returnValue(QUERY);

        // Call the target object
        var am = new ActivityManager(refPanelDef , fileh);

        // Check the expected results
        expect(am.activityId).toBe(ACTIVITY_ID);
    })

    it("initializeActivities - causes the activity file to be fetched from its URL using the fileHandler", () => {
        // Setup
        const ACTIVITY_URL="test://a.url";
        const QUERY="?activities=" + ACTIVITY_URL;
        const fileh = new FileHandler(ACTIVITY_URL) 
        const refPanelDef = () => {};

        spyOn( utility, "getWindowLocationSearch").and.returnValue(QUERY);
        spyOn(FileHandler.prototype, "fetchFile").and.returnValue({ content: {} });
        
        // Call the target object
        var am = new ActivityManager(refPanelDef , fileh);
        am.initializeActivities();

        // Check the expected results
        expect(FileHandler.prototype.fetchFile).toHaveBeenCalledWith(ACTIVITY_URL, false);
    } )

    it("initializeActivities - Resolves references for a valid activity by  calling resolveActionReferences with activity id", ()=> {
        // Setup
        const fileh = new FileHandler("test://th.url") 
        const refPanelDef = () => {};
        const ACTIVITY_ID = "a1";
        const activityObject = {
            a1: {id: ACTIVITY_ID}
        };

        //spyOn( utility, "getWindowLocationSearch").and.returnValue(QUERY);
        spyOn( ActivityManager.prototype, "fetchActivities").and.returnValue([]);
        spyOn( ActivityManager.prototype, "resolveActionReferences");

        // Call the target object
        var am = new ActivityManager(refPanelDef , fileh);
        am.activities = activityObject;
        am.initializeActivities();

        // Check the expected results
        expect(am.resolveActionReferences).toHaveBeenCalledWith(ACTIVITY_ID);
    })
    

    describe("activity initialisation", () => {
        let fileh;
        let refPanelDef;
        let am;
        const activityFile = ACTIVITY_2PANELS_1ACTION;

        beforeEach( () => {
            // Setup
            fileh = new FileHandler("test://th.url"); 
            refPanelDef = () => {};
                
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

        it("the activities property's value object has required keys", () => {
            const EXPECTED_KEYS = ["actions", "icon", "id", "layout", "panels", "title", "tools"];
  
            const activityObject = am.activities[ACTIVITY_ID];
            let parsedActivityKeys = Object.keys(activityObject);

            expect(parsedActivityKeys).toHaveSize(EXPECTED_KEYS.length)
            for(const k of EXPECTED_KEYS){
                if ( !parsedActivityKeys.find( (n) => (n == k) ) ){
                    fail("Expected key '" + k + "' not found in activity object.");
                }
            }
        }) 

        it("the activities property's value object action panels are resolved", () => {
            const expectedActivity = JSON.parse(activityFile).activities[0];
            const expectedPanelSource = expectedActivity.panels.find((p) => p.id===PANEL1_ID);
            const expectedPanelOutput = expectedActivity.panels.find((p) => p.id===PANEL2_ID);
            
            const action = am.activities[ACTIVITY_ID].actions[0];
            
            if (!configObjectEquals( action.source, expectedPanelSource )) {
                fail("Expected action's source panel'" + configToString(action.source) + "' to equal'" + configToString(expectedPanelSource) + "'");
            }

            if (!configObjectEquals( action.output, expectedPanelOutput )){
                fail("Expected action's source panel'" + configToString(action.output) + "' to equal'" + configToString(expectedPanelOutput) + "'" );
            }
        })
    })
})
