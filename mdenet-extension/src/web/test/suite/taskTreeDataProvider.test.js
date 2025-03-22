import * as assert from 'assert';
import { TaskTreeDataProvider } from '../../providers/TaskTreeDataProvider';

suite('TaskTreeDataProvider Test Suite', () => {

    test('should set tasks correctly', () => {
        const provider = new TaskTreeDataProvider();
        const tasks = [{ id: '1', title: 'Task One' }, { id: '2', title: 'Task Two' }];
        
        let refreshCalled = false;
        provider.refresh = () => { refreshCalled = true; };

        provider.setTasks(tasks);
        assert.deepStrictEqual(provider.tasks, tasks);
        assert.strictEqual(refreshCalled, true);
    });

    test('should hide all tasks', () => {
        const provider = new TaskTreeDataProvider();
        const tasks = [{ id: '1', title: 'Task One' }, { id: '2', title: 'Task Two' }];
        provider.setTasks(tasks);

        provider.hideAllTasks();
        assert.strictEqual(provider.hiddenTasks.size, 2);
        assert.ok(provider.hiddenTasks.has('1'));
        assert.ok(provider.hiddenTasks.has('2'));
    });

    test('should show all tasks', () => {
        const provider = new TaskTreeDataProvider();
        const tasks = [{ id: '1', title: 'Task One' }, { id: '2', title: 'Task Two' }];
        provider.setTasks(tasks);
        provider.hideAllTasks();

        provider.showAllTasks();
        assert.strictEqual(provider.hiddenTasks.size, 0);
    });

    test('should hide a single task', () => {
        const provider = new TaskTreeDataProvider();
        const tasks = [{ id: '1', title: 'Task One' }];
        provider.setTasks(tasks);

        provider.hideTask('1');
        assert.ok(provider.hiddenTasks.has('1'));
    });

    test('should show a single hidden task', () => {
        const provider = new TaskTreeDataProvider();
        const tasks = [{ id: '1', title: 'Task One' }];
        provider.setTasks(tasks);
        provider.hideTask('1');

        provider.showTask('1');
        assert.ok(!provider.hiddenTasks.has('1'));
    });

    test('getTreeItem should return correct TreeItem', () => {
        const provider = new TaskTreeDataProvider();
        const element = { label: 'My Task', id: '1' };
        const treeItem = provider.getTreeItem(element);

        assert.strictEqual(treeItem.label, 'My Task');
        assert.strictEqual(treeItem.iconPath.id, 'tasklist');
        assert.strictEqual(treeItem.command.command, 'tasks.select');
        assert.deepStrictEqual(treeItem.command.arguments, ['1']);
    });

    test('getChildren should return visible tasks only', async () => {
        const provider = new TaskTreeDataProvider();
        const tasks = [
            { id: '1', title: 'Task One' },
            { id: '2', title: 'Task Two' }
        ];
        provider.setTasks(tasks);
        provider.hideTask('1');

        const children = await provider.getChildren();
        assert.deepStrictEqual(children, [{ label: 'Task Two', id: '2' }]);
    });

    test('showTask should be a no-op if task is already visible', () => {
        const provider = new TaskTreeDataProvider();
        const tasks = [{ id: '1', title: 'Task One' }];
        provider.setTasks(tasks);
    
        // Task '1' is not hidden
        provider.showTask('1'); // should not throw or change anything
        assert.ok(!provider.hiddenTasks.has('1'));
    });

    test('getChildren should return empty array if all tasks are hidden', async () => {
        const provider = new TaskTreeDataProvider();
        const tasks = [{ id: '1', title: 'Task One' }];
        provider.setTasks(tasks);
        provider.hideAllTasks();
    
        const children = await provider.getChildren();
        assert.deepStrictEqual(children, []);
    });

    test('refresh should fire an event', () => {
        const provider = new TaskTreeDataProvider();
        let eventFired = false;
        provider._onDidChangeTreeData.event(() => { eventFired = true; });
    
        provider.refresh();
        assert.strictEqual(eventFired, true);
    });    

});
