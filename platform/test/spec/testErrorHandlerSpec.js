/*global describe, it, beforeEach, expect --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */

import { EducationPlatformError } from "../../src/EducationPlatformError.js";
import {ErrorHandler} from "../../src/ErrorHandler.js"

describe("ErrorHandler", () => {

    // Setup
    let notifierSpy;

    beforeEach(()=>{
        notifierSpy = jasmine.createSpy("notifier");
    })

    describe("constructor()", () => {
        it("initialises displayError with the given notifier function", () =>{
            // Call the target object
            const eh = new ErrorHandler(notifierSpy);

            // Check the expected results
            expect(eh.displayError).toBe(notifierSpy);
        });

        it("initialises window.onError with function that calls notify", () =>{
            const error = new EducationPlatformError("Error Information");

            // Call the target object
            new ErrorHandler(notifierSpy);
            window.onerror("testEvent,","testSource", undefined, undefined, error );

            // Check the expected results
            expect(notifierSpy).toHaveBeenCalledWith(jasmine.stringMatching(`(U|u)nexpected.*${error.message}`));
        });
    })

    describe("notify()", () => {
        it("calls notifier function with error information", () =>{

            const MESSAGE = "Test Message";
            const error = new EducationPlatformError("Error Information");
            const eh = new ErrorHandler(notifierSpy);

            // Call the target object
            eh.notify(MESSAGE, error);

            // Check the expected results
            expect(notifierSpy).toHaveBeenCalledWith(jasmine.stringMatching(`${MESSAGE}.*${error.message}`));
        });
    })

})