/*global describe, it, expect, beforeEach, afterEach, spyOn, jasmine */

import {
    arrayEquals,
    jsonRequest,
    jsonRequestConversion,
    getRequest,
    urlParamPrivateRepo,
    getActivityURL,
    getCurrentBranch,
    validateBranchName,
    setAuthenticated,
    isAuthenticated,
    authenticatedDecorator,
    parseConfigFile,
    getWindowLocationSearch,
    getWindowLocationHref,
    setWindowLocationHref,
    getBaseURL,
    base64ToBytes,
    bytesToBase64
} from "../../src/Utility";

import { JSON_ACTIVITY_CONFIG, YML_ACTIVITY_CONFIG, INVALID_FILE } from "../resources/exampleActivityConfigs";

function mockXHR(responseBody = {}, status = 200) {
    const xhrMock = {
        open: jasmine.createSpy(),
        setRequestHeader: jasmine.createSpy(),
        send: function () {
            if (status >= 200 && status < 300) {
                this.status = status;
                this.response = JSON.stringify(responseBody);
                this.onload();
            } else {
                this.status = status;
                this.statusText = "Error";
                this.onerror();
            }
        },
        withCredentials: false
    };
    spyOn(window, "XMLHttpRequest").and.returnValue(xhrMock);
}

describe("Utility", () => {

    describe("arrayEquals", () => {
        it("returns true for matching arrays", () => {
            expect(arrayEquals(["A", "B"], ["A", "B"], true)).toBeTrue();
        });

        it("returns false for arrays with different order", () => {
            expect(arrayEquals(["A", "B"], ["B", "A"], true)).toBeFalse();
        });

        it("supports '*' wildcard when enabled", () => {
            expect(arrayEquals(["A", "*", "C"], ["A", "X", "C"], true)).toBeTrue();
        });

        it("does not support '*' wildcard when not enabled", () => {
            expect(arrayEquals(["A", "*", "C"], ["A", "X", "C"])).toBeFalse();
        });
    });

    describe("jsonRequest", () => {
        it("makes a POST request and resolves on success", async () => {
            mockXHR({ data: "ok" });
            await expectAsync(jsonRequest("/api", "{}"))
                .toBeResolvedTo(JSON.stringify({ data: "ok" }));
        });

        it("rejects on non-2xx response", async () => {
            mockXHR({}, 400);
            await expectAsync(jsonRequest("/fail", "{}"))
                .toBeRejectedWith(jasmine.objectContaining({ status: 400 }));
        });
    });

    describe("jsonRequestConversion", () => {
        it("resolves to formatted parameter object", async () => {
            mockXHR({ output: "data123" });
            const result = await jsonRequestConversion("/convert", "{}", "param");
            expect(result).toEqual({ name: "param", data: "data123" });
        });

        it("rejects if status is not 2xx", async () => {
            mockXHR({}, 500);
            await expectAsync(jsonRequestConversion("/fail", "{}", "param"))
                .toBeRejectedWith(jasmine.objectContaining({ status: 500 }));
        });
    });

    describe("getRequest", () => {
        it("makes a GET request and resolves on success", async () => {
            mockXHR("response ok");
            await expectAsync(getRequest("/url")).toBeResolvedTo(JSON.stringify("response ok"));
        });

        it("rejects on network error", async () => {
            const xhrMock = {
                open: jasmine.createSpy(),
                send: function () { this.onerror(); },
                withCredentials: false
            };
            spyOn(window, "XMLHttpRequest").and.returnValue(xhrMock);
            await expectAsync(getRequest("/fail")).toBeRejected();
        });
    });

    describe("urlParamPrivateRepo", () => {
        it("returns true when privaterepo=true", () => {
            expect(urlParamPrivateRepo({ search: "?privaterepo=true" })).toBeTrue();
        });

        it("returns false when privaterepo=false", () => {
            expect(urlParamPrivateRepo({ search: "?privaterepo=false" })).toBeFalse();
        });

        it("returns false when the privaterepo parameter is not present", () => {
            expect(urlParamPrivateRepo({ search: "?other=value" })).toBeFalse();
        });
    });

    describe("getActivityURL", () => {
        it("returns the 'activities' URL param", () => {
            expect(getActivityURL({ search: "?activities=https://foo.com" }))
                .toBe("https://foo.com");
        });

        it("returns null if activities parameter is not present", () => {
            expect(getActivityURL({ search: "" })).toBeNull();
        });
    });

    describe("getCurrentBranch", () => {
        it("extracts branch name from the activity URL", () => {
            const mockContext = {
                getActivityURL: () => "https://github.com/org/repo/feature-branch"
            };
    
            const result = getCurrentBranch.call(mockContext);
            expect(result).toBe("feature-branch");
        });
    
        it("returns null if branch is not found", () => {
            const mockContext = {
                getActivityURL: () => "https://github.com/org/repo/"
            };
    
            const result = getCurrentBranch.call(mockContext);
            expect(result).toBeNull();
        });
    });

    describe("validateBranchName", () => {
        it("returns true for valid branch names", () => {
            expect(validateBranchName("feature-123"))
                .toBeTrue();
        });

        it("returns false for branch names with special characters", () => {
            expect(validateBranchName("branch name"))
                .toBeFalse();
        });
    });

    describe("Authentication utils", () => {
        it("setAuthenticated and isAuthenticated works", () => {
            setAuthenticated(true);
            expect(isAuthenticated()).toBeTrue();

            setAuthenticated(false);
            expect(isAuthenticated()).toBeFalse();
        });

        it("authenticatedDecorator throws if not authenticated", () => {
            const obj = {
                run: () => "ran"
            };
            setAuthenticated(false);
            authenticatedDecorator(obj, "run");
            expect(() => obj.run()).toThrow();
        });
    });

    describe("parseConfigFile", () => {
        it("parses json file correctly", () => {
            const parsed = parseConfigFile(JSON_ACTIVITY_CONFIG, "json");
            expect(parsed).toBeInstanceOf(Object);
        });

        it("parses yaml file correctly", () => {
            const parsed = parseConfigFile(YML_ACTIVITY_CONFIG, "yml");
            expect(parsed).toBeInstanceOf(Object);
        });

        it("returns error for invalid yaml", () => {
            const result = parseConfigFile(INVALID_FILE, "yml");
            expect(result).toBeInstanceOf(Error);
        });

        it("returns null for unknown filetype", () => {
            expect(parseConfigFile("{}", "toml")).toBeNull();
        });
    });

    describe("window location helpers", () => {
        it("getWindowLocationSearch returns window.location.search", () => {
            expect(getWindowLocationSearch({ search: "?test=1" })).toBe("?test=1");
        });

        it("getWindowLocationHref returns href", () => {
            expect(getWindowLocationHref({ href: "http://test" })).toBe("http://test");
        });

        it("getBaseURL returns origin", () => {
            expect(getBaseURL({ origin: "http://base" })).toBe("http://base");
        });
    });

    describe("setWindowLocationHref", () => {
        it("changes the location.href", () => {
            const mockLocation = { href: "http://original.com" };
            setWindowLocationHref("http://new.com", mockLocation);
            expect(mockLocation.href).toBe("http://new.com");
        });
    });

    describe("base64 conversion", () => {
        it("converts string to base64 and back", () => {
            const str = "hello world";
            const encoded = bytesToBase64(new TextEncoder().encode(str));
            const decoded = new TextDecoder().decode(base64ToBytes(encoded));
            expect(decoded).toBe(str);
        });
    });
});
