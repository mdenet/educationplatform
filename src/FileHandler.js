import { jsonRequest, isAuthenticated} from './Utility.js';


class FileHandler {
    
    tokenHandlerUrl;

    constructor( tokenHandlerUrl ){
        this.tokenHandlerUrl = tokenHandlerUrl;
    }


    fetchFile(url, isPrivate){

        if(isPrivate){

            // Private so request via token server
            const requestUrl = this.getPrivateFileRequestUrl(url);

            var xhr = new XMLHttpRequest();
            xhr.open("GET", requestUrl, false);
            xhr.withCredentials = true;
            xhr.send();
            
            if (xhr.status === 200) {  
                
                let response = JSON.parse(xhr.responseText);

                return { content: window.atob(response.data.content), sha: response.data.sha };
            
            } else {
                return null;
            }           

        } else {
            // Public so request directly
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send();
            
            if (xhr.status === 200) {    
                return { content: xhr.responseText, sha: null }; //TODO need to retrieve the sha for the file

            } else {
                return null;
            }
        }
    }

    storeFile(url, sha, newFileContent, message=("MDENet Education Platform save on " + new Date().toJSON()), branch=null){
        
        if(isAuthenticated()){
            let request = this.getPrivateFileUpdateParams(url);
        
            request.params.message = message;   

            request.params.sha= sha;  
            request.params.content= window.btoa(newFileContent);  

            if(branch != null){
                request.params.branch = branch;
            }
            
            let responsePromise = jsonRequest( request.url,  JSON.stringify(request.params), true );
            
            responsePromise.then( (response) => {
                console.log("Stored file - success");
            } );

        } else {
            console.log("File could not be stored - not authenticated.")
        }
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
        let requestUrl = new URL(this.tokenHandlerUrl);
        let requestParams = {};

        requestUrl.pathname = "/mdenet-auth/github/file";

        pathParts.shift() // unused empty

        requestParams.owner = pathParts.shift();
        requestParams.repo = pathParts.shift();
        pathParts.shift(); //requestParams.ref
        requestParams.path = pathParts.join("/");

        return  { url: requestUrl.href, params: requestParams };
    }
}

export { FileHandler };