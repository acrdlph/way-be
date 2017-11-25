FROM node:6.11.0

COPY app /app

COPY config /config

COPY package.json /app/package.json

RUN npm install --prefix /app

EXPOSE 3001

CMD node app/index.js
