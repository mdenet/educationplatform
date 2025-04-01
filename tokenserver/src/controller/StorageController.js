import * as express from "express";

import {InvalidRequestException} from "../exceptions/InvalidRequestException.js";
import { GitHubException } from "../exceptions/GitHubException.js";
import {asyncCatch} from "../middleware/ErrorHandlingMiddleware.js";
import {getAuthCookieName} from "../cookieName.js";
import {decryptCookie} from "../lib-curity/cookieEncrypter";
import { config } from "../config.js";

import {Octokit} from "octokit";

class StorageController { 

    router = express.Router();

    constructor() {
        this.router.get('/file', asyncCatch(this.getFile));
        this.router.get('/branches', asyncCatch(this.getBranches));
        this.router.get('/compare-branches', asyncCatch(this.compareBranches));

        this.router.post('/store', asyncCatch(this.storeFiles));
        this.router.post('/create-branch', asyncCatch(this.createBranch));
        this.router.post('/merge-branches', asyncCatch(this.mergeBranches));
    }

    getFile = async (req, res) => { 

        const encryptedAuthCookie = req.cookies[getAuthCookieName];
        const octokit = this.initOctokit(encryptedAuthCookie);

        const { owner, repo, ref: currentBranch, path } = req.query;

        if (!owner || !repo || !currentBranch || !path) {
            throw new InvalidRequestException();
        }
        
        try {
            const repoData = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}?ref={branch}', {
                owner,
                repo,
                path,
                branch: currentBranch,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });

            res.status(200).json(repoData);
        }
        catch (error) {
            console.error("Error while fetching file:", error);
            throw new GitHubException(error.status);
        }
    }

    createBranch = async (req, res) => {
        const encryptedAuthCookie = req.cookies[getAuthCookieName];
        const octokit = this.initOctokit(encryptedAuthCookie);

        const { owner, repo, ref: currentBranch, newBranch } = req.body;

        if (!owner || !repo || !currentBranch || !newBranch) {
            throw new InvalidRequestException();
        }

        try {
            // Get the latest commit SHA from the current branch
            const { data: branchData } = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
                owner,
                repo,
                branch: currentBranch,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });
            const latestCommitSha = branchData.commit.sha;

            // Create a new branch referencing the latest commit SHA
            await octokit.request('POST /repos/{owner}/{repo}/git/refs', {
                owner,
                repo,
                ref: `refs/heads/${newBranch}`,
                sha: latestCommitSha,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });

            res.status(201).json({ success: true });
        }
        catch (error) {
            console.log("we entered catch");
            console.error("Error creating branch:", error);
            throw new GitHubException(error.status);
        }
    }

    compareBranches = async (req, res) => {
        const encryptedAuthCookie = req.cookies[getAuthCookieName];
        const octokit = this.initOctokit(encryptedAuthCookie);

        const { owner, repo, baseBranch, headBranch } = req.query;

        if (!owner || !repo || !baseBranch || !headBranch) {
            throw new InvalidRequestException();
        }

        try {
            const response = await octokit.request('GET /repos/{owner}/{repo}/compare/{base}...{head}', {
                owner: owner,
                repo: repo,
                base: baseBranch,
                head: headBranch,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });
            const comparison = response.data;

            
            /**
             * Optionally filter out bot commits and adjust the comparison status accordingly.
             * Remove this if we want to treat all commits equally.
             */
            // await this.applyBotFiltering(comparison, octokit, owner, repo, baseBranch, headBranch);

            res.status(200).json(comparison);
        }
        catch (error) {
            console.error("Error while comparing branches:", error);
            throw new GitHubException(error.status);
        }
    }

    /**
     * Merges two branches
     * If mergeType is "ahead", performs a fast-forward.
     * If mergeType is "diverged", creates a merge commit and returns updated files.
     * If there are merge conflicts, returns a conflict status.
     */
    mergeBranches = async (req, res) => {

        const encryptedAuthCookie = req.cookies[getAuthCookieName];
        const octokit = this.initOctokit(encryptedAuthCookie);

        const { owner, repo, baseBranch, headBranch, mergeType } = req.body;

        if (!owner || !repo || !baseBranch || !headBranch || !mergeType) {
            throw new InvalidRequestException();
        }

        try {
            if (mergeType == "fast-forward") {
                const updatedFiles = await this.fastForwardBranch(octokit, owner, repo, baseBranch, headBranch);
                return res.status(200).json({ success: true, files: updatedFiles });
            }
            if (mergeType == "merge") {
                const result = await octokit.request('POST /repos/{owner}/{repo}/merges', {
                    owner,
                    repo,
                    base: baseBranch,
                    head: headBranch,
                    commit_message: `Merge branch ${headBranch} into branch ${baseBranch}`,
                    headers: {
                        'X-GitHub-Api-Version': config.githubApiVersion
                    }
                });
    
                const mergeCommitSha = result.data.sha;
                const updatedFiles = await this.getUpdatedFilesFromCommit(octokit, owner, repo, mergeCommitSha);

                return res.status(201).json({ success: true, files: updatedFiles});
            }

            // Unsupported merge type
            res.status(400).json({ success: false, message: "Unsupported merge type" });
        }
        catch (error) {

            if (error.status === 409) {
                // Merge conflict detected
                res.status(200).json({ success: false, conflict: true });
            }
            else {
                console.error("Error while merging branches:", error);
                throw new GitHubException(error.status);
            }
        }
    }

    /**
     * Fast-forwards the base branch to match the head branch.
     * Updates the base reference to point to the head's latest commit.
     * Returns the updated files from the new head.
     *
     * @param {Octokit} octokit - The authenticated Octokit instance
     * @param {string} owner - The repository owner
     * @param {string} repo - The repository name
     * @param {string} baseBranch - The branch to be fast-forwarded
     * @param {string} headBranch - The branch to fast-forward to
     * @returns {Promise<Array<{ path: string, sha: string, content: string }>>}
     */
    fastForwardBranch = async (octokit, owner, repo, baseBranch, headBranch) => {
        const { data: headBranchData } = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
            owner,
            repo,
            branch: headBranch,
            headers: {
                'X-GitHub-Api-Version': config.githubApiVersion
            }
        });
        const latestCommitSha = headBranchData.commit.sha;
        
        await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}', {
            owner,
            repo,
            branch: baseBranch,
            sha: latestCommitSha,
            force: false,
            headers: {
                'X-GitHub-Api-Version': config.githubApiVersion
            }
        });

        return this.getUpdatedFilesFromCommit(octokit, owner, repo, latestCommitSha);
    }

    /**
     * Retrieves the latest files from a given commit.
     * Decodes and returns an array of file objects with their path, SHA, and content.
     *
     * @param {Octokit} octokit - The authenticated Octokit instance
     * @param {string} owner - The repository owner
     * @param {string} repo - The repository name
     * @param {string} commitSha - The commit SHA to retrieve files from
     * @returns {Promise<Array<{ path: string, sha: string, content: string }>>}
     */
    getUpdatedFilesFromCommit = async (octokit, owner, repo, commitSha) => {
        const { data: treeData } = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1', {
            owner,
            repo,
            tree_sha: commitSha,
            headers: {
                'X-GitHub-Api-Version': config.githubApiVersion
            }
        });
    
        const blobFiles = treeData.tree.filter(file => file.type === 'blob');
    
        const updatedFiles = await Promise.all(
            blobFiles.map(async file => {
                const blob = await octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
                    owner,
                    repo,
                    file_sha: file.sha,
                    headers: {
                        'X-GitHub-Api-Version': config.githubApiVersion
                    }
                });
    
                const content = Buffer.from(blob.data.content, 'base64').toString();
    
                return {
                    path: file.path,
                    sha: file.sha,
                    content: content
                };
            })
        );
    
        return updatedFiles;
    };
    
    
    getBranches = async (req, res) => {
        const encryptedAuthCookie = req.cookies[getAuthCookieName];
        const octokit = this.initOctokit(encryptedAuthCookie);

        const { owner, repo } = req.query;

        if (!owner || !repo) {
            throw new InvalidRequestException();
        }

        try {
            // Fetch the list of branches
            const { data: branches } = await octokit.request('GET /repos/{owner}/{repo}/branches', {
                owner,
                repo,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });

            // Extract branch names from the response
            const branchNames = branches.map(branch => branch.name);

            res.status(200).json(branchNames);
        }
        catch (error) {
            console.error("Error while fetching branches:", error);
            throw new GitHubException(error.status);
        }
    }

    storeFiles = async (req, res) => {
        const encryptedAuthCookie = req.cookies[getAuthCookieName];
        const octokit = this.initOctokit(encryptedAuthCookie);
        const { owner, repo, ref: branch, files, message } = req.body;

        if(!owner || !repo || !branch || !files || !Array.isArray(files) || !files.length === 0 || !message) {
            throw new InvalidRequestException();
        }

        try {
            // Get the latest commit SHA from the current branch
            const { data: branchData } = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
                owner,
                repo,
                branch,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });
            const latestCommitSha = branchData.commit.sha;

            // Get the latest commit's tree SHA 
            const { data: commitData } = await octokit.request('GET /repos/{owner}/{repo}/git/commits/{commit_sha}', {
                owner,
                repo,
                commit_sha: latestCommitSha,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });
            const baseTreeSha = commitData.tree.sha;

            // Create a new tree with the updated files
            const { data: treeData } = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
                owner,
                repo,
                base_tree: baseTreeSha,
                tree: files.map(file => ({
                    path: file.path,
                    mode: '100644',
                    type: 'blob',
                    content: file.content
                })),
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });
            const newTreeSha = treeData.sha;

            // Create a new commit with the new tree
            const { data: newCommit } = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
                owner,
                repo,
                message,
                tree: newTreeSha,
                parents: [latestCommitSha],
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });

            // Update the branch reference to point to the new commit
            await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}', {
                owner,
                repo,
                branch,
                sha: newCommit.sha,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });

            // Retrieve the tree to get the updated file SHAs
            const { data: newTreeData } = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1', {
                owner,
                repo,
                tree_sha: newTreeSha,
                headers: { 
                    'X-GitHub-Api-Version': config.githubApiVersion 
                }
            });

            // Match the updated file SHAs
            const updatedFiles = files.map(file => {
                const matchedFile = newTreeData.tree.find(f => f.path === file.path);
                return {
                    path: file.path,
                    sha: matchedFile ? matchedFile.sha : null
                }
            });

            res.status(201).json({
                success: true,
                files: updatedFiles
            });
        }
        catch (error) {
            console.error("Error while storing files:", error);
            throw new GitHubException(error.status);
        }
    }

    initOctokit(authCookie){
        let octokit;

        if (authCookie != null){

            let token = decryptCookie(config.encKey, authCookie);

            octokit = new Octokit({
                auth: token
              })
              
        } 
        else {
            octokit = new Octokit({})
        }

        return octokit;
    }

    /**
     * Filters out bot commits and recalculates branch comparison status based only on human commits.
     * This filtering is **optional** and can be removed if bot commits should be treated as meaningful.
     * @param {object} comparison - The original comparison object
     */
    async applyBotFiltering(comparison, octokit, owner, repo, baseBranch, headBranch) {
        const IGNORED_BOTS = ["github-actions[bot]", "renovate[bot]", "dependabot[bot]"];
    
        // Fetch head branch commits
        const headCommitsResponse = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner,
            repo,
            sha: headBranch,
            per_page: 20,
        });
        const headCommits = headCommitsResponse.data;
        const headHumanCommits = headCommits.filter(
            commit => !IGNORED_BOTS.includes(commit.author?.login)
        );
    
        // Fetch BASE (baseBranch) commits
        const baseCommitsResponse = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner,
            repo,
            sha: baseBranch,
            per_page: 20,
        });
        const baseCommits = baseCommitsResponse.data;
        const baseHumanCommits = baseCommits.filter(
            commit => !IGNORED_BOTS.includes(commit.author?.login)
        );
    
        // Recalculate ahead/behind status based only on human commits
    
        const headHas = new Set(headHumanCommits.map(c => c.sha));
        const baseHas = new Set(baseHumanCommits.map(c => c.sha));
    
        const ahead = [...headHas].filter(sha => !baseHas.has(sha));
        const behind = [...baseHas].filter(sha => !headHas.has(sha));
    
        comparison.ahead_by = ahead.length;
        comparison.behind_by = behind.length;
        comparison.total_commits = ahead.length + behind.length;
        comparison.commits = headHumanCommits;
    
        // Decide the status
        if (ahead.length === 0 && behind.length === 0) {
            comparison.status = "identical";
        } 
        else if (ahead.length > 0 && behind.length === 0) {
            comparison.status = "ahead";
        } 
        else if (ahead.length === 0 && behind.length > 0) {
            comparison.status = "behind";
        } 
        else {
            comparison.status = "diverged";
        }
    }
    

}

export { StorageController };