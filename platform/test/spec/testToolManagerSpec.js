
import {ToolManager} from "../../src/ToolsManager.js"


describe("ToolManager", () => {

        it("can be created", () => {
        
                var tm = new ToolManager(["test-url"]);
                
                var tmType = typeof tm;
                
                expect(tmType).toBe("object");
        
        })
        
    
})
