/*global describe, it, expect, spyOn, beforeEach, afterEach, expectAsync --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */
/*global $ -- jquery is externally imported*/

export var TOKEN_SERVER_URL = "test://ts.url";
import {EducationPlatformApp} from "../../src/EducationPlatformApp.js";
import { ActionFunction } from "../../src/ActionFunction.js";
import { Panel } from "../../src/Panel.js";
import { ErrorHandler } from "../../src/ErrorHandler.js";
import "jasmine-ajax";
import { EducationPlatformError } from "../../src/EducationPlatformError.js";

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
        let activityManagerSpy;
        let invokeReturnedPromise;
        let resolvedActivity;

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
            activityManagerSpy = jasmine.createSpyObj(['getActionForCurrentActivity','findPanel']);
            activityManagerSpy.getActionForCurrentActivity.and.returnValue(resolvedActivity);
            activityManagerSpy.findPanel.and.returnValue(panel1);

            platform.activityManager = activityManagerSpy;

            //    tools manager
            let toolsManagerSpy = jasmine.createSpyObj(['getActionFunction', 'invokeActionFunction']);
            toolsManagerSpy.getActionFunction.and.returnValue(new ActionFunction({
                parameters: [
                    {name: "language", type: "text"}
                ]
            }));

            invokeReturnedPromise = new Promise(function(resolve) {
                resolve(true);
            })
            toolsManagerSpy.invokeActionFunction.and.returnValue(invokeReturnedPromise);
            
            platform.toolsManager = toolsManagerSpy;
            
            //    platform - handle response
            spyOn(EducationPlatformApp.prototype, "handleResponseActionFunction");

            //    platform - notifications
            spyOn(EducationPlatformApp.prototype, "longNotification");
            spyOn(EducationPlatformApp.prototype, "errorNotification");
            spyOn(ErrorHandler.prototype, "notify");
        })

        it("populates the language parameter", () => {
            const expectedLanguageEntry = ["language", {type: "text", value: PANEL_LANGUAGE}];

            // Call the target object
            platform.runAction(PANEL_ID, BUTTON_ID);

            // Check the expected results
            expect(platform.toolsManager.invokeActionFunction).toHaveBeenCalledWith( 
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
            expect(platform.toolsManager.invokeActionFunction).toHaveBeenCalledWith(ACTION_FUNCTION_ID, expectedParamMap);
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

        it("raises an error when an action does not exist for a given panel using ErrorHandler notify", () => {
            const INVALID_BUTTON_ID = "X";
            activityManagerSpy.getActionForCurrentActivity.and.returnValue(null);

            // Call the target object
            platform.runAction(PANEL_ID, INVALID_BUTTON_ID);

            // Check the expected results
            const expectedError = jasmine.objectContaining({ 
                message: jasmine.stringMatching(`(C|c)annot.*find.*action.*${PANEL_ID}.*${INVALID_BUTTON_ID}`)
            });

            expect(platform.errorHandler.notify).toHaveBeenCalledWith(jasmine.stringMatching('(F|f)ailed.*invoke.*action'), expectedError);
        })
    })


    describe("handleResponseActionFunction()", () => {
        let platform;

        beforeEach(()=>{
            // Setup
            platform = new EducationPlatformApp();

            //    platform - notifications
            spyOn(ErrorHandler.prototype, "notify");
        })

        it("provides an error notification on unsuccessful function invocation result", async () => {
            const invokeReturnedPromiseError = new Promise(function(resolve, reject) {
                reject(new TypeError("test type error"));
            })

            window.onerror = () => {}; /* Disable notifications for unknown errors so that the uncaught exceptions 
                                          that this test triggers do not cause random failures */

            // Call the target object
            platform.handleResponseActionFunction({}, invokeReturnedPromiseError);
    
            // Check the expected results
            await expectAsync(invokeReturnedPromiseError).toBeRejected().then( () => {
                expect(platform.errorHandler.notify).toHaveBeenCalledWith(jasmine.stringMatching('error.*translating.*types'), jasmine.any(Error));
            })
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