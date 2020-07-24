FROM alpine:3.12.0

RUN apk add --no-cache ffmpeg nodejs yarn py3-pip
RUN pip3 install youtube-dl
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY src/ /app/src
COPY package.json tsconfig.json /app/
RUN yarn && yarn run tsc 
RUN apk add --no-cache bash

CMD ["yarn", "run", "start" ]