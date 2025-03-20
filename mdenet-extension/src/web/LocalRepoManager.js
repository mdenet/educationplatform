import * as vscode from 'vscode';

class LocalRepoManager {
    static instance;

    constructor() {
        if (LocalRepoManager.instance) {
            return LocalRepoManager.instance;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            // console.log('No workspace is opened');
        } else {
            this.rootUri = workspaceFolders[0].uri; // Use VS Code's Uri API
            // console.log('Root path:', this.rootUri.toString());
        }
        this.file = [];

        LocalRepoManager.instance = this;
    }

    async initialize() {
        if (!this.rootUri) {
            return;
        }

        try {
            const dirEntries = await vscode.workspace.fs.readDirectory(this.rootUri);
            this.files = dirEntries
                .filter(([file, type]) => type === vscode.FileType.File)
                .map(([file]) => file)
                .filter(file => file.endsWith('activity.json') || file.endsWith('activity.yml'));

            // console.log('Files:', this.files);
        } catch (error) {
            // console.error('Error reading workspace directory:', error);
            return;
        }
    }

    getFiles() {
        return this.files;
    }

    async fetchActivityFile(fileName) {
        if (!this.rootUri) {
            throw new Error("No workspace folder is open.");
        }

        try {
            const fileUri = vscode.Uri.joinPath(this.rootUri, fileName);
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            return new TextDecoder("utf-8").decode(fileData);
        } catch (error) {
            // console.error(`Error reading file ${fileName}:`, error);
            throw error;
        }
    }
}

export { LocalRepoManager };
