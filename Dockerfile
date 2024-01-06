FROM node:19.4.0-bullseye
RUN apt update
RUN apt-get install -y  --no-install-recommends ffmpeg youtube-dl libsodium-dev


WORKDIR /app

COPY src/ /app/src
COPY package.json tsconfig.json /app/
RUN yarn && yarn run tsc 

CMD ["yarn", "run", "start" ]