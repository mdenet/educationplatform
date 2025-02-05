import * as express from "express";

import {InvalidRequestException} from "../exceptions/InvalidRequestException.js";
import { GihubException } from "../exceptions/GithubException.js";
import {asyncCatch} from "../middleware/ErrorHandlingMiddleware.js";
import {getAuthCookieName} from "../cookieName.js";
import {decryptCookie} from "../lib-curity/cookieEncrypter";
import { config } from "../config.js";

import {Octokit} from "octokit";

class StorageController { 

    router = express.Router();

    constructor() {
        this.router.get('/file', asyncCatch(this.getFile));
        this.router.post('/file', asyncCatch(this.storeFile));
        this.router.post('/fork', asyncCatch(this.forkRepository));
    }

    getFile = async (req, res) => { 

        let encryptedAuthCookie = req.cookies[getAuthCookieName];
        let octokit;

        octokit = this.initOctokit(encryptedAuthCookie)
        
        var paramOwner = req.query.owner;
        var paramRepo = req.query.repo;
        var paramBranch = req.query.ref;
        var paramPath = req.query.path;
        
        if ( paramOwner!=null &&  paramRepo!=null && paramPath!=null && paramBranch!=null ) {

            let repoData = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}?ref={ref}', {
                owner: paramOwner,
                repo: paramRepo,
                path: paramPath,
                ref: paramBranch,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });

            res.status(200).json(repoData);

        } else {
            throw new InvalidRequestException();
        }
        

    }

    storeFile = async (req, res) => {
        const encryptedAuthCookie = req.cookies[getAuthCookieName];
        const octokit = this.initOctokit(encryptedAuthCookie);
        const { files, message } = req.body;

        if(!files || !Array.isArray(files) || !files.length === 0 || !message) {
            throw new InvalidRequestException();
        }

        // Extract common properties from the request
        const { owner, repo, ref: branch } = files[0];

        try {
            // Get the latest commit SHA
            const { data: branchData } = await octokit.request('GET /repos/{owner}/{repo}/git/refs/heads/{branch}', {
                owner,
                repo,
                branch,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            });
            const latestCommitSha = branchData.object.sha;

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
            throw new GihubException(error.status);
        }

        // const paramOwner = req.body.owner;
        // const paramRepo = req.body.repo;
        // const paramPath =  req.body.path; 
        // const paramMessage = req.body.message; 
        // const paramContent = req.body.content;
        // const paramBranch = req.body.ref;
        // const paramSha = req.body.sha; // Required when updating a file

        // // Committer - default authenticated user
        // // Author - default authenticated user

        
        // if (paramOwner != null && 
        //     paramRepo != null && 
        //     paramPath != null && 
        //     paramMessage != null && 
        //     paramContent != null && 
        //     paramBranch != null &&
        //     paramSha != null
        // ) {

        //     const request = {
        //         owner: paramOwner,
        //         repo: paramRepo,
        //         path: paramPath,
        //         message: paramMessage,
        //         content: paramContent,
        //         branch: paramBranch,
        //         sha: paramSha,
        //         headers: {
        //             'X-GitHub-Api-Version': config.githubApiVersion
        //         }
        //     }

        //     let repoData = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', request);

        //     if (repoData.status===200 || repoData.status===201) {
        //         res.status(repoData.status).json({
        //             success: true,
        //             data: {
        //                 sha: repoData.data.content.sha
        //             }
        //         });
            
        //     } 
        //     else {
        //         throw new GihubException(repoData.status);
        //     }
            
        // } 
        // else {
        //     throw new InvalidRequestException();
        // }
    }

    forkRepository = async (req, res) => { 

        let encryptedAuthCookie = req.cookies[getAuthCookieName];
        let octokit;

        octokit = this.initOctokit(encryptedAuthCookie)

        var paramOwner = req.body.owner;
        var paramRepo = req.body.repo;
        var paramDefaultOnly = req.body.defaultOnly;
        var paramName =  req.body.name; 
        var paramOrganization = req.body.organization;

        if ( paramOwner!=null &&  paramRepo!=null ) {

            let request = {
                owner: paramOwner,
                repo: paramRepo,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            }

            if (paramOrganization != null){
                request.organization = paramOrganization;
            }

            if (paramDefaultOnly != null) {
                request.default_branch_only =  paramDefaultOnly;
            }

            if (paramName != null) {
                request.name =  paramName;
            }

            let repoData = await octokit.request('POST /repos/{owner}/{repo}/forks', request);

            res.status(200).json(repoData);

        } else {
            throw new InvalidRequestException();
        }
        
    }

    initOctokit(authCookie){
        let octokit;

        if (authCookie != null){

            let token = decryptCookie(config.encKey, authCookie);

            octokit = new Octokit({
                auth: token
              })
              
        } else {
            octokit = new Octokit({
              })
        }

        return octokit ;
    }

}

export { StorageController };