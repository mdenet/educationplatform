
import { ActivityValidator } from "../../src/ActivityValidator";
import { ConfigValidationError } from '../../src/ConfigValidationError';

describe("ActivityValidator", () => {

    it("checkLayoutPanelIdsExist - layout panel ids no error", () => {
    
        const activity = {
            layout: { 
                area: [["p1", "p2"],
                    ["p3", ""]]
            },
            panels:[
                {id: "p1"},
                {id: "p2"},
                {id: "p3"}
            ]
        }

        let result = ActivityValidator.checkLayoutPanelIdsExist(activity);

            
        expect(result.length).toEqual(0);
    })
    
    it("checkLayoutPanelIdsExist - layout panel ids missing panel", () => {
    
        const activity = {
            layout: { 
                area: [["p1", "p2"],
                       ["X", ""]]
            },
            panels:[
                {id: "p1"},
                {id: "p2"},
                {id: "p3"}
            ]
        }

        let result = ActivityValidator.checkLayoutPanelIdsExist(activity);

        expect(result.length).toEqual(1);
        expect(result.pop()).toBeInstanceOf(ConfigValidationError);
    })


})
