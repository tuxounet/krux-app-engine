FROM node:18-alpine

RUN apk update && apk add git openssh-client

WORKDIR /usr/app
COPY ./package.json ./package-lock.json  /usr/app/
  
RUN npm install 

COPY ./ /usr/app/
EXPOSE 3000
VOLUME ["/srv"]
CMD ["npm", "run", "start"]