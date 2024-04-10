/*global describe, it, beforeEach, expect, spyOn --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */

import { EducationPlatformError } from "../../src/EducationPlatformError.js";
import {ErrorHandler} from "../../src/ErrorHandler.js"
import { PlaygroundUtility } from "../../src/PlaygroundUtility.js";

describe("ErrorHandler", () => {

    // Setup
    let notifierSpy;

    beforeEach(()=>{
        notifierSpy = spyOn(PlaygroundUtility,"errorNotification");
    })

    describe("constructor()", () => {
        it("initialises window.onError with function that calls notify", () =>{
            const error = new EducationPlatformError("Error Information");

            // Call the target object
            new ErrorHandler();
            window.onerror("testEvent,","testSource", undefined, undefined, error );

            // Check the expected results
            expect(notifierSpy).toHaveBeenCalledWith(jasmine.stringMatching(`(U|u)nexpected.*${error.message}`));
        });
    })

    describe("notify()", () => {
        it("calls errorNotification() with error information", () =>{

            const MESSAGE = "Test Message";
            const error = new EducationPlatformError("Error Information");
            const eh = new ErrorHandler();

            // Call the target object
            eh.notify(MESSAGE, error);

            // Check the expected results
            expect(notifierSpy).toHaveBeenCalledWith(jasmine.stringMatching(`${MESSAGE}.*${error.message}`));
        });
    })

})