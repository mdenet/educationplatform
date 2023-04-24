#! /bin/bash

npm run build --workspaces

gnome-terminal -- /bin/sh -c 'npm run start --workspace=tokenserver'

npm run start --workspace=platform

