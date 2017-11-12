FROM node:6.11.0

COPY app /app

COPY package.json /app/package.json

WORKDIR /app

RUN npm install

EXPOSE 3001

CMD node index.js
