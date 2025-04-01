/*global describe, it, expect, spyOn, beforeEach, afterEach -- Jasmine globals */
import { utility } from '../../src/Utility.js';
import { FileHandler } from '../../src/FileHandler';

function createDummyProvider(tokenHandlerUrl) {
    const name = "mdenet-auth/dummy";

    return {
        name,
        tokenHandlerUrl,
        supportedHosts: ["dummy.com"],

        createBranchRequest: jasmine.createSpy().and.callFake((url, newBranch) => {
            const requestUrl = new URL(`${tokenHandlerUrl}/${name}/create-branch`);
            return {
                url: requestUrl.href,
                payload: { owner: "dummy", repo: "dummy", ref: "main", newBranch }
            };
        }),

        getBranchesRequestUrl: jasmine.createSpy().and.callFake((url) => {
            const requestUrl = new URL(`${tokenHandlerUrl}/${name}/branches`);
            return requestUrl.href;
        }),

        getCompareBranchesRequestUrl: jasmine.createSpy().and.callFake((url, branchToCompare) => {
            const requestUrl = new URL(`${tokenHandlerUrl}/${name}/compare-branches`);
            requestUrl.searchParams.append("branch", branchToCompare);
            return requestUrl.href;
        }),

        mergeBranchesRequest: jasmine.createSpy().and.callFake((url, branchToMergeFrom, mergeType) => {
            const requestUrl = new URL(`${tokenHandlerUrl}/${name}/merge-branches`);
            return {
                url: requestUrl.href,
                payload: {
                    owner: "dummy",
                    repo: "dummy",
                    baseBranch: "main",
                    headBranch: branchToMergeFrom,
                    mergeType
                }
            };
        }),

        createPullRequestLink: jasmine.createSpy().and.callFake((url, baseBranch, headBranch) => {
            return `https://dummy.com/pullRequest?base=${baseBranch}&head=${headBranch}`;
        }),

        storeFilesRequest: jasmine.createSpy().and.callFake((url, files, message, overrideBranch) => {
            const requestUrl = new URL(`${tokenHandlerUrl}/${name}/store`);
            return {
                url: requestUrl.href,
                payload: {
                    owner: "dummy",
                    repo: "dummy",
                    ref: overrideBranch || "main",
                    files,
                    message
                }
            };
        })
    };
}

describe("FileHandler", () => {
    let fileHandler;
    let dummyProvider;
    const tokenHandlerUrl = "http://test.tokenserver";

    beforeEach(() => {
        spyOn(utility, 'jsonRequest');
        spyOn(utility, 'getRequest');

        window.sessionStorage.setItem("isAuthenticated", "true");

        fileHandler = new FileHandler(tokenHandlerUrl);
        dummyProvider = createDummyProvider(tokenHandlerUrl);
        fileHandler.providers = [dummyProvider];

        utility.jsonRequest.calls.reset();
        utility.getRequest.calls.reset();
    });

    afterEach(() => {
        window.sessionStorage.removeItem("isAuthenticated");
        fileHandler.providers = [];
    });

    describe("authentication", () => {
        it("should throw an error when not authenticated", () => {
            window.sessionStorage.removeItem("isAuthenticated");

            expect(() => {
                fileHandler.mergeBranches("http://dummy.com/some/repo", "feature", "merge");
            }).toThrowError("Not authenticated to execute mergeBranches");
        });
    });

    describe("findProvider", () => {
        it("should return the provider for a supported host", () => {
            const url = "http://dummy.com/some/path";
            const provider = fileHandler.findProvider(url);
            expect(provider).toBe(dummyProvider);
        });

        it("should throw an error for an unsupported host", () => {
            const url = "http://unsupported.com/some/path";
            expect(() => fileHandler.findProvider(url))
                .toThrowError("Host URL 'unsupported.com' is not supported.");
        });
    });

    describe("fetchBranches", () => {
        it("should fetch branches and return the parsed array", async () => {
            const url = "http://dummy.com/some/repo";
            const expectedUrl = `${tokenHandlerUrl}/mdenet-auth/dummy/branches`;
            dummyProvider.getBranchesRequestUrl.and.returnValue(expectedUrl);

            const branchesArray = ["branch1", "branch2"];
            utility.getRequest.and.returnValue(Promise.resolve(JSON.stringify(branchesArray)));

            const result = await fileHandler.fetchBranches(url);

            expect(dummyProvider.getBranchesRequestUrl).toHaveBeenCalledWith(url);
            expect(result).toEqual(branchesArray);
        });

        it("should throw an error if fetching branches fails", async () => {
            const url = "http://dummy.com/some/repo";
            const expectedUrl = `${tokenHandlerUrl}/mdenet-auth/dummy/branches`;
            dummyProvider.getBranchesRequestUrl.and.returnValue(expectedUrl);

            utility.getRequest.and.returnValue(Promise.reject({ message: "fail" }));

            await expectAsync(fileHandler.fetchBranches(url)).toBeRejectedWith({ message: "fail" });
        });
    });

    describe("createBranch", () => {
        it("should create a branch and return the response", async () => {
            const url = "http://dummy.com/some/repo";
            const newBranch = "feature-branch";
            const expectedUrl = `${tokenHandlerUrl}/mdenet-auth/dummy/create-branch`;

            dummyProvider.createBranchRequest.and.returnValue({
                url: expectedUrl,
                payload: { newBranch }
            });

            const fakeResponse = "branch created";
            utility.jsonRequest.and.returnValue(Promise.resolve(fakeResponse));

            const result = await fileHandler.createBranch(url, newBranch);

            expect(dummyProvider.createBranchRequest).toHaveBeenCalledWith(url, newBranch);
            expect(utility.jsonRequest).toHaveBeenCalledWith(expectedUrl, JSON.stringify({ newBranch }), true);
            expect(result).toEqual(fakeResponse);
        });

        it("should throw an error if creating branch fails", async () => {
            const url = "http://dummy.com/some/repo";
            const newBranch = "feature-branch";
            const expectedUrl = `${tokenHandlerUrl}/mdenet-auth/dummy/create-branch`;

            dummyProvider.createBranchRequest.and.returnValue({
                url: expectedUrl,
                payload: { newBranch }
            });

            utility.jsonRequest.and.returnValue(Promise.reject({ message: "create branch error" }));

            await expectAsync(fileHandler.createBranch(url, newBranch)).toBeRejectedWith({ message: "create branch error" });
        });
    });

    describe("compareBranches", () => {
        it("should compare branches and return the comparison object", async () => {
            const url = "http://dummy.com/some/repo";
            const branchToCompare = "dev";

            const expectedUrlObj = new URL(`${tokenHandlerUrl}/mdenet-auth/dummy/compare-branches`);
            expectedUrlObj.searchParams.append("branch", branchToCompare);

            dummyProvider.getCompareBranchesRequestUrl.and.returnValue(expectedUrlObj.href);

            const comparisonObj = { ahead: 2, behind: 3 };
            utility.getRequest.and.returnValue(Promise.resolve(JSON.stringify(comparisonObj)));

            const result = await fileHandler.compareBranches(url, branchToCompare);

            expect(dummyProvider.getCompareBranchesRequestUrl).toHaveBeenCalledWith(url, branchToCompare);
            expect(result).toEqual(comparisonObj);
        });

        it("should throw an error if comparing branches fails", async () => {
            const url = "http://dummy.com/some/repo";
            const branchToCompare = "dev";

            const expectedUrlObj = new URL(`${tokenHandlerUrl}/mdenet-auth/dummy/compare-branches`);
            expectedUrlObj.searchParams.append("branch", branchToCompare);

            dummyProvider.getCompareBranchesRequestUrl.and.returnValue(expectedUrlObj.href);
            utility.getRequest.and.returnValue(Promise.reject({ message: "compare error" }));

            await expectAsync(fileHandler.compareBranches(url, branchToCompare)).toBeRejectedWith({ message: "compare error" });
        });
    });

    describe("mergeBranches", () => {
        it("should merge branches and return the parsed response", async () => {
            const url = "http://dummy.com/some/repo";
            const branchToMergeFrom = "feature";
            const mergeType = "merge";
            const expectedUrl = `${tokenHandlerUrl}/mdenet-auth/dummy/merge-branches`;

            dummyProvider.mergeBranchesRequest.and.returnValue({
                url: expectedUrl,
                payload: { mergeType }
            });

            const mergeResponse = { merged: true };
            utility.jsonRequest.and.returnValue(Promise.resolve(JSON.stringify(mergeResponse)));

            const result = await fileHandler.mergeBranches(url, branchToMergeFrom, mergeType);

            expect(dummyProvider.mergeBranchesRequest).toHaveBeenCalledWith(url, branchToMergeFrom, mergeType);
            expect(result).toEqual(mergeResponse);
        });

        it("should throw an error if merging branches fails", async () => {
            const url = "http://dummy.com/some/repo";
            const branchToMergeFrom = "feature";
            const mergeType = "merge";
            const expectedUrl = `${tokenHandlerUrl}/mdenet-auth/dummy/merge-branches`;

            dummyProvider.mergeBranchesRequest.and.returnValue({
                url: expectedUrl,
                payload: { mergeType }
            });

            utility.jsonRequest.and.returnValue(Promise.reject({ message: "merge error" }));

            await expectAsync(fileHandler.mergeBranches(url, branchToMergeFrom, mergeType)).toBeRejectedWith({ message: "merge error" });
        });
    });

    describe("getPullRequestLink", () => {
        it("should return a pull request link", () => {
            const url = "http://dummy.com/some/repo";
            const baseBranch = "main";
            const headBranch = "feature";

            const link = fileHandler.getPullRequestLink(url, baseBranch, headBranch);

            expect(dummyProvider.createPullRequestLink).toHaveBeenCalledWith(url, baseBranch, headBranch);
            expect(link).toBe(`https://dummy.com/pullRequest?base=${baseBranch}&head=${headBranch}`);
        });

        it("should throw an error if the provider fails to create a pull request link", () => {
            dummyProvider.createPullRequestLink.and.callFake(() => {
                throw new Error("PR link error");
            });

            const url = "http://dummy.com/some/repo";

            expect(() => fileHandler.getPullRequestLink(url, "main", "feature"))
                .toThrowError("PR link error");
        });
    });

    describe("storeFiles", () => {
        it("should store files and return the response", async () => {
            const url = "http://dummy.com/some/repo";
            const files = [{ fileUrl: "http://dummy.com/path/to/file", newFileContent: "content" }];
            const message = "commit message";
            const overrideBranch = "develop";

            const expectedUrl = `${tokenHandlerUrl}/mdenet-auth/dummy/store`;

            dummyProvider.storeFilesRequest.and.returnValue({
                url: expectedUrl,
                payload: { files, message, ref: overrideBranch }
            });

            const fakeResponse = "files stored";
            utility.jsonRequest.and.returnValue(Promise.resolve(fakeResponse));

            const result = await fileHandler.storeFiles(url, files, message, overrideBranch);

            expect(dummyProvider.storeFilesRequest).toHaveBeenCalledWith(url, files, message, overrideBranch);
            expect(result).toEqual(fakeResponse);
        });

        it("should throw an error if storing files fails", async () => {
            const url = "http://dummy.com/some/repo";
            const files = [{ fileUrl: "http://dummy.com/path/to/file", newFileContent: "content" }];
            const message = "commit message";
            const overrideBranch = "develop";

            const expectedUrl = `${tokenHandlerUrl}/mdenet-auth/dummy/store`;

            dummyProvider.storeFilesRequest.and.returnValue({
                url: expectedUrl,
                payload: { files, message, ref: overrideBranch }
            });

            utility.jsonRequest.and.returnValue(Promise.reject({ message: "store error" }));

            await expectAsync(fileHandler.storeFiles(url, files, message, overrideBranch)).toBeRejectedWith({ message: "store error" });
        });
    });
});
