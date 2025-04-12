import { StorageController } from "../../../src/controllers/StorageController.js";
import { InvalidRequestException } from "../../../src/exceptions/InvalidRequestException.js";
import { GitHubException } from "../../../src/exceptions/GitHubException.js";

describe("StorageController", () => {
    let controller;
    let req, res, next;

    beforeEach(() => {
        controller = new StorageController();
        req = { body: {}, query: {}, cookies: {}, octokit: {} };
        res = {
            status: jasmine.createSpy().and.callFake(function () { return this; }),
            json: jasmine.createSpy()
        };
        next = jasmine.createSpy();
    });

    describe("getFile", () => {
        it("should throw InvalidRequestException for missing input", async () => {
            req.query = { owner: "me", repo: "test" }; // missing path and ref
            await controller.getFile(req, res).catch(err => {
                expect(err instanceof InvalidRequestException).toBeTrue();
            });
        });

        it("should throw GitHubException if octokit fails to fetch file contents", async () => {
            req.query = { owner: "me", repo: "test", path: "README.md", ref: "main" };
            req.octokit.request = jasmine.createSpy().and.callFake(() => {
                const err = new Error("GitHub error");
                err.status = 500;
                throw err;
            });

            await expectAsync(controller.getFile(req, res)).toBeRejectedWith(jasmine.any(GitHubException));
        });

        it("should call octokit request with correct params", async () => {
            req.query = { owner: "me", repo: "test", path: "README.md", ref: "main" };
            req.octokit.request = jasmine.createSpy().and.returnValue(Promise.resolve({ data: { content: "abc" } }));

            await controller.getFile(req, res);

            expect(req.octokit.request).toHaveBeenCalledWith(
                "GET /repos/{owner}/{repo}/contents/{path}?ref={branch}",
                jasmine.objectContaining({
                    owner: "me",
                    repo: "test",
                    path: "README.md",
                    branch: "main",
                    headers: jasmine.any(Object)
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalled();
        });
    });

    describe("getBranches", () => {
        it("should call octokit to retrieve a list of branches", async () => {
            req.query = { owner: "me", repo: "test" };
            req.octokit.request = jasmine.createSpy().and.returnValue(Promise.resolve({ data: [{ name: "branch1" }, { name: "branch2" }] }));

            await controller.getBranches(req, res);

            expect(req.octokit.request).toHaveBeenCalledWith(
                "GET /repos/{owner}/{repo}/branches",
                jasmine.objectContaining({ owner: "me", repo: "test", headers: jasmine.any(Object) })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(["branch1", "branch2"]);
        });
    });

    describe("createBranch", () => {
        it("should throw InvalidRequestException if missing input", async () => {
            req.body = { owner: "me", repo: "test", ref: "main" }; // missing newBranch
            await controller.createBranch(req, res).catch(err => {
                expect(err instanceof InvalidRequestException).toBeTrue();
            });
        });

        it("should throw GitHubException if octokit fails to create new branch", async () => {
            req.body = { owner: "me", repo: "test", ref: "main", newBranch: "feature" };
            req.octokit.request = jasmine.createSpy().and.callFake(() => {
                const err = new Error("GitHub error");
                err.status = 502;
                throw err;
            });

            await expectAsync(controller.createBranch(req, res)).toBeRejectedWith(jasmine.any(GitHubException));
        });

        it("should call octokit request to create new branch", async () => {
            req.body = { owner: "me", repo: "test", ref: "main", newBranch: "dev" };
            req.octokit.request = jasmine.createSpy().and.returnValues(
                Promise.resolve({ data: { commit: { sha: "123abc" } } }),
                Promise.resolve({})
            );

            await controller.createBranch(req, res);

            expect(req.octokit.request.calls.first().args[0]).toBe("GET /repos/{owner}/{repo}/branches/{branch}");
            expect(req.octokit.request.calls.mostRecent().args[0]).toBe("POST /repos/{owner}/{repo}/git/refs");
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true });
        });
    });

    describe("mergeBranches", () => {
        it("should throw InvalidRequestException for missing input", async () => {
            req.body = { owner: "me", repo: "test", baseBranch: "main" }; // missing headBranch and mergeType
            await controller.mergeBranches(req, res).catch(err => {
                expect(err instanceof InvalidRequestException).toBeTrue();
            });
        });

        it("should call octokit request to merge", async () => {
            req.body = { owner: "me", repo: "test", baseBranch: "main", headBranch: "dev", mergeType: "merge" };
            req.octokit.request = jasmine.createSpy().and.returnValues(
                Promise.resolve({ data: { sha: "mergecommitsha" } }),
                Promise.resolve({ data: { tree: [] } })
            );

            await controller.mergeBranches(req, res);

            expect(req.octokit.request).toHaveBeenCalledWith(jasmine.stringMatching("POST /repos/.*/merges"), jasmine.any(Object));
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({ success: true }));
        });

        it("should return conflict status when merge conflict is detected", async () => {
            req.body = {
                owner: "me",
                repo: "test",
                baseBranch: "main",
                headBranch: "feature",
                mergeType: "merge"
            };

            req.octokit.request = jasmine.createSpy().and.callFake(() => {
                const err = new Error("Conflict");
                err.status = 409;
                throw err;
            });

            await controller.mergeBranches(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: false, conflict: true });
        });

        it("should throw GitHubException if octokit fails while merging branches", async () => {
            req.body = {
                owner: "me",
                repo: "test",
                baseBranch: "main",
                headBranch: "feature",
                mergeType: "merge"
            };

            req.octokit.request = jasmine.createSpy().and.callFake(() => {
                const err = new Error("Bad request");
                err.status = 400;
                throw err;
            });

            await expectAsync(controller.mergeBranches(req, res)).toBeRejectedWith(jasmine.any(GitHubException));
        });
    });

    describe("storeFiles", () => {
        it("should throw InvalidRequestException for missing input", async () => {
            req.body = { owner: "me", repo: "test", ref: "main" }; // missing message and files
            await controller.storeFiles(req, res).catch(err => {
                expect(err instanceof InvalidRequestException).toBeTrue();
            });
        });

        it("should throw GitHubException if octokit fails during file storage operations", async () => {
            req.body = {
                owner: "me",
                repo: "test",
                ref: "main",
                message: "commit",
                files: [{ path: "index.js", content: "hi" }]
            };
            req.octokit.request = jasmine.createSpy().and.callFake(() => {
                const err = new Error("GitHub error");
                err.status = 500;
                throw err;
            });

            await expectAsync(controller.storeFiles(req, res)).toBeRejectedWith(jasmine.any(GitHubException));
        });

        it("should send correct requests to update files", async () => {
            req.body = {
                owner: "me",
                repo: "test",
                ref: "main",
                message: "initial commit",
                files: [
                    { path: "index.js", content: "console.log('hi')" },
                    { path: "utils.js", content: "module.exports = {}" }
                ]
            };
            req.body.branch = req.body.ref;

            req.octokit.request = jasmine.createSpy().and.returnValues(
                Promise.resolve({ data: { commit: { sha: "abc123" } } }),
                Promise.resolve({ data: { tree: { sha: "tree123" } } }),
                Promise.resolve({ data: { sha: "newtreesha" } }),
                Promise.resolve({ data: { sha: "commit456" } }),
                Promise.resolve({}),
                Promise.resolve({ data: { tree: [
                    { path: "index.js", sha: "sha1" },
                    { path: "utils.js", sha: "sha2" }
                ] } })
            );

            await controller.storeFiles(req, res);

            expect(req.octokit.request.calls.count()).toBe(6);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(jasmine.objectContaining({ success: true }));
        });
    });

    describe("compareBranches", () => {
        it("should throw InvalidRequestException for missing input", async () => {
            req.query = { owner: "me", repo: "test", baseBranch: "main" }; // missing headBranch
            await controller.compareBranches(req, res).catch(err => {
                expect(err instanceof InvalidRequestException).toBeTrue();
            });
        });

        it("should throw GitHubException if octokit fails to compare branches", async () => {
            req.query = { owner: "me", repo: "test", baseBranch: "main", headBranch: "dev" };
            req.octokit.request = jasmine.createSpy().and.callFake(() => {
                const err = new Error("GitHub failed");
                err.status = 503;
                throw err;
            });

            await expectAsync(controller.compareBranches(req, res)).toBeRejectedWith(jasmine.any(GitHubException));
        });

        it("should call octokit to compare branches and return comparison result", async () => {
            req.query = { owner: "me", repo: "test", baseBranch: "main", headBranch: "dev" };
            const mockComparison = { ahead_by: 3, behind_by: 0, status: "ahead" };

            req.octokit.request = jasmine.createSpy().and.returnValue(
                Promise.resolve({ data: mockComparison })
            );

            await controller.compareBranches(req, res);

            expect(req.octokit.request).toHaveBeenCalledWith(
                "GET /repos/{owner}/{repo}/compare/{base}...{head}",
                jasmine.objectContaining({
                    owner: "me",
                    repo: "test",
                    base: "main",
                    head: "dev",
                    headers: jasmine.any(Object)
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockComparison);
        });
    });

    describe("fastForwardBranch", () => {
        it("should fast forward base branch to head branch and return updated files", async () => {
            const octokit = {
                request: jasmine.createSpy().and.callFake((endpoint) => {
                    if (endpoint === "GET /repos/{owner}/{repo}/branches/{branch}") {
                        return Promise.resolve({ data: { commit: { sha: "newsha123" } } });
                    }
                    if (endpoint === "PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}") {
                        return Promise.resolve();
                    }
                    if (endpoint === "GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1") {
                        return Promise.resolve({ data: { tree: [ { path: "file.txt", sha: "sha1", type: "blob" } ] } });
                    }
                    if (endpoint === "GET /repos/{owner}/{repo}/git/blobs/{file_sha}") {
                        return Promise.resolve({ data: { content: Buffer.from("Hello").toString("base64") } });
                    }
                })
            };

            const updatedFiles = await controller.fastForwardBranch(octokit, "me", "test", "main", "dev");

            expect(octokit.request).toHaveBeenCalledTimes(4);
            expect(updatedFiles).toEqual([
                { path: "file.txt", sha: "sha1", content: "Hello" }
            ]);
        });
    });

    describe("getUpdatedFilesFromCommit", () => {
        it("should retrieve decoded files from a given commit", async () => {
            const octokit = {
                request: jasmine.createSpy().and.callFake((endpoint) => {
                    if (endpoint === "GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1") {
                        return Promise.resolve({ data: { tree: [
                            { path: "file1.txt", sha: "sha1", type: "blob" },
                            { path: "script.js", sha: "sha2", type: "blob" },
                            { path: "folder", sha: "sha3", type: "tree" }
                        ] } });
                    }
                    if (endpoint === "GET /repos/{owner}/{repo}/git/blobs/{file_sha}") {
                        return Promise.resolve({ data: { content: Buffer.from("sample content").toString("base64") } });
                    }
                })
            };

            const result = await controller.getUpdatedFilesFromCommit(octokit, "me", "repo", "commit123");

            expect(result).toEqual([
                { path: "file1.txt", sha: "sha1", content: "sample content" },
                { path: "script.js", sha: "sha2", content: "sample content" }
            ]);
        });
    });
});
