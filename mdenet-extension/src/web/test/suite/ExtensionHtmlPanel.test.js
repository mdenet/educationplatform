import * as assert from 'assert';
import * as vscode from 'vscode';
import { ExtensionHtmlPanel } from '../../ExtensionHtmlPanel';

suite('ExtensionHtmlPanel Test Suite', () => {
  let createdPanel;

  setup(() => {
    vscode.window.createWebviewPanel = (id, title, column, options) => {
      createdPanel = {
        id,
        title,
        column,
        options,
        webview: {
          html: ''
        }
      };
      return createdPanel;
    };
  });

  test('initialize() should create webview panel and set HTML content', () => {
    const panel = new ExtensionHtmlPanel('testId', 'Test Panel');
    const testHtml = '<html><body><h1>Hello!</h1></body></html>';

    panel.initialize(testHtml);

    assert.strictEqual(createdPanel.id, 'testId');
    assert.strictEqual(createdPanel.title, 'Test Panel');
    assert.strictEqual(createdPanel.column, vscode.ViewColumn.One);
    assert.strictEqual(createdPanel.options.enableScripts, true);
    assert.strictEqual(createdPanel.options.retainContextWhenHidden, true);
    assert.strictEqual(createdPanel.webview.html, testHtml);
  });
});
