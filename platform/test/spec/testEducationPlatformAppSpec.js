/*global describe, it, expect, spyOn, beforeEach, expectAsync --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */

export var TOKEN_SERVER_URL = "test://ts.url";
import {EducationPlatformApp} from "../../src/EducationPlatformApp.js";
import { ActionFunction } from "../../src/ActionFunction.js";
import { Panel } from "../../src/Panel.js";
import { ErrorHandler } from "../../src/ErrorHandler.js";
import { PlaygroundUtility } from "../../src/PlaygroundUtility.js";
import { createVariousPanels, createSaveablePanel } from "../resources/TestPanels.js";
import { DEFAULT_COMMIT_MESSAGE } from "../../src/EducationPlatformApp.js";
import { utility } from "../../src/Utility.js";

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

    describe("changesHaveBeenMade()", () => {
        let panels;
    
        beforeEach(() => {
            panels = createVariousPanels();
        });
    
        it("returns true if any saveable panel has unsaved changes", () => {
            platform.saveablePanels = [
                panels.saveableClean,
                panels.saveableDirty, // dirty
                panels.programClean
            ];
            expect(platform.changesHaveBeenMade()).toBeTrue();
        });
    
        it("returns false if all panels are clean", () => {
            platform.saveablePanels = [
                panels.saveableClean,
                panels.programClean
            ];
            expect(platform.changesHaveBeenMade()).toBeFalse();
        });
    
        it("returns true if multiple panels have changes", () => {
            platform.saveablePanels = [
                panels.saveableDirty,
                panels.programDirty
            ];
            expect(platform.changesHaveBeenMade()).toBeTrue();
        });
    
        it("returns false if saveablePanels is empty", () => {
            platform.saveablePanels = [];
            expect(platform.changesHaveBeenMade()).toBeFalse();
        });
    });

    describe("isLocalEnvironmentOutdated()", () => {
        let panels;
    
        beforeEach(() => {
            panels = createVariousPanels();
    
            platform.fileHandler = {
                fetchFile: jasmine.createSpy("fetchFile")
            };
    
            // Set up mock file URLs and SHAs for dirty panels
            panels.saveableDirty.getFileUrl = () => "file1";
            panels.saveableDirty.getValueSha = () => "localSha1";
    
            panels.programDirty.getFileUrl = () => "file2";
            panels.programDirty.getValueSha = () => "localSha2";
    
            platform.saveablePanels = [panels.saveableDirty, panels.programDirty];
    
            // getPanelsWithChanges returns both dirty panels
            platform.getPanelsWithChanges = () => platform.saveablePanels;
        });
    
        it("returns true if at least one panel has a different remote SHA", async () => {
            platform.fileHandler.fetchFile.withArgs("file1", false).and.resolveTo({ sha: "remoteShaDifferent" });
            platform.fileHandler.fetchFile.withArgs("file2", false).and.resolveTo({ sha: "localSha2" });
    
            const result = await platform.isLocalEnvironmentOutdated();
            expect(result).toBeTrue();
        });
    
        it("returns false if all remote SHAs match local SHAs", async () => {
            platform.fileHandler.fetchFile.withArgs("file1", false).and.resolveTo({ sha: "localSha1" });
            platform.fileHandler.fetchFile.withArgs("file2", false).and.resolveTo({ sha: "localSha2" });
    
            const result = await platform.isLocalEnvironmentOutdated();
            expect(result).toBeFalse();
        });
    
        it("throws an error if fetchFile returns null", async () => {
            platform.fileHandler.fetchFile.withArgs("file1", false).and.resolveTo(null);
    
            platform.saveablePanels = [panels.saveableDirty];
            platform.getPanelsWithChanges = () => platform.saveablePanels;
    
            await expectAsync(platform.isLocalEnvironmentOutdated()).toBeRejectedWithError(/No remote file found/);
        });

        it("throws an error if fetchFile returns undefined", async () => {
            platform.fileHandler.fetchFile.withArgs("file1", false).and.resolveTo(undefined);
    
            platform.saveablePanels = [panels.saveableDirty];
            platform.getPanelsWithChanges = () => platform.saveablePanels;
    
            await expectAsync(platform.isLocalEnvironmentOutdated()).toBeRejectedWithError(/No remote file found/);
        });
    });

    describe("getCommitMessage()", () => {
    
        beforeEach(() => {
            spyOn(window, "prompt");
        });
    
        it("returns the user's input when a non-empty message is entered", () => {
            window.prompt.and.returnValue("My commit message");
            const result = platform.getCommitMessage();
            expect(result).toBe("My commit message");
        });
    
        it("returns null if user cancels the prompt", () => {
            window.prompt.and.returnValue(null);
            const result = platform.getCommitMessage();
            expect(result).toBeNull();
        });
    
        it("returns the default message if input is empty", () => {
            window.prompt.and.returnValue("");
            const result = platform.getCommitMessage();
            expect(result).toBe(DEFAULT_COMMIT_MESSAGE);
        });
    
        it("returns the default message if input is just whitespace", () => {
            window.prompt.and.returnValue("     ");
            const result = platform.getCommitMessage();
            expect(result).toBe(DEFAULT_COMMIT_MESSAGE);
        });
    });
    
    describe("refreshBranches()", () => {
        beforeEach(() => {
            platform.activityURL = "https://activity.example.com";
            platform.fileHandler = {
                fetchBranches: jasmine.createSpy("fetchBranches")
            };
        });
    
        it("fetches branches and sets them on the instance", async () => {
            const fakeBranches = ["fakeBranch1", "fakeBranch2"];
            platform.fileHandler.fetchBranches.and.resolveTo(fakeBranches);
    
            await platform.refreshBranches();
    
            expect(platform.fileHandler.fetchBranches).toHaveBeenCalledWith(platform.activityURL);
            expect(platform.branches).toEqual(fakeBranches);
        });
    
        it("logs an error if fetchBranches fails", async () => {
            const error = new Error("network error");
            platform.fileHandler.fetchBranches.and.rejectWith(error);
    
            spyOn(console, "error");
    
            await platform.refreshBranches();
    
            expect(console.error).toHaveBeenCalledWith("Error fetching branches:", error);
        });
    });

    describe("discardPanelChanges()", () => {
        let panels;
    
        beforeEach(() => {
            panels = createVariousPanels();
    
            // Spy on resetChanges for dirty panels
            spyOn(panels.saveableDirty, "resetChanges");
            spyOn(panels.programDirty, "resetChanges");
    
            // Also test that clean ones are called (they usually no-op)
            spyOn(panels.saveableClean, "resetChanges");
            spyOn(panels.programClean, "resetChanges");
    
            platform.saveablePanels = [
                panels.saveableClean,
                panels.saveableDirty,
                panels.programClean,
                panels.programDirty
            ];
        });
    
        it("calls resetChanges on all saveable panels", () => {
            platform.discardPanelChanges();
    
            expect(panels.saveableClean.resetChanges).toHaveBeenCalled();
            expect(panels.saveableDirty.resetChanges).toHaveBeenCalled();
            expect(panels.programClean.resetChanges).toHaveBeenCalled();
            expect(panels.programDirty.resetChanges).toHaveBeenCalled();
        });
    
        it("does nothing if saveablePanels is empty", () => {
            platform.saveablePanels = [];
            expect(() => platform.discardPanelChanges()).not.toThrow();
        });
    });

    describe("switchBranch()", () => {
        beforeEach(() => {
            platform.currentBranch = "main";
    
            spyOn(utility, "getWindowLocationHref").and.returnValue("https://example.com/activity/main/");
            spyOn(utility, "setWindowLocationHref");
        });
    
        it("updates the window location to the new branch in the URL", () => {
            platform.switchBranch("dev");
    
            expect(utility.getWindowLocationHref).toHaveBeenCalled();
            expect(utility.setWindowLocationHref).toHaveBeenCalledWith("https://example.com/activity/dev/");
        });
    
    });

    describe("showSaveConfirmation()", () => {
        let eventMock, saveText, closeBtn, cancelBtn, saveBtn;
    
        beforeEach(() => {
            // Add needed DOM elements
            saveText = document.createElement("div");
            saveText.id = "save-body-text";
            document.body.appendChild(saveText);
    
            closeBtn = document.createElement("button");
            closeBtn.id = "save-confirmation-close-button";
            document.body.appendChild(closeBtn);
    
            cancelBtn = document.createElement("button");
            cancelBtn.id = "cancel-save-btn";
            document.body.appendChild(cancelBtn);
    
            saveBtn = document.createElement("button");
            saveBtn.id = "confirm-save-btn";
            document.body.appendChild(saveBtn);
    
            eventMock = { preventDefault: jasmine.createSpy("preventDefault") };
    
            // Spies for internal methods
            spyOn(platform, "modalIsVisible").and.returnValue(false);
            spyOn(platform, "closeAllModalsExcept");
            spyOn(platform, "toggleSaveConfirmationVisibility");
            spyOn(platform, "toggleReviewChangesLink");
            spyOn(platform, "savePanelContents").and.resolveTo();
    
            // Default to dirty panels
            spyOn(platform, "changesHaveBeenMade").and.returnValue(true);
        });
    
        afterEach(() => {
            saveText.remove();
            closeBtn.remove();
            cancelBtn.remove();
            saveBtn.remove();
        });
    
        
        it("hides modal if already visible", async () => {
            platform.modalIsVisible.and.returnValue(true);
    
            await platform.showSaveConfirmation(eventMock);
    
            expect(platform.toggleSaveConfirmationVisibility).toHaveBeenCalledWith(false);
            expect(platform.closeAllModalsExcept).not.toHaveBeenCalled();
        });
    
        it("shows the correct message if changes exist", async () => {
            await platform.showSaveConfirmation(eventMock);
    
            expect(saveText.textContent).toBe("You can review your changes before saving:");
            expect(platform.toggleReviewChangesLink).toHaveBeenCalledWith(true);
            expect(platform.toggleSaveConfirmationVisibility).toHaveBeenCalledWith(true);
        });
    
        it("shows the correct message if no changes exist", async () => {
            platform.changesHaveBeenMade.and.returnValue(false);
    
            await platform.showSaveConfirmation(eventMock);
    
            expect(saveText.textContent).toBe("There are no changes to be saved.");
            expect(platform.toggleReviewChangesLink).toHaveBeenCalledWith(false);
        });
    
        it("closes modal when close or cancel button is clicked", async () => {
            await platform.showSaveConfirmation(eventMock);
    
            closeBtn.click();
            expect(platform.toggleSaveConfirmationVisibility).toHaveBeenCalledWith(false);
    
            cancelBtn.click();
            expect(platform.toggleSaveConfirmationVisibility).toHaveBeenCalledWith(false);
        });
    
        it("calls savePanelContents and hides modal on save", async () => {
            await platform.showSaveConfirmation(eventMock);
    
            await saveBtn.onclick(); // manually trigger async save click
    
            expect(platform.savePanelContents).toHaveBeenCalled();
            expect(platform.toggleSaveConfirmationVisibility).toHaveBeenCalledWith(false);
        });
    });

    describe("savePanelContents()", () => {
        beforeEach(() => {
            spyOn(platform, "changesHaveBeenMade");
            spyOn(platform, "isLocalEnvironmentOutdated").and.resolveTo(false);
            spyOn(platform, "getCommitMessage").and.returnValue("Commit message");
            spyOn(platform, "saveFiles").and.returnValue(Promise.resolve());
            spyOn(PlaygroundUtility, "warningNotification");
            spyOn(PlaygroundUtility, "successNotification");
            platform.errorHandler = {
                notify: jasmine.createSpy("notify")
            };
        });
    
        it("shows a warning if no changes have been made", async () => {
            platform.changesHaveBeenMade.and.returnValue(false);
    
            await platform.savePanelContents();
    
            expect(PlaygroundUtility.warningNotification).toHaveBeenCalledWith("There are no panels to save.");
            expect(platform.saveFiles).not.toHaveBeenCalled();
        });
    
        it("shows a warning if environment is outdated", async () => {
            platform.changesHaveBeenMade.and.returnValue(true);
            platform.isLocalEnvironmentOutdated.and.resolveTo(true);
    
            await platform.savePanelContents();
    
            expect(PlaygroundUtility.warningNotification).toHaveBeenCalledWith(
                "The changes made to the panels are outdated - please save your work to a new branch."
            );
            expect(platform.saveFiles).not.toHaveBeenCalled();
        });
    
        it("does not proceed if user cancels the commit prompt", async () => {
            platform.changesHaveBeenMade.and.returnValue(true);
            platform.getCommitMessage.and.returnValue(null);
    
            await platform.savePanelContents();
    
            expect(platform.saveFiles).not.toHaveBeenCalled();
        });
    
        it("saves files if changes are made, environment is not outdated, and user provides a message", async () => {
            platform.changesHaveBeenMade.and.returnValue(true);
    
            await platform.savePanelContents();
    
            expect(platform.saveFiles).toHaveBeenCalledWith("Commit message");
            expect(PlaygroundUtility.successNotification).toHaveBeenCalledWith(
                "The activity panel contents have been saved."
            );
        });
    
        it("shows an error if saving fails", async () => {
            const error = new Error("Save failed");
            platform.saveFiles.and.returnValue(Promise.reject(error));
    
            platform.changesHaveBeenMade.and.returnValue(true);
    
            await new Promise(resolve => {
                platform.savePanelContents().then(resolve).catch(resolve);
            });
        
    
            expect(platform.errorHandler.notify).toHaveBeenCalledWith(
                "An error occurred while trying to save the panel contents."
            );
        });
    });

    describe("saveFiles()", () => {
        let panels, saveable1, saveable2;
    
        beforeEach(() => {
            panels = createVariousPanels();
            saveable1 = panels.saveableDirty;
            saveable2 = panels.programDirty;
    
            // Force getFilePath to return matching strings for the mocked response
            saveable1.getFilePath = () => "file1";
            saveable2.getFilePath = () => "file2";
    
            // Mock export data
            spyOn(saveable1, "exportSaveData").and.returnValue({ path: "file1", content: "..." });
            spyOn(saveable2, "exportSaveData").and.returnValue({ path: "file2", content: "..." });
    
            // Mock value getters for lastSavedContent update
            spyOn(saveable1, "getValue").and.returnValue("changed");
            spyOn(saveable2, "getValue").and.returnValue("changed");
    
            // Spy on valueSha and content setters
            spyOn(saveable1, "setValueSha");
            spyOn(saveable2, "setValueSha");
            spyOn(saveable1, "setLastSavedContent");
            spyOn(saveable2, "setLastSavedContent");
    
            // Setup platform
            platform.activityURL = "https://activity.example.com";
            platform.fileHandler = {
                storeFiles: jasmine.createSpy("storeFiles")
            };
            platform.getPanelsWithChanges = () => [saveable1, saveable2];
        });
    
        it("saves files and updates SHAs and content for each panel", async () => {
            platform.fileHandler.storeFiles.and.resolveTo(JSON.stringify({
                files: [
                    { path: "file1", sha: "newSha1" },
                    { path: "file2", sha: "newSha2" }
                ]
            }));
    
            await platform.saveFiles("Update commit");
    
            expect(platform.fileHandler.storeFiles).toHaveBeenCalledWith(
                platform.activityURL,
                [
                    { path: "file1", content: "..." },
                    { path: "file2", content: "..." }
                ],
                "Update commit",
                undefined // No overrideBranch provided
            );
    
            expect(saveable1.setValueSha).toHaveBeenCalledWith("newSha1");
            expect(saveable2.setValueSha).toHaveBeenCalledWith("newSha2");
    
            expect(saveable1.setLastSavedContent).toHaveBeenCalledWith("changed");
            expect(saveable2.setLastSavedContent).toHaveBeenCalledWith("changed");
    
            expect(saveable1.getEditor().session.getUndoManager().markClean).toHaveBeenCalled();
            expect(saveable2.getEditor().session.getUndoManager().markClean).toHaveBeenCalled();
        });
    
        it("skips panel updates if overrideBranch is passed", async () => {
            platform.fileHandler.storeFiles.and.resolveTo("{}");

            const overrideBranch = "new-branch";
    
            await platform.saveFiles("Commit message", overrideBranch);
    
            expect(saveable1.setValueSha).not.toHaveBeenCalled();
            expect(saveable2.setValueSha).not.toHaveBeenCalled();
    
            expect(saveable1.setLastSavedContent).not.toHaveBeenCalled();
            expect(saveable2.setLastSavedContent).not.toHaveBeenCalled();
    
            expect(saveable1.getEditor().session.getUndoManager().markClean).not.toHaveBeenCalled();
            expect(saveable2.getEditor().session.getUndoManager().markClean).not.toHaveBeenCalled();
        });
    
        it("rejects the promise if storeFiles fails", async () => {
            const error = new Error("store failed");
            platform.fileHandler.storeFiles.and.rejectWith(error);
    
            await expectAsync(platform.saveFiles("Failing commit")).toBeRejectedWith(error);
        });
    });
    
    describe("reviewChanges()", () => {
        let panels;
        let event;
    
        beforeEach(() => {
            panels = createVariousPanels();
            event = { preventDefault: jasmine.createSpy("preventDefault") };
    
            platform.getPanelsWithChanges = () => [panels.saveableDirty, panels.programDirty];
            platform.changesHaveBeenMade = () => true;
    
            spyOn(platform, "modalIsVisible").and.returnValue(false);
            spyOn(platform, "toggleReviewChangesVisibility");
            spyOn(platform, "closeAllModalsExcept");
            spyOn(platform, "discardPanelChanges");
            spyOn(platform, "displayChangesForPanel");
    
            document.body.innerHTML = `
                <div id="review-changes-container"></div>
                <div id="review-changes-close-button"></div>
                <div id="discard-changes-btn"></div>
                <div id="changed-panels-list"></div>
                <div id="changed-panels-title"></div>
                <div id="discard-changes-footer" style="display:none"></div>
            `;
        });
    
        it("toggles modal off if already visible", async () => {
            platform.modalIsVisible.and.returnValue(true);
    
            await platform.reviewChanges(event);
    
            expect(event.preventDefault).toHaveBeenCalled();
            expect(platform.toggleReviewChangesVisibility).toHaveBeenCalledWith(false);
        });
    
        it("renders changed panels and sets up close and discard buttons", async () => {
            await platform.reviewChanges(event);
    
            expect(platform.closeAllModalsExcept).toHaveBeenCalledWith("review-changes-container");
            expect(platform.toggleReviewChangesVisibility).toHaveBeenCalledWith(true);
    
            const titleText = document.getElementById("changed-panels-title").textContent;
            expect(titleText).toContain("Review the changes");
    
            const footer = document.getElementById("discard-changes-footer");
            expect(footer.style.display).toBe("block");
    
            const panelList = document.getElementById("changed-panels-list");
            const items = panelList.querySelectorAll("li");
            expect(items.length).toBe(2);
            expect(items[0].textContent).toBe(panels.saveableDirty.getTitle());
        });
    
        it("discards changes and reloads modal if user confirms discard", async () => {
            spyOn(window, "confirm").and.returnValue(true);
            spyOn(platform, "reviewChanges").and.callThrough();
    
            await platform.reviewChanges(event);
    
            // Simulate click
            document.getElementById("discard-changes-btn").click();
    
            expect(platform.discardPanelChanges).toHaveBeenCalled();
            expect(platform.reviewChanges).toHaveBeenCalledWith(event);
        });
    
        it("does not discard if user cancels confirm dialog", async () => {
            spyOn(window, "confirm").and.returnValue(false);
    
            await platform.reviewChanges(event);
            document.getElementById("discard-changes-btn").click();
    
            expect(platform.discardPanelChanges).not.toHaveBeenCalled();
        });
    
        it("shows no message if there are no changes", async () => {
            platform.changesHaveBeenMade = () => false;
    
            await platform.reviewChanges(event);
    
            const titleText = document.getElementById("changed-panels-title").textContent;
            expect(titleText).toContain("no changes");
    
            const footer = document.getElementById("discard-changes-footer");
            expect(footer.style.display).toBe("none");
        });
    });
    
    describe("displayChangesForPanel()", () => {
        let panel;
    
        beforeEach(() => {
            // Create a dummy SaveablePanel
            panel = createSaveablePanel("panel1", { canSave: true });
    
            panel.getDiff = () => [
                { added: "line added" },
                { removed: "line removed" }
            ];
    
            // Spy internal methods
            spyOn(platform, "closeAllModalsExcept");
            spyOn(platform, "togglePanelChangeVisibility");
            spyOn(platform, "toggleReviewChangesVisibility");
    
            // Set up fake DOM
            document.body.innerHTML = `
                <div id="panel-changes-container" style="width:100px; height:100px;"></div>
                <div id="panel-changes-close-button"></div>
                <div id="panel-changes-back-button"></div>
                <div id="panel-title"></div>
                <div id="diff-content"></div>
            `;
        });
    
        it("shows the modal and displays the panel title and diff content", () => {
            platform.displayChangesForPanel(panel);
    
            expect(platform.closeAllModalsExcept).toHaveBeenCalledWith("panel-changes-container");
            expect(platform.togglePanelChangeVisibility).toHaveBeenCalledWith(true);
    
            const title = document.getElementById("panel-title");
            expect(title.textContent).toBe(panel.getTitle());
    
            const diffLines = document.querySelectorAll(".diff-line");
            expect(diffLines.length).toBe(2);
            expect(diffLines[0].textContent).toBe("+ line added");
            expect(diffLines[0].classList.contains("diff-added")).toBeTrue();
            expect(diffLines[1].textContent).toBe("- line removed");
            expect(diffLines[1].classList.contains("diff-removed")).toBeTrue();
        });
    
        it("assigns close button to hide the modal", () => {
            platform.displayChangesForPanel(panel);
    
            const closeButton = document.getElementById("panel-changes-close-button");
            closeButton.click();
    
            expect(platform.togglePanelChangeVisibility).toHaveBeenCalledWith(false);
        });
    
        it("assigns back button to toggle review modal", () => {
            platform.displayChangesForPanel(panel);
    
            const backButton = document.getElementById("panel-changes-back-button");
            backButton.click();
    
            expect(platform.togglePanelChangeVisibility).toHaveBeenCalledWith(false);
            expect(platform.toggleReviewChangesVisibility).toHaveBeenCalledWith(true);
        });
    
        it("resets panel container width/height", () => {
            const container = document.getElementById("panel-changes-container");
            container.style.width = "500px";
            container.style.height = "400px";
    
            platform.displayChangesForPanel(panel);
    
            expect(container.style.width).toBe("");
            expect(container.style.height).toBe("");
        });
    });
    
})