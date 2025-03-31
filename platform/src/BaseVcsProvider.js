/**
 * BaseVCSProvider class for handling version control system (VCS) interactions.
 * This class provides a common interface and utility methods for different VCS providers.
 * It is intended to be extended by specific provider classes (e.g., GitHub, GitLab).
 */
class BaseVcsProvider {

    /**
     * @param {String} name - A unique name for the provider (e.g. 'mdenet-auth/github')
     * @param {String} tokenHandlerUrl - Base URL for token server requests.
     */
    constructor(name, tokenHandlerUrl) {
        this.name = name;
        this.tokenHandlerUrl = tokenHandlerUrl;
    }

    /**
     * Default implementation: splits the URL path into {owner, repo, ref, path}
     */
    parseFileUrl(fileUrl) {
        const url = new URL(fileUrl);
        const segments = url.pathname.split('/').filter(Boolean);
        // Assumes the default format: [owner, repo, ref, ...filePath]
        return {
            owner: segments[0],
            repo: segments[1],
            ref: segments[2],
            path: segments.slice(3).join('/')
        };
    }

    /**
     * Construct a complete request URL from a route.
     * @param {String} route - The specific route for the request.
     * @returns a URL object with the constructed URL.
     */
    constructRequestUrl(route) {
        const url = new URL(`${this.tokenHandlerUrl}/${this.name}/${route}`);
        return url;
    }

    /**
     * Build a complete request URL from a route and parameters.
     * @param {URL} requestUrl - The URL to which parameters will be added.
     * @param {Object} params - An object containing query parameters.
     * @returns the updated URL object with query parameters appended.
     */
    addQueryParamsToRequestUrl(requestUrl, params) {
        const requestUrl = new URL(requestUrl);
        for (const key in params) {
            requestUrl.searchParams.append(key, params[key]);
        }
        return requestUrl;
    }

    // These methods should be overridden by concrete provider classes.
    getFileRequestUrl(fileUrl) {
        throw new Error("getFileRequest() must be overridden in a subclass.");
    }
    getBranchesRequestUrl(activityUrl) {
        throw new Error("getBranchesRequest() must be overridden in a subclass.");
    }
    getCompareBranchesRequestUrl(activityUrl, branchToCompare) {
        throw new Error("getCompareBranchesRequestUrl() must be overridden in a subclass.");
    }
    createPullRequestLink(activityUrl, baseBranch, headBranch) {
        throw new Error("createPullRequestLink() must be overridden in a subclass.");
    }
    storeFilesRequest(activityUrl, files, message, overrideBranch) {
        throw new Error("storeFilesRequest() must be overridden in a subclass.");
    }
    createBranchRequest(activityUrl, newBranch) {
        throw new Error("createBranchRequest() must be overridden in a subclass.");
    }
    mergeBranchesRequest(activityUrl, branchToMergeFrom, mergeType) {
        throw new Error("mergeBranchesRequest() must be overridden in a subclass.");
    }
}