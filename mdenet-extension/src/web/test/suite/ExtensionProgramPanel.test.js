import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionProgramPanel } from '../../ExtensionProgramPanel';
suite('ExtensionProgramPanel Test Suite', () => {
    let mockDoc;
    let originalFetch;

    setup(() => {
        originalFetch = global.fetch;

        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            value: [{ uri: { fsPath: '/mock/workspace' } }],
            configurable: true
        });

        mockDoc = {
            isClosed: false,
            getText: () => 'mock file contents'
        };
        vscode.workspace.openTextDocument = async () => mockDoc;
        vscode.window.showTextDocument = async () => {};
    });

    teardown(() => {
        global.fetch = originalFetch;
        delete vscode.workspace.workspaceFolders;
        delete vscode.workspace.openTextDocument;
        delete vscode.window.showTextDocument;
    });

    test('initialize() should open local file when fileLocation is local', async () => {
        const panel = new ExtensionProgramPanel('panel1', 'localFile.txt');
        await panel.initialize();
        assert.strictEqual(panel.doc, mockDoc);
    });

    test('initialize() should fetch remote file when fileLocation is a URL', async () => {
        global.fetch = async () => ({
            ok: true,
            text: async () => 'remote file content'
        });

        const panel = new ExtensionProgramPanel('panel2', 'http://example.com/file.txt');
        await panel.initialize();
        assert.strictEqual(panel.content, 'remote file content');
    });

    test('fetchRemoteFile() should handle failed fetch and create error doc', async () => {
        global.fetch = async () => ({
            ok: false,
            status: 404
        });

        vscode.workspace.openTextDocument = async ({ content }) => {
            return { getText: () => content, isClosed: false };
        };

        const panel = new ExtensionProgramPanel('panel3', 'http://bad-url.com');
        await panel.fetchRemoteFile();
        assert.ok(panel.doc.getText().includes('Error fetching URL content: HTTP error! status: 404'));
    });

    test('displayPanel() should open existing doc if available', async () => {
        let showCalled = false;
        vscode.window.showTextDocument = async (doc, options) => {
            showCalled = true;
            assert.strictEqual(doc, mockDoc);
            assert.deepStrictEqual(options, { preview: false, viewColumn: vscode.ViewColumn.One });
        };

        const panel = new ExtensionProgramPanel('panel4', 'localFile.txt');
        panel.doc = mockDoc;
        await panel.displayPanel();
        assert.ok(showCalled);
    });

    test('displayPanel() should fallback to content if doc is closed', async () => {
        mockDoc.isClosed = true;

        let fallbackDoc;
        vscode.workspace.openTextDocument = async ({ content }) => {
            fallbackDoc = { content, isClosed: false };
            return fallbackDoc;
        };

        const panel = new ExtensionProgramPanel('panel5', 'localFile.txt');
        panel.content = 'cached remote content';
        panel.doc = mockDoc;
        await panel.displayPanel();

        assert.strictEqual(fallbackDoc.content, 'cached remote content');
    });

    test('getValue() should return doc text if doc exists', () => {
        const panel = new ExtensionProgramPanel('panel6', 'localFile.txt');
        panel.doc = mockDoc;
        const value = panel.getValue();
        assert.strictEqual(value, 'mock file contents');
    });

    test('getValue() should return content if no doc is present', () => {
        const panel = new ExtensionProgramPanel('panel7', 'remoteFile');
        panel.content = 'remote-content';
        const value = panel.getValue();
        assert.strictEqual(value, 'remote-content');
    });

    test('openLocalFile() should show error message if file opening fails', async () => {
        let errorMsgShown = '';
        const originalShowError = vscode.window.showErrorMessage;
    
        vscode.workspace.openTextDocument = async () => {
            throw new Error('Mock file open error');
        };
    
        vscode.window.showErrorMessage = (msg) => {
            errorMsgShown = msg;
        };
    
        const panel = new ExtensionProgramPanel('panel9', 'localFile.txt');
        await panel.openLocalFile();
    
        assert.ok(errorMsgShown.includes('Error opening local file: Mock file open error'));
    
        vscode.window.showErrorMessage = originalShowError;
    });
    

});
