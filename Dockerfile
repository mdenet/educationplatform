FROM node:19-bullseye

# Create mdenet-ep directory
WORKDIR /usr/src/mdenet-ep

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

COPY . .

CMD 
