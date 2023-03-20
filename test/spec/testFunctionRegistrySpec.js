import {FunctionRegistry} from "../../src/FunctionRegistry.js"

describe("FunctionRegistry", () => {

    it("a registered function can be looked up", () => {
    
        let registry = new FunctionRegistry();

        registry.registerFunction(["A","B","C"], "D", "fn1" );
        registry.registerFunction(["E","F","G"], "H", "fn2");

        let found = registry.lookupFunction(["E","F","G"], "H");

        expect(found).toBe("fn2");
    
    })

})