import {FileHandler} from "../../src/FileHandler"

describe("FileHandler", () => {

    it("githubRawUrlTorequestUrl - returns a token server request url from a raw github file url", () => {
    
        let rawGithubUrl = new URL("https://raw.githubusercontent.com/mdenet/educationplatform/mdenet-ep-prototype/README.md");

        const TOKEN_SERVER_URL = "http://test.token.mdenet.com";
        let fh = new FileHandler(TOKEN_SERVER_URL) 

        let result = fh.githubRawUrlToRequestUrl(rawGithubUrl.pathname);

        expect(result).toEqual( TOKEN_SERVER_URL + "/mdenet-auth/github/file?owner=mdenet&repo=educationplatform&ref=mdenet-ep-prototype&path=README.md" );    
    })

    it("getPrivateFileRequestUrl - returns a token server request url from a raw github file url", () => {
    
        let rawGithubUrl = "https://raw.githubusercontent.com/mdenet/educationplatform/mdenet-ep-prototype/README.md";

        const TOKEN_SERVER_URL = "http://test.token.mdenet.com";
        let fh = new FileHandler(TOKEN_SERVER_URL) 

        let result = fh.getPrivateFileRequestUrl(rawGithubUrl);

        expect(result).toEqual( TOKEN_SERVER_URL + "/mdenet-auth/github/file?owner=mdenet&repo=educationplatform&ref=mdenet-ep-prototype&path=README.md" );    
    })

    it("getPrivateFileRequestUrl - returns null for an unknown file url", () => {
    
        let unknownUrl = "https://unknown.file.com/unknown/README.md";

        const TOKEN_SERVER_URL = "http://test.token.mdenet.com";
        let fh = new FileHandler(TOKEN_SERVER_URL) 

        let result = fh.getPrivateFileRequestUrl(unknownUrl);

        expect(result).toBeNull();    
    })


    it("githubRawUrlToStoreRequest - returns an object with a token server request url member from a raw github file url", () => {
    
        let rawGithubUrl = new URL("https://raw.githubusercontent.com/mdenet/educationplatform/mdenet-ep-prototype/README.md");

        const TOKEN_SERVER_URL = "http://test.token.mdenet.com";
        let fh = new FileHandler(TOKEN_SERVER_URL) 

        let result = fh.githubRawUrlToStoreRequest(rawGithubUrl.pathname);

        expect(result.url).toEqual( TOKEN_SERVER_URL + "/mdenet-auth/github/file" );    
    })

    it("githubRawUrlToStoreRequest - returns an object with a token server requestParams member from a raw github file url", () => {
    
        let rawGithubUrl = new URL("https://raw.githubusercontent.com/mdenet/educationplatform/mdenet-ep-prototype/README.md");

        const TOKEN_SERVER_URL = "http://test.token.mdenet.com";
        let fh = new FileHandler(TOKEN_SERVER_URL) 

        let result = fh.githubRawUrlToStoreRequest(rawGithubUrl.pathname);

        expect(result.params.owner).toEqual( "mdenet" );
        expect(result.params.repo).toEqual( "educationplatform" ); 
        expect(result.params.path).toEqual( "README.md" );     
    })

    it("getPrivateFileUpdateParams - returns ", () => {
    
        let unknownUrl = "https://unknown.file.com/unknown/README.md";

        const TOKEN_SERVER_URL = "http://test.token.mdenet.com";
        let fh = new FileHandler(TOKEN_SERVER_URL) 

        let result = fh.getPrivateFileUpdateParams(unknownUrl);

        expect(result).toBeNull();    
    })


    it("getPrivateFileUpdateParams - returns null for an unknown file url", () => {
    
        let unknownUrl = "https://unknown.file.com/unknown/README.md";

        const TOKEN_SERVER_URL = "http://test.token.mdenet.com";
        let fh = new FileHandler(TOKEN_SERVER_URL) 

        let result = fh.getPrivateFileUpdateParams(unknownUrl);

        expect(result).toBeNull();    
    })



})