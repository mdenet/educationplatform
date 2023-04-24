#!/bin/sh

npm run build

docker compose up --build --force-recreate
