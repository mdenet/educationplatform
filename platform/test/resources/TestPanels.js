// test/helpers/testPanels.js

import { BlankPanel } from "../../src/BlankPanel.js";
import { CompositePanel } from "../../src/CompositePanel.js";
import { ConsolePanel } from "../../src/ConsolePanel.js";
import { OutputPanel } from "../../src/OutputPanel.js";
import { ProgramPanel } from "../../src/ProgramPanel.js";
import { SaveablePanel } from "../../src/SaveablePanel.js";
import { TestPanel } from "../../src/TestPanel.js";
import { XtextEditorPanel } from "../../src/XtextEditorPanel.js";
import { createBaseMockEditor } from "../resources/TestMockEditor.js";

// Prevent DOM access crash in tests
TestPanel.prototype.setColour = () => {};

function mockEditor(initialValue = "") {
    const editor = {};
    Object.assign(editor, createBaseMockEditor({
        getValue: jasmine.createSpy("getValue").and.callFake(() => editor._value),
        setValue: jasmine.createSpy("setValue").and.callFake((val) => {
            editor._value = val;
        }),
        _value: initialValue,
        session: {
            getUndoManager: () => sharedUndoManager,
            on: jasmine.createSpy("on")
        }
    }));

    const sharedUndoManager = {
        reset: jasmine.createSpy("reset"),
        markClean: jasmine.createSpy("markClean")
    };
    editor._undoManager = sharedUndoManager; // optional access for inspection
    
    return editor;
}

/**
 * Create a SaveablePanel with optional state
 */
export function createSaveablePanel(id, { canSave = false } = {}) {
    const panel = new SaveablePanel(id);
    panel.initialize(mockEditor(canSave ? "changed" : "original"));
    panel.setLastSavedContent("original");
    panel.getTitle = () => id; // for testing purposes
    return panel;
}

/**
 * Create a ProgramPanel (subclass of SaveablePanel) with canSave true/false
 */
export function createProgramPanel(id, { canSave = false } = {}) {
    const panel = new ProgramPanel(id);
    panel.initialize(mockEditor(canSave ? "changed" : "original"));
    panel.setLastSavedContent("original");
    panel.getTitle = () => id; // for testing purposes
    return panel;
}

/**
 * Create a CompositePanel with nested panels
 */
export function createCompositePanel(id, nestedPanels = []) {
    const composite = new CompositePanel(id);
    nestedPanels.forEach(child => composite.addPanel(child));
    return composite;
}

/**
 * Returns one of each panel type, and two composite panels:
 * - One flat composite
 * - One composite with a nested composite
 */
export function createVariousPanels() {
    const blank = new BlankPanel("blank1");
    const console = new ConsolePanel("console1");
    const output = new OutputPanel("output1", "java", "code", "java");
    const test = new TestPanel("test1");
    test.editor = { container: { style: {} } }; // prevent DOM crash in constructor

    const xtext = new XtextEditorPanel("xtext1");

    const saveableClean = createSaveablePanel("saveable1");
    const saveableDirty = createSaveablePanel("saveable2", { canSave: true });
    const programClean = createProgramPanel("prog1");
    const programDirty = createProgramPanel("prog2", { canSave: true });

    const compositeFlat = createCompositePanel("composite1", [saveableClean, programClean]);

    const nestedComposite = createCompositePanel("composite2a", [programDirty]);
    const compositeNested = createCompositePanel("composite2", [saveableDirty, nestedComposite]);

    return {
        blank,
        console,
        output,
        test,
        xtext,
        saveableClean,
        saveableDirty,
        programClean,
        programDirty,
        compositeFlat,
        compositeNested
    };
}