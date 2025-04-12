// test/helpers/getMockEncryptionKey.js
import crypto from "crypto";

let cachedKey = null;

/**
 * Returns a cached 32-byte AES encryption key for testing.
 * Generates a new one only once.
 * 
 * @returns {Buffer}
 */
export function getMockEncryptionKey() {
    if (!cachedKey) {
        cachedKey = crypto.randomBytes(32); // 32 bytes = 256-bit AES
    }
    return cachedKey;
}
