import {arrayEquals} from "../../src/Utility"

describe("Utility", () => {

    it("arrayEquals - arrays with matching values are the same", () => {
    
        const A = ["A", "B", "C", "D"];
        const B = ["A", "B", "C", "D"];

        let result = arrayEquals( A, B, true );

        expect(result).toBeTrue();    
    })

    it("arrayEquals - arrays with the same values in differing order are not the same", () => {
    
        const A = ["A", "B", "C", "D"];
        const B = ["D", "C", "B", "A"];

        let result = arrayEquals( A, B, true );

        expect(result).toBeFalse();    
    })

    it("arrayEquals - arrays with an any wildcard always match the corresponding element", () => {
    
        const A = ["A", "B", "*", "D"];
        

        const testElements = ["B","C","D","E","F"];
        
        let result = true;

        for ( let element of testElements ) {
            
            const B = ["A", "B", element, "D"];
     
            result = result && arrayEquals( A, B, true );
        }

        expect(result).toBeTrue(); 
    })

    it("arrayEquals - when allow any is not enabled, arrays with any wildcard do not match the corresponding element", () => {
    
        const A = ["A", "B", "*", "D"];
        

        const testElements = ["B","C","D","E","F"];
        
        let result = true;

        for ( let element of testElements ) {
            
            const B = ["A", "B", element, "D"];
     
            result = result && arrayEquals( A, B );
        }

        expect(result).toBeFalse(); 
    })

    it("arrayEquals - arrays with a wildcard and non matchng other element are not the same", () => {
    
        const A = ["A", "*", "C", "D"];
        const B = ["A", "B", "X", "D"];

        let result = arrayEquals( A, B, true );

        expect(result).toBeFalse();    
    })

})