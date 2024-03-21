/*global describe, it, expect, beforeEach, jasmine, spyOn --  functions provided by Jasmine */
import { ActivityValidator, ERROR_CATEGORY, errorFileType} from "../../src/ActivityValidator";
import {customMatchers, checkErrorPopulated} from "../resources/TestUtility.js"

describe("ActivityValidator", () => {
    beforeEach( () => {
        jasmine.addMatchers(customMatchers);
    })

    describe("checkLayoutPanelIdsExist()", () => {
        it("returns no errors if panel ids can be resolved", () => {
            //Setup
            const activity = {
                id: "a1",
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

            // Call the target object
            let result = ActivityValidator.checkLayoutPanelIdsExist(activity);

             // Check the expected result
            expect(result).toHaveSize(0);
        })
        
        it("returns an error if a panel ids cannot be resolved", () => {
            //Setup
            const activity = {
                id: "a1",
                layout: { 
                    area: [["p1", "p2"],
                           ["X",   ""]]
                },
                panels:[
                    {id: "p1"},
                    {id: "p2"},
                    {id: "p3"}
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkLayoutPanelIdsExist(activity);
            let e = result[0];

            // Check the expected results
            expect(result).toHaveSize(1);
            checkErrorPopulated(e, ERROR_CATEGORY, errorFileType.ACTIVITY, ["panel", "does not exist"], "activity.id: a1, layout -> area -> X");
        })
    })


    describe("checkActions()", () => {        
        it("returns no errors if panel ids can be resolved", () => {
            //Setup
            const activity = {
                id: "a1",
                actions: [
                    {
                        source: {id:"p1"}, 
                        sourceButton: "",
                        parameters: {}, 
                        output: {id: "p2"},
                        outputConsole: {id: "p3"}
                    }
                ],
                panels:[
                    {id: "p1"},
                    {id: "p2"},
                    {id: "p3"}
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkActions(activity);

            // Check the expected results
            expect(result).toHaveSize(0);
        })

        it("returns an error if source panel ids cannot be resolved", () => {
            //Setup
            const activity = {
                id: "a1",
                actions: [
                    {
                        source: "X", 
                        sourceButton: "",
                        parameters: {}, 
                        output: {id:"p2"}
                    }
                ],
                panels:[
                    {id: "p1"},
                    {id: "p2"},
                    {id: "p3"}
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkActions(activity);
            let e = result[0];

            // Check the expected results
            expect(result).toHaveSize(1);
            checkErrorPopulated(e, ERROR_CATEGORY, errorFileType.ACTIVITY, ["panel", "does not exist"], 
                                "activity.id: a1, actions[0] -> source: X");
        })

        it("returns an error if output panel ids cannot be resolved", () => {
            //Setup
            const activity = {
                id: "a1",
                actions: [
                    {
                        source: {id:"p1"}, 
                        sourceButton: "",
                        parameters: {}, 
                        output: "X"
                    }
                ],
                panels:[
                    {id: "p1"},
                    {id: "p2"},
                    {id: "p3"}
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkActions(activity);
            let e = result[0];

            // Check the expected results
            expect(result).toHaveSize(1);
            checkErrorPopulated(e, ERROR_CATEGORY, errorFileType.ACTIVITY, ["panel", "does not exist"], 
                                "activity.id: a1, actions[0] -> output: X");
        })

        it("returns an error if outputConsole panel ids cannot be resolved", () => {
            //Setup
            const activity = {
                id: "a1",
                actions: [
                    {
                        source: {id:"p1"}, 
                        sourceButton: "",
                        parameters: {}, 
                        output: {id: "p2"},
                        outputConsole: "X"
                    }
                ],
                panels:[
                    {id: "p1"},
                    {id: "p2"},
                    {id: "p3"}
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkActions(activity);
            let e = result[0];

            // Check the expected results
            expect(result).toHaveSize(1);
            checkErrorPopulated(e, ERROR_CATEGORY, errorFileType.ACTIVITY, ["panel", "does not exist"], 
                                "activity.id: a1, actions[0] -> outputConsole: X");
        })
    })


    describe("checkPanelRefs()", () => {        
        it("returns no errors if panel definition refs are resolved", () => {
            //Setup
            const activity = {
                id: "a1",
                panels:[
                    {id: "p1", ref: {}},
                    {id: "p2", ref: {}},
                    {id: "p3", ref: {}}
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkPanelRefs(activity);

            // Check the expected results
            expect(result).toHaveSize(0);
        })

        it("returns an error if a panel definition ref is not resolved", () => {
            //Setup
            const activity = {
                id: "a1",
                panels:[
                    {id: "p1", ref: {}},
                    {id: "p2", ref: "X"},
                    {id: "p3", ref: {}}
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkPanelRefs(activity);

            // Check the expected results
            expect(result).toHaveSize(1);
            let e = result[0];
            checkErrorPopulated(e, ERROR_CATEGORY, errorFileType.ACTIVITY, ["panel", "does not exist"], 
                                "activity.id: a1, panels[1] -> id: p2, ref: X");
        })
    })

    describe("checkPanelDefs()", () => {        
        it("returns no errors if panel definitions are valid", () => {
            //Setup
            const tool = {
                id: "t1",

                panelDefs: [
                    {
                        id: "pd-1", 
                        buttons: [{id: "bt1", actionfunction: "f1"},
                                  {id: "bt2", renderfunction: "f3"}]}
                ],

                functions:[
                    {id: "f1"},
                    {id: "f2"},
                    {id: "f3"},
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkPanelDefs(tool);

            // Check the expected results
            expect(result).toHaveSize(0);
        })

        it("returns an error if a panel definition button actionfunction ref cannot be resolved", () => {
            //Setup
            const tool = {
                id: "t1",

                panelDefs: [
                    {
                        id: "pd-1", 
                        buttons: [{id: "bt1", actionfunction: "X"},
                                  {id: "bt2", renderfunction: "f3"}]}
                ],

                functions:[
                    {id: "f1"},
                    {id: "f2"},
                    {id: "f3"},
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkPanelDefs(tool);
            let e = result[0];

            // Check the expected results
            expect(result).toHaveSize(1);
            checkErrorPopulated(e, ERROR_CATEGORY, errorFileType.TOOL, ["function", "does not exist"], 
                                "tool.id: t1, panelDefs[0]: -> id: pd-1 -> buttton.id: bt1, actionfunction: X");
        })

        it("returns an error if a panel definition button renderfunction ref cannot be resolved", () => {
            //Setup
            const tool = {
                id: "t1",

                panelDefs: [
                    {
                        id: "pd-1", 
                        buttons: [{id: "bt1", actionfunction: "f1"},
                                  {id: "bt2", renderfunction: "X"}]}
                ],

                functions:[
                    {id: "f1"},
                    {id: "f2"},
                    {id: "f3"},
                ]
            }

            // Call the target object
            let result = ActivityValidator.checkPanelDefs(tool);
            let e = result[0];

            // Check the expected results
            expect(result).toHaveSize(1);
            checkErrorPopulated(e, ERROR_CATEGORY, errorFileType.TOOL, ["function", "does not exist"], 
                                "tool.id: t1, panelDefs[0]: -> id: pd-1 -> buttton.id: bt2, renderfunction: X");
        })
    })

    describe("validate()", () => {        
        it("returns no errors if valid activity and tools are given", () => {
            //Setup
            const activity = {
                id: "a1",
                actions: [
                    {
                        source: {id:"p1"}, 
                        sourceButton: "",
                        parameters: {}, 
                        output: {id: "p2"},
                        outputConsole: {id: "p3"}
                    }
                ],
                panels:[
                    {id: "p1", ref: {}},
                    {id: "p2", ref: {}},
                    {id: "p3", ref: {}}
                ],
                layout: { 
                    area: [["p1", "p2"],
                           ["p3", ""]]
                }
            }

            const tool = {
                id: "t1",

                panelDefs: [
                    {
                        id: "pd-1", 
                        buttons: [{id: "bt1", actionfunction: "f1"},
                                  {id: "bt2", renderfunction: "f2"}]}
                ],

                functions:[
                    {id: "f1"},
                    {id: "f2"},
                    {id: "f3"},
                ]
            }
            // Call the target object
            let result = ActivityValidator.validate(activity, [tool]);

            // Check the expected results
            expect(result).toHaveSize(0);
        })

        it("returns errors if invalid activity and tools are given", () => {
            //Setup
            const activity = {
                id: "a1",
                actions: [
                    {
                        source: "X", 
                        sourceButton: "",
                        parameters: {}, 
                        output: {id: "p2"},
                        outputConsole: {id: "p3"}
                    }
                ],
                panels:[
                    {id: "p1", ref: {}},
                    {id: "p2", ref: {}},
                    {id: "p3", ref: {}}
                ],
                layout: { 
                    area: [["p1", "p2"],
                           ["p3", ""]]
                }
            }

            const tool = {
                id: "t1",

                panelDefs: [
                    {
                        id: "pd-1", 
                        buttons: [{id: "bt1", actionfunction: "f1"},
                                  {id: "bt2", renderfunction: "f2"}]}
                ],

                functions:[
                    {id: "X"},
                    {id: "f2"},
                    {id: "f3"},
                ]
            }
            // Call the target object
            let result = ActivityValidator.validate(activity, [tool]);

            // Check the expected results
            expect(result).toHaveSize(2); // The actual error are checke in individual tests.
        })

        it("calls all validation functions", () => {
            //Setup
            let monitoredFunctions = [];
            monitoredFunctions.push( spyOn( ActivityValidator, "checkLayoutPanelIdsExist").and.returnValue([]) );
            monitoredFunctions.push( spyOn( ActivityValidator, "checkActions").and.returnValue([]) );
            monitoredFunctions.push( spyOn( ActivityValidator, "checkPanelRefs").and.returnValue([]) );
            monitoredFunctions.push( spyOn( ActivityValidator, "checkPanelDefs").and.returnValue([]) );

            // Call the target object
            ActivityValidator.validate({}, [{}]);

            // Check the expected results
            for (let mf of monitoredFunctions){
                expect(mf).toHaveBeenCalled();
            }
        })
    })

    describe("idExists()", () => {        
        it("returns true if an id that exists in the items is found", () => {
            //Setup
            const items = [{id:"id1"}, {id:"id2"}, {id:"id3"}, {id:"id4"}, {id:"id5"}];
            const ID_TO_FIND = "id3";

            // Call the target object
            let result = ActivityValidator.idExists(items, ID_TO_FIND);

            // Check the expected results
            expect(result).toBeTrue();
        })

        it("returns false if an id does not exist in the items", () => {
            //Setup
            const items = [{id:"id1"}, {id:"id2"}, {id:"id3"}, {id:"id4"}, {id:"id5"}];
            const ID_TO_FIND = "X";

            // Call the target object
            let result = ActivityValidator.idExists(items, ID_TO_FIND);

            // Check the expected results
            expect(result).toBeFalse();
        })

        it("returns true if an id that exists in the items is found where the items are classes", () => {
           //Setup
            const ID_TO_FIND = "id4";

            class TestHasId {
                id;
                constructor (newId){
                    this.id = newId;
                }
                getId(){
                    return this.id;
                } 
            }
            
            let items = [];
            items.push(new TestHasId("id1" ));
            items.push(new TestHasId("id2" ));
            items.push(new TestHasId("id3" ));
            items.push(new TestHasId("id4" ));
            items.push(new TestHasId("id5" ));

            // Call the target object
            let result = ActivityValidator.idExists(items, ID_TO_FIND);

            // Check the expected results
            expect(result).toBeTrue();
        })
    })
})
