

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

                return window.atob(response.data.content);
            
            } else {
                return null;
            }           

        } else {
            // Public so request directly
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send();
            
            if (xhr.status === 200) {    
                return xhr.responseText;

            } else {
                return null;
            }
        }
    }

    storeFile(url, newFileContent){
        // TODO
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
                fileRequestUrl= this.githubRawUrlTorequestUrl(fileSourceUrl.pathname);
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
    githubRawUrlTorequestUrl(githubUrlPath){

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
}

export { FileHandler };