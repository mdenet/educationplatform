import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionErrorHandler } from '../../ExtensionErrorHandler';
import { EducationPlatformError } from '../../../../../platform/src/EducationPlatformError';

suite('ExtensionErrorHandler Test Suite', () => {
    let errorHandler;
    let originalShowErrorMessage;

    setup(() => {
        originalShowErrorMessage = vscode.window.showErrorMessage;
        vscode.window.showErrorMessage = (msg) => {
            vscode.window._capturedMessage = msg;
        };
        vscode.window._capturedMessage = null;

        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');

        errorHandler = new ExtensionErrorHandler();
    });

    teardown(() => {
        vscode.window.showErrorMessage = originalShowErrorMessage;
    });

    test('notify() should display only message', () => {
        errorHandler.notify('A simple message');
        assert.strictEqual(vscode.window._capturedMessage, 'A simple message');
    });

    test('notify() should display message and generic error', () => {
        const error = new Error('New Error');
        errorHandler.notify('Something went wrong', error);
        assert.ok(vscode.window._capturedMessage.includes('Something went wrong'));
        assert.ok(vscode.window._capturedMessage.includes('Error - New Error'));
    });

    test('notify() should display EducationPlatformError', () => {
        const eduError = new EducationPlatformError('Custom platform error');
        errorHandler.notify(null, eduError);
        assert.strictEqual(vscode.window._capturedMessage, 'Custom platform error');
    });

    test('notify() should display stringified non-error object', () => {
        errorHandler.notify('A value error', { code: 500 });
        assert.ok(vscode.window._capturedMessage.includes('value - [object Object]'));
    });

    test('notify() should handle null message and null error gracefully', () => {
        errorHandler.notify(null, null);
        assert.strictEqual(vscode.window._capturedMessage, '');
    });

    test('notify() should handle message and primitive error', () => {
        errorHandler.notify('Primitive value error', 'some string');
        assert.ok(vscode.window._capturedMessage.includes('Primitive value error'));
        assert.ok(vscode.window._capturedMessage.includes('value - some string'));
    });
});