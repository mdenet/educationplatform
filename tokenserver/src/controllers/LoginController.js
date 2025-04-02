import {InvalidRequestException} from "../exceptions/InvalidRequestException.js";
import {getAuthCookieName} from "../config/cookieName.js";
import {getEncryptedCookie} from "../lib-curity/cookieEncrypter.ts";
import { config } from "../config/config.js";

const MAX_CODE_LENGTH = 200;  
const MIN_CODE_LENGTH = 10;  
const MAX_STATE_LENGTH = 200;  
const MIN_STATE_LENGTH = 5;  

class LoginController {

    constructor(octokitAppInstance) {
        this.octokitApp = octokitAppInstance;
    }

    getAuthUrl = async (req, res, next) => {
        try {
            //TODO validate request url
            
            const { url } = req.body;

            let userData = await this.octokitApp.getWebFlowAuthorizationUrl({
                redirectUrl: url,
            });

            res.status(200).json(userData);
        } 
        catch (err) {
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
            cookies.push(getEncryptedCookie(
                config.cookieOptions, 
                reply.authentication.token, 
                getAuthCookieName, 
                config.encKey
            ));

            res.set('Set-Cookie', cookies);

            res.status(200).json({isLoggedIn: true});

        } 
        catch (err) {
            next(err);
        }
    } 

    validateAuthCookie = async (req, res, next) => {
        try {
            const goodResponse = { authenticated: true };
            const badResponse = { authenticated: false };

            const authCookie = req.cookies[getAuthCookieName];
            if (!authCookie) {
                console.log("No auth cookie found");
                return res.status(200).json(badResponse);
            }

            const octokit = req.octokit; // Use the Octokit instance attached to the request

            // Validate the token by making a simple API call to GitHub
            const { data } = await octokit.request('GET /user');

            // If the data returned is valid, then the token is valid
            if (data && data.login) {
                return res.status(200).json(goodResponse);
            } 
            else {
                console.log("Invalid token");
                return res.status(200).json(badResponse);
            }

        }
        catch (err) {
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