import * as vscode from 'vscode';
import * as extension from '../../extension';
import { strict as assert } from 'assert';

suite('Extension Activation Tests', () => {
    let contextMock;
    let vscodeMocks;

    setup(() => {
        vscodeMocks = {
            window: {
                registerTreeDataProvider: createSpy(),
                showErrorMessage: createSpy(),
                showInformationMessage: createSpy(),
                showQuickPick: createAsyncSpy(),
                activeTextEditor: null,
            },
            commands: {
                registerCommand: createSpy((name, callback) => {
                    vscodeMocks._registeredCommands[name] = callback;
                }),
                executeCommand: createSpy(),
            },
            env: {
                openExternal: createSpy(),
            },
            _registeredCommands: {},
        };

        patchVSCode(vscode, vscodeMocks);

        contextMock = {
            subscriptions: [],
            workspaceState: {
                keys: () => ['key1', 'key2'],
                update: () => {}
            }
        };
    });

    teardown(() => {
        unpatchVSCode(vscode);
        vscodeMocks = null;
    });

    test('should register tree providers and all commands', () => {
        extension.activate(contextMock);
        assert.equal(vscodeMocks.window.registerTreeDataProvider.calls.length, 3);
        assert.equal(Object.keys(vscodeMocks._registeredCommands).length, 8);
    });

    test('should handle activities.refresh command', () => {
        let refreshed = false;
        extension.activate(contextMock);

        const [[, activityProvider]] = vscodeMocks.window.registerTreeDataProvider.calls.filter(call => call[0] === 'activities');
        activityProvider.refresh = () => { refreshed = true; };

        vscodeMocks._registeredCommands['activities.refresh']();

        assert(refreshed);
        assert(vscodeMocks.window.showInformationMessage.calls[0][0].includes('Refreshing'));
    });

    test('should handle activities.stop command', () => {
        let stopped = false;
        let clearedTasks = false;
        let clearedPanels = false;

        extension.activate(contextMock);

        const panelProvider = { setPanels: (p) => { if (p.length === 0) clearedPanels = true; } };
        const taskProvider = { setTasks: (p) => { if (p.length === 0) clearedTasks = true; } };
        const activityProvider = { setStopped: () => { stopped = true; } };

        // rewire the providers by capturing from calls
        vscodeMocks.window.registerTreeDataProvider.calls.forEach(call => {
            if (call[0] === 'activities') Object.assign(call[1], activityProvider);
            if (call[0] === 'tasks') Object.assign(call[1], taskProvider);
            if (call[0] === 'panels') Object.assign(call[1], panelProvider);
        });

        vscodeMocks._registeredCommands['activities.stop']({ label: 'myActivity' });

        assert(stopped);
        assert(clearedTasks);
        assert(clearedPanels);
        assert(vscodeMocks.window.showInformationMessage.calls[0][0].includes('Stopped myActivity'));
    });

    test('should handle panels.displayPanel command', () => {
        let panelDisplayed = false;
        extension.activate(contextMock);
        vscodeMocks._registeredCommands['panels.displayPanel']({
            displayPanel: () => { panelDisplayed = true; }
        });
        assert(panelDisplayed);
    });

    test('should insert guillemets snippet', () => {
        let snippetInserted = false;
        vscodeMocks.window.activeTextEditor = {
            insertSnippet: () => { snippetInserted = true; }
        };

        extension.activate(contextMock);
        vscodeMocks._registeredCommands['extension.insertGuillemets']();

        assert(snippetInserted);
    });

    test('should handle button.run with openExternal action', () => {
        extension.activate(contextMock);
        vscodeMocks._registeredCommands['button.run']({
            actionData: { type: 'openExternal', url: 'https://example.com' }
        });
        assert.equal(vscodeMocks.env.openExternal.calls.length, 1);
    });

    test('should run panels.run with editor and trigger action handler', async () => {
		vscodeMocks.window.showQuickPick.willResolve('Option A');
		vscodeMocks.window.activeTextEditor = { document: {} };
	
		const fakeButton = {
			hint: 'Option A',
			actionData: { type: 'openExternal', url: 'https://example.com' }
		};
	
		const panel = {
			doc: vscodeMocks.window.activeTextEditor.document,
			getButtons: () => [fakeButton]
		};
	
		const fakeApp = {
			panels: [panel],
			runAction: () => {}
		};
	
		extension.activate(contextMock, fakeApp);
	
		await vscodeMocks._registeredCommands['panels.run']();
	
		assert.equal(vscodeMocks.env.openExternal.calls.length, 1);
	});
	

    test('should fallback if no editor is active', async () => {
        vscodeMocks.window.activeTextEditor = null;
        extension.activate(contextMock);
        await vscodeMocks._registeredCommands['panels.run']();
        assert(vscodeMocks.window.showInformationMessage.calls[0][0].includes('Press the buttons inside the panel'));
    });

	test('should skip if task is already selected', async () => {
		const fakeTaskId = 'task-1';
	
		const fakeApp = {
			activity: { id: fakeTaskId }
		};
	
		extension.activate(contextMock, fakeApp);
	
		await vscodeMocks._registeredCommands['tasks.select'](fakeTaskId);
	
		assert.equal(vscodeMocks.commands.executeCommand.calls.length, 0);
		assert.equal(vscodeMocks.window.showErrorMessage.calls.length, 0);
	});
	
	
	test('should switch task and set panels', async () => {
		const fakeTaskId = 'new-task';
	
		let panelsSet = false;
	
		const fakeApp = {
			activity: { id: 'old-task' },
			switchActivityTask: createAsyncSpy(),
			getVisiblePanels: () => ['panelA']
		};
	
		const panelProvider = { setPanels: (p) => { if (p.includes('panelA')) panelsSet = true; } };
	
		extension.activate(contextMock, fakeApp);
	
		// Inject fake panelProvider
		vscodeMocks.window.registerTreeDataProvider.calls.forEach(call => {
			if (call[0] === 'panels') Object.assign(call[1], panelProvider);
		});
	
		await vscodeMocks._registeredCommands['tasks.select'](fakeTaskId);
	
		assert.equal(vscodeMocks.commands.executeCommand.calls[0][0], 'workbench.action.closeAllEditors');
		assert(fakeApp.switchActivityTask.calls.length > 0);
		assert(panelsSet);
	});
	
	
	test('should show error message if switchActivityTask throws', async () => {
		const fakeTaskId = 'throw-task';
	
		const fakeApp = {
			activity: { id: 'old-task' },
			switchActivityTask: async () => { throw new Error('task switch failed'); },
			getVisiblePanels: () => []
		};
	
		extension.activate(contextMock, fakeApp);
	
		await vscodeMocks._registeredCommands['tasks.select'](fakeTaskId);
	
		const msg = vscodeMocks.window.showErrorMessage.calls[0][0];
		assert(msg.includes('Error switching task: task switch failed'));
	});

	test('should call app.runAction from runAppAction handler', () => {
		const fakeApp = {
			runAction: createSpy()
		};
	
		extension.activate(contextMock, fakeApp);
	
		const fakeButton = {
			actionData: {
				type: 'runAppAction',
				parentPanel: 'panel-1',
				buttonId: 'button-42'
			}
		};
	
		vscodeMocks._registeredCommands['button.run'](fakeButton);
	
		assert.deepEqual(fakeApp.runAction.calls[0], ['panel-1', 'button-42']);
	});
	
});

function createSpy(fn) {
    const spy = (...args) => {
        spy.calls.push(args);
        if (fn) return fn(...args);
    };
    spy.calls = [];
    return spy;
}

function createAsyncSpy(fn) {
    const spy = (...args) => {
        spy.calls.push(args);
        return spy._resolveWith !== undefined
            ? Promise.resolve(spy._resolveWith)
            : Promise.resolve(fn ? fn(...args) : undefined);
    };
    spy.calls = [];
    spy.willResolve = (val) => { spy._resolveWith = val; };
    return spy;
}

function patchVSCode(vscodeModule, mock) {
    vscodeModule.window = mock.window;
    vscodeModule.commands = mock.commands;
    vscodeModule.env = mock.env;
    vscodeModule.Uri = {
        parse: (url) => ({ toString: () => url })
    };
}

function unpatchVSCode(vscodeModule) {
    delete vscodeModule.window;
    delete vscodeModule.commands;
    delete vscodeModule.env;
}
