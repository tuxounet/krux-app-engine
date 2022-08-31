FROM node:18-alpine

COPY ./package.json /app/package.json
RUN npm install

COPY ./ /app/

WORKDIR /app

CMD ["npm", "run", "start"]