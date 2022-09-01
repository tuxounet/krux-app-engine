FROM node:18-alpine

RUN apk add git 

WORKDIR /usr/app
COPY ./package.json /usr/app/package.json
  
RUN npm install 

COPY ./ /usr/app/

CMD ["npm", "run", "start"]