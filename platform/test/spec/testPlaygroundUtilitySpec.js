/*global describe, it, expect, spyOn, afterEach, beforeEach -- Jasmine globals */
/*global jasmine -- Jasmine object */
/*global $ -- jQuery is externally imported */

import { PlaygroundUtility } from "../../src/PlaygroundUtility";

describe("PlaygroundUtility", () => {

    describe("notification()", () => {
        const NOTIFICATION_TITLE = "ABC123";
        const NOTIFICATION_MESSAGE = "DEF456";

        afterEach(() => {
            $(".notify-message").remove();
        });

        it("displays a message with given title and text", () => {
            PlaygroundUtility.notification(NOTIFICATION_TITLE, NOTIFICATION_MESSAGE);

            const documentMessages = $(".notify-message");
            expect(documentMessages).toHaveSize(1);
            expect(documentMessages.text()).toContain(NOTIFICATION_TITLE);
            expect(documentMessages.text()).toContain(NOTIFICATION_MESSAGE);
        });
    });

    describe("longNotification()", () => {
        const NOTIFICATION_TEXT = "ABC123";
        const NOTIFICATION_MESSAGE = "may take a few seconds to complete";

        it("calls notification() with the long message and prefix", () => {
            spyOn(PlaygroundUtility, "notification");

            PlaygroundUtility.longNotification(NOTIFICATION_TEXT);

            expect(PlaygroundUtility.notification).toHaveBeenCalledWith(
                jasmine.stringMatching(NOTIFICATION_TEXT),
                jasmine.stringMatching(NOTIFICATION_MESSAGE),
                jasmine.anything()
            );
        });
    });

    const notificationVariants = [
        {
            method: "successNotification",
            title: "Success",
            message: "Success message",
            cls: "light"
        },
        {
            method: "errorNotification",
            title: "Error",
            message: "Something went wrong",
            cls: "bg-red fg-white",
            alsoExpectConsoleError: true
        },
        {
            method: "warningNotification",
            title: "Warning",
            message: "This is a warning",
            cls: "bg-orange fg-white"
        }
    ];

    notificationVariants.forEach(({ method, title, message, cls, alsoExpectConsoleError }) => {
        describe(`${method}()`, () => {
            it(`calls notification with title "${title}" and correct class`, () => {
                spyOn(PlaygroundUtility, "notification");

                if (alsoExpectConsoleError) {
                    spyOn(console, "error");
                }

                PlaygroundUtility[method](message);

                if (alsoExpectConsoleError) {
                    expect(console.error).toHaveBeenCalledWith(`ERROR: ${message}`);
                }

                expect(PlaygroundUtility.notification).toHaveBeenCalledWith(
                    jasmine.stringMatching(title),
                    jasmine.stringMatching(message),
                    cls
                );
            });
        });
    });

    describe("showLogin() and hideLogin()", () => {
        const elementId = "login";

        beforeEach(() => {
            const el = document.createElement("div");
            el.id = elementId;
            el.style.display = "none";
            document.body.appendChild(el);
        });

        afterEach(() => {
            document.getElementById(elementId)?.remove();
        });

        it("shows the login element", () => {
            PlaygroundUtility.showLogin();
            const el = document.getElementById(elementId);
            expect(el.style.display).toBe("block");
        });

        it("hides the login element", () => {
            PlaygroundUtility.hideLogin();
            const el = document.getElementById(elementId);
            expect(el.style.display).toBe("none");
        });
    });

    describe("setFeedbackButtonUrl()", () => {
        const elementId = "feedback-url";
        const testUrl = "https://example.com/feedback";

        beforeEach(() => {
            const el = document.createElement("a");
            el.id = elementId;
            document.body.appendChild(el);
        });

        afterEach(() => {
            document.getElementById(elementId)?.remove();
        });

        it("sets the href of the feedback button", () => {
            PlaygroundUtility.setFeedbackButtonUrl(testUrl);
            const el = document.getElementById(elementId);
            expect(el.href).toBe(testUrl);
        });
    });

    describe("showMenu()", () => {
        const elementId = "navview";

        beforeEach(() => {
            const el = document.createElement("div");
            el.id = elementId;
            el.style.display = "none";
            document.body.appendChild(el);
        });

        afterEach(() => {
            document.getElementById(elementId)?.remove();
        });

        it("sets navview display to block", () => {
            PlaygroundUtility.showMenu();
            const el = document.getElementById(elementId);
            expect(el.style.display).toBe("block");
        });
    });

    describe("showFeedbackButton()", () => {
        const elementId = "feedback-button";

        beforeEach(() => {
            const el = document.createElement("div");
            el.id = elementId;
            el.style.display = "none";
            document.body.appendChild(el);
        });

        afterEach(() => {
            document.getElementById(elementId)?.remove();
        });

        it("sets feedback button display to block", () => {
            PlaygroundUtility.showFeedbackButton();
            const el = document.getElementById(elementId);
            expect(el.style.display).toBe("block");
        });
    });

});
