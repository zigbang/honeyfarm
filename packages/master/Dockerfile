FROM node:14

COPY . /workspace
WORKDIR /workspace

RUN yarn
RUN yarn build
CMD ["yarn", "start"]
