
export class OAuthException extends Error {
    statusCode = 500
    code = 'server_error'
    logInfo = ''
}