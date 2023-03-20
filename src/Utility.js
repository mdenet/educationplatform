

export function arrayEquals( arrayA, arrayB ) {
          
    if(arrayA.length != arrayB.length){
        return false;

    } else {
        // Check array elements
        for(let i=0; i<arrayA.length; i++){
           
            if( arrayA[i] != arrayB[i] ){
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