/*global describe, it, expect, beforeEach, jasmine*/
import { SaveablePanel } from "../../src/SaveablePanel";
import { createBaseMockEditor } from "../resources/TestMockEditor";

function createMockEditor(initialValue = "") {
    const editor = {};  // define it first so we can reference it in spies

    Object.assign(editor, createBaseMockEditor({
        getValue: jasmine.createSpy("getValue").and.callFake(() => editor._value),
        setValue: jasmine.createSpy("setValue").and.callFake((val) => {
            editor._value = val;
        }),
        _value: initialValue,
        session: {
            getUndoManager: () => ({
                reset: jasmine.createSpy("reset"),
                markClean: jasmine.createSpy("markClean")
            }),
            on: jasmine.createSpy("on")
        }
    }));

    return editor;
}

describe("SaveablePanel", () => {
    let panel, editor;

    beforeEach(() => {
        panel = new SaveablePanel("saveable-test");
        editor = createMockEditor("initial content");
        panel.element = document.createElement("div");
        panel.initialize(editor);
    });

    describe("initialize", () => {
        it("attaches change listener to editor", () => {
            expect(editor.session.on).toHaveBeenCalledWith("change", jasmine.any(Function));
        });
    });

    describe("updatePanelDiff", () => {
        it("sets proper diff output when content differs", () => {
            panel.setLastSavedContent("line 1\nline 2\n");
            editor.setValue("line 1\nline changed\n");

            panel.updatePanelDiff();

            expect(panel.getDiff()).toEqual([
                { removed: "line 2\n" },
                { added: "line changed\n" }
            ]);
        });

        it("handles undefined lastSavedContent", () => {
            panel.setLastSavedContent(undefined);
            editor.setValue("new content");

            expect(() => panel.updatePanelDiff()).not.toThrow();
            expect(Array.isArray(panel.getDiff())).toBe(true);
        });

        it("handles undefined editor content", () => {
            panel.setLastSavedContent("previous");
            editor.getValue = jasmine.createSpy().and.returnValue(undefined);

            expect(() => panel.updatePanelDiff()).not.toThrow();
            expect(Array.isArray(panel.getDiff())).toBe(true);
        });
    });

    describe("getDiff", () => {
        it("returns current diff", () => {
            panel.diff = [{ added: "line" }];
            expect(panel.getDiff()).toEqual([{ added: "line" }]);
        });

        it("treats null or undefined lastSavedContent and current value as empty strings", () => {
            panel.setLastSavedContent(null);
            editor.getValue = jasmine.createSpy("getValue").and.returnValue(undefined);
    
            expect(() => panel.updatePanelDiff()).not.toThrow();
            expect(panel.getDiff()).toEqual([]); // diff between "" and "" is nothing
        });
    });

    describe("getFileUrl / setFileUrl", () => {
        it("sets and gets fileUrl", () => {
            panel.setFileUrl("https://example.com/file.js");
            expect(panel.getFileUrl()).toBe("https://example.com/file.js");
        });
    });

    describe("getFilePath", () => {
        it("parses GitHub path correctly", () => {
            panel.setFileUrl("https://raw.githubusercontent.com/owner/repo/branch/path/to/file");
            expect(panel.getFilePath()).toBe("path/to/file");
        });

        it("returns empty string for invalid URL", () => {
            panel.setFileUrl("not-a-url");
            expect(panel.getFilePath()).toBe("");
        });

        it("throws if fileUrl is undefined", () => {
            panel.setFileUrl(undefined);
            expect(() => panel.getFilePath()).toThrow();
        });
    });

    describe("getValueSha / setValueSha", () => {
        it("sets and gets valueSha", () => {
            panel.setValueSha("abc123");
            expect(panel.getValueSha()).toBe("abc123");
        });
    });

    describe("getLastSavedContent / setLastSavedContent", () => {
        it("sets and gets last saved content", () => {
            panel.setLastSavedContent("last version");
            expect(panel.getLastSavedContent()).toBe("last version");
        });
    });

    describe("defineSaveMetaData", () => {
        it("sets fileUrl, fileContent, fileSha and updates editor", () => {
            panel.defineSaveMetaData("url", "file content", "sha123");

            expect(panel.getFileUrl()).toBe("url");
            expect(panel.getLastSavedContent()).toBe("file content");
            expect(panel.getValueSha()).toBe("sha123");
            expect(panel.getValue()).toBe("file content");
        });

        it("handles null values", () => {
            panel.defineSaveMetaData(null, null, null);
            expect(panel.getFileUrl()).toBe(null);
            expect(panel.getLastSavedContent()).toBe(null);
            expect(panel.getValueSha()).toBe(null);
            expect(panel.getValue()).toBe("null"); // coerced to string
        });
    });

    describe("canSave", () => {
        it("returns false when content matches last saved", () => {
            panel.setLastSavedContent("same");
            editor.setValue("same");
            expect(panel.canSave()).toBe(false);
        });

        it("returns true when content has changed", () => {
            panel.setLastSavedContent("original");
            editor.setValue("modified");
            expect(panel.canSave()).toBe(true);
        });

        it("handles null saved content", () => {
            panel.setLastSavedContent(null);
            editor.setValue("something");
            expect(panel.canSave()).toBe(true);
        });
    });

    describe("exportSaveData", () => {
        it("returns correct save data", () => {
            panel.setFileUrl("https://example.com");
            editor.setValue("new content");

            expect(panel.exportSaveData()).toEqual({
                fileUrl: "https://example.com",
                newFileContent: "new content"
            });
        });

        it("handles missing fileUrl gracefully", () => {
            panel.setFileUrl(undefined);
            editor.setValue("content");
            expect(panel.exportSaveData()).toEqual({
                fileUrl: undefined,
                newFileContent: "content"
            });
        });
    });

    describe("resetChanges", () => {
        it("resets editor to last saved content", () => {
            panel.setLastSavedContent("saved");
            editor.setValue("unsaved");

            panel.resetChanges();
            expect(panel.getValue()).toBe("saved");
        });

        it("does not crash if lastSavedContent is undefined", () => {
            panel.setLastSavedContent(undefined);
            expect(() => panel.resetChanges()).not.toThrow();
        });
    });
});
