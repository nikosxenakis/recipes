FROM node:24.0-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn build:prod

FROM nginx:stable-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
