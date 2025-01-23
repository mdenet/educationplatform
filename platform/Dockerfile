# syntax=docker/dockerfile:1

FROM node:19-bullseye AS epbundle

# Create mdenet-ep directory
WORKDIR /usr/src/mdenet-ep

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

COPY platform/ ./platform/

# Refer to readme.md for a complete list of supported environment varibles
ARG TOKEN_SERVER_URL
ARG ES_WS_ADDRESS

RUN npm ci --workspace=platform\
        && npm run build --workspace=platform --\
            --env tokenServerUrl=${TOKEN_SERVER_URL}\
            --env feedbackSurveyUrl=${FEEDBACK_SURVEY_URL}\
            --env websocketsUri=${ES_WS_ADDRESS}\
        && npm run package --workspace=platform


FROM nginx:1.23

WORKDIR /usr/share/nginx/html

COPY --from=epbundle /usr/src/mdenet-ep/platform/dist/. .

RUN chmod -R 755 .








