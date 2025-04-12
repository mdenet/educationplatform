/*global expect --  functions provided by Jasmine */
import { ConfigValidationError } from "../../src/ConfigValidationError.js";

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

// Jasmine custom matchers
export const customMatchers = {
    
    /**
     * Matcher to check the expected keywords are present in the given input.
     * where actual is a String and expected is an array of strings that contains 
     * the keyword to check.
     */
    toContainAllKeywords : function(matchersUtil){
        return {
            compare: function(actual, expected){

                const result = {
                };

                // Check the condition
                result.pass = expected.every( (akeyword)=> matchersUtil.contains(actual, akeyword) );

                if (result.pass){
                    result.message= `Expected the input to contain none of the keywords '${expected.toString()}' however at least one was found. input: '${actual}'`; // Negated not case
                } else {
                    result.message= `Expected the input to contain all of the keywords '${expected.toString()}' however at least one was missing. input: '${actual}'`;
                } 

                return result;
            } 
        }
    }
}

/**
 * Checks a ConfigValidationError contains the expected content. For use in jasmine unit tests.
 * 
 * @param {ConfigValidationError} error - The error instance to check
 * @param {String} category - The expected category text
 * @param {String} type - The expected type text
 * @param {Array<String>} messageKeywords - The expected keywords that must be present in the error message
 * @param {String} location - The expected location text
 */
export function checkErrorPopulated(error, category, type, messageKeywords, location){
    const MIN_LENGTH = 3;
    expect(error).toBeInstanceOf(ConfigValidationError);
    
    expect(error.category.length).toBeGreaterThanOrEqual(MIN_LENGTH);
    expect(error.message.length).toBeGreaterThanOrEqual(MIN_LENGTH);
    expect(error.location.length).toBeGreaterThanOrEqual(MIN_LENGTH);
   
    expect(error.category).toEqual(category);
    expect(error.fileType).toEqual(type);
    expect(error.message).toContainAllKeywords(messageKeywords);
    expect(error.location).toEqual(location);
}

/**
 * Creates a button element with the specified ID, appends it to the document body, and returns the created button.
 *
 * @param {string} id - The ID to assign to the created button element.
 * @returns {HTMLButtonElement} The created button element.
 */
export function createTestButton(id) {
    const btn = document.createElement("button");
    btn.id = id;
    document.body.appendChild(btn);
    return btn;
}
