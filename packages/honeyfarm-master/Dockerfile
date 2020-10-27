FROM node:10

COPY . /workspace
WORKDIR /workspace

ENV NODE_ENV "proudction"

RUN yarn
RUN yarn build

CMD [ "yarn", "start" ]