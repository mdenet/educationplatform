/*global describe, it, expect */
import { BaseVcsProvider } from "../../src/BaseVcsProvider";

/**
 * A mock subclass to test abstract BaseVcsProvider behavior
 */
class MockProvider extends BaseVcsProvider {
    getFileRequestUrl() { return "file-url"; }
    getBranchesRequestUrl() { return "branches-url"; }
    getCompareBranchesRequestUrl() { return "compare-url"; }
    createPullRequestLink() { return "pull-request-link"; }
    storeFilesRequest() { return "store-files"; }
    createBranchRequest() { return "create-branch"; }
    mergeBranchesRequest() { return "merge-branches"; }
    forkRepositoryRequest() { return "fork-repo"; }
}

describe("BaseVcsProvider", () => {
    const name = "test-provider";
    const tokenUrl = "https://tokens.example.com";
    let provider;

    beforeEach(() => {
        provider = new MockProvider(name, tokenUrl);
    });

    describe("constructor", () => {
        it("initializes name and tokenHandlerUrl", () => {
            expect(provider.name).toBe(name);
            expect(provider.tokenHandlerUrl).toBe(tokenUrl);
        });
    });

    describe("parseFileUrl", () => {
        it("extracts owner, repo, ref, and path from URL", () => {
            const url = "https://host.com/owner/repo/ref/folder/file.ext";
            const result = provider.parseFileUrl(url);
            expect(result).toEqual({
                owner: "owner",
                repo: "repo",
                ref: "ref",
                path: "folder/file.ext"
            });
        });
    });

    describe("constructRequestUrl", () => {
        it("builds full URL with provider name and route", () => {
            const result = provider.constructRequestUrl("get-token");
            expect(result.href).toBe(`${tokenUrl}/${name}/get-token`);
        });
    });

    describe("addQueryParamsToRequestUrl", () => {
        it("appends parameters to the URL", () => {
            const base = "https://api.com/test";
            const result = provider.addQueryParamsToRequestUrl(base, {
                a: "1",
                b: "2"
            });
            expect(result.href).toBe("https://api.com/test?a=1&b=2");
        });
    });

    describe("abstract methods", () => {
        it("overridden methods return expected mock values", () => {
            expect(provider.getFileRequestUrl()).toBe("file-url");
            expect(provider.getBranchesRequestUrl()).toBe("branches-url");
            expect(provider.getCompareBranchesRequestUrl()).toBe("compare-url");
            expect(provider.createPullRequestLink()).toBe("pull-request-link");
            expect(provider.storeFilesRequest()).toBe("store-files");
            expect(provider.createBranchRequest()).toBe("create-branch");
            expect(provider.mergeBranchesRequest()).toBe("merge-branches");
            expect(provider.forkRepositoryRequest()).toBe("fork-repo");
        });
    });

    describe("abstract methods without implementation throw errors", () => {
        const base = new BaseVcsProvider("x", "x");
        const abstractCalls = [
            () => base.getFileRequestUrl("url"),
            () => base.getBranchesRequestUrl("url"),
            () => base.getCompareBranchesRequestUrl("url", "branch"),
            () => base.createPullRequestLink("url", "main", "dev"),
            () => base.storeFilesRequest("url", [], "msg", false),
            () => base.createBranchRequest("url", "newBranch"),
            () => base.mergeBranchesRequest("url", "branch", "merge"),
            () => base.forkRepositoryRequest("url", true)
        ];

        for (const call of abstractCalls) {
            it("throws if method is not implemented", () => {
                expect(call).toThrow();
            });
        }
    });
});
