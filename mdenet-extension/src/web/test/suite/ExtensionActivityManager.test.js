import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionActivityManager } from '../../ExtensionActivityManager';

suite('ExtensionActivityManager Test Suite', () => {

    let manager;
    let mockContext;
    let mockProvider;
    let mockFileHandler;

    setup(() => {
        mockProvider = {
            setTasks: () => {},
            hideAllTasks: () => {},
            showTask: () => {},
            hideTask: () => {}
        };

        mockContext = {
            workspaceState: {
                get: () => null,
                keys: () => []
            }
        };

        mockFileHandler = {
            fetchActivityFile: async () => '{}'
        };

        manager = new ExtensionActivityManager(
            () => {},
            mockFileHandler,
            mockProvider,
            mockContext,
            'testLabel'
        );

        manager.activities = {
            activity1: { id: 'activity1' },
            activity2: { id: 'activity2' }
        };
    });

    test('fetchActivities() should process config', async () => {
        manager.processActivityConfig = (content, errors) => { errors.push('error1'); return errors; };
        const result = await manager.fetchActivities();
        assert.deepStrictEqual(result, ['error1']);
    });

    test('fetchActivities() should handle fileHandler throwing error', async () => {
        manager.fileHandler.fetchActivityFile = async () => { throw new Error('fetch error'); };
        const result = await manager.fetchActivities();
        assert.ok(result[0] instanceof Error);
    });

    test('fetchActivities() should skip processing when fileContent is null', async () => {
        manager.fileHandler.fetchActivityFile = async () => null;
        const result = await manager.fetchActivities();
        assert.deepStrictEqual(result, []);
    });

    test('getPanelFileLocation() should return the panel URL', () => {
        const url = manager.getPanelFileLocation('testPath');
        assert.strictEqual(url, 'testPath');
    });

    test('handlePanelFile() should assign file to panel', () => {
        const panel = {};
        manager.handlePanelFile(panel, 'myfile');
        assert.strictEqual(panel.file, 'myfile');
    });

    test('fetchFile() should return file URL', () => {
        const filePath = manager.fetchFile('http://example.com');
        assert.strictEqual(filePath, 'http://example.com');
    });

    test('createActivitiesMenu() should store activities', () => {
        let stored = [];
        manager.storeActivity = (activity) => { stored.push(activity.id); };
        manager.createActivitiesMenu({ activities: [{ id: 'activity1' }, { id: 'activity2' }] });
        assert.deepStrictEqual(stored, ['activity1', 'activity2']);
    });

    test('createActivitiesMenu() should warn if no activities', () => {
        let warned = '';
        vscode.window.showWarningMessage = (msg) => { 
            warned = msg; 
        };
        manager.createActivitiesMenu({});
        assert.ok(warned.includes('No activities'));
    });

    test('createActivitiesMenu() should skip storing activity when activity.id is missing', () => {
        let storeCalled = false;
        manager.storeActivity = () => { 
            storeCalled = true; 
        };
        manager.createActivitiesMenu({ 
            activities: [{}] 
        });
        assert.strictEqual(storeCalled, false);
    });

    test('setActivityVisibility() should call showTask() when visible', () => {
        let called = '';
        mockProvider.showTask = (id) => { 
            called = id; 
        };
        manager.setActivityVisibility('activity3', true);
        assert.strictEqual(called, 'activity3');
    });

    test('setActivityVisibility() should call hideTask() when not visible', () => {
        let called = '';
        mockProvider.hideTask = (id) => { called = id; };
        manager.setActivityVisibility('activity4', false);
        assert.strictEqual(called, 'activity4');
    });

    test('isPanelGenerated() should return true when panel id exists in session storage', () => {
        mockContext.workspaceState.get = () => 'exists';
        assert.strictEqual(manager.isPanelGenerated('somePanel'), true);
    });

    test('isPanelGenerated() should return false when panel id does not exist in session storage', () => {
        mockContext.workspaceState.get = () => null;
        assert.strictEqual(manager.isPanelGenerated('somePanel'), false);
    });

    test('interpolate() should replace keys with values', () => {
        mockContext.workspaceState.keys = () => ['KEY1'];
        mockContext.workspaceState.get = (key) => key === 'KEY1' ? 'https://value/' : null;
        const interpolated = manager.interpolate('{{ID-KEY1}}');
        assert.strictEqual(interpolated, 'https://value');
    });

    test('interpolate() should skip "isAuthenticated" key', () => {
        mockContext.workspaceState.keys = () => ['isAuthenticated'];
        const result = manager.interpolate('{{ID-isAuthenticated}}');
        assert.strictEqual(result, '{{ID-isAuthenticated}}');
    });

    test('setSelectedActivity() should store activityId', () => {
        manager.setSelectedActivity('activity4');
        assert.strictEqual(manager.activityId, 'activity4');
    });

    test('showActivitiesNavEntries() hides generated panels', () => {
        let called = [];
        manager.hasGeneratedPanel = (id) => id === 'activity1';
        manager.setActivityVisibility = (id, visible) => called.push({ id, visible });
        manager.showActivitiesNavEntries();

        assert.deepStrictEqual(called, [
            { id: 'activity1', visible: false },
            { id: 'activity2', visible: true }
        ]);
    });

    test('showActivitiesNavEntries() shows all panels when no generated panels', () => {
        let called = [];
        manager.hasGeneratedPanel = () => false;
        manager.setActivityVisibility = (id, visible) => called.push({ id, visible });
        manager.showActivitiesNavEntries();

        assert.deepStrictEqual(called, [
            { id: 'activity1', visible: true },
            { id: 'activity2', visible: true }
        ]);
    });

    test('showActivitiesNavEntries() hides all panels when all are generated', () => {
        let called = [];
        manager.hasGeneratedPanel = () => true;
        manager.setActivityVisibility = (id, visible) => called.push({ id, visible });
        manager.showActivitiesNavEntries();

        assert.deepStrictEqual(called, [
            { id: 'activity1', visible: false },
            { id: 'activity2', visible: false }
        ]);
    });

    test('fetchFile() should return local path using fileHandler.getPath when not a URL', () => {
        mockFileHandler.getPath = (filePath) => `/mock/root/${filePath}`;
        const result = manager.fetchFile('local/path/file.json');
        assert.strictEqual(result, '/mock/root/local/path/file.json');
    });
    

});
