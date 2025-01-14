# MDENet Education Platform
The MDENet education platfom aims to allow users to quickly start learning fundamental Model Driven Engineering techniques  via a web browser.

The prototype platform is based on the Epsilon [Playground](https://www.eclipse.org/epsilon/playground/) and is fork of

[github.com/eclipse/epsilon-website/tree/master/playground](https://github.com/eclipse/epsilon-website/tree/master/playground).


## Running the Platform

> Note for trying out the education platform there is a [dockerised version](https://github.com/mdenet/educationplatform-docker) that provides a complete configuration including tool services. This repository contains only the the platform and token server components. Additional tool services and activities are required for a fully functioning demo.

Prerequisites:
- [Node.js](https://nodejs.org/) 
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install) 

When using Windows, the following dependencies must be installed globally so they are available on the command line.
```
npm install -g typescript
npm install -g tsc
npm install -g webpack
npm install -g karma-cli
```


To start the platform and token server components, in the root project directory run the `launch.sh` script or run the following commands.

```
npm run build --workspaces

npm run start --workspace=tokenserver

npm run start --workspace=platform
```

This starts two web servers:
 1.  the main platform [http://127.0.0.1:8080](http://127.0.0.1:8080)
 2.  the token server for github authentication [http://127.0.0.1:10000](http://127.0.0.1:10000) 


### Specifying the activities
The activities configuration file specifies the platform activities to load and must be provided using the `activities` url parameter.

> http://127.0.0.1:8080activities=[url-to-activity-config]

An example of an activity file for  Epsilon tasks provided for testing [http://127.0.0.1:8080/?activities=http://127.0.0.1:8082/epsilon-example/epsilon-example_activity.json](http://127.0.0.1:8080/?activities=http://127.0.0.1:8082/epsilon-example/epsilon-example_activity.json)

The default test configurations provided by the activities server
- consoles/consoles_activity.json - Only console panels
- epsilon-etl/epsilon-etl_activity.json - Epsilon ETL example
- epsilon-example/epsilon-example_activity.json - Epsilon EOL, EVL, and ETL


### External tool functions

For activities that use backend tool functions the corresponding tool server must be available to process the requests.

The Epsilon backend docker services for a  fully function configuration can be found [here](https://github.com/epsilonlabs/playground-docker).


### Environment Variables
This section documents the environment variables supported by the platform.

| Name                    | Type | Description | Example | 
| ---                     | ---  | ---         | --- | 
| TOKEN_SERVER_URL       | Url | The url of the token server. Used for GitHub authentication enabling saving and private git repository access.  | https://tokenserver.mde-network.org  |
| FEEDBACK_SURVEY_URL | Url |  The url that is used for the user feedback button.  | https://forms.office.com/?id=X  |
