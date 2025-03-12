import * as vscode from 'vscode';


class PanelTreeDataProvider {
  constructor() {
    this.panels = [];
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  /**
   * Updates the tasks to display in the tree view.
   * @param {Array} tasks - The list of tasks (activities) from the activity.json file.
   */
  setPanels(panels) {
    this.panels = panels;
    this.refresh();
  }

  removePanels() {
    this.panels = [];
    this.refresh();
  }

  /**
   * Refreshes the tree view.
   */
  refresh() {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Returns a TreeItem for the given element.
   * @param {Object} element - The task element.
   * @returns {vscode.TreeItem}
   */
  getTreeItem(element) {
    return {
      label: element.label,
      iconPath: new vscode.ThemeIcon('layers'),
      command: {
        command: 'panels.displayPanel',
        title: 'Display Panel',
        arguments: [element.object] // Pass the panel object
    }
    };
  }

  /**
   * Returns the children for the tree view.
   * @returns {Promise<Array>}
   */
  async getChildren() {
    return this.panels.map((panel) => ({label: panel.getTitle(), object: panel}));
  }
}

export { PanelTreeDataProvider };