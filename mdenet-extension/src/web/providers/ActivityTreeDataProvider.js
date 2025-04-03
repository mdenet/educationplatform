import * as vscode from 'vscode';

/**
 * Provides data for the activity tree view in the VS Code extension.
 */
export class ActivityTreeDataProvider {
    /**
     * Creates an instance of ActivityTreeDataProvider.
     * @param {Object} localRepoManager - The local repository manager instance used to fetch files.
     */
    constructor(localRepoManager) {
        this.playingFile = null;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.localRepoManager = localRepoManager;
    }

    /**
     * Refreshes the tree view by firing the onDidChangeTreeData event.
     */
    refresh() {
        this._onDidChangeTreeData.fire();
    }

    /**
     * Sets the currently playing file and refreshes the tree view.
     * @param {Object} file - The file object representing the currently playing file.
     */
    setPlaying(file) {
        this.playingFile = file.label;
        this.refresh();
    }

    /**
     * Stops the currently playing file and refreshes the tree view.
     */
    setStopped() {
        this.playingFile = null;
        this.refresh();
    }

    /**
     * Gets a tree item representation for the given element.
     * @param {Object} element - The element to create a tree item for.
     * @returns {vscode.TreeItem} The tree item representing the element.
     */
    getTreeItem(element) {
        const isPlaying = this.playingFile === element.label;
        const treeItem = new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None);
        
        treeItem.iconPath = isPlaying
            ? new vscode.ThemeIcon('debug-stop')
            : new vscode.ThemeIcon('debug-start');
        
        treeItem.command = isPlaying
            ? { command: 'activities.stop', title: 'Stop', arguments: [element] }
            : { command: 'activities.play', title: 'Play', arguments: [element] };
        
        treeItem.contextValue = 'activityItem';
        
        return treeItem;
    }

    /**
     * Retrieves the child elements for the tree view.
     * @returns {Promise<Object[]>} A promise that resolves to an array of file objects.
     */
    async getChildren() {
        await this.localRepoManager.initialize();
        const files = this.localRepoManager.getFiles();
        return files.map(file => ({ label: file }));
    }
}
