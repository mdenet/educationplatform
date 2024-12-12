
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
export function jsonRequest(url, json, useCredentials=false){
    
    return new Promise(function (resolve, reject) {

        var xhr = new XMLHttpRequest();

        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
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

        xhr.send(json);
    });
}

/**
 * Posts a json request to the given url formatting the respose in the format expected
 * of conversion function Promises.
 * @param {String} url the destination url
 * @param {String} json the data to send
 * @param {String} parameterName the paramter name
 * @returns Promise to the response
 */
export function jsonRequestConversion(url, json, parameterName){
    // TODO generalise to minimise dulipcation
    
    return new Promise(function (resolve, reject) {

        var xhr = new XMLHttpRequest();

        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json");
        
        xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {

            let response = JSON.parse(xhr.response);

            let parameterData = {};
            parameterData.name = parameterName;
            parameterData.data = response.output;

            resolve(parameterData);
        
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

        xhr.send(json);
    });
}


/**
 * Http get request to url
 * 
 * @param {*} url 
 * @returns Promise to the response 
 */
export function getRequest(url){

    return new Promise(function (resolve, reject) {
        
        let xmlHttp = new XMLHttpRequest();
        
        xmlHttp.onload = function() { 
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
                resolve(xmlHttp.responseText);
            } else {
                reject({
                    status: xmlHttp.status,
                    statusText: xmlHttp.statusText
                });
            }
        }

        xmlHttp.onerror = function() {
            reject({
                status: xmlHttp.status,
                statusText: xmlHttp.statusText
            });
        }

        xmlHttp.open("GET", url , true);  
        xmlHttp.send(null);
    });
}

/**
 * Checks the private url parameter
 * 
 * @returns the private url parameter value
 */
export function urlParamPrivateRepo(){
    let urlParams = new URLSearchParams(window.location.search);    

    return urlParams.has("privaterepo") && urlParams.get("privaterepo")==='true';
}


/**
 * 
 * @returns true if the user is signed in
 */
export function isAuthenticated(){
    return window.sessionStorage.getItem("isAuthenticated") != null;
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
export function getWindowLocationSearch(){
    return window.location.search;
}

/**
 * Gets the current url - window.location.href.
 * @returns {string} the url
 */
export function getWindowLocationHref(){
    return window.location.href;
}

/**
 * Gets the base url - window.location.origin
 * @returns 
 */
export function getBaseURL(){
    return window.location.origin;
}

/**
 * Sets the current url - window.location.href.
 * @newUrl {string} the url to navigate to
 */
export function setWindowLocationHref(newUrl){
    return window.location.href = newUrl;
}

/* ES6 Direct imports cannot be stubbed during unit test. Therefore, to enable unit testing 
   access to functions has to be made using the utility object.  */
export const utility = {
    arrayEquals,
    jsonRequest,
    jsonRequestConversion,
    getRequest,
    urlParamPrivateRepo,
    isAuthenticated,
    parseConfigFile,
    getWindowLocationSearch,
    getWindowLocationHref,
    getBaseURL,
    setWindowLocationHref
}