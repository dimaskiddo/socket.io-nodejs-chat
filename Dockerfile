FROM dimaskiddo/alpine:nodejs-8.9.3
MAINTAINER Dimas Restu Hidayanto <dimas.restu@student.upi.edu>

WORKDIR /usr/src/app

COPY . .
RUN npm i -g npm \
    && npm i --production

EXPOSE 3000

CMD ["npm","start"]
