import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionOutputPanel } from '../../ExtensionOutputPanel';

suite('ExtensionOutputPanel Test Suite', () => {

    let mockPanel;

    setup(() => {
        mockPanel = {
            webview: {
                _html: '',
                postMessage: () => {},
                onDidReceiveMessage: () => {},
                set html(value) { this._html = value; },
                get html() { return this._html; }
            },
            reveal: () => {},
            onDidDispose: () => {},
            onDidChangeViewState: () => {}
        };
    
        vscode.window.createWebviewPanel = () => mockPanel;
        vscode.commands.executeCommand = () => {};
        vscode.window.showErrorMessage = () => {};
    });

    test('should create instance with correct properties', () => {
        const panel = new ExtensionOutputPanel('id1', 'My Output Panel', 'plaintext');
        assert.strictEqual(panel.id, 'id1');
        assert.strictEqual(panel.name, 'My Output Panel');
        assert.strictEqual(panel.language, 'plaintext');
    });

    test('setGeneratedFiles() should reset state and create panel', () => {
        const panel = new ExtensionOutputPanel('id2', 'Test', 'multi');
        panel.displayPanel = () => { 
            panel.panel = mockPanel; 
        };

        panel.setGeneratedFiles([{ path: 'file1.txt', content: 'content1' }]);

        assert.deepStrictEqual(panel.generatedFiles.length, 1);
        assert.strictEqual(panel.selectedFilePath, null);
        assert.strictEqual(panel.currentContent, null);
    });

    test('handleWebviewMessage() should trigger runButton()', () => {
        const panel = new ExtensionOutputPanel('id3', 'Test', 'multi');
        panel.buttons = [{ id: 'btn1', hint: 'Run' }];

        let commandCalled = false;
        vscode.commands.executeCommand = (cmd, btn) => {
            if (cmd === 'button.run' && btn.id === 'btn1') {
                commandCalled = true;
            }
        };

        panel.handleWebviewMessage({ command: 'button.run', button: 'btn1' });

        assert.strictEqual(commandCalled, true);
    });

    test('handleWebviewMessage() should call selectFile()', () => {
        const panel = new ExtensionOutputPanel('id7', 'Test', 'multi');
        let selectFileCalled = '';

        panel.selectFile = (path) => {
            selectFileCalled = path;
        };

        panel.handleWebviewMessage({ command: 'fileSelected', path: 'file.svg' });
        assert.strictEqual(selectFileCalled, 'file.svg');
    });

    test('selectFile() should update current content and post update', () => {
        let messagePosted = null;
        mockPanel.webview.postMessage = (msg) => {
            messagePosted = msg;
        };

        const panel = new ExtensionOutputPanel('id4', 'Test', 'multi');
        panel.panel = mockPanel;
        panel.setGeneratedFiles([{ path: 'file.svg', content: '<svg></svg>' }]);

        panel.selectFile('file.svg');

        assert.strictEqual(panel.currentContent, '<svg></svg>');
        assert.strictEqual(panel.isSvgContent, true);
        assert.deepStrictEqual(messagePosted.command, 'updateContent');
        assert.strictEqual(messagePosted.isSvg, true);
    });

    test('renderDiagram() should update SVG content and post message', () => {
        let messagePosted = null;
        mockPanel.webview.postMessage = (msg) => {
            messagePosted = msg;
        };

        const panel = new ExtensionOutputPanel('id5', 'Test', 'multi');
        panel.panel = mockPanel;

        panel.renderDiagram('<svg>diagram</svg>');

        assert.strictEqual(panel.currentContent, '<svg>diagram</svg>');
        assert.strictEqual(panel.isSvgContent, true);
        assert.deepStrictEqual(messagePosted.command, 'updateContent');
        assert.strictEqual(messagePosted.isSvg, true);
    });

    test('runButton() should show error message if button not found', () => {
        const panel = new ExtensionOutputPanel('id6', 'Test', 'multi');
        panel.buttons = [{ id: 'existing-btn', hint: 'Existing' }];

        let errorShown = '';
        vscode.window.showErrorMessage = (msg) => {
            errorShown = msg;
        };

        panel.runButton('missing-btn');

        assert.ok(errorShown.includes('Button missing-btn not found'));
    });

    test('displayPanel() should call postUpdate and reveal if panel already exists', () => {
        const panel = new ExtensionOutputPanel('id8', 'Test', 'multi');

        let postUpdateCalled = false;
        let revealCalled = false;

        panel.panel = {
            reveal: () => { revealCalled = true; },
            webview: { postMessage: () => {} }
        };
        panel.postUpdate = () => { postUpdateCalled = true; };

        panel.displayPanel();

        assert.strictEqual(postUpdateCalled, true);
        assert.strictEqual(revealCalled, true);
    });

    test('displayPanel() should create panel and setup listeners if panel does not exist', () => {
        const panel = new ExtensionOutputPanel('id9', 'Test', 'multi');
    
        let onDisposeSet = false;
        let onReceiveMsgSet = false;
        let onViewStateSet = false;
    
        const localMockPanel = {
            webview: {
                html: '',
                postMessage: () => {},
                onDidReceiveMessage: () => { onReceiveMsgSet = true; },
            },
            reveal: () => {},
            onDidDispose: () => { onDisposeSet = true; },
            onDidChangeViewState: () => { onViewStateSet = true; },
        };
    
        vscode.window.createWebviewPanel = () => localMockPanel;
    
        panel.getWebviewContent = () => '<html>Test</html>';
        panel.displayPanel();
    
        assert.ok(panel.panel);
        assert.strictEqual(localMockPanel.webview.html, '<html>Test</html>');
        assert.strictEqual(onDisposeSet, true);
        assert.strictEqual(onReceiveMsgSet, true);
        assert.strictEqual(onViewStateSet, true);
    });

    test('getWebviewContent() when language !== "multi" and content exists', () => {
        const panel = new ExtensionOutputPanel('id10', 'Test Panel', 'plaintext');
        panel.generatedFiles = [{ content: 'hello world', path: 'file.txt' }];
        const html = panel.getWebviewContent();
        assert.ok(html.includes('hello world'));
    });

    test('getWebviewContent() when language is "multi"', () => {
        const panel = new ExtensionOutputPanel('id11', 'Test Panel', 'multi');
        panel.generatedFiles = [{ content: 'should not show', path: 'file.txt' }];
        const html = panel.getWebviewContent();
        assert.ok(html.includes('<option value="file.txt"'));
    });

    test('getWebviewContent() when no generatedFiles are present', () => {
        const panel = new ExtensionOutputPanel('id12', 'Test Panel', 'plaintext');
        panel.generatedFiles = [];
        const html = panel.getWebviewContent();
        assert.ok(html.includes('<div id="content"></div>'));
    });

    test('displayPanel() should create panel and set html', () => {
        const panel = new ExtensionOutputPanel('id9', 'Test', 'multi');
    
        panel.panel = null;
        panel.getWebviewContent = () => '<html>Test</html>';    
        panel.displayPanel();
    
        assert.ok(panel.panel);
        assert.strictEqual(mockPanel.webview.html, '<html>Test</html>');
    });
    
    test('displayPanel() should register onDidDispose handler', () => {
        const panel = new ExtensionOutputPanel('id9', 'Test', 'multi');
        let onDisposeSet = false;
    
        mockPanel.onDidDispose = () => { onDisposeSet = true; };
    
        panel.panel = null;
        panel.getWebviewContent = () => '<html>Test</html>';    
        panel.displayPanel();
    
        assert.strictEqual(onDisposeSet, true);
    });
    
    test('displayPanel() should register onDidReceiveMessage handler', () => {
        const panel = new ExtensionOutputPanel('id9', 'Test', 'multi');
        let onReceiveMsgSet = false;
    
        mockPanel.webview.onDidReceiveMessage = () => { onReceiveMsgSet = true; };
    
        panel.panel = null;
        panel.getWebviewContent = () => '<html>Test</html>';   
        panel.displayPanel();
    
        assert.strictEqual(onReceiveMsgSet, true);
    });
    
    test('displayPanel() should register onDidChangeViewState handler', () => {
        const panel = new ExtensionOutputPanel('id9', 'Test', 'multi');
        let onViewStateSet = false;
    
        mockPanel.onDidChangeViewState = () => { onViewStateSet = true; };
    
        panel.panel = null;
        panel.getWebviewContent = () => '<html>Test</html>';  
        panel.displayPanel();
    
        assert.strictEqual(onViewStateSet, true);
    });

    test('displayPanel() onDidDispose should clear panel reference', () => {
        const panel = new ExtensionOutputPanel('id11', 'Test', 'multi');
        let disposeCallback;
    
        mockPanel.onDidDispose = (cb) => { disposeCallback = cb; };
    
        panel.panel = null;
        panel.getWebviewContent = () => '<html>Test</html>'; 
        panel.displayPanel();

        assert.ok(typeof disposeCallback === 'function');
    
        disposeCallback();
        assert.strictEqual(panel.panel, null);
    });
    
    test('displayPanel() onDidReceiveMessage should trigger handleWebviewMessage()', () => {
        const panel = new ExtensionOutputPanel('id12', 'Test', 'multi');
        let receiveMsg;
    
        mockPanel.webview.onDidReceiveMessage = (m) => { 
            receiveMsg = m; 
        };
        panel.handleWebviewMessage = (msg) => {
            assert.deepStrictEqual(msg, { command: 'button.run', button: 'btn1' });
        };
    
        panel.panel = null;
        panel.getWebviewContent = () => '<html>Test</html>';    
        panel.displayPanel();
    
        // simulate incoming message
        receiveMsg({ command: 'button.run', button: 'btn1' });
    });
    
    test('displayPanel() onDidChangeViewState triggers postUpdate when visible', () => {
        const panel = new ExtensionOutputPanel('id13', 'Test', 'multi');
        let changeViewState;
    
        mockPanel.onDidChangeViewState = (m) => { 
            changeViewState = m; 
        };
        panel.currentContent = 'some-content';
        let postUpdateCalled = false;
        panel.postUpdate = () => { postUpdateCalled = true; };
    
        panel.panel = null;
        panel.getWebviewContent = () => '<html>Test</html>';    
        panel.displayPanel();
    
        // simulate view state change
        changeViewState({ webviewPanel: { visible: true } });
    
        assert.strictEqual(postUpdateCalled, true);
    });
    

    test('renderButtons() should return correct HTML string', () => {
        const panel = new ExtensionOutputPanel('id11', 'Test', 'multi');
        panel.buttons = [
            { id: 'btn1', hint: 'Run' },
            { id: 'btn2', hint: 'Help' }
        ];
    
        const html = panel.renderButtons();
        assert.ok(html.includes("handleButtonClick('btn1')"));
        assert.ok(html.includes('Run'));
        assert.ok(html.includes("handleButtonClick('btn2')"));
        assert.ok(html.includes('Help'));
    });

    test('renderDropdown() should return empty string when language is not "multi"', () => {
        const panel = new ExtensionOutputPanel('id12', 'Test', 'plaintext');
        panel.generatedFiles = [{ path: 'file1.txt', content: 'foo' }];
        
        const result = panel.renderDropdown();
        assert.strictEqual(result, '');
    });
    
    test('renderDropdown() should return empty string when generatedFiles is empty', () => {
        const panel = new ExtensionOutputPanel('id13', 'Test', 'multi');
        panel.generatedFiles = [];
        
        const result = panel.renderDropdown();
        assert.strictEqual(result, '');
    });
    
    test('renderDropdown() should render dropdown with default option selected', () => {
        const panel = new ExtensionOutputPanel('id14', 'Test', 'multi');
        panel.generatedFiles = [{ path: 'file1.txt', content: 'foo' }];
        panel.selectedFilePath = null;
        
        const result = panel.renderDropdown();
        assert.ok(result.includes('Select a file'));
        assert.ok(result.includes('option value="file1.txt"'));
        assert.ok(result.includes('option value="" selected'));
    });
    
    test('renderDropdown() should render dropdown with file option selected', () => {
        const panel = new ExtensionOutputPanel('id15', 'Test', 'multi');
        panel.generatedFiles = [{ path: 'file1.txt', content: 'foo' }];
        panel.selectedFilePath = 'file1.txt';
        
        const result = panel.renderDropdown();
        assert.ok(result.includes('option value="file1.txt" selected'));
    });

});
