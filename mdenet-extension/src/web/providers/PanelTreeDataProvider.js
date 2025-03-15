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
   * @param {Object} element - The tree element (panel or parent node).
   * @returns {vscode.TreeItem}
   */
   getTreeItem(element) {
    const treeItem = new vscode.TreeItem(
      element.label,
      element.children && element.children.length > 0
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );

    treeItem.iconPath = new vscode.ThemeIcon('layers');

    if (!element.children || element.children.length === 0) {
      treeItem.command = {
        command: 'panels.displayPanel',
        title: 'Display Panel',
        arguments: [element.object] // Pass the panel object
      };
    }

    return treeItem;
  }

  /**
   * Returns the children for the tree view.
   * @param {Object} element - The parent node.
   * @returns {Promise<Array>}
   */
  async getChildren(element) {
    if (!element) {
      // Root level panels
      return this.panels.map((panel) => ({
        label: panel.getTitle(),
        object: panel,
        children: panel.getChildren ? panel.getChildren() : [] // Retrieve children if available
      }));
    }

    // Return child panels if they exist
    return element.children.map((child) => ({
      label: child.getTitle(),
      object: child,
      children: child.getChildren ? child.getChildren() : []
    }));
  }
}

export { PanelTreeDataProvider };