import * as assert from 'assert';
import { ExtensionButton } from '../../ExtensionButton';
suite('ExtensionButton Test Suite', () => {

    test('should create a BUTTON_HELP when url is provided', () => {
        const config = {
            id: 'help-btn',
            icon: 'info',
            hint: 'Help Button',
            url: 'https://example.com'
        };

        const button = new ExtensionButton(config, 'panel1');

        assert.strictEqual(button.id, 'help-btn');
        assert.strictEqual(button.icon, 'info');
        assert.strictEqual(button.hint, 'Help Button');
        assert.strictEqual(button.type, 'BUTTON_HELP');
        assert.deepStrictEqual(button.actionData, {
            type: 'openExternal',
            url: 'https://example.com'
        });
    });

    test('should create a BUTTON_ACTION when actionfunction is provided', () => {
        const config = {
            id: 'action-btn',
            icon: 'play',
            hint: 'Run Action',
            actionfunction: 'doSomething'
        };

        const button = new ExtensionButton(config, 'panel2');

        assert.strictEqual(button.id, 'action-btn');
        assert.strictEqual(button.icon, 'play');
        assert.strictEqual(button.hint, 'Run Action');
        assert.strictEqual(button.type, 'BUTTON_ACTION');
        assert.deepStrictEqual(button.actionData, {
            type: 'runAppAction',
            parentPanel: 'panel2',
            buttonId: 'action-btn'
        });
    });

    test('should log unknown key when neither url nor actionfunction are provided', () => {
        const config = {
            id: 'invalid-btn',
            icon: 'alert',
            hint: 'Invalid Button'
        };
    
        const button = new ExtensionButton(config, 'panel3');
    
        assert.strictEqual(button.type, undefined);
        assert.strictEqual(button.actionData, undefined);
    
    });

    test('createButtons() should create multiple ExtensionButton instances', () => {
        const configs = [
            { id: 'btn1', url: 'https://example.com' },
            { id: 'btn2', actionfunction: 'doSomething' }
        ];

        const buttons = ExtensionButton.createButtons(configs, 'panel1');
        assert.strictEqual(buttons.length, 2);
        assert.ok(buttons[0] instanceof ExtensionButton);
        assert.ok(buttons[1] instanceof ExtensionButton);

        assert.strictEqual(buttons[0].type, 'BUTTON_HELP');
        assert.strictEqual(buttons[1].type, 'BUTTON_ACTION');
    });

});
