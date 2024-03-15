/*global describe, it, expect, spyOn, beforeEach, afterEach --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */

import { ToolManager } from "../../src/ToolsManager.js";
import { TOOL_1PANELDEF_1FUNCTION } from "../resources/TestToolFiles.js";
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
})
