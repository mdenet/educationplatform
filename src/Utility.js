
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
 * @returns Promise to the response
 */
export function jsonRequest(url, json){
    
    return new Promise(function (resolve, reject) {

        var xhr = new XMLHttpRequest();

        xhr.open("POST", url);
        xhr.setRequestHeader("Content-Type", "application/json");
        
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
 * @param {String} the paramter name
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