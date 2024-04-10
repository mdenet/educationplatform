/*global describe, it, expect, spyOn, afterEach --  functions provided by Jasmine */
/*global jasmine --  object provided by Jasmine */
/*global $ -- jquery is externally imported*/

import { PlaygroundUtility } from "../../src/PlaygroundUtility";

describe("PlaygroundUtility", () => {

    describe("notification()", () => {
        const NOTIFICATION_TITLE = "ABC123";
        const NOTIFICATION_MESSAGE = "DEF456";

        it("displays a message with given title and text", () => {
        
            // Call the target object
            PlaygroundUtility.notification(NOTIFICATION_TITLE, NOTIFICATION_MESSAGE);

            // Check the expected results
            const documentMessages = $(".notify-message");

            expect(documentMessages).toHaveSize(1);

            expect(documentMessages.text()).toContain(NOTIFICATION_TITLE);
            expect(documentMessages.text()).toContain(NOTIFICATION_MESSAGE);
        })

        afterEach( () => {
            // Cleanup changes to document
            $(".notify-message").remove();
        })
    })

    describe("longNotification()", () => {
        
        const NOTIFICATION_TEXT = "ABC123";
        const NOTIFICATION_MESSAGE = "may take a few seconds to complete";

        it("calls notification() with the given text", () => {
            // Setup
            spyOn(PlaygroundUtility, "notification");

            // Call the target object
            PlaygroundUtility.longNotification(NOTIFICATION_TEXT);

            // Check the expected results
            expect(PlaygroundUtility.notification).toHaveBeenCalledWith(jasmine.stringMatching(NOTIFICATION_TEXT), jasmine.stringMatching(NOTIFICATION_MESSAGE), jasmine.anything());
        })
    })

    describe("successNotification()", () => {
        
        const NOTIFICATION_TEXT = "ABC123";
        const NOTIFICATION_TITLE = "Success";

        it("calls notification with the given text", () => {
            // Setup
            spyOn(PlaygroundUtility, "notification");

            // Call the target object
            PlaygroundUtility.successNotification(NOTIFICATION_TEXT);

            // Check the expected results
            expect(PlaygroundUtility.notification).toHaveBeenCalledWith(jasmine.stringMatching(NOTIFICATION_TITLE), jasmine.stringMatching(NOTIFICATION_TEXT), jasmine.anything());
        })
    })

    describe("errorNotification()", () => {
        
        const NOTIFICATION_TEXT = "ABC123";
        const NOTIFICATION_TITLE = "Error";

        it("calls notification with the given text", () => {
            // Setup
            spyOn(PlaygroundUtility, "notification");

            // Call the target object
            PlaygroundUtility.errorNotification(NOTIFICATION_TEXT);

            // Check the expected results
            expect(PlaygroundUtility.notification).toHaveBeenCalledWith(jasmine.stringMatching(NOTIFICATION_TITLE), jasmine.stringMatching(NOTIFICATION_TEXT), jasmine.anything());
        })
    })
})