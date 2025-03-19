import { jsonRequest, isAuthenticated, getRequest} from './Utility.js';


class FileHandler {
    
    tokenHandlerUrl;

    constructor( tokenHandlerUrl ){
        this.tokenHandlerUrl = tokenHandlerUrl;
    }


    base64ToBytes(base64) {
        const binString = window.atob(base64);
        return Uint8Array.from(binString, (m) => m.codePointAt(0));
    }

    bytesToBase64(bytes) {
        const binString =  String.fromCodePoint(...bytes);
        return window.btoa(binString);
    }

    fetchFile(url, isPrivate){

        if (isPrivate){
            // Private so request via token server
            const requestUrl = this.getPrivateFileRequestUrl(url);

            if (requestUrl != null) {
                let xhr = new XMLHttpRequest();
                xhr.open("GET", requestUrl, false);
                xhr.setRequestHeader("Accept", "application/json; charset=UTF-8");
                xhr.withCredentials = true;
                xhr.send();
                
                if (xhr.status === 200) {  
                    
                    let response = JSON.parse(xhr.responseText);

                    let contents = new TextDecoder().decode(this.base64ToBytes(response.data.content));

                    return { content: contents, sha: response.data.sha };
                
                } else {
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

        } else {
            return null;
        }
    }

    async fetchBranches(url) {

        if (!isAuthenticated()) {
            throw new Error("Not authenticated to fetch branches.");
        }

        const requestUrl = this.getBranchesRequestUrl(url);
        if (!requestUrl) {
            throw new Error("Failed to fetch branches - invalid URL");
        }

        try {
            const response = await getRequest(requestUrl, true);
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
    createBranch(url, newBranch) {

        if (!isAuthenticated()) {
            throw new Error("Not authenticated to checkout a branch.");
        }

        const requestUrl = new URL(this.tokenHandlerUrl);
        requestUrl.pathname = "/mdenet-auth/github/create-branch";

        const requestParams = this.createBranchRequestParams(url);
        if (!requestParams) {
            throw new Error("Failed to create branch - invalid URL");
        }
        // Add the remaining branch name parameter to the request
        requestParams.newBranch = newBranch;
        
        return jsonRequest(requestUrl, JSON.stringify(requestParams), true);
    }

    storeFiles(filesToSave, message){

        if (!isAuthenticated()) {
            throw new Error("Files could not be stored - not authenticated.");
        }

        // Prepare the request payload
        const requestUrl = new URL(this.tokenHandlerUrl);
        requestUrl.pathname = "/mdenet-auth/github/file";
        let request = {
            files: [],
            message: message
        };

        // Collect the request parameters in the url for each file (owner, repo, ref, path)
        for (let file of filesToSave) {
            let fileParams = this.getPrivateFileUpdateParams(file.url);
            if (!fileParams) {
                console.error(`Failed to generate request parameters for file: ${file.fileUrl}`);
                throw new Error("Failed to generate request parameters");
            }

            // Add the remaining parameters to the request
            fileParams.content = file.newFileContent;
            fileParams.sha = file.valueSha;

            // Add the file to the batch request
            request.files.push(fileParams);
        }
        
        return jsonRequest( requestUrl.href, JSON.stringify(request), true );
    }

    forkRepository(url, repository, owner, mainOnly){

        let requestUrl = new URL(this.tokenHandlerUrl);

        requestUrl.pathname = "/mdenet-auth/github/fork";


        let request= {};

        request.owner = owner;
        request.repo = repository;
        request.defaultOnly = mainOnly;

        jsonRequest( requestUrl.href,  JSON.stringify(), true );
    }

    /**
     * Parses the URL of a file and extracts the key parameters
     * @param {String} pathName The raw file path obtained using .pathname from a URL object
     * @returns {object} An object containing the owner, repo, ref and path of the file
     */
    getPathParts(pathName) {
        let pathParts = pathName.split("/");
        const parts = { };

        pathParts.shift(); // unused empty

        parts.owner = pathParts.shift();
        parts.repo = pathParts.shift();
        parts.ref = pathParts.shift();
        parts.path = pathParts.join("/");

        return parts;
    }

    /**
     * Helper method to construct request URL with search parameters
     * @param {String} pathname The pathname for the request URL
     * @param {Object} searchParams The search parameters in the request
     * @returns {String} The constructed request URL
     */
    constructRequestUrl(requestRoute, searchParams) {
        let requestUrl = new URL(this.tokenHandlerUrl);
        requestUrl.pathname = requestRoute;

        for (const key in searchParams) {
            requestUrl.searchParams.append(key, searchParams[key]);
        }

        return requestUrl.href;
    }

    /**
     * Converts file urls from different hosts into requests for the token server
     * @param {String} fileUrl the url of the file
     * @returns {String} request url
     */
    getPrivateFileRequestUrl(fileUrl){

        let fileSourceUrl = new URL(fileUrl);
        let fileRequestUrl;

        switch(fileSourceUrl.host){

            case 'raw.githubusercontent.com':
                fileRequestUrl= this.githubRawUrlToFileRequestUrl(fileSourceUrl.pathname);
                break;

            default:
                console.log("FileHandler - fileurl '" + fileSourceUrl.host + "' not supported.");
                fileRequestUrl = null;
                break;
        }

        return fileRequestUrl;
    }

    /**
     * Converts file urls from different hosts into requests for the token server
     * @param {String} fileUrl the url of the file
     * @returns {String} request url
     */
    getBranchesRequestUrl(fileUrl) {
        let fileSourceUrl = new URL(fileUrl);
        let fileRequestUrl;

        switch(fileSourceUrl.host) {
            case 'raw.githubusercontent.com':
                fileRequestUrl = this.githubRawUrlToGetBranchesRequestUrl(fileSourceUrl.pathname);
                break;
            default:
                console.log("FileHandler - fileurl '" + fileSourceUrl.host + "' not supported.");
                fileRequestUrl = null;
                break;
        }

        return fileRequestUrl;
    }
    
    /**
     * Convert github raw file url path into request url
     * @param {String} githubUrlPath github raw file path without the host
     * @returns {String} request url
     */
    githubRawUrlToFileRequestUrl(githubUrlPath) {
        const params = this.getPathParts(githubUrlPath);
        return this.constructRequestUrl("/mdenet-auth/github/file", params);
    }

    githubRawUrlToGetBranchesRequestUrl(githubUrlPath) {
        const params = this.getPathParts(githubUrlPath);
        return this.constructRequestUrl("/mdenet-auth/github/branches", params);
    }

    getPrivateFileUpdateParams(fileUrl){

        let fileSourceUrl = new URL(fileUrl);

        let fileStoreRequest;


        switch(fileSourceUrl.host){

            case 'raw.githubusercontent.com':
                fileStoreRequest= this.githubRawUrlToStoreRequestParams(fileSourceUrl.pathname);
                break;

            default:
                console.log("FileHandler - fileurl '" + fileSourceUrl.host + "' not supported.");
                fileStoreRequest = null;
                break;
        }

        return fileStoreRequest;        
    }

    createBranchRequestParams(fileUrl) {
        let fileSourceUrl = new URL(fileUrl);
        let fileRequestUrl;

        switch(fileSourceUrl.host) {
            case 'raw.githubusercontent.com':
                fileRequestUrl = this.githubRawUrlToCreateBranchRequestParams(fileSourceUrl.pathname);
                break;
            default:
                console.log("FileHandler - fileurl '" + fileSourceUrl.host + "' not supported.");
                fileRequestUrl = null;
                break;
        }

        return fileRequestUrl;
    }


    githubRawUrlToStoreRequestParams(githubUrlPath){
        const requestParams = this.getPathParts(githubUrlPath);
        return requestParams;
    }

    githubRawUrlToCreateBranchRequestParams(githubUrlPath) {
        const pathParts = this.getPathParts(githubUrlPath);
        const requestParams = {
            owner: pathParts.owner,
            repo: pathParts.repo,
            ref: pathParts.ref
        }
        return requestParams;
    }
}

export { FileHandler };
