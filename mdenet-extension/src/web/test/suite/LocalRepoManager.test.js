import { strict as assert } from 'assert';
import * as vscode from 'vscode';
import { LocalRepoManager } from '../../LocalRepoManager';

suite('LocalRepoManager Tests', () => {
    let vscodeMocks;

    setup(() => {
        vscodeMocks = {
            workspace: {
                workspaceFolders: [{ uri: { fsPath: '/mock/path', toString: () => '/mock/path' } }],
                fs: {
                    readDirectory: async () => [],
                    readFile: async () => new TextEncoder().encode('mock file content')
                }
            },
            FileType: {
                File: 1,
                Directory: 2
            },
            Uri: {
                joinPath: (...parts) => parts.join('/'),
                parse: (url) => ({ toString: () => url })
            }
        };
        patchVSCode(vscode, vscodeMocks);

        // Reset singleton between tests
        delete LocalRepoManager.instance;
    });

    teardown(() => {
        unpatchVSCode(vscode);
    });

    test('should enforce singleton', () => {
        const instance1 = new LocalRepoManager();
        const instance2 = new LocalRepoManager();
        assert.strictEqual(instance1, instance2);
    });

    test('should not initialize if no workspace folders', async () => {
        vscode.workspace.workspaceFolders = null;
        const manager = new LocalRepoManager();
        await manager.initialize();
        assert.deepEqual(manager.getFiles(), []);
    });

    test('should handle readDirectory() error', async () => {
        vscodeMocks.workspace.fs.readDirectory = async () => { throw new Error('dir error'); };
        const manager = new LocalRepoManager();
        await manager.initialize();
        assert.deepEqual(manager.getFiles(), []);
    });

    test('should ignore non-matching files', async () => {
        vscodeMocks.workspace.fs.readDirectory = async () => [
            ['file.txt', vscode.FileType.File],
            ['other.json', vscode.FileType.File]
        ];
        const manager = new LocalRepoManager();
        await manager.initialize();
        assert.deepEqual(manager.getFiles(), []);
    });

    test('should collect matching files', async () => {
        vscodeMocks.workspace.fs.readDirectory = async () => [
            ['my.activity.json', vscode.FileType.File],
            ['workflow.activity.yml', vscode.FileType.File],
            ['random.txt', vscode.FileType.File]
        ];
        const manager = new LocalRepoManager();
        await manager.initialize();
        assert.deepEqual(manager.getFiles(), ['my.activity.json', 'workflow.activity.yml']);
    });

    test('should throw when fetching file without workspace', async () => {
        vscode.workspace.workspaceFolders = null;
        const manager = new LocalRepoManager();
        const result = await manager.fetchActivityFile('my.activity.json');
        await assert.deepEqual(result, undefined); 
    });

    test('should fetch and decode file content', async () => {
        const manager = new LocalRepoManager();
        const content = await manager.fetchActivityFile('my.activity.json');
        assert.equal(content, 'mock file content');
    });

    test('should handle error in fetchActivityFile()', async () => {
        vscodeMocks.workspace.fs.readFile = async () => { throw new Error('read error'); };
        const manager = new LocalRepoManager();
        const result = await manager.fetchActivityFile('bad.activity.json');
        assert.deepEqual(result, undefined);
    });
});

//
// ---- Spy Helpers ----
//

function patchVSCode(vscodeModule, mock) {
    vscodeModule.workspace = mock.workspace;
    vscodeModule.FileType = mock.FileType;
    vscodeModule.Uri = mock.Uri;
}

function unpatchVSCode(vscodeModule) {
    delete vscodeModule.workspace;
    delete vscodeModule.FileType;
    delete vscodeModule.Uri;
}
