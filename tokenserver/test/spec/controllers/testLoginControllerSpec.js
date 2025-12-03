import { LoginController } from "../../../src/controllers/LoginController.js";
import { config } from "../../../src/config/config.js";
import { InvalidRequestException } from "../../../src/exceptions/InvalidRequestException.js";
import { createMockAuthCookie } from "../../helpers/createMockAuthCookie.js";
import { getMockEncryptionKey } from "../../helpers/getMockEncryptionKey.js";

describe("LoginController", () => {
    let controller;
    let mockOctokitApp;
    let req, res, next;

    beforeEach(() => {
        mockOctokitApp = {
            getWebFlowAuthorizationUrl: jasmine.createSpy(),
            createToken: jasmine.createSpy()
        };

        controller = new LoginController(mockOctokitApp);

        req = { body: {}, cookies: {} };
        res = {
            status: jasmine.createSpy().and.callFake(function () { return this; }),
            json: jasmine.createSpy(),
            set: jasmine.createSpy()
        };
        next = jasmine.createSpy();

        config.encKey = getMockEncryptionKey();
    });

    describe("getAuthUrl", () => {
        it("should call octokitApp.getWebFlowAuthorizationUrl and respond with data", async () => {
            const mockData = { authUrl: "https://github.com/authorize" };
            mockOctokitApp.getWebFlowAuthorizationUrl.and.returnValue(Promise.resolve(mockData));
            req.body = { url: "http://localhost/callback" };

            await controller.getAuthUrl(req, res, next);

            expect(mockOctokitApp.getWebFlowAuthorizationUrl).toHaveBeenCalledWith({
                redirectUrl: "http://localhost/callback"
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockData);
        });

        it("should call next with error on failure", async () => {
            const error = new Error("fail");
            mockOctokitApp.getWebFlowAuthorizationUrl.and.rejectWith(error);

            await controller.getAuthUrl(req, res, next);
            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("createToken", () => {
        it("should call createToken and return login response with cookie", async () => {
            const mockToken = "abc123";
            const mockReply = { authentication: { token: mockToken } };

            req.body = { code: "validCode123", state: "validState456" };
            mockOctokitApp.createToken.and.returnValue(Promise.resolve(mockReply));

            await controller.createToken(req, res, next);

            expect(mockOctokitApp.createToken).toHaveBeenCalledWith({
                code: "validCode123",
                state: "validState456"
            });
            expect(res.set).toHaveBeenCalledWith("Set-Cookie", jasmine.any(Array));

            const cookieArray = res.set.calls.mostRecent().args[1];
            const cookie = cookieArray[0];
            expect(cookie).toContain("Path=/");
            expect(cookie).toContain("HttpOnly");
            expect(cookie).toContain("SameSite");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ isLoggedIn: true });
        });

        it("should call next with InvalidRequestException on bad input", async () => {
            req.body = { code: "", state: "" };

            await controller.createToken(req, res, next);

            expect(next).toHaveBeenCalledWith(jasmine.any(InvalidRequestException));
        });

        it("should call next with any thrown error", async () => {
            req.body = { code: "validCode123", state: "validState456" };
            const error = new Error("Token error");
            mockOctokitApp.createToken.and.rejectWith(error);

            await controller.createToken(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe("validateAuthCookie", () => {
        it("should return authenticated: false if no cookie", async () => {
            req.cookies = {}; // No auth cookie
            await controller.validateAuthCookie(req, res, next);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ authenticated: false });
        });

        it("should return authenticated: true for valid user response", async () => {
            const token = "valid-token";
            req.cookies = createMockAuthCookie(token);

            req.octokit = {
                request: jasmine.createSpy().and.returnValue(Promise.resolve({
                    data: { login: "testuser" }
                }))
            };

            await controller.validateAuthCookie(req, res, next);

            expect(req.octokit.request).toHaveBeenCalledWith("GET /user");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ authenticated: true });
        });

        it("should return authenticated: false for invalid user data", async () => {
            req.cookies = createMockAuthCookie("valid-token");

            req.octokit = {
                request: jasmine.createSpy().and.returnValue(Promise.resolve({
                     data: {} 
                }))
            };

            await controller.validateAuthCookie(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ authenticated: false });
        });

        it("should call next with error if token check fails", async () => {
            req.cookies = createMockAuthCookie("valid-token");

            req.octokit = {
                request: jasmine.createSpy().and.rejectWith(new Error("GitHub API failed"))
            };

            await controller.validateAuthCookie(req, res, next);
            expect(next).toHaveBeenCalledWith(jasmine.any(Error));
        });
    });

    describe("validateTokenRequest", () => {
        it("should throw if code or state are null", () => {
            expect(() =>
                LoginController.validateTokenRequest({ code: null, state: "abc" })
            ).toThrowError(InvalidRequestException);

            expect(() =>
                LoginController.validateTokenRequest({ code: "abc", state: null })
            ).toThrowError(InvalidRequestException);
        });

        it("should throw if code or state are not strings of correct length", () => {
            expect(() =>
                LoginController.validateTokenRequest({ code: "1", state: "2" })
            ).toThrowError(InvalidRequestException);
        });

        it("should not throw on valid inputs", () => {
            expect(() =>
                LoginController.validateTokenRequest({
                    code: "validCode123", // length 12
                    state: "validState456" // length 13
                })
            ).not.toThrow();
        });
    });
});
