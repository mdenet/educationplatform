import { utility} from './Utility.js';
import { GitHubProvider } from './GitHubProvider.js';


export class FileHandler {
    
    tokenHandlerUrl;
    providers = [];

    constructor( tokenHandlerUrl ) {
        this.tokenHandlerUrl = tokenHandlerUrl;
        this.providers.push(new GitHubProvider(tokenHandlerUrl));
        // Additional VCS providers can be added here
    }

    /**
     * Chooses the correct VCS provider based on the URL of the file.
     * @param url
     * @returns a VCS provider object that supports the URL, or null if none found.
     */
    findProvider(url) {
        const parsedUrl = new URL(url);
        const provider = this.providers.find(provider => provider.supportedHosts.includes(parsedUrl.host));

        if (!provider) {
            throw new Error(`Host URL '${parsedUrl.host}' is not supported.`);
        }
        return provider;
    }

    /**
     * TODO: Remove this function and use the one below - this makes it async, so we need to also go back and update the callers.
     */
    fetchFile(url, isPrivate){

        if (isPrivate){
            // Private so request via token server
            const provider = this.findProvider(url);
            const requestUrl = provider.getFileRequestUrl(url);

            if (requestUrl != null) {
                let xhr = new XMLHttpRequest();
                xhr.open("GET", requestUrl, false);
                xhr.setRequestHeader("Accept", "application/json; charset=UTF-8");
                xhr.withCredentials = true;
                xhr.send();
                
                if (xhr.status === 200) {  
                    
                    let response = JSON.parse(xhr.responseText);

                    let contents = new TextDecoder().decode(utility.base64ToBytes(response.data.content));

                    return { content: contents, sha: response.data.sha };
                
                } 
                else {
                    return null;
                }
            }
        }
        
        // At this point, this is either a public repository, or it's a private repository but an unknown type of URL.
        // In either case, we assume that we can simply access the URL directly.
        let xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send();
        
        if (xhr.status === 200) {    
            return { content: xhr.responseText, sha: null }; //TODO need to retrieve the sha for the file IF it's from a public repository

        } 
        else {
            return null;
        }
    }

    /**
     * TODO: Use this instead of the above - this makes it async, so we need to also go back and update the callers.
     * Rename this to fetchFile and remove the above function.
     * 
     * Fetch file contents from a public or private repository.
     * @param {String} url - The file URL.
     * @param {boolean} isPrivate - Whether the file is from a private repository.
     * @returns {Promise<{content: string, sha: string|null} | null>}
     */
    async refactoredFetchFile(url, isPrivate) {
        try {
            if (isPrivate) {
                const provider = this.findProvider(url);
                const requestUrl = provider.getFileRequestUrl(url);

                if (requestUrl) {
                    const responseText = await utility.getRequest(requestUrl, true);
                    const response = JSON.parse(responseText);

                    const contents = new TextDecoder().decode(utility.base64ToBytes(response.data.content));
                    return { content: contents, sha: response.data.sha };
                }
            }

            // At this point, this is either a public repository, or it's a private repository but an unknown type of URL.
            // In either case, we assume that we can simply access the URL directly.
            const responseText = await utility.getRequest(url, false);
            return { content: responseText, sha: null };

        } 
        catch (error) {
            console.error("Failed to fetch file:", error);
            return null;
        }
    }

    /**
     * Fetch a list of branches from the repository
     * @param {String} url 
     * @returns {Promise<Array>} Promise to the response containing the branches array
     */
    async fetchBranches(url) {
        try {
            const provider = this.findProvider(url);
            const requestUrl = provider.getBranchesRequestUrl(url);    

            const response = await utility.getRequest(requestUrl, true);
            const branches = JSON.parse(response);
            return branches;
        }
        catch (error) {
            console.error("Failed to fetch branches: " + error);
            throw error;
        }
    }

    /**
     * Create a new branch in the repository
     * @param {String} url
     * @param {String} newBranch
     * @returns {Promise} Promise to the response
     */
    async createBranch(url, newBranch) {
        try {
            const provider = this.findProvider(url);

            const { url: requestUrl, payload } = provider.createBranchRequest(url, newBranch);
            return await utility.jsonRequest(requestUrl, JSON.stringify(payload), true);
        }
        catch (error) {
            console.error("Failed to create branch: " + error);
            throw error;
        }
    }

    /**
     * Compare two branches in the repository - by default the base branch is the current branch
     * @param {String} url 
     * @param {String} branchToCompare 
     */
    async compareBranches(url, branchToCompare) {

        try {
            const provider = this.findProvider(url);
            const requestUrl = provider.getCompareBranchesRequestUrl(url, branchToCompare);

            const response = await utility.getRequest(requestUrl, true);
            const comparison = JSON.parse(response);
            return comparison;
        }
        catch (error) {
            console.error("Failed to compare branches: " + error);
            throw error;
        }

    }

    /**
     * Merge two branches in the repository
     * @param {String} url 
     * @param {String} branchToMergeFrom - the branch to merge into the current one (the head branch)
     * @param {String} mergeType - the type of merge to perform (e.g. "fast-forward", "merge")
     * @returns {Promise} Promise to the response
     */
    async mergeBranches(url, branchToMergeFrom, mergeType) {

        try {
            const provider = this.findProvider(url);
            const { url: requestUrl, payload } = provider.mergeBranchesRequest(url, branchToMergeFrom, mergeType);

            const response = await utility.jsonRequest(requestUrl, JSON.stringify(payload), true);
            return JSON.parse(response);
        }
        catch (error) {
            console.error("Failed to merge branches: ", error);
            throw error;
        }   
    }

    /**
     * Retrieve the link to the pull request for merging the head branch into the base branch.
     * This version simply returns the URL to the pull request page, but does not create the pull request.
     * This should be updated in the future to create the pull request and return the link to it.
     * @param {*} url 
     * @param {*} headBranch 
     */
    getPullRequestLink(url, baseBranch, headBranch) {
        
        try {
            const provider = this.findProvider(url);
            const pullRequestLink = provider.createPullRequestLink(url, baseBranch, headBranch);

            return pullRequestLink;
        }
        catch (error) {
            console.error("Failed to get pull request link: " + error);
            throw error;
        }        
    }

    /**
     * Make a new commit to the repository with the specified files.
     * @param {*} url 
     * @param {*} filesToSave 
     * @param {*} message 
     * @param {*} overrideBranch 
     * @returns 
     */
    storeFiles(url, filesToSave, message, overrideBranch){

        try {
            const provider = this.findProvider(url);
            const { url: requestUrl, payload } = provider.storeFilesRequest(url, filesToSave, message, overrideBranch);
    
            return utility.jsonRequest(requestUrl, JSON.stringify(payload), true);
        }
        catch (error) {
            console.error("Failed to store files: " + error);
            throw error;
        }
    }
    
    static {
        utility.authenticatedDecorator(FileHandler.prototype, 'fetchBranches');
        utility.authenticatedDecorator(FileHandler.prototype, 'createBranch');
        utility.authenticatedDecorator(FileHandler.prototype, 'compareBranches');
        utility.authenticatedDecorator(FileHandler.prototype, 'mergeBranches');
        utility.authenticatedDecorator(FileHandler.prototype, 'getPullRequestLink');
        utility.authenticatedDecorator(FileHandler.prototype, 'storeFiles');
    }
}
