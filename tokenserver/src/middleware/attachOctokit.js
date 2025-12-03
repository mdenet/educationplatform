import { Octokit } from "octokit";
import { getAuthCookieName } from "../config/cookieName.js";
import { decryptCookie } from "../lib-curity/cookieEncrypter.js";
import { config } from "../config/config.js";

/**
 * Middleware that attaches an authenticated Octokit instance to the request object.
 * 
 * It reads the encrypted GitHub token from the auth cookie, decrypts it,
 * and initializes an Octokit client using that token. If the cookie is missing,
 * it initializes an unauthenticated Octokit instance instead.
 * 
 * The resulting Octokit instance is attached to `req.octokit` for use in downstream controllers.
 * 
 * @param req - The incoming HTTP request
 * @param res - The HTTP response
 * @param next - Function to call the next middleware
 */
const attachOctokit = (req, res, next) => {
    try {
        const encryptedAuthCookie = req.cookies[getAuthCookieName];

        if (encryptedAuthCookie) {
            const token = decryptCookie(config.encKey, encryptedAuthCookie);
            req.octokit = new Octokit({ auth: token });
        } 
        else {
            req.octokit = new Octokit();
        }

        next();
    } 
    catch (error) {
        next(error);
    }
};

export { attachOctokit };
