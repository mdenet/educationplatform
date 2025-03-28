import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionConsolePanel } from '../../ExtensionConsolePanel';
suite('ExtensionConsolePanel Test Suite', () => {
    let mockOutputChannel;

    setup(() => {
        mockOutputChannel = {
            appendLine: function () {},
            show: function () {}
        };

        vscode.window.createOutputChannel = () => mockOutputChannel;
    });

    test('should create an instance with correct id', () => {
        const panel = new ExtensionConsolePanel();
        assert.strictEqual(panel.id, 'console');
        assert.ok(panel instanceof ExtensionConsolePanel);
    });

    test('initialize() should create and show output channel', () => {
        let showCalled = false;
        vscode.window.createOutputChannel = (name) => {
            assert.strictEqual(name, 'MDENetconsole');
            return {
                show: (preserveFocus) => {
                    showCalled = true;
                    assert.strictEqual(preserveFocus, undefined);
                },
                appendLine: () => {}
            };
        };

        const panel = new ExtensionConsolePanel();
        panel.initialize();
        assert.ok(showCalled);
    });

    test('displayPanel() should call show(true)', () => {
        let showCalledWith = null;
        mockOutputChannel.show = (flag) => { showCalledWith = flag; };

        const panel = new ExtensionConsolePanel();
        panel.outputChannel = mockOutputChannel;
        panel.displayPanel();
        assert.strictEqual(showCalledWith, true);
    });

    test('setError() should log error and show panel', () => {
        const logs = [];
        let showCalled = false;
        mockOutputChannel.appendLine = (msg) => logs.push(msg);
        mockOutputChannel.show = (flag) => { 
            showCalled = flag; 
        };

        const panel = new ExtensionConsolePanel();
        panel.outputChannel = mockOutputChannel;
        panel.setError('Something went wrong');

        assert.ok(logs[0].includes('[Error] Something went wrong'));
        assert.strictEqual(showCalled, true);
    });

    test('setValue() should log message and show panel', () => {
        const logs = [];
        let showCalled = false;
        mockOutputChannel.appendLine = (msg) => logs.push(msg);
        mockOutputChannel.show = (flag) => { showCalled = flag; };

        const panel = new ExtensionConsolePanel();
        panel.outputChannel = mockOutputChannel;
        panel.setValue('Hello world');

        assert.strictEqual(logs[0], 'Hello world');
        assert.strictEqual(showCalled, true);
    });

});
