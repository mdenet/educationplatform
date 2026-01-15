import { OAuthApp } from "@octokit/oauth-app";
import { config } from "./config.js";

/**
 * GitHub-specific OAuth App instance used to handle authentication flows.
 * 
 * Currently this supports only GitHub. In the future, to support alternate
 * version control providers (e.g., GitLab, Bitbucket), this should be refactored
 * into a Strategy Pattern or a factory function that dynamically returns the
 * appropriate VCS provider instance based on configuration or request context.
 */
const githubApp = new OAuthApp({
    clientType: "github-app",
    clientId: config.clientId,
    clientSecret: config.clientSecret,
});

export { githubApp };
