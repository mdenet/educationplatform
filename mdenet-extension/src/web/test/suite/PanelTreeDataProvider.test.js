import * as assert from 'assert';
import { PanelTreeDataProvider } from '../../providers/PanelTreeDataProvider';
suite('PanelTreeDataProvider Test Suite', () => {

    test('should initialise with empty panels array', () => {
        const provider = new PanelTreeDataProvider();
        assert.deepStrictEqual(provider.panels, []);
    });

    test('should set panels and refresh', () => {
        const provider = new PanelTreeDataProvider();

        let refreshCalled = false;
        provider.refresh = () => { refreshCalled = true; };

        const mockPanels = [{ getTitle: () => 'Panel 1' }, { getTitle: () => 'Panel 2' }];
        provider.setPanels(mockPanels);

        assert.deepStrictEqual(provider.panels, mockPanels);
        assert.strictEqual(refreshCalled, true);
    });

    test('should remove panels and refresh', () => {
        const provider = new PanelTreeDataProvider();

        let refreshCalled = false;
        provider.refresh = () => { refreshCalled = true; };

        const mockPanels = [{ getTitle: () => 'Panel 1' }];
        provider.setPanels(mockPanels);
        provider.removePanels();

        assert.deepStrictEqual(provider.panels, []);
        assert.strictEqual(refreshCalled, true);
    });

    test('getTreeItem should return a leaf item (no children)', () => {
        const provider = new PanelTreeDataProvider();
        const element = { label: 'Leaf Panel', object: {}, children: [] };

        const treeItem = provider.getTreeItem(element);
        assert.strictEqual(treeItem.label, 'Leaf Panel');
        assert.strictEqual(treeItem.iconPath.id, 'layers');
        assert.ok(treeItem.command);
        assert.strictEqual(treeItem.command.command, 'panels.displayPanel');
        assert.deepStrictEqual(treeItem.command.arguments, [{}]);
    });

    test('getTreeItem should return a collapsible parent item', () => {
        const provider = new PanelTreeDataProvider();
        const element = { label: 'Parent Panel', children: [{}] };

        const treeItem = provider.getTreeItem(element);
        assert.strictEqual(treeItem.label, 'Parent Panel');
        assert.strictEqual(treeItem.iconPath.id, 'layers');
        assert.strictEqual(treeItem.collapsibleState, 1);
        assert.strictEqual(treeItem.command, undefined);
    });

    test('getChildren should return root panels', async () => {
        const provider = new PanelTreeDataProvider();
        const mockPanels = [
            { getTitle: () => 'Panel 1', getChildren: () => [] },
            { getTitle: () => 'Panel 2', getChildren: () => [] }
        ];
        provider.setPanels(mockPanels);

        const children = await provider.getChildren();
        assert.strictEqual(children.length, 2);
        assert.strictEqual(children[0].label, 'Panel 1');
        assert.strictEqual(children[1].label, 'Panel 2');
    });

    test('getChildren should return nested children', async () => {
        const provider = new PanelTreeDataProvider();

        const mockChild = { getTitle: () => 'Child Panel', getChildren: () => [] };
        const mockParent = { getTitle: () => 'Parent Panel', getChildren: () => [mockChild] };
        provider.setPanels([mockParent]);

        const rootChildren = await provider.getChildren();
        const nestedChildren = await provider.getChildren(rootChildren[0]);

        assert.strictEqual(nestedChildren.length, 1);
        assert.strictEqual(nestedChildren[0].label, 'Child Panel');
    });

    test('getChildren should handle panels with no getChildren method', async () => {
        const provider = new PanelTreeDataProvider();
        const panelWithoutChildren = { getTitle: () => 'No Children' };

        provider.setPanels([panelWithoutChildren]);
        const children = await provider.getChildren();
        assert.strictEqual(children[0].label, 'No Children');
        assert.deepStrictEqual(children[0].children, []);
    });

    test('getChildren should handle child panels with no getChildren method', async () => {
        const provider = new PanelTreeDataProvider();
        const child = { getTitle: () => 'Child' };
        const parent = { getTitle: () => 'Parent', getChildren: () => [child] };

        provider.setPanels([parent]);
        const rootChildren = await provider.getChildren();
        const nestedChildren = await provider.getChildren(rootChildren[0]);

        assert.strictEqual(nestedChildren[0].label, 'Child');
        assert.deepStrictEqual(nestedChildren[0].children, []);
    });

});
