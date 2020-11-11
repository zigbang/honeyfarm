FROM node:10

COPY . /workspace
WORKDIR /workspace

RUN yarn
RUN yarn build
CMD ["yarn", "start"]
