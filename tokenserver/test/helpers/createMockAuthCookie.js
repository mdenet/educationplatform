import { getEncryptedCookie } from "../../src/lib-curity/cookieEncrypter.ts";
import { getAuthCookieName } from "../../src/config/cookieName.js";
import { getMockEncryptionKey } from "./getMockEncryptionKey.js";
import { config } from "../../src/config/config.js";

/**
 * Generates a valid encrypted authentication cookie for use in controller tests.
 *
 * @param {string} token - The token to encrypt
 * @returns {Object} - An object shaped like `req.cookies` with the encrypted cookie
 */
export function createMockAuthCookie(token) {

    const encryptionKey = getMockEncryptionKey();

    const encrypted = getEncryptedCookie(
        config.cookieOptions,
        token,
        getAuthCookieName,
        encryptionKey
    );

    return {
        [getAuthCookieName]: encrypted
    };
}
