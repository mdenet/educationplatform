import {OAuthException} from './OAuthException.js'

export class GitHubException extends OAuthException {
    statusCode = 400
    code = 'invalid_request'
    githubStatusCode

    constructor(statusCode) {
        super("Invalid request");
        this.githubStatusCode = statusCode;
    }
}