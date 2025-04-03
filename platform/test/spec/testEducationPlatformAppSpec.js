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
        platform.activityURL = "https://activity.example.com"
        platform.currentBranch = "main";
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

    describe("Modal visibility helpers", () => {
        let modalA, modalB, modalC;
    
        beforeEach(() => {
            modalA = document.createElement("div");
            modalA.id = "modal-a";
            modalA.className = "container-modal";
            modalA.style.display = "block";
    
            modalB = document.createElement("div");
            modalB.id = "modal-b";
            modalB.className = "container-modal";
            modalB.style.display = "block";
    
            modalC = document.createElement("div");
            modalC.id = "modal-c";
            modalC.className = "container-modal";
            modalC.style.display = "block";
    
            document.body.append(modalA, modalB, modalC);
        });
    
        afterEach(() => {
            document.body.innerHTML = "";
        });
    
        it("hides all modals except the one specified", () => {
            platform.closeAllModalsExcept("modal-b");
    
            expect(modalA.style.display).toBe("none");
            expect(modalB.style.display).toBe("block");
            expect(modalC.style.display).toBe("none");
        });
    
        it("modalIsVisible returns true if modal is shown", () => {
            modalA.style.display = "block";
            expect(platform.modalIsVisible("modal-a")).toBeTrue();
        });
    
        it("modalIsVisible returns false if modal is hidden", () => {
            modalA.style.display = "none";
            expect(platform.modalIsVisible("modal-a")).toBeFalse();
        });
    });

    describe("toggleSwitchBranchVisibility()", () => {
        let container;
    
        beforeEach(() => {
            container = document.createElement("div");
            container.id = "switch-branch-container";
            document.body.appendChild(container);
    
            spyOn(platform, "refreshBranches").and.resolveTo();
            spyOn(platform, "renderSwitchBranchList");
        });
    
        afterEach(() => {
            document.body.innerHTML = "";
        });
    
        it("shows the container when visibility is true", async () => {
            await platform.toggleSwitchBranchVisibility(true);
            expect(container.style.display).toBe("block");
        });
    
        it("hides the container when visibility is false", async () => {
            await platform.toggleSwitchBranchVisibility(false);
    
            expect(container.style.display).toBe("none");
        });

        it("refreshes branches when showing the container", async () => {
            await platform.toggleSwitchBranchVisibility(true);
    
            expect(platform.refreshBranches).toHaveBeenCalled();
        });

        it("re-renders the branch list when showing the container", async () => {
            await platform.toggleSwitchBranchVisibility(true);
    
            expect(platform.renderSwitchBranchList).toHaveBeenCalled();
        });
    });

    describe("toggleMergeBranchVisibility()", () => {
        let container, infoText;
    
        beforeEach(() => {
            container = document.createElement("div");
            container.id = "merge-branch-container";
            document.body.appendChild(container);
    
            infoText = document.createElement("div");
            infoText.id = "merge-branch-info-text";
            document.body.appendChild(infoText);
    
            spyOn(platform, "renderMergeBranchList");
        });
    
        afterEach(() => {
            document.body.innerHTML = "";
        });
    
        it("shows the merge branch modal when showing the modal", async () => {
            await platform.toggleMergeBranchVisibility(true);
    
            expect(container.style.display).toBe("block");
        });
    
        it("hides the merge branch modal when hiding the modal", async () => {
            await platform.toggleMergeBranchVisibility(false);

            expect(container.style.display).toBe("none");
        });

        it("re-renders the branch list when showing the modal", async () => {
            await platform.toggleMergeBranchVisibility(true);
    
            expect(platform.renderMergeBranchList).toHaveBeenCalled();
        });

        it("resets the info text when hiding the modal", async () => { 
            await platform.toggleMergeBranchVisibility(false);
    
            expect(infoText.textContent).toBe("Select a branch to merge into " + platform.currentBranch);
        });
    });

    describe("switchBranch()", () => {
        beforeEach(() => {    
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

    describe("setupSearchInput()", () => {
        let searchInput, list, li1, li2, li3;
    
        beforeEach(() => {
            // Create DOM elements
            searchInput = document.createElement("input");
            searchInput.id = "search-box";
    
            list = document.createElement("ul");
            list.id = "branch-list";
    
            li1 = document.createElement("li");
            li1.textContent = "main";
            li2 = document.createElement("li");
            li2.textContent = "dev";
            li3 = document.createElement("li");
            li3.textContent = "feature";
    
            list.appendChild(li1);
            list.appendChild(li2);
            list.appendChild(li3);
    
            document.body.appendChild(searchInput);
            document.body.appendChild(list);
    
            platform.setupSearchInput("search-box", "branch-list");
        });
    
        afterEach(() => {
            document.body.removeChild(searchInput);
            document.body.removeChild(list);
        });
    
        it("filters the list based on input text", () => {
            searchInput.value = "dev";
            searchInput.dispatchEvent(new Event("input"));
    
            expect(li1.style.display).toBe("none");   // main
            expect(li2.style.display).toBe("");       // dev
            expect(li3.style.display).toBe("none");   // feature
        });
    
        it("restores all items when input is cleared", () => {
            searchInput.value = "";
            searchInput.dispatchEvent(new Event("input"));
    
            expect(li1.style.display).toBe("");
            expect(li2.style.display).toBe("");
            expect(li3.style.display).toBe("");
        });
    
        it("filters case-insensitively", () => {
            searchInput.value = "FeAtUrE";
            searchInput.dispatchEvent(new Event("input"));
    
            expect(li1.style.display).toBe("none");
            expect(li2.style.display).toBe("none");
            expect(li3.style.display).toBe(""); // feature matches
        });
    });
    

    describe("showBranches()", () => {
        let event;
    
        beforeEach(() => {
            event = { preventDefault: jasmine.createSpy("preventDefault") };
    
            spyOn(platform, "modalIsVisible").and.returnValue(false);
            spyOn(platform, "closeAllModalsExcept");
            spyOn(platform, "toggleSwitchBranchVisibility").and.resolveTo(true);
            spyOn(platform, "setCurrentBranchText");
            spyOn(platform, "setupSearchInput");
            spyOn(platform, "renderSwitchBranchList");
            spyOn(platform, "showCreateBranchPrompt");
            spyOn(platform, "showMergeBranchPrompt");
            platform.errorHandler = { notify: jasmine.createSpy("notify") };
    
            // DOM setup
            document.body.innerHTML = `
                <div id="switch-branch-close-button"></div>
                <div id="new-branch-button"></div>
                <div id="merge-branch-button"></div>
            `;
        });
    
        it("hides modal if already visible", async () => {
            platform.modalIsVisible.and.returnValue(true);
    
            await platform.showBranches(event);
            expect(platform.toggleSwitchBranchVisibility).toHaveBeenCalledWith(false);
        });

        it("displays the switch branch modal", async () => {
            await platform.showBranches(event);
    
            expect(platform.closeAllModalsExcept).toHaveBeenCalledWith("switch-branch-container");
            expect(platform.toggleSwitchBranchVisibility).toHaveBeenCalledWith(true);
        });
    
        it("binds the current branch text elements to the current branch", async () => {
            await platform.showBranches(event);
            expect(platform.setCurrentBranchText).toHaveBeenCalled();
        });

        it("setups up the search input and renders the list of branches", async () => {
            await platform.showBranches(event);
    
            expect(platform.setupSearchInput).toHaveBeenCalledWith("switch-branch-search", "switch-branch-list");
            expect(platform.renderSwitchBranchList).toHaveBeenCalled();
        });

        it("hides the modal when the close button is clicked", async () => {
            await platform.showBranches(event);
    
            const closeButton = document.getElementById("switch-branch-close-button");
            closeButton.click();
    
            expect(platform.toggleSwitchBranchVisibility).toHaveBeenCalledWith(false);
        });

        it("assigns the new branch and merge branch buttons", async () => {
            await platform.showBranches(event);
    
            const newBranchButton = document.getElementById("new-branch-button");
            const mergeBranchButton = document.getElementById("merge-branch-button");
    
            expect(newBranchButton).toBeTruthy();
            expect(mergeBranchButton).toBeTruthy();

            newBranchButton.click();
            expect(platform.showCreateBranchPrompt).toHaveBeenCalled();

            mergeBranchButton.click();
            expect(platform.showMergeBranchPrompt).toHaveBeenCalled();
        });
    
        it("logs and notifies on error", async () => {
            const error = new Error("Test error");
            platform.toggleSwitchBranchVisibility.and.rejectWith(error);
            spyOn(console, "error");
    
            await platform.showBranches(event);
    
            expect(console.error).toHaveBeenCalledWith(error);
            expect(platform.errorHandler.notify).toHaveBeenCalledWith("An error occurred while displaying the branches.");
        });
    });
    
    describe("renderBranchList()", () => {
        let container;
    
        beforeEach(() => {
            // Set up the DOM with a dummy <ul>
            container = document.createElement("ul");
            container.id = "branch-list";
            document.body.appendChild(container);
    
            // Provide mock branches
            platform.branches = ["main", "dev", "feature-1"];
        });
    
        afterEach(() => {
            document.body.removeChild(container);
        });
    
        it("displays added items in the list", () => {
            const createListItem = (branch) => {
                const li = document.createElement("li");
                li.textContent = branch;
                return li;
            };
    
            platform.renderBranchList("branch-list", createListItem);
    
            const listItems = container.querySelectorAll("li");
            expect(listItems.length).toBe(3);
            expect(listItems[0].textContent).toBe("main");
            expect(listItems[1].textContent).toBe("dev");
            expect(listItems[2].textContent).toBe("feature-1");
        });
    
        it("does not append null list items", () => {
            const createListItem = (branch) => {
                return branch === "dev" ? null : document.createElement("li");
            };
    
            platform.renderBranchList("branch-list", createListItem);
    
            const listItems = container.querySelectorAll("li");
            expect(listItems.length).toBe(2); // dev is skipped
        });
    
        it("clears any previous list items before rendering", () => {
            // Add an old item
            const oldItem = document.createElement("li");
            oldItem.textContent = "itemToBeCleared";
            container.appendChild(oldItem);
    
            const createListItem = (branch) => {
                const li = document.createElement("li");
                li.textContent = branch;
                return li;
            };
    
            platform.renderBranchList("branch-list", createListItem);
    
            const items = container.querySelectorAll("li");
            expect([...items].map(el => el.textContent)).not.toContain("itemToBeCleared");
        });
    });

    describe("renderSwitchBranchList()", () => {
        let switchList;
    
        const simulateSwitch = (branchName) => {
            const createItem = platform.renderBranchList.calls.mostRecent().args[1];
            const item = createItem(branchName);
            item.click();
            return item;
        };
    
        beforeEach(() => {
            switchList = document.createElement("ul");
            switchList.id = "switch-branch-list";
            document.body.appendChild(switchList);
    
            platform.branches = ["main", "dev", "feature"];
    
            spyOn(platform, "renderBranchList").and.callThrough();
            spyOn(platform, "changesHaveBeenMade").and.returnValue(false);
            spyOn(platform, "discardPanelChanges");
            spyOn(platform, "switchBranch");
            spyOn(PlaygroundUtility, "warningNotification");
            spyOn(window, "confirm").and.returnValue(true); // simulate user confirmation (OK)
        });
    
        afterEach(() => {
            document.body.removeChild(switchList);
        });
    
        it("gives a special style to the current-branch", () => {
            platform.renderSwitchBranchList();
            const item = simulateSwitch("main");
            expect(item.classList.contains("current-branch")).toBeTrue();
        });
    
        it("prevents switching to the current branch", () => {
            platform.renderSwitchBranchList();
            simulateSwitch("main");
            expect(PlaygroundUtility.warningNotification).toHaveBeenCalledWith("You are already on this branch.");
        });
    
        it("checks for unsaved changes before switching branches", () => {
            platform.changesHaveBeenMade.and.returnValue(true);
            platform.renderSwitchBranchList();
            simulateSwitch("dev");
            expect(platform.changesHaveBeenMade).toHaveBeenCalled();
        });
    
        it("calls switchBranch if no unsaved changes", () => {
            platform.renderSwitchBranchList();
            simulateSwitch("feature");
            expect(platform.switchBranch).toHaveBeenCalledWith("feature");
        });
    
        it("asks for confirmation before discarding unsaved changes and continuing", () => {
            platform.changesHaveBeenMade.and.returnValue(true);
    
            platform.renderSwitchBranchList();
            simulateSwitch("dev");
    
            expect(window.confirm).toHaveBeenCalled();
            expect(platform.discardPanelChanges).toHaveBeenCalled();
            expect(platform.switchBranch).toHaveBeenCalledWith("dev");
        });
    
        it("cancels branch switch if the confirmation is rejected", () => {
            platform.changesHaveBeenMade.and.returnValue(true);
            window.confirm.and.returnValue(false); // click "Cancel"
    
            platform.renderSwitchBranchList();
            simulateSwitch("dev");
    
            expect(platform.discardPanelChanges).not.toHaveBeenCalled();
            expect(platform.switchBranch).not.toHaveBeenCalled();
        });
    });

    describe("showMergeBranchPrompt()", () => {
        let mergeButton, closeButton, backButton, mergeList, infoText;
    
        beforeEach(() => {
            // Setup DOM
            closeButton = document.createElement("button");
            closeButton.id = "merge-branch-close-button";
    
            backButton = document.createElement("button");
            backButton.id = "merge-branch-back-button";
    
            mergeButton = document.createElement("button");
            mergeButton.id = "confirm-merge-button";
    
            mergeList = document.createElement("ul");
            mergeList.id = "merge-branch-list";
            mergeList.dataset.selectedBranch = "dev";
            mergeList.dataset.mergeType = "fast-forward";
    
            infoText = document.createElement("div");
            infoText.id = "merge-branch-info-text";
    
            document.body.append(closeButton, backButton, mergeButton, mergeList, infoText);
    
            platform.saveablePanels = [createSaveablePanel("panel1", { canSave: true })];
    
            spyOn(platform, "closeAllModalsExcept");
            spyOn(platform, "toggleMergeBranchVisibility").and.resolveTo();
            spyOn(platform, "toggleSwitchBranchVisibility").and.resolveTo();
            spyOn(platform, "setupSearchInput");
            spyOn(platform, "renderMergeBranchList");
            spyOn(platform, "discardPanelChanges");
            spyOn(platform, "displayMergeConflictModal");
    
            platform.fileHandler = {
                mergeBranches: jasmine.createSpy("mergeBranches").and.resolveTo({
                    success: true,
                    files: [
                        {
                            path: "panel1.txt",
                            sha: "newSha",
                            content: "newContent"
                        }
                    ]
                })
            };
    
            spyOn(PlaygroundUtility, "warningNotification");
            spyOn(PlaygroundUtility, "successNotification");
            platform.errorHandler = { notify: jasmine.createSpy("notify") };
            spyOn(platform, "changesHaveBeenMade").and.returnValue(false);
        });
    
        afterEach(() => {
            document.body.innerHTML = "";
        });
    
        it("sets up the modal and renders merge list", async () => {
            await platform.showMergeBranchPrompt();
    
            expect(platform.closeAllModalsExcept).toHaveBeenCalledWith("merge-branch-container");
            expect(platform.toggleMergeBranchVisibility).toHaveBeenCalledWith(true);
            expect(platform.setupSearchInput).toHaveBeenCalledWith("merge-branch-search", "merge-branch-list");
            expect(platform.renderMergeBranchList).toHaveBeenCalled();
        });
    
        it("closes modal on close button click", async () => {
            await platform.showMergeBranchPrompt();
            closeButton.click();
            expect(platform.toggleMergeBranchVisibility).toHaveBeenCalledWith(false);
        });
    
        it("returns to switch view on back button click", async () => {
            await platform.showMergeBranchPrompt();
            await backButton.click();
            expect(platform.toggleMergeBranchVisibility).toHaveBeenCalledWith(false);
            expect(platform.toggleSwitchBranchVisibility).toHaveBeenCalledWith(true);
        });
    
        it("shows warning if no branch is selected", async () => {
            mergeList.dataset.selectedBranch = "";
            await platform.showMergeBranchPrompt();
            await mergeButton.click();
            expect(PlaygroundUtility.warningNotification).toHaveBeenCalledWith("Please select a branch to merge.");
        });

        it("checks for unsaved changes before merging branches", async () => {
            spyOn(window, "confirm").and.returnValue(false);
        
            await platform.showMergeBranchPrompt();
            await mergeButton.click();
        
            expect(platform.changesHaveBeenMade).toHaveBeenCalled();
        });

        it("attempts to merge branches if there are no unsaved changes", async () => {
            platform.changesHaveBeenMade.and.returnValue(false);
    
            await platform.showMergeBranchPrompt();
            await mergeButton.click();
    
            expect(platform.fileHandler.mergeBranches).toHaveBeenCalled();
            expect(PlaygroundUtility.successNotification).toHaveBeenCalledWith("Branches merged successfully.");
        });
    
        it("discards changes before merging if the user confirms", async () => {
            platform.changesHaveBeenMade.and.returnValue(true);
            spyOn(window, "confirm").and.returnValue(true);
    
            await platform.showMergeBranchPrompt();
            await mergeButton.click();
    
            expect(platform.discardPanelChanges).toHaveBeenCalled();
            expect(platform.fileHandler.mergeBranches).toHaveBeenCalled();
            expect(PlaygroundUtility.successNotification).toHaveBeenCalledWith("Branches merged successfully.");
        });
    
        it("cancels merge if the user cancels to discard changes", async () => {
            platform.changesHaveBeenMade.and.returnValue(true);
            spyOn(window, "confirm").and.returnValue(false);
    
            await platform.showMergeBranchPrompt();
            await mergeButton.click();
    
            expect(platform.discardPanelChanges).not.toHaveBeenCalled();
            expect(PlaygroundUtility.successNotification).not.toHaveBeenCalled();
        });

        it("updates panel SHAs, content, and marks them clean after successful merge", async () => {
            const panel = platform.saveablePanels[0];
            const undoManager = panel.getEditor().session.getUndoManager();
        
            spyOn(panel, "setValueSha");
            spyOn(panel, "setLastSavedContent");
            spyOn(panel, "setValue");
        
            await platform.showMergeBranchPrompt();
            await mergeButton.click();
        
            expect(panel.setValueSha).toHaveBeenCalledWith("newSha");
            expect(panel.setLastSavedContent).toHaveBeenCalledWith("newContent");
            expect(panel.setValue).toHaveBeenCalledWith("newContent");
            expect(undoManager.markClean).toHaveBeenCalled();
        });
        
        it("handles merge conflict case and displays the merge conflict modal", async () => {
            platform.fileHandler.mergeBranches.and.resolveTo({
                conflict: true
            });
    
            await platform.showMergeBranchPrompt();
            await mergeButton.click();
    
            expect(PlaygroundUtility.warningNotification).toHaveBeenCalledWith(
                "Merge conflicts detected while attempting to merge branches."
            );
            expect(platform.displayMergeConflictModal).toHaveBeenCalledWith("main", "dev");
        });
    
        it("shows error notification on merge failure", async () => {
            platform.fileHandler.mergeBranches.and.rejectWith(new Error("merge error"));
    
            await platform.showMergeBranchPrompt();
            await mergeButton.click();
    
            expect(platform.errorHandler.notify).toHaveBeenCalledWith("An error occurred while merging branches.");
        });
    });
    
    describe("renderMergeBranchList()", () => {
        let mergeList, infoText;
    
        beforeEach(() => {
            mergeList = document.createElement("ul");
            mergeList.id = "merge-branch-list";
    
            infoText = document.createElement("div");
            infoText.id = "merge-branch-info-text";
    
            document.body.appendChild(mergeList);
            document.body.appendChild(infoText);
    
            platform.branches = ["main", "dev", "feature"];
    
            platform.fileHandler = {
                compareBranches: jasmine.createSpy("compareBranches").and.resolveTo({ diff: "someDiff" })
            };
    
            spyOn(platform, "renderBranchList").and.callThrough();
            spyOn(platform, "updateMergeInfoText");
        });
    
        afterEach(() => {
            document.body.removeChild(mergeList);
            document.body.removeChild(infoText);
        });
    
        const simulateClick = async (branchName) => {
            platform.renderMergeBranchList();
        
            const createItem = platform.renderBranchList.calls.mostRecent().args[1];
            const item = createItem(branchName);        
            mergeList.appendChild(item);
        
            await item.click();
            return item;
        };
    
        it("skips rendering the current branch", () => {
            platform.renderMergeBranchList();
    
            const createItem = platform.renderBranchList.calls.mostRecent().args[1];
            const result = createItem("main");
    
            expect(result).toBeNull();
        });
    
        it("selects a new branch and shows merge info", async () => {
            const item = await simulateClick("dev");
    
            expect(item.classList.contains("selected-branch")).toBeTrue();
            expect(mergeList.dataset.selectedBranch).toBe("dev");
            expect(platform.fileHandler.compareBranches).toHaveBeenCalledWith(platform.activityURL, "dev");
            expect(platform.updateMergeInfoText).toHaveBeenCalledWith(jasmine.anything(), "dev");
        });
    
        it("unselects an already selected branch", async () => {
            const item = await simulateClick("feature");
        
            expect(item.classList.contains("selected-branch")).toBeTrue();
            expect(mergeList.dataset.selectedBranch).toBe("feature");
        
            await item.click();
        
            expect(item.classList.contains("selected-branch")).toBeFalse();
            expect(mergeList.dataset.selectedBranch).toBeUndefined();
            expect(infoText.textContent).toContain("Select a branch to merge");
        });
        
        it("shows error text if compareBranches fails", async () => {
            platform.fileHandler.compareBranches.and.rejectWith(new Error("network error"));
    
            await simulateClick("dev");
    
            expect(infoText.textContent).toContain("There was an error comparing the branches.");
        });
    });
    
    describe("updateMergeInfoText()", () => {
        let infoText, mergeButton, mergeList;
    
        beforeEach(() => {
            infoText = document.createElement("div");
            infoText.id = "merge-branch-info-text";
    
            mergeButton = document.createElement("button");
            mergeButton.id = "confirm-merge-button";
    
            mergeList = document.createElement("ul");
            mergeList.id = "merge-branch-list";
    
            document.body.appendChild(infoText);
            document.body.appendChild(mergeButton);
            document.body.appendChild(mergeList);
        });
    
        afterEach(() => {
            document.body.removeChild(infoText);
            document.body.removeChild(mergeButton);
            document.body.removeChild(mergeList);
        });
    
        it("shows a message and disables merge button for identical status", () => {
            platform.updateMergeInfoText({ status: "identical", head: { ref: "dev" }, base: { ref: "main" } }, "dev");
    
            expect(infoText.innerHTML).toContain("up to date");
            expect(mergeButton.disabled).toBeTrue();
        });
    
        it("enables merge button for ahead status and sets merge type as fast-forward", () => {
            platform.updateMergeInfoText({ status: "ahead", ahead_by: 3 }, "dev");
    
            expect(infoText.innerHTML).toContain("ahead");
            expect(mergeButton.disabled).toBeFalse();
            expect(mergeList.dataset.mergeType).toBe("fast-forward");
        });
    
        it("shows a message and disables merge button for behind status", () => {
            platform.updateMergeInfoText({ status: "behind", behind_by: 2 }, "dev");
    
            expect(infoText.innerHTML).toContain("behind");
            expect(mergeButton.disabled).toBeTrue();
        });
    
        it("shows warning for diverged branches and sets merge type as merge", () => {
            platform.updateMergeInfoText({ status: "diverged" }, "dev");
    
            expect(infoText.innerHTML).toContain("diverged");
            expect(mergeButton.disabled).toBeFalse();
            expect(mergeList.dataset.mergeType).toBe("merge");
        });
    
        it("shows generic fallback text for unknown status", () => {
            platform.updateMergeInfoText({ status: "unexpected" }, "dev");
    
            expect(infoText.innerHTML).toContain("Merge status: unexpected");
            expect(mergeButton.disabled).toBeTrue();
        });
    
        it("shows a fallback text if comparisonInfo is invalid", () => {
            platform.updateMergeInfoText(null, "dev");
    
            expect(infoText.textContent).toContain("Unable to determine merge status.");
        });
    });

    describe("displayMergeConflictModal()", () => {
        let closeBtn, backBtn, headEl, baseEl;
    
        beforeEach(() => {
            closeBtn = document.createElement("button");
            closeBtn.id = "merge-conflict-close-button";
    
            backBtn = document.createElement("button");
            backBtn.id = "merge-conflict-back-button";
    
            headEl = document.createElement("span");
            headEl.id = "head-branch";
    
            baseEl = document.createElement("span");
            baseEl.id = "base-branch";
    
            document.body.append(closeBtn, backBtn, headEl, baseEl);
    
            spyOn(platform, "toggleMergeBranchVisibility");
            spyOn(platform, "toggleMergeConflictVisibility");
            spyOn(platform, "displayPullRequestLink");
            platform.errorHandler = { notify: jasmine.createSpy("notify") };
        });
    
        afterEach(() => {
            document.body.innerHTML = "";
        });
    
        it("displays the merge conflict modal", async () => {
            await platform.displayMergeConflictModal("main", "dev");
    
            expect(platform.toggleMergeBranchVisibility).toHaveBeenCalledWith(false);
            expect(platform.toggleMergeConflictVisibility).toHaveBeenCalledWith(true);
        });

        it("uses the correct branch names in the modal", async () => {
            await platform.displayMergeConflictModal("main", "dev");
    
            expect(headEl.textContent).toBe("dev");
            expect(baseEl.textContent).toBe("main");
        });
    
        it("closes the modal when close button is clicked", async () => {
            await platform.displayMergeConflictModal("main", "dev");
            closeBtn.click();
            expect(platform.toggleMergeConflictVisibility).toHaveBeenCalledWith(false);
        });
    
        it("goes back to merge modal when back button is clicked", async () => {
            await platform.displayMergeConflictModal("main", "dev");
            backBtn.click();
            expect(platform.toggleMergeConflictVisibility).toHaveBeenCalledWith(false);
            expect(platform.toggleMergeBranchVisibility).toHaveBeenCalledWith(true);
        });

        it("displays the pull request link", async () => {
            const mockLink = "https://example.com/pull-request";
            platform.fileHandler = {
                getPullRequestLink: () => mockLink
            };

            await platform.displayMergeConflictModal("main", "dev");
        
            expect(platform.displayPullRequestLink).toHaveBeenCalledWith(mockLink);
        });
    
        it("shows error if getPullRequestLink fails", async () => {
            platform.fileHandler = {
                getPullRequestLink: () => { throw new Error("link error"); }
            };
    
            spyOn(console, "error");
    
            await platform.displayMergeConflictModal("main", "dev");
    
            expect(console.error).toHaveBeenCalledWith("Error creating pull request:", jasmine.any(Error));
            expect(platform.errorHandler.notify).toHaveBeenCalledWith("An error occurred while creating the pull request.");
        });
    });
    
    describe("showCreateBranchPrompt()", () => {
        let closeButton, backButton, submitButton, branchInput;

        beforeEach(() => {
            closeButton = document.createElement("button");
            closeButton.id = "create-branch-close-button";

            backButton = document.createElement("button");
            backButton.id = "create-branch-back-button";

            submitButton = document.createElement("button");
            submitButton.id = "create-branch-submit-button";

            branchInput = document.createElement("input");
            branchInput.id = "new-branch-name";

            document.body.append(closeButton, backButton, submitButton, branchInput);

            platform.branches = ["main", "dev"];

            spyOn(platform, "closeAllModalsExcept");
            spyOn(platform, "toggleCreateBranchVisibility");
            spyOn(platform, "toggleSwitchBranchVisibility").and.resolveTo();
            spyOn(platform, "displayCreateBranchConfirmModal");
            spyOn(platform, "displaySwitchToBranchLink");
            platform.errorHandler = { notify: jasmine.createSpy("notify") };

            spyOn(PlaygroundUtility, "warningNotification");
            spyOn(PlaygroundUtility, "successNotification");

            platform.fileHandler = {
                createBranch: jasmine.createSpy("createBranch").and.resolveTo()
            };

            spyOn(utility, "validateBranchName").and.returnValue(true);
            spyOn(platform, "changesHaveBeenMade").and.returnValue(false);
        });

        afterEach(() => {
            document.body.innerHTML = "";
        });

        async function submitCreateBranch(name) {
            branchInput.value = name;
            submitButton.click();

            await Promise.resolve(); // flush any promises
        }

        it("displays the branch creation modal", async () => {
            await platform.showCreateBranchPrompt();
            expect(platform.closeAllModalsExcept).toHaveBeenCalledWith("create-branch-container");
            expect(platform.toggleCreateBranchVisibility).toHaveBeenCalledWith(true);
        });

        it("clears input field when modal is shown", async () => {
            branchInput.value = "to-clear";
            await platform.showCreateBranchPrompt();
            expect(branchInput.value).toBe("");
        });

        it("closes modal when close button is clicked", async () => {
            await platform.showCreateBranchPrompt();
            closeButton.click();
            expect(platform.toggleCreateBranchVisibility).toHaveBeenCalledWith(false);
        });

        it("returns to switch view on back button click", async () => {
            await platform.showCreateBranchPrompt();
            await backButton.click();
            expect(platform.toggleCreateBranchVisibility).toHaveBeenCalledWith(false);
            expect(platform.toggleSwitchBranchVisibility).toHaveBeenCalledWith(true);
        });

        it("warns if branch already exists", async () => {
            await platform.showCreateBranchPrompt();
            await submitCreateBranch("main");
            expect(PlaygroundUtility.warningNotification).toHaveBeenCalledWith("Branch main already exists.");
        });

        it("warns if branch name is invalid", async () => {
            utility.validateBranchName.and.returnValue(false);
            await platform.showCreateBranchPrompt();
            await submitCreateBranch("bad name!");
            expect(PlaygroundUtility.warningNotification).toHaveBeenCalledWith("Invalid branch name. Please try again.");
        });

        it("shows confirmation modal if unsaved changes exist", async () => {
            platform.changesHaveBeenMade.and.returnValue(true);
            await platform.showCreateBranchPrompt();
            await submitCreateBranch("new-branch-name");
            expect(platform.displayCreateBranchConfirmModal).toHaveBeenCalledWith("new-branch-name");
        });

        it("replaces whitespaces with dashes in branch name", async () => {
            await platform.showCreateBranchPrompt();
            await submitCreateBranch("new feature branch");
            expect(platform.fileHandler.createBranch).toHaveBeenCalledWith(platform.activityURL, "new-feature-branch");
        });

        it("creates branch and shows success message if no changes exist", async () => {
            await platform.showCreateBranchPrompt();
            await submitCreateBranch("new-branch");
            expect(platform.fileHandler.createBranch).toHaveBeenCalledWith(platform.activityURL, "new-branch");
            expect(PlaygroundUtility.successNotification).toHaveBeenCalledWith("Branch new-branch created successfully");
            expect(platform.displaySwitchToBranchLink).toHaveBeenCalledWith("new-branch");
        });

        it("shows error notification if branch creation fails", async () => {
            platform.fileHandler.createBranch.and.rejectWith(new Error("network fail"));
            await platform.showCreateBranchPrompt();
            await submitCreateBranch("fail-branch");
            expect(platform.errorHandler.notify).toHaveBeenCalledWith("An error occurred while creating a branch.");
        });
    });

    describe("displayCreateBranchConfirmModal()", () => {
        let confirmButton, discardButton, closeButton, backButton;
        let newBranchSpans;
    
        beforeEach(() => {
            confirmButton = document.createElement("button");
            confirmButton.id = "confirm-bring-changes";
    
            discardButton = document.createElement("button");
            discardButton.id = "discard-changes";
    
            closeButton = document.createElement("button");
            closeButton.id = "create-branch-confirm-close-button";
    
            backButton = document.createElement("button");
            backButton.id = "create-branch-confirm-back-button";
    
            newBranchSpans = [document.createElement("span"), document.createElement("span")];
            newBranchSpans.forEach(el => el.id = "new-branch");
    
            document.body.append(confirmButton, discardButton, closeButton, backButton, ...newBranchSpans);
    
            platform.saveablePanels = [createSaveablePanel("panel1", { canSave: true })];
    
            spyOn(platform, "toggleCreateBranchVisibility");
            spyOn(platform, "toggleCreateBranchConfirmVisibility");
            spyOn(platform, "displaySwitchToBranchLink");
            spyOn(platform, "discardPanelChanges");
            spyOn(platform, "saveFiles").and.resolveTo();
            spyOn(PlaygroundUtility, "successNotification");
            platform.errorHandler = { notify: jasmine.createSpy("notify") };
    
            platform.fileHandler = {
                createBranch: jasmine.createSpy("createBranch").and.resolveTo()
            };
        });
    
        afterEach(() => {
            document.body.innerHTML = "";
        });
    
        async function submitConfirmBranch() {
            const button = document.getElementById("confirm-bring-changes");
            button.click();
            return Promise.resolve();
        }
    
        async function submitDiscardBranch() {
            const button = document.getElementById("discard-changes");
            button.click();
            return Promise.resolve();
        }
    
        it("displays the new branch name in all spans", async () => {
            await platform.displayCreateBranchConfirmModal("feature-xyz");
            newBranchSpans.forEach(span => {
                expect(span.textContent).toBe("feature-xyz");
            });
        });
    
        it("closes the modal when close button is clicked", async () => {
            await platform.displayCreateBranchConfirmModal("test");
            closeButton.click();
            expect(platform.toggleCreateBranchConfirmVisibility).toHaveBeenCalledWith(false);
        });
    
        it("returns to the create branch modal when back button is clicked", async () => {
            await platform.displayCreateBranchConfirmModal("test");
            await backButton.click();
            expect(platform.toggleCreateBranchConfirmVisibility).toHaveBeenCalledWith(false);
            expect(platform.toggleCreateBranchVisibility).toHaveBeenCalledWith(true);
        });
    
        it("creates branch and saves changes to that branch when user confirms to bring changes", async () => {
            await platform.displayCreateBranchConfirmModal("feature-xyz");
            await submitConfirmBranch();
    
            expect(platform.fileHandler.createBranch).toHaveBeenCalledWith(platform.activityURL, "feature-xyz");
            expect(platform.saveFiles).toHaveBeenCalledWith("Merge changes from main to feature-xyz", "feature-xyz");

            expect(PlaygroundUtility.successNotification).toHaveBeenCalledWith("Branch feature-xyz created successfully");
            expect(platform.displaySwitchToBranchLink).toHaveBeenCalledWith("feature-xyz");
            expect(platform.discardPanelChanges).toHaveBeenCalled();
        });
    
        it("creates the branch and doesn't save when the user chooses to discard changes and continue", async () => {
            await platform.displayCreateBranchConfirmModal("cleanup-branch");
            await submitDiscardBranch();
    
            expect(platform.fileHandler.createBranch).toHaveBeenCalledWith(platform.activityURL, "cleanup-branch");
            expect(platform.discardPanelChanges).toHaveBeenCalled();

            expect(PlaygroundUtility.successNotification).toHaveBeenCalledWith("Branch cleanup-branch created successfully");
            expect(platform.displaySwitchToBranchLink).toHaveBeenCalledWith("cleanup-branch");
        });
    
        it("shows error if createBranch fails", async () => {
            platform.fileHandler.createBranch.and.rejectWith(new Error("fail"));
            await platform.displayCreateBranchConfirmModal("bugfix");
            await submitConfirmBranch();
    
            expect(platform.errorHandler.notify).toHaveBeenCalledWith("An error occurred while creating a branch.");
        });
    
        it("shows error if saveFiles fails after creating branch", async () => {
            platform.saveFiles.and.rejectWith(new Error("save failed"));
            await platform.displayCreateBranchConfirmModal("bugfix");
            await submitConfirmBranch();
    
            expect(platform.errorHandler.notify).toHaveBeenCalledWith("An error occured while trying to bring the changes over to the new branch");
        });
    });
    
})