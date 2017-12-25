## Waitlist Backend

### Prerequisites

A working installation of nodejs version 8.

### Getting started
- Clone this repo.
- Run `npm install`
- Install auto reload server `npm install -g nodemon`
- To start server run `npm run local`

### Testing
 We use `mocha` framework for tests. To run tests execute `npm test`.

### Running locally with docker

- To build the docker image locally run `docker build -t waitlist:latest .`
- Run the image with `docker run -p 3001:3001 waitlist:latest`