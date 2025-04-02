import * as assert from 'assert';
import { ActivityTreeDataProvider } from '../../providers/ActivityTreeDataProvider';

suite('ActivityTreeDataProvider Test Suite', () => {

    test('should set playing file and refresh', () => {
        const provider = new ActivityTreeDataProvider();

        let refreshCalled = false;
        const originalRefresh = provider.refresh;
        provider.refresh = () => { refreshCalled = true; };

        const mockFile = { label: 'activity1' };
        provider.setPlaying(mockFile);

        assert.strictEqual(provider.playingFile, 'activity1');
        assert.strictEqual(refreshCalled, true);

        provider.refresh = originalRefresh;
    });

    test('should set stopped and refresh', () => {
        const provider = new ActivityTreeDataProvider();

        let refreshCalled = false;
        const originalRefresh = provider.refresh;
        provider.refresh = () => { refreshCalled = true; };

        provider.setStopped();

        assert.strictEqual(provider.playingFile, null);
        assert.strictEqual(refreshCalled, true);

        provider.refresh = originalRefresh;
    });

    test('should return a tree item with play icon and command when not playing', () => {
        const provider = new ActivityTreeDataProvider();
        const element = { label: 'activity1' };
        const treeItem = provider.getTreeItem(element);

        assert.strictEqual(treeItem.label, 'activity1');
        assert.strictEqual(treeItem.iconPath.id, 'debug-start');
        assert.strictEqual(treeItem.command.command, 'activities.play');
        assert.strictEqual(treeItem.contextValue, 'activityItem');
    });

    test('should return a tree item with stop icon and command when playing', () => {
        const provider = new ActivityTreeDataProvider();
        const element = { label: 'activity1' };
        provider.setPlaying(element);

        const treeItem = provider.getTreeItem(element);

        assert.strictEqual(treeItem.iconPath.id, 'debug-stop');
        assert.strictEqual(treeItem.command.command, 'activities.stop');
    });

    test('should return children from LocalRepoManager', async () => {
        // This will mock the LocalRepoManager class
        const stubLocalRepoManager = {
            async initialize(){ 
                // do nothing
             },
            getFiles() {
                return ['activity1', 'activity2'];
            }
        };
    
        const provider = new ActivityTreeDataProvider(stubLocalRepoManager);
        const children = await provider.getChildren();
    
        assert.deepStrictEqual(children, [
            { label: 'activity1' },
            { label: 'activity2' }
        ]);
    });

});
