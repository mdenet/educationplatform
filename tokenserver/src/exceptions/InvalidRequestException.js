import {OAuthException} from './OAuthException.js'

export class InvalidRequestException extends OAuthException {
    statusCode = 400
    code = 'invalid_request'

    constructor() {
        super("Invalid request")
    }
}