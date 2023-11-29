# syntax=docker/dockerfile:1

FROM node:19-bullseye AS epbundle

# Create mdenet-ep directory
WORKDIR /usr/src/mdenet-ep

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

COPY . .

ARG TOKEN_SERVER_URL=http://127.0.0.1:10000

RUN npm install && npm run build -- --env tokenServerUrl=${TOKEN_SERVER_URL} && npm run package

FROM nginx:1.23

WORKDIR /usr/share/nginx/html

COPY --from=epbundle /usr/src/mdenet-ep/dist/. .

RUN chmod -R 755 .








