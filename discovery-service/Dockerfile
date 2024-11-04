# syntax=docker/dockerfile:1

FROM node:19-bullseye AS dsbundle

# Create mdenet-ep directory
WORKDIR /usr/src/discovery-service

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

COPY discovery-service/package*.json ./
COPY discovery-service/app.js ./
 
RUN npm install

ENTRYPOINT ["node", "app.js"]