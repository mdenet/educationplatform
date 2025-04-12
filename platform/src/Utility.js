
import { parse as yamlParse, YAMLParseError} from 'yaml' 

export const ARRAY_ANY_ELEMENT = '*';

/**
 * Compares arrays of primitive types for equality 
 * @param {any[]} arrayA 
 * @param {any[]} arrayB 
 * @param {boolean} allowAnyWildcard when true the elements at the same position will always match
 * @returns true if the arrays are equal
 */
export function arrayEquals( arrayA, arrayB, allowAnyWildcard=false ) {
          
    if(arrayA.length != arrayB.length){
        return false;

    } else {
        // Check array elements
        for(let i=0; i<arrayA.length; i++){
            
            let noElementsAreAny = arrayA[i]!=ARRAY_ANY_ELEMENT && arrayB[i]!=ARRAY_ANY_ELEMENT;

            if( arrayA[i] != arrayB[i] && (noElementsAreAny || !allowAnyWildcard) ){
                return false; 
            }
        }
        return true;
    }
}


/**
 * Posts a json request to the given url.
 * @param {String} url the destination url
 * @param {String} json the data to send
 * @param {boolean} useCredentials xhr setting
 * @returns Promise to the response
 */
export function jsonRequest(url, json, useCredentials=false) {
    
    return new Promise(function (resolve, reject) {

        var xhr = new XMLHttpRequest();

        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
        xhr.withCredentials = useCredentials;
        
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } 
            else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            }
        };

        xhr.onerror = function () {
            reject({
                status: xhr.status,
                statusText: xhr.statusText
            });
        };

        xhr.send(json);
    });
}

/**
 * Posts a json request to the given url formatting the respose in the format expected
 * of conversion function Promises.
 * @param {String} url the destination url
 * @param {String} json the data to send
 * @param {String} parameterName the parameter name
 * @returns Promise to the response
 */
export function jsonRequestConversion(url, json, parameterName) {
    return jsonRequest(url, json)
        .then((responseText) => {
            const response = JSON.parse(responseText);

            return {
                name: parameterName,
                data: response.output
            };
        });
}

/**
 * HTTP GET request to the specified URL
 * 
 * @param {String} url The destination URL.
 * @param {boolean} useCredentials Whether to send credentials.
 * @returns {Promise} Promise to the response.
 */
export function getRequest(url, useCredentials = false) {

    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();

        xhr.open("GET", url, true);
        xhr.withCredentials = useCredentials;

        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText
                });
            }
        };

        xhr.onerror = function () {
            reject({
                status: xhr.status,
                statusText: xhr.statusText
            });
        };

        xhr.send();
    });
}


/**
 * Checks the private url parameter
 * 
 * @returns the private url parameter value
 */
export function urlParamPrivateRepo(location = window.location) {
    const params = new URLSearchParams(location.search);
    return params.get("privaterepo") === "true";
}

/**
 * Get the activity URL
 * @returns {String} the activity URL, or null if not found
 */
export function getActivityURL(location = window.location) {
    const params = new URLSearchParams(location.search);
    return params.get("activities") || null;
}

/**
 * Currently only supports GitHub URLs.
 * Get the current branch from the URL 
 * @returns {String} the branch name, or null if not found
 */
export function getCurrentBranch() {
    const url = new URL(this.getActivityURL());
    const pathParts = url.pathname.split('/').filter(Boolean);
    // pathParts[0] => owner
    // pathParts[1] => repo
    // pathParts[2] => branch
    // pathParts[3] => rest
    return pathParts[2] || null;
}

/**
     * Validates a branch name:
     * - Non-empty
     * - Min length 3
     * - Max length 100
     * - No consecutive dots ("..")
     * - Only [A-Za-z0-9._-] characters
     *
     * @param {String} branchName - The proposed branch name.
     * @returns {boolean} true if valid, false otherwise.
     */
export function validateBranchName(branchName) {
    // Must not be empty or whitespace
    if (!branchName || !branchName.trim()) {
        return false;
    }

    // Trim leading/trailing spaces
    const trimmed = branchName.trim();

    // Check length
    if (trimmed.length > 100 || trimmed.length < 3) {
        return false;
    }

    // Disallow consecutive dots
    if (trimmed.includes('..')) {
        return false;
    }

    // Only A-Z, a-z, 0-9, ., _, -
    const allowedPattern = /^[A-Za-z0-9._-]+$/;
    if (!allowedPattern.test(trimmed)) {
        return false;
    }

    // Passes all checks
    return true;
}

/**
 * @param {boolean} flag
 * Set the boolean authenticated flag in the session storage
 */
export function setAuthenticated(flag) {
    window.sessionStorage.setItem("isAuthenticated", flag);
}

/**
 * 
 * @returns true if the user is signed in
 */
export function isAuthenticated(){
    return window.sessionStorage.getItem("isAuthenticated") !== null &&
    window.sessionStorage.getItem("isAuthenticated") === "true";
}

export function authenticatedDecorator(target, methodName) {
    const originalMethod = target[methodName];
    target[methodName] = function (...args) {
        if (!isAuthenticated()) {
            throw new Error(`Not authenticated to execute ${methodName}`);
        }
        return originalMethod.apply(this, args);
    }
}

/**
 * Parses the platform configuration files, YAML and JSON types are supported. 
 * @param {String} contents the configuration file contents
 * @param {String} extension the configuration file extenstion
 * @returns the parsed configuration object or an error
 */
export function parseConfigFile(contents, extension="yml"){

    let configObject;
    
    try {
        switch(extension){
            case "json":
                configObject= JSON.parse(contents);
                break;


            case "yml":
                configObject= yamlParse(contents);
                break;

            default:
                console.log("Cannot parse unsupported configuration file type '" + extension + "'.");
                configObject = null;
        }
    } catch(err){
        if (err instanceof YAMLParseError || err instanceof SyntaxError){
            configObject = err;
        } else {
            throw err;
        }
    }

    return configObject;
}

/**
 * Gets query string of the current url - window.location.search.
 * @returns {string} the query string
 */
export function getWindowLocationSearch(location = window.location) {
    return location.search;
}

/**
 * Gets the current url - window.location.href.
 * @returns {string} the url
 */
export function getWindowLocationHref(location = window.location) {
    return location.href;
}

/**
 * Gets the base url - window.location.origin
 * @returns 
 */
export function getBaseURL(location = window.location) {
    return location.origin;
}

/**
 * Sets the current url - window.location.href.
 * @newUrl {string} the url to navigate to
 */
export function setWindowLocationHref(newUrl, location = window.location){
    return location.href = newUrl;
}

export function base64ToBytes(base64) {
    const binString = window.atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
}

export function bytesToBase64(bytes) {
    const binString =  String.fromCodePoint(...bytes);
    return window.btoa(binString);
}

/* ES6 Direct imports cannot be stubbed during unit test. Therefore, to enable unit testing 
   access to functions has to be made using the utility object.  */
export const utility = {
    arrayEquals,
    jsonRequest,
    jsonRequestConversion,
    getRequest,
    urlParamPrivateRepo,
    getCurrentBranch,
    validateBranchName,
    getActivityURL,
    setAuthenticated,
    isAuthenticated,
    authenticatedDecorator,
    parseConfigFile,
    getWindowLocationSearch,
    getWindowLocationHref,
    getBaseURL,
    setWindowLocationHref,
    base64ToBytes,
    bytesToBase64,
}