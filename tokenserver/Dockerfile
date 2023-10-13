# syntax=docker/dockerfile:1

FROM node:18.13-alpine

# Create mdenet-ts directory
WORKDIR /usr/src/mdenet-ts

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
COPY  . .

EXPOSE ${TS_PORT}

CMD ["node", "-r", "dotenv/config", "dist/server.js"]

