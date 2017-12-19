## Waitlist Backend

### Getting started
- Clone this repo.
- Run `npm install`
- Install auto reload server `npm install -g nodemon`
- To start server run `npm run local`

### Running locally with docker

- To build the docker image locally run `docker build -t waitlist:latest .`
- Run the image with `docker run -p 3001:3001 waitlist:latest`