/*global describe, it, expect, spyOn, beforeEach, afterEach, expectAsync --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */
/*global $ -- jquery is externally imported*/

export var TOKEN_SERVER_URL = "test://ts.url";
import {EducationPlatformApp} from "../../src/EducationPlatformApp.js";
import { ActionFunction } from "../../src/ActionFunction.js";
import { Panel } from "../../src/Panel.js";
import "jasmine-ajax";

describe("EducationPlatformApp", () => {

    describe("runAction()", () => {

        const PANEL_ID = "panel-1";
        const PANEL_CONTENTS = "panel-1's contents";
        const PANEL_TYPE = "type1";
        const BUTTON_ID = "button-1";
        const ACTION_FUNCTION_ID = "function-1";
        const PARAM_NAME = "param1";
        const PANEL_LANGUAGE = "lang";

        let platform;
        let invokeReturnedPromise;
        let resolvedActivity;
        let spyInvokeActionFunction;

        beforeEach(()=>{

            // Setup
            platform = new EducationPlatformApp();

            //    platform - panels
            const panel1 = new Panel(PANEL_ID);
            platform.panels = [ panel1 ];
            spyOn(panel1, "getValue").and.returnValue(PANEL_CONTENTS);
            spyOn(panel1, "getType").and.returnValue(PANEL_TYPE);
            
            //    activity manager
            resolvedActivity = {
                source: {
                    ref: {
                        buttons: [{id: BUTTON_ID, actionfunction: ACTION_FUNCTION_ID}, {id: "b2"}],
                        language: PANEL_LANGUAGE
                    }
                },
                parameters: {
                    [PARAM_NAME]: {
                        id: PANEL_ID,
                        file: PANEL_CONTENTS,
                    }
                }
            };
            let activityManagerSpy = jasmine.createSpyObj(['getActionForCurrentActivity','findPanel']);
            activityManagerSpy.getActionForCurrentActivity.and.returnValue(resolvedActivity);
            activityManagerSpy.findPanel.and.returnValue(panel1);

            platform.activityManager = activityManagerSpy;

            //    tools manager
            let toolsManagerSpy = jasmine.createSpyObj(['getActionFunction']);
            toolsManagerSpy.getActionFunction.and.returnValue(new ActionFunction({
                parameters: [
                    {name: "language", type: "text"}
                ]
            }));
            platform.toolsManager = toolsManagerSpy;
            
            //    platform - invoke action function
            invokeReturnedPromise = new Promise(function(resolve) {
                resolve(true);
            })
            spyInvokeActionFunction = spyOn(EducationPlatformApp.prototype, "invokeActionFunction").and.returnValue(invokeReturnedPromise);

            //    platform - handle response
            spyOn(EducationPlatformApp.prototype, "handleResponseActionFunction");

            //    platform - notifications
            spyOn(EducationPlatformApp.prototype, "longNotification");
            spyOn(EducationPlatformApp.prototype, "errorNotification");
        })

        it("populates the language parameter", () => {
            const expectedLanguageEntry = ["language", {type: "text", value: PANEL_LANGUAGE}];

            // Call the target object
            platform.runAction(PANEL_ID, BUTTON_ID);

            // Check the expected results
            expect(platform.invokeActionFunction).toHaveBeenCalledWith( 
                jasmine.anything(), jasmine.mapContaining( new Map([expectedLanguageEntry]) ) 
            );
        })
        
        it("calls invokeActionFunction with the action functions parameters and their values", () => {
            const expectedParamMap = new Map (
                [[PARAM_NAME, {type: PANEL_TYPE, value: PANEL_CONTENTS}],
                 ["language", {type: "text", value: PANEL_LANGUAGE }] ]
            )

            // Call the target object
            platform.runAction(PANEL_ID, BUTTON_ID);

            // Check the expected results
            expect(platform.invokeActionFunction).toHaveBeenCalledWith(ACTION_FUNCTION_ID, expectedParamMap);
        })

        it("calls handleResponseActionFunction with the current action and the invoked function's result promise", () => {
            // Call the target object
            platform.runAction(PANEL_ID, BUTTON_ID);
    
            // Check the expected results
            expect(platform.handleResponseActionFunction).toHaveBeenCalledWith(resolvedActivity, invokeReturnedPromise);
        })

        it("provides a notification indicating functions are executing", () => {
            // Call the target object
            platform.runAction(PANEL_ID, BUTTON_ID);
    
            // Check the expected results
            expect(platform.longNotification).toHaveBeenCalledWith(jasmine.stringMatching('(E|e)xecuting'));
            expect(platform.errorNotification).not.toHaveBeenCalled();
        })

        it("provides an error notification on unsuccessful function invocation result", async () => {
            const invokeReturnedPromiseError = new Promise(function(resolve, reject) {
                reject(new TypeError("test type error"));
            })
            spyInvokeActionFunction.and.returnValue(invokeReturnedPromiseError);

            // Call the target object
            await platform.runAction(PANEL_ID, BUTTON_ID);
    
            // Check the expected results
            expect(platform.errorNotification).toHaveBeenCalledWith(jasmine.stringMatching('error.*translating.*types'));
        })
    })


    describe("convert()", () => { 
        let platform;
        let findConversionSpy;

        const FILE_CONTENTS = "Test file contents.";
        const SOURCE_TYPE = "test-source-type";
        const TARGET_TYPE = "test-target-type";
        const PARAM_NAME = "test";
        const callConversionReturn = new Promise(function(resolve) {
            resolve(true);
        })

        const CONVERSION_FUNCTION_ID = "conversion-function-id";

        beforeEach(()=>{ 
            // Setup    
            findConversionSpy = spyOn( EducationPlatformApp.prototype, "functionRegistry_find").
            and.returnValue(CONVERSION_FUNCTION_ID);

            spyOn( EducationPlatformApp.prototype, "functionRegistry_callConversion").and.returnValue(
                callConversionReturn);

            spyOn( EducationPlatformApp.prototype, "errorNotification");

            platform = new EducationPlatformApp();

        })

        it("calls functionRegistry_callConversion on a conversion function being available", ()=>{ 
            // Call the target object
            platform.convert(FILE_CONTENTS, SOURCE_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(platform.functionRegistry_callConversion).toHaveBeenCalledWith(
                CONVERSION_FUNCTION_ID, { [SOURCE_TYPE]: FILE_CONTENTS } , PARAM_NAME
            );

            expect(platform.errorNotification).not.toHaveBeenCalled();
        })

        it("returns a promise on a conversion function being available", ()=> {
            // Call the target object
            const convertResult = platform.convert(FILE_CONTENTS, SOURCE_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(convertResult).toEqual(callConversionReturn);
        })

        it("returns null and provides an error notification on a conversion function not being available", ()=> { 
            findConversionSpy.and.returnValue(null);

            // Call the target object
            const convertResult = platform.convert(FILE_CONTENTS, SOURCE_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(convertResult).toEqual(null);
            expect(platform.errorNotification).toHaveBeenCalledWith(jasmine.stringMatching("(N|n)o conversion function"))
        })

    })

    describe("convertIncludingMetamodel()", () => { 
        let platform;
        let findConversionSpy;

        const FILE_CONTENTS = "Test file contents.";
        const SOURCE_TYPE = "test-source-type";
        const TARGET_TYPE = "test-target-type";
        const MM_FILE_CONTENTS = "Test metamodel file contents."
        const MM_TYPE = "test-metamodel-type";
        const PARAM_NAME = "test";
        const callConversionReturn = new Promise(function(resolve) {
            resolve(true);
        })

        const CONVERSION_FUNCTION_ID = "conversion-function-id";

        beforeEach(()=>{ 
            // Setup    
            findConversionSpy = spyOn( EducationPlatformApp.prototype, "functionRegistry_findPartial").
            and.returnValue([CONVERSION_FUNCTION_ID]);

            spyOn( EducationPlatformApp.prototype, "functionRegistry_callConversion").and.returnValue(
                callConversionReturn);

            spyOn( EducationPlatformApp.prototype, "errorNotification");

            platform = new EducationPlatformApp();

            //    platform - toolsManager
            let toolsManagerSpy =  jasmine.createSpyObj(['getActionFunction']);
            toolsManagerSpy.getActionFunction.and.returnValue(new ActionFunction({
                parameters: [
                    {name: "input", type: SOURCE_TYPE, instanceOf: "metamodel"},
                    {name: "metamodel", type: MM_TYPE}
                ]
            }));
            platform.toolsManager= toolsManagerSpy;

        })

        it("calls functionRegistry_callConversion on a conversion function being available", async ()=> { 
            // Call the target object
            await platform.convertIncludingMetamodel(FILE_CONTENTS, SOURCE_TYPE, MM_FILE_CONTENTS, MM_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(platform.functionRegistry_callConversion).toHaveBeenCalledWith(
                CONVERSION_FUNCTION_ID, {[SOURCE_TYPE]: FILE_CONTENTS, [MM_TYPE]: MM_FILE_CONTENTS } , PARAM_NAME
            );

            expect(platform.errorNotification).not.toHaveBeenCalled();
        })

        it("returns a promise on a conversion function being available", async () => {
            // Call the target object
            const convertResult = platform.convertIncludingMetamodel(FILE_CONTENTS, SOURCE_TYPE, MM_FILE_CONTENTS, MM_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            await expectAsync(convertResult).toBePending();
        })

        it("returns null and provides an error notification on a conversion function not being available", async () => { 
            findConversionSpy.and.returnValue(null);

            // Call the target object
            const convertResult = await platform.convertIncludingMetamodel(FILE_CONTENTS, SOURCE_TYPE, MM_FILE_CONTENTS, MM_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(convertResult).toEqual(null);
            expect(platform.errorNotification).toHaveBeenCalledWith(jasmine.stringMatching("(N|n)o conversion function"))
        })

    })


    describe("notification()", () => {
        let platform;

        const NOTIFICATION_TITLE = "ABC123";
        const NOTIFICATION_MESSAGE = "DEF456";

        beforeEach(()=>{
            // Setup
            platform = new EducationPlatformApp();
            
        })

        it("displays a message with given title and text", () => {
        
            // Call the target object
            platform.notification(NOTIFICATION_TITLE, NOTIFICATION_MESSAGE);
    
            // Check the expected results
            const documentMessages = $(".notify-message");

            expect(documentMessages).toHaveSize(1);

            expect(documentMessages.text()).toContain(NOTIFICATION_TITLE);
            expect(documentMessages.text()).toContain(NOTIFICATION_MESSAGE);
        })

        afterEach( () => {
            $(".notify-message").remove();
        })
    })

    describe("longNotification()", () => {
        
        const NOTIFICATION_TEXT = "ABC123";
        const NOTIFICATION_MESSAGE = "may take a few seconds to complete";

        it("calls notification() with the given text", () => {
            // Setup
            spyOn(EducationPlatformApp.prototype, "notification");
            const platform = new EducationPlatformApp();

            // Call the target object
            platform.longNotification(NOTIFICATION_TEXT);
    
            // Check the expected results
            expect(platform.notification).toHaveBeenCalledWith(jasmine.stringMatching(NOTIFICATION_TEXT), jasmine.stringMatching(NOTIFICATION_MESSAGE), jasmine.anything());
        })
    })

    describe("successNotification()", () => {
        
        const NOTIFICATION_TEXT = "ABC123";
        const NOTIFICATION_TITLE = "Success";

        it("calls notification with the given text", () => {
            // Setup
            spyOn(EducationPlatformApp.prototype, "notification");
            const platform = new EducationPlatformApp();

            // Call the target object
            platform.successNotification(NOTIFICATION_TEXT);
    
            // Check the expected results
            expect(platform.notification).toHaveBeenCalledWith(jasmine.stringMatching(NOTIFICATION_TITLE), jasmine.stringMatching(NOTIFICATION_TEXT), jasmine.anything());
        })
    })

    describe("errorNotification()", () => {
        
        const NOTIFICATION_TEXT = "ABC123";
        const NOTIFICATION_TITLE = "Error";

        it("calls notification with the given text", () => {
            // Setup
            spyOn(EducationPlatformApp.prototype, "notification");
            const platform = new EducationPlatformApp();

            // Call the target object
            platform.errorNotification(NOTIFICATION_TEXT);
    
            // Check the expected results
            expect(platform.notification).toHaveBeenCalledWith(jasmine.stringMatching(NOTIFICATION_TITLE), jasmine.stringMatching(NOTIFICATION_TEXT), jasmine.anything());
        })
    })

})