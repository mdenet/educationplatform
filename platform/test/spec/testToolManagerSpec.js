/*global describe, it, expect, spyOn, beforeEach, afterEach, expectAsync --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */

import { ToolManager } from "../../src/ToolsManager.js";
import { TOOL_1PANELDEF_1FUNCTION } from "../resources/TestToolFiles.js";
import { ActionFunction } from "../../src/ActionFunction.js";
import { FunctionRegistry } from "../../src/FunctionRegistry.js";

import "jasmine-ajax"

describe("ToolManager", () => {

    describe("constructor", () => {
        it("can be created", () => {
            // Call the target object
            let tm = new ToolManager();

            // Check the expected results
            expect(tm).toBeInstanceOf(ToolManager);
        })
    })

    describe("initialisation", () => {
         // Setup
        const TOOL_URLS= [ "test://t1.url/tool-config.json",
                           "test://t2.url/tool-config.json",
                           "test://t3.url/tool-config.json" ];
        let tm;

        beforeEach( () => {
            jasmine.Ajax.install();
           
            spyOn(XMLHttpRequest.prototype, "open").and.callThrough();
            spyOn(XMLHttpRequest.prototype, "send").and.callThrough();

            tm = new ToolManager();
        })

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });
         
        it("sets tools URLs correctly", () => {
            // Call the target object
            tm.setToolsUrls(TOOL_URLS);
    
            // Check the expected results
            expect(tm.toolsUrls).toHaveSize(TOOL_URLS.length);
            
            for (let i = 0; i < TOOL_URLS.length; i++ ){
                expect(tm.toolsUrls[i].url).toEqual(TOOL_URLS[i]);
            }
        })

        it("fetches the tool configuration from the remote given by its URL", () => {
            // Call the target object
            tm.setToolsUrls(TOOL_URLS);

            // Check the expected results
            expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith("GET", TOOL_URLS[0],false);
        })

        it("getPort - detects and returns port in a URL placeholder and port combination", () => {
            let baseURLWithPort = '{{BASE-URL}}:12345'
            expect(tm.getPort(baseURLWithPort)).toEqual('12345')

            let baseURLOnly = '{{BASE-URL}}' 
            expect(tm.getPort(baseURLOnly)).toBeNull()
        })

        it("fetchPathByPort - fetch paths by a port number", () => {

            let port = 8080;
            expect(tm.fetchPathByPort(port)).toEqual('/')

            let incorrectPort = ''
            expect(tm.fetchPathByPort(incorrectPort)).toBeNull()
        })

        it("isValidUrl - test validity of urls", () => {
            var url = 'http://www.abc.cde'
            expect(tm.isValidUrl(url)).toBe(true)

            url = 'http://www.abc.cde/'
            expect(tm.isValidUrl(url)).toBe(true)

            url = 'www.abc.cde'
            expect(tm.isValidUrl(url)).toBe(true)

            url = 'http://www.abc.cde/some-path'
            expect(tm.isValidUrl(url)).toBe(true)

            url = 'http://127.0.0.1'
            expect(tm.isValidUrl(url)).toBe(true)

            url = 'http://127.0.0.1/'
            expect(tm.isValidUrl(url)).toBe(true)

            url = 'http://127.0.0.1:8080'
            expect(tm.isValidUrl(url)).toBe(true)

            url = 'http://127.0.0.1:8080/some-path'
            expect(tm.isValidUrl(url)).toBe(true)

            url = '127.0.0.1'
            expect(tm.isValidUrl(url)).toBe(true)

            url = 'somestring'
            expect(tm.isValidUrl(url)).toBe(false)

            url = ''
            expect(tm.isValidUrl(url)).toBe(false)
        })

        it("isUrlPlaceHolder - check if a string is a url placeholder", () => {
            var url = "{{BASE-URL}}"
            expect(tm.isUrlPlaceHolder(url)).toBe(true)

            var url = "{{BASE-URL}}:123"
            expect(tm.isUrlPlaceHolder(url)).toBe(true)

            var url = "{{ID-panel-turtles}}"
            expect(tm.isUrlPlaceHolder(url)).toBe(true)

            var url = "http://127.0.0.1/"
            expect(tm.isUrlPlaceHolder(url)).toBe(false)
        })

        it("parses and stores the tool configuration", () => {
            jasmine.Ajax.stubRequest('test://t1.url/tool-config.json').andReturn({
                "responseText": TOOL_1PANELDEF_1FUNCTION,
                "status": 200
            });

            // Call the target object
            tm.setToolsUrls(TOOL_URLS);

            // Check the expected results
            const TOOL1_ID= "tool-1"

            expect(tm.tools[TOOL1_ID]).toBeInstanceOf(Object);
            const EXPECTED_TOOL_KEYS = ["id", "name","version", "author", "homepage", "functions", "panelDefs"];

            const storedToolKeys = Object.keys(tm.tools[TOOL1_ID]);
            for (let key of EXPECTED_TOOL_KEYS){
                expect( storedToolKeys.find(n => n===key ) ).toEqual(key);
            }
        })
    })

    describe("panel definitions", () => {
        // Setup
        const TOOL_URLS= [ "test://t1.url/tool-config.json" ];
        const PANEL_DEF_ID = "paneldef-t1";
        let tm;

        beforeEach( () => {
            jasmine.Ajax.install();
           
            spyOn(XMLHttpRequest.prototype, "open").and.callThrough();
            spyOn(XMLHttpRequest.prototype, "send").and.callThrough();

            tm = new ToolManager();
        })

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });  

        it ("returns the correct object for an existing panel definition id", () => {
            jasmine.Ajax.stubRequest('test://t1.url/tool-config.json').andReturn({
                "responseText": TOOL_1PANELDEF_1FUNCTION,
                "status": 200
            });
            tm.setToolsUrls(TOOL_URLS);

            // Call the target object
            const foundPanelDef= tm.getPanelDefinition(PANEL_DEF_ID);

            // Check the expected results
            const toolConfig = JSON.parse(TOOL_1PANELDEF_1FUNCTION);
            const expectedPanelDef = toolConfig.tool.panelDefs[0];

            expect(foundPanelDef).toBeInstanceOf(Object);
            expect(foundPanelDef).toEqual(expectedPanelDef);
        })

        it ("returns null for a panel definition id that does not exist", () => {
            jasmine.Ajax.stubRequest('test://t1.url/tool-config.json').andReturn({
                "responseText": TOOL_1PANELDEF_1FUNCTION,
                "status": 200
            });
            tm.setToolsUrls(TOOL_URLS);

            // Call the target object
            const foundPanelDef= tm.getPanelDefinition("X");

            // Check the expected results
            expect(foundPanelDef).toEqual(null)
        })
    
    })

    describe("tool grammar imports", () => {
        // Setup
        const TOOL_BASE_URL = "test://t1.url";
        const TOOL_URL= TOOL_BASE_URL + "/tool-config.json";
        const TOOL_LANGUAGE_NAME = "test";
        let tm;

        beforeEach( () => {
            jasmine.Ajax.install();
           
            spyOn(XMLHttpRequest.prototype, "open").and.callThrough();
            spyOn(XMLHttpRequest.prototype, "send").and.callThrough();

            tm = new ToolManager();

            jasmine.Ajax.stubRequest(TOOL_URL).andReturn({
                "responseText": TOOL_1PANELDEF_1FUNCTION,
                "status": 200
            });

            tm.setToolsUrls([TOOL_URL]);
        })

        afterEach(function() {
            jasmine.Ajax.uninstall();
        });  

        it ("correctly loads the URL of the ace grammar for a defined tool", () => {
            // Call the target object
            const grammarImports = tm.getToolsGrammarImports();

            // Check the expected results
            expect(grammarImports[0].url).toEqual( TOOL_BASE_URL + "/highlighting.js");
        })


        it ("correctly loads the ace grammar module for a defined tool", () => {
            // Call the target object
            const grammarImports = tm.getToolsGrammarImports();

            // Check the expected results
            expect(grammarImports[0].module).toEqual( "ace/mode/"+ TOOL_LANGUAGE_NAME);
        })
    })


    describe( "invokeActionFunction()", ()=>{
        const ACTION_FUNCTION_ID = "function-test";
        const TOOL_LANGUAGE = "lang";

        const PARAM1_NAME = "param1";
        const PARAM1_VALUE = "panel-1's contents";
        const PARAM1_CONVERTED_VALUE = "param1's converted contents";

        const PARAM2_NAME = "param2";
        const PARAM2_VALUE = "param2's contents";
        const PARAM2_CONVERTED_VALUE = "param2's converted contents";

        // types the test action functions are expecting
        const ACTION_FUNCTION_PARAM1_TYPE = "type1";
        const ACTION_FUNCTION_PARAM2_TYPE = "type2";
        const ACTION_FUNCTION_RESULT= "Test function result";

        let tm;
        let functionRegistrySpy_resolve;
    
        beforeEach(() => {
            // Setup    
            tm = new ToolManager();

            //    toolsmanager - functionRegister
            functionRegistrySpy_resolve = spyOn(FunctionRegistry.prototype, "resolve").and.returnValue(
                new ActionFunction({
                    parameters: [
                        {name: PARAM1_NAME, type: ACTION_FUNCTION_PARAM1_TYPE},
                        {name: "language", type: "text"}
                    ]
                })
            );
             
            spyOn (FunctionRegistry.prototype, "call").and.returnValue ( 
                new Promise(function(resolve) {
                    resolve(ACTION_FUNCTION_RESULT);
                })
            );
        })

        it("returns the result via a promise", async () => {
            const PARAM1_TYPE = ACTION_FUNCTION_PARAM1_TYPE;

            const parameterMap = new Map (
                [[PARAM1_NAME, {type: PARAM1_TYPE, value: PARAM1_VALUE}],
                 ["language", {type: "text", value: TOOL_LANGUAGE }] ]
            )

            // Call the target object
            const returnedResult = tm.invokeActionFunction(ACTION_FUNCTION_ID, parameterMap);

            await expectAsync(returnedResult).toBeResolvedTo(ACTION_FUNCTION_RESULT);
        })

        it("calls functionRegister.call() with the given parameter values for matching types", async () => {
            const PARAM1_TYPE = ACTION_FUNCTION_PARAM1_TYPE;

            const parameterMap = new Map (
                [[PARAM1_NAME, {type: PARAM1_TYPE, value: PARAM1_VALUE}],
                 ["language", {type: "text", value: TOOL_LANGUAGE }] ]
            )

            // Call the target object
            await tm.invokeActionFunction(ACTION_FUNCTION_ID, parameterMap);

            // Check the expected results
            const EXPECTED_PARAM_VALUES = {
                [PARAM1_NAME]: PARAM1_VALUE,
                "language": TOOL_LANGUAGE
            }
            
            expect(tm.functionRegister.call).toHaveBeenCalledWith(ACTION_FUNCTION_ID, EXPECTED_PARAM_VALUES);
        })

        it("calls functionRegister.call() with the converted parameter values for non-matching types", async () => {
            const PARAM1_TYPE = "typex";

            const parameterMap = new Map (
                [[PARAM1_NAME, {type: PARAM1_TYPE, value: PARAM1_VALUE}],
                 ["language", {type: "text", value: TOOL_LANGUAGE }] ]
            )
            
            spyOn( ToolManager.prototype, "convert").and.returnValue(
                new Promise(function(resolve) {
                    resolve( {name: PARAM1_NAME, data: PARAM1_CONVERTED_VALUE} );
                })
            );

            // Call the target object
            await tm.invokeActionFunction(ACTION_FUNCTION_ID, parameterMap);

            // Check the expected results
            const EXPECTED_PARAM_VALUES = {
                [PARAM1_NAME]: PARAM1_CONVERTED_VALUE,
                "language": TOOL_LANGUAGE
            }

            expect(tm.convert).toHaveBeenCalledWith(PARAM1_VALUE, PARAM1_TYPE, ACTION_FUNCTION_PARAM1_TYPE, PARAM1_NAME);
            expect(tm.functionRegister.call).toHaveBeenCalledWith(ACTION_FUNCTION_ID, EXPECTED_PARAM_VALUES);
        })

        it("calls functionRegister.call() with the converted parameter values for non-matching types including a metamodel", async () => {
            const PARAM1_TYPE = "typex";
            const PARAM2_TYPE = "typez";

            const parameterMap = new Map (  // input to invokeActionFunction
                [[PARAM1_NAME, {type: PARAM1_TYPE, value: PARAM1_VALUE}],
                 [PARAM2_NAME, {type: PARAM2_TYPE, value: PARAM2_VALUE}],
                 ["language", {type: "text", value: TOOL_LANGUAGE }] ]
            )

            //    toolsmanager - functionRegister
            functionRegistrySpy_resolve.and.returnValue(
                new ActionFunction({
                    parameters: [
                        {name: PARAM1_NAME, type: ACTION_FUNCTION_PARAM1_TYPE, instanceOf: PARAM2_NAME},
                        {name: PARAM2_NAME, type: ACTION_FUNCTION_PARAM2_TYPE},
                        {name: "language", type: "text"}
                    ]
                })
            );
            
            //    toolsmanager - conversion function spies
            spyOn( ToolManager.prototype, "convertIncludingMetamodel").and.returnValue(
                new Promise(function(resolve) {
                    resolve( {name: PARAM1_NAME, data: PARAM1_CONVERTED_VALUE} );
                })
            );

            spyOn( ToolManager.prototype, "convert").and.returnValue(
                new Promise(function(resolve) {
                    resolve( {name: PARAM2_NAME, data: PARAM2_CONVERTED_VALUE} );
                })
            );

            // Call the target object
            await tm.invokeActionFunction(ACTION_FUNCTION_ID, parameterMap);

            // Check the expected results
            const EXPECTED_PARAM_VALUES = {
                [PARAM1_NAME]: PARAM1_CONVERTED_VALUE,
                [PARAM2_NAME]: PARAM2_CONVERTED_VALUE,
                "language": TOOL_LANGUAGE
            }

            expect(tm.convert).toHaveBeenCalledWith(PARAM2_VALUE, PARAM2_TYPE, ACTION_FUNCTION_PARAM2_TYPE, PARAM2_NAME);

            expect(tm.convertIncludingMetamodel).toHaveBeenCalledWith(PARAM1_VALUE, PARAM1_TYPE, 
                                                                            PARAM2_VALUE, PARAM2_TYPE,
                                                                            ACTION_FUNCTION_PARAM1_TYPE, PARAM1_NAME);

            expect(tm.functionRegister.call).toHaveBeenCalledWith(ACTION_FUNCTION_ID, EXPECTED_PARAM_VALUES);
        })
        
        it("sends requests to a conversion function's url without unused parameters", async () => {
            const PARAM1_TYPE = ACTION_FUNCTION_PARAM1_TYPE;

            const parameterMap = new Map (
                [[PARAM1_NAME, {type: PARAM1_TYPE, value: PARAM1_VALUE}],
                 ["language", {type: "text", value: TOOL_LANGUAGE }] ]
            )

            //    toolsmanager - functionRegister
            functionRegistrySpy_resolve.and.returnValue(
                new ActionFunction({
                    parameters: [
                        {name: PARAM1_NAME, type: ACTION_FUNCTION_PARAM1_TYPE, instanceOf: PARAM2_NAME},
                        {name: PARAM2_NAME, type: ACTION_FUNCTION_PARAM2_TYPE},
                        {name: "language", type: "text"}
                    ]
                })
            );
            
            // Call the target object
            await tm.invokeActionFunction(ACTION_FUNCTION_ID, parameterMap);

            // Check the expected results
            const EXPECTED_PARAM_VALUES = {
                [PARAM1_NAME]: PARAM1_VALUE,
                "language": TOOL_LANGUAGE
            }
            
            expect(tm.functionRegister.call).toHaveBeenCalledWith(ACTION_FUNCTION_ID, EXPECTED_PARAM_VALUES);
        })

    })


    describe("selectConversionFunctionConvertMetamodel()", () => { 
        let tm;

        const SOURCE_TYPE =  "test-source-type";
        const FILE_CONTENTS = "Test file contents.";
        const MM_FILE_CONTENTS = "Test metamodel file contents."
        const MM_TARGET_TYPE = "test-metamodel-target-type";
        const PARAM_NAME = "test";

        const CONVERSION_FUNCTION_ID = "conversion-function-id";
        const X_FUNCTION_ID = "x-function-id"; // Not interested

        let functionRegistrySpy_find;
        
        beforeEach( () => { 
            // Setup    
            tm = new ToolManager();

            //    toolsmanager - functionRegister
            functionRegistrySpy_find = spyOn(FunctionRegistry.prototype, "find");

            spyOn(ToolManager.prototype, "getActionFunction").and.callFake( (functionId) => {        
                let actionFunctionConfig;

                switch (functionId){
                    case CONVERSION_FUNCTION_ID:
                        actionFunctionConfig = {
                            parameters: [
                                {name: "input", type: SOURCE_TYPE, instanceOf: "metamodel"},
                                {name: "metamodel", type: MM_TARGET_TYPE}
                            ]
                        };
                        break;

                     case X_FUNCTION_ID:
                        actionFunctionConfig = {
                            parameters: [
                                {name: "input", type: SOURCE_TYPE, instanceOf: "metamodel"},
                                {name: "metamodel", type: "X"}
                            ]
                        }
                            break;
                    default:
                        actionFunctionConfig = null;
                }

                return new ActionFunction(actionFunctionConfig)
            })
        })

        it("returns a function id if a conversion is possible without considering the metamodel", async () => { 
            const CONSIDER_MM = false;
            let mm_type = MM_TARGET_TYPE;
            const typeValueMap = { [SOURCE_TYPE]: FILE_CONTENTS }

            // Call the target object
            let selectConversionResult =  await tm.selectConversionFunctionConvertMetamodel(mm_type, MM_FILE_CONTENTS, [CONVERSION_FUNCTION_ID, X_FUNCTION_ID], CONSIDER_MM, PARAM_NAME, typeValueMap)

            // Check the expected results
            expect(selectConversionResult).toEqual(CONVERSION_FUNCTION_ID);
        })

        it("returns null if a conversion is not possible without considering the metamodel", async () => { 
            const CONSIDER_MM = false;
            let mm_type = MM_TARGET_TYPE;
            const typeValueMap = { [SOURCE_TYPE]: FILE_CONTENTS }

            // Call the target object
            let selectConversionResult =  await tm.selectConversionFunctionConvertMetamodel(mm_type, MM_FILE_CONTENTS, [X_FUNCTION_ID, X_FUNCTION_ID], CONSIDER_MM, PARAM_NAME, typeValueMap)

            // Check the expected results
            expect(selectConversionResult).toEqual(null);
        })

        it("returns a function id, converts the metamodel, and adds the converted metamodel value to the typeValueMap if a conversion is possible considering the metamodel", async ()=>{ 
            const CONSIDER_MM = true;
            let mm_type = "test-metamodel-type";
            const typeValueMap = { [SOURCE_TYPE]: FILE_CONTENTS }

            const MM_CONVERSION_FUNCTION_ID = "metamodel-conversion-function-id";
            const MM_CONVERTED_CONTENTS = "Test converted metamodel contents.";

            const callConversionReturn = new Promise(function(resolve) {
                resolve({data: MM_CONVERTED_CONTENTS});
            })
            spyOn( FunctionRegistry.prototype, "callConversion").and.returnValue(
                callConversionReturn);

            functionRegistrySpy_find.and.returnValues(null, MM_CONVERSION_FUNCTION_ID); // Find possible conversion on the second call
            
            // Call the target object
            let selectConversionResult =  await tm.selectConversionFunctionConvertMetamodel(mm_type, MM_FILE_CONTENTS, [CONVERSION_FUNCTION_ID, X_FUNCTION_ID], CONSIDER_MM, PARAM_NAME, typeValueMap)

            // Check the expected results
            expect(tm.functionRegister.callConversion).toHaveBeenCalledWith(
                MM_CONVERSION_FUNCTION_ID, { [mm_type]: MM_FILE_CONTENTS}, PARAM_NAME
            );

            expect(typeValueMap[MM_TARGET_TYPE]).toEqual(MM_CONVERTED_CONTENTS);

            expect(selectConversionResult).toEqual(CONVERSION_FUNCTION_ID);
        })

        it("returns null if no conversion is available considering the metamodel", async () => { 
            const CONSIDER_MM = true;
            let mm_type = "test-metamodel-type";
            const typeValueMap = { [SOURCE_TYPE]: FILE_CONTENTS }

            spyOn( FunctionRegistry.prototype, "callConversion");

            functionRegistrySpy_find.and.returnValues(null, null); // Do not find possible conversion

            // Call the target object
            let selectConversionResult =  await tm.selectConversionFunctionConvertMetamodel(mm_type, MM_FILE_CONTENTS, [CONVERSION_FUNCTION_ID, X_FUNCTION_ID], CONSIDER_MM, PARAM_NAME, typeValueMap)

            // Check the expected results
            expect(tm.functionRegister.callConversion).not.toHaveBeenCalled();

            expect(typeValueMap[MM_TARGET_TYPE]).toEqual(undefined);

            expect(selectConversionResult).toEqual(null);
        })
    })


    describe("convert()", () => { 
        let tm;
        let findConversionSpy;

        const FILE_CONTENTS = "Test file contents.";
        const SOURCE_TYPE = "test-source-type";
        const TARGET_TYPE = "test-target-type";
        const PARAM_NAME = "test";
        const callConversionReturn = new Promise(function(resolve) {
            resolve(true);
        })

        const CONVERSION_FUNCTION_ID = "conversion-function-id";

        beforeEach(()=>{ 
            // Setup    
            findConversionSpy = spyOn( FunctionRegistry.prototype, "find").
            and.returnValue(CONVERSION_FUNCTION_ID);

            spyOn( FunctionRegistry.prototype, "callConversion").and.returnValue(
                callConversionReturn);


            const educationPlatformSpy =  jasmine.createSpyObj(['errorNotification']);

            tm = new ToolManager(educationPlatformSpy.errorNotification);
        })

        it("calls functionRegistry_callConversion on a conversion function being available", ()=>{ 
            // Call the target object
            tm.convert(FILE_CONTENTS, SOURCE_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(tm.functionRegister.callConversion).toHaveBeenCalledWith(
                CONVERSION_FUNCTION_ID, { [SOURCE_TYPE]: FILE_CONTENTS } , PARAM_NAME
            );

            expect(tm.errorNotification).not.toHaveBeenCalled();
        })

        it("returns a promise on a conversion function being available", ()=> {
            // Call the target object
            const convertResult = tm.convert(FILE_CONTENTS, SOURCE_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(convertResult).toEqual(callConversionReturn);
        })

        it("returns null and provides an error notification on a conversion function not being available", ()=> { 
            findConversionSpy.and.returnValue(null);

            // Call the target object
            const convertResult = tm.convert(FILE_CONTENTS, SOURCE_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(convertResult).toEqual(null);
            expect(tm.errorNotification).toHaveBeenCalledWith(jasmine.stringMatching("(N|n)o conversion function"))
        })

    })


    describe("convertIncludingMetamodel()", () => { 
        let tm;
        let findConversionSpy;

        const FILE_CONTENTS = "Test file contents.";
        const SOURCE_TYPE = "test-source-type";
        const TARGET_TYPE = "test-target-type";
        const MM_FILE_CONTENTS = "Test metamodel file contents."
        const MM_TYPE = "test-metamodel-type";
        const PARAM_NAME = "test";
        const callConversionReturn = new Promise(function(resolve) {
            resolve(true);
        })

        const CONVERSION_FUNCTION_ID = "conversion-function-id";

        beforeEach(()=>{ 
            // Setup    
            findConversionSpy = spyOn( FunctionRegistry.prototype, "findPartial").
            and.returnValue([CONVERSION_FUNCTION_ID]);

            spyOn( FunctionRegistry.prototype, "callConversion").and.returnValue(
                callConversionReturn);

            //    toolsmanager - get action function spy 
            spyOn(ToolManager.prototype, "getActionFunction").and.returnValue(new ActionFunction({
                parameters: [
                    {name: "input", type: SOURCE_TYPE, instanceOf: "metamodel"},
                    {name: "metamodel", type: MM_TYPE}
                ]
            }));

            const educationPlatformSpy =  jasmine.createSpyObj(['errorNotification']);

            tm = new ToolManager(educationPlatformSpy.errorNotification);
        })

        it("calls functionRegister.callConversion() on a conversion function being available", async ()=> { 
            // Call the target object
            await tm.convertIncludingMetamodel(FILE_CONTENTS, SOURCE_TYPE, MM_FILE_CONTENTS, MM_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(tm.functionRegister.callConversion).toHaveBeenCalledWith(
                CONVERSION_FUNCTION_ID, {[SOURCE_TYPE]: FILE_CONTENTS, [MM_TYPE]: MM_FILE_CONTENTS } , PARAM_NAME
            );

            expect(tm.errorNotification).not.toHaveBeenCalled();
        })

        it("returns a promise on a conversion function being available", async () => {
            // Call the target object
            const convertResult = tm.convertIncludingMetamodel(FILE_CONTENTS, SOURCE_TYPE, MM_FILE_CONTENTS, MM_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            await expectAsync(convertResult).toBePending();
        })

        it("returns null and provides an error notification on a conversion function not being available", async () => { 
            findConversionSpy.and.returnValue(null);

            // Call the target object
            const convertResult = await tm.convertIncludingMetamodel(FILE_CONTENTS, SOURCE_TYPE, MM_FILE_CONTENTS, MM_TYPE, TARGET_TYPE, PARAM_NAME);

            // Check the expected results
            expect(convertResult).toEqual(null);
            expect(tm.errorNotification).toHaveBeenCalledWith(jasmine.stringMatching("(N|n)o conversion function"))
        })
    })
})
