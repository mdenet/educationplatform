import * as vscode from 'vscode';

/**
 * Provides data for the panels tree view in the VS Code extension.
 */
class PanelTreeDataProvider {
  constructor() {
    this.panels = [];
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  /**
   * Updates the panels to display in the tree view.
   * @param {Array} tasks - The list of panels.
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
     * Gets a tree item representation for the given element.
     * @param {Object} element - The element to create a tree item for.
     * @returns {vscode.TreeItem} The tree item representing the element.
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
   * Retrieves the children of a given element in the panel tree structure.
   * If no element is provided, it returns the root-level panels.
   *
   * @param {Object} [element] - The parent element whose children are to be retrieved.
   *                             If undefined, the root-level panels are returned.
   * @returns {Array<Object>} An array of objects representing the children.
   */
  getChildren(element) {
    if (!element) {
      // Root level panels
      return this.panels.map((panel) => ({
        label: panel.getTitle(),
        object: panel,
        children: panel.getChildren ? panel.getChildren() : []
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