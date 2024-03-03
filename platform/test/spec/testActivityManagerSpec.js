/*global describe, it, expect, spyOn --  functions provided by Jasmine */
import {ActivityManager} from "../../src/ActivityManager.js";

import { FileHandler } from "../../src/FileHandler.js";
import { ActivityConfigValidator } from "../../src/ActivityConfigValidator.js";
import { utility } from "../../src/Utility.js";



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
})
