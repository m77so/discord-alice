FROM alpine:3.12.0

RUN apk add --no-cache ffmpeg nodejs yarn py3-pip
RUN pip3 install youtube-dl
COPY src/ /app/src
COPY package.json tsconfig.json /app/

WORKDIR /app

RUN yarn && yarn run tsc 
RUN ln -s /usr/bin/python3 /usr/bin/python
RUN apk add --no-cache bash

CMD ["yarn", "run", "start" ]