FROM node:16-alpine

ADD ./ /app
WORKDIR /app
RUN yarn install

CMD yarn start:prodbot
