# MDENet Education Platform
The MDENet education platfom aims to allow users to quickly start learning fundamental Model Driven Engineering techniques  via a web browser.

The prototype platform is based on the Epsilon [Playground](https://www.eclipse.org/epsilon/playground/) and is fork of

[github.com/eclipse/epsilon-website/tree/master/playground](https://github.com/eclipse/epsilon-website/tree/master/playground).


## Running the Platform

Prerequisites:
- [Node.js](https://nodejs.org/) 
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install) 


To start the prototype platform, in the root project directory run the `launch.sh` script or run the following commands.

```
npm run build --workspaces

npm run start --workspace=tokenserver

npm run start --workspace=platform
```

This starts four web servers 
 1.  the main platform [http://127.0.0.1:8080](http://127.0.0.1:8080)
 2.  the tools configuration [http://127.0.0.1:8081](http://127.0.0.1:8081)
 3.  the activities configuration [http://127.0.0.1:8082](http://127.0.0.1:8082)
 4.  the token server for github authentication [http://127.0.0.1:10000](http://127.0.0.1:10000) 


### Specifying the activities
The activities configuration file specifies the platform activities to load and must be provided using the `activities` url parameter.

> http://127.0.0.1:8081?activities=[url-to-activity-config]

An example of an activity file for  Epsilon tasks provided for testing [http://127.0.0.1:8080/?activities=http://127.0.0.1:8082/epsilon-example/epsilon-example_activity.json](http://127.0.0.1:8080/?activities=http://127.0.0.1:8082/epsilon-example/epsilon-example_activity.json)

The default test configurations provided by the activities server
- consoles/consoles_activity.json - Only console panels
- epsilon-etl/epsilon-etl_activity.json - Epsilon ETL example
- epsilon-example/epsilon-example_activity.json - Epsilon EOL, EVL, and ETL


### External tool functions

For activities that use backend tool functions the corresponding tool server must be available to process the requests. For the provided Epsilon examples this is expected to be running [http://127.0.0.1:9000](http://127.0.0.1:9000).

The Epsilon backend docker services can be found [here](https://github.com/epsilonlabs/playground-docker).
