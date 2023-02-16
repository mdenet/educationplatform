# MDENet Education Platform
The MDENet education platfom aims to allow users to quickly start learning fundamental Model Driven Engineering techniques  via a web browser.

The prototype platform is based on the Epsilon [Playground](https://www.eclipse.org/epsilon/playground/) and is fork of

[github.com/eclipse/epsilon-website/tree/master/playground](https://github.com/eclipse/epsilon-website/tree/master/playground).


## Running the Platform

Prerequisites:
- [Node.js](https://nodejs.org/) 
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/install) 


To start the prototype platform, in the root platform directory run the `launch.sh` script or run the following commands.

```
npm run build

docker compose up --build --force-recreate
```

This starts three web servers 
 1.  the main platform [http://localhost:8080](http://localhost:8080)
 2.  the tools configuration [http://localhost:8081](http://localhost:8081)
 3.  the activities configuration [http://localhost:8082](http://localhost:8082)


### Specifying the activities
The activities configuration file specifies the platform activities to load and must be provided using the `activities` url parameter.

> http://localhost:8081?activities=[url-to-activity-config]

An example of an activity file for  Epsilon tasks provided for testing [http://localhost:8080/?activities=http://localhost:8082/epsilon-example/epsilon-example_activity.json](http://localhost:8080/?activities=http://localhost:8082/epsilon-example/epsilon-example_activity.json)

The default test configurations provided by the activities server
- consoles/consoles_activity.json - Only console panels
- epsilon-etl/epsilon-etl_activity.json - Epsilon ETL example
- epsilon-example/epsilon-example_activity.json - Epsilon EOL, EVL, and ETL


### External tool functions

For activities that use backend tool functions the corresponding tool server must be available to process the requests. For the provided Epsilon examples this is expected to be running [http://localhost:9000](http://localhost:9000).

The Epsilon backend docker services can be found [here](https://github.com/epsilonlabs/playground-docker).
