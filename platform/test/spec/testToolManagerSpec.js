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
        const TOOL_URLS= [ "test://t1.url/tool-config.json" ];
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
         
        it("tools URLs can be set", () => {
            // Call the target object
            tm.setToolsUrls(TOOL_URLS);

            // Check the expected results
            for (const t in tm.toolsUrls){
                expect(tm.toolsUrls[t].url).toEqual(TOOL_URLS[t]);
            }
        })

        it("the tool configuration is fetched from the remote given by its URL", () => {
            // Call the target object
            tm.setToolsUrls(TOOL_URLS);

            // Check the expected results
            expect(XMLHttpRequest.prototype.open).toHaveBeenCalledWith("GET", TOOL_URLS[0],false);
        })

        it("the tool configuration is parsed and stored", () => {
            jasmine.Ajax.stubRequest('test://t1.url/tool-config.json').andReturn({
                "responseText": TOOL_1PANELDEF_1FUNCTION,
                "status": 200
            });

            // Call the target object
            tm.setToolsUrls(TOOL_URLS);

            // Check the expected results
            const TOOL1_ID= "tool-1"

            expect(tm.tools[TOOL1_ID]).toBeInstanceOf(Object);
        })

        it("the tool configuration that is parsed and stored has the expected keys", () => {
            jasmine.Ajax.stubRequest('test://t1.url/tool-config.json').andReturn({
                "responseText": TOOL_1PANELDEF_1FUNCTION,
                "status": 200
            });

            // Call the target object
            tm.setToolsUrls(TOOL_URLS);

            // Check the expected results
            const TOOL1_ID= "tool-1"
            const EXPECTED_TOOL_KEYS = ["id", "name","version", "author", "homepage", "functions", "panelDefs"];

            const storedToolKeys = Object.keys(tm.tools[TOOL1_ID]);
            for (let key of EXPECTED_TOOL_KEYS){
                expect( storedToolKeys.find(n => n===key ) ).toEqual(key);
            }
        })
    })

    describe("panel definitions can be retrieved", () => {
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

        it ("for a panel definition id that exists its object is returned", () => {
            jasmine.Ajax.stubRequest('test://t1.url/tool-config.json').andReturn({
                "responseText": TOOL_1PANELDEF_1FUNCTION,
                "status": 200
            });
            tm.setToolsUrls(TOOL_URLS);

            // Call the target object
            const foundPanelDef= tm.getPanelDefinition(PANEL_DEF_ID);

            // Check the expected results
            expect(foundPanelDef).toBeInstanceOf(Object);
            expect(foundPanelDef.id).toEqual(PANEL_DEF_ID);
        })

        it ("for a panel definition id that does not exist null is returned", () => {
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

    describe("tool grammar import locations can be retrieved", () => {
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

        it ("the ace grammar urls for a tool defined", () => {
            // Call the target object
            const grammarImports = tm.getToolsGrammarImports();

            // Check the expected results
            expect(grammarImports[0].url).toEqual( TOOL_BASE_URL + "/highlighting.js");
        })


        it ("the ace grammar module for a tool is defined", () => {
            // Call the target object
            const grammarImports = tm.getToolsGrammarImports();

            // Check the expected results
            expect(grammarImports[0].module).toEqual( "ace/mode/"+ TOOL_LANGUAGE_NAME);
        })
    })
})
