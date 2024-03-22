/*global describe, it, expect, beforeEach, afterEach, expectAsync  --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */

import {FunctionRegistry} from "../../src/FunctionRegistry.js"
import { ActionFunction } from "../../src/ActionFunction.js";

describe("FunctionRegistry", () => {

    it("can find a registered function", () => {
    
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

            // toolsmanager - get action function spy
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


    describe("callConversion()", () => {
        const TOOL_URL = "test://t1.url/toolfunction";
        const CONVERSION_FUNCTION_ID = "test-function-id";
        const PARAMETER_NAME = "testParameter1";
        const TYPE_MODEL = "type-model";
        const TYPE_METAMODEL = "type-metamodel";
        const MODEL_CONTENTS = "Parameter 1 model value";
        const METAMODEL_CONTENTS = "Parameter 2 metamodel value";

        const TYPE_MAP_INPUT = {
            [TYPE_MODEL]: MODEL_CONTENTS,
            [TYPE_METAMODEL]: METAMODEL_CONTENTS
        };

        const CONVERSION_PARAM_IN = "input";
        const CONVERSION_PARAM_MM = "metamodel";
        const CONVERTED_MODEL = "Converted model contents.";
        const TOOL_RESPONSE = `{"output": "${CONVERTED_MODEL}"}`;

        let registry;


        beforeEach(()=>{
            // Setup
            jasmine.Ajax.install();

            //    xhr
            jasmine.Ajax.stubRequest(TOOL_URL).andReturn({
                "responseText": TOOL_RESPONSE,
                "status": 200
            });

            // toolsmanager - get action function spy
            let toolsManagerSpy =  jasmine.createSpyObj(['getActionFunction']);
            toolsManagerSpy.getActionFunction.and.returnValue(new ActionFunction({
                parameters: [
                    {name: CONVERSION_PARAM_IN, type: TYPE_MODEL, instanceOf: "metamodel"},
                    {name: CONVERSION_PARAM_MM, type: TYPE_METAMODEL}
                ],
                path: TOOL_URL
            }));

            registry = new FunctionRegistry(toolsManagerSpy);
        })

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });  

        it("sends a request to the tool service url", async () => {
            const EXPECTED_REQUEST = {
                [CONVERSION_PARAM_IN]: MODEL_CONTENTS,
                [CONVERSION_PARAM_MM]: METAMODEL_CONTENTS
            }

            // Call the target object
            registry.callConversion(CONVERSION_FUNCTION_ID, TYPE_MAP_INPUT, PARAMETER_NAME);

            // Check the expected results
            const request = jasmine.Ajax.requests.mostRecent();
            expect(request.data()).toEqual( EXPECTED_REQUEST );
        })

        it("returns the converted result via a promise", async () => {
            const EXPECTED_RESPONSE = { name: PARAMETER_NAME, data: CONVERTED_MODEL }; // Format given by utility jsonRequestConversion() 

            // Call the target object
            const conversionResponse = registry.callConversion(CONVERSION_FUNCTION_ID, TYPE_MAP_INPUT, PARAMETER_NAME);

            // Check the expected results
            await expectAsync(conversionResponse).toBeResolvedTo(EXPECTED_RESPONSE);
        })
    })
})