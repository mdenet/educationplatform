/**
 * Compares two configuration objects. 
 * @param {Object} configA
 * @param {Object} configB
 * @returns {Boolean} true if the objects values are equal.
 */
export function configObjectEquals(configA, configB){

    const strConfigA = JSON.stringify(configA);
    const strConfigB = JSON.stringify(configB);

    return (strConfigA === strConfigB)
}

/**
 * Prints a configuration object including its values.
 * @param {Object} config 
 * @returns {string} the string representation
 */
export function configToString (config) {
    return JSON.stringify(config);
}