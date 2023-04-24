
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

//import {Octokit, App, OAuthApp, createNodeMiddleware } from "octokit";
import * as http from 'http';


import {OAuthApp, createNodeMiddleware} from "@octokit/oauth-app";
import {LoginController} from "./controller/LoginController.js";
import {StorageController} from './controller/StorageController.js';
import {config} from "./config.js";
import {errorHandlingMiddleware} from "./middleware/ErrorHandlingMiddleware.js";


const expressApp = express();


const githubApp = new OAuthApp({
  clientType: "github-app",
  clientId: config.clientId,
  clientSecret: config.clientSecret,
});


expressApp.use('*', express.json());

var corsOptions = {
  origin: config.trustedWebOrigins,
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

expressApp.use(cors(corsOptions));

expressApp.use(cookieParser());

const controllers = { 
  '/login': new LoginController(githubApp),
  '/github': new StorageController()
};


for (const [path, controller] of Object.entries(controllers)) {
  expressApp.use(config.endpointsPrefix + path, controller.router)
}

expressApp.use(errorHandlingMiddleware);



githubApp.on("token", async ({ token, octokit, expiresAt }) => {
  const { data } = await octokit.request("GET /user");
  console.log(`Token retrieved for ${data.login}`);
});


expressApp.listen(config.port, function() {
  console.log(`Auth server is listening on HTTP port ${config.port}`)
})


export { default };
