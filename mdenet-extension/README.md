# MDENet VS Code Extension – User Guide

This guide explains how to set up and run the **MDENet VS Code Extension**, both on desktop and in the browser via [vscode.dev](https://vscode.dev).

---

## Prerequisites

Ensure the following are installed on your machine:

- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## Installing Dependencies

1. Open a terminal.
2. Navigate to the `educationplatform` directory.
3. Run:

   ```bash
   npm install
   ```

This installs all the required Node.js dependencies.

---

## Starting Tool Services

Make sure a `.env` file exists in the [dockerized-version](https://github.com/mdenet/educationplatform-docker) with the following contents for local testing:

```env
TS_PORT=10000
ES_DEPLOY_ADDRESS=http://127.0.0.1:8080/tools/xtext/editors
WEBSOCKETS_URI=ws://127.0.0.1:8080/tools/xtext/services/xtext/ws
TRUSTED_ORIGINS=vscode-file://vscode-app
ES_ADDRESS=http://127.0.0.1:8080/tools/xtext/project
```

Then, start the tool services by running:

```bash
docker compose up --build
```

---

## Running on VS Code Desktop

1. Open the `educationplatform` directory in VS Code as the root workspace.
2. Press `F5` to launch the extension in a new Extension Development Host window.
3. In the new window, open a folder containing an activity.
4. Click on the MDENet icon in the Activity Bar on the left.
5. A list of all `activity.json` files in the root directory will appear.
6. Click on one of the activities to start it.

---

## Running on vscode.dev

The MDENet Extension also supports running in [vscode.dev](https://vscode.dev).

### SSL Setup with mkcert

First, install [`mkcert`](https://github.com/FiloSottile/mkcert) and generate SSL certificates:

```bash
mkdir -p $HOME/certs
cd $HOME/certs
mkcert -install
mkcert localhost
```

This generates `localhost.pem` and `localhost-key.pem`.

### Start HTTPS Server

In the `mdenet-extension` directory, start a local HTTPS server:

```bash
npx serve --cors -l 5000 --ssl-cert $HOME/certs/localhost.pem --ssl-key $HOME/certs/localhost-key.pem
```

### Install Extension on vscode.dev

1. Open [vscode.dev](https://vscode.dev).
2. Run `Developer: Install Extension From Location...` from the Command Palette.
3. Paste the URL shown by the local server (usually `https://localhost:5000`).

The extension will now be available in vscode.dev and usable as long as the server is running.