import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import {OAuthApp} from "@octokit/oauth-app";
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


githubApp.on("token", async () => {
  const today = new Date();
  const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  console.log(`Token successfully retrieved for a user on ${date} ${time}`);
});


expressApp.listen(config.port, function() {
  console.log(`Auth server is listening on HTTP port ${config.port}`)
})
