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
        let encryptedAuthCookie = req.cookies[getAuthCookieName];
        let octokit;

        octokit = this.initOctokit(encryptedAuthCookie)

        var paramOwner = req.body.owner;
        var paramRepo = req.body.repo;
        var paramPath =  req.body.path; 
        var paramMessage = req.body.message; 
        var paramContent = req.body.content;

        var paramSha = req.body.sha; // Required when updating a file
        var paramBranch = req.body.branch;

        // Committer - default authenticated user
        // Author - default authenticated user

        if ( paramOwner!=null &&  paramRepo!=null &&  paramPath!=null &&  paramMessage!=null &&  paramContent!=null ) {
            var request = {
                owner: paramOwner,
                repo: paramRepo,
                path: paramPath,
                message: paramMessage,
                content: paramContent,
                headers: {
                    'X-GitHub-Api-Version': config.githubApiVersion
                }
            }

            if(paramSha!=null){
                request.sha = paramSha;
            }

            if(paramBranch!=null){
                request.branch = paramBranch;
            }

            let repoData = await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', request);

            if (repoData.status===200 || repoData.status===201) {
                res.status(repoData.status).json({
                    success: true,
                    data: {
                        sha: repoData.data.content.sha
                    }
                });
            
            } 
            else {
                throw new GihubException(repoData.status);
            }
            
        } else {
            throw new InvalidRequestException();
        }
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