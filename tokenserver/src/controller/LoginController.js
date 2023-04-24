import * as express from "express";

import {InvalidRequestException} from "../exceptions/InvalidRequestException.js";
import {asyncCatch} from "../middleware/ErrorHandlingMiddleware.js";
import {serialize} from "cookie";
import {getAuthCookieName} from "../cookieName.js";
import {getEncryptedCookie} from "../lib-curity/cookieEncrypter";
import { config } from "../config.js";

const MAX_CODE_LENGTH = 200;  
const MIN_CODE_LENGTH = 10;  
const MAX_STATE_LENGTH = 200;  
const MIN_STATE_LENGTH = 5;  

class LoginController {

   
    
    router = express.Router();

    octokitApp;

    constructor(octokitAppInstance) {
        this.router.post('/url', asyncCatch(this.getAuthUrl));
        this.router.post('/token', asyncCatch(this.createToken));

        this.octokitApp = octokitAppInstance;
    }

    getAuthUrl = async (req, res) => {
        try {
            //TODO validate request url

            let userData= await this.octokitApp.getWebFlowAuthorizationUrl(
                {redirectUrl: req.body.url}
            );

            res.status(200).json(userData);
        } catch (err) {
            next(err);
        }

    }

    createToken = async (req, res, next) => {
        try {
            let cookies = [];
            LoginController.validateTokenRequest(req.body)

            let tokenReq = {};
            tokenReq.code = req.body.code;
            tokenReq.state = req.body.state;

            let reply = await this.octokitApp.createToken( tokenReq );


            // Create cookie
            cookies.push( getEncryptedCookie(config.cookieOptions, reply.authentication.token, getAuthCookieName, config.encKey ) );

            res.set('Set-Cookie', cookies);

            let responseBody = { isLoggedIn: true }
            

            res.status(200).json(responseBody);

        } catch (err) {
            next(err);
        }
    } 



    static validateTokenRequest(reqBody){

        if( reqBody.code==null || reqBody.state==null ){
            throw new InvalidRequestException();
        
        }else if( reqBody.code.length < MIN_CODE_LENGTH || reqBody.code.length > MAX_CODE_LENGTH  ){
            throw new InvalidRequestException();

        }else if( reqBody.state.length < MIN_STATE_LENGTH || reqBody.state.length > MAX_STATE_LENGTH ){
            throw new InvalidRequestException();
        }
    }

}

export { LoginController };