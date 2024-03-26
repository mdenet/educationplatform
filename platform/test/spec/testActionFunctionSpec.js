/*global describe, it, expect --  functions provided by Jasmine */

import {ActionFunction} from "../../src/ActionFunction.js"

describe("ActionFunction", () => {

    const testActionFunctionConfig= JSON.parse(  
        '{ \n' +
        '"id": "af-id", \n' +
        '"name": "af-name", \n' +
        '"parameters": [ {"name":"af-param1", "type":"af-type1"}, \n' +
        '                {"name":"af-param2", "type":"af-type2"}, \n' +
        '                {"name":"af-param3", "type":"af-type3", "instanceOf": "af-param1"}], \n' +
        '"returnType": "af-type4", \n' +
        '"path": "http://localhost:9090" \n' +
        ' }' 
    );                             
    
    describe("constructor()", () => {
        it("sets the created ActionFunction's id from a given config object", () => {
        
            let actionFunction = new ActionFunction(testActionFunctionConfig);

            let id = actionFunction.getId(); 

            expect(id).toBe("af-id");    
        })
    })

    describe("getInstanceOfParamName()", () => {
        it("returns the instanceOf parameter name for the given parameter if it is an instance of a metamodel", () => {
            let actionFunction = new ActionFunction(testActionFunctionConfig);

            let foundParamName = actionFunction.getInstanceOfParamName("af-param3");

            expect(foundParamName).toEqual("af-param1")
        })

        it("returns null if the given parameter is not an instance of a metamodel", () => {
            let actionFunction = new ActionFunction(testActionFunctionConfig);

            let foundParamName = actionFunction.getInstanceOfParamName("af-param2");

            expect(foundParamName).toEqual(null)
        })
    })
})