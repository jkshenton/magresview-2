FROM node:16-alpine as base

FROM base as prod

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .

# -- either --- #
# use npm start a developement server (slower to start up, but quicker to build the docker image...)
EXPOSE 3000
CMD ["npm", "start"]


# -- or --- #
# # or build optimised version of app and serve that
# #  (this takes about 90s on my machine)
# RUN npm run build
# RUN npm install -g serve

# EXPOSE 3000
# CMD ["serve", "-s", "build"]
