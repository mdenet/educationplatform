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
    
    
    it("object creation - id", () => {
    
        let actionFunction = new ActionFunction(testActionFunctionConfig);

        let id = actionFunction.getId(); 

        expect(id).toBe("af-id");    
    })

    it("instance of a parameter name returns the the corresponding id", () => {
        let actionFunction = new ActionFunction(testActionFunctionConfig);

        let foundParamName = actionFunction.getInstanceOfParamName("af-param3");

        expect(foundParamName).toBe("af-param1")
    })

    //TODO make type an object
    xit("instance of a the return type returns the the corresponding id", () => {
        let actionFunction = new ActionFunction(testActionFunctionConfig);

        let foundParamName = actionFunction.getInstanceOfParamName();

        expect(foundParamName).toBe("af-param1")
    })

})