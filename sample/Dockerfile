FROM node:18-alpine

RUN apk add git 

WORKDIR /usr/app
COPY ./package.json ./package-lock.json  /usr/app/
  
RUN npm install 

COPY ./ /usr/app/
EXPOSE 3000
VOLUME ["/srv"]
CMD ["npm", "run", "start"]