/*global describe, it, expect, beforeEach, afterEach, expectAsync  --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */

import {FunctionRegistry} from "../../src/FunctionRegistry.js"
import { ActionFunction } from "../../src/ActionFunction.js";

describe("FunctionRegistry", () => {

    it("a registered function can be found", () => {
    
        let registry = new FunctionRegistry();

        registry.registerFunction(["A","B","C"], "D", "fn1" );
        registry.registerFunction(["E","F","G"], "H", "fn2");

        let found = registry.find(["E","F","G"], "H");

        expect(found).toBe("fn2");
    
    })


    it("a registered function using wildcards can be found", () => { 

        let registry = new FunctionRegistry();

        registry.registerFunction(["A","B"], "O", "fn1" );
        registry.registerFunction(["C","B"], "O", "fn2");
        registry.registerFunction(["D","E"], "P", "fn3");

        let found = registry.findPartial(["*","B"], "O");

        expect(found).toEqual(["fn1","fn2"]);
        
    })

    it("a single registered function using wildcards can be found", () => { 

        let registry = new FunctionRegistry();

        registry.registerFunction(["A","B"], "P", "fn1" );
        registry.registerFunction(["C","B"], "O", "fn2");
        registry.registerFunction(["D","E"], "P", "fn3");

        let found = registry.findPartial(["*","B"], "O");

        expect(found).toEqual(["fn2"]);
        
    })

    describe("call()", () => {
        const TOOL_URL = "test://t1.url/toolfunction";
        const TOOL_RESPONSE = '{ "validationResult": "PASS", "output": "Test" }';
        const CONVERSION_FUNCTION_ID =  "test-function-id";

        const PARAMETER_1_NAME = "test-param-1";
        const PARAMETER_2_NAME = "language";

        const PARAMETERS_INPUT = {
            [PARAMETER_1_NAME]: "Parameter 1 value",
            [PARAMETER_2_NAME]: "Parameter 2 value"
        };

        let registry;


        beforeEach(()=>{
            // Setup
            jasmine.Ajax.install();

            jasmine.Ajax.stubRequest(TOOL_URL).andReturn({
                "responseText": TOOL_RESPONSE,
                "status": 200
            });

            // platform - toolsManager
            let toolsManagerSpy =  jasmine.createSpyObj(['getActionFunction']);
            toolsManagerSpy.getActionFunction.and.returnValue(new ActionFunction({
                path: TOOL_URL
            }));

            registry = new FunctionRegistry(toolsManagerSpy);
        })

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });  

        it("returns the result via promise", async () => {
            // Call the target object
            const functionResponse = registry.call(CONVERSION_FUNCTION_ID, PARAMETERS_INPUT);

            // Check the expected results
            await expectAsync(functionResponse).toBeResolvedTo(TOOL_RESPONSE);
        })

        it("sends a request to the tool service url", async () => {
            // Call the target object
            registry.call(CONVERSION_FUNCTION_ID, PARAMETERS_INPUT);

            // Check the expected results
            const request = jasmine.Ajax.requests.mostRecent();
            expect(request.data()).toEqual( PARAMETERS_INPUT );
        })
    })

})