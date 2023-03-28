import {FunctionRegistry} from "../../src/FunctionRegistry.js"

describe("FunctionRegistry", () => {

    it("a registered function can be looked up", () => {
    
        let registry = new FunctionRegistry();

        registry.registerFunction(["A","B","C"], "D", "fn1" );
        registry.registerFunction(["E","F","G"], "H", "fn2");

        let found = registry.lookupFunction(["E","F","G"], "H");

        expect(found).toBe("fn2");
    
    })


    it("a registered function using wildcards can be found", () => { 

        let registry = new FunctionRegistry();

        registry.registerFunction(["A","B"], "O", "fn1" );
        registry.registerFunction(["C","B"], "O", "fn2");
        registry.registerFunction(["D","E"], "P", "fn3");

        let found = registry.lookupFunctionsPartialMatch(["*","B"], "O");

        expect(found).toEqual(["fn1","fn2"]);
        
    })

    it("a single registered function using wildcards can be found", () => { 

        let registry = new FunctionRegistry();

        registry.registerFunction(["A","B"], "P", "fn1" );
        registry.registerFunction(["C","B"], "O", "fn2");
        registry.registerFunction(["D","E"], "P", "fn3");

        let found = registry.lookupFunctionsPartialMatch(["*","B"], "O");

        expect(found).toEqual(["fn2"]);
        
    })


})