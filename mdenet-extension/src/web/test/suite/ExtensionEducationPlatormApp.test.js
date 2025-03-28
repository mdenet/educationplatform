import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionEducationPlatformApp } from '../../ExtensionEducationPlatformApp';
import { ExtensionProgramPanel } from '../../ExtensionProgramPanel';
import { ExtensionConsolePanel } from '../../ExtensionConsolePanel';
import { ExtensionCompositePanel } from '../../ExtensionCompositePanel';
import { ExtensionOutputPanel } from '../../ExtensionOutputPanel';

suite('ExtensionEducationPlatformApp Test Suite', () => {
    let mockContext;
    let mockProvider;
    let app;

    setup(() => {
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: [{ uri: { fsPath: '/mock/path' } }],
            configurable: true
        });
    
        vscode.window.createWebviewPanel = () => mockPanel;
        vscode.commands.executeCommand = () => {};
        vscode.window.showErrorMessage = () => {};

        mockContext = {
            workspaceState: {
                update: () => {},
                get: () => {},
                keys: () => []
            }
        };
        app = new ExtensionEducationPlatformApp(mockContext, mockProvider, 'testLabel');

        app.ExtensionProgramPanel = ExtensionProgramPanel;
        app.ExtensionConsolePanel = ExtensionConsolePanel;
        app.ExtensionCompositePanel = ExtensionCompositePanel;
        app.ExtensionOutputPanel = ExtensionOutputPanel;
    });

    test('initializeActivity() should create ToolManager and ExtensionActivityManager and call super.initializeActivity', async () => {
        const app = new ExtensionEducationPlatformApp(mockContext, mockProvider, 'activityLabel');
    
        app.errorHandler = { notify: () => {} };
        app.fileHandler = {};
        app.displayErrors = () => {};
    
        let superCalled = false;
    
        // Mock parent (GeneralEducationPlatformApp) method
        const originalSuper = Object.getPrototypeOf(Object.getPrototypeOf(app)).initializeActivity;
        Object.getPrototypeOf(Object.getPrototypeOf(app)).initializeActivity = async (toolManager, activityManager, arr) => {
            superCalled = true;
            assert.ok(toolManager);
            assert.ok(activityManager);
            assert.deepStrictEqual(arr, []);
        };
    
        await app.initializeActivity();
    
        assert.strictEqual(superCalled, true);
    
        // Restore prototype to avoid affecting other tests
        Object.getPrototypeOf(Object.getPrototypeOf(app)).initializeActivity = originalSuper;
    });
    
    test('should create instance with correct properties', () => {
        const app = new ExtensionEducationPlatformApp(mockContext, mockProvider, 'activity.json');
        assert.strictEqual(app.wsUri, "ws://localhost:8080/tools/xtext/services/xtext/ws");
        assert.strictEqual(app.activityLabel, 'activity.json');
    });

    test('displayErrors() should show all error messages', () => {
        let shownMessages = [];
        vscode.window.showErrorMessage = (msg) => { shownMessages.push(msg); };

        const app = new ExtensionEducationPlatformApp(mockContext, mockProvider, 'activity.json');
        app.displayErrors([{ message: 'Error1' }, { message: 'Error2' }]);

        assert.deepStrictEqual(shownMessages, ['Error1', 'Error2']);
    });

    test('createButtons() should return ExtensionButton instances', () => {
        const app = new ExtensionEducationPlatformApp(mockContext, mockProvider, 'activity.json');
        const buttons = app.createButtons([{ id: 'b1', icon: '', hint: '', url: 'http://example.com' }], 'panelId');
        assert.strictEqual(buttons.length, 1);
        assert.strictEqual(buttons[0].id, 'b1');
    });

    test('getVisiblePanels() should throw if panel not found', () => {
        const app = new ExtensionEducationPlatformApp(mockContext, mockProvider, 'activity.json');
        app.activity = { layout: { area: [['panel1']] } };
        app.panels = [];

        assert.throws(() => app.getVisiblePanels(), /Panel not found/);
    });

    test('getVisiblePanels() should return visible panels', () => {
        const app = new ExtensionEducationPlatformApp(mockContext, mockProvider, 'activity.json');
        app.activity = { layout: { area: [['panel1']] } };
        app.panels = [{ getId: () => 'panel1' }];

        const panels = app.getVisiblePanels();
        assert.strictEqual(panels.length, 1);
    });

    test('updateSessionInfo() should update workspace state', () => {
        let updatedKey = '';
        let updatedValue = '';

        mockContext.workspaceState.update = (key, value) => {
            updatedKey = key;
            updatedValue = value;
        };

        const app = new ExtensionEducationPlatformApp(mockContext, mockProvider, 'activity.json');
        app.updateSessionInfo('editor1', 'https://ep.mde-network.org/some/path');

        assert.strictEqual(updatedKey, 'editor1');
        assert.strictEqual(updatedValue.startsWith('http://localhost:8080'), true);
    });

    test('displayLongMessage() should call showInformationMessage', () => {
        let msgShown = '';
        vscode.window.showInformationMessage = (msg) => { msgShown = msg; };

        const app = new ExtensionEducationPlatformApp(mockContext, mockProvider, 'activity.json');
        app.displayLongMessage('Test message');

        assert.strictEqual(msgShown, 'Test message');
    });

    test('createPanel() should handle ProgramPanel', async () => {
        const panelDefinition = { panelclass: 'ProgramPanel', language: 'plaintext' };
        const panel = { file: 'file1' };
    
        const result = await app.createPanel(panel, panelDefinition, 'panelId');
    
        assert.strictEqual(result.id, 'panelId');
        assert.strictEqual(result.fileLocation, 'file1');
        assert.ok(typeof result.initialize === 'function');
        assert.ok(typeof result.setType === 'function');
    });
    
    test('createPanel() should handle ConsolePanel', async () => {
        const panelDefinition = { panelclass: 'ConsolePanel' };
        const panel = {};
    
        const result = await app.createPanel(panel, panelDefinition, 'panelId');
    
        assert.strictEqual(result.id, 'panelId');
        assert.ok(typeof result.initialize === 'function');
    });
    
    test('createPanel() should handle OutputPanel', async () => {
        const panelDefinition = { panelclass: 'OutputPanel', language: 'json' };
        const panel = { name: 'OutputPanelName' };
    
        const result = await app.createPanel(panel, panelDefinition, 'panelId');
    
        assert.strictEqual(result.id, 'panelId');
        assert.strictEqual(result.name, 'OutputPanelName');
        assert.ok(typeof result.initialize === 'function');
    });
    
    test('createPanel() should handle XtextEditorPanel', async () => {
        app.context.workspaceState.get = () => 'http://localhost:8080';
    
        const panelDefinition = { panelclass: 'XtextEditorPanel', language: 'java' };
        const panel = { file: 'file1' };
    
        const result = await app.createPanel(panel, panelDefinition, 'panelId');
    
        assert.strictEqual(result.id, 'panelId');
        assert.strictEqual(result.fileLocation, 'file1');
        assert.ok(typeof result.initialize === 'function');
    });
    
    test('createPanel() should handle CompositePanel with child panels', async () => {
        app.createPanelForDefinitionId = async () => ({
            getId: () => 'childPanel',
            addPanel: () => {}
        });
    
        const panelDefinition = { panelclass: 'CompositePanel' };
        const panel = { childPanels: [{}] };
    
        const result = await app.createPanel(panel, panelDefinition, 'panelId');
    
        assert.strictEqual(result.id, 'panelId');
        assert.ok(typeof result.addPanel === 'function');
        assert.ok(typeof result.initialize === 'function');
    });    

    test('createPanel() should throw on unknown panel class', async () => {
        const panelDefinition = { panelclass: 'UnknownPanel' };
        const panel = {};
    
        let errorCaught = false;
        try {
            await app.createPanel(panel, panelDefinition, 'panelId');
        } catch (e) {
            errorCaught = e.message.includes('Panel class not found');
        }
    
        assert.strictEqual(errorCaught, true);
    });
    
    test('displaySuccessMessage() should call showInformationMessage', () => {
        let messageDisplayed = '';
        vscode.window.showInformationMessage = (msg) => {
            messageDisplayed = msg;
        };
    
        app.displaySuccessMessage('Success!');
    
        assert.strictEqual(messageDisplayed, 'Success!');
    });
    
    test('switchActivityTask() should reset panels and initialize activity', async () => {
        app.initializeActivity = async () => { app.activityManager = { setSelectedActivity: () => {}, getSelectedActivity: () => 'activity' }; };
        app.initializePanels = async () => { app.panels.push('panel1'); };
        app.panels = [];
    
        await app.switchActivityTask('taskId');
    
        assert.strictEqual(app.activity, 'activity');
        assert.deepStrictEqual(app.panels, ['panel1']);
    });

});
