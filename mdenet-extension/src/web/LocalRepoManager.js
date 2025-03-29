import * as vscode from 'vscode';

/**
 * Manages the local repository and fetches files from the workspace.
*/
class LocalRepoManager {
    static instance;

    /**
     * Creates an instance of LocalRepoManager.
     * @returns {LocalRepoManager} The instance of the LocalRepoManager.
     */
    constructor() {
        if (LocalRepoManager.instance) {
            return LocalRepoManager.instance;
        }

        const workspaceFolders = vscode.workspace.workspaceFolders ?? [];
        this.rootUri = workspaceFolders[0]?.uri ?? null;
        this.files = [];

        LocalRepoManager.instance = this;
    }

    /**
     * Initialises the local repository by fetching activity files from the workspace folder.
     */
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

        } catch (error) {
            vscode.window.showErrorMessage("Error reading workspace folder.");
        }
    }

    getFiles() {
        return this.files;
    }

    /**
     * @param {String} fileName - The name of the file to fetch.
     * @returns {String} The content of the file.
     */
    async fetchActivityFile(fileName) {
        if (!this.rootUri) {
            vscode.window.showErrorMessage("No workspace folder found.");
            return;
        }

        try {
            const fileUri = vscode.Uri.joinPath(this.rootUri, fileName);
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            return new TextDecoder("utf-8").decode(fileData);
        } catch (error) {
            vscode.window.showErrorMessage("Error reading activity file.");
        }
    }

    getPath(filePath) {
        const workspacePath = this.rootUri.fsPath;
        if(filePath.startsWith(workspacePath)){
            return filePath;
        }
        return `${workspacePath}/${filePath}`;
    }
}

export { LocalRepoManager };
