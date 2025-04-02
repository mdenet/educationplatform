import * as assert from 'assert';
import { ExtensionCompositePanel } from '../../ExtensionCompositePanel';
suite('ExtensionCompositePanel Test Suite', () => {

    test('should create composite panel with default id', () => {
        const panel = new ExtensionCompositePanel();
        assert.strictEqual(panel.id, 'composite');
        assert.deepStrictEqual(panel.getChildren(), []);
    });

    test('should add child panels', () => {
        const panel = new ExtensionCompositePanel('myComposite');
        const mockPanel1 = { id: 'child1' };
        const mockPanel2 = { id: 'child2' };

        panel.addPanel(mockPanel1);
        panel.addPanel(mockPanel2);

        const children = panel.getChildren();
        assert.strictEqual(children.length, 2);
        assert.strictEqual(children[0].id, 'child1');
        assert.strictEqual(children[1].id, 'child2');
    });

    test('initialize() should await initialize on each child panel', async () => {
        const callOrder = [];

        const childPanel1 = {
            initialize: async () => {
                callOrder.push('child1');
            }
        };

        const childPanel2 = {
            initialize: async () => {
                callOrder.push('child2');
            }
        };

        const panel = new ExtensionCompositePanel();
        panel.addPanel(childPanel1);
        panel.addPanel(childPanel2);

        await panel.initialize();

        assert.deepStrictEqual(callOrder, ['child1', 'child2']);
    });

    test('initialize() should not fail when there are no child panels', async () => {
        const panel = new ExtensionCompositePanel();
        await panel.initialize();
        assert.ok(true, 'initialize() completed without errors');
    });

    test('should not add invalid panels', async () => {
        const panel = new ExtensionCompositePanel();
        const invalidPanel = { id: 'invalid' };

        panel.addPanel(invalidPanel);

        let errorCaught = false;

        try {
            await panel.initialize();
        } catch (e) {
            errorCaught = true;
            assert.ok(e instanceof TypeError || e instanceof Error);
        }

        assert.ok(errorCaught, 'initialize() should throw error if a child panel is invalid');
    });
    
});
