import * as assert from 'assert';
import * as sinon from 'sinon';
import { ActivityTreeDataProvider } from '../../../ActivityTreeDataProvider';

suite('ActivityTreeDataProvider Test Suite', () => {

    let sandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
    });

    teardown(() => {
        sandbox.restore();
    });

    test('should set playing file and refresh', () => {
        const provider = new ActivityTreeDataProvider();
        const refreshSpy = sandbox.spy(provider, 'refresh');
        
        const mockFile = { label: 'activity1' };
        provider.setPlaying(mockFile);
        
        assert.strictEqual(provider.playingFile, 'activity1');
        assert.ok(refreshSpy.calledOnce);
    });

    test('should set stopped and refresh', () => {
        const provider = new ActivityTreeDataProvider();
        const refreshSpy = sandbox.spy(provider, 'refresh');
        
        provider.setStopped();
        
        assert.strictEqual(provider.playingFile, null);
        assert.ok(refreshSpy.calledOnce);
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

});
