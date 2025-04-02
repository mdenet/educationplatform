/*global describe, it, expect, spyOn, beforeEach, expectAsync --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */

export var TOKEN_SERVER_URL = "test://ts.url";
import {EducationPlatformApp} from "../../src/EducationPlatformApp.js";
import { ActionFunction } from "../../src/ActionFunction.js";
import { Panel } from "../../src/Panel.js";
import { ErrorHandler } from "../../src/ErrorHandler.js";
import "jasmine-ajax";
import { PlaygroundUtility } from "../../src/PlaygroundUtility.js";
import { createVariousPanels } from "../resources/TestPanels.js";

describe("EducationPlatformApp", () => {
    let platform;

    beforeEach(() => {
        platform = new EducationPlatformApp();
    });

    describe("runAction()", () => {

        const PANEL_ID = "panel-1";
        const PANEL_CONTENTS = "panel-1's contents";
        const PANEL_TYPE = "type1";
        const BUTTON_ID = "button-1";
        const ACTION_FUNCTION_ID = "function-1";
        const PARAM_NAME = "param1";
        const PANEL_LANGUAGE = "lang";

        let activityManagerSpy;
        let invokeReturnedPromise;
        let resolvedActivity;

        beforeEach(()=>{

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
            spyOn(PlaygroundUtility, "longNotification");
            spyOn(PlaygroundUtility, "errorNotification");
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
            expect(PlaygroundUtility.longNotification).toHaveBeenCalledWith(jasmine.stringMatching('(E|e)xecuting'));
            expect(PlaygroundUtility.errorNotification).not.toHaveBeenCalled();
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

        beforeEach(()=>{
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

    describe("getSaveablePanels()", () => {
        let panels;
    
        beforeEach(() => {
            panels = createVariousPanels();
        });
    
        it("returns only SaveablePanels from a flat list of panels", () => {
            const flatPanels = [
                panels.blank,
                panels.console,
                panels.output,
                panels.test,
                panels.xtext,
                panels.saveableClean,
                panels.programClean
            ];
    
            const result = platform.getSaveablePanels(flatPanels);
    
            expect(result).toContain(panels.saveableClean);
            expect(result).toContain(panels.programClean);
            expect(result).toContain(panels.xtext);
            expect(result).not.toContain(panels.blank);
            expect(result).not.toContain(panels.console);
            expect(result).not.toContain(panels.output);
            expect(result).not.toContain(panels.test);
        });
    
        it("collects SaveablePanels from a CompositePanel with flat children", () => {
            const result = platform.getSaveablePanels([panels.compositeFlat]);
            expect(result).toEqual(jasmine.arrayContaining([
                panels.saveableClean,
                panels.programClean
            ]));
        });
    
        it("collects SaveablePanels from a CompositePanel with nested composite children", () => {
            const result = platform.getSaveablePanels([panels.compositeNested]);
            expect(result).toEqual(jasmine.arrayContaining([
                panels.saveableDirty,
                panels.programDirty
            ]));
        });
    
        it("handles a mix of standalone and composite panels", () => {
            const result = platform.getSaveablePanels([
                panels.saveableClean,
                panels.compositeNested,
                panels.blank
            ]);
    
            expect(result).toEqual(jasmine.arrayContaining([
                panels.saveableClean,
                panels.saveableDirty,
                panels.programDirty
            ]));
            expect(result).not.toContain(panels.blank);
        });
    });

    describe("getPanelsWithChanges()", () => {
        let panels;
    
        beforeEach(() => {
            panels = createVariousPanels();
            platform.saveablePanels = [
                panels.saveableClean,
                panels.saveableDirty,
                panels.programClean,
                panels.programDirty
            ];
        });
    
        it("returns only panels with unsaved changes", () => {
            const result = platform.getPanelsWithChanges();
    
            expect(result).toContain(panels.saveableDirty);
            expect(result).toContain(panels.programDirty);
            expect(result).not.toContain(panels.saveableClean);
            expect(result).not.toContain(panels.programClean);
        });
    
        it("returns an empty array when all panels are clean", () => {
            platform.saveablePanels = [
                panels.saveableClean,
                panels.programClean
            ];
            const result = platform.getPanelsWithChanges();
            expect(result).toEqual([]);
        });
    
        it("returns all panels when all are dirty", () => {
            platform.saveablePanels = [
                panels.saveableDirty,
                panels.programDirty
            ];
            const result = platform.getPanelsWithChanges();
            expect(result).toEqual(jasmine.arrayContaining([
                panels.saveableDirty,
                panels.programDirty
            ]));
        });
    });
})