/*global describe, it, expect, beforeEach*/
import { Panel } from "../../src/Panel";
import { createBaseMockEditor } from "../resources/TestMockEditor";

function createMockEditor() {
    return createBaseMockEditor();
}

describe("Panel", () => {
    let panel;

    beforeEach(() => {
        panel = new Panel("test-panel");

        const element = document.createElement("div");
        element.dataset.titleCaption = "";
        element.dataset.titleIcon = "";

        panel.element = element;
        panel.editor = createMockEditor();
    });

    describe("constructor", () => {
        it("creates a panel and initializes editor", () => {
            expect(panel.id).toBe("test-panel");
            expect(panel.getEditor()).toEqual(panel.editor);
        });

        it("handles empty string id", () => {
            const emptyPanel = new Panel("");
            expect(emptyPanel.getId()).toBe("");
        });

        it("handles numeric id", () => {
            const numericPanel = new Panel(123);
            expect(numericPanel.getId()).toBe(123);
        });
    });

    describe("initialize", () => {
        it("uses the provided editor if given", () => {
            const customEditor = createMockEditor();
            panel.initialize(customEditor);
            expect(panel.editor).toBe(customEditor);
        });

        it("defaults to visible after initialization", () => {
            const newPanel = new Panel("panel-id");
            newPanel.initialize(createMockEditor());
            expect(newPanel.isVisible()).toBe(true);
        });
    });

    describe("getTitle & setTitle", () => {
        it("gets and sets title", () => {
            panel.setTitle("My Title");
            expect(panel.getTitle()).toBe("My Title");
            expect(panel.element.dataset.titleCaption).toBe("My Title");
        });
    });

    describe("setIcon", () => {
        it("sets icon separately", () => {
            panel.setIcon("icon-name");
            expect(panel.element.dataset.titleIcon).toBe("<span class='mif-16 mif-icon-name'></span>");
        });
    });

    describe("setTitleAndIcon", () => {
        it("sets both title and icon", () => {
            panel.setTitleAndIcon("Combined Title", "combined-icon");
            expect(panel.getTitle()).toBe("Combined Title");
            expect(panel.element.dataset.titleCaption).toBe("Combined Title");
            expect(panel.element.dataset.titleIcon).toBe("<span class='mif-16 mif-combined-icon'></span>");
        });
    });

    describe("visibility", () => {
        it("can be set to invisible", () => {
            panel.setVisible(false);
            expect(panel.isVisible()).toBe(false);
        });

        it("handles non-boolean values", () => {
            panel.setVisible(null);
            expect(panel.isVisible()).toBe(null);

            panel.setVisible("false");
            expect(panel.isVisible()).toBe("false");
        });
    });

    describe("setType", () => {
        it("throws error if type is set again", () => {
            panel.setType("code");
            expect(() => panel.setType("text")).toThrow("Panel type has been previously set.");
        });
    });

    describe("getElement", () => {
        it("returns the root element", () => {
            expect(panel.getElement()).toBe(panel.element);
        });

        it("creates elements on first call", () => {
            const freshPanel = new Panel("fresh");
            const spy = spyOn(freshPanel, 'createElement').and.callThrough();

            const element = freshPanel.getElement();

            expect(spy).toHaveBeenCalled();
            expect(element.getAttribute("id")).toBe("freshPanel");
            expect(element.querySelector(".editor")).not.toBe(null);
        });

        it("reuses existing element on subsequent calls", () => {
            const firstElement = panel.getElement();
            const spy = spyOn(panel, 'createElement').and.callThrough();
            const secondElement = panel.getElement();

            expect(spy).not.toHaveBeenCalled();
            expect(secondElement).toBe(firstElement);
        });
    });

    describe("createElement", () => {
        it("creates proper DOM structure", () => {
            const freshPanel = new Panel("structure-test");
            const element = freshPanel.createElement();

            expect(element.tagName).toBe("DIV");
            expect(element.getAttribute("data-role")).toBe("panel");
            expect(element.getAttribute("id")).toBe("structure-testPanel");

            const editorElement = element.querySelector(".editor");
            expect(editorElement).not.toBe(null);
            expect(editorElement.getAttribute("id")).toBe("structure-testEditor");
        });
    });

    describe("setValue", () => {
        it("sets value and resets undo manager", () => {
            panel.setValue("new content");
            expect(panel.editor.setValue).toHaveBeenCalledWith("new content", 1);
            expect(panel.editor._markCleanSpy).toHaveBeenCalled();
        });

        it("gets value from editor", () => {
            const value = panel.getValue();
            expect(value).toBe("mocked value");
        });

        it("handles null values", () => {
            panel.setValue(null);
            expect(panel.editor.setValue).toHaveBeenCalledWith("null", 1);
        });

        it("handles undefined values", () => {
            panel.setValue(undefined);
            expect(panel.editor.setValue).toHaveBeenCalledWith("undefined", 1);
        });

        it("handles numeric values", () => {
            panel.setValue(42);
            expect(panel.editor.setValue).toHaveBeenCalledWith("42", 1);
        });

        it("handles object values", () => {
            panel.setValue({ test: "value" });
            expect(panel.editor.setValue).toHaveBeenCalledWith("[object Object]", 1);
        });
    });

    describe("addButtons", () => {
        it("adds button string to dataset", () => {
            const buttons = [
                { getView: () => ({ id: "run" }) },
                { getView: () => ({ id: "reset" }) }
            ];
            panel.addButtons(buttons);
            const parsedButtons = JSON.parse(panel.element.dataset.customButtons);
            expect(parsedButtons).toEqual([{ id: "reset" }, { id: "run" }]);
        });

        it("handles empty buttons array", () => {
            panel.addButtons([]);
            expect(panel.element.dataset.customButtons).toBe(undefined);
        });

        it("handles buttons with null views", () => {
            const buttons = [
                { getView: () => null }
            ];
            panel.addButtons(buttons);
            expect(panel.element.dataset.customButtons).toBe("[null]");
        });
    });
});
