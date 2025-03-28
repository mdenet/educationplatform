import * as vscode from 'vscode';
import { LocalRepoManager } from '../LocalRepoManager';

export class ActivityTreeDataProvider {
    constructor(localRepoManager) {
        this.playingFile = null;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.localRepoManager = localRepoManager
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    setPlaying(file) {
        this.playingFile = file.label;
        this.refresh();
    }

    setStopped() {
        this.playingFile = null;
        this.refresh();
    }

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

    async getChildren() {
        await this.localRepoManager.initialize();
        const files = this.localRepoManager.getFiles();
        return files.map(file => ({ label: file }));
    }
}
