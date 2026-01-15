/*global describe, it, expect, beforeEach, spyOn */
import { GitHubProvider } from "../../src/GitHubProvider";

describe("GitHubProvider", () => {
    let provider;
    const tokenHandlerUrl = "http://test.tokenserver.com";
    const fileUrl_1 = "https://raw.githubusercontent.com/owner/repo/branch/path/to/file1.txt";
    const fileUrl_2 = "https://raw.githubusercontent.com/owner/repo/branch/path/to/file2.txt";
    const fileUrl_3 = "https://raw.githubusercontent.com/owner/repo/branch/path/to/file3.txt";
    const activityUrl = "https://raw.githubusercontent.com/owner/repo/main/path/to/activity";

    beforeEach(() => {
        provider = new GitHubProvider(tokenHandlerUrl);
    });

    describe("constructor", () => {
        it("initializes with correct name and tokenHandlerUrl", () => {
            expect(provider.name).toBe("mdenet-auth/github");
            expect(provider.tokenHandlerUrl).toBe(tokenHandlerUrl);
            expect(provider.supportedHosts).toContain("raw.githubusercontent.com");
        });
    });

    describe("parseFileUrl", () => {
        it("extracts owner, repo, ref, and path from the legacy GitHub raw URL format", () => {
            const url = "https://raw.githubusercontent.com/owner/repo/branch/folder/file.ext";
            const result = provider.parseFileUrl(url);
            expect(result).toEqual({
                owner: "owner",
                repo: "repo",
                ref: "branch",
                path: "folder/file.ext"
            });
        });

        it("extracts owner, repo, ref, and path from the new GitHub raw URL format", () => {
            const url = "https://raw.githubusercontent.com/owner/repo/refs/heads/branch/folder/file.ext";
            const result = provider.parseFileUrl(url);
            expect(result).toEqual({
                owner: "owner",
                repo: "repo",
                ref: "branch",
                path: "folder/file.ext"
            });
        });
    });

    describe("getFileRequestUrl", () => {
        it("constructs file request URL correctly", () => {
            const url = provider.getFileRequestUrl(fileUrl_1);
            expect(url).toContain("file");
            expect(url).toContain("owner=owner");
            expect(url).toContain("repo=repo");
            expect(url).toContain("ref=branch");
            expect(url).toContain("path=path%2Fto%2Ffile1.txt");
        });
    });

    describe("getBranchesRequestUrl", () => {
        it("constructs branches request URL correctly", () => {
            const url = provider.getBranchesRequestUrl(activityUrl);
            expect(url).toContain("branches");
            expect(url).toContain("owner=owner");
            expect(url).toContain("repo=repo");
            expect(url).toContain("ref=main");
        });
    });

    describe("getCompareBranchesRequestUrl", () => {
        it("constructs compare branches request URL correctly", () => {
            const url = provider.getCompareBranchesRequestUrl(activityUrl, "dev");
            expect(url).toContain("compare-branches");
            expect(url).toContain("baseBranch=main");
            expect(url).toContain("headBranch=dev");
        });
    });

    describe("createPullRequestLink", () => {
        it("creates pull request link correctly", () => {
            const link = provider.createPullRequestLink(activityUrl, "main", "dev");
            expect(link).toBe("https://github.com/owner/repo/compare/main...dev");
        });
    });

    describe("storeFilesRequest", () => {
        it("creates store files request correctly with one file", () => {
            const files = [
                { fileUrl: fileUrl_1, newFileContent: "content1" }
            ];
            const result = provider.storeFilesRequest(activityUrl, files, "message", "new-branch");

            expect(result.url).toContain("store");
            expect(result.payload.owner).toBe("owner");
            expect(result.payload.repo).toBe("repo");
            expect(result.payload.ref).toBe("new-branch");
            expect(result.payload.files.length).toBe(1);
            expect(result.payload.files[0]).toEqual({ path: "path/to/file1.txt", content: "content1" });
            expect(result.payload.message).toBe("message");
        });

        it("creates store files request correctly with multiple files", () => {
            const files = [
                { fileUrl: fileUrl_1, newFileContent: "content1" },
                { fileUrl: fileUrl_2, newFileContent: "content2" },
                { fileUrl: fileUrl_3, newFileContent: "content3" }
            ];
            const result = provider.storeFilesRequest(activityUrl, files, "bulk message", "bulk-branch");

            expect(result.payload.files.length).toBe(3);
            expect(result.payload.files[0].path).toBe("path/to/file1.txt");
            expect(result.payload.files[1].path).toBe("path/to/file2.txt");
            expect(result.payload.files[2].path).toBe("path/to/file3.txt");
            expect(result.payload.files[0].content).toBe("content1");
            expect(result.payload.files[1].content).toBe("content2");
            expect(result.payload.files[2].content).toBe("content3");
        });
    });

    describe("createBranchRequest", () => {
        it("creates branch request correctly", () => {
            const result = provider.createBranchRequest(activityUrl, "feature-branch");
            expect(result.url).toContain("create-branch");
            expect(result.payload.newBranch).toBe("feature-branch");
            expect(result.payload.ref).toBe("main");
        });
    });

    describe("mergeBranchesRequest", () => {
        it("creates merge branches request correctly", () => {
            const result = provider.mergeBranchesRequest(activityUrl, "dev", "fast-forward");
            expect(result.url).toContain("merge-branches");
            expect(result.payload.baseBranch).toBe("main");
            expect(result.payload.headBranch).toBe("dev");
            expect(result.payload.mergeType).toBe("fast-forward");
        });
    });

    describe("extractFilePathFromRawURL", () => {
        it("extracts file path from legacy GitHub URL format", () => {
            const legacyUrl = "https://raw.githubusercontent.com/owner/repo/branch/path/to/file.txt";
            const result = provider.extractFilePathFromRawURL(legacyUrl);
            expect(result).toBe("path/to/file.txt");
        });

        it("extracts file path from new GitHub URL format with refs/heads", () => {
            const newUrl = "https://raw.githubusercontent.com/owner/repo/refs/heads/branch/path/to/file.txt";
            const result = provider.extractFilePathFromRawURL(newUrl);
            expect(result).toBe("path/to/file.txt");
        });

        it("extracts file path from nested directory structure", () => {
            const nestedUrl = "https://raw.githubusercontent.com/owner/repo/main/src/components/Button.js";
            const result = provider.extractFilePathFromRawURL(nestedUrl);
            expect(result).toBe("src/components/Button.js");
        });

        it("extracts file path from root level file", () => {
            const rootUrl = "https://raw.githubusercontent.com/owner/repo/main/README.md";
            const result = provider.extractFilePathFromRawURL(rootUrl);
            expect(result).toBe("README.md");
        });

        it("extracts empty string for URL with no file path", () => {
            const emptyPathUrl = "https://raw.githubusercontent.com/owner/repo/main/";
            const result = provider.extractFilePathFromRawURL(emptyPathUrl);
            expect(result).toBe("");
        });
    });

    describe("extractBranchFromActivityURL", () => {
        it("extracts branch from the legacy GitHub raw URL format", () => {
            const legacyUrl = "https://raw.githubusercontent.com/org/repo/main/path/file.json";
            const result = provider.extractBranchFromActivityURL(legacyUrl);
            expect(result).toBe("main");
        });

        it("extracts branch from the new GitHub refs/heads URL format", () => {
            const newUrl = "https://raw.githubusercontent.com/org/repo/refs/heads/feature-branch/path/file.json";
            const result = provider.extractBranchFromActivityURL(newUrl);
            expect(result).toBe("feature-branch");
        });

        it("returns null when no branch can be detected", () => {
            const invalidUrl = "https://raw.githubusercontent.com/org/repo/";
            const result = provider.extractBranchFromActivityURL(invalidUrl);
            expect(result).toBeNull();
        });

        it("handles URLs with minimal path components", () => {
            const minimalUrl = "https://raw.githubusercontent.com/owner/repo/develop";
            const result = provider.extractBranchFromActivityURL(minimalUrl);
            expect(result).toBe("develop");
        });
    });
});
