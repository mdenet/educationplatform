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

    fetchBranches(url) {
        const sourceURL = new URL(url);

        // Parse the URL to get the owner and repo
        const pathParts = this.getPathParts(sourceURL.pathname);
        const owner = pathParts.owner;
        const repo = pathParts.repo;

        if (!isAuthenticated()) {
            throw new Error("Not authenticated to fetch branches.");
        }

        const params = {
            owner: owner,
            repo: repo
        }
        try {
            const response = getRequest(this.tokenHandlerUrl + "/mdenet-auth/github/branches", params, true);
            const branches = JSON.parse(response);
        }
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
     * Converts file urls from different hosts into requsts for the token server
     * @param {String} fileUrl the url of the file
     * @returns {String} request url
     */
    getPrivateFileRequestUrl(fileUrl){

        let fileSourceUrl = new URL(fileUrl);

        let fileRequestUrl;


        switch(fileSourceUrl.host){

            case 'raw.githubusercontent.com':
                fileRequestUrl= this.githubRawUrlToRequestUrl(fileSourceUrl.pathname);
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
    githubRawUrlToRequestUrl(githubUrlPath){

        let pathParts = githubUrlPath.split("/");
        let requestUrl = new URL(this.tokenHandlerUrl);

        requestUrl.pathname = "/mdenet-auth/github/file";

        pathParts.shift() // unused empty

        requestUrl.searchParams.append("owner", pathParts.shift() );

        requestUrl.searchParams.append("repo", pathParts.shift() );

        requestUrl.searchParams.append("ref", pathParts.shift() ); 

        requestUrl.searchParams.append("path", pathParts.join("/"));

        return requestUrl.href;
    }


    getPrivateFileUpdateParams(fileUrl){

        let fileSourceUrl = new URL(fileUrl);

        let fileStoreRequest;


        switch(fileSourceUrl.host){

            case 'raw.githubusercontent.com':
                fileStoreRequest= this.githubRawUrlToStoreRequest(fileSourceUrl.pathname);
                break;

            default:
                console.log("FileHandler - fileurl '" + fileSourceUrl.host + "' not supported.");
                fileStoreRequest = null;
                break;
        }

        return fileStoreRequest;        
    }


    githubRawUrlToStoreRequest(githubUrlPath){

        let pathParts = githubUrlPath.split("/");
        let requestParams = {};

        pathParts.shift() // unused empty

        requestParams.owner = pathParts.shift();
        requestParams.repo = pathParts.shift();
        requestParams.ref = pathParts.shift();
        requestParams.path = pathParts.join("/");

        return requestParams;
    }

    getPathParts(path) {
        let pathParts = path.split("/");
        const parts = { };

        pathParts.shift(); // unused empty

        parts.owner = pathParts.shift();
        parts.repo = pathParts.shift();
        parts.ref = pathParts.shift();
        parts.path = pathParts.join("/");

        return parts;
    }
}

export { FileHandler };
