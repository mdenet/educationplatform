import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import loginRoutes from './routes/loginRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import { githubApp } from './config/githubApp.js';
import {config} from "./config/config.js";
import {errorHandlingMiddleware} from "./middleware/ErrorHandlingMiddleware.js";


const expressApp = express();

expressApp.use(express.json());

var corsOptions = {
  origin: config.trustedWebOrigins,
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
expressApp.use(cors(corsOptions));

expressApp.use(cookieParser());

// Routes
expressApp.use(config.endpointsPrefix + '/login', loginRoutes);
expressApp.use(config.endpointsPrefix + '/github', storageRoutes);

expressApp.use(errorHandlingMiddleware);

githubApp.on("token", async () => {
  const now = new Date().toISOString();
  console.log(`Token successfully retrieved for a user at ${now}`)
});


expressApp.listen(config.port, function() {
  console.log(`Auth server is listening on HTTP port ${config.port}`)
})
