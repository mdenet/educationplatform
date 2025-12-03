export function createBaseMockEditor(overrides = {}) {
    const resetSpy = jasmine.createSpy("reset");
    const markCleanSpy = jasmine.createSpy("markClean");

    const editor = {
        getValue: jasmine.createSpy("getValue").and.returnValue("mocked value"),
        setValue: jasmine.createSpy("setValue"),
        session: {
            getUndoManager: () => ({
                reset: resetSpy,
                markClean: markCleanSpy
            })
        },
        setShowPrintMargin: jasmine.createSpy(),
        setTheme: jasmine.createSpy(),
        renderer: {
            setShowGutter: jasmine.createSpy()
        },
        setFontSize: jasmine.createSpy(),
        setOptions: jasmine.createSpy(),
        _resetSpy: resetSpy,
        _markCleanSpy: markCleanSpy,
        ...overrides
    };

    return editor;
}
