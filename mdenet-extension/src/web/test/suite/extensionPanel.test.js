import * as assert from 'assert';
import { ExtensionPanel } from '../../ExtensionPanel';

suite('ExtensionPanel Test Suite', () => {

    test('should create panel with correct id', () => {
        const panel = new ExtensionPanel('panel-1');
        assert.strictEqual(panel.getId(), 'panel-1');
    });

    test('should set and get title', () => {
        const panel = new ExtensionPanel('panel-1');
        panel.setTitle('My Panel');
        assert.strictEqual(panel.getTitle(), 'My Panel');
    });

    test('should set and get buttons', () => {
        const panel = new ExtensionPanel('panel-1');
        const buttons = [{ label: 'Save' }, { label: 'Cancel' }];
        panel.addButtons(buttons);
        assert.deepStrictEqual(panel.getButtons(), buttons);
    });

    test('should set and get icon', () => {
        const panel = new ExtensionPanel('panel-1');
        panel.setIcon('my-icon');
        assert.strictEqual(panel.icon, 'my-icon');
    });

    test('should set type only once', () => {
        const panel = new ExtensionPanel('panel-1');
        panel.setType('output-panel');
        assert.strictEqual(panel.getType(), 'output-panel');
    });

    test('should throw if setType is called twice', () => {
        const panel = new ExtensionPanel('panel-1');
        panel.setType('output-panel');

        assert.throws(() => {
            panel.setType('input-panel');
        }, /Panel type has been previously set/);
    });

});
